const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/allocations/trainers
router.get('/trainers', authenticateToken, async (req, res) => {
  try {
    const trainers = await db.query(
      `SELECT tr.*, u.full_name, u.email, u.phone, d.name as department_name,
              (SELECT COUNT(*) FROM trainer_allocations ta WHERE ta.trainer_id = tr.id AND ta.status = 'active') as active_assignments
       FROM trainers tr
       JOIN users u ON tr.user_id = u.id
       LEFT JOIN departments d ON tr.department_id = d.id
       WHERE tr.status = 'active'`
    );
    return res.json({ success: true, data: trainers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/allocations/mentors
router.get('/mentors', authenticateToken, async (req, res) => {
  try {
    const mentors = await db.query(
      `SELECT m.*, u.full_name, u.email, u.phone, d.name as department_name,
              (SELECT COUNT(*) FROM mentor_allocations ma WHERE ma.mentor_id = m.id AND ma.status = 'active') as active_mentees
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN departments d ON m.department_id = d.id
       WHERE m.status = 'active'`
    );
    return res.json({ success: true, data: mentors });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/allocations/assign-trainer
router.post('/assign-trainer', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  const { batch_id, trainer_id, assigned_date } = req.body;
  if (!batch_id || !trainer_id) {
    return res.status(400).json({ success: false, error: 'Batch ID and Trainer ID are required.' });
  }

  try {
    // Check if trainer is already assigned
    const existing = await db.getOne(
      `SELECT id FROM trainer_allocations WHERE batch_id = ? AND trainer_id = ?`,
      [batch_id, trainer_id]
    );

    if (existing) {
      return res.status(400).json({ success: false, error: 'Trainer is already assigned to this batch.' });
    }

    await db.query(
      `INSERT INTO trainer_allocations (batch_id, trainer_id, assigned_date, status)
       VALUES (?, ?, ?, 'active')`,
      [batch_id, trainer_id, assigned_date || new Date().toISOString().split('T')[0]]
    );

    await logAudit(req.user.id, 'ASSIGN_TRAINER', 'allocations', null, { batch_id, trainer_id }, req);
    return res.status(201).json({ success: true, message: 'Trainer assigned successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/allocations/assign-mentor
router.post('/assign-mentor', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  const { batch_id, trainee_id, mentor_id, assigned_date } = req.body;
  if (!batch_id || !trainee_id || !mentor_id) {
    return res.status(400).json({ success: false, error: 'Batch ID, Trainee ID, and Mentor ID are required.' });
  }

  try {
    const existing = await db.getOne(
      `SELECT id FROM mentor_allocations WHERE batch_id = ? AND trainee_id = ? AND mentor_id = ?`,
      [batch_id, trainee_id, mentor_id]
    );

    if (existing) {
      return res.status(400).json({ success: false, error: 'Mentor already assigned to this trainee for this batch.' });
    }

    await db.query(
      `INSERT INTO mentor_allocations (batch_id, trainee_id, mentor_id, assigned_date, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [batch_id, trainee_id, mentor_id, assigned_date || new Date().toISOString().split('T')[0]]
    );

    await logAudit(req.user.id, 'ASSIGN_MENTOR', 'allocations', null, { batch_id, trainee_id, mentor_id }, req);
    return res.status(201).json({ success: true, message: 'Mentor assigned successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
