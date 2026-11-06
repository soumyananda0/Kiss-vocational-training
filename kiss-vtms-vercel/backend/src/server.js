const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const traineeRoutes = require('./routes/traineeRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const programmeRoutes = require('./routes/programmeRoutes');
const batchRoutes = require('./routes/batchRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const diaryRoutes = require('./routes/diaryRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for generated certificates
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please try again after 1 minute.' }
});

// Mount Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trainees', traineeRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/mentor-feedback', mentorRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);

// Serve production frontend if built
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'KISS Vocational Training Management System (KISS-VTMS)',
    institution: 'Kalinga Institute of Social Sciences (KISS) Deemed to be University',
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred.'
  });
});

// Initialize Schema and Auto-Seed if empty
async function initializeSystem() {
  try {
    const schemaFile = path.join(__dirname, '../migrations/01_schema.sql');
    if (fs.existsSync(schemaFile)) {
      const sql = fs.readFileSync(schemaFile, 'utf8');
      await db.exec(sql);
      console.log('[System Init] Relational schema verified (23 Tables).');
    }

    // Check if users table is populated; if not, automatically seed demo data
    const userCount = await db.getOne(`SELECT COUNT(*) as count FROM users`);
    if (!userCount || userCount.count === 0) {
      console.log('[System Init] Empty database detected. Seeding realistic KISS demonstration records...');
      const { seedDatabase } = require('./seeders/seed');
      await seedDatabase();
      console.log('[System Init] Demonstration data successfully seeded.');
    }
  } catch (err) {
    console.error('[System Init Error]:', err);
  }
}

const ready = initializeSystem();

// Run as a normal server locally; on Vercel the app is exported instead.
if (require.main === module) {
  ready.then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  KISS-VTMS Backend Server running on port ${PORT}  `);
      console.log(`  API Base URL: http://localhost:${PORT}/api        `);
      console.log(`====================================================`);
    });
  });
}

module.exports = app;
module.exports.ready = ready;
