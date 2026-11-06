# Relational Database Architecture & Design
## KISS Vocational Training Management System (KISS-VTMS)
**Database Engine:** Relational (MySQL 8.0+ / SQLite 3 Compatible)  
**Encoding:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`  
**Normalisation Level:** Third Normal Form (3NF)  

---

### 1. Database Overview & Entity-Relationship Strategy
The KISS-VTMS database is structured to support comprehensive auditability, referential integrity, and relational transparency across all vocational training stages. It incorporates 23 dedicated tables linked by explicit foreign keys with `ON DELETE RESTRICT` or `ON DELETE CASCADE` rules where appropriate.

```
                     +-------------------+
                     |       roles       |
                     +---------+---------+
                               | 1:N
                     +---------v---------+
                     |       users       |
                     +----+----+----+----+
                          |    |    |
        +-----------------+    |    +-----------------+
        | 1:1                  | 1:1                  | 1:1
+-------v-------+      +-------v-------+      +-------v-------+
|   trainees    |      |    trainers   |      |    mentors    |
+-------+-------+      +-------+-------+      +-------+-------+
        |                      |                      |
        | 1:N                  | 1:N                  | 1:N
+-------v-------------+ +------v--------------+ +-----v-------------+
|     enrolments      | | trainer_allocations | | mentor_allocations|
+-------+-------------+ +---------------------+ +-------------------+
        |
        | N:1
+-------v-------------+      +-------------------+
|       batches       +----->|    programmes     |
+-------+-------------+ 1:N  +---------+---------+
        |                              | 1:N
        |                              +------> training_modules
        |
        +------> attendance (1:N)
        +------> training_diary (1:N)
        +------> assessments (1:N) -------> assessment_results (1:N)
        +------> mentor_feedback (1:N)
        +------> certificate_approvals (1:N)
        +------> certificates (1:N)
