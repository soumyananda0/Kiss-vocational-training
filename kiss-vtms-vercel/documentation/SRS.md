# Software Requirements Specification (SRS)
## KISS Vocational Training Management System (KISS-VTMS)
**Document Version:** 1.0.0  
**Institution:** Kalinga Institute of Social Sciences (KISS) Deemed to be University, Bhubaneswar, Odisha  
**Application Name:** KISS Vocational Training Management System (KISS-VTMS)  
**Date:** October 2026  
**Status:** Approved Architectural Baseline  

---

### 1. Introduction
The **KISS Vocational Training Management System (KISS-VTMS)** is an enterprise web-based educational management and vocational tracking platform engineered for the Kalinga Institute of Social Sciences (KISS), Bhubaneswar, Odisha. KISS provides comprehensive residential education and vocational empowerment to indigenous and underprivileged students. KISS-VTMS centralises, standardises, monitors, and digitises vocational trade education, ensuring transparent tracking from trainee enrolment through daily experiential learning, practical assessments, mentor guidance, and dual-document certification.

### 2. Purpose
The purpose of KISS-VTMS is to replace fragmented manual registers with an integrated relational platform that:
- Maintains granular, verifiable trainee vocational profiles.
- Tracks day-by-day practical and theoretical activities across diverse vocational trades.
- Enforces institutional governance, attendance integrity, and multi-stakeholder assessment.
- Automates the rigorous verification and issuance of two distinct post-completion credentials:
  1. **Official Training Completion Certificate** (Landscape A4, QR-verifiable).
  2. **Detailed Trainee Vocational Training Profile and Learning Journey Portfolio** (Multi-page comprehensive dossier).
- Guarantees student data privacy with strict Role-Based Access Control (RBAC).

### 3. Scope
The system encompasses the complete lifecycle of vocational training at KISS:
- **Trainee Enrolment & Profile Management**: Registration, tribal community context, department, trade allotment, and cohort status.
- **Trade & Programme Architecture**: Vocational trades (e.g., Computer Applications, Tailoring & Apparel Making, Food Processing, Handicrafts, Electrical Skills, Entrepreneurship) and structured modular syllabi.
- **Allocation Engine**: Conflict-free allocation of qualified trainers and dedicated mentors to training batches and individual students.
- **Attendance Registry**: Session-level attendance marking, cumulative percentage calculation, and automated low-attendance thresholds.
- **Daily Training Diary**: Chronological Day 1 to Day N documentation of topics, practical tasks, machinery/tools used, skills acquired, and observations.
- **Assessment & Grading**: Formative and summative evaluation of theory, practical demonstrations, assignments, and capstone projects.
- **Mentorship Feedback**: Qualitative mentoring sessions, identifying strengths, intervention areas, and career recommendations.
- **Dual-Certificate Workflow**: Strict multi-criteria eligibility validation engine and digital signing/QR generation.
- **Public Verification Portal**: Cryptographically tamper-resistant QR-based verification without exposing sensitive student PII.

---

### 4. Product Perspective
KISS-VTMS operates as a self-contained, three-tier cloud/on-premise educational SaaS solution:
```
[ Client Presentation Tier: Responsive React SPA / Tailwind CSS / Recharts ]
                             | (HTTPS / REST API / JWT)
[ Application Logic Tier: Node.js Express Engine / RBAC / PDFKit / QR Engine ]
                             | (SQL Relational Driver / Connection Pool)
[ Data Persistence Tier: Relational Database (MySQL / SQLite Compatible) ]
```
The system interfaces with standard web browsers across desktop, tablet, and mobile displays.

---

### 5. Product Functions
The high-level capabilities of KISS-VTMS include:
1. **Multi-Role Authentication & Session Security**: Secure token-based access with automatic role redirection and session expiration.
2. **Role-Tailored Executive & Operational Dashboards**: Summary metrics, attendance analytics, programme progression, and approval alerts.
3. **Vocational Trade & Curriculum Cataloguing**: Definition of competencies, tools required, and certification thresholds.
4. **Cohort & Batch Scheduling**: Scheduling training batches with capacity constraints and calendar dates.
5. **Session Attendance Tracking**: Real-time attendance computation with minimum compliance gates (e.g., $\ge 75\%$).
6. **Chronological Day-Wise Diary**: Tamper-audited daily records of tools, materials, skills, and trainer notes.
7. **Assessment Engine**: Practical scoring, theoretical tests, grade point calculations, and weighted averages.
8. **Holistic Mentorship Tracking**: Structured recording of student behavioural, vocational, and emotional growth.
9. **Eligibility Gatekeeper**: Automatic 8-point eligibility audit before certificate issuance can be requested or approved.
10. **Dual PDF Document Engine**:
    - Landscape vector A4 completion certificate with institutional styling and verification QR code.
    - Multi-page learning journey portfolio detailing full chronological diary entries, assessments, and signatures.
