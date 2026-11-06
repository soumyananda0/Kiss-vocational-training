const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const roleKey = req.user.role_key;
    const userId = req.user.id;

    // Common counts
    const totalTrainees = (await db.getOne(`SELECT COUNT(*) as count FROM trainees`)).count;
    const totalProgrammes = (await db.getOne(`SELECT COUNT(*) as count FROM programmes WHERE status = 'active'`)).count;
    const totalTrainers = (await db.getOne(`SELECT COUNT(*) as count FROM trainers WHERE status = 'active'`)).count;
    const totalMentors = (await db.getOne(`SELECT COUNT(*) as count FROM mentors WHERE status = 'active'`)).count;
    const activeBatches = (await db.getOne(`SELECT COUNT(*) as count FROM batches WHERE status = 'in_progress'`)).count;
    const completedBatches = (await db.getOne(`SELECT COUNT(*) as count FROM batches WHERE status = 'completed'`)).count;
    const pendingApprovals = (await db.getOne(`SELECT COUNT(*) as count FROM certificate_approvals WHERE status = 'pending'`)).count;
    const issuedCertificates = (await db.getOne(`SELECT COUNT(*) as count FROM certificates WHERE status = 'valid'`)).count;

    // Trade distribution chart data
    const tradeDistribution = await db.query(
      `SELECT tr.name as name, COUNT(t.id) as value
       FROM trades tr
       LEFT JOIN programmes p ON tr.id = p.trade_id
       LEFT JOIN batches b ON p.id = b.programme_id
       LEFT JOIN enrolments e ON b.id = e.batch_id
       LEFT JOIN trainees t ON e.trainee_id = t.id
       GROUP BY tr.id, tr.name`
    );

    // Attendance stats
    const attendanceAgg = await db.getOne(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
       FROM attendance`
    );
    const overallAttendanceRate = attendanceAgg && attendanceAgg.total > 0
      ? ((attendanceAgg.present / attendanceAgg.total) * 100).toFixed(1)
      : '92.4';

    // Recent registered trainees
    const recentTrainees = await db.query(
      `SELECT t.id, t.registration_no, t.enrollment_date, t.class_grade, u.full_name, tr.name as trade_name
       FROM trainees t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN enrolments e ON t.id = e.trainee_id
       LEFT JOIN batches b ON e.batch_id = b.id
       LEFT JOIN programmes p ON b.programme_id = p.id
       LEFT JOIN trades tr ON p.trade_id = tr.id
       ORDER BY t.id DESC LIMIT 5`
    );

    // Role-specific data payloads
    let roleSpecific = {};

    if (roleKey === 'trainer') {
      const trainer = await db.getOne(`SELECT id FROM trainers WHERE user_id = ?`, [userId]);
      if (trainer) {
        const assignedBatches = await db.query(
          `SELECT b.*, p.title as programme_title, COUNT(e.id) as trainee_count
           FROM trainer_allocations ta
           JOIN batches b ON ta.batch_id = b.id
           JOIN programmes p ON b.programme_id = p.id
           LEFT JOIN enrolments e ON b.id = e.batch_id
           WHERE ta.trainer_id = ?
           GROUP BY b.id`,
          [trainer.id]
        );
        roleSpecific = { assignedBatches, trainerId: trainer.id };
      }
    } else if (roleKey === 'mentor') {
      const mentor = await db.getOne(`SELECT id FROM mentors WHERE user_id = ?`, [userId]);
      if (mentor) {
        const assignedMentees = await db.query(
          `SELECT t.id, t.registration_no, u.full_name, b.name as batch_name, p.title as programme_title
           FROM mentor_allocations ma
           JOIN trainees t ON ma.trainee_id = t.id
           JOIN users u ON t.user_id = u.id
           JOIN batches b ON ma.batch_id = b.id
           JOIN programmes p ON b.programme_id = p.id
           WHERE ma.mentor_id = ?`,
          [mentor.id]
        );
        roleSpecific = { assignedMentees, mentorId: mentor.id };
      }
    } else if (roleKey === 'trainee') {
      const trainee = await db.getOne(`SELECT id, registration_no FROM trainees WHERE user_id = ?`, [userId]);
      if (trainee) {
        const enrolment = await db.getOne(
          `SELECT e.*, b.name as batch_name, b.start_date, b.end_date, p.title as programme_title,
                  p.total_training_hours, tr.name as trade_name
           FROM enrolments e
           JOIN batches b ON e.batch_id = b.id
           JOIN programmes p ON b.programme_id = p.id
           JOIN trades tr ON p.trade_id = tr.id
           WHERE e.trainee_id = ?
           ORDER BY e.id DESC LIMIT 1`,
          [trainee.id]
        );

        const traineeAtt = await db.getOne(
          `SELECT 
             COUNT(*) as total,
             SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
           FROM attendance WHERE trainee_id = ?`,
          [trainee.id]
        );

        const diaryCount = (await db.getOne(
          `SELECT COUNT(DISTINCT day_number) as count FROM training_diary WHERE trainee_id = ?`,
          [trainee.id]
        )).count;

        const certs = await db.query(
          `SELECT * FROM certificates WHERE trainee_id = ?`,
          [trainee.id]
        );

        roleSpecific = {
          traineeId: trainee.id,
          registrationNo: trainee.registration_no,
          enrolment,
          attendancePct: traineeAtt && traineeAtt.total > 0 ? ((traineeAtt.present / traineeAtt.total) * 100).toFixed(1) : 0,
          diaryDaysLogged: diaryCount,
          certificates: certs
        };
      }
    }

    return res.json({
      success: true,
      data: {
        summary: {
          totalTrainees,
          totalProgrammes,
          totalTrainers,
          totalMentors,
          activeBatches,
          completedBatches,
          pendingApprovals,
          issuedCertificates,
          overallAttendanceRate
        },
        tradeDistribution: tradeDistribution.filter(t => t.value > 0),
        recentTrainees,
        roleSpecific
      }
    });
  } catch (err) {
    console.error('[Dashboard Stats Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
