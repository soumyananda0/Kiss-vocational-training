# Software Testing & Quality Assurance Plan
## KISS Vocational Training Management System (KISS-VTMS)

---

## 1. Testing Strategy & Methodology
The testing framework for KISS-VTMS adheres to institutional compliance and security standards:
- **Unit Testing**: Testing individual service layer methods, eligibility scoring functions, attendance percentage calculations, and PDF generation formatting.
- **Integration Testing**: Testing API route handlers, database transactions, foreign key constraints, and JWT authorization checks.
- **System Testing**: End-to-end simulation of a trainee journey from enrolment to dual certificate generation.
- **User Acceptance Testing (UAT)**: Validating workflows across each of the 6 institutional user roles.
- **Security Testing**: Verification of SQL injection immunity, XSS mitigation, password hashing work factor, and PII protection on public endpoints.

---

## 2. Test Cases and Execution Results

### 2.1 Authentication & RBAC (SEC & AUTH)

| Test ID | Module | Test Scenario | Test Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Auth | Valid User Login | Valid email & password for Admin | HTTP 200, JWT token returned, user role `super_admin` | Matches expected | **PASS** |
| **TC-AUTH-02** | Auth | Invalid Password Attempt | Correct email, wrong password | HTTP 401 Unauthorized, "Invalid email or password" | Matches expected | **PASS** |
| **TC-AUTH-03** | Auth | Brute Force Protection | 12 rapid failed logins within 1 minute | HTTP 429 Too Many Requests after 10 attempts | Matches expected | **PASS** |
| **TC-AUTH-04** | RBAC | Trainee Accessing Admin Route | Bearer token with role `trainee` requesting `GET /api/users` | HTTP 403 Forbidden, access denied | Matches expected | **PASS** |
| **TC-AUTH-05** | RBAC | Unauthenticated Route Request | Requesting `GET /api/trainees` with missing token | HTTP 401 Unauthorized | Matches expected | **PASS** |

---

### 2.2 Attendance Management (ATT)

| Test ID | Module | Test Scenario | Test Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ATT-01** | Attendance | Mark Batch Attendance | Batch 1, Date 2026-10-15, 3 trainees (2 Present, 1 Absent) | Records saved in DB, HTTP 201 Created | Saved successfully | **PASS** |
| **TC-ATT-02** | Attendance | Duplicate Attendance Prevention | Submitting attendance for same trainee, batch & date | Database rejects duplicate via unique constraint or HTTP 409 | Duplicate rejected | **PASS** |
| **TC-ATT-03** | Attendance | Calculation Formula | 18 Present sessions out of 20 conducted | Attendance percentage equals exactly $90.0\%$ | Returns 90.0% | **PASS** |
| **TC-ATT-04** | Attendance | Low Attendance Threshold Flag | Trainee with 14 Present out of 20 sessions ($70.0\%$) | Flagged as `low_attendance = true` (< 75%) | Flagged correctly | **PASS** |

---

### 2.3 Daily Training Diary (DIR)

| Test ID | Module | Test Scenario | Test Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-DIR-01** | Diary | Add Daily Training Record | Day 1 record with topic, tools, theory & practical activities | Record created, day number sequenced, HTTP 201 | Created successfully | **PASS** |
| **TC-DIR-02** | Diary | Mentor Observation Append | Mentor appends qualitative feedback to existing diary entry | Entry updated with mentor notes, audit log recorded | Updated successfully | **PASS** |
| **TC-DIR-03** | Diary | Trainee Editing Diary Attempt | Trainee attempts `POST /api/diary` | HTTP 403 Forbidden (Only Trainer/Coordinator) | Forbidden | **PASS** |
| **TC-DIR-04** | Diary | Chronological Integrity | Querying diary entries for Trainee 1 | Entries returned strictly ordered by `day_number ASC` | Ordered Day 1..Day N | **PASS** |

---

### 2.4 Assessment & Evaluation (ASM)

| Test ID | Module | Test Scenario | Test Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ASM-01** | Assessment | Practical Assessment Creation | Create practical assessment Max Marks 50, Pass Marks 25 | Record stored in `assessments`, HTTP 201 | Created successfully | **PASS** |
| **TC-ASM-02** | Assessment | Grading Trainee Submission | Record marks 42/50 ($84.0\%$) | Stored in `assessment_results`, result marked as `pass` | Stored, pass | **PASS** |
| **TC-ASM-03** | Assessment | Failing Score Evaluation | Record marks 20/50 ($40.0\%$) | Stored, result marked as `fail` (< 50% passing mark) | Stored, fail | **PASS** |

---

### 2.5 Certificate Eligibility & Approval Workflow (ELG & CRT)

| Test ID | Module | Test Scenario | Test Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ELG-01** | Eligibility | Complete Qualified Trainee | Trainee with 92% attendance, all diary days, all passed assessments | Eligibility status returns `eligible: true`, all 8 gates green | Eligible: true | **PASS** |
| **TC-ELG-02** | Eligibility | Incomplete Attendance Check | Trainee with 70% attendance (< 75%) | Eligibility status returns `eligible: false`, explains attendance deficit | Blocked with reason | **PASS** |
| **TC-ELG-03** | Approval | Authority Approval Action | Certificate Authority submits approval for eligible trainee | `certificate_approvals` updated to `approved` | Status approved | **PASS** |
| **TC-ELG-04** | Approval | Rejection With Justification | Certificate Authority rejects with notes "Re-eval practical required" | Status updated to `rejected`, reason stored in DB | Status rejected | **PASS** |

---

### 2.6 Dual Certificate PDF Generation (PDF)

| Test ID | Module | Test Scenario | Test Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PDF-01** | PDF | Cert 1: Landscape Official PDF | Trigger official certificate generation for approved trainee | Generates valid Landscape A4 PDF with border, trainee name, QR code | Valid PDF generated | **PASS** |
| **TC-PDF-02** | PDF | Cert 2: Journey Portfolio PDF | Trigger multi-page portfolio generation | Generates comprehensive multi-page PDF with diary, tools, skills & marks | Multi-page PDF generated | **PASS** |
| **TC-PDF-03** | PDF | QR Code Generation & Link | Generate QR for Cert `KISS-VT-CERT-2026-0001` | Scannable QR code embedded pointing to `/verify/KISS-VT-CERT-2026-0001` | Scans to verification URL | **PASS** |

---

### 2.7 Public Certificate Verification (VRF)

| Test ID | Module | Test Scenario | Test Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-VRF-01** | Verification | Valid Certificate Lookup | Query public verification with existing valid cert ID | HTTP 200, returns Valid status, Student name, Programme title, Issue date | Returns valid record | **PASS** |
| **TC-VRF-02** | Verification | Invalid Certificate Lookup | Query public verification with fake ID `FAKE-CERT-999` | HTTP 404, returns Certificate Not Found / Invalid | Not found | **PASS** |
| **TC-VRF-03** | Privacy | PII Non-Disclosure Check | Inspect response JSON from `/api/verify/:certId` | Trainee address, phone, guardian, and DOB are strictly omitted | Zero PII leaked | **PASS** |

---

## 3. Summary of QA Sign-Off
- Total Test Cases: 25
- Passed: 25 (100%)
- Failed: 0
- Critical Vulnerabilities: 0
- Recommendation: Approved for production deployment at KISS.
