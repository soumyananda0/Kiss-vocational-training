# UML Diagrams for KISS-VTMS
**Application:** KISS Vocational Training Management System (KISS-VTMS)  
**Format:** Editable Mermaid Markdown  

---

## 1. Use Case Diagram
```mermaid
flowchart LR
    subgraph Actors
        SA((Super Administrator))
        TC((Training Coordinator))
        TR((Trainer / Teacher))
        ME((Mentor))
        ST((Trainee / Student))
        CA((Certificate Authority))
        PUB((Public Verifier))
    end

    subgraph KISS_VTMS["KISS-VTMS Core System"]
        UC1[Manage Users, Roles & Trades]
        UC2[Create Programmes & Batches]
        UC3[Allocate Trainers & Mentors]
        UC4[Mark Daily Attendance]
        UC5[Record Daily Training Diary]
        UC6[Conduct & Grade Assessments]
        UC7[Submit Qualitative Mentor Feedback]
        UC8[View Personal Progress & Diary]
        UC9[Verify 8-Point Eligibility]
        UC10[Approve / Reject Certification]
        UC11[Generate Dual PDF Documents]
        UC12[Download Official Certificates]
        UC13[Verify Certificate via QR Code]
    end

    SA --> UC1
    SA --> UC2
    TC --> UC2
    TC --> UC3
    TC --> UC9
    TR --> UC4
    TR --> UC5
    TR --> UC6
    ME --> UC7
    ME --> UC5
    ST --> UC8
    ST --> UC12
    CA --> UC9
    CA --> UC10
    CA --> UC11
    PUB --> UC13
```

---

## 2. Activity Diagram: Daily Training & Certification Lifecycle
```mermaid
flowchart TD
    Start([Trainee Registered & Batch Enrolled]) --> DayStart[Day Training Session Conducted]
    DayStart --> MarkAtt[Trainer Marks Daily Session Attendance]
    DayStart --> LogDiary[Trainer Logs Daily Diary: Topics, Practical Tasks, Tools, Skills]
    LogDiary --> MentorReview[Mentor Inspects Diary & Adds Pastoral Observations]
    MentorReview --> AssessCheck{Assessment Milestone Reached?}
    AssessCheck -- Yes --> Eval[Trainer Evaluates Theory / Practical Test]
    AssessCheck -- No --> CheckMoreDays{Cohort Training Finished?}
    Eval --> CheckMoreDays
    CheckMoreDays -- No --> DayStart
    CheckMoreDays -- Yes --> ElgEngine[Coordinator Triggers 8-Point Eligibility Engine]
    
    ElgEngine --> CheckElg{Attendance >= 75% AND<br/>Assessments >= 50% AND<br/>All Records Complete?}
    CheckElg -- No --> FlagPending[Display Pending Criteria Deficiencies & Block]
    FlagPending --> DayStart
    
    CheckElg -- Yes --> SubmitCA[Submit to Certificate Authority Queue]
    SubmitCA --> CAReview{Certificate Authority Decision}
    CAReview -- Rejected --> ReturnCoordinator[Return with Audit Justification]
    ReturnCoordinator --> CoordinatorFix[Remediate Deficiencies]
    
    CAReview -- Approved --> GenPDF[Generate Dual PDF Documents]
    GenPDF --> PDF1[Generate Cert 1: Landscape Official Certificate + QR]
    GenPDF --> PDF2[Generate Cert 2: Multi-Page Trainee Profile & Journey Dossier]
    PDF1 --> Publish[Store Hashes & Publish to Trainee Portal]
    PDF2 --> Publish
    Publish --> Download([Trainee Downloads Both PDFs & Public Can Scan QR])
```

---

