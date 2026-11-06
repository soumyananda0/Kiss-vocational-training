const db = require('../config/db');

/**
 * Evaluates the 8-point Certificate Eligibility checklist for a trainee in a batch.
 */
async function checkEligibility(traineeId, batchId) {
  // 1. Check Enrolment
  const enrolment = await db.getOne(
    `SELECT e.*, b.name as batch_name, b.start_date, b.end_date, b.programme_id,
            p.title as programme_title, p.min_attendance_pct, p.min_pass_pct, p.duration_weeks, p.total_training_hours,
            t.registration_no, u.full_name as trainee_name
     FROM enrolments e
     JOIN batches b ON e.batch_id = b.id
     JOIN programmes p ON b.programme_id = p.id
     JOIN trainees t ON e.trainee_id = t.id
     JOIN users u ON t.user_id = u.id
     WHERE e.trainee_id = ? AND e.batch_id = ?`,
    [traineeId, batchId]
  );

  if (!enrolment) {
    return {
      eligible: false,
      reason: 'Trainee is not enrolled in the specified batch.',
      checklist: []
    };
  }

  const minAttendancePct = enrolment.min_attendance_pct || 75.0;
  const minPassPct = enrolment.min_pass_pct || 50.0;

  // 2. Training Schedule & Date completion check
  const now = new Date();
  const endDate = new Date(enrolment.end_date);
  const isPeriodCompleted = now >= endDate || enrolment.completion_status === 'completed';

  // 3. Attendance Calculation
  const attendanceStats = await db.getOne(
    `SELECT 
       COUNT(*) as total_sessions,
       SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_sessions,
       SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_sessions,
       SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_sessions
     FROM attendance
     WHERE batch_id = ? AND trainee_id = ?`,
    [batchId, traineeId]
  );

  const totalSessions = attendanceStats ? attendanceStats.total_sessions : 0;
  const presentSessions = attendanceStats ? attendanceStats.present_sessions : 0;
  const attendancePct = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
  const isAttendanceMet = totalSessions > 0 && attendancePct >= minAttendancePct;

  // 4. Training Diary Days Count
  const diaryStats = await db.getOne(
    `SELECT COUNT(DISTINCT day_number) as recorded_days
     FROM training_diary
     WHERE batch_id = ? AND trainee_id = ?`,
    [batchId, traineeId]
  );
  const recordedDiaryDays = diaryStats ? diaryStats.recorded_days : 0;
  // Consider standard min 10 days for demonstration / modular baseline
  const minRequiredDiaryDays = 10;
  const isDiaryComplete = recordedDiaryDays >= minRequiredDiaryDays;

  // 5. Assessments & Passing Marks
  const assessmentRecords = await db.query(
    `SELECT a.id, a.title, a.assessment_type, a.max_marks, a.passing_marks,
            ar.marks_obtained, ar.percentage, ar.result
     FROM assessments a
     LEFT JOIN assessment_results ar ON a.id = ar.assessment_id AND ar.trainee_id = ?
     WHERE a.batch_id = ?`,
    [traineeId, batchId]
  );

  const totalAssessments = assessmentRecords.length;
  const completedAssessments = assessmentRecords.filter(a => a.marks_obtained !== null);
  const passedAssessments = completedAssessments.filter(a => a.result === 'pass' || (a.percentage && a.percentage >= minPassPct));
  const avgAssessmentPct = completedAssessments.length > 0
    ? completedAssessments.reduce((acc, cur) => acc + (cur.percentage || 0), 0) / completedAssessments.length
    : 0;

  const isAssessmentsMet = totalAssessments > 0 &&
    completedAssessments.length === totalAssessments &&
    passedAssessments.length === totalAssessments;

  // 6. Final Trainer Evaluation
  const finalEval = assessmentRecords.find(a => a.assessment_type === 'final');
  const isTrainerEvalSubmitted = finalEval && finalEval.marks_obtained !== null;

  // 7. Mentor Feedback Logged
  const mentorFeedback = await db.query(
    `SELECT * FROM mentor_feedback
     WHERE batch_id = ? AND trainee_id = ?`,
    [batchId, traineeId]
  );
  const isMentorFeedbackLogged = mentorFeedback.length > 0;

  // 8. Certificate Authority Approval
  const approvalRecord = await db.getOne(
    `SELECT * FROM certificate_approvals
     WHERE batch_id = ? AND trainee_id = ?
     ORDER BY id DESC LIMIT 1`,
    [batchId, traineeId]
  );

  const isAuthorityApproved = approvalRecord && approvalRecord.status === 'approved';

  // Checklist array with statuses and exact details
  const checklist = [
    {
      id: 1,
      title: 'Active Programme Enrolment',
      description: `Enrolled in ${enrolment.programme_title} (${enrolment.batch_name})`,
      passed: true,
      current: 'Active Enrolment'
    },
    {
      id: 2,
      title: 'Training Schedule Duration',
      description: `Training timeframe completed (End Date: ${enrolment.end_date})`,
      passed: isPeriodCompleted,
      current: isPeriodCompleted ? 'Completed' : 'Schedule In Progress'
    },
    {
      id: 3,
      title: 'Attendance Requirement',
      description: `Minimum ${minAttendancePct}% required.`,
      passed: isAttendanceMet,
      current: `${attendancePct.toFixed(1)}% (${presentSessions}/${totalSessions} sessions attended)`
    },
    {
      id: 4,
      title: 'Training Diary Completion',
      description: `Minimum ${minRequiredDiaryDays} chronological training days documented.`,
      passed: isDiaryComplete,
      current: `${recordedDiaryDays} training days logged`
    },
    {
      id: 5,
      title: 'Assessments & Passing Criteria',
      description: `Pass all practical and theoretical assessments (min pass ${minPassPct}%).`,
      passed: isAssessmentsMet,
      current: `${passedAssessments.length}/${totalAssessments} passed (Avg: ${avgAssessmentPct.toFixed(1)}%)`
    },
    {
      id: 6,
      title: 'Trainer Final Evaluation',
      description: 'Comprehensive trainer practical and theoretical review recorded.',
      passed: Boolean(isTrainerEvalSubmitted),
      current: isTrainerEvalSubmitted ? 'Evaluation Submitted' : 'Pending Trainer Submission'
    },
    {
      id: 7,
      title: 'Mentor Feedback & Observations',
      description: 'Holistic mentoring session and behavioural feedback documented.',
      passed: isMentorFeedbackLogged,
      current: `${mentorFeedback.length} mentoring session(s) documented`
    },
    {
      id: 8,
      title: 'Certificate Authority Authorisation',
      description: 'Formal sign-off by designated Certificate Authority.',
      passed: Boolean(isAuthorityApproved),
      current: approvalRecord ? `Status: ${approvalRecord.status.toUpperCase()}` : 'Pending Submission to Authority'
    }
  ];

  // Eligible for CA review if criteria 1-7 pass
  const readyForApproval = checklist.slice(0, 7).every(item => item.passed);
  // Full eligibility for certificate issuance requires all 8 to pass
  const eligibleForIssuance = checklist.every(item => item.passed);

  return {
    traineeId,
    batchId,
    traineeName: enrolment.trainee_name,
    registrationNo: enrolment.registration_no,
    programmeTitle: enrolment.programme_title,
    batchName: enrolment.batch_name,
    attendancePct: parseFloat(attendancePct.toFixed(1)),
    avgAssessmentPct: parseFloat(avgAssessmentPct.toFixed(1)),
    readyForApproval,
    eligibleForIssuance,
    approvalStatus: approvalRecord ? approvalRecord.status : 'not_requested',
    approvalId: approvalRecord ? approvalRecord.id : null,
    checklist
  };
}

module.exports = {
  checkEligibility
};
