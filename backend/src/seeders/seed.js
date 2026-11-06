const db = require('../config/db');
const { hashPassword } = require('../utils/auth');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

async function seedDatabase() {
  console.log('[Seed] Beginning relational seeding...');

  // Ensure tables exist
  const schemaFile = path.join(__dirname, '../../migrations/01_schema.sql');
  if (fs.existsSync(schemaFile)) {
    const sql = fs.readFileSync(schemaFile, 'utf8');
    await db.exec(sql);
    console.log('[Seed] Schema executed successfully.');
  }

  // 1. Roles
  const roles = [
    { key: 'super_admin', name: 'Super Administrator', desc: 'Full institutional configuration and audit access.' },
    { key: 'coordinator', name: 'Training Coordinator', desc: 'Curriculum, batch, and allocation management.' },
    { key: 'trainer', name: 'Trainer / Teacher', desc: 'Conducts sessions, logs daily diary, and evaluates trainees.' },
    { key: 'mentor', name: 'Mentor', desc: 'Provides holistic guidance, reviews diaries, and records pastoral feedback.' },
    { key: 'trainee', name: 'Trainee / Student', desc: 'Learns vocational trade, tracks journey, and downloads credentials.' },
    { key: 'cert_authority', name: 'Certificate Authority', desc: 'Validates completion requirements and issues signed certificates.' }
  ];

  for (const r of roles) {
    const existing = await db.getOne(`SELECT id FROM roles WHERE role_key = ?`, [r.key]);
    if (!existing) {
      await db.query(`INSERT INTO roles (role_key, name, description) VALUES (?, ?, ?)`, [r.key, r.name, r.desc]);
    }
  }

  const roleMap = {};
  const allRoles = await db.query(`SELECT id, role_key FROM roles`);
  allRoles.forEach(r => { roleMap[r.role_key] = r.id; });

  // 2. Departments
  const departments = [
    { code: 'DVT', name: 'Directorate of Vocational Education & Livelihoods', desc: 'Core skilling and livelihood division of KISS.' },
    { code: 'DSSH', name: 'Department of Social Sciences & Tribal Heritage', desc: 'Academic and cultural context division.' },
    { code: 'DAST', name: 'Department of Applied Sciences & Industrial Arts', desc: 'Technical and engineering vocational trades.' }
  ];

  for (const d of departments) {
    const existing = await db.getOne(`SELECT id FROM departments WHERE code = ?`, [d.code]);
    if (!existing) {
      await db.query(`INSERT INTO departments (code, name, description) VALUES (?, ?, ?)`, [d.code, d.name, d.desc]);
    }
  }

  // 3. User Accounts (Password for all demo accounts: Password123!)
  const passwordHash = await hashPassword('Password123!');

  const users = [
    { email: 'admin@kiss.ac.in', name: 'Dr. Alok Kumar Sahu', role: 'super_admin', phone: '+91 9437012345' },
    { email: 'coordinator@kiss.ac.in', name: 'Priyanka Tripathy', role: 'coordinator', phone: '+91 9437023456' },
    { email: 'trainer.sahoo@kiss.ac.in', name: 'Bhabani Shankar Sahoo', role: 'trainer', phone: '+91 9437034567' },
    { email: 'mentor.das@kiss.ac.in', name: 'Dr. Jayashree Das', role: 'mentor', phone: '+91 9437045678' },
    { email: 'trainee.sita@kiss.ac.in', name: 'Sita Majhi', role: 'trainee', phone: '+91 9437056789' },
    { email: 'trainee.rahul@kiss.ac.in', name: 'Rahul Oram', role: 'trainee', phone: '+91 9437067890' },
    { email: 'authority@kiss.ac.in', name: 'Dr. S. K. Mahapatra', role: 'cert_authority', phone: '+91 9437078901' }
  ];

  const userMap = {};
  for (const u of users) {
    let user = await db.getOne(`SELECT id FROM users WHERE email = ?`, [u.email]);
    if (!user) {
      const res = await db.query(
        `INSERT INTO users (role_id, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)`,
        [roleMap[u.role], u.email, passwordHash, u.name, u.phone]
      );
      userMap[u.email] = res.insertId;
    } else {
      userMap[u.email] = user.id;
    }
  }

  // 4. Trainers & Mentors Profile records
  let trainerSahoo = await db.getOne(`SELECT id FROM trainers WHERE user_id = ?`, [userMap['trainer.sahoo@kiss.ac.in']]);
  if (!trainerSahoo) {
    const res = await db.query(
      `INSERT INTO trainers (user_id, employee_id, department_id, specialization, qualification, experience_years, bio)
       VALUES (?, 'EMP-TRN-01', 1, 'Apparel Manufacturing & Textile Technology', 'Master in Fashion Technology (NIFT)', 8, 'Senior vocational trainer specialising in industrial garment production and ethnic apparel fusion.')`,
      [userMap['trainer.sahoo@kiss.ac.in']]
    );
    trainerSahoo = { id: res.insertId };
  }

  let mentorDas = await db.getOne(`SELECT id FROM mentors WHERE user_id = ?`, [userMap['mentor.das@kiss.ac.in']]);
  if (!mentorDas) {
    const res = await db.query(
      `INSERT INTO mentors (user_id, employee_id, department_id, designation, area_of_expertise)
       VALUES (?, 'EMP-MTR-01', 2, 'Assistant Professor', 'Vocational Psychology & Tribal Student Mentorship')`,
      [userMap['mentor.das@kiss.ac.in']]
    );
    mentorDas = { id: res.insertId };
  }

  // 5. Trainees Profile records
  let traineeSita = await db.getOne(`SELECT id FROM trainees WHERE user_id = ?`, [userMap['trainee.sita@kiss.ac.in']]);
  if (!traineeSita) {
    const res = await db.query(
      `INSERT INTO trainees (user_id, registration_no, dob, gender, blood_group, tribal_community, class_grade, department_id, address, district, state, guardian_name, guardian_phone, enrollment_date, status)
       VALUES (?, 'KISS-VT-2026-001', '2007-04-12', 'Female', 'O+', 'Santhal', 'Grade 11 (Vocational)', 1, 'Village: Baripada, Mayurbhanj / KISS Residential Hostel Block 4', 'Mayurbhanj', 'Odisha', 'Ramu Majhi', '+91 9438112233', '2026-06-01', 'enrolled')`,
      [userMap['trainee.sita@kiss.ac.in']]
    );
    traineeSita = { id: res.insertId };
  }

  let traineeRahul = await db.getOne(`SELECT id FROM trainees WHERE user_id = ?`, [userMap['trainee.rahul@kiss.ac.in']]);
  if (!traineeRahul) {
    const res = await db.query(
      `INSERT INTO trainees (user_id, registration_no, dob, gender, blood_group, tribal_community, class_grade, department_id, address, district, state, guardian_name, guardian_phone, enrollment_date, status)
       VALUES (?, 'KISS-VT-2026-002', '2007-09-25', 'Male', 'B+', 'Ho', 'Grade 10 (Vocational)', 1, 'Village: Joda, Keonjhar / KISS Residential Hostel Block 2', 'Keonjhar', 'Odisha', 'Biren Oram', '+91 9438223344', '2026-06-01', 'enrolled')`,
      [userMap['trainee.rahul@kiss.ac.in']]
    );
    traineeRahul = { id: res.insertId };
  }

  // 6. Vocational Trades
  const tradesData = [
    {
      code: 'TRD-TAILOR',
      name: 'Tailoring and Apparel Making',
      category: 'Textile & Fashion',
      desc: 'Industrial sewing, pattern drafting, garment construction, and traditional tribal apparel fusion.',
      skills: 'Pattern Drafting, Rotary Cutting, Industrial Stitching, Overlocking, Garment Finishing',
      equipment: 'Single Needle Lockstitch Machines, 5-Thread Overlockers, Steam Press Tables, Pattern Rulers',
      level: 'National Skills Level 4'
    },
    {
      code: 'TRD-COMP',
      name: 'Computer Applications & Digital Office',
      category: 'Information Technology',
      desc: 'Digital literacy, office productivity suites, data entry, spreadsheet accounting, and cloud tools.',
      skills: 'MS Office, Data Entry, Spreadsheets, Typing Speed 40 WPM, Internet Security, Cloud Storage',
      equipment: 'Dell Core i5 Workstations, Dual Monitors, High-Speed Laser Printers, LAN Network',
      level: 'National Skills Level 3'
    },
    {
      code: 'TRD-FOOD',
      name: 'Food Processing & Preservation',
      category: 'Agro & Food Technology',
      desc: 'Hygiene standards, indigenous fruit processing, bakery, packaging, and shelf-life preservation.',
      skills: 'FSSAI Hygiene Norms, Dehydration, Canning, Bakery Techniques, Nutritional Labelling',
      equipment: 'Industrial Ovens, Dehydrators, Vacuum Sealers, Refractometers, Stainless Steel Tables',
      level: 'National Skills Level 4'
    },
    {
      code: 'TRD-CRAFT',
      name: 'Handicrafts & Tribal Art Product Design',
      category: 'Art & Cultural Heritage',
      desc: 'Traditional Dokra brass craft, Sabai grass weaving, terracotta pottery, and lacquer craft.',
      skills: 'Clay Moulding, Wax Lost Casting, Sabai Grass Braiding, Natural Pigment Painting',
      equipment: 'Pottery Wheels, Kiln Furnaces, Dokra Crucible Furnaces, Hand Weaving Looms',
      level: 'Artisan Master Level'
    },
    {
      code: 'TRD-ELEC',
      name: 'Basic Electrical & Solar Maintenance',
      category: 'Engineering & Renewable Energy',
      desc: 'Domestic wiring, solar photovoltaic panel installation, inverter maintenance, and safety.',
      skills: 'Circuit Wiring, Multimeter Diagnostic, Solar Panel Connection, Earthing Installation',
      equipment: 'Digital Multimeters, Solar PV Simulators, Wire Strippers, Safety Gloves & Helmets',
      level: 'National Skills Level 4'
    },
    {
      code: 'TRD-ENT',
      name: 'Rural Micro-Entrepreneurship & Livelihood',
      category: 'Business & Management',
      desc: 'Small business planning, book-keeping, market linkages, cooperative management, and digital payments.',
      skills: 'Business Plan Drafting, Micro-Credit Management, UPI & Digital Banking, Inventory Costing',
      equipment: 'Tablets with Accounting Apps, POS Terminals, Case Study Workbooks',
      level: 'Business Foundation Level'
    }
  ];

  const tradeMap = {};
  for (const tr of tradesData) {
    let record = await db.getOne(`SELECT id FROM trades WHERE trade_code = ?`, [tr.code]);
    if (!record) {
      const res = await db.query(
        `INSERT INTO trades (trade_code, name, category, description, skills_covered, required_equipment, training_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tr.code, tr.name, tr.category, tr.desc, tr.skills, tr.equipment, tr.level]
      );
      tradeMap[tr.code] = res.insertId;
    } else {
      tradeMap[tr.code] = record.id;
    }
  }

  // 7. Training Programmes
  let apparelProg = await db.getOne(`SELECT id FROM programmes WHERE programme_code = 'PRG-APPAR-2026'`);
  if (!apparelProg) {
    const res = await db.query(
      `INSERT INTO programmes (programme_code, title, trade_id, description, objectives, scope, expected_outcomes, eligibility_requirements, duration_weeks, total_training_hours, methodology, assessment_criteria, completion_criteria, min_attendance_pct, min_pass_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'PRG-APPAR-2026',
        'Apparel Manufacturing & Fashion Technology',
        tradeMap['TRD-TAILOR'],
        'Comprehensive 12-week professional vocational course empowering students with end-to-end industrial apparel production skills, indigenous textile heritage fusion, and commercial tailoring competencies.',
        '1. Master industrial lockstitch and overlock machine handling.\n2. Execute precise anthropometric measurements and pattern grading.\n3. Implement industrial assembly line garment assembly.\n4. Integrate traditional Santhal and tribal geometric motifs into commercial garments.\n5. Establish cost estimation and workshop management capabilities.',
        'Covers foundational sewing machine mechanics, safety ergonomics, fabric grain alignment, complex pattern cutting, collar/pocket construction, finishing, steam pressing, and market readiness.',
        'Graduates independently design, cut, assemble, and quality-certify traditional and western garments, ready for self-employment or industrial apparel unit absorption.',
        'Enrolled KISS secondary or higher secondary student with inclination towards design and vocational livelihoods.',
        12,
        180,
        'Hands-on workshop experiential learning (75%) combined with interactive classroom technical lectures (25%), supervised by certified master craftsmen.',
        'Continuous practical observation (40%), modular skill tests (30%), end-of-course capstone garment production (20%), and attendance compliance (10%).',
        'Minimum 75% attendance in practical sessions and at least 50% score in all theoretical and practical assessments.',
        75.0,
        50.0
      ]
    );
    apparelProg = { id: res.insertId };

    // Modules for Apparel Programme
    const modules = [
      { num: 1, title: 'Workshop Safety, Machine Mechanics & Ergonomics', hours: 25 },
      { num: 2, title: 'Pattern Drafting, Anatomy & Fabric Grainlines', hours: 40 },
      { num: 3, title: 'Industrial Stitching, Seam Finishes & Overlocking', hours: 45 },
      { num: 4, title: 'Traditional Tribal Motif Embellishment & Embroidery', hours: 35 },
      { num: 5, title: 'Capstone Garment Assembly, Quality Control & Costing', hours: 35 }
    ];

    for (const m of modules) {
      await db.query(
        `INSERT INTO training_modules (programme_id, module_number, title, planned_hours) VALUES (?, ?, ?, ?)`,
        [apparelProg.id, m.num, m.title, m.hours]
      );
    }
  }

  // 8. Batches
  let batchA = await db.getOne(`SELECT id FROM batches WHERE batch_code = 'BATCH-APP-2026-A'`);
  if (!batchA) {
    const res = await db.query(
      `INSERT INTO batches (batch_code, programme_id, name, start_date, end_date, capacity, status)
       VALUES (?, ?, ?, '2026-07-01', '2026-10-20', 25, 'completed')`,
      ['BATCH-APP-2026-A', apparelProg.id, 'Apparel Tech Cohort 2026-A']
    );
    batchA = { id: res.insertId };
  }

  // 9. Enrolments
  let enrolSita = await db.getOne(`SELECT id FROM enrolments WHERE batch_id = ? AND trainee_id = ?`, [batchA.id, traineeSita.id]);
  if (!enrolSita) {
    await db.query(
      `INSERT INTO enrolments (batch_id, trainee_id, enrolment_date, completion_status, final_grade, final_percentage, completion_date, remarks)
       VALUES (?, ?, '2026-07-01', 'completed', 'A+', 92.5, '2026-10-20', 'Exemplary dedication and precision in practical assignments.')`,
      [batchA.id, traineeSita.id]
    );
  }

  let enrolRahul = await db.getOne(`SELECT id FROM enrolments WHERE batch_id = ? AND trainee_id = ?`, [batchA.id, traineeRahul.id]);
  if (!enrolRahul) {
    await db.query(
      `INSERT INTO enrolments (batch_id, trainee_id, enrolment_date, completion_status, remarks)
       VALUES (?, ?, '2026-07-01', 'active', 'Currently progressing through Module 4.')`,
      [batchA.id, traineeRahul.id]
    );
  }

  // 10. Allocations
  const trainerAlloc = await db.getOne(`SELECT id FROM trainer_allocations WHERE batch_id = ? AND trainer_id = ?`, [batchA.id, trainerSahoo.id]);
  if (!trainerAlloc) {
    await db.query(
      `INSERT INTO trainer_allocations (batch_id, trainer_id, assigned_date, status) VALUES (?, ?, '2026-07-01', 'active')`,
      [batchA.id, trainerSahoo.id]
    );
  }

  const mentorAllocSita = await db.getOne(`SELECT id FROM mentor_allocations WHERE batch_id = ? AND trainee_id = ?`, [batchA.id, traineeSita.id]);
  if (!mentorAllocSita) {
    await db.query(
      `INSERT INTO mentor_allocations (batch_id, trainee_id, mentor_id, assigned_date, status) VALUES (?, ?, ?, '2026-07-01', 'active')`,
      [batchA.id, traineeSita.id, mentorDas.id]
    );
  }

  // 11. Attendance Records (15 Sessions for Sita Majhi: 14 Present, 1 Leave = 93.3% Attendance)
  const existingAtt = await db.getOne(`SELECT COUNT(*) as count FROM attendance WHERE batch_id = ? AND trainee_id = ?`, [batchA.id, traineeSita.id]);
  if (!existingAtt || existingAtt.count === 0) {
    const dates = [
      '2026-07-02', '2026-07-09', '2026-07-16', '2026-07-23', '2026-07-30',
      '2026-08-06', '2026-08-13', '2026-08-20', '2026-08-27', '2026-09-03',
      '2026-09-10', '2026-09-17', '2026-09-24', '2026-10-01', '2026-10-08'
    ];

    for (let i = 0; i < dates.length; i++) {
      const status = i === 4 ? 'leave' : 'present';
      const remark = i === 4 ? 'Approved hostel health check' : 'Prompt attendance, high focus';
      await db.query(
        `INSERT INTO attendance (batch_id, trainee_id, session_date, session_number, status, remarks, recorded_by)
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
        [batchA.id, traineeSita.id, dates[i], status, remark, userMap['trainer.sahoo@kiss.ac.in']]
      );
    }
  }

  // 12. Training Diary: FULL 15-DAY CHRONOLOGICAL RECORD FOR SITA MAJHI
  const existingDiary = await db.getOne(`SELECT COUNT(*) as count FROM training_diary WHERE batch_id = ? AND trainee_id = ?`, [batchA.id, traineeSita.id]);
  if (!existingDiary || existingDiary.count === 0) {
    const diaryData = [
      {
        day: 1, date: '2026-07-02',
        topic: 'Orientation, Workshop Safety & Industrial Trade Ethics',
        theory: 'Overview of occupational safety norms, electrical precautions, fire safety, and ergonomic posture.',
        practical: 'Emergency exit walk-through, first aid drill, workshop sanitisation, and protective gear inspection.',
        tools: 'Safety goggles, fire extinguishers, first aid kit, ergonomic seating.',
        skills: 'Occupational hazard identification, emergency protocol execution, PPE adherence.',
        outcomes: 'Trainee demonstrated full compliance with workshop safety regulations and zero accident drill faults.',
        hours: 4.0,
        trainerNotes: 'Punctual, attentive, and actively assisted in safety signage placement.',
        mentorNotes: 'Trainee adapted comfortably to the vocational workshop environment.'
      },
      {
        day: 2, date: '2026-07-09',
        topic: 'Mechanics of Single Needle Lockstitch Machines',
        theory: 'Mechanical anatomy of sewing machines: bobbin winding, upper thread path, and tension discs.',
        practical: 'Disassembly and re-assembly of bobbin case, needle installation, thread tension calibration.',
        tools: 'Industrial lockstitch machines, screwdriver set, machine oil, test thread.',
        skills: 'Machine threading, bobbin tension adjustment, mechanical lubrication.',
        outcomes: 'Mastered smooth pedal control and balanced stitch tension on muslin swatches.',
        hours: 4.5,
        trainerNotes: 'Quick grasp of needle gauge compatibility and tension adjustments.',
        mentorNotes: 'Demonstrated high mechanical curiosity and confidence.'
      },
      {
        day: 3, date: '2026-07-16',
        topic: 'Fabric Anatomy, Grainlines and Shrinkage Analysis',
        theory: 'Warp vs weft yarn characteristics, straight grain, cross grain, bias elasticity, and shrinkage rates.',
        practical: 'Grainline tearing test, water immersion shrinkage measurement on cotton and linen samples.',
        tools: 'Measuring tape, fabric scissors, water bath, pressing iron, GSM scale.',
        skills: 'Fabric grain identification, bias cutting calculations, pre-shrinkage treatment.',
        outcomes: 'Accurately identified fabric grainline and calculated 4.2% shrinkage allowance for cotton.',
        hours: 4.0,
        trainerNotes: 'Careful precision in recording shrinkage calculations.',
        mentorNotes: 'Showed great patience during textile analysis exercises.'
      },
      {
        day: 4, date: '2026-07-23',
        topic: 'Anthropometric Measurement Taking and Body Geometry',
        theory: 'Standard anthropometric anatomical reference points: bust, waist, hip, nape, cross-back.',
        practical: 'Peer measurement recording on specification sheets, posture variance compensation.',
        tools: 'Fiberglass measuring tape, waist tape markers, measurement cards.',
        skills: 'Precision measurement taking, client communication, ease allowance calculation.',
        outcomes: 'Recorded zero-error standard measurements on adult mannequin and peer trainee.',
        hours: 4.0,
        trainerNotes: 'Polite and professional demeanour while taking anatomical measurements.',
        mentorNotes: 'Strong communication skills and collaborative peer support observed.'
      },
      {
        day: 5, date: '2026-07-30',
        topic: 'Pattern Drafting: Basic Bodice and Sleeve Block',
        theory: 'Principles of 2D to 3D translation: darts, apex positioning, armhole curvature geometry.',
        practical: 'Drafted full-scale front and back basic bodice block and plain sleeve onto brown kraft paper.',
        tools: 'French curves, L-square, grading rulers, pattern paper, tracing wheels.',
        skills: 'Technical pattern drafting, dart manipulation, armhole depth calculation.',
        outcomes: 'Produced clean, balanced basic bodice master blocks with accurate grainlines.',
        hours: 5.0,
        trainerNotes: 'Clean draft lines and excellent utilization of French curve rulers.',
        mentorNotes: 'Exhibits spatial reasoning aptitude and keen aesthetic balance.'
      },
      {
        day: 6, date: '2026-08-06',
        topic: 'Industrial Rotary Cutting and Fabric Layout',
        theory: 'Marker efficiency, fabric wastage minimization, nap and directional print alignment.',
        practical: 'Pinned pattern blocks onto 2.5m cotton fabric, executed marker layout, cut panels.',
        tools: 'Rotary cutting machine, tailoring shears, tailor chalk, weights, cutting mat.',
        skills: 'Precision shearing, zero-slippage fabric pinning, marker yield optimization (89%).',
        outcomes: 'Cut complete 6-panel bodice with less than 11% fabric off-cut wastage.',
        hours: 4.5,
        trainerNotes: 'Remarkable material efficiency and steady control of cutting shears.',
        mentorNotes: 'Demonstrates environmental mindfulness in fabric conservation.'
      },
      {
        day: 7, date: '2026-08-13',
        topic: 'Basic Seam Construction and Overlock Finishing',
        theory: 'Plain seams, French seams, flat-felled seams, and 5-thread overlocker stitch formation.',
        practical: 'Stitched sample seam board comparing seam strengths; threaded and adjusted overlocker.',
        tools: '5-Thread industrial overlock machine, seam ripper, pressing clapper.',
        skills: 'French seam construction, overlock loop balancing, edge neatening.',
        outcomes: 'Stitched 8 distinct commercial seam finishes conforming to export tolerance standards.',
        hours: 4.5,
        trainerNotes: 'Even seam allowances maintained without wavy edge distortions.',
        mentorNotes: 'Trainee takes pride in clean inner garment finishes.'
      },
      {
        day: 8, date: '2026-08-20',
        topic: 'Collar and Neckline Engineering',
        theory: 'Mandarin, Peter Pan, and shirt collar construction; interfacing weight selection.',
        practical: 'Fused non-woven interfacing, stitched collar points, attached collar to test bodice.',
        tools: 'Steam iron, fusible interfacing, point presser, tailoring chalk.',
        skills: 'Interfacing heat fusing, collar point trimming, symmetrical neckline insertion.',
        outcomes: 'Engineered crisp, symmetrical mandarin collar with identical 90-degree points.',
        hours: 4.5,
        trainerNotes: 'Flawless collar turn-out with zero bunching of seam allowance bulk.',
        mentorNotes: 'High concentration during intricate precision steps.'
      },
      {
        day: 9, date: '2026-08-27',
        topic: 'Sleeve Insertion and Ease Distribution',
        theory: 'Crown ease distribution, notch alignment, and armhole circumference matching.',
        practical: 'Gathered sleeve crown ease, pinned notches to armhole, set sleeves without puckers.',
        tools: 'Lockstitch machine, tailoring pins, tailor ham, sleeve board.',
        skills: 'Set-in sleeve installation, ease gathering, 3D pressing of armhole seam.',
        outcomes: 'Successfully inserted left and right sleeves with smooth crown contours.',
        hours: 4.5,
        trainerNotes: 'No dimples or tucks at the sleeve crown head. Excellent execution.',
        mentorNotes: 'Trainee overcame initial hesitation with sleeve alignment.'
      },
      {
        day: 10, date: '2026-09-03',
        topic: 'Fasteners: Concealed Zippers, Buttonholes & Plackets',
        theory: 'Concealed zipper mechanics, continuous bound plackets, buttonhole bar tacking.',
        practical: 'Installed concealed zipper using zipper foot; operated automatic buttonholer machine.',
        tools: 'Zipper presser foot, automatic buttonhole machine, buttonhole chisel.',
        skills: 'Concealed zip insertion, automated buttonhole programming, hook-and-eye stitching.',
        outcomes: 'Installed concealed zipper that remains completely invisible when closed.',
        hours: 4.0,
        trainerNotes: 'Accurate teeth alignment and smooth slider movement achieved.',
        mentorNotes: 'Displays mature problem-solving when testing mechanical attachments.'
      },
      {
        day: 11, date: '2026-09-10',
        topic: 'Traditional Santhal Motif Embellishment & Tribal Fusion',
        theory: 'Indigenous tribal geometric symbols, cultural embroidery motifs, and heritage story-telling.',
        practical: 'Applied handcrafted Santhal geometric thread motifs onto collar and yoke panels.',
        tools: 'Embroidery needles, silk anchor threads, wooden hoops, tracing carbon.',
        skills: 'Traditional tribal embroidery, colour harmony, contemporary ethnic fusion styling.',
        outcomes: 'Embroidered intricate Santhal motif border with balanced cultural authenticity.',
        hours: 5.0,
        trainerNotes: 'Deep artistic appreciation and seamless integration with modern garment design.',
        mentorNotes: 'Proud connection to indigenous tribal roots expressed through craft.'
      },
      {
        day: 12, date: '2026-09-17',
        topic: 'Costing, Bill of Materials (BOM) & Inventory Management',
        theory: 'Direct fabric cost, thread consumption, overheads, labor markup, wholesale pricing.',
        practical: 'Calculated comprehensive BOM and retail selling price for a designer Kurti.',
        tools: 'Scientific calculator, BOM spreadsheet, market price catalogue.',
        skills: 'Unit cost calculation, profit margin budgeting, material wastage accounting.',
        outcomes: 'Compiled complete commercial costing sheet with competitive 28% profit margin.',
        hours: 4.0,
        trainerNotes: 'Mathematically sound costing with realistic commercial factoring.',
        mentorNotes: 'Understands economic value of her vocational skills for self-reliance.'
      },
      {
        day: 13, date: '2026-09-24',
        topic: 'Capstone Garment: Traditional Fusion Kurti Production (Part 1)',
        theory: 'Production scheduling, critical path method, sequence of garment operations.',
        practical: 'Commenced capstone garment: cut luxury handloom fabric, prepared yokes and pockets.',
        tools: 'Heavy-duty shears, cutting table, lockstitch machine, pressing iron.',
        skills: 'Full garment workflow planning, luxury handloom fabric handling.',
        outcomes: 'Completed all preparatory sub-assemblies ahead of allocated benchmark schedule.',
        hours: 5.0,
        trainerNotes: 'Works independently with steady, deliberate craftsman rhythm.',
        mentorNotes: 'Excellent work ethic and exemplary time discipline.'
      },
      {
        day: 14, date: '2026-10-01',
        topic: 'Capstone Garment: Assembly, Finishing & Steam Pressing (Part 2)',
        theory: 'Final inspection standards, thread trimming, industrial vacuum steam pressing.',
        practical: 'Completed side seams, hemmed bottom flounce, pressed garment on vacuum board.',
        tools: 'Industrial gravity feed steam iron, vacuum pressing board, thread snips.',
        skills: 'Industrial pressing, final quality inspection, hanger packaging.',
        outcomes: 'Produced a boutique-grade Traditional Fusion Kurti with zero construction defects.',
        hours: 5.0,
        trainerNotes: 'Stunning capstone garment. Exemplary craftsmanship and finishing.',
        mentorNotes: 'Trainee beamed with justifiable pride presenting her completed garment.'
      },
      {
        day: 15, date: '2026-10-08',
        topic: 'Final Practical Evaluation & Trainee Portfolio Presentation',
        theory: 'Vocational viva voce, presentation skills, career pathway exploration.',
        practical: 'Presented capstone garment to evaluation panel; demonstrated speed sewing test.',
        tools: 'Presentation mannequin, display stand, training diary dossier.',
        skills: 'Technical presentation, verbal defence of construction choices, viva examination.',
        outcomes: 'Earned 94% distinction score from external and internal examination committee.',
        hours: 4.5,
        trainerNotes: 'Confident, articulate, and completely master of her trade competencies.',
        mentorNotes: 'Recommended wholeheartedly for national level certification and enterprise grant.'
      }
    ];

    for (const item of diaryData) {
      await db.query(
        `INSERT INTO training_diary (batch_id, trainee_id, module_id, day_number, training_date, topic_covered,
                                     theoretical_activities, practical_activities, tools_equipment_used,
                                     skills_learned, learning_outcomes, hours_spent, trainer_remarks, mentor_observations, created_by)
         VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batchA.id, traineeSita.id, item.day, item.date, item.topic,
          item.theory, item.practical, item.tools, item.skills, item.outcomes,
          item.hours, item.trainerNotes, item.mentorNotes, userMap['trainer.sahoo@kiss.ac.in']
        ]
      );
    }
  }

  // 13. Master Skills & Trainee Skills
  const tradeSkills = [
    { name: 'Industrial Lockstitch Machinery Control', cat: 'Machinery Operation' },
    { name: 'Anthropometric Measurement & Body Geometry', cat: 'Technical Drafting' },
    { name: 'Full-Scale Pattern Drafting & French Curve Grading', cat: 'Technical Drafting' },
    { name: 'Precision Fabric Shearing & Marker Optimization', cat: 'Cutting & Layout' },
    { name: '5-Thread Overlock Edge Finishing & Loop Balancing', cat: 'Machinery Operation' },
    { name: 'Mandarin & Shirt Collar Engineering', cat: 'Garment Construction' },
    { name: 'Symmetrical Set-in Sleeve Insertion', cat: 'Garment Construction' },
    { name: 'Concealed Zipper & Automated Buttonhole Installation', cat: 'Fasteners & Fittings' },
    { name: 'Traditional Santhal Motif Heritage Embroidery', cat: 'Cultural Embellishment' },
    { name: 'Industrial Vacuum Steam Pressing & Tolerance Inspection', cat: 'Quality Assurance' }
  ];

  for (const sk of tradeSkills) {
    let skillRec = await db.getOne(`SELECT id FROM skills WHERE name = ?`, [sk.name]);
    if (!skillRec) {
      const res = await db.query(
        `INSERT INTO skills (trade_id, name, category, description) VALUES (?, ?, ?, ?)`,
        [tradeMap['TRD-TAILOR'], sk.name, sk.cat, `Mastery in ${sk.name}`]
      );
      skillRec = { id: res.insertId };
    }

    // Assign to Sita Majhi
    const existingTs = await db.getOne(`SELECT id FROM trainee_skills WHERE trainee_id = ? AND skill_id = ?`, [traineeSita.id, skillRec.id]);
    if (!existingTs) {
      await db.query(
        `INSERT INTO trainee_skills (trainee_id, skill_id, batch_id, proficiency_level, assessed_date, certified)
         VALUES (?, ?, ?, 'Advanced Competent', '2026-10-08', 1)`,
        [traineeSita.id, skillRec.id, batchA.id]
      );
    }
  }

  // 14. Assessments & Results for Sita Majhi
  const assessmentsList = [
    { title: 'Trade Safety & Machine Mechanics Theory Test', type: 'theoretical', max: 50, pass: 25, scored: 47, date: '2026-07-20' },
    { title: 'Pattern Drafting & Fabric Shearing Practical Exam', type: 'practical', max: 50, pass: 25, scored: 46, date: '2026-08-15' },
    { title: 'Garment Assembly & Pocket Insertion Mid-Term Project', type: 'project', max: 50, pass: 25, scored: 48, date: '2026-09-05' },
    { title: 'Final Capstone Traditional Fusion Kurti Demonstration', type: 'final', max: 100, pass: 50, scored: 94, date: '2026-10-08' }
  ];

  for (const a of assessmentsList) {
    let asm = await db.getOne(`SELECT id FROM assessments WHERE batch_id = ? AND title = ?`, [batchA.id, a.title]);
    if (!asm) {
      const res = await db.query(
        `INSERT INTO assessments (batch_id, programme_id, title, assessment_type, max_marks, passing_marks, weightage_pct, evaluation_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 25.0, ?, ?)`,
        [batchA.id, apparelProg.id, a.title, a.type, a.max, a.pass, a.date, userMap['trainer.sahoo@kiss.ac.in']]
      );
      asm = { id: res.insertId };
    }

    const existingResult = await db.getOne(`SELECT id FROM assessment_results WHERE assessment_id = ? AND trainee_id = ?`, [asm.id, traineeSita.id]);
    if (!existingResult) {
      const pct = ((a.scored / a.max) * 100).toFixed(1);
      await db.query(
        `INSERT INTO assessment_results (assessment_id, trainee_id, marks_obtained, percentage, result, trainer_remarks, evaluated_by)
         VALUES (?, ?, ?, ?, 'pass', 'Superb craftsmanship and adherence to measurements.', ?)`,
        [asm.id, traineeSita.id, a.scored, pct, userMap['trainer.sahoo@kiss.ac.in']]
      );
    }
  }

  // 15. Mentor Feedback Sessions
  const existingFeedback = await db.getOne(`SELECT COUNT(*) as count FROM mentor_feedback WHERE batch_id = ? AND trainee_id = ?`, [batchA.id, traineeSita.id]);
  if (!existingFeedback || existingFeedback.count === 0) {
    const sessions = [
      {
        date: '2026-07-25',
        areas: 'Transition to vocational training, confidence building, hostel adjustment',
        strengths: 'Very punctual, shows deep respect for tools and machinery, quick learner.',
        imprv: 'Needs to ask questions more freely during larger group technical demonstrations.',
        recom: 'Pair with peer study group for theory tests; encourage active questioning.',
        obs: 'Trainee exhibits high focus and intrinsic motivation.'
      },
      {
        date: '2026-08-28',
        areas: 'Mid-term progress, practical stress management, indigenous motif design',
        strengths: 'Exceptional visual balance in traditional Santhal motif placements.',
        imprv: 'Time management during complex collar turning steps.',
        recom: 'Encourage participation in annual tribal craft exhibition.',
        obs: 'Marked increase in self-confidence and peer collaboration.'
      },
      {
        date: '2026-10-10',
        areas: 'Final graduation review, livelihood pathway, micro-enterprise grant aspiration',
        strengths: 'Complete mastery of industrial apparel sewing, meticulous quality standards.',
        imprv: 'Further exploration of digital market linkages and online commerce.',
        recom: 'Strongly recommended for advanced entrepreneurship incubation and KISS seed grant.',
        obs: 'Trainee stands out as a role model for indigenous women vocational skilling.'
      }
    ];

    for (const s of sessions) {
      await db.query(
        `INSERT INTO mentor_feedback (batch_id, trainee_id, mentor_id, session_date, areas_discussed, strengths, improvement_areas, recommendations, overall_observations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [batchA.id, traineeSita.id, mentorDas.id, s.date, s.areas, s.strengths, s.imprv, s.recom, s.obs]
      );
    }
  }

  // 16. Certificate Authority Approval & Pre-Generated Certificates for Sita Majhi
  const certNumber = 'KISS-VT-CERT-2026-0001';
  let approval = await db.getOne(`SELECT id FROM certificate_approvals WHERE batch_id = ? AND trainee_id = ?`, [batchA.id, traineeSita.id]);
  if (!approval) {
    const res = await db.query(
      `INSERT INTO certificate_approvals (batch_id, trainee_id, requested_by, authority_id, status, attendance_verified, assessments_verified, trainer_eval_verified, mentor_feedback_verified, approval_notes, approved_at)
       VALUES (?, ?, ?, ?, 'approved', 1, 1, 1, 1, 'All criteria rigorously verified. Issued under Directorate of Vocational Education authority.', CURRENT_TIMESTAMP)`,
      [batchA.id, traineeSita.id, userMap['coordinator@kiss.ac.in'], userMap['authority@kiss.ac.in']]
    );
    approval = { id: res.insertId };
  }

  // Generate both official PDFs right now!
  const { generateOfficialCertificate, generateJourneyPortfolio } = require('../services/pdfService');
  try {
    const cert1 = await generateOfficialCertificate(traineeSita.id, batchA.id, certNumber, 'http://localhost:5173');
    const cert2 = await generateJourneyPortfolio(traineeSita.id, batchA.id, certNumber, 'http://localhost:5173');

    const hash1 = crypto.createHash('sha256').update(`${certNumber}-${batchA.id}-1`).digest('hex');
    const hash2 = crypto.createHash('sha256').update(`${certNumber}-${batchA.id}-2`).digest('hex');

    const existingCert1 = await db.getOne(`SELECT id FROM certificates WHERE certificate_number = ?`, [certNumber]);
    if (!existingCert1) {
      await db.query(
        `INSERT INTO certificates (certificate_number, verification_hash, trainee_id, batch_id, programme_id, certificate_type, issue_date, qr_code_data, file_path, status, issued_by)
         VALUES (?, ?, ?, ?, ?, 'completion_certificate', '2026-10-20', ?, ?, 'valid', ?)`,
        [certNumber, hash1, traineeSita.id, batchA.id, apparelProg.id, `http://localhost:5173/verify/${certNumber}`, cert1.filePath, userMap['authority@kiss.ac.in']]
      );
    }

    const portfolioCertNo = `${certNumber}-PORTFOLIO`;
    const existingCert2 = await db.getOne(`SELECT id FROM certificates WHERE certificate_number = ?`, [portfolioCertNo]);
    if (!existingCert2) {
      await db.query(
        `INSERT INTO certificates (certificate_number, verification_hash, trainee_id, batch_id, programme_id, certificate_type, issue_date, qr_code_data, file_path, status, issued_by)
         VALUES (?, ?, ?, ?, ?, 'journey_portfolio', '2026-10-20', ?, ?, 'valid', ?)`,
        [portfolioCertNo, hash2, traineeSita.id, batchA.id, apparelProg.id, `http://localhost:5173/verify/${certNumber}`, cert2.filePath, userMap['authority@kiss.ac.in']]
      );
    }

    console.log('[Seed] Dual official certificates generated & registered successfully.');
  } catch (pdfErr) {
    console.warn('[Seed] PDF generation note:', pdfErr.message);
  }

  console.log('[Seed] Database seeding completed successfully.');
}

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
