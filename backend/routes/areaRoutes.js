const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// GET /api/areas
router.get('/', async (req, res, next) => {
  try {
    const areas = await allQuery('SELECT * FROM affected_areas ORDER BY created_at DESC');
    res.json({ success: true, areas });
  } catch (err) {
    next(err);
  }
});

// POST /api/areas
router.post('/', async (req, res, next) => {
  try {
    const { name, lat, lng, radius = 5.0, severity = 'high', reason, status = 'active' } = req.body;
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Name, lat, and lng are required.' });
    }

    const id = `area-${Date.now()}`;
    await runQuery(
      `INSERT INTO affected_areas (id, name, lat, lng, radius, severity, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, lat, lng, radius, severity, reason || '', status]
    );

    res.status(201).json({ success: true, area: { id, name, lat, lng, radius, severity, reason, status } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/areas/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, radius, severity, reason, status } = req.body;
    await runQuery(
      `UPDATE affected_areas
       SET name = COALESCE(?, name),
           radius = COALESCE(?, radius),
           severity = COALESCE(?, severity),
           reason = COALESCE(?, reason),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, radius, severity, reason, status, req.params.id]
    );
    res.json({ success: true, message: 'Area updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/areas/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await runQuery('DELETE FROM affected_areas WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Area deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