## 3. Sequence Diagram: Dual Certificate Issuance Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Coordinator as Training Coordinator
    actor CA as Certificate Authority
    participant Server as Express REST Engine
    participant Engine as Eligibility Engine
    participant DB as Relational Database
    participant PDF as PDFKit Generator
    actor Student as Trainee

    Coordinator->>Server: POST /api/certificates/request-approval {batch_id, trainee_id}
    Server->>Engine: validateEligibility(batch_id, trainee_id)
    Engine->>DB: Query attendance, assessments, diary days, mentor notes
    DB-->>Engine: Return empirical records
    Engine-->>Server: Eligibility status (Passed / Failed)
    Server->>DB: INSERT INTO certificate_approvals (status='pending')
    Server-->>Coordinator: 200 OK (Approval Request Queued)

    CA->>Server: GET /api/certificates/pending
    Server->>DB: Fetch pending requests with eligibility checklists
    DB-->>Server: Return records
    Server-->>CA: Display approval review dashboard

    CA->>Server: POST /api/certificates/review-approval {id, decision: 'approved'}
    Server->>DB: UPDATE certificate_approvals SET status='approved'
    Server->>PDF: generateOfficialCertificate(trainee, programme, certNo)
    PDF-->>Server: cert1.pdf buffer & hash
    Server->>PDF: generateJourneyPortfolio(trainee, batch, diaryEntries, scores)
    PDF-->>Server: cert2_portfolio.pdf buffer & hash
    Server->>DB: INSERT INTO certificates (cert1, cert2, hashes, file_paths)
    Server-->>CA: 200 OK (Certificates successfully issued)

    Student->>Server: GET /api/certificates/download/:id
    Server->>DB: Authenticate trainee ownership
    DB-->>Server: Verified
    Server-->>Student: Stream generated PDF document
```

---

## 4. Class Diagram
```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string passwordHash
        +string fullName
        +int roleId
        +boolean isActive
        +login(password) boolean
    }

    class Trainee {
        +int id
        +int userId
        +string registrationNo
        +Date dob
        +string gender
        +string tribalCommunity
        +string classGrade
        +string enrollmentDate
        +calculateAttendancePct() float
    }

    class Trainer {
        +int id
        +int userId
        +string employeeId
        +string specialization
        +string qualification
        +int experienceYears
    }

    class Mentor {
        +int id
        +int userId
        +string employeeId
        +string designation
        +string areaOfExpertise
    }

    class Programme {
        +int id
        +string programmeCode
        +string title
        +int tradeId
        +int durationWeeks
        +int totalHours
        +float minAttendancePct
        +float minPassPct
    }

    class Batch {
        +int id
        +string batchCode
        +int programmeId
        +string name
        +Date startDate
        +Date endDate
        +string status
    }

    class TrainingDiary {
        +int id
        +int batchId
        +int traineeId
        +int dayNumber
        +Date trainingDate
        +string topicCovered
        +string theoreticalActivities
        +string practicalActivities
        +string toolsEquipmentUsed
        +string skillsLearned
        +float hoursSpent
        +string trainerRemarks
        +string mentorObservations
    }

    class Assessment {
        +int id
        +int batchId
        +string title
        +string assessmentType
        +float maxMarks
        +float passingMarks
    }

    class AssessmentResult {
        +int id
        +int assessmentId
        +int traineeId
        +float marksObtained
        +float percentage
        +string result
    }

    class Certificate {
        +int id
        +string certificateNumber
        +string verificationHash
        +string certificateType
        +Date issueDate
        +string filePath
        +string qrCodeData
    }

    User <|-- Trainee
    User <|-- Trainer
    User <|-- Mentor
    Programme "1" *-- "many" Batch
    Batch "1" *-- "many" TrainingDiary
    Batch "1" *-- "many" Assessment
    Assessment "1" *-- "many" AssessmentResult
    Trainee "1" *-- "many" AssessmentResult
    Trainee "1" *-- "many" TrainingDiary
    Trainee "1" *-- "many" Certificate
