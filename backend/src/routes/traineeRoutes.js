const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { hashPassword } = require('../utils/auth');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/trainees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, trade_id, batch_id, status } = req.query;

    let sql = `
      SELECT t.*, u.full_name, u.email, u.phone, d.name as department_name,
             b.id as batch_id, b.name as batch_name, p.title as programme_title, tr.name as trade_name
      FROM trainees t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN enrolments e ON t.id = e.trainee_id
      LEFT JOIN batches b ON e.batch_id = b.id
      LEFT JOIN programmes p ON b.programme_id = p.id
      LEFT JOIN trades tr ON p.trade_id = tr.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (u.full_name LIKE ? OR t.registration_no LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (trade_id) {
      sql += ` AND tr.id = ?`;
      params.push(trade_id);
    }
    if (batch_id) {
      sql += ` AND b.id = ?`;
      params.push(batch_id);
    }
    if (status) {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY t.id DESC`;

    const trainees = await db.query(sql, params);
    return res.json({ success: true, data: trainees });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/trainees/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const traineeId = req.params.id;

    const trainee = await db.getOne(
      `SELECT t.*, u.full_name, u.email, u.phone, u.avatar_url, d.name as department_name
       FROM trainees t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN departments d ON t.department_id = d.id
       WHERE t.id = ?`,
      [traineeId]
    );

    if (!trainee) {
      return res.status(404).json({ success: false, error: 'Trainee not found.' });
    }

    // Role check: if student, they can only view their own profile
    if (req.user.role_key === 'trainee' && trainee.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied to other trainee profiles.' });
    }

    // Enrolments
    const enrolments = await db.query(
      `SELECT e.*, b.name as batch_name, b.start_date, b.end_date, p.title as programme_title,
              p.total_training_hours, tr.name as trade_name, tr.category as trade_category
       FROM enrolments e
       JOIN batches b ON e.batch_id = b.id
       JOIN programmes p ON b.programme_id = p.id
       JOIN trades tr ON p.trade_id = tr.id
       WHERE e.trainee_id = ?`,
      [traineeId]
    );

    // Attendance stats
    const attStats = await db.getOne(
      `SELECT 
         COUNT(*) as total_sessions,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_sessions,
         SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_sessions,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_sessions
       FROM attendance WHERE trainee_id = ?`,
      [traineeId]
    );

    // Acquired skills
    const skills = await db.query(
      `SELECT s.name, s.category, ts.proficiency_level, ts.assessed_date
       FROM trainee_skills ts
       JOIN skills s ON ts.skill_id = s.id
       WHERE ts.trainee_id = ?`,
      [traineeId]
    );

    // Assessment scores
    const assessments = await db.query(
      `SELECT a.title, a.assessment_type, a.max_marks, ar.marks_obtained, ar.percentage, ar.result, ar.trainer_remarks
       FROM assessment_results ar
       JOIN assessments a ON ar.assessment_id = a.id
       WHERE ar.trainee_id = ?
       ORDER BY a.id ASC`,
      [traineeId]
    );

    // Mentor feedback
    const mentorFeedback = await db.query(
      `SELECT mf.*, u.full_name as mentor_name, m.designation
       FROM mentor_feedback mf
       JOIN mentors m ON mf.mentor_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE mf.trainee_id = ?
       ORDER BY mf.session_date DESC`,
      [traineeId]
    );

    // Certificates
    const certificates = await db.query(
      `SELECT * FROM certificates WHERE trainee_id = ?`,
      [traineeId]
    );

    return res.json({
      success: true,
      data: {
        trainee,
        enrolments,
        attendanceStats: {
          total: attStats ? attStats.total_sessions : 0,
          present: attStats ? attStats.present_sessions : 0,
          absent: attStats ? attStats.absent_sessions : 0,
          leave: attStats ? attStats.leave_sessions : 0,
          percentage: attStats && attStats.total_sessions > 0
            ? ((attStats.present_sessions / attStats.total_sessions) * 100).toFixed(1)
            : '0.0'
        },
        skills,
        assessments,
        mentorFeedback,
        certificates
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/trainees (Register Trainee)
router.post('/', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  const {
    full_name, email, password, registration_no, dob, gender, blood_group,
    tribal_community, class_grade, department_id, address, district, state,
    guardian_name, guardian_phone, enrollment_date, batch_id
  } = req.body;

  if (!full_name || !email || !registration_no || !dob || !gender || !class_grade) {
    return res.status(400).json({ success: false, error: 'Required demographic fields missing.' });
  }

  try {
    // Check if user exists
    const existing = await db.getOne(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`, [email]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }

    const traineeRole = await db.getOne(`SELECT id FROM roles WHERE role_key = 'trainee'`);
    const defaultPassword = password || 'KISSstudent2026!';
    const passwordHash = await hashPassword(defaultPassword);

    // Create user
    const userRes = await db.query(
      `INSERT INTO users (role_id, email, password_hash, full_name, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [traineeRole.id, email.trim(), passwordHash, full_name.trim(), guardian_phone || null]
    );

    const userId = userRes.insertId;

    // Create trainee
    const traineeRes = await db.query(
      `INSERT INTO trainees (user_id, registration_no, dob, gender, blood_group, tribal_community,
                             class_grade, department_id, address, district, state, guardian_name,
                             guardian_phone, enrollment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, registration_no.trim(), dob, gender, blood_group || null, tribal_community || null,
        class_grade, department_id || 1, address || null, district || 'Bhubaneswar', state || 'Odisha',
        guardian_name || null, guardian_phone || null, enrollment_date || new Date().toISOString().split('T')[0]
      ]
    );

    const traineeId = traineeRes.insertId;

    // Optional batch enrolment
    if (batch_id) {
      await db.query(
        `INSERT INTO enrolments (batch_id, trainee_id, enrolment_date)
         VALUES (?, ?, ?)`,
        [batch_id, traineeId, enrollment_date || new Date().toISOString().split('T')[0]]
      );
    }

    await logAudit(req.user.id, 'REGISTER_TRAINEE', 'trainees', traineeId, { registration_no, full_name }, req);

    return res.status(201).json({
      success: true,
      message: 'Trainee registered successfully.',
      data: { traineeId, userId, registration_no }
    });
  } catch (err) {
    console.error('[Register Trainee Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/trainees/:id
router.put('/:id', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  const traineeId = req.params.id;
  const { full_name, dob, gender, blood_group, tribal_community, class_grade, department_id, address, guardian_name, guardian_phone, status } = req.body;

  try {
    const trainee = await db.getOne(`SELECT user_id FROM trainees WHERE id = ?`, [traineeId]);
    if (!trainee) return res.status(404).json({ success: false, error: 'Trainee not found.' });

    if (full_name) {
      await db.query(`UPDATE users SET full_name = ? WHERE id = ?`, [full_name.trim(), trainee.user_id]);
    }

    await db.query(
      `UPDATE trainees SET
         dob = COALESCE(?, dob),
         gender = COALESCE(?, gender),
         blood_group = COALESCE(?, blood_group),
         tribal_community = COALESCE(?, tribal_community),
         class_grade = COALESCE(?, class_grade),
         department_id = COALESCE(?, department_id),
         address = COALESCE(?, address),
         guardian_name = COALESCE(?, guardian_name),
         guardian_phone = COALESCE(?, guardian_phone),
         status = COALESCE(?, status),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [dob, gender, blood_group, tribal_community, class_grade, department_id, address, guardian_name, guardian_phone, status, traineeId]
    );

    await logAudit(req.user.id, 'UPDATE_TRAINEE', 'trainees', traineeId, req.body, req);
    return res.json({ success: true, message: 'Trainee updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
