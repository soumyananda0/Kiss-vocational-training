const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/programmes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const programmes = await db.query(
      `SELECT p.*, tr.name as trade_name, tr.category as trade_category,
              (SELECT COUNT(*) FROM batches b WHERE b.programme_id = p.id) as batch_count,
              (SELECT COUNT(DISTINCT e.trainee_id) 
               FROM batches b 
               JOIN enrolments e ON b.id = e.batch_id 
               WHERE b.programme_id = p.id) as trainee_count
       FROM programmes p
       JOIN trades tr ON p.trade_id = tr.id
       ORDER BY p.id ASC`
    );
    return res.json({ success: true, data: programmes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/programmes/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const programmeId = req.params.id;
    const programme = await db.getOne(
      `SELECT p.*, tr.name as trade_name, tr.category as trade_category
       FROM programmes p
       JOIN trades tr ON p.trade_id = tr.id
       WHERE p.id = ?`,
      [programmeId]
    );

    if (!programme) return res.status(404).json({ success: false, error: 'Programme not found.' });

    const modules = await db.query(
      `SELECT * FROM training_modules WHERE programme_id = ? ORDER BY module_number ASC`,
      [programmeId]
    );

    const batches = await db.query(
      `SELECT b.*, COUNT(e.id) as enrolled_count
       FROM batches b
       LEFT JOIN enrolments e ON b.id = e.batch_id
       WHERE b.programme_id = ?
       GROUP BY b.id`,
      [programmeId]
    );

    return res.json({ success: true, data: { ...programme, modules, batches } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/programmes
router.post('/', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  const {
    programme_code, title, trade_id, description, objectives, scope,
    expected_outcomes, eligibility_requirements, duration_weeks, total_training_hours,
    methodology, assessment_criteria, completion_criteria, min_attendance_pct, min_pass_pct, modules
  } = req.body;

  if (!programme_code || !title || !trade_id || !description || !objectives || !duration_weeks || !total_training_hours) {
    return res.status(400).json({ success: false, error: 'Missing mandatory programme specifications.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO programmes (programme_code, title, trade_id, description, objectives, scope,
                               expected_outcomes, eligibility_requirements, duration_weeks, total_training_hours,
                               methodology, assessment_criteria, completion_criteria, min_attendance_pct, min_pass_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        programme_code.trim(), title.trim(), trade_id, description, objectives, scope || '',
        expected_outcomes || '', eligibility_requirements || '', duration_weeks, total_training_hours,
        methodology || 'Classroom instruction combined with practical laboratory workshop.',
        assessment_criteria || 'Continuous practical assessment (70%) and theoretical evaluation (30%).',
        completion_criteria || 'Minimum 75% attendance and passing marks in all modules.',
        min_attendance_pct || 75.0, min_pass_pct || 50.0
      ]
    );

    const programmeId = result.insertId;

    // Insert syllabus modules if provided
    if (Array.isArray(modules) && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        await db.query(
          `INSERT INTO training_modules (programme_id, module_number, title, description, planned_hours)
           VALUES (?, ?, ?, ?, ?)`,
          [programmeId, i + 1, m.title, m.description || '', m.planned_hours || 20]
        );
      }
    }

    await logAudit(req.user.id, 'CREATE_PROGRAMME', 'programmes', programmeId, { title, programme_code }, req);
    return res.status(201).json({ success: true, message: 'Programme created successfully.', data: { id: programmeId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
