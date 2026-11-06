const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { hashPassword } = require('../utils/auth');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/users
router.get('/', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const users = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.last_login, u.created_at,
              r.id as role_id, r.role_key, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.id ASC`
    );
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users
router.post('/', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { email, password, full_name, role_id, phone } = req.body;
  if (!email || !password || !full_name || !role_id) {
    return res.status(400).json({ success: false, error: 'Required fields missing.' });
  }

  try {
    const existing = await db.getOne(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`, [email]);
    if (existing) return res.status(400).json({ success: false, error: 'Email already exists.' });

    const passwordHash = await hashPassword(password);
    const result = await db.query(
      `INSERT INTO users (role_id, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)`,
      [role_id, email.trim(), passwordHash, full_name.trim(), phone || null]
    );

    await logAudit(req.user.id, 'CREATE_USER', 'users', result.insertId, { email, role_id }, req);
    return res.status(201).json({ success: true, message: 'User created successfully.', data: { id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id/toggle-status
router.put('/:id/toggle-status', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await db.getOne(`SELECT is_active FROM users WHERE id = ?`, [userId]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const newStatus = user.is_active ? 0 : 1;
    await db.query(`UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newStatus, userId]);
    await logAudit(req.user.id, 'TOGGLE_USER_STATUS', 'users', userId, { is_active: newStatus }, req);

    return res.json({ success: true, message: `User ${newStatus ? 'activated' : 'deactivated'} successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
