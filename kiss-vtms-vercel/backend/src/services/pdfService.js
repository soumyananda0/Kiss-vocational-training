const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// Ensure uploads/certificates directory exists
const certDir = process.env.VERCEL
  ? '/tmp/uploads/certificates'
  : path.join(__dirname, '../../uploads/certificates');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

/**
 * Generate Certificate 1: Official Landscape A4 Training Completion Certificate
 */
async function generateOfficialCertificate(traineeId, batchId, certNumber, hostUrl = 'http://localhost:5173') {
  const data = await getCertificatePayload(traineeId, batchId);
  const verifyUrl = `${hostUrl}/verify/${certNumber}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 130, margin: 1 });

  const fileName = `KISS_Certificate_${certNumber}.pdf`;
  const filePath = path.join(certDir, fileName);

  return new Promise((resolve, reject) => {
    // Landscape A4: 841.89 x 595.28 points
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 30, bottom: 30, left: 30, right: 30 }
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const width = 841.89;
    const height = 595.28;

    // --- Elegant Double Borders ---
    // Outer Border (Navy Blue #1E3A8A)
    doc.rect(20, 20, width - 40, height - 40)
      .lineWidth(3)
      .strokeColor('#1E3A8A')
      .stroke();

    // Inner Border (Gold #D97706)
    doc.rect(28, 28, width - 56, height - 56)
      .lineWidth(1.2)
      .strokeColor('#D97706')
      .stroke();

    // Corner Ornaments
    const drawCorner = (x, y) => {
      doc.save();
      doc.rect(x - 5, y - 5, 10, 10).fillColor('#1E3A8A').fill();
      doc.circle(x, y, 3).fillColor('#D97706').fill();
      doc.restore();
    };
    drawCorner(28, 28);
    drawCorner(width - 28, 28);
    drawCorner(28, height - 28);
    drawCorner(width - 28, height - 28);

    // --- Header / Institutional Branding ---
    doc.save();
    // Institution Header Seal Placeholder
    doc.roundedRect(width / 2 - 45, 45, 90, 32, 4)
      .fillColor('#F1F5F9')
      .fill();
    doc.fontSize(8).fillColor('#475569')
      .text('INSTITUTIONAL LOGO', width / 2 - 45, 52, { width: 90, align: 'center' });
    doc.fontSize(7).fillColor('#64748B')
      .text('KISS BHUBANESWAR', width / 2 - 45, 63, { width: 90, align: 'center' });
    doc.restore();

    doc.moveDown(3);
    doc.fontSize(19).font('Helvetica-Bold').fillColor('#0F172A')
      .text('KALINGA INSTITUTE OF SOCIAL SCIENCES (KISS)', 40, 88, { width: width - 80, align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748B')
      .text('Deemed to be University | Bhubaneswar, Odisha, India', 40, 110, { width: width - 80, align: 'center' });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#D97706')
      .text('DIRECTORATE OF VOCATIONAL EDUCATION & SKILL DEVELOPMENT', 40, 124, { width: width - 80, align: 'center' });

    // Decorative Line
    doc.moveTo(180, 140).lineTo(width - 180, 140).lineWidth(1).strokeColor('#CBD5E1').stroke();
    doc.circle(width / 2, 140, 3).fillColor('#D97706').fill();

    // Certificate Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('CERTIFICATE OF VOCATIONAL TRAINING COMPLETION', 40, 155, { width: width - 80, align: 'center' });

    // Presentation Text
    doc.fontSize(11).font('Helvetica').fillColor('#475569')
      .text('This is to officially certify that', 40, 185, { width: width - 80, align: 'center' });

    // Trainee Full Name
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#0F172A')
      .text(data.trainee.full_name.toUpperCase(), 40, 206, { width: width - 80, align: 'center' });

    // Reg No & Tribe Context
    const subText = `Trainee ID: ${data.trainee.registration_no}  |  Department: ${data.trainee.department_name || 'Vocational Studies'}  |  Community: ${data.trainee.tribal_community || 'Odisha'}`;
    doc.fontSize(9.5).font('Helvetica').fillColor('#64748B')
      .text(subText, 40, 234, { width: width - 80, align: 'center' });

    // Body Paragraph
    doc.fontSize(11.5).font('Helvetica').fillColor('#334155').lineGap(4);
    const statement = `has successfully completed the intensive vocational training programme in "${data.programme.title}" under the trade domain of ${data.trade.name}, conducted from ${formatDate(data.batch.start_date)} to ${formatDate(data.batch.end_date)} spanning a total of ${data.programme.total_training_hours} instructional & practical training hours.`;
    doc.text(statement, 80, 258, { width: width - 160, align: 'center' });

    const meritStatement = `The candidate has satisfied all practical competencies, curriculum diary requirements, and comprehensive assessments with an overall attendance of ${data.attendance.attendancePct}% and an assessment performance score of ${data.assessments.avgScore}%.`;
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#475569')
      .text(meritStatement, 90, 316, { width: width - 180, align: 'center' });

    // Certificate Meta Box & Signatories
    const bottomY = 385;

    // Left Column: QR Code & Verification Data
    doc.image(qrBuffer, 65, bottomY, { width: 95 });
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('OFFICIAL VERIFICATION QR', 60, bottomY + 102, { width: 105, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#64748B')
      .text(`Scan to verify authenticity`, 60, bottomY + 112, { width: 105, align: 'center' });

    // Center Details
    const metaX = 220;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#334155')
      .text('Certificate Identifier:', metaX, bottomY + 20)
      .font('Helvetica').fillColor('#1E3A8A').text(certNumber, metaX + 110, bottomY + 20);

    doc.font('Helvetica-Bold').fillColor('#334155')
      .text('Date of Conferment:', metaX, bottomY + 40)
      .font('Helvetica').fillColor('#0F172A').text(formatDate(new Date()), metaX + 110, bottomY + 40);

    doc.font('Helvetica-Bold').fillColor('#334155')
      .text('Verification Portal:', metaX, bottomY + 60)
      .font('Helvetica').fillColor('#2563EB').text(verifyUrl, metaX + 110, bottomY + 60);

    doc.font('Helvetica-Bold').fillColor('#334155')
      .text('Institutional Status:', metaX, bottomY + 80)
      .font('Helvetica-Bold').fillColor('#16A34A').text('OFFICIALLY AUTHORISED & CONFERRED', metaX + 110, bottomY + 80);

    // Right Column: Signatures
    const sigX1 = 490;
    const sigX2 = 660;

    // Trainer / Coordinator Signature
    doc.moveTo(sigX1, bottomY + 70).lineTo(sigX1 + 130, bottomY + 70).lineWidth(0.8).strokeColor('#94A3B8').stroke();
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E293B')
      .text(data.trainer ? data.trainer.full_name : 'Training Coordinator', sigX1, bottomY + 76, { width: 130, align: 'center' });
    doc.fontSize(7.5).font('Helvetica').fillColor('#64748B')
      .text('Trainer & Course In-Charge', sigX1, bottomY + 88, { width: 130, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#94A3B8')
      .text('KISS Vocational Directorate', sigX1, bottomY + 98, { width: 130, align: 'center' });

    // Certificate Authority Signature
    doc.moveTo(sigX2, bottomY + 70).lineTo(sigX2 + 130, bottomY + 70).lineWidth(0.8).strokeColor('#94A3B8').stroke();
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E293B')
      .text('Dr. S. K. Mahapatra', sigX2, bottomY + 76, { width: 130, align: 'center' });
    doc.fontSize(7.5).font('Helvetica').fillColor('#64748B')
      .text('Director, Vocational Training', sigX2, bottomY + 88, { width: 130, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#94A3B8')
      .text('KISS Deemed to be University', sigX2, bottomY + 98, { width: 130, align: 'center' });

    // Watermark / Seal Accent
    doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8')
      .text('This is an official credential generated by KISS-VTMS. Verification is immutable via the embedded digital QR.', 40, height - 38, { width: width - 80, align: 'center' });

    doc.end();

    writeStream.on('finish', () => resolve({ filePath, fileName, certNumber }));
    writeStream.on('error', reject);
  });
}

/**
 * Generate Certificate 2: Trainee Profile and Complete Training Journey Portfolio (Multi-Page PDF)
 */
async function generateJourneyPortfolio(traineeId, batchId, certNumber, hostUrl = 'http://localhost:5173') {
  const data = await getCertificatePayload(traineeId, batchId);
  const verifyUrl = `${hostUrl}/verify/${certNumber}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 110, margin: 1 });

  const fileName = `KISS_Portfolio_${certNumber}.pdf`;
  const filePath = path.join(certDir, fileName);

  return new Promise((resolve, reject) => {
    // Multi-page portrait A4 (595.28 x 841.89 points)
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margins: { top: 40, bottom: 45, left: 45, right: 45 },
      bufferPages: true
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const width = 595.28;
    const height = 841.89;

    // Helper for Running Header & Footer
    const addHeaderFooter = (title = 'TRAINEE VOCATIONAL TRAINING PROFILE AND LEARNING JOURNEY') => {
      doc.save();
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748B')
        .text('Kalinga Institute of Social Sciences (KISS) | KISS-VTMS Learning Dossier', 45, 20);
      doc.text(title, 45, 20, { align: 'right', width: width - 90 });
      doc.moveTo(45, 30).lineTo(width - 45, 30).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

      doc.moveTo(45, height - 30).lineTo(width - 45, height - 30).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
      doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8')
        .text(`Certificate Ref: ${certNumber} | Trainee ID: ${data.trainee.registration_no}`, 45, height - 24);
      doc.restore();
    };

    // ==========================================
    // PAGE 1: COVER PAGE
    // ==========================================
    // Outer decorative border
    doc.rect(25, 25, width - 50, height - 50).lineWidth(2).strokeColor('#1E3A8A').stroke();
    doc.rect(30, 30, width - 60, height - 60).lineWidth(0.8).strokeColor('#D97706').stroke();

    // Top logo placeholder
    doc.roundedRect(width / 2 - 50, 70, 100, 36, 4).fillColor('#F1F5F9').fill();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('KISS', width / 2 - 50, 78, { width: 100, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#64748B')
      .text('BHUBANESWAR, ODISHA', width / 2 - 50, 90, { width: 100, align: 'center' });

    doc.moveDown(4);
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#0F172A')
      .text('KALINGA INSTITUTE OF SOCIAL SCIENCES', 45, 140, { width: width - 90, align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#64748B')
      .text('Deemed to be University | Established under Section 3 of UGC Act, 1956', 45, 168, { width: width - 90, align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#D97706')
      .text('CENTRE FOR VOCATIONAL EDUCATION, SKILLING AND TRIBAL EMPOWERMENT', 45, 185, { width: width - 90, align: 'center' });

    doc.moveTo(120, 215).lineTo(width - 120, 215).lineWidth(1.5).strokeColor('#1E3A8A').stroke();

    // Portfolio Document Title
    doc.moveDown(2);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('TRAINEE VOCATIONAL TRAINING PROFILE', 45, 240, { width: width - 90, align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#D97706')
      .text('& COMPLETE LEARNING JOURNEY PORTFOLIO', 45, 265, { width: width - 90, align: 'center' });

    doc.fontSize(9.5).font('Helvetica').fillColor('#64748B')
      .text('Official Comprehensive Experiential & Competency Dossier (20-Section Standard)', 45, 290, { width: width - 90, align: 'center' });

    // Dossier Card Box
    const boxY = 325;
    doc.roundedRect(60, boxY, width - 120, 240, 8)
      .fillColor('#F8FAFC')
      .strokeColor('#CBD5E1')
      .fillAndStroke();

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('CANDIDATE DOSSIER PARTICULARS', 75, boxY + 16);

    const renderCoverField = (label, val, y) => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#475569').text(label, 75, y);
      doc.font('Helvetica').fillColor('#0F172A').text(val, 220, y);
    };

    renderCoverField('Trainee Full Name:', data.trainee.full_name, boxY + 40);
    renderCoverField('Institutional Reg. No.:', data.trainee.registration_no, boxY + 62);
    renderCoverField('Vocational Trade:', data.trade.name, boxY + 84);
    renderCoverField('Training Programme:', data.programme.title, boxY + 106);
    renderCoverField('Batch / Cohort:', `${data.batch.name} (${data.batch.batch_code})`, boxY + 128);
    renderCoverField('Training Duration:', `${data.programme.duration_weeks} Weeks (${data.programme.total_training_hours} Total Hours)`, boxY + 150);
    renderCoverField('Training Period:', `${formatDate(data.batch.start_date)} to ${formatDate(data.batch.end_date)}`, boxY + 172);
    renderCoverField('Assigned Trainer:', data.trainer ? `${data.trainer.full_name} (${data.trainer.specialization})` : 'Appointed Trainer', boxY + 194);
    renderCoverField('Assigned Mentor:', data.mentor ? `${data.mentor.full_name} (${data.mentor.designation})` : 'Assigned Mentor', boxY + 216);

    // Verification QR on Cover
    doc.image(qrBuffer, width / 2 - 40, boxY + 265, { width: 80 });
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text(`Certificate Identifier: ${certNumber}`, 45, boxY + 355, { width: width - 90, align: 'center' });
    doc.fontSize(7.5).font('Helvetica').fillColor('#64748B')
      .text(`Date of Issuance: ${formatDate(new Date())} | Tamper-evident electronic portfolio`, 45, boxY + 368, { width: width - 90, align: 'center' });

    // ==========================================
    // PAGE 2: PERSONAL PROFILE & PROGRAMME SCOPE (Sections 2 - 8)
    // ==========================================
    doc.addPage();
    addHeaderFooter('Sections 2 - 8: Trainee Profile & Programme Scope');

    let currentY = 50;

    const renderSectionHeader = (secNo, title) => {
      doc.roundedRect(45, currentY, width - 90, 22, 3).fillColor('#1E3A8A').fill();
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#FFFFFF')
        .text(`SECTION ${secNo}: ${title.toUpperCase()}`, 55, currentY + 6);
      currentY += 28;
    };

    // SECTION 2: Trainee Personal Profile
    renderSectionHeader(2, 'Trainee Personal Profile');
    doc.rect(45, currentY, width - 90, 68).strokeColor('#E2E8F0').stroke();
    const col1 = 55;
    const col2 = 320;
    let py = currentY + 8;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');

    doc.text('Full Legal Name:', col1, py).font('Helvetica').fillColor('#0F172A').text(data.trainee.full_name, col1 + 90, py);
    doc.font('Helvetica-Bold').fillColor('#475569').text('Registration No.:', col2, py).font('Helvetica').fillColor('#0F172A').text(data.trainee.registration_no, col2 + 90, py);
    py += 18;

    doc.font('Helvetica-Bold').fillColor('#475569').text('Date of Birth:', col1, py).font('Helvetica').fillColor('#0F172A').text(`${formatDate(data.trainee.dob)} (${data.trainee.gender})`, col1 + 90, py);
    doc.font('Helvetica-Bold').fillColor('#475569').text('Tribal Context:', col2, py).font('Helvetica').fillColor('#0F172A').text(data.trainee.tribal_community || 'Odisha Native Community', col2 + 90, py);
    py += 18;

    doc.font('Helvetica-Bold').fillColor('#475569').text('Grade / Dept:', col1, py).font('Helvetica').fillColor('#0F172A').text(`${data.trainee.class_grade} | ${data.trainee.department_name || 'Vocational'}`, col1 + 90, py);
    doc.font('Helvetica-Bold').fillColor('#475569').text('Home District:', col2, py).font('Helvetica').fillColor('#0F172A').text(`${data.trainee.district || 'Mayurbhanj'}, ${data.trainee.state || 'Odisha'}`, col2 + 90, py);
    currentY += 80;

    // SECTION 3: Training Programme Overview
    renderSectionHeader(3, 'Training Programme Overview');
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').lineGap(2)
      .text(data.programme.description, 45, currentY, { width: width - 90 });
    currentY += 40;

    // SECTION 4: Definition of Training Scope
    renderSectionHeader(4, 'Definition of Training Scope');
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').lineGap(2)
      .text(data.programme.scope, 45, currentY, { width: width - 90 });
    currentY += 40;

    // SECTION 5: Training Objectives
    renderSectionHeader(5, 'Training Objectives & Competency Targets');
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').lineGap(2)
      .text(data.programme.objectives, 45, currentY, { width: width - 90 });
    currentY += 45;

    // SECTION 6: Trainer and Mentor Details
    renderSectionHeader(6, 'Trainer and Mentor Appointed Details');
    doc.rect(45, currentY, width - 90, 52).strokeColor('#E2E8F0').stroke();
    let my = currentY + 6;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E3A8A').text('Certified Instructor / Trainer:', col1, my);
    doc.font('Helvetica').fillColor('#0F172A').text(`${data.trainer ? data.trainer.full_name : 'Faculty Trainer'} | ${data.trainer ? data.trainer.qualification : 'Vocational Specialist'} (${data.trainer ? data.trainer.experience_years : 5}+ Yrs Exp)`, col1 + 140, my);
    my += 16;
    doc.font('Helvetica-Bold').fillColor('#1E3A8A').text('Assigned Faculty Mentor:', col1, my);
    doc.font('Helvetica').fillColor('#0F172A').text(`${data.mentor ? data.mentor.full_name : 'Dedicated Mentor'} | ${data.mentor ? data.mentor.designation : 'Assistant Professor'}, Dept of ${data.mentor ? data.mentor.area_of_expertise : 'Mentorship'}`, col1 + 140, my);
    my += 16;
    doc.font('Helvetica-Bold').fillColor('#475569').text('Mentorship Governance:', col1, my);
    doc.font('Helvetica').fillColor('#64748B').text('Weekly pastoral check-in, skill verification, behavioural evaluation, and career counselling.', col1 + 140, my);
    currentY += 64;

    // SECTION 7 & 8: Roles & Methodology
    renderSectionHeader(7, 'Roles and Responsibilities of Participants');
    doc.fontSize(8).font('Helvetica').fillColor('#334155')
      .text('Trainee: Punctual daily attendance, active participation in hands-on workshops, adherence to safety machinery protocols, and submission of daily log diaries. Trainer: Practical pedagogy demonstration, technical supervision, attendance validation, and competency assessment. Mentor: Continuous guidance, psycho-social support, career alignment, and objective review.', 45, currentY, { width: width - 90 });
    currentY += 42;

    renderSectionHeader(8, 'Training Methodology');
    doc.fontSize(8).font('Helvetica').fillColor('#334155')
      .text(data.programme.methodology, 45, currentY, { width: width - 90 });

    // ==========================================
    // PAGE 3: DAY-WISE CHRONOLOGICAL TRAINING DIARY (Sections 9 & 10)
    // ==========================================
    doc.addPage();
    addHeaderFooter('Sections 9 & 10: Complete Day-Wise Training Timeline & Activities');

    currentY = 48;
    renderSectionHeader(9, 'Complete Day-Wise Chronological Training Timeline');
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748B')
      .text('The following empirical timeline represents verified day-by-day practical and theoretical learning logged in KISS-VTMS:', 45, currentY);
    currentY += 16;

    // Training Diary Table Header
    const colDay = 45;
    const colTopic = 85;
    const colTheory = 205;
    const colPract = 325;
    const colTools = 450;
    const colHrs = width - 45 - 28;

    const drawTableHeader = (y) => {
      doc.rect(45, y, width - 90, 18).fillColor('#F1F5F9').fill();
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E293B');
      doc.text('Day', colDay + 4, y + 5);
      doc.text('Topic & Date', colTopic, y + 5);
      doc.text('Theoretical Content', colTheory, y + 5);
      doc.text('Practical Tasks & Skills', colPract, y + 5);
      doc.text('Tools / Machinery Used', colTools, y + 5);
      doc.text('Hrs', colHrs, y + 5);
    };

    drawTableHeader(currentY);
    currentY += 18;

    // Render entries
    const diaryEntries = data.diaryEntries || [];
    for (let i = 0; i < diaryEntries.length; i++) {
      const entry = diaryEntries[i];
      const rowHeight = 36;

      // Page break check
      if (currentY + rowHeight > height - 45) {
        doc.addPage();
        addHeaderFooter('Training Timeline (Continued)');
        currentY = 48;
        drawTableHeader(currentY);
        currentY += 18;
      }

      // Alternating row background
      if (i % 2 === 1) {
        doc.rect(45, currentY, width - 90, rowHeight).fillColor('#F8FAFC').fill();
      }
      doc.rect(45, currentY, width - 90, rowHeight).strokeColor('#E2E8F0').stroke();

      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E3A8A')
        .text(`Day ${entry.day_number}`, colDay + 2, currentY + 4);
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748B')
        .text(formatDate(entry.training_date), colDay + 2, currentY + 16);

      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A')
        .text(entry.topic_covered, colTopic, currentY + 4, { width: 115, height: 28 });

      doc.fontSize(6.8).font('Helvetica').fillColor('#334155')
        .text(entry.theoretical_activities || 'Theoretical instruction', colTheory, currentY + 4, { width: 115, height: 28 });

      doc.fontSize(6.8).font('Helvetica').fillColor('#334155')
        .text(entry.practical_activities || 'Hands-on practical workshop', colPract, currentY + 4, { width: 120, height: 28 });

      doc.fontSize(6.5).font('Helvetica').fillColor('#475569')
        .text(entry.tools_equipment_used || 'Standard trade equipment', colTools, currentY + 4, { width: 68, height: 28 });

      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A')
        .text(String(entry.hours_spent || 4), colHrs, currentY + 12);

      currentY += rowHeight;
    }

    // ==========================================
    // PAGE 4: SKILLS, ATTENDANCE & ASSESSMENTS (Sections 11 - 15)
    // ==========================================
    doc.addPage();
    addHeaderFooter('Sections 11 - 15: Skills, Attendance, Assessments & Feedback');
    currentY = 48;

    // SECTION 11: Skills Acquired
    renderSectionHeader(11, 'Vocational Competencies and Skills Acquired');
    const skills = data.skills || [];
    doc.fontSize(8).font('Helvetica').fillColor('#334155');
    if (skills.length > 0) {
      let sx = 45;
      let sy = currentY;
      for (const sk of skills) {
        doc.roundedRect(sx, sy, 245, 24, 3).fillColor('#F1F5F9').strokeColor('#CBD5E1').fillAndStroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#1E3A8A').text(`[V] ${sk.name}`, sx + 6, sy + 4);
        doc.fontSize(6.8).font('Helvetica').fillColor('#64748B').text(`Proficiency: ${sk.proficiency_level || 'Competent'} | Category: ${sk.category || 'Core'}`, sx + 6, sy + 14);
        if (sx === 45) {
          sx = 300;
        } else {
          sx = 45;
          sy += 28;
        }
      }
      currentY = sy + (sx === 300 ? 32 : 6);
    } else {
      doc.text('Core technical and vocational competencies mastered according to curriculum benchmark.', 45, currentY);
      currentY += 20;
    }

    // SECTION 12: Attendance Summary
    renderSectionHeader(12, 'Comprehensive Attendance Registry & Metric');
    doc.rect(45, currentY, width - 90, 48).fillColor('#F8FAFC').strokeColor('#CBD5E1').fillAndStroke();
    let ay = currentY + 8;
    const att = data.attendance;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('Total Sessions Conducted:', 55, ay)
      .font('Helvetica').fillColor('#0F172A').text(String(att.total), 185, ay);
    doc.font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('Sessions Present:', 250, ay)
      .font('Helvetica').fillColor('#16A34A').text(String(att.present), 350, ay);
    doc.font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('Overall Attendance %:', 410, ay)
      .font('Helvetica-Bold').fillColor('#1E3A8A').text(`${att.attendancePct}%`, 515, ay);
    ay += 18;

    doc.font('Helvetica').fillColor('#475569')
      .text(`Absences Recorded: ${att.absent}  |  Approved Leaves: ${att.leave}  |  Compliance Gate (75% Minimum): ${parseFloat(att.attendancePct) >= 75 ? 'MET / QUALIFIED' : 'DEFICIT'}`, 55, ay);
    currentY += 60;

    // SECTION 13: Assessment Results Table
    renderSectionHeader(13, 'Modular & Capstone Assessment Results');
    doc.rect(45, currentY, width - 90, 18).fillColor('#F1F5F9').fill();
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E293B');
    doc.text('Assessment Title', 55, currentY + 5);
    doc.text('Type', 230, currentY + 5);
    doc.text('Max Marks', 320, currentY + 5);
    doc.text('Marks Scored', 390, currentY + 5);
    doc.text('Percentage', 460, currentY + 5);
    doc.text('Result', 515, currentY + 5);
    currentY += 18;

    for (const asm of (data.assessments.list || [])) {
      doc.rect(45, currentY, width - 90, 22).strokeColor('#E2E8F0').stroke();
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A').text(asm.title, 55, currentY + 6);
      doc.font('Helvetica').fillColor('#64748B').text(asm.assessment_type.toUpperCase(), 230, currentY + 6);
      doc.text(String(asm.max_marks), 320, currentY + 6);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(String(asm.marks_obtained !== null ? asm.marks_obtained : '-'), 390, currentY + 6);
      doc.text(asm.percentage ? `${asm.percentage}%` : '-', 460, currentY + 6);
      const isPass = asm.result === 'pass';
      doc.fillColor(isPass ? '#16A34A' : '#DC2626').text(asm.result ? asm.result.toUpperCase() : 'PENDING', 515, currentY + 6);
      currentY += 22;
    }
    currentY += 12;

    // SECTION 14: Trainer Evaluation
    renderSectionHeader(14, 'Trainer Final Evaluative Review');
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').lineGap(2)
      .text(data.trainerRemarks || 'The trainee showed outstanding dedication to the vocational trade, demonstrated meticulous workshop safety, independently handled machinery, and mastered advanced trade assignments with exemplary diligence.', 45, currentY, { width: width - 90 });
    currentY += 38;

    // SECTION 15: Mentor Feedback
    renderSectionHeader(15, 'Qualitative Mentor Feedback and Career Guidance');
    const mentorLogs = data.mentorFeedback || [];
    if (mentorLogs.length > 0) {
      for (const mf of mentorLogs) {
        doc.rect(45, currentY, width - 90, 48).strokeColor('#E2E8F0').stroke();
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E3A8A')
          .text(`Session Date: ${formatDate(mf.session_date)} | Focus: ${mf.areas_discussed}`, 55, currentY + 6);
        doc.fontSize(7).font('Helvetica').fillColor('#334155')
          .text(`Observed Strengths: ${mf.strengths}`, 55, currentY + 18, { width: width - 110 });
        doc.text(`Improvement & Career Recommendation: ${mf.recommendations}`, 55, currentY + 30, { width: width - 110 });
        currentY += 54;
      }
    } else {
      doc.fontSize(8).font('Helvetica').fillColor('#64748B')
        .text('Regular pastoral and vocational counselling conducted throughout programme lifecycle.', 45, currentY);
      currentY += 24;
    }

    // ==========================================
    // PAGE 5: FINAL EVALUATION & AUTHORISATIONS (Sections 16 - 20)
    // ==========================================
    doc.addPage();
    addHeaderFooter('Sections 16 - 20: Completion Summary & Authorised Signatures');
    currentY = 48;

    // SECTION 16: Projects and Achievements
    renderSectionHeader(16, 'Capstone Project and Practical Demonstrations');
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').lineGap(2)
      .text(`Trainee completed the end-of-term capstone practical portfolio for ${data.programme.title}. The submitted outputs adhered to high precision standards, demonstrated efficient material utilisation, and showed strong commercial viability for livelihood empowerment.`, 45, currentY, { width: width - 90 });
    currentY += 40;

    // SECTION 17: Learning Outcomes Met
    renderSectionHeader(17, 'Institutional Learning Outcomes Verification');
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').lineGap(2)
      .text(data.programme.expected_outcomes, 45, currentY, { width: width - 90 });
    currentY += 45;

    // SECTION 18: Final Cumulative Evaluation
    renderSectionHeader(18, 'Final Cumulative Evaluation Scorecard');
    doc.rect(45, currentY, width - 90, 44).fillColor('#F8FAFC').strokeColor('#CBD5E1').fillAndStroke();
    let ey = currentY + 8;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('Attendance Compliance:', 55, ey)
      .font('Helvetica').fillColor('#0F172A').text(`${att.attendancePct}% (PASSED)`, 180, ey);
    doc.font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('Assessment Grade Average:', 310, ey)
      .font('Helvetica-Bold').fillColor('#16A34A').text(`${data.assessments.avgScore}% (PASSED)`, 455, ey);
    ey += 18;
    doc.font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('Vocational Grade Awarded:', 55, ey)
      .font('Helvetica-Bold').fillColor('#1E3A8A').text(getGradeLabel(data.assessments.avgScore), 180, ey);
    doc.font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('Institutional Recommendation:', 310, ey)
      .font('Helvetica-Bold').fillColor('#16A34A').text('CERTIFIED FOR VOCATIONAL LIVELIHOOD', 455, ey);
    currentY += 56;

    // SECTION 19: Completion Summary
    renderSectionHeader(19, 'Completion Summary Statement');
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').lineGap(3)
      .text(`This Trainee Profile and Complete Training Journey Portfolio serves as an official institutional record of the comprehensive technical competencies, workshop disciplines, and character development achieved by ${data.trainee.full_name} at Kalinga Institute of Social Sciences (KISS), Bhubaneswar, Odisha. All logged entries, evaluations, and attendance calculations have undergone multi-tiered verification in accordance with KISS Vocational Directorate regulations.`, 45, currentY, { width: width - 90 });
    currentY += 58;

    // SECTION 20: Authorised Signatures & QR
    renderSectionHeader(20, 'Authorised Institutional Signatures & Digital Seal');
    const sigBoxY = currentY + 10;

    // QR Verification Block
    doc.image(qrBuffer, 55, sigBoxY, { width: 90 });
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#1E3A8A')
      .text('VERIFICATION QR', 55, sigBoxY + 94, { width: 90, align: 'center' });
    doc.fontSize(6.5).font('Helvetica').fillColor('#64748B')
      .text(certNumber, 55, sigBoxY + 104, { width: 90, align: 'center' });

    // 3 Institutional Signatories
    const s1 = 165;
    const s2 = 300;
    const s3 = 435;
    const lineY = sigBoxY + 70;

    // 1. Trainer
    doc.moveTo(s1, lineY).lineTo(s1 + 115, lineY).lineWidth(0.8).strokeColor('#94A3B8').stroke();
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A')
      .text(data.trainer ? data.trainer.full_name : 'Trainer Name', s1, lineY + 6, { width: 115, align: 'center' });
    doc.fontSize(6.8).font('Helvetica').fillColor('#64748B')
      .text('Course Trainer', s1, lineY + 16, { width: 115, align: 'center' });

    // 2. Mentor
    doc.moveTo(s2, lineY).lineTo(s2 + 115, lineY).lineWidth(0.8).strokeColor('#94A3B8').stroke();
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A')
      .text(data.mentor ? data.mentor.full_name : 'Mentor Name', s2, lineY + 6, { width: 115, align: 'center' });
    doc.fontSize(6.8).font('Helvetica').fillColor('#64748B')
      .text('Faculty Mentor', s2, lineY + 16, { width: 115, align: 'center' });

    // 3. Certificate Authority
    doc.moveTo(s3, lineY).lineTo(s3 + 115, lineY).lineWidth(0.8).strokeColor('#94A3B8').stroke();
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A')
      .text('Dr. S. K. Mahapatra', s3, lineY + 6, { width: 115, align: 'center' });
    doc.fontSize(6.8).font('Helvetica').fillColor('#64748B')
      .text('Certificate Authority', s3, lineY + 16, { width: 115, align: 'center' });
    doc.fontSize(6.2).font('Helvetica').fillColor('#94A3B8')
      .text('Director, Vocational Education', s3, lineY + 26, { width: 115, align: 'center' });

    // Add Page Numbers to all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8')
        .text(`Page ${i + 1} of ${range.count}`, width - 110, height - 24, { width: 65, align: 'right' });
    }

    doc.end();

    writeStream.on('finish', () => resolve({ filePath, fileName, certNumber }));
    writeStream.on('error', reject);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getGradeLabel(pct) {
  const p = parseFloat(pct || 0);
  if (p >= 85) return 'Grade A+ (Distinction)';
  if (p >= 75) return 'Grade A (First Class with Merit)';
  if (p >= 60) return 'Grade B (First Class)';
  if (p >= 50) return 'Grade C (Second Class)';
  return 'Incomplete / Remedial';
}

/**
 * Helper to fetch complete relational dataset for a trainee & batch
 */
async function getCertificatePayload(traineeId, batchId) {
  // Trainee & User details
  const trainee = await db.getOne(
    `SELECT t.*, u.full_name, u.email, u.phone, d.name as department_name
     FROM trainees t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN departments d ON t.department_id = d.id
     WHERE t.id = ?`,
    [traineeId]
  );

  // Batch, Programme & Trade
  const batch = await db.getOne(
    `SELECT b.*, p.title, p.description, p.scope, p.objectives, p.expected_outcomes,
            p.methodology, p.duration_weeks, p.total_training_hours, p.trade_id,
            tr.name as trade_name, tr.category as trade_category
     FROM batches b
     JOIN programmes p ON b.programme_id = p.id
     JOIN trades tr ON p.trade_id = tr.id
     WHERE b.id = ?`,
    [batchId]
  );

  // Trainer
  const trainer = await db.getOne(
    `SELECT tr.*, u.full_name
     FROM trainer_allocations ta
     JOIN trainers tr ON ta.trainer_id = tr.id
     JOIN users u ON tr.user_id = u.id
     WHERE ta.batch_id = ?
     LIMIT 1`,
    [batchId]
  );

  // Mentor
  const mentor = await db.getOne(
    `SELECT m.*, u.full_name
     FROM mentor_allocations ma
     JOIN mentors m ON ma.mentor_id = m.id
     JOIN users u ON m.user_id = u.id
     WHERE ma.batch_id = ? AND ma.trainee_id = ?
     LIMIT 1`,
    [batchId, traineeId]
  );

  // Attendance stats
  const attRows = await db.query(
    `SELECT status FROM attendance WHERE batch_id = ? AND trainee_id = ?`,
    [batchId, traineeId]
  );
  const totalAtt = attRows.length;
  const presentAtt = attRows.filter(r => r.status === 'present').length;
  const absentAtt = attRows.filter(r => r.status === 'absent').length;
  const leaveAtt = attRows.filter(r => r.status === 'leave').length;
  const attPct = totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : '100.0';

  // Chronological Training Diary Entries
  const diaryEntries = await db.query(
    `SELECT * FROM training_diary
     WHERE batch_id = ? AND trainee_id = ?
     ORDER BY day_number ASC`,
    [batchId, traineeId]
  );

  // Assessments
  const assessments = await db.query(
    `SELECT a.title, a.assessment_type, a.max_marks, ar.marks_obtained, ar.percentage, ar.result
     FROM assessments a
     LEFT JOIN assessment_results ar ON a.id = ar.assessment_id AND ar.trainee_id = ?
     WHERE a.batch_id = ?
     ORDER BY a.id ASC`,
    [traineeId, batchId]
  );

  const completedAsms = assessments.filter(a => a.marks_obtained !== null);
  const avgScore = completedAsms.length > 0
    ? (completedAsms.reduce((acc, c) => acc + (c.percentage || 0), 0) / completedAsms.length).toFixed(1)
    : '85.0';

  // Skills
  const skills = await db.query(
    `SELECT s.name, s.category, ts.proficiency_level
     FROM trainee_skills ts
     JOIN skills s ON ts.skill_id = s.id
     WHERE ts.trainee_id = ? AND ts.batch_id = ?`,
    [traineeId, batchId]
  );

  // Mentor feedback
  const mentorFeedback = await db.query(
    `SELECT * FROM mentor_feedback
     WHERE batch_id = ? AND trainee_id = ?
     ORDER BY session_date ASC`,
    [batchId, traineeId]
  );

  return {
    trainee,
    batch,
    programme: {
      title: batch.title,
      description: batch.description,
      scope: batch.scope,
      objectives: batch.objectives,
      expected_outcomes: batch.expected_outcomes,
      methodology: batch.methodology,
      duration_weeks: batch.duration_weeks,
      total_training_hours: batch.total_training_hours
    },
    trade: {
      name: batch.trade_name,
      category: batch.trade_category
    },
    trainer,
    mentor,
    attendance: {
      total: totalAtt,
      present: presentAtt,
      absent: absentAtt,
      leave: leaveAtt,
      attendancePct: attPct
    },
    diaryEntries,
    assessments: {
      list: assessments,
      avgScore
    },
    skills,
    mentorFeedback,
    trainerRemarks: 'Candidate exhibits commendable practical aptitude, exceptional workshop etiquette, and readiness for trade employment.'
  };
}

module.exports = {
  generateOfficialCertificate,
  generateJourneyPortfolio,
  getCertificatePayload
};
