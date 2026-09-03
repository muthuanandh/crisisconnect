const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');
const { findAffectedCitizens } = require('../services/geofenceService');
const { generateMessageContent } = require('../services/messageGenService');
const { generateExplanation } = require('../services/explainabilityService');
const { evaluateRiskLevel } = require('../services/riskAssessmentService');

// GET /api/disasters
router.get('/', async (req, res, next) => {
  try {
    const rows = await allQuery('SELECT * FROM disasters ORDER BY created_at DESC');
    const disasters = rows.map((r) => ({
      ...r,
      affectedRoutes: JSON.parse(r.affected_routes_json || '[]'),
      affectedServices: JSON.parse(r.affected_services_json || '[]'),
      recommendedAction: r.recommended_action,
      emergencyContact: r.emergency_contact,
      startTime: r.start_time,
      lastUpdated: r.last_updated,
      agenciesConflicting: Boolean(r.agencies_conflicting)
    }));
    res.json({ success: true, disasters });
  } catch (err) {
    next(err);
  }
});

// GET /api/disasters/:id
router.get('/:id', async (req, res, next) => {
  try {
    const r = await getQuery('SELECT * FROM disasters WHERE id = ?', [req.params.id]);
    if (!r) {
      return res.status(404).json({ success: false, message: 'Disaster not found.' });
    }
    const disaster = {
      ...r,
      affectedRoutes: JSON.parse(r.affected_routes_json || '[]'),
      affectedServices: JSON.parse(r.affected_services_json || '[]'),
      recommendedAction: r.recommended_action,
      emergencyContact: r.emergency_contact,
      startTime: r.start_time,
      lastUpdated: r.last_updated,
      agenciesConflicting: Boolean(r.agencies_conflicting)
    };
    res.json({ success: true, disaster });
  } catch (err) {
    next(err);
  }
});

// POST /api/disasters (Create disaster + trigger candidate matching)
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      type,
      description,
      severity = 'high',
      status = 'active',
      lat,
      lng,
      radius = 5.0,
      affectedRoutes = [],
      affectedServices = [],
      recommendedAction,
      emergencyContact,
      agenciesConflicting = false,
      created_by = 'Commander R. Srinivasan'
    } = req.body;

    if (!title || !type || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Title, type, lat, and lng are required.' });
    }

    const id = `inc-${Date.now()}`;
    const affectedRoutesJson = JSON.stringify(affectedRoutes);
    const affectedServicesJson = JSON.stringify(affectedServices);
    const now = new Date().toISOString();

    await runQuery(
      `INSERT INTO disasters (id, title, type, description, severity, status, lat, lng, radius, affected_routes_json, affected_services_json, recommended_action, emergency_contact, start_time, last_updated, agencies_conflicting)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, type, description || '', severity, status, lat, lng, radius, affectedRoutesJson, affectedServicesJson, recommendedAction || '', emergencyContact || '1077', now, now, agenciesConflicting ? 1 : 0]
    );

    // Audit log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, created_by, 'Create Incident', 'Disasters', `Logged ${severity.toUpperCase()} incident: ${title}`]
    );

    // -------------------------------------------------------------
    // AUTOMATIC TARGETING & ALERT DRAFT GENERATION
    // -------------------------------------------------------------
    const citizens = await allQuery("SELECT * FROM users WHERE role = 'citizen'");
    const incidentObj = { id, title, type, description, severity, status, lat, lng, radius, affected_routes_json: affectedRoutesJson, recommended_action: recommendedAction, emergency_contact: emergencyContact };
    const affectedCandidates = findAffectedCitizens(incidentObj, citizens);
    const riskEval = evaluateRiskLevel(incidentObj);

    const generatedAlerts = [];

    for (const { citizen, match } of affectedCandidates) {
      const msgContent = generateMessageContent(incidentObj, citizen.language, citizen.accessibility, citizen);
      const explanation = generateExplanation(citizen, incidentObj, match.distanceKm);

      const alertId = `msg-prop-${id}-${citizen.id}`;
      const alertStatus = riskEval.requiresHumanReview ? 'pending_review' : 'approved';

      await runQuery(
        `INSERT OR REPLACE INTO alerts (id, incident_id, citizen_id, language, accessibility_format, subject, content, status, severity, approved_by, approved_at, explanation_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alertId,
          id,
          citizen.id,
          citizen.language || 'en',
          citizen.accessibility || 'standard',
          msgContent.subject,
          msgContent.content,
          alertStatus,
          severity,
          alertStatus === 'approved' ? 'System Auto-Approval' : null,
          alertStatus === 'approved' ? now : null,
          JSON.stringify(explanation)
        ]
      );

      generatedAlerts.push({
        id: alertId,
        incidentId: id,
        citizenId: citizen.id,
        status: alertStatus,
        subject: msgContent.subject
      });
    }

    res.status(201).json({
      success: true,
      disaster: {
        id,
        title,
        type,
        description,
        severity,
        status,
        lat,
        lng,
        radius,
        affectedRoutes,
        affectedServices,
        recommendedAction,
        emergencyContact,
        startTime: now,
        lastUpdated: now
      },
      targetingResult: {
        affectedCitizensCount: affectedCandidates.length,
        generatedAlertsCount: generatedAlerts.length,
        requiresHumanReview: riskEval.requiresHumanReview,
        riskReason: riskEval.reason
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/disasters/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, severity, status, radius, recommendedAction, emergencyContact, updated_by = 'Commander R. Srinivasan' } = req.body;
    const now = new Date().toISOString();

    await runQuery(
      `UPDATE disasters
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           severity = COALESCE(?, severity),
           status = COALESCE(?, status),
           radius = COALESCE(?, radius),
           recommended_action = COALESCE(?, recommended_action),
           emergency_contact = COALESCE(?, emergency_contact),
           last_updated = ?
       WHERE id = ?`,
      [title, description, severity, status, radius, recommendedAction, emergencyContact, now, req.params.id]
    );

    // Audit log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, updated_by, 'Update Incident', 'Disasters', `Updated disaster ${req.params.id} status to ${status || 'modified'}`]
    );

    res.json({ success: true, message: 'Disaster updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/disasters/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await runQuery('DELETE FROM disasters WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Disaster deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
