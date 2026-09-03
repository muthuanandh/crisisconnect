const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// GET /api/reviews/pending
router.get('/pending', async (req, res, next) => {
  try {
    const rows = await allQuery(`
      SELECT a.*, d.title as incident_title, d.type as incident_type, d.severity as incident_severity, u.name as citizen_name
      FROM alerts a
      LEFT JOIN disasters d ON a.incident_id = d.id
      LEFT JOIN users u ON a.citizen_id = u.id
      WHERE a.status = 'pending_review'
      ORDER BY a.created_at DESC
    `);

    const pending = rows.map((r) => ({
      id: r.id,
      incidentId: r.incident_id,
      citizenId: r.citizen_id,
      citizenName: r.citizen_name || 'Resident',
      incidentTitle: r.incident_title || 'Emergency Disruption',
      incidentType: r.incident_type || 'Disaster',
      severity: r.severity || 'high',
      language: r.language,
      accessibilityFormat: r.accessibility_format,
      subject: r.subject,
      content: r.content,
      explanation: JSON.parse(r.explanation_json || '{}'),
      createdAt: r.created_at
    }));

    res.json({ success: true, pending });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews/:alertId/approve
router.post('/:alertId/approve', async (req, res, next) => {
  try {
    const { approvedBy = 'Commander R. Srinivasan', reason } = req.body;
    const now = new Date().toISOString();

    const alert = await getQuery('SELECT * FROM alerts WHERE id = ?', [req.params.alertId]);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert draft not found.' });
    }

    // Update alert status
    await runQuery(
      `UPDATE alerts
       SET status = 'approved', approved_by = ?, approved_at = ?
       WHERE id = ?`,
      [approvedBy, now, req.params.alertId]
    );

    // Record human review decision
    const reviewId = `rev-${Date.now()}`;
    await runQuery(
      `INSERT INTO human_reviews (id, alert_id, incident_id, citizen_id, original_message, edited_message, reviewer, decision, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approve', ?)`,
      [reviewId, req.params.alertId, alert.incident_id, alert.citizen_id, alert.content, null, approvedBy, reason || 'High-impact advisory verified and approved for broadcast.']
    );

    // Audit log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, approvedBy, 'Approve Human Review Alert', 'HumanReviews', `Approved alert ${req.params.alertId} for resident ${alert.citizen_id}`]
    );

    // Trigger notification delivery simulation
    const channel = 'web';
    const notifId = `notif-prop-${alert.incident_id}-${alert.citizen_id}-${Date.now()}`;
    await runQuery(
      `INSERT INTO notification_deliveries (id, message_id, incident_id, resident_id, channel, status, delivery_time_ms, sent_at, system_type)
       VALUES (?, ?, ?, ?, ?, 'delivered', 320, ?, 'proposed')`,
      [notifId, alert.id, alert.incident_id, alert.citizen_id, channel, now]
    );

    res.json({ success: true, message: 'Alert approved and dispatched successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews/:alertId/reject
router.post('/:alertId/reject', async (req, res, next) => {
  try {
    const { approvedBy = 'Commander R. Srinivasan', reason } = req.body;
    const now = new Date().toISOString();

    const alert = await getQuery('SELECT * FROM alerts WHERE id = ?', [req.params.alertId]);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert draft not found.' });
    }

    await runQuery(
      `UPDATE alerts SET status = 'rejected', approved_by = ?, approved_at = ? WHERE id = ?`,
      [approvedBy, now, req.params.alertId]
    );

    // Record review rejection
    const reviewId = `rev-${Date.now()}`;
    await runQuery(
      `INSERT INTO human_reviews (id, alert_id, incident_id, citizen_id, original_message, edited_message, reviewer, decision, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'reject', ?)`,
      [reviewId, req.params.alertId, alert.incident_id, alert.citizen_id, alert.content, null, approvedBy, reason || 'Message rejected by Commander.']
    );

    // Audit log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, approvedBy, 'Reject Human Review Alert', 'HumanReviews', `Rejected alert ${req.params.alertId}`]
    );

    res.json({ success: true, message: 'Alert draft rejected.' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reviews/:alertId/edit
router.put('/:alertId/edit', async (req, res, next) => {
  try {
    const { newContent, editor = 'Commander R. Srinivasan' } = req.body;
    if (!newContent) {
      return res.status(400).json({ success: false, message: 'New message content is required.' });
    }

    await runQuery(
      `UPDATE alerts SET content = ?, approved_by = ? WHERE id = ?`,
      [newContent, editor, req.params.alertId]
    );

    // Audit log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, editor, 'Edit Review Message', 'HumanReviews', `Modified text for alert ${req.params.alertId}`]
    );

    res.json({ success: true, message: 'Alert message updated successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
