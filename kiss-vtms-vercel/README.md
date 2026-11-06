# KISS Vocational Training Management System (KISS-VTMS)

**Institution:** Kalinga Institute of Social Sciences (KISS) Deemed to be University, Bhubaneswar, Odisha, India  
**Application Name:** KISS Vocational Training Management System (KISS-VTMS)  
**System Architecture:** Modern Three-Tier Educational SaaS (React + Node.js/Express + Relational Database)  
**Status:** Fully Functional Production Architecture & Demonstration Baseline  

---

## 1. Project Overview & Institutional Purpose

The **KISS Vocational Training Management System (KISS-VTMS)** is an integrated, enterprise-grade educational management platform custom-built to digitally manage, monitor, and certify vocational training programmes conducted for KISS students in Bhubaneswar, Odisha.

KISS is the world's largest residential educational institution dedicated exclusively to indigenous tribal students. KISS-VTMS centralises vocational education, empowering students through verifiable experiential skill tracking. The system captures the complete trajectory of every trainee from registration and batch allocation through daily experiential logs, workshop machinery handling, modular assessments, pastoral mentor feedback, and dual-document certification.

### The Differentiating Core: Two Distinct Post-Completion Documents
Upon fulfilling all institutional completion requirements and securing Certificate Authority sign-off, KISS-VTMS generates two separate, high-resolution vector PDF documents:

1. **Official Training Completion Certificate (Landscape A4)**  
   - Premium institutional layout with navy-blue (`#1E3A8A`) and gold accents.
   - KISS university branding, trainee registration ID, vocational trade, training duration dates, and authorized signatories.
   - Embedded high-density verification QR code resolving to the public verification endpoint.
2. **Detailed Trainee Vocational Training Profile & Complete Learning Journey Portfolio (Multi-Page PDF Dossier)**  
   - Comprehensive 20-section dossier documenting the candidate's complete journey from Day 1 to the final day.
   - Includes real empirical data from the database: full day-wise chronological training diary, tools and machinery operated, competencies mastered, attendance registry breakdown, modular assessment scores, trainer reviews, qualitative mentor feedback, capstone projects, and digital seal.

---

## 2. Key Modules & Capabilities

- **Module 1: Authentication & RBAC**: Secure JWT-based access with bcrypt password hashing (10 rounds), session expiration, rate limiting, and role-tailored dashboards.
- **Module 2: 6 Role-Specific Dashboards**: Operational summaries, Recharts visualizations (trade distribution, completion pipeline), and action shortcuts tailored for all 6 institutional roles.
- **Module 3: Trainee Demographic & Tribal Context Management**: Trainee records capturing tribal community (e.g. Santhal, Ho, Munda), district of origin, grade, department, and guardian information without exposing PII to unauthorized users.
- **Module 4: Vocational Trade Catalog**: Structured vocational trades including *Tailoring & Apparel Making*, *Computer Applications & Digital Literacy*, *Food Processing & Preservation*, *Handicrafts & Tribal Art Product Design*, *Basic Electrical & Solar Maintenance*, and *Rural Micro-Entrepreneurship*.
- **Module 5: Training Programmes & Modular Syllabi**: Curricula with objectives, scopes, methodologies, total instructional hours, and minimum compliance criteria ($\ge 75\%$ attendance, $\ge 50\%$ pass mark).
- **Module 6: Faculty & Mentor Allocation Engine**: Conflict-free allocation of master trainers and pastoral mentors to batches and individual students.
- **Module 7: Session Attendance Registry**: Date-wise session marking (`Present`, `Absent`, `Leave`), automated attendance percentage computation:
  $$\text{Attendance \%} = \left(\frac{\text{Conducted Sessions Present}}{\text{Total Conducted Sessions}}\right) \times 100$$
  with automatic alerts for attendance below $75\%$.
- **Module 8: Chronological Daily Training Diary (Central Module)**: Day 1 to Day N empirical logs capturing topic, theory, practical activities, tools/machinery used, skills learned, hours spent, trainer remarks, and mentor observations.
- **Module 9: Assessment & Grading**: Formative and summative evaluation across theoretical tests, practical demonstrations, projects, and final capstone evaluations with automatic percentage and pass/fail grading.
- **Module 10: Qualitative Mentor Feedback**: Holistic pastoral session logging, capturing student strengths, areas for improvement, and career recommendations.
- **Module 11: 8-Point Certificate Eligibility Gatekeeper**: Evaluates 8 distinct statutory gates before certificate issuance can be requested or approved.
- **Module 12: Certificate Authority Workflow & Dual PDF Generator**: Multi-tier sign-off mechanism triggering backend vector PDF generation (PDFKit + QRCode).
- **Module 13: Public QR-Based Certificate Verification**: Dedicated `/verify/:certNumber` portal for external employers and verifiers, confirming certificate validity while guaranteeing student PII privacy.
- **Module 14: Administrative Reports & System Audit Logs**: Compliance audit trails recording user mutations, timestamps, and IP addresses.

