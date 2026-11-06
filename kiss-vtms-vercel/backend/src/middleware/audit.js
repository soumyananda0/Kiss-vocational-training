const db = require('../config/db');

async function logAudit(userId, action, entityType, entityId, details, req = null) {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : 'system';
    const userAgent = req ? (req.headers['user-agent'] || 'unknown') : 'system';
    const detailString = typeof details === 'object' ? JSON.stringify(details) : String(details || '');

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, action, entityType, String(entityId || ''), ip, userAgent, detailString]
    );
  } catch (err) {
    console.error('[Audit Logging Error]:', err.message);
  }
}

module.exports = { logAudit };
