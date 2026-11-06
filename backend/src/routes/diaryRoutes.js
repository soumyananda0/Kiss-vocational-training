const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/diary
router.get('/', authenticateToken, async (req, res) => {
  const { batch_id, trainee_id } = req.query;

  try {
    let sql = `
      SELECT td.*, u_creator.full_name as creator_name, t.registration_no, u_student.full_name as trainee_name
      FROM training_diary td
      JOIN users u_creator ON td.created_by = u_creator.id
      JOIN trainees t ON td.trainee_id = t.id
      JOIN users u_student ON t.user_id = u_student.id
      WHERE 1=1
    `;
    const params = [];

    if (batch_id) {
      sql += ` AND td.batch_id = ?`;
      params.push(batch_id);
    }
    if (trainee_id) {
      sql += ` AND td.trainee_id = ?`;
      params.push(trainee_id);
    }

    sql += ` ORDER BY td.day_number ASC, td.training_date ASC`;

    const entries = await db.query(sql, params);
    return res.json({ success: true, data: entries });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/diary/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await db.getOne(
      `SELECT td.*, u_creator.full_name as creator_name, t.registration_no, u_student.full_name as trainee_name,
              b.name as batch_name, p.title as programme_title
       FROM training_diary td
       JOIN users u_creator ON td.created_by = u_creator.id
       JOIN trainees t ON td.trainee_id = t.id
       JOIN users u_student ON t.user_id = u_student.id
       JOIN batches b ON td.batch_id = b.id
       JOIN programmes p ON b.programme_id = p.id
       WHERE td.id = ?`,
      [req.params.id]
    );

    if (!entry) return res.status(404).json({ success: false, error: 'Training diary entry not found.' });
    return res.json({ success: true, data: entry });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/diary (Create daily entry - Trainer or Coordinator)
router.post('/', authenticateToken, requireRole(['super_admin', 'coordinator', 'trainer']), async (req, res) => {
  const {
    batch_id, trainee_id, module_id, day_number, training_date, topic_covered,
    theoretical_activities, practical_activities, tools_equipment_used,
    skills_learned, learning_outcomes, hours_spent, trainer_remarks
  } = req.body;

  if (!batch_id || !trainee_id || !day_number || !training_date || !topic_covered || !practical_activities) {
    return res.status(400).json({ success: false, error: 'Mandatory diary fields (Day #, date, topic, practical tasks) missing.' });
  }

  try {
    // Check if day already logged for this trainee
    const existing = await db.getOne(
      `SELECT id FROM training_diary WHERE batch_id = ? AND trainee_id = ? AND day_number = ?`,
      [batch_id, trainee_id, day_number]
    );

    if (existing) {
      return res.status(400).json({ success: false, error: `Day ${day_number} diary entry already exists for this trainee.` });
    }

    const result = await db.query(
      `INSERT INTO training_diary (batch_id, trainee_id, module_id, day_number, training_date, topic_covered,
                                   theoretical_activities, practical_activities, tools_equipment_used,
                                   skills_learned, learning_outcomes, hours_spent, trainer_remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        batch_id, trainee_id, module_id || null, day_number, training_date, topic_covered.trim(),
        theoretical_activities || 'Theoretical lecture and safety briefings.',
        practical_activities.trim(),
        tools_equipment_used || 'Standard trade machinery and workshop tools.',
        skills_learned || 'Mastered core trade step.',
        learning_outcomes || 'Successfully executed workshop assignment.',
        hours_spent || 4.0,
        trainer_remarks || 'Good progress demonstrated.',
        req.user.id
      ]
    );

    await logAudit(req.user.id, 'ADD_DIARY_ENTRY', 'training_diary', result.insertId, { batch_id, trainee_id, day_number, topic_covered }, req);

    return res.status(201).json({
      success: true,
      message: `Day ${day_number} diary record created successfully.`,
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('[Diary Insert Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/diary/:id (Update daily entry)
router.put('/:id', authenticateToken, requireRole(['super_admin', 'coordinator', 'trainer']), async (req, res) => {
  const diaryId = req.params.id;
  const {
    topic_covered, theoretical_activities, practical_activities,
    tools_equipment_used, skills_learned, learning_outcomes, hours_spent, trainer_remarks
  } = req.body;

  try {
    await db.query(
      `UPDATE training_diary SET
         topic_covered = COALESCE(?, topic_covered),
         theoretical_activities = COALESCE(?, theoretical_activities),
         practical_activities = COALESCE(?, practical_activities),
         tools_equipment_used = COALESCE(?, tools_equipment_used),
         skills_learned = COALESCE(?, skills_learned),
         learning_outcomes = COALESCE(?, learning_outcomes),
         hours_spent = COALESCE(?, hours_spent),
         trainer_remarks = COALESCE(?, trainer_remarks),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        topic_covered, theoretical_activities, practical_activities,
        tools_equipment_used, skills_learned, learning_outcomes, hours_spent, trainer_remarks,
        diaryId
      ]
    );

    await logAudit(req.user.id, 'UPDATE_DIARY_ENTRY', 'training_diary', diaryId, req.body, req);
    return res.json({ success: true, message: 'Diary entry updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/diary/:id/mentor-observation (Mentor qualitative review)
router.put('/:id/mentor-observation', authenticateToken, requireRole(['super_admin', 'mentor']), async (req, res) => {
  const diaryId = req.params.id;
  const { mentor_observations } = req.body;

  if (!mentor_observations) {
    return res.status(400).json({ success: false, error: 'Mentor observations text is required.' });
  }

  try {
    await db.query(
      `UPDATE training_diary SET mentor_observations = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [mentor_observations.trim(), diaryId]
    );

    await logAudit(req.user.id, 'ADD_MENTOR_OBSERVATION', 'training_diary', diaryId, { mentor_observations }, req);
    return res.json({ success: true, message: 'Mentor observation recorded.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