---

## 3. Technology Stack

### Frontend Client
- **Framework**: React 18 (SPA)
- **Styling**: Tailwind CSS with custom institutional palette (Navy Blue `#1E3A8A`, Midnight Slate `#0F172A`, Gold `#D97706`)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with automated Bearer token interceptor
- **Icons**: Lucide React
- **Data Visualizations**: Recharts (Bar Charts, Donut Charts)
- **Build Tool**: Vite 5

### Backend REST API
- **Engine**: Node.js v26 LTS / Express.js
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Security**: CORS, `express-rate-limit`, parameterized SQL queries
- **PDF Generation**: PDFKit (vector layout, landscape & portrait multi-page rendering)
- **QR Code Engine**: `qrcode` (PNG vector generation)

### Persistence & Relational Database
- **Primary Schema**: 23 Normalised Relational Tables in Third Normal Form (3NF)
- **Drivers Supported**:
  - **SQLite 3** (`sqlite3`): Persistent file database (`backend/data/kiss_vtms.sqlite`) enabled by default for zero-setup execution.
  - **MySQL 8.0+** (`mysql2`): Fully supported via environment variables (`DB_CLIENT=mysql`).
- **Data Migration & Seeding**: `backend/migrations/01_schema.sql` and `backend/src/seeders/seed.js`.

---

## 4. Default Demonstration User Accounts

All demonstration accounts are seeded and ready for immediate testing with the shared password: **`Password123!`**

| Institutional Role | Email Address | Password | Operational Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@kiss.ac.in` | `Password123!` | System configuration, user account creation, trades, audit logs. |
| **Training Coordinator** | `coordinator@kiss.ac.in` | `Password123!` | Programme creation, batch scheduling, allocations, approval queue. |
| **Trainer / Teacher** | `trainer.sahoo@kiss.ac.in` | `Password123!` | Mark daily attendance, add daily diary records, grade practical assessments. |
| **Faculty Mentor** | `mentor.das@kiss.ac.in` | `Password123!` | Inspect diary entries, append qualitative reviews, log mentoring sessions. |
| **Trainee / Student** | `trainee.sita@kiss.ac.in` | `Password123!` | View personal journey, attendance %, download both official PDF certificates. |
| **Trainee 2** | `trainee.rahul@kiss.ac.in` | `Password123!` | View active learning trajectory (currently undergoing training). |
| **Certificate Authority** | `authority@kiss.ac.in` | `Password123!` | Inspect 8-point eligibility checklist, approve or reject certificate issuance. |

*Note: The login page includes convenient one-click role buttons to instantly authenticate into any role.*

---

## 5. Directory Structure

```
kiss-vtms/
├── backend/
│   ├── data/                     # SQLite persistent database store
│   ├── migrations/
│   │   └── 01_schema.sql         # Full 23-table relational schema
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js             # Dual MySQL & SQLite connection pool abstraction
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT & RBAC permission verification
│   │   │   └── audit.js          # Security audit logging
│   │   ├── routes/               # Modular Express API route controllers
│   │   ├── seeders/
│   │   │   └── seed.js           # Realistic KISS demonstration data seeder
│   │   ├── services/
│   │   │   ├── eligibilityService.js  # 8-Point Eligibility Gatekeeper
│   │   │   └── pdfService.js          # Vector PDFKit dual document generator
│   │   ├── tests/
│   │   │   └── run_tests.js      # Automated backend test suite
│   │   ├── utils/
│   │   │   └── auth.js           # Bcrypt & JWT cryptographic helpers
│   │   └── server.js             # Express application entrypoint
│   ├── uploads/certificates/     # Generated PDF certificates & portfolios
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global session state & role helpers
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx # Responsive sidebar, topbar & demo banner
│   │   ├── pages/                # All application module views
│   │   ├── services/
│   │   │   └── api.js            # Axios client with interceptors
│   │   ├── App.jsx               # React Router protected route configuration
│   │   ├── main.jsx              # Application bootstrap
│   │   └── index.css             # Tailwind base & utilities
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── documentation/
│   ├── SRS.md                    # Formal Software Requirements Specification
│   ├── API_DOCUMENTATION.md      # REST API endpoints, schemas & payloads
│   ├── DATABASE_DESIGN.md        # Relational schema dictionary & entity relationships
│   ├── UML_DIAGRAMS.md           # 7 Editable Mermaid diagrams
│   ├── TESTING_DOCUMENTATION.md  # 25 Detailed test cases & execution results
│   └── PROJECT_MANAGEMENT.md     # WBS, milestones, timeline & risk matrix
├── package.json
└── README.md
```

---

## 6. Installation & Execution Guide

### Prerequisites
- **Node.js**: v18.x, v20.x, or v22+ LTS installed.
- **npm**: v9+ or v10+.

### Step 1: Install Dependencies
From the repository root:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 2: Seed the Database
Populate all 23 relational tables with realistic KISS demonstration data and pre-generate official certificates for Sita Majhi:
```bash
cd backend
npm run seed
cd ..
```

### Step 3: Run the Application

#### Option A: Run Full-Stack via Backend (Single Port 5000)
The backend is configured to automatically serve the compiled React SPA:
```bash
# 1. Build frontend assets
cd frontend
npm run build
cd ..

