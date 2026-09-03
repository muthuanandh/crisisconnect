const express = require('express');
const router = express.Router();
const { runQuery, allQuery } = require('../database/database');

// GET /api/audit-logs
router.get('/', async (req, res, next) => {
  try {
    const logs = await allQuery('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

// POST /api/audit-logs
router.post('/', async (req, res, next) => {
  try {
    const { user = 'System', action, resource, resourceId, details } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, message: 'Action is required.' });
    }

    const id = `log-${Date.now()}`;
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user, action, resource || 'System', resourceId || null, details || '']
    );

    res.status(201).json({ success: true, message: 'Audit log recorded.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
