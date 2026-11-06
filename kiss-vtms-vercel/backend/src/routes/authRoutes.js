const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { comparePassword, hashPassword, generateToken } = require('../utils/auth');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const user = await db.getOne(
      `SELECT u.*, r.role_key, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (!user) {
      await logAudit(null, 'LOGIN_FAILED_NOT_FOUND', 'auth', null, { email }, req);
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account has been deactivated. Please contact administrator.' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      await logAudit(user.id, 'LOGIN_FAILED_PASSWORD', 'auth', user.id, { email }, req);
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Update last_login
    await db.query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

    // Fetch contextual profile ID if trainee/trainer/mentor
    let profileData = null;
    if (user.role_key === 'trainee') {
      profileData = await db.getOne(`SELECT * FROM trainees WHERE user_id = ?`, [user.id]);
    } else if (user.role_key === 'trainer') {
      profileData = await db.getOne(`SELECT * FROM trainers WHERE user_id = ?`, [user.id]);
    } else if (user.role_key === 'mentor') {
      profileData = await db.getOne(`SELECT * FROM mentors WHERE user_id = ?`, [user.id]);
    }

    const token = generateToken({
      userId: user.id,
      roleId: user.role_id,
      roleKey: user.role_key
    });

    await logAudit(user.id, 'LOGIN_SUCCESS', 'auth', user.id, { role: user.role_key }, req);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          roleKey: user.role_key,
          roleName: user.role_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          profile: profileData
        }
      }
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ success: false, error: 'Server error during authentication.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let profileData = null;
    if (user.role_key === 'trainee') {
      profileData = await db.getOne(`SELECT * FROM trainees WHERE user_id = ?`, [user.id]);
    } else if (user.role_key === 'trainer') {
      profileData = await db.getOne(`SELECT * FROM trainers WHERE user_id = ?`, [user.id]);
    } else if (user.role_key === 'mentor') {
      profileData = await db.getOne(`SELECT * FROM mentors WHERE user_id = ?`, [user.id]);
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          roleKey: user.role_key,
          roleName: user.role_name,
          profile: profileData
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
  }

  try {
    const user = await db.getOne(`SELECT password_hash FROM users WHERE id = ?`, [req.user.id]);
    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    }

    const newHash = await hashPassword(newPassword);
    await db.query(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newHash, req.user.id]);
    await logAudit(req.user.id, 'PASSWORD_CHANGED', 'users', req.user.id, {}, req);

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