```

---

### 2. Comprehensive Data Dictionary (23 Tables)

#### 1. `roles`
Stores standard system access tiers.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `role_key`: VARCHAR(30) UNIQUE NOT NULL (`super_admin`, `coordinator`, `trainer`, `mentor`, `trainee`, `cert_authority`)
- `name`: VARCHAR(60) NOT NULL
- `description`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 2. `users`
Central authentication credential and account state store.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `role_id`: INT NOT NULL, FK -> `roles(id)`
- `email`: VARCHAR(120) UNIQUE NOT NULL
- `password_hash`: VARCHAR(255) NOT NULL
- `full_name`: VARCHAR(100) NOT NULL
- `phone`: VARCHAR(25)
- `avatar_url`: VARCHAR(255)
- `is_active`: BOOLEAN DEFAULT TRUE
- `last_login`: DATETIME
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 3. `departments`
Academic and institutional departments at KISS.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `code`: VARCHAR(30) UNIQUE NOT NULL
- `name`: VARCHAR(120) NOT NULL
- `description`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 4. `trades`
Vocational trade domains offered within the institution.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `trade_code`: VARCHAR(30) UNIQUE NOT NULL (e.g., `TRD-COMP`, `TRD-TAILOR`)
- `name`: VARCHAR(100) NOT NULL
- `category`: VARCHAR(60) NOT NULL
- `description`: TEXT NOT NULL
- `skills_covered`: TEXT
- `required_equipment`: TEXT
- `training_level`: VARCHAR(40) DEFAULT 'Foundation'
- `status`: VARCHAR(20) DEFAULT 'active'
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 5. `trainees`
Extended demographic, tribal context, and academic profile for students.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `user_id`: INT UNIQUE NOT NULL, FK -> `users(id)` ON DELETE CASCADE
- `registration_no`: VARCHAR(40) UNIQUE NOT NULL
- `dob`: DATE NOT NULL
- `gender`: VARCHAR(15) NOT NULL
- `blood_group`: VARCHAR(10)
- `tribal_community`: VARCHAR(60)
- `class_grade`: VARCHAR(40) NOT NULL
- `department_id`: INT, FK -> `departments(id)`
- `address`: TEXT
- `district`: VARCHAR(60) DEFAULT 'Bhubaneswar'
- `state`: VARCHAR(60) DEFAULT 'Odisha'
- `guardian_name`: VARCHAR(100)
- `guardian_phone`: VARCHAR(25)
- `enrollment_date`: DATE NOT NULL
- `status`: VARCHAR(25) DEFAULT 'enrolled'
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 6. `trainers`
Faculty and vocational instructor profiles.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `user_id`: INT UNIQUE NOT NULL, FK -> `users(id)` ON DELETE CASCADE
- `employee_id`: VARCHAR(40) UNIQUE NOT NULL
- `department_id`: INT, FK -> `departments(id)`
- `specialization`: VARCHAR(120) NOT NULL
- `qualification`: VARCHAR(120) NOT NULL
- `experience_years`: INT DEFAULT 0
- `bio`: TEXT
- `status`: VARCHAR(25) DEFAULT 'active'
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 7. `mentors`
Dedicated faculty mentors responsible for pastoral and career tracking.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `user_id`: INT UNIQUE NOT NULL, FK -> `users(id)` ON DELETE CASCADE
- `employee_id`: VARCHAR(40) UNIQUE NOT NULL
- `department_id`: INT, FK -> `departments(id)`
- `designation`: VARCHAR(80) NOT NULL
- `area_of_expertise`: VARCHAR(120) NOT NULL
- `status`: VARCHAR(25) DEFAULT 'active'
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 8. `programmes`
Vocational training curricula with structured objectives and guidelines.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `programme_code`: VARCHAR(40) UNIQUE NOT NULL
- `title`: VARCHAR(150) NOT NULL
- `trade_id`: INT NOT NULL, FK -> `trades(id)`
- `description`: TEXT NOT NULL
- `objectives`: TEXT NOT NULL
- `scope`: TEXT NOT NULL
- `expected_outcomes`: TEXT NOT NULL
- `eligibility_requirements`: TEXT
- `duration_weeks`: INT NOT NULL
- `total_training_hours`: INT NOT NULL
- `methodology`: TEXT NOT NULL
- `assessment_criteria`: TEXT NOT NULL
- `completion_criteria`: TEXT NOT NULL
- `min_attendance_pct`: DECIMAL(5,2) DEFAULT 75.00
- `min_pass_pct`: DECIMAL(5,2) DEFAULT 50.00
- `status`: VARCHAR(25) DEFAULT 'active'
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 9. `training_modules`
Component units of study within a training programme.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `programme_id`: INT NOT NULL, FK -> `programmes(id)` ON DELETE CASCADE
- `module_number`: INT NOT NULL
- `title`: VARCHAR(120) NOT NULL
- `description`: TEXT
- `planned_hours`: INT NOT NULL
- `practical_ratio`: DECIMAL(4,2) DEFAULT 0.70
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 10. `batches`
Specific cohort execution of a training programme.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_code`: VARCHAR(40) UNIQUE NOT NULL
- `programme_id`: INT NOT NULL, FK -> `programmes(id)`
- `name`: VARCHAR(100) NOT NULL
- `start_date`: DATE NOT NULL
- `end_date`: DATE NOT NULL
- `capacity`: INT DEFAULT 30
- `status`: VARCHAR(25) DEFAULT 'in_progress' (`scheduled`, `in_progress`, `completed`, `archived`)
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 11. `enrolments`
Linking students to specific training batches.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `enrolment_date`: DATE NOT NULL
- `completion_status`: VARCHAR(25) DEFAULT 'active' (`active`, `completed`, `dropped`, `failed`)
- `final_grade`: VARCHAR(10)
- `final_percentage`: DECIMAL(5,2)
- `completion_date`: DATE
- `remarks`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_batch_trainee` UNIQUE (`batch_id`, `trainee_id`)

#### 12. `trainer_allocations`
Assigned trainers for batches.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `trainer_id`: INT NOT NULL, FK -> `trainers(id)`
- `assigned_date`: DATE NOT NULL
- `status`: VARCHAR(20) DEFAULT 'active'
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_batch_trainer` UNIQUE (`batch_id`, `trainer_id`)

#### 13. `mentor_allocations`
Dedicated mentor assignments to trainees.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `mentor_id`: INT NOT NULL, FK -> `mentors(id)`
- `assigned_date`: DATE NOT NULL
- `status`: VARCHAR(20) DEFAULT 'active'
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_mentor_assignment` UNIQUE (`batch_id`, `trainee_id`, `mentor_id`)

#### 14. `attendance`
Session-wise attendance records for each trainee.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `session_date`: DATE NOT NULL
- `session_number`: INT DEFAULT 1
- `status`: VARCHAR(20) NOT NULL (`present`, `absent`, `leave`)
- `remarks`: VARCHAR(255)
- `recorded_by`: INT NOT NULL, FK -> `users(id)`
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_trainee_session` UNIQUE (`batch_id`, `trainee_id`, `session_date`, `session_number`)

