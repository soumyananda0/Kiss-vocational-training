const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// GET /api/trades
router.get('/', authenticateToken, async (req, res) => {
  try {
    const trades = await db.query(
      `SELECT tr.*, 
              (SELECT COUNT(*) FROM programmes p WHERE p.trade_id = tr.id) as programme_count,
              (SELECT COUNT(DISTINCT e.trainee_id) 
               FROM programmes p 
               JOIN batches b ON p.id = b.programme_id 
               JOIN enrolments e ON b.id = e.batch_id 
               WHERE p.trade_id = tr.id) as enrolled_count
       FROM trades tr
       ORDER BY tr.id ASC`
    );
    return res.json({ success: true, data: trades });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/trades
router.post('/', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { trade_code, name, category, description, skills_covered, required_equipment, training_level } = req.body;
  if (!trade_code || !name || !category || !description) {
    return res.status(400).json({ success: false, error: 'Trade code, name, category, and description are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO trades (trade_code, name, category, description, skills_covered, required_equipment, training_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [trade_code.trim(), name.trim(), category.trim(), description.trim(), skills_covered || null, required_equipment || null, training_level || 'Foundation']
    );

    await logAudit(req.user.id, 'CREATE_TRADE', 'trades', result.insertId, { name, trade_code }, req);
    return res.status(201).json({ success: true, message: 'Trade created successfully.', data: { id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/trades/:id
router.put('/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const tradeId = req.params.id;
  const { name, category, description, skills_covered, required_equipment, training_level, status } = req.body;

  try {
    await db.query(
      `UPDATE trades SET
         name = COALESCE(?, name),
         category = COALESCE(?, category),
         description = COALESCE(?, description),
         skills_covered = COALESCE(?, skills_covered),
         required_equipment = COALESCE(?, required_equipment),
         training_level = COALESCE(?, training_level),
         status = COALESCE(?, status),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, description, skills_covered, required_equipment, training_level, status, tradeId]
    );

    await logAudit(req.user.id, 'UPDATE_TRADE', 'trades', tradeId, req.body, req);
    return res.json({ success: true, message: 'Trade updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