11. **Public Zero-PII QR Verification**: Validation portal returning verification status, candidate name, programme, and issue date.
12. **System Audit Logging**: Comprehensive audit trail recording user actions, timestamps, IP context, and modified entities.

---

### 6. User Classes and Characteristics
The platform enforces six distinct user classes with defined permissions:

| User Class | Description & Operational Responsibilities | Tech Savviness |
| :--- | :--- | :--- |
| **Super Administrator** | Oversees entire institution configuration, manages user accounts, creates trades/departments, audits system security logs, and manages global settings. | High |
| **Training Coordinator** | Creates training programmes, batches, syllabus modules; registers trainees; assigns trainers and mentors; reviews batch completion eligibility. | Medium-High |
| **Trainer / Teacher** | Manages assigned batches; marks daily attendance; logs daily training diary entries; conducts practical/theory assessments; submits performance reviews. | Medium |
| **Mentor** | Reviews assigned trainees; inspects daily learning progress; conducts structured mentoring sessions; records behavioural and vocational guidance. | Medium |
| **Trainee / Student** | Views personal profile, training schedule, daily diary, attendance %, acquired skills, assessment scores, and downloads approved certificates. | Basic-Medium |
| **Certificate Authority** | Reviews completed training cohorts; validates attendance and assessment criteria; formally approves or rejects certificate issuance requests. | High |

---

### 7. Operating Environment
- **Server OS**: Cross-platform (Windows Server 2019/2022, Ubuntu Linux 22.04 LTS / Debian).
- **Runtime Environment**: Node.js v18.x - v22.x LTS.
- **Database Engine**: MySQL 8.0+ / MariaDB 10.6+ or relational SQLite driver with complete relational schema.
- **Client Web Browsers**: Chrome 90+, Mozilla Firefox 88+, Microsoft Edge 90+, Safari 14+, modern mobile browsers.
- **Network Protocol**: HTTP/1.1 and HTTP/2 over TLS 1.3.

---

### 8. Design and Implementation Constraints
1. **Data Normalisation**: Relational 3NF architecture with foreign keys, cascading constraints, and audit timestamps.
2. **Zero-PII Leakage**: Public verification must never reveal birth date, address, phone numbers, or caste/tribe classification.
3. **Deterministic PDFs**: Vector-rendered PDF documents with fixed page budgeting, readable font scaling, and crisp print layouts.
4. **Institutional Integrity**: No hardcoded dummy logos or unverified official data; transparent placeholder branding.
5. **Offline/Local Resilience**: System must operate reliably without third-party cloud SaaS dependencies.

---

### 9. Assumptions and Dependencies
- Trainees are assigned unique institutional identification numbers (e.g., `KISS-VT-2026-001`).
- Trainers have daily access to desktop or mobile devices to mark attendance and diary entries.
- The standard pass mark across vocational programmes is fixed at $\ge 50\%$, and attendance requirement is $\ge 75\%$.

---

### 10. Business Requirements
- **BR-101**: Trainee vocational journeys must be fully auditable from Day 1 to final completion.
- **BR-102**: Certificates cannot be created without independent verification by the Certificate Authority.
- **BR-103**: Every issued certificate must bear a cryptographically verifiable unique identifier and scannable QR code.
- **BR-104**: The learning journey portfolio must document empirical evidence of practical equipment used and skills mastered.

---

### 11. Business Requirement Responses
- **BRR-101**: Implementation of `training_diary` and `audit_logs` relational tables with timestamps and user identifiers.
- **BRR-102**: Multi-stage state machine (`Pending Review` $\rightarrow$ `Eligibility Verified` $\rightarrow$ `Authority Approved` $\rightarrow$ `Issued`).
- **BRR-103**: Unique UUIDv4 / institutional serial hashing linked to a dedicated `/verify/:certId` public route.
- **BRR-104**: Multi-page PDF generation engine compiling day-wise entries, assessment grades, and mentor evaluations.

