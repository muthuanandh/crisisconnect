const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');
const { findAffectedCitizens } = require('../services/geofenceService');
const { generateMessageContent } = require('../services/messageGenService');
const { generateExplanation } = require('../services/explainabilityService');

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const rows = await allQuery('SELECT * FROM alerts ORDER BY created_at DESC');
    const alerts = rows.map((r) => ({
      id: r.id,
      incidentId: r.incident_id,
      citizenId: r.citizen_id,
      language: r.language,
      accessibilityFormat: r.accessibility_format,
      subject: r.subject,
      content: r.content,
      status: r.status,
      severity: r.severity,
      approvedBy: r.approved_by,
      approvedAt: r.approved_at,
      explanation: JSON.parse(r.explanation_json || '{}')
    }));
    res.json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const r = await getQuery('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!r) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }
    const alert = {
      id: r.id,
      incidentId: r.incident_id,
      citizenId: r.citizen_id,
      language: r.language,
      accessibilityFormat: r.accessibility_format,
      subject: r.subject,
      content: r.content,
      status: r.status,
      severity: r.severity,
      approvedBy: r.approved_by,
      approvedAt: r.approved_at,
      explanation: JSON.parse(r.explanation_json || '{}')
    };
    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/:id/explanation (Explainability endpoint)
router.get('/:id/explanation', async (req, res, next) => {
  try {
    const r = await getQuery('SELECT explanation_json FROM alerts WHERE id = ?', [req.params.id]);
    if (!r) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }
    res.json({ success: true, explanation: JSON.parse(r.explanation_json || '{}') });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/generate (Backend targeting & alert draft compilation)
router.post('/generate', async (req, res, next) => {
  try {
    const { disaster_id } = req.body;
    const incident = await getQuery('SELECT * FROM disasters WHERE id = ?', [disaster_id]);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Disaster not found.' });
    }

    const citizens = await allQuery("SELECT * FROM users WHERE role = 'citizen'");
    const affectedCandidates = findAffectedCitizens(incident, citizens);

    const generated = [];
    const now = new Date().toISOString();

    for (const { citizen, match } of affectedCandidates) {
      const msgContent = generateMessageContent(incident, citizen.language, citizen.accessibility, citizen);
      const explanation = generateExplanation(citizen, incident, match.distanceKm);

      const alertId = `msg-prop-${disaster_id}-${citizen.id}`;
      const status = incident.severity === 'high' || incident.severity === 'critical' ? 'pending_review' : 'approved';

      await runQuery(
        `INSERT OR REPLACE INTO alerts (id, incident_id, citizen_id, language, accessibility_format, subject, content, status, severity, approved_by, approved_at, explanation_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alertId,
          disaster_id,
          citizen.id,
          citizen.language || 'en',
          citizen.accessibility || 'standard',
          msgContent.subject,
          msgContent.content,
          status,
          incident.severity,
          status === 'approved' ? 'System' : null,
          status === 'approved' ? now : null,
          JSON.stringify(explanation)
        ]
      );

      generated.push({ id: alertId, citizenId: citizen.id, status, subject: msgContent.subject });
    }

    res.json({
      success: true,
      disasterId: disaster_id,
      affectedCount: affectedCandidates.length,
      alerts: generated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/:id/send (Simulates transmission & logs notification record)
router.post('/:id/send', async (req, res, next) => {
  try {
    const alert = await getQuery('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    const citizen = await getQuery('SELECT * FROM users WHERE id = ?', [alert.citizen_id]);
    const channel = citizen && citizen.accessibility === 'audio' ? 'web' : (Math.random() < 0.5 ? 'sms' : 'push');

    const isSuccess = Math.random() < 0.98;
    const latency = 150 + Math.floor(Math.random() * 800);
    const now = new Date().toISOString();

    const notifPropId = `notif-prop-${alert.incident_id}-${alert.citizen_id}-${Date.now()}`;

    // Proposed notification delivery record
    await runQuery(
      `INSERT INTO notification_deliveries (id, message_id, incident_id, resident_id, channel, status, delivery_time_ms, error_message, sent_at, system_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'proposed')`,
      [notifPropId, alert.id, alert.incident_id, alert.citizen_id, channel, isSuccess ? 'delivered' : 'failed', isSuccess ? latency : 0, isSuccess ? null : 'Carrier network packet loss', now]
    );

    // Baseline notification delivery record for comparison metrics
    const baseSuccess = Math.random() < 0.88;
    const baseLatency = 1200 + Math.floor(Math.random() * 5000);
    const notifBaseId = `notif-base-${alert.incident_id}-${alert.citizen_id}-${Date.now()}`;

    await runQuery(
      `INSERT INTO notification_deliveries (id, message_id, incident_id, resident_id, channel, status, delivery_time_ms, error_message, sent_at, system_type)
       VALUES (?, ?, ?, ?, 'sms', ?, ?, ?, ?, 'baseline')`,
      [notifBaseId, `msg-base-${alert.incident_id}`, alert.incident_id, alert.citizen_id, baseSuccess ? 'delivered' : 'failed', baseSuccess ? baseLatency : 0, baseSuccess ? null : 'Connection timed out', now]
    );

    res.json({
      success: true,
      deliveryStatus: isSuccess ? 'delivered' : 'failed',
      latencyMs: latency,
      channel,
      message: `Alert dispatched to ${citizen ? citizen.name : alert.citizen_id} via ${channel.toUpperCase()}`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
