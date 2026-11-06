const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/reports/training-summary
router.get('/training-summary', authenticateToken, requireRole(['super_admin', 'coordinator']), async (req, res) => {
  try {
    const tradeSummary = await db.query(
      `SELECT tr.id, tr.name as trade_name, tr.category,
              COUNT(DISTINCT p.id) as total_programmes,
              COUNT(DISTINCT b.id) as total_batches,
              COUNT(DISTINCT e.trainee_id) as total_enrolled,
              SUM(CASE WHEN e.completion_status = 'completed' THEN 1 ELSE 0 END) as total_certified
       FROM trades tr
       LEFT JOIN programmes p ON tr.id = p.trade_id
       LEFT JOIN batches b ON p.id = b.programme_id
       LEFT JOIN enrolments e ON b.id = e.batch_id
       GROUP BY tr.id`
    );

    const batchSummary = await db.query(
      `SELECT b.id, b.name as batch_name, b.start_date, b.end_date, b.status,
              p.title as programme_title, tr.name as trade_name,
              COUNT(e.id) as total_enrolled,
              (SELECT COUNT(*) FROM attendance a WHERE a.batch_id = b.id AND a.status = 'present') as present_attendance_count,
              (SELECT COUNT(*) FROM attendance a WHERE a.batch_id = b.id) as total_attendance_count,
              (SELECT COUNT(DISTINCT day_number) FROM training_diary td WHERE td.batch_id = b.id) as diary_days_logged
       FROM batches b
       JOIN programmes p ON b.programme_id = p.id
       JOIN trades tr ON p.trade_id = tr.id
       LEFT JOIN enrolments e ON b.id = e.batch_id
       GROUP BY b.id`
    );

    return res.json({
      success: true,
      data: {
        tradeSummary,
        batchSummary
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
