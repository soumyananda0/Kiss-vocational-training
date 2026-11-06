const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/attendance/batch/:batchId
router.get('/batch/:batchId', authenticateToken, async (req, res) => {
  const batchId = req.params.batchId;
  const { date } = req.query;

  try {
    const sessionDate = date || new Date().toISOString().split('T')[0];

    // Enrolled trainees in this batch with their attendance for this date (if recorded)
    const trainees = await db.query(
      `SELECT t.id as trainee_id, t.registration_no, u.full_name,
              a.id as attendance_id, a.status, a.remarks, a.session_number
       FROM enrolments e
       JOIN trainees t ON e.trainee_id = t.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN attendance a ON a.batch_id = e.batch_id AND a.trainee_id = t.id AND a.session_date = ?
       WHERE e.batch_id = ?
       ORDER BY t.registration_no ASC`,
      [sessionDate, batchId]
    );

    return res.json({
      success: true,
      data: {
        batchId: parseInt(batchId),
        sessionDate,
        trainees
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/attendance/mark
router.post('/mark', authenticateToken, requireRole(['super_admin', 'coordinator', 'trainer']), async (req, res) => {
  const { batch_id, session_date, session_number, records } = req.body;

  if (!batch_id || !session_date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, error: 'Batch ID, session date, and attendance records array are required.' });
  }

  const sNumber = session_number || 1;
  const recordedBy = req.user.id;

  try {
    for (const rec of records) {
      const { trainee_id, status, remarks } = rec;
      if (!trainee_id || !status) continue;

      // Upsert: check if already exists for this trainee, batch, date, session
      const existing = await db.getOne(
        `SELECT id FROM attendance
         WHERE batch_id = ? AND trainee_id = ? AND session_date = ? AND session_number = ?`,
        [batch_id, trainee_id, session_date, sNumber]
      );

      if (existing) {
        await db.query(
          `UPDATE attendance SET status = ?, remarks = ?, recorded_by = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [status, remarks || null, recordedBy, existing.id]
        );
      } else {
        await db.query(
          `INSERT INTO attendance (batch_id, trainee_id, session_date, session_number, status, remarks, recorded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [batch_id, trainee_id, session_date, sNumber, status, remarks || null, recordedBy]
        );
      }
    }

    await logAudit(req.user.id, 'MARK_ATTENDANCE', 'attendance', batch_id, { session_date, count: records.length }, req);
    return res.json({ success: true, message: `Attendance successfully saved for ${records.length} trainees.` });
  } catch (err) {
    console.error('[Attendance Mark Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/attendance/trainee/:traineeId
router.get('/trainee/:traineeId', authenticateToken, async (req, res) => {
  const traineeId = req.params.traineeId;

  try {
    const records = await db.query(
      `SELECT a.*, b.name as batch_name, p.title as programme_title
       FROM attendance a
       JOIN batches b ON a.batch_id = b.id
       JOIN programmes p ON b.programme_id = p.id
       WHERE a.trainee_id = ?
       ORDER BY a.session_date DESC, a.session_number DESC`,
      [traineeId]
    );

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const leave = records.filter(r => r.status === 'leave').length;
    const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

    return res.json({
      success: true,
      data: {
        summary: {
          total,
          present,
          absent,
          leave,
          percentage: parseFloat(pct),
          isLowAttendance: parseFloat(pct) < 75.0 && total >= 5
        },
        records
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/attendance/report/low-attendance
router.get('/report/low-attendance', authenticateToken, async (req, res) => {
  try {
    const list = await db.query(
      `SELECT t.id, t.registration_no, u.full_name, u.email, b.name as batch_name, p.title as programme_title,
              COUNT(a.id) as total_sessions,
              SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_sessions
       FROM trainees t
       JOIN users u ON t.user_id = u.id
       JOIN enrolments e ON t.id = e.trainee_id
       JOIN batches b ON e.batch_id = b.id
       JOIN programmes p ON b.programme_id = p.id
       LEFT JOIN attendance a ON t.id = a.trainee_id AND b.id = a.batch_id
       GROUP BY t.id, b.id
       HAVING total_sessions >= 3 AND ((present_sessions * 100.0) / total_sessions) < 75.0`
    );

    const formatted = list.map(item => ({
      ...item,
      attendancePct: item.total_sessions > 0 ? ((item.present_sessions / item.total_sessions) * 100).toFixed(1) : '0.0'
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
