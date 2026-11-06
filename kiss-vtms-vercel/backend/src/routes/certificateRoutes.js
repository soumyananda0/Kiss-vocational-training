const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { checkEligibility } = require('../services/eligibilityService');
const { generateOfficialCertificate, generateJourneyPortfolio } = require('../services/pdfService');

// GET /api/certificates/eligibility/:traineeId/:batchId
router.get('/eligibility/:traineeId/:batchId', authenticateToken, async (req, res) => {
  const { traineeId, batchId } = req.params;

  try {
    const result = await checkEligibility(parseInt(traineeId), parseInt(batchId));
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Eligibility Check Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/certificates/pending-approvals
router.get('/pending-approvals', authenticateToken, requireRole(['super_admin', 'coordinator', 'cert_authority']), async (req, res) => {
  try {
    const list = await db.query(
      `SELECT ca.*, t.registration_no, u_student.full_name as trainee_name,
              b.name as batch_name, p.title as programme_title, tr.name as trade_name,
              u_requester.full_name as requester_name
       FROM certificate_approvals ca
       JOIN trainees t ON ca.trainee_id = t.id
       JOIN users u_student ON t.user_id = u_student.id
       JOIN batches b ON ca.batch_id = b.id
       JOIN programmes p ON b.programme_id = p.id
       JOIN trades tr ON p.trade_id = tr.id
       JOIN users u_requester ON ca.requested_by = u_requester.id
       ORDER BY ca.id DESC`
    );
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/certificates/request-approval
router.post('/request-approval', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  const { batch_id, trainee_id } = req.body;
  if (!batch_id || !trainee_id) {
    return res.status(400).json({ success: false, error: 'Batch ID and Trainee ID are required.' });
  }

  try {
    const eligibility = await checkEligibility(parseInt(trainee_id), parseInt(batch_id));
    if (!eligibility.readyForApproval) {
      return res.status(400).json({
        success: false,
        error: 'Trainee has not fulfilled preliminary completion criteria.',
        checklist: eligibility.checklist
      });
    }

    const existing = await db.getOne(
      `SELECT id, status FROM certificate_approvals WHERE batch_id = ? AND trainee_id = ? AND status = 'pending'`,
      [batch_id, trainee_id]
    );
    if (existing) {
      return res.status(400).json({ success: false, error: 'Approval request is already pending review with Certificate Authority.' });
    }

    const result = await db.query(
      `INSERT INTO certificate_approvals (batch_id, trainee_id, requested_by, status, attendance_verified, assessments_verified, trainer_eval_verified, mentor_feedback_verified)
       VALUES (?, ?, ?, 'pending', 1, 1, 1, 1)`,
      [batch_id, trainee_id, req.user.id]
    );

    await logAudit(req.user.id, 'REQUEST_CERTIFICATE_APPROVAL', 'certificate_approvals', result.insertId, { batch_id, trainee_id }, req);
    return res.status(201).json({ success: true, message: 'Approval request submitted to Certificate Authority.', data: { id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/certificates/review-approval (Certificate Authority)
router.post('/review-approval', authenticateToken, requireRole(['super_admin', 'cert_authority']), async (req, res) => {
  const { approval_id, decision, rejection_reason, approval_notes } = req.body;

  if (!approval_id || !['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ success: false, error: 'Valid approval ID and decision ("approved" or "rejected") required.' });
  }

  try {
    const approval = await db.getOne(`SELECT * FROM certificate_approvals WHERE id = ?`, [approval_id]);
    if (!approval) return res.status(404).json({ success: false, error: 'Approval record not found.' });

    if (decision === 'rejected') {
      await db.query(
        `UPDATE certificate_approvals SET
           status = 'rejected',
           authority_id = ?,
           rejection_reason = ?,
           approval_notes = ?,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [req.user.id, rejection_reason || 'Criteria not met', approval_notes || null, approval_id]
      );

      await logAudit(req.user.id, 'REJECT_CERTIFICATE', 'certificate_approvals', approval_id, { rejection_reason }, req);
      return res.json({ success: true, message: 'Certificate request rejected with recorded justification.' });
    }

    // Approved: Update approval record
    await db.query(
      `UPDATE certificate_approvals SET
         status = 'approved',
         authority_id = ?,
         approval_notes = ?,
         approved_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user.id, approval_notes || 'All requirements verified by Certificate Authority', approval_id]
    );

    // Update enrolment status to completed
    await db.query(
      `UPDATE enrolments SET completion_status = 'completed', completion_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE batch_id = ? AND trainee_id = ?`,
      [approval.batch_id, approval.trainee_id]
    );

    // Automatically trigger generation of both documents!
    const certNumber = `KISS-VT-CERT-2026-${String(approval.trainee_id).padStart(4, '0')}`;
    const hash = crypto.createHash('sha256').update(`${certNumber}-${approval.batch_id}-${Date.now()}`).digest('hex');

    const hostUrl = req.headers.origin || 'http://localhost:5173';

    // 1. Generate Official Completion Certificate
    const cert1Res = await generateOfficialCertificate(approval.trainee_id, approval.batch_id, certNumber, hostUrl);
    // 2. Generate Complete Journey Portfolio
    const cert2Res = await generateJourneyPortfolio(approval.trainee_id, approval.batch_id, certNumber, hostUrl);

    const b = await db.getOne(`SELECT programme_id FROM batches WHERE id = ?`, [approval.batch_id]);

    // Save Certificate 1 in DB
    await db.query(
      `INSERT INTO certificates (certificate_number, verification_hash, trainee_id, batch_id, programme_id, certificate_type, issue_date, qr_code_data, file_path, status, issued_by)
       VALUES (?, ?, ?, ?, ?, 'completion_certificate', CURRENT_DATE, ?, ?, 'valid', ?)`,
      [certNumber, hash, approval.trainee_id, approval.batch_id, b.programme_id, `${hostUrl}/verify/${certNumber}`, cert1Res.filePath, req.user.id]
    );

    // Save Certificate 2 (Portfolio) in DB
    const portfolioNumber = `${certNumber}-PORTFOLIO`;
    const portfolioHash = crypto.createHash('sha256').update(`${portfolioNumber}-${Date.now()}`).digest('hex');
    await db.query(
      `INSERT INTO certificates (certificate_number, verification_hash, trainee_id, batch_id, programme_id, certificate_type, issue_date, qr_code_data, file_path, status, issued_by)
       VALUES (?, ?, ?, ?, ?, 'journey_portfolio', CURRENT_DATE, ?, ?, 'valid', ?)`,
      [portfolioNumber, portfolioHash, approval.trainee_id, approval.batch_id, b.programme_id, `${hostUrl}/verify/${certNumber}`, cert2Res.filePath, req.user.id]
    );

    await logAudit(req.user.id, 'APPROVE_AND_GENERATE_CERTIFICATES', 'certificates', certNumber, { certNumber }, req);

    return res.json({
      success: true,
      message: 'Certificate successfully approved and both official documents generated.',
      data: {
        certificateNumber: certNumber,
        portfolioNumber,
        verificationHash: hash
      }
    });
  } catch (err) {
    console.error('[Review Approval Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/certificates/download/:id
router.get('/download/:id', async (req, res) => {
  const certId = req.params.id;
  const isInline = req.query.inline === 'true';

  try {
    // Check if token was provided in header or query
    let currentUser = null;
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      const { verifyToken } = require('../utils/auth');
      const decoded = verifyToken(token);
      if (decoded) {
        currentUser = await db.getOne(
          `SELECT u.id, u.role_id, r.role_key FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
          [decoded.userId]
        );
      }
    }

    // Lookup certificate by ID or certificate_number
    let cert = await db.getOne(
      `SELECT * FROM certificates WHERE id = ? OR certificate_number = ?`,
      [certId, certId]
    );

    // If not found and ends with -PORTFOLIO or doesn't, try alternate matches
    if (!cert && certId.includes('PORTFOLIO')) {
      cert = await db.getOne(
        `SELECT * FROM certificates WHERE certificate_type = 'journey_portfolio' AND (certificate_number LIKE ? OR id = ?)`,
        [`%${certId}%`, parseInt(certId) || 0]
      );
    }

    if (!cert) {
      // Try matching by trainee registration_no or id
      cert = await db.getOne(
        `SELECT c.* FROM certificates c
         JOIN trainees t ON c.trainee_id = t.id
         WHERE (t.id = ? OR t.registration_no = ?)
         ORDER BY c.id ASC LIMIT 1`,
        [certId, certId]
      );
    }

    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certificate record not found in system registry.' });
    }

    // If certificate is valid and published, allow download.
    // If certificate has been revoked or pending, only authorized staff or owner can access it
    if (cert.status !== 'valid') {
      if (!currentUser) {
        return res.status(403).json({ success: false, error: 'This certificate is not currently published.' });
      }
      if (currentUser.role_key === 'trainee') {
        const student = await db.getOne(`SELECT id FROM trainees WHERE user_id = ?`, [currentUser.id]);
        if (!student || student.id !== cert.trainee_id) {
          return res.status(403).json({ success: false, error: 'Access denied to this certificate.' });
        }
      }
    }

    // Regenerate PDF file on disk if missing or damaged
    const hostUrl = req.headers.origin || 'http://localhost:5173';
    if (!cert.file_path || !fs.existsSync(cert.file_path)) {
      if (cert.certificate_type === 'completion_certificate') {
        const gen = await generateOfficialCertificate(cert.trainee_id, cert.batch_id, cert.certificate_number, hostUrl);
        cert.file_path = gen.filePath;
      } else {
        const baseCertNo = cert.certificate_number.replace('-PORTFOLIO', '');
        const gen = await generateJourneyPortfolio(cert.trainee_id, cert.batch_id, baseCertNo, hostUrl);
        cert.file_path = gen.filePath;
      }
      await db.query(`UPDATE certificates SET file_path = ? WHERE id = ?`, [cert.file_path, cert.id]);
    }

    const downloadName = cert.certificate_type === 'completion_certificate'
      ? `KISS_Official_Certificate_${cert.certificate_number}.pdf`
      : `KISS_Trainee_Portfolio_${cert.certificate_number}.pdf`;

    const disposition = isInline ? 'inline' : 'attachment';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${downloadName}"`);
    if (fs.existsSync(cert.file_path)) {
      res.setHeader('Content-Length', fs.statSync(cert.file_path).size);
    }

    const fileStream = fs.createReadStream(cert.file_path);
    fileStream.pipe(res);
  } catch (err) {
    console.error('[Download Certificate Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/certificates/list
router.get('/list', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT c.*, t.registration_no, u.full_name as trainee_name,
             p.title as programme_title, tr.name as trade_name, b.name as batch_name
      FROM certificates c
      JOIN trainees t ON c.trainee_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN batches b ON c.batch_id = b.id
      JOIN programmes p ON c.programme_id = p.id
      JOIN trades tr ON p.trade_id = tr.id
    `;
    const params = [];

    if (req.user.role_key === 'trainee') {
      const tr = await db.getOne(`SELECT id FROM trainees WHERE user_id = ?`, [req.user.id]);
      if (tr) {
        sql += ` WHERE c.trainee_id = ?`;
        params.push(tr.id);
      }
    }

    sql += ` ORDER BY c.id DESC`;
    const certs = await db.query(sql, params);
    return res.json({ success: true, data: certs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
