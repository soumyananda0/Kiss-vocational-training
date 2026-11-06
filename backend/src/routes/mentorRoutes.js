const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/mentor-feedback
router.get('/', authenticateToken, async (req, res) => {
  const { batch_id, trainee_id } = req.query;

  try {
    let sql = `
      SELECT mf.*, u_mentor.full_name as mentor_name, m.designation,
             u_trainee.full_name as trainee_name, t.registration_no,
             b.name as batch_name, p.title as programme_title
      FROM mentor_feedback mf
      JOIN mentors m ON mf.mentor_id = m.id
      JOIN users u_mentor ON m.user_id = u_mentor.id
      JOIN trainees t ON mf.trainee_id = t.id
      JOIN users u_trainee ON t.user_id = u_trainee.id
      JOIN batches b ON mf.batch_id = b.id
      JOIN programmes p ON b.programme_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (batch_id) {
      sql += ` AND mf.batch_id = ?`;
      params.push(batch_id);
    }
    if (trainee_id) {
      sql += ` AND mf.trainee_id = ?`;
      params.push(trainee_id);
    }

    sql += ` ORDER BY mf.session_date DESC`;

    const feedback = await db.query(sql, params);
    return res.json({ success: true, data: feedback });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/mentor-feedback (Record Session)
router.post('/', authenticateToken, requireRole(['super_admin', 'mentor', 'coordinator']), async (req, res) => {
  const { batch_id, trainee_id, session_date, areas_discussed, strengths, improvement_areas, recommendations, overall_observations } = req.body;

  if (!batch_id || !trainee_id || !areas_discussed || !strengths || !recommendations) {
    return res.status(400).json({ success: false, error: 'Required mentoring feedback fields missing.' });
  }

  try {
    // Resolve mentor_id
    let mentorId = null;
    const mentorRecord = await db.getOne(`SELECT id FROM mentors WHERE user_id = ?`, [req.user.id]);
    if (mentorRecord) {
      mentorId = mentorRecord.id;
    } else {
      // If admin/coordinator logged it, pick assigned mentor or default
      const assigned = await db.getOne(`SELECT mentor_id FROM mentor_allocations WHERE batch_id = ? AND trainee_id = ?`, [batch_id, trainee_id]);
      mentorId = assigned ? assigned.mentor_id : 1;
    }

    const result = await db.query(
      `INSERT INTO mentor_feedback (batch_id, trainee_id, mentor_id, session_date, areas_discussed, strengths, improvement_areas, recommendations, overall_observations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        batch_id, trainee_id, mentorId, session_date || new Date().toISOString().split('T')[0],
        areas_discussed.trim(), strengths.trim(), improvement_areas || '', recommendations.trim(), overall_observations || ''
      ]
    );

    await logAudit(req.user.id, 'ADD_MENTOR_FEEDBACK', 'mentor_feedback', result.insertId, { batch_id, trainee_id }, req);
    return res.status(201).json({ success: true, message: 'Mentoring session feedback saved successfully.', data: { id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