# 2. Start the integrated backend server
cd backend
npm start
```
Open **`http://localhost:5000`** in your browser.

#### Option B: Run in Concurrent Development Mode
To develop with Vite hot-module replacement:
1. In Terminal 1 (Backend API):
   ```bash
   cd backend
   npm run dev
   ```
   *Runs on port 5000.*
2. In Terminal 2 (Frontend Client):
   ```bash
   cd frontend
   npm run dev
   ```
   *Runs on port 5173 with automated API proxying to port 5000.*

---

## 7. Running the Automated Test Suite

KISS-VTMS includes a dedicated automated test suite testing cryptographic hashing, JWT tokens, 23 relational tables, attendance percentage calculations, 15-day diary chronological sequencing, 8-point eligibility validation, dual PDF vector generation, and zero-PII verification filters.

To run tests:
```bash
cd backend
node src/tests/run_tests.js
```

---

## 8. Relational Database Configuration

The application operates out-of-the-box with SQLite (`backend/data/kiss_vtms.sqlite`). To connect to a production MySQL or MariaDB instance:

1. Update `backend/.env`:
   ```ini
   DB_CLIENT=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=kiss_vtms
   ```
2. Execute the migration schema against your MySQL server:
   ```bash
   mysql -u root -p -e "CREATE DATABASE kiss_vtms;"
   mysql -u root -p kiss_vtms < backend/migrations/01_schema.sql
   ```
3. Run `npm run seed` to populate seed data into MySQL.

---

## 9. Comprehensive Documentation Index

Additional formal engineering deliverables are located in the `documentation/` directory:
- [`documentation/SRS.md`](./documentation/SRS.md): Formal 17-section Software Requirements Specification with unique functional requirement IDs (`FR-AUTH`, `FR-ATT`, `FR-DIR`, `FR-CRT`).
- [`documentation/API_DOCUMENTATION.md`](./documentation/API_DOCUMENTATION.md): Complete REST endpoint catalog with request/response JSON examples.
- [`documentation/DATABASE_DESIGN.md`](./documentation/DATABASE_DESIGN.md): Detailed 23-table data dictionary, foreign key cascading constraints, and indexes.
- [`documentation/UML_DIAGRAMS.md`](./documentation/UML_DIAGRAMS.md): Editable Mermaid UML diagrams (Use Case, Activity, Sequence, Class, ER, Component, Deployment).
- [`documentation/TESTING_DOCUMENTATION.md`](./documentation/TESTING_DOCUMENTATION.md): 25 comprehensive test cases covering Unit, Integration, UAT, and Security verification.
- [`documentation/PROJECT_MANAGEMENT.md`](./documentation/PROJECT_MANAGEMENT.md): WBS, Gantt timeline, milestones, risk matrix, and maintenance protocol.

---

## 10. Institutional Compliance & Privacy Disclaimers

> **DEMONSTRATION DATA NOTICE:**  
> All student names, registration numbers, tribal communities, and programme curricula included in this repository are realistic demonstration records engineered to showcase software architecture, workflow compliance, and document generation. They do not constitute official claims, institutional endorsements, or real personal information.