#### 15. `training_diary`
Chronological Day 1 to Day N vocational experiential records.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `module_id`: INT, FK -> `training_modules(id)`
- `day_number`: INT NOT NULL
- `training_date`: DATE NOT NULL
- `topic_covered`: VARCHAR(255) NOT NULL
- `theoretical_activities`: TEXT NOT NULL
- `practical_activities`: TEXT NOT NULL
- `tools_equipment_used`: TEXT NOT NULL
- `skills_learned`: TEXT NOT NULL
- `learning_outcomes`: TEXT NOT NULL
- `hours_spent`: DECIMAL(4,1) DEFAULT 4.0
- `trainer_remarks`: TEXT
- `mentor_observations`: TEXT
- `photo_url`: VARCHAR(255)
- `created_by`: INT NOT NULL, FK -> `users(id)`
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_trainee_day` UNIQUE (`batch_id`, `trainee_id`, `day_number`)

#### 16. `assessments`
Scheduled evaluations, tests, practical exams, and assignments.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `programme_id`: INT NOT NULL, FK -> `programmes(id)`
- `title`: VARCHAR(150) NOT NULL
- `assessment_type`: VARCHAR(30) NOT NULL (`theoretical`, `practical`, `assignment`, `project`, `final`)
- `max_marks`: DECIMAL(5,2) NOT NULL
- `passing_marks`: DECIMAL(5,2) NOT NULL
- `weightage_pct`: DECIMAL(5,2) DEFAULT 20.00
- `evaluation_date`: DATE NOT NULL
- `created_by`: INT NOT NULL, FK -> `users(id)`
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 17. `assessment_results`
Individual student scores on assessments.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `assessment_id`: INT NOT NULL, FK -> `assessments(id)` ON DELETE CASCADE
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `marks_obtained`: DECIMAL(5,2) NOT NULL
- `percentage`: DECIMAL(5,2) NOT NULL
- `result`: VARCHAR(20) NOT NULL (`pass`, `fail`)
- `trainer_remarks`: TEXT
- `evaluated_by`: INT NOT NULL, FK -> `users(id)`
- `evaluated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_trainee_assessment` UNIQUE (`assessment_id`, `trainee_id`)

#### 18. `mentor_feedback`
Recorded mentoring sessions and holistic evaluations.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `mentor_id`: INT NOT NULL, FK -> `mentors(id)`
- `session_date`: DATE NOT NULL
- `areas_discussed`: TEXT NOT NULL
- `strengths`: TEXT NOT NULL
- `improvement_areas`: TEXT NOT NULL
- `recommendations`: TEXT NOT NULL
- `overall_observations`: TEXT NOT NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 19. `skills`
Master catalog of vocational competencies and trade skills.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `trade_id`: INT NOT NULL, FK -> `trades(id)`
- `name`: VARCHAR(120) NOT NULL
- `category`: VARCHAR(60) NOT NULL
- `description`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 20. `trainee_skills`
Competencies mastered and verified for each trainee.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `skill_id`: INT NOT NULL, FK -> `skills(id)`
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `proficiency_level`: VARCHAR(30) DEFAULT 'Competent' (`Beginner`, `Intermediate`, `Competent`, `Advanced`)
- `assessed_date`: DATE NOT NULL
- `certified`: BOOLEAN DEFAULT TRUE
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT `uq_trainee_skill` UNIQUE (`trainee_id`, `skill_id`, `batch_id`)

#### 21. `certificate_approvals`
Audit gate for Certificate Authority validation.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `requested_by`: INT NOT NULL, FK -> `users(id)`
- `authority_id`: INT, FK -> `users(id)`
- `status`: VARCHAR(25) DEFAULT 'pending' (`pending`, `approved`, `rejected`)
- `attendance_verified`: BOOLEAN DEFAULT FALSE
- `assessments_verified`: BOOLEAN DEFAULT FALSE
- `trainer_eval_verified`: BOOLEAN DEFAULT FALSE
- `mentor_feedback_verified`: BOOLEAN DEFAULT FALSE
- `rejection_reason`: TEXT
- `approval_notes`: TEXT
- `approved_at`: DATETIME
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 22. `certificates`
Official issued credential metadata, hashes, and document links.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `certificate_number`: VARCHAR(60) UNIQUE NOT NULL
- `verification_hash`: VARCHAR(64) UNIQUE NOT NULL
- `trainee_id`: INT NOT NULL, FK -> `trainees(id)`
- `batch_id`: INT NOT NULL, FK -> `batches(id)`
- `programme_id`: INT NOT NULL, FK -> `programmes(id)`
- `certificate_type`: VARCHAR(30) NOT NULL (`completion_certificate`, `journey_portfolio`)
- `issue_date`: DATE NOT NULL
- `valid_until`: DATE
- `qr_code_data`: TEXT NOT NULL
- `file_path`: VARCHAR(255) NOT NULL
- `status`: VARCHAR(25) DEFAULT 'valid' (`valid`, `revoked`, `superseded`)
- `issued_by`: INT NOT NULL, FK -> `users(id)`
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

#### 23. `audit_logs`
Immutable compliance trace of all sensitive mutations.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `user_id`: INT, FK -> `users(id)`
- `action`: VARCHAR(60) NOT NULL
- `entity_type`: VARCHAR(60) NOT NULL
- `entity_id`: VARCHAR(60)
- `ip_address`: VARCHAR(45)
- `user_agent`: VARCHAR(255)
- `details`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

---

### 3. Indexes & Performance Optimization
- `idx_users_email` on `users(email)`
- `idx_trainees_reg_no` on `trainees(registration_no)`
- `idx_attendance_batch_date` on `attendance(batch_id, session_date)`
- `idx_diary_batch_trainee` on `training_diary(batch_id, trainee_id, day_number)`
- `idx_cert_hash` on `certificates(verification_hash)`
- `idx_cert_number` on `certificates(certificate_number)`
- `idx_audit_created` on `audit_logs(created_at)`
