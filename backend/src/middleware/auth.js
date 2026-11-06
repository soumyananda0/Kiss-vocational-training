const { verifyToken } = require('../utils/auth');
const db = require('../config/db');

async function authenticateToken(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }

  try {
    const user = await db.getOne(
      `SELECT u.id, u.email, u.full_name, u.role_id, u.is_active, r.role_key, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(403).json({ success: false, error: 'User account not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]:', err);
    return res.status(500).json({ success: false, error: 'Internal authentication error.' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (req.user.role_key === 'super_admin' || roles.includes(req.user.role_key)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Access denied. Requires one of roles: ${roles.join(', ')}. Your role is: ${req.user.role_key}`
    });
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