---

### 12. Functional Requirements with Unique IDs

#### Authentication & Security (FR-AUTH)
- `FR-AUTH-001`: System shall allow users to log in using unique email/username and password.
- `FR-AUTH-002`: System shall securely hash passwords using bcrypt (work factor $\ge 10$).
- `FR-AUTH-003`: System shall issue JSON Web Tokens (JWT) containing user ID, role, and expiry timestamp.
- `FR-AUTH-004`: System shall restrict access to API endpoints based on authenticated role permissions.
- `FR-AUTH-005`: System shall log all authentication attempts and invalidate revoked sessions.

#### Dashboard Management (FR-DASH)
- `FR-DASH-001`: Administrator dashboard shall display metrics for trainees, active programmes, trainers, mentors, batches, and pending certificate requests.
- `FR-DASH-002`: Coordinator dashboard shall show batch completion timelines, enrolment statistics, and trainer workloads.
- `FR-DASH-003`: Trainer dashboard shall provide immediate shortcuts to mark attendance and input today's diary.
- `FR-DASH-004`: Mentor dashboard shall display assigned mentees, flagged low-attendance alerts, and pending reviews.
- `FR-DASH-005`: Trainee dashboard shall show personal progress %, attendance percentage, skills badges, and certificates.

#### Trainee Management (FR-TRN)
- `FR-TRN-001`: Coordinators and Admins shall register trainees with full name, unique ID, DOB, gender, grade, department, contact, and enrollment date.
- `FR-TRN-002`: System shall provide search, multi-attribute filtering (trade, batch, gender, status), and pagination.
- `FR-TRN-003`: System shall generate comprehensive trainee profiles detailing all active and completed vocational programs.

#### Trade & Programme Management (FR-TRD & FR-PRG)
- `FR-TRD-001`: Admins shall create, update, and toggle vocational trades (e.g., Computer Applications, Food Processing).
- `FR-PRG-001`: Coordinators shall create training programmes with title, trade ID, scope, objectives, total hours, duration, start/end dates, and passing criteria.
- `FR-PRG-002`: Coordinators shall create training batches under programmes with start date, end date, and capacity.

#### Allocation Management (FR-ALC)
- `FR-ALC-001`: Coordinators shall assign one or more trainers to training batches.
- `FR-ALC-002`: Coordinators shall assign mentors to individual trainees or batches.
- `FR-ALC-003`: System shall prevent conflicting overlapping trainer assignments.
- `FR-ALC-004`: System shall preserve full allocation history upon re-assignment.

#### Attendance Management (FR-ATT)
- `FR-ATT-001`: Trainers shall record batch session attendance selecting Present, Absent, or Leave.
- `FR-ATT-002`: System shall prevent duplicate attendance records for the same trainee and date.
- `FR-ATT-003`: System shall compute Attendance Percentage:
  $$\text{Attendance \%} = \left(\frac{\text{Sessions Present}}{\text{Total Conducted Sessions}}\right) \times 100$$
- `FR-ATT-004`: System shall trigger a low-attendance flag when attendance drops below 75%.

#### Daily Training Diary (FR-DIR)
- `FR-DIR-001`: Trainers shall record day-wise chronological logs (Day 1 to Final Day).
- `FR-DIR-002`: Daily entry fields shall include: Training Date, Day Number, Topic Covered, Theoretical Activities, Practical Activities, Tools/Machinery Used, Skills Learned, Hours Spent, Trainer Remarks, and Mentor Observations.
- `FR-DIR-003`: Mentors shall be permitted to review daily entries and append qualitative observations.
- `FR-DIR-004`: All updates shall create an immutable audit trail entry.

#### Assessment & Grading (FR-ASM)
- `FR-ASM-001`: Trainers shall record assessments categorized as Theoretical, Practical, Assignment, Project, or Final Evaluation.
- `FR-ASM-002`: Fields shall include: Max Marks, Marks Obtained, Percentage, Evaluation Date, Trainer Remarks, and Pass/Fail result.
- `FR-ASM-003`: System shall calculate weighted cumulative programme grades.

