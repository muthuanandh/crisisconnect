const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// GET /api/reports
router.get('/', async (req, res, next) => {
  try {
    const rows = await allQuery('SELECT * FROM citizen_reports ORDER BY created_at DESC');
    const reports = rows.map((r) => ({
      id: r.id,
      citizenId: r.citizen_id,
      citizenName: r.citizen_name,
      reportType: r.report_type,
      description: r.description,
      lat: r.lat,
      lng: r.lng,
      locationName: r.location_name,
      severity: r.severity,
      imagePath: r.image_path,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/:id
router.get('/:id', async (req, res, next) => {
  try {
    const r = await getQuery('SELECT * FROM citizen_reports WHERE id = ?', [req.params.id]);
    if (!r) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    res.json({ success: true, report: r });
  } catch (err) {
    next(err);
  }
});

// POST /api/reports (Citizen submits field report)
router.post('/', async (req, res, next) => {
  try {
    const { citizenId, citizenName = 'Anonymous Citizen', reportType, description, lat = 11.00, lng = 77.00, locationName = 'Report Location', severity = 'medium', imagePath } = req.body;

    if (!reportType || !description) {
      return res.status(400).json({ success: false, message: 'Report type and description are required.' });
    }

    const id = `cr-${Date.now()}`;
    const now = new Date().toISOString();

    await runQuery(
      `INSERT INTO citizen_reports (id, citizen_id, citizen_name, report_type, description, lat, lng, location_name, severity, image_path, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, citizenId || 'usr-cit1', citizenName, reportType, description, lat, lng, locationName, severity, imagePath || null, 'pending_review', now, now]
    );

    // Audit Log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, citizenName, 'Submit Citizen Report', 'CitizenReports', `Submitted ${reportType} report at ${locationName}`]
    );

    res.status(201).json({
      success: true,
      report: {
        id,
        citizenId,
        citizenName,
        reportType,
        description,
        lat,
        lng,
        locationName,
        severity,
        imagePath,
        status: 'pending_review',
        createdAt: now
      },
      message: 'Report submitted successfully and logged in database.'
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reports/:id/status (Officer updates status)
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status, updated_by = 'Commander R. Srinivasan' } = req.body;
    const now = new Date().toISOString();

    await runQuery(
      `UPDATE citizen_reports
       SET status = ?, updated_at = ?
       WHERE id = ?`,
      [status, now, req.params.id]
    );

    // Audit log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, updated_by, 'Update Report Status', 'CitizenReports', `Updated report ${req.params.id} to ${status}`]
    );

    res.json({ success: true, message: `Report status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
