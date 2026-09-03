const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// GET /api/routes
router.get('/', async (req, res, next) => {
  try {
    const routes = await allQuery('SELECT * FROM affected_routes ORDER BY created_at DESC');
    const formatted = routes.map((r) => ({
      id: r.id,
      routeName: r.route_name,
      startingPoint: r.starting_point,
      destination: r.destination,
      status: r.status,
      reason: r.reason,
      alternativeRoute: r.alternative_route,
      createdAt: r.created_at
    }));
    res.json({ success: true, routes: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/routes
router.post('/', async (req, res, next) => {
  try {
    const { routeName, startingPoint, destination, status = 'BLOCKED', reason, alternativeRoute } = req.body;
    if (!routeName) {
      return res.status(400).json({ success: false, message: 'Route name is required.' });
    }

    const id = `rt-${Date.now()}`;
    await runQuery(
      `INSERT INTO affected_routes (id, route_name, starting_point, destination, status, reason, alternative_route)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, routeName, startingPoint || '', destination || '', status, reason || '', alternativeRoute || '']
    );

    res.status(201).json({
      success: true,
      route: { id, routeName, startingPoint, destination, status, reason, alternativeRoute }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/routes/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { routeName, status, reason, alternativeRoute } = req.body;
    await runQuery(
      `UPDATE affected_routes
       SET route_name = COALESCE(?, route_name),
           status = COALESCE(?, status),
           reason = COALESCE(?, reason),
           alternative_route = COALESCE(?, alternative_route)
       WHERE id = ?`,
      [routeName, status, reason, alternativeRoute, req.params.id]
    );
    res.json({ success: true, message: 'Route updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/routes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await runQuery('DELETE FROM affected_routes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Route deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