#### Mentorship Feedback (FR-MTR)
- `FR-MTR-001`: Mentors shall log mentoring sessions with date, discussion areas, observed strengths, improvement needs, and recommendations.
- `FR-MTR-002`: Mentoring logs shall link directly into the trainee's permanent portfolio.

#### Certificate Generation & Issuance (FR-CRT)
- `FR-CRT-001`: System shall evaluate an 8-point eligibility gate before certificate issuance can be requested.
- `FR-CRT-002`: Certificate Authority shall approve or reject issuance requests with formal justification remarks.
- `FR-CRT-003`: Upon approval, system shall generate **Certificate 1**: Official Landscape A4 Training Completion Certificate with gold/navy borders and QR code.
- `FR-CRT-004`: System shall generate **Certificate 2**: Detailed Multi-Page Trainee Profile & Learning Journey Portfolio containing complete day-by-day training diary entries, practical tools, skills acquired, and assessment marks.
- `FR-CRT-005`: Trainees and staff shall be able to preview and download both PDFs directly.

#### Certificate Verification (FR-VRF)
- `FR-VRF-001`: System shall provide a public verification page accessible via QR code scan or manual certificate ID entry.
- `FR-VRF-002`: Verification page shall output certificate validity, trainee name, programme, trade, and issuance date, strictly omitting private personal data.

---

### 13. Non-Functional Requirements (NFR)
- `NFR-SEC-001`: Passwords hashed with bcrypt; JWT tokens signed with SHA-256 and 24-hour expiration.
- `NFR-SEC-002`: All SQL queries parameterized to eliminate SQL injection vulnerabilities.
- `NFR-SEC-003`: Rate limiting on `/api/auth/login` to prevent brute-force attacks (max 10 requests per minute).
- `NFR-PERF-001`: API responses return within 250ms under typical institutional load (100 concurrent requests).
- `NFR-PERF-002`: Vector PDF certificate generation completes within 1.5 seconds.
- `NFR-AVAIL-001`: System uptime target $\ge 99.5\%$ with local database backup capability.
- `NFR-USA-001`: UI conforms to WCAG 2.1 AA accessibility contrast standards; fully responsive down to 360px mobile viewports.

---

### 14. External Interface Requirements
- **Web UI**: Modern Single Page Application (SPA) built with React and Tailwind CSS.
- **RESTful APIs**: JSON payload exchanges over standard HTTP verbs (GET, POST, PUT, DELETE).
- **Print & PDF**: Portable Document Format (PDF 1.4+ standards-compliant vector generation).

---

### 15. Data Requirements & Retention
- Trainee and certification records are permanent institutional records retained indefinitely.
- Daily attendance and training diary entries are immutable once batch certification is finalized.
- Audit logs retain all mutation operations for a minimum of 7 academic years.

---

### 16. Business Rules (BR)
1. **BR-01 (Attendance Gate)**: Trainees must achieve at least 75% attendance in conducted sessions to qualify for certificate issuance.
2. **BR-02 (Passing Score)**: Trainees must achieve an aggregate assessment score of at least 50% across all required assessments.
3. **BR-03 (Diary Completeness)**: The number of documented training diary days must match the minimum curriculum requirement for the programme.
4. **BR-04 (Dual Signature Protocol)**: A certificate is only valid when verified and approved by the Certificate Authority with a recorded timestamp and digital verification hash.
5. **BR-05 (Data Minimisation in Public Verification)**: Public verification data is strictly limited to Candidate Name, Trade, Programme Title, Issue Date, and Authenticity Status.

---

### 17. Acceptance Criteria
1. Super Admin can manage users, roles, trades, and inspect global audit logs.
2. Training Coordinator can schedule programmes, define batches, and allocate trainers/mentors.
3. Trainer can mark session attendance, input daily diary entries with tools and skills, and record marks.
4. Mentor can review diary entries, inspect attendance warnings, and submit qualitative mentorship logs.
5. Trainee can log in, view their real-time journey timeline, and download both issued PDF documents.
6. Certificate Authority can inspect the 8-point eligibility checklist and approve or reject issuance.
7. Generating Certificate 1 yields a landscape A4 PDF with verification QR code.
8. Generating Certificate 2 yields a multi-page portfolio dossier including all daily diary entries.
9. Scanning the QR code resolves to the public verification endpoint confirming certificate validity.
