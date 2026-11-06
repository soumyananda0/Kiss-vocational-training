const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/batches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const batches = await db.query(
      `SELECT b.*, p.title as programme_title, p.duration_weeks, p.total_training_hours,
              tr.name as trade_name,
              COUNT(DISTINCT e.trainee_id) as enrolled_count,
              (SELECT u.full_name FROM trainer_allocations ta 
               JOIN trainers t ON ta.trainer_id = t.id 
               JOIN users u ON t.user_id = u.id 
               WHERE ta.batch_id = b.id LIMIT 1) as primary_trainer
       FROM batches b
       JOIN programmes p ON b.programme_id = p.id
       JOIN trades tr ON p.trade_id = tr.id
       LEFT JOIN enrolments e ON b.id = e.batch_id
       GROUP BY b.id
       ORDER BY b.id DESC`
    );
    return res.json({ success: true, data: batches });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/batches/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const batchId = req.params.id;
    const batch = await db.getOne(
      `SELECT b.*, p.title as programme_title, p.trade_id, tr.name as trade_name
       FROM batches b
       JOIN programmes p ON b.programme_id = p.id
       JOIN trades tr ON p.trade_id = tr.id
       WHERE b.id = ?`,
      [batchId]
    );

    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found.' });

    // Enrolled trainees
    const trainees = await db.query(
      `SELECT t.id, t.registration_no, t.gender, t.class_grade, u.full_name, u.email,
              e.enrolment_date, e.completion_status,
              (SELECT COUNT(*) FROM attendance a WHERE a.batch_id = ? AND a.trainee_id = t.id AND a.status = 'present') as present_sessions,
              (SELECT COUNT(*) FROM attendance a WHERE a.batch_id = ? AND a.trainee_id = t.id) as total_sessions
       FROM enrolments e
       JOIN trainees t ON e.trainee_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE e.batch_id = ?`,
      [batchId, batchId, batchId]
    );

    // Allocated trainers
    const trainers = await db.query(
      `SELECT tr.id, tr.specialization, tr.qualification, u.full_name, u.email, ta.assigned_date
       FROM trainer_allocations ta
       JOIN trainers tr ON ta.trainer_id = tr.id
       JOIN users u ON tr.user_id = u.id
       WHERE ta.batch_id = ?`,
      [batchId]
    );

    // Allocated mentors
    const mentors = await db.query(
      `SELECT m.id, m.designation, m.area_of_expertise, u.full_name, ma.trainee_id, ma.assigned_date
       FROM mentor_allocations ma
       JOIN mentors m ON ma.mentor_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE ma.batch_id = ?`,
      [batchId]
    );

    return res.json({ success: true, data: { ...batch, trainees, trainers, mentors } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/batches
router.post('/', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  const { batch_code, programme_id, name, start_date, end_date, capacity } = req.body;
  if (!batch_code || !programme_id || !name || !start_date || !end_date) {
    return res.status(400).json({ success: false, error: 'Batch code, programme, name, and dates are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO batches (batch_code, programme_id, name, start_date, end_date, capacity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [batch_code.trim(), programme_id, name.trim(), start_date, end_date, capacity || 30]
    );

    await logAudit(req.user.id, 'CREATE_BATCH', 'batches', result.insertId, { name, batch_code }, req);
    return res.status(201).json({ success: true, message: 'Batch scheduled successfully.', data: { id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/batches/:id/enrol
router.post('/:id/enrol', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  const batchId = req.params.id;
  const { trainee_id, enrolment_date } = req.body;

  if (!trainee_id) return res.status(400).json({ success: false, error: 'Trainee ID is required.' });

  try {
    const existing = await db.getOne(
      `SELECT id FROM enrolments WHERE batch_id = ? AND trainee_id = ?`,
      [batchId, trainee_id]
    );
    if (existing) return res.status(400).json({ success: false, error: 'Trainee is already enrolled in this batch.' });

    await db.query(
      `INSERT INTO enrolments (batch_id, trainee_id, enrolment_date)
       VALUES (?, ?, ?)`,
      [batchId, trainee_id, enrolment_date || new Date().toISOString().split('T')[0]]
    );

    await logAudit(req.user.id, 'ENROL_TRAINEE', 'enrolments', null, { batchId, trainee_id }, req);
    return res.status(201).json({ success: true, message: 'Trainee enrolled successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
