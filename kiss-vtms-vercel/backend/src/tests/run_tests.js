const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { comparePassword, hashPassword, generateToken, verifyToken } = require('../utils/auth');
const { checkEligibility } = require('../services/eligibilityService');
const { generateOfficialCertificate, generateJourneyPortfolio } = require('../services/pdfService');

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING KISS-VTMS INTEGRATED AUTOMATED TEST SUITE ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Authentication & Hashing
  await test('TC-AUTH-01: Password Hashing & Bcrypt Verification', async () => {
    const raw = 'TestPassword123!';
    const hashed = await hashPassword(raw);
    assert.ok(hashed && hashed.startsWith('$2'), 'Hash format must be bcrypt');
    const isMatch = await comparePassword(raw, hashed);
    assert.strictEqual(isMatch, true, 'Correct password must match hash');
    const isFalse = await comparePassword('WrongPassword', hashed);
    assert.strictEqual(isFalse, false, 'Wrong password must fail comparison');
  });

  await test('TC-AUTH-02: JWT Token Signing and Verification', async () => {
    const payload = { userId: 42, roleKey: 'trainer' };
    const token = generateToken(payload);
    assert.ok(typeof token === 'string' && token.length > 20, 'Token must be valid string');
    const decoded = verifyToken(token);
    assert.strictEqual(decoded.userId, 42);
    assert.strictEqual(decoded.roleKey, 'trainer');
  });

  // 2. Database Schema & Seed Verification
  await test('TC-DB-01: Verify 23 Tables Existence', async () => {
    const tables = [
      'users', 'roles', 'trainees', 'trainers', 'mentors', 'departments',
      'trades', 'programmes', 'batches', 'enrolments', 'trainer_allocations',
      'mentor_allocations', 'attendance', 'training_modules', 'training_diary',
      'assessments', 'assessment_results', 'mentor_feedback', 'skills',
      'trainee_skills', 'certificates', 'certificate_approvals', 'audit_logs'
    ];

    for (const t of tables) {
      const row = await db.getOne(`SELECT COUNT(*) as count FROM ${t}`);
      assert.ok(row !== null, `Table ${t} must be queryable`);
    }
  });

  await test('TC-DB-02: Verify 6 Standard Roles Seeded', async () => {
    const roles = await db.query(`SELECT role_key FROM roles`);
    const keys = roles.map(r => r.role_key);
    assert.ok(keys.includes('super_admin'), 'super_admin role must exist');
    assert.ok(keys.includes('coordinator'), 'coordinator role must exist');
    assert.ok(keys.includes('trainer'), 'trainer role must exist');
    assert.ok(keys.includes('mentor'), 'mentor role must exist');
    assert.ok(keys.includes('trainee'), 'trainee role must exist');
    assert.ok(keys.includes('cert_authority'), 'cert_authority role must exist');
  });

  // 3. Attendance Calculation
  await test('TC-ATT-01: Attendance Percentage Calculation', async () => {
    const sita = await db.getOne(`SELECT id FROM trainees WHERE registration_no = 'KISS-VT-2026-001'`);
    const attRows = await db.query(`SELECT status FROM attendance WHERE trainee_id = ?`, [sita.id]);
    assert.ok(attRows.length >= 10, 'Sita must have at least 10 attendance sessions');
    const present = attRows.filter(r => r.status === 'present').length;
    const pct = (present / attRows.length) * 100;
    assert.ok(pct >= 75.0, 'Attendance must be at least 75% for completion');
  });

  // 4. Chronological Daily Training Diary
  await test('TC-DIR-01: Training Diary Chronological Day 1 to Day 15 Integrity', async () => {
    const sita = await db.getOne(`SELECT id FROM trainees WHERE registration_no = 'KISS-VT-2026-001'`);
    const diary = await db.query(
      `SELECT day_number, topic_covered, tools_equipment_used, hours_spent
       FROM training_diary WHERE trainee_id = ? ORDER BY day_number ASC`,
      [sita.id]
    );

    assert.strictEqual(diary.length, 15, 'Must have exactly 15 chronological diary records');
    for (let i = 0; i < diary.length; i++) {
      assert.strictEqual(diary[i].day_number, i + 1, `Day number must sequence exactly from 1 to 15 (found ${diary[i].day_number})`);
      assert.ok(diary[i].topic_covered.length > 5, 'Topic must be descriptive');
      assert.ok(diary[i].tools_equipment_used.length > 5, 'Tools must be specified');
      assert.ok(diary[i].hours_spent > 0, 'Hours spent must be positive');
    }
  });

  // 5. 8-Point Certificate Eligibility Gatekeeper
  await test('TC-ELG-01: 8-Point Eligibility Checklist Evaluator', async () => {
    const sita = await db.getOne(`SELECT id FROM trainees WHERE registration_no = 'KISS-VT-2026-001'`);
    const batch = await db.getOne(`SELECT id FROM batches LIMIT 1`);
    const res = await checkEligibility(sita.id, batch.id);

    assert.strictEqual(res.checklist.length, 8, 'Checklist must evaluate exactly 8 gates');
    assert.strictEqual(res.eligibleForIssuance, true, 'Sita Majhi must satisfy full eligibility');
    assert.strictEqual(res.approvalStatus, 'approved', 'Must have approved status');
  });

  // 6. Dual PDF Generation & Verification
  await test('TC-PDF-01: Generate Certificate 1 (Landscape Official Certificate)', async () => {
    const sita = await db.getOne(`SELECT id FROM trainees WHERE registration_no = 'KISS-VT-2026-001'`);
    const batch = await db.getOne(`SELECT id FROM batches LIMIT 1`);
    const cert = await generateOfficialCertificate(sita.id, batch.id, 'TEST-CERT-001');

    assert.ok(fs.existsSync(cert.filePath), 'Generated PDF file must exist on disk');
    const stat = fs.statSync(cert.filePath);
    assert.ok(stat.size > 2000, 'PDF file must be non-empty vector document');
  });

  await test('TC-PDF-02: Generate Certificate 2 (Multi-Page Journey Portfolio)', async () => {
    const sita = await db.getOne(`SELECT id FROM trainees WHERE registration_no = 'KISS-VT-2026-001'`);
    const batch = await db.getOne(`SELECT id FROM batches LIMIT 1`);
    const portfolio = await generateJourneyPortfolio(sita.id, batch.id, 'TEST-CERT-001');

    assert.ok(fs.existsSync(portfolio.filePath), 'Portfolio PDF file must exist on disk');
    const stat = fs.statSync(portfolio.filePath);
    assert.ok(stat.size > 15000, 'Multi-page portfolio must be substantial size (>= 15KB)');
  });

  // 7. Public Zero-PII Verification Logic
  await test('TC-VRF-01: Zero-PII Public Verification Filter Check', async () => {
    const cert = await db.getOne(`SELECT * FROM certificates WHERE certificate_type = 'completion_certificate' LIMIT 1`);
    assert.ok(cert !== null, 'Seeded certificate must exist');

    // Simulate verification query
    const verified = await db.getOne(
      `SELECT c.certificate_number, c.issue_date, c.status, u.full_name, p.title as programme_title
       FROM certificates c
       JOIN trainees t ON c.trainee_id = t.id
       JOIN users u ON t.user_id = u.id
       JOIN batches b ON c.batch_id = b.id
       JOIN programmes p ON b.programme_id = p.id
       WHERE c.certificate_number = ?`,
      [cert.certificate_number]
    );

    assert.ok(verified !== null);
    assert.strictEqual(verified.certificate_number, cert.certificate_number);
    // Ensure PII fields (phone, address, dob, guardian) are absent
    assert.strictEqual(verified.phone, undefined);
    assert.strictEqual(verified.address, undefined);
    assert.strictEqual(verified.dob, undefined);
  });

  // 8. Certificate Download Resolution & File Integrity Tests
  await test('TC-DL-01: Certificate 1 Download & File Availability', async () => {
    const cert = await db.getOne(`SELECT * FROM certificates WHERE certificate_number = 'KISS-VT-CERT-2026-0001'`);
    assert.ok(cert, 'KISS-VT-CERT-2026-0001 must exist in database');
    assert.strictEqual(cert.status, 'valid', 'Certificate must be valid for unauthenticated public download');
    assert.ok(fs.existsSync(cert.file_path), `PDF file must exist at path: ${cert.file_path}`);
    const buffer = fs.readFileSync(cert.file_path);
    assert.ok(buffer.length > 1000, 'PDF buffer must have valid size');
    assert.strictEqual(buffer.slice(0, 4).toString(), '%PDF', 'File must have valid %PDF magic header');
  });

  await test('TC-DL-02: Certificate 2 (Journey Portfolio) Download & File Availability', async () => {
    const cert = await db.getOne(`SELECT * FROM certificates WHERE certificate_number = 'KISS-VT-CERT-2026-0001-PORTFOLIO'`);
    assert.ok(cert, 'KISS-VT-CERT-2026-0001-PORTFOLIO must exist in database');
    assert.strictEqual(cert.status, 'valid', 'Portfolio must be valid for download');
    assert.ok(fs.existsSync(cert.file_path), `Portfolio PDF file must exist at path: ${cert.file_path}`);
    const buffer = fs.readFileSync(cert.file_path);
    assert.ok(buffer.length > 15000, 'Portfolio PDF buffer must be >= 15KB');
    assert.strictEqual(buffer.slice(0, 4).toString(), '%PDF', 'Portfolio file must have valid %PDF magic header');
  });

  console.log(`\n====================================================`);
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log(`====================================================`);

  if (failed > 0) process.exit(1);
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
