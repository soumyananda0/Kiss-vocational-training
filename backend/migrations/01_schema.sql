-- KISS-VTMS Relational Database Schema (23 Tables)
-- Compatible with MySQL 8.0+ and SQLite 3

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_key VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(60) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(25),
  avatar_url VARCHAR(255),
  is_active INTEGER DEFAULT 1,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  skills_covered TEXT,
  required_equipment TEXT,
  training_level VARCHAR(40) DEFAULT 'Foundation',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  registration_no VARCHAR(40) UNIQUE NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(15) NOT NULL,
  blood_group VARCHAR(10),
  tribal_community VARCHAR(60),
  class_grade VARCHAR(40) NOT NULL,
  department_id INTEGER,
  address TEXT,
  district VARCHAR(60) DEFAULT 'Bhubaneswar',
  state VARCHAR(60) DEFAULT 'Odisha',
  guardian_name VARCHAR(100),
  guardian_phone VARCHAR(25),
  enrollment_date DATE NOT NULL,
  status VARCHAR(25) DEFAULT 'enrolled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS trainers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  employee_id VARCHAR(40) UNIQUE NOT NULL,
  department_id INTEGER,
  specialization VARCHAR(120) NOT NULL,
  qualification VARCHAR(120) NOT NULL,
  experience_years INTEGER DEFAULT 0,
  bio TEXT,
  status VARCHAR(25) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS mentors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  employee_id VARCHAR(40) UNIQUE NOT NULL,
  department_id INTEGER,
  designation VARCHAR(80) NOT NULL,
  area_of_expertise VARCHAR(120) NOT NULL,
  status VARCHAR(25) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS programmes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  programme_code VARCHAR(40) UNIQUE NOT NULL,
  title VARCHAR(150) NOT NULL,
  trade_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT NOT NULL,
  scope TEXT NOT NULL,
  expected_outcomes TEXT NOT NULL,
  eligibility_requirements TEXT,
  duration_weeks INTEGER NOT NULL,
  total_training_hours INTEGER NOT NULL,
  methodology TEXT NOT NULL,
  assessment_criteria TEXT NOT NULL,
  completion_criteria TEXT NOT NULL,
  min_attendance_pct REAL DEFAULT 75.0,
  min_pass_pct REAL DEFAULT 50.0,
  status VARCHAR(25) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trade_id) REFERENCES trades(id)
);

CREATE TABLE IF NOT EXISTS training_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  programme_id INTEGER NOT NULL,
  module_number INTEGER NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  planned_hours INTEGER NOT NULL,
  practical_ratio REAL DEFAULT 0.70,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_code VARCHAR(40) UNIQUE NOT NULL,
  programme_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  capacity INTEGER DEFAULT 30,
  status VARCHAR(25) DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (programme_id) REFERENCES programmes(id)
);

CREATE TABLE IF NOT EXISTS enrolments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  trainee_id INTEGER NOT NULL,
  enrolment_date DATE NOT NULL,
  completion_status VARCHAR(25) DEFAULT 'active',
  final_grade VARCHAR(10),
  final_percentage REAL,
  completion_date DATE,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  UNIQUE (batch_id, trainee_id)
);

CREATE TABLE IF NOT EXISTS trainer_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  trainer_id INTEGER NOT NULL,
  assigned_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (trainer_id) REFERENCES trainers(id),
  UNIQUE (batch_id, trainer_id)
);

CREATE TABLE IF NOT EXISTS mentor_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  trainee_id INTEGER NOT NULL,
  mentor_id INTEGER NOT NULL,
  assigned_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  FOREIGN KEY (mentor_id) REFERENCES mentors(id),
  UNIQUE (batch_id, trainee_id, mentor_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  trainee_id INTEGER NOT NULL,
  session_date DATE NOT NULL,
  session_number INTEGER DEFAULT 1,
  status VARCHAR(20) NOT NULL,
  remarks VARCHAR(255),
  recorded_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  UNIQUE (batch_id, trainee_id, session_date, session_number)
);

CREATE TABLE IF NOT EXISTS training_diary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  trainee_id INTEGER NOT NULL,
  module_id INTEGER,
  day_number INTEGER NOT NULL,
  training_date DATE NOT NULL,
  topic_covered VARCHAR(255) NOT NULL,
  theoretical_activities TEXT NOT NULL,
  practical_activities TEXT NOT NULL,
  tools_equipment_used TEXT NOT NULL,
  skills_learned TEXT NOT NULL,
  learning_outcomes TEXT NOT NULL,
  hours_spent REAL DEFAULT 4.0,
  trainer_remarks TEXT,
  mentor_observations TEXT,
  photo_url VARCHAR(255),
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  FOREIGN KEY (module_id) REFERENCES training_modules(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE (batch_id, trainee_id, day_number)
);

CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  programme_id INTEGER NOT NULL,
  title VARCHAR(150) NOT NULL,
  assessment_type VARCHAR(30) NOT NULL,
  max_marks REAL NOT NULL,
  passing_marks REAL NOT NULL,
  weightage_pct REAL DEFAULT 20.0,
  evaluation_date DATE NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (programme_id) REFERENCES programmes(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL,
  trainee_id INTEGER NOT NULL,
  marks_obtained REAL NOT NULL,
  percentage REAL NOT NULL,
  result VARCHAR(20) NOT NULL,
  trainer_remarks TEXT,
  evaluated_by INTEGER NOT NULL,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  FOREIGN KEY (evaluated_by) REFERENCES users(id),
  UNIQUE (assessment_id, trainee_id)
);

CREATE TABLE IF NOT EXISTS mentor_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  trainee_id INTEGER NOT NULL,
  mentor_id INTEGER NOT NULL,
  session_date DATE NOT NULL,
  areas_discussed TEXT NOT NULL,
  strengths TEXT NOT NULL,
  improvement_areas TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  overall_observations TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  FOREIGN KEY (mentor_id) REFERENCES mentors(id)
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trade_id) REFERENCES trades(id)
);

CREATE TABLE IF NOT EXISTS trainee_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainee_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  batch_id INTEGER NOT NULL,
  proficiency_level VARCHAR(30) DEFAULT 'Competent',
  assessed_date DATE NOT NULL,
  certified INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id),
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  UNIQUE (trainee_id, skill_id, batch_id)
);

CREATE TABLE IF NOT EXISTS certificate_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  trainee_id INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  authority_id INTEGER,
  status VARCHAR(25) DEFAULT 'pending',
  attendance_verified INTEGER DEFAULT 0,
  assessments_verified INTEGER DEFAULT 0,
  trainer_eval_verified INTEGER DEFAULT 0,
  mentor_feedback_verified INTEGER DEFAULT 0,
  rejection_reason TEXT,
  approval_notes TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (authority_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_number VARCHAR(60) UNIQUE NOT NULL,
  verification_hash VARCHAR(64) UNIQUE NOT NULL,
  trainee_id INTEGER NOT NULL,
  batch_id INTEGER NOT NULL,
  programme_id INTEGER NOT NULL,
  certificate_type VARCHAR(30) NOT NULL,
  issue_date DATE NOT NULL,
  valid_until DATE,
  qr_code_data TEXT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  status VARCHAR(25) DEFAULT 'valid',
  issued_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainee_id) REFERENCES trainees(id),
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (programme_id) REFERENCES programmes(id),
  FOREIGN KEY (issued_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action VARCHAR(60) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id VARCHAR(60),
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