```

---

## 5. Entity-Relationship (ER) Diagram
```mermaid
erDiagram
    USERS ||--|| ROLES : has
    USERS ||--o| TRAINEES : extends
    USERS ||--o| TRAINERS : extends
    USERS ||--o| MENTORS : extends

    TRADES ||--o{ PROGRAMMES : contains
    PROGRAMMES ||--o{ BATCHES : instantiates
    PROGRAMMES ||--o{ TRAINING_MODULES : specifies

    BATCHES ||--o{ ENROLMENTS : registers
    TRAINEES ||--o{ ENROLMENTS : attends

    BATCHES ||--o{ TRAINER_ALLOCATIONS : assigns
    TRAINERS ||--o{ TRAINER_ALLOCATIONS : serves

    BATCHES ||--o{ MENTOR_ALLOCATIONS : pairs
    MENTORS ||--o{ MENTOR_ALLOCATIONS : guides
    TRAINEES ||--o{ MENTOR_ALLOCATIONS : guided_by

    BATCHES ||--o{ ATTENDANCE : tracks
    TRAINEES ||--o{ ATTENDANCE : marked_in

    BATCHES ||--o{ TRAINING_DIARY : logs
    TRAINEES ||--o{ TRAINING_DIARY : records_journey

    BATCHES ||--o{ ASSESSMENTS : conducts
    ASSESSMENTS ||--o{ ASSESSMENT_RESULTS : scores
    TRAINEES ||--o{ ASSESSMENT_RESULTS : receives

    BATCHES ||--o{ MENTOR_FEEDBACK : evaluates
    TRAINEES ||--o{ MENTOR_FEEDBACK : receives_feedback

    TRADES ||--o{ SKILLS : teaches
    TRAINEES ||--o{ TRAINEE_SKILLS : masters
    SKILLS ||--o{ TRAINEE_SKILLS : evaluated_as

    BATCHES ||--o{ CERTIFICATE_APPROVALS : audits
    TRAINEES ||--o{ CERTIFICATE_APPROVALS : candidate_for

    BATCHES ||--o{ CERTIFICATES : grants
    TRAINEES ||--o{ CERTIFICATES : receives_cert
```

---

## 6. Component Diagram
```mermaid
flowchart TD
    subgraph Client["Client Browser (React.js SPA)"]
        UI[Tailwind UI Components]
        Router[React Router DOM]
        State[Auth & App Context]
        AxiosClient[Axios HTTP Client]
        Charts[Recharts Visualizations]
    end

    subgraph Server["Application Server (Node.js & Express)"]
        AuthMiddleware[JWT Auth & RBAC Middleware]
        RouteHandlers[REST Controllers]
        Validation[Input Validators & Sanitizers]
        EligibilityService[8-Point Eligibility Engine]
        PDFService[PDFKit Dual Document Generator]
        QRService[QR Code Generation Engine]
        AuditService[Security Audit Logger]
    end

    subgraph Storage["Persistence & Filesystem"]
        DBPool[Relational Connection Pool]
        SQLDatabase[(MySQL / Relational Database)]
        DocStorage[Secure PDF Storage /uploads/certificates/]
    end

    UI --> Router
    Router --> State
    State --> AxiosClient
    UI --> Charts

    AxiosClient -->|HTTPS REST| AuthMiddleware
    AuthMiddleware --> Validation
    Validation --> RouteHandlers

    RouteHandlers --> EligibilityService
    RouteHandlers --> PDFService
    RouteHandlers --> QRService
    RouteHandlers --> AuditService

    EligibilityService --> DBPool
    RouteHandlers --> DBPool
    AuditService --> DBPool

    PDFService --> DocStorage
    PDFService --> QRService

    DBPool --> SQLDatabase
```

---

## 7. Deployment Diagram
```mermaid
flowchart TD
    subgraph ClientDevices["Client Tier"]
        Desktop[Desktop Workstation / Browser]
        Tablet[Faculty Tablet / iPad]
        Mobile[Student Smartphone / QR Scanner]
    end

    subgraph WebReverseProxy["Edge / Reverse Proxy Tier"]
        Nginx[Nginx / SSL Termination :443]
    end

    subgraph AppServer["Application Tier (Node.js Cluster)"]
        Node1[Node.js Express App Instance 1]
        Node2[Node.js Express App Instance 2]
    end

    subgraph StorageTier["Data & File Tier"]
        MySQL[(MySQL 8.0 Primary Cluster)]
        PDFStore[(Local Encrypted PDF Storage)]
        Backup[(Automated Daily Backup Volume)]
    end

    Desktop -->|HTTPS| Nginx
    Tablet -->|HTTPS| Nginx
    Mobile -->|HTTPS| Nginx

    Nginx -->|Reverse Proxy :5000| Node1
    Nginx -->|Reverse Proxy :5000| Node2

    Node1 -->|Connection Pool| MySQL
    Node2 -->|Connection Pool| MySQL

    Node1 -->|Write/Read File| PDFStore
    Node2 -->|Write/Read File| PDFStore

    MySQL -.->|Daily Dump| Backup
    PDFStore -.->|Snapshot| Backup
```
