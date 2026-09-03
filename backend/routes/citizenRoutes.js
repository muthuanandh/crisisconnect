const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// GET /api/citizens
router.get('/', async (req, res, next) => {
  try {
    const citizens = await allQuery("SELECT id, name, email, role, language, accessibility, lat, lng, area, route, phone FROM users WHERE role = 'citizen'");
    res.json({ success: true, citizens });
  } catch (err) {
    next(err);
  }
});

// GET /api/citizens/:id
router.get('/:id', async (req, res, next) => {
  try {
    const citizen = await getQuery("SELECT id, name, email, role, language, accessibility, lat, lng, area, route, phone FROM users WHERE id = ? AND role = 'citizen'", [req.params.id]);
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'Citizen profile not found.' });
    }
    res.json({ success: true, citizen });
  } catch (err) {
    next(err);
  }
});

// POST /api/citizens
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, lat, lng, area, route, language = 'en', accessibility = 'standard' } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const id = `cit-${Date.now()}`;
    await runQuery(
      `INSERT INTO users (id, name, email, password_hash, role, language, accessibility, lat, lng, area, route, phone)
       VALUES (?, ?, ?, 'demo_hash', 'citizen', ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email || `${id}@crisisconnect.net`, language, accessibility, lat || null, lng || null, area || null, route || null, phone || null]
    );

    res.status(201).json({
      success: true,
      citizen: { id, name, email, language, accessibility, lat, lng, area, route, phone }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/citizens/:id (Update location, language, accessibility)
router.put('/:id', async (req, res, next) => {
  try {
    const { name, language, accessibility, lat, lng, area, route, phone } = req.body;

    await runQuery(
      `UPDATE users
       SET name = COALESCE(?, name),
           language = COALESCE(?, language),
           accessibility = COALESCE(?, accessibility),
           lat = COALESCE(?, lat),
           lng = COALESCE(?, lng),
           area = COALESCE(?, area),
           route = COALESCE(?, route),
           phone = COALESCE(?, phone)
       WHERE id = ?`,
      [name, language, accessibility, lat, lng, area, route, phone, req.params.id]
    );

    // Audit log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, name || req.params.id, 'Update Citizen Profile', 'Citizens', `Updated preferences: lang=${language}, acc=${accessibility}`]
    );

    const updated = await getQuery('SELECT id, name, email, role, language, accessibility, lat, lng, area, route, phone FROM users WHERE id = ?', [req.params.id]);

    res.json({ success: true, citizen: updated, message: 'Citizen profile updated successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
