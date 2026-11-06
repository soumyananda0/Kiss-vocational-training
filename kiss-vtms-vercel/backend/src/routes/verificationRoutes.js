const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/verify/:identifier (Certificate Number or Verification Hash)
router.get('/:identifier', async (req, res) => {
  const identifier = req.params.identifier.trim();

  try {
    const cert = await db.getOne(
      `SELECT c.certificate_number, c.verification_hash, c.issue_date, c.status, c.certificate_type,
              u.full_name as trainee_name,
              p.title as programme_title,
              tr.name as trade_name,
              b.start_date, b.end_date
       FROM certificates c
       JOIN trainees t ON c.trainee_id = t.id
       JOIN users u ON t.user_id = u.id
       JOIN batches b ON c.batch_id = b.id
       JOIN programmes p ON b.programme_id = p.id
       JOIN trades tr ON p.trade_id = tr.id
       WHERE c.certificate_number = ? OR c.verification_hash = ?`,
      [identifier, identifier]
    );

    if (!cert) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Certificate not found. The specified certificate ID or cryptographic hash is invalid or does not exist.'
      });
    }

    // Zero-PII public verification response payload
    return res.json({
      success: true,
      valid: cert.status === 'valid',
      data: {
        certificateNumber: cert.certificate_number,
        verificationHash: cert.verification_hash,
        traineeName: cert.trainee_name,
        programmeTitle: cert.programme_title,
        tradeName: cert.trade_name,
        trainingPeriod: `${cert.start_date} to ${cert.end_date}`,
        issueDate: cert.issue_date,
        status: cert.status.toUpperCase(),
        institution: 'Kalinga Institute of Social Sciences (KISS) Deemed to be University, Bhubaneswar, Odisha',
        directorate: 'Directorate of Vocational Education & Skill Development',
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Public Verification Error]:', err);
    return res.status(500).json({ success: false, error: 'Internal verification service error.' });
  }
});

module.exports = router;
