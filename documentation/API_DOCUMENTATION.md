# KISS-VTMS REST API Documentation
**Base URL:** `/api`  
**Authentication Scheme:** Bearer JWT (`Authorization: Bearer <token>`)  
**Response Format:** Standard JSON  
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```
**Error Format:**
```json
{
  "success": false,
  "error": "Error description message",
  "details": [ ... ]
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
- **Description:** Authenticates user credentials and issues a signed JWT token.
- **Access:** Public (Rate-limited: 10 req/min)
- **Request Body:**
  ```json
  {
    "email": "admin@kiss.ac.in",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "email": "admin@kiss.ac.in",
        "full_name": "System Administrator",
        "role_key": "super_admin",
        "role_name": "Super Administrator"
      }
    }
  }
  ```

### `GET /api/auth/me`
- **Description:** Retrieves the profile and assigned role metadata of the currently authenticated user.
- **Access:** Authenticated (Any role)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** Current user object with role and contextual profile (trainee, trainer, or mentor).

### `POST /api/auth/change-password`
- **Description:** Updates the logged-in user's password.
- **Access:** Authenticated (Any role)
- **Request Body:**
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewSecurePassword456!"
  }
  ```

---

## 2. Dashboard Endpoints (`/api/dashboard`)

### `GET /api/dashboard/stats`
- **Description:** Provides role-tailored summary cards and analytics.
- **Access:** Authenticated
- **Returns:**
  - For Admin: Total trainees, active programmes, trainers, mentors, batches, pending approvals, trade distribution, attendance rate.
  - For Coordinator: Batch progress, active enrolments, pending certifications.
  - For Trainer: Assigned batches, today's attendance status, pending diary entries.
  - For Mentor: Assigned mentees, low-attendance alerts, recent feedback.
  - For Trainee: Enrolled trade, attendance %, completed days, assessment average, certificate availability.

---

## 3. Trainee Management (`/api/trainees`)

### `GET /api/trainees`
- **Description:** Fetches list of registered trainees with optional search, trade filter, batch filter, and pagination.
- **Access:** Super Admin, Coordinator, Trainer, Mentor
- **Query Params:** `search`, `trade_id`, `batch_id`, `status`, `page`, `limit`

### `GET /api/trainees/:id`
- **Description:** Fetches full trainee dossier including demographic details, enrolments, attendance summary, assessments, and acquired skills.
- **Access:** Super Admin, Coordinator, Trainer, Mentor, or the Trainee themselves (`trainee.user_id === auth.id`).

### `POST /api/trainees`
- **Description:** Registers a new vocational trainee and creates their system account.
- **Access:** Super Admin, Coordinator
- **Request Body:**
  ```json
  {
    "full_name": "Sita Majhi",
    "email": "sita.majhi@student.kiss.ac.in",
    "password": "Password123!",
    "registration_no": "KISS-VT-2026-004",
    "dob": "2007-04-12",
    "gender": "Female",
    "tribal_community": "Santhal",
    "class_grade": "Grade 11",
    "department_id": 1,
    "address": "Mayurbhanj / KISS Campus",
    "guardian_name": "Ramu Majhi",
    "guardian_phone": "+91 9876543210",
    "enrollment_date": "2026-06-01"
  }
  ```

### `PUT /api/trainees/:id`
- **Description:** Updates trainee information.
- **Access:** Super Admin, Coordinator

---

## 4. Trades & Programmes (`/api/trades` & `/api/programmes`)

### `GET /api/trades` | `POST /api/trades` | `PUT /api/trades/:id`
- **Description:** CRUD for vocational trades (e.g. Computer Applications, Tailoring & Apparel Making, Food Processing, Handicrafts, Electrical Skills, Entrepreneurship).
- **Access:** Viewable by all; Modified by Super Admin.

### `GET /api/programmes` | `POST /api/programmes` | `PUT /api/programmes/:id`
- **Description:** Curriculum specification including objectives, scope, hours, duration, passing criteria, and modules.
- **Access:** Viewable by all; Modified by Coordinator, Super Admin.

### `GET /api/batches` | `POST /api/batches` | `PUT /api/batches/:id`
- **Description:** Cohort management under programmes.
- **Access:** Coordinator, Super Admin.

### `POST /api/batches/:id/enrol`
- **Description:** Enrols a trainee into a batch.
- **Access:** Coordinator, Super Admin.

---

## 5. Allocation Management (`/api/allocations`)

### `GET /api/allocations/trainers` | `POST /api/allocations/trainers`
- **Description:** Manages trainer assignments to batches.
- **Access:** Coordinator, Super Admin.

### `GET /api/allocations/mentors` | `POST /api/allocations/mentors`
- **Description:** Manages mentor assignments to trainees/batches.
- **Access:** Coordinator, Super Admin.

---

## 6. Attendance Management (`/api/attendance`)

### `GET /api/attendance`
- **Description:** Retrieves attendance records by batch and date.
- **Query Params:** `batch_id`, `session_date`
- **Access:** Trainer, Coordinator, Admin.

### `POST /api/attendance/mark`
- **Description:** Records daily session attendance for a list of trainees.
- **Access:** Trainer, Coordinator.
- **Request Body:**
  ```json
  {
    "batch_id": 1,
    "session_date": "2026-10-15",
    "session_number": 1,
    "records": [
      { "trainee_id": 1, "status": "present", "remarks": "On time" },
      { "trainee_id": 2, "status": "present", "remarks": "On time" },
      { "trainee_id": 3, "status": "absent", "remarks": "Medical leave requested" }
    ]
  }
  ```

### `GET /api/attendance/trainee/:traineeId`
- **Description:** Calculates cumulative attendance % and lists session breakdown.
- **Access:** Trainee, Trainer, Mentor, Coordinator, Admin.

---

## 7. Daily Training Diary (`/api/diary`)

### `GET /api/diary`
- **Description:** Retrieves day-wise training diary entries for a batch/trainee.
- **Query Params:** `batch_id`, `trainee_id`
- **Access:** All authenticated users.

### `POST /api/diary`
- **Description:** Creates a chronological daily training entry.
- **Access:** Trainer, Coordinator.
- **Request Body:**
  ```json
  {
    "batch_id": 1,
    "trainee_id": 1,
    "day_number": 14,
    "training_date": "2026-10-20",
    "topic_covered": "Advanced Pattern Grading and Cutting",
    "theoretical_activities": "Mathematical grading rules for multi-size pattern drafting.",
    "practical_activities": "Executed fabric layout, grainline alignment, and precision cutting using rotary shears.",
    "tools_equipment_used": "Rotary cutting machine, pattern grading rulers, tailoring shears, cutting mat.",
    "skills_learned": "Precision pattern grading, fabric wastage minimisation, industrial tool handling.",
    "learning_outcomes": "Trainee independently drafted and cut a multi-panel bodice pattern with zero measurement deviations.",
    "hours_spent": 4.5,
    "trainer_remarks": "Excellent precision and adherence to safety protocols."
  }
  ```

### `PUT /api/diary/:id/mentor-observation`
- **Description:** Mentor adds qualitative review to a daily diary entry.
- **Access:** Mentor.
- **Request Body:**
  ```json
  {
    "mentor_observations": "Trainee displayed high confidence in machinery handling and assisted peers."
  }
  ```

---

## 8. Assessments & Grading (`/api/assessments`)

### `GET /api/assessments` | `POST /api/assessments`
- **Description:** Manages assessment tasks (Theory, Practical, Project, Final).
- **Access:** Trainer, Coordinator.

### `POST /api/assessments/:id/results`
- **Description:** Submits grades and remarks for trainees.
- **Access:** Trainer.

---

## 9. Mentor Feedback (`/api/mentor-feedback`)

### `GET /api/mentor-feedback` | `POST /api/mentor-feedback`
- **Description:** Records formal mentoring interactions (areas discussed, strengths, improvements, recommendations).
- **Access:** Mentor, Coordinator, Super Admin.

---

## 10. Certificate Eligibility, Approvals & Dual PDF (`/api/certificates`)

### `GET /api/certificates/eligibility/:traineeId/:batchId`
- **Description:** Evaluates the 8-point eligibility criteria checklist:
  1. Active batch enrolment.
  2. Training schedule completed.
  3. Minimum attendance requirement met ($\ge 75\%$).
  4. Required training diary days documented.
  5. Required assessments completed.
  6. Passing marks achieved ($\ge 50\%$).
  7. Final trainer evaluation submitted.
  8. Mentor feedback logged.
- **Access:** Coordinator, Certificate Authority, Admin, Trainee.

### `POST /api/certificates/request-approval`
- **Description:** Submits a batch/trainee for Certificate Authority approval.
- **Access:** Coordinator.

### `POST /api/certificates/review-approval`
- **Description:** Certificate Authority approves or rejects certification.
- **Access:** Certificate Authority, Super Admin.

### `POST /api/certificates/generate`
- **Description:** Generates both official PDF documents upon approved status.
- **Access:** Certificate Authority, Coordinator, Super Admin.

### `GET /api/certificates/download/:id`
- **Description:** Streams the binary vector PDF for Certificate 1 (Landscape) or Certificate 2 (Journey Portfolio).
- **Access:** Authenticated trainee (for their own cert) or authorised staff.

---

## 11. Public Certificate Verification (`/api/verify`)

### `GET /api/verify/:certNumberOrHash`
- **Description:** Public verification endpoint (called via QR scan or web search).
- **Access:** Public (No authentication required)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "valid": true,
    "certificate_number": "KISS-VT-CERT-2026-0001",
    "trainee_name": "Sita Majhi",
    "programme_title": "Apparel Manufacturing & Fashion Technology",
    "trade_name": "Tailoring and Apparel Making",
    "issue_date": "2026-10-31",
    "status": "VALID",
    "institution": "Kalinga Institute of Social Sciences (KISS) Deemed to be University, Bhubaneswar"
  }
  ```
