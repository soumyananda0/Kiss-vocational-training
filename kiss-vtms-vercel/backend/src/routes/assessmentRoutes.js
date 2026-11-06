const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/assessments
router.get('/', authenticateToken, async (req, res) => {
  const { batch_id, programme_id } = req.query;

  try {
    let sql = `
      SELECT a.*, b.name as batch_name, p.title as programme_title,
             COUNT(ar.id) as submissions_count
      FROM assessments a
      JOIN batches b ON a.batch_id = b.id
      JOIN programmes p ON a.programme_id = p.id
      LEFT JOIN assessment_results ar ON a.id = ar.assessment_id
      WHERE 1=1
    `;
    const params = [];

    if (batch_id) {
      sql += ` AND a.batch_id = ?`;
      params.push(batch_id);
    }
    if (programme_id) {
      sql += ` AND a.programme_id = ?`;
      params.push(programme_id);
    }

    sql += ` GROUP BY a.id ORDER BY a.evaluation_date DESC`;

    const assessments = await db.query(sql, params);
    return res.json({ success: true, data: assessments });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/assessments/:id/results
router.get('/:id/results', authenticateToken, async (req, res) => {
  const assessmentId = req.params.id;

  try {
    const assessment = await db.getOne(
      `SELECT a.*, b.name as batch_name, p.title as programme_title
       FROM assessments a
       JOIN batches b ON a.batch_id = b.id
       JOIN programmes p ON a.programme_id = p.id
       WHERE a.id = ?`,
      [assessmentId]
    );

    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found.' });

    // Enrolled trainees with their results
    const results = await db.query(
      `SELECT t.id as trainee_id, t.registration_no, u.full_name,
              ar.id as result_id, ar.marks_obtained, ar.percentage, ar.result, ar.trainer_remarks, ar.evaluated_at
       FROM enrolments e
       JOIN trainees t ON e.trainee_id = t.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN assessment_results ar ON ar.assessment_id = ? AND ar.trainee_id = t.id
       WHERE e.batch_id = ?
       ORDER BY t.registration_no ASC`,
      [assessmentId, assessment.batch_id]
    );

    return res.json({ success: true, data: { assessment, results } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments (Create Assessment)
router.post('/', authenticateToken, requireRole(['super_admin', 'coordinator', 'trainer']), async (req, res) => {
  const { batch_id, programme_id, title, assessment_type, max_marks, passing_marks, weightage_pct, evaluation_date } = req.body;

  if (!batch_id || !title || !assessment_type || !max_marks || !passing_marks) {
    return res.status(400).json({ success: false, error: 'Required assessment fields missing.' });
  }

  try {
    let pId = programme_id;
    if (!pId) {
      const b = await db.getOne(`SELECT programme_id FROM batches WHERE id = ?`, [batch_id]);
      pId = b ? b.programme_id : 1;
    }

    const result = await db.query(
      `INSERT INTO assessments (batch_id, programme_id, title, assessment_type, max_marks, passing_marks, weightage_pct, evaluation_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        batch_id, pId, title.trim(), assessment_type, max_marks, passing_marks,
        weightage_pct || 20.0, evaluation_date || new Date().toISOString().split('T')[0],
        req.user.id
      ]
    );

    await logAudit(req.user.id, 'CREATE_ASSESSMENT', 'assessments', result.insertId, { title, assessment_type, batch_id }, req);
    return res.status(201).json({ success: true, message: 'Assessment created successfully.', data: { id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments/:id/grade (Submit / update marks)
router.post('/:id/grade', authenticateToken, requireRole(['super_admin', 'coordinator', 'trainer']), async (req, res) => {
  const assessmentId = req.params.id;
  const { trainee_id, marks_obtained, trainer_remarks } = req.body;

  if (!trainee_id || marks_obtained === undefined) {
    return res.status(400).json({ success: false, error: 'Trainee ID and marks obtained are required.' });
  }

  try {
    const assessment = await db.getOne(`SELECT max_marks, passing_marks FROM assessments WHERE id = ?`, [assessmentId]);
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found.' });

    const marks = parseFloat(marks_obtained);
    const maxMarks = parseFloat(assessment.max_marks);
    const passMarks = parseFloat(assessment.passing_marks);
    const pct = ((marks / maxMarks) * 100).toFixed(1);
    const resultStatus = marks >= passMarks ? 'pass' : 'fail';

    const existing = await db.getOne(
      `SELECT id FROM assessment_results WHERE assessment_id = ? AND trainee_id = ?`,
      [assessmentId, trainee_id]
    );

    if (existing) {
      await db.query(
        `UPDATE assessment_results SET
           marks_obtained = ?, percentage = ?, result = ?, trainer_remarks = ?, evaluated_by = ?, evaluated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [marks, pct, resultStatus, trainer_remarks || null, req.user.id, existing.id]
      );
    } else {
      await db.query(
        `INSERT INTO assessment_results (assessment_id, trainee_id, marks_obtained, percentage, result, trainer_remarks, evaluated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [assessmentId, trainee_id, marks, pct, resultStatus, trainer_remarks || null, req.user.id]
      );
    }

    await logAudit(req.user.id, 'GRADE_ASSESSMENT', 'assessment_results', assessmentId, { trainee_id, marks, resultStatus }, req);
    return res.json({ success: true, message: 'Grade recorded successfully.', data: { percentage: pct, result: resultStatus } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
