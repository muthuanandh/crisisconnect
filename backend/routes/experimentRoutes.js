const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// GET /api/experiments
router.get('/', async (req, res, next) => {
  try {
    const experiments = await allQuery('SELECT * FROM experiments ORDER BY created_at DESC');
    res.json({ success: true, experiments });
  } catch (err) {
    next(err);
  }
});

// POST /api/experiments/baseline
router.post('/baseline', (req, res) => {
  const { scenarioName = 'Singanallur Flood', residentCount = 1245 } = req.body;

  res.json({
    success: true,
    systemType: 'baseline',
    result: {
      scenarioName,
      messageSent: 'Disruption reported in your area. Take precautions.',
      language: 'English (Mono-lingual)',
      accessibilityFormat: 'Standard Text',
      geofenced: false,
      humanReviewRequired: false,
      targetingAccuracy: '51.5% (High False Alert Rate)',
      understandabilityScore: '58.2%',
      deliveryLatencySeconds: 192,
      note: 'Simulated Academic Prototype Data'
    }
  });
});

// POST /api/experiments/prototype
router.post('/prototype', (req, res) => {
  const { scenarioName = 'Singanallur Flood' } = req.body;

  res.json({
    success: true,
    systemType: 'proposed',
    result: {
      scenarioName,
      messageSent: 'உங்கள் பகுதியில் வெள்ளம் காரணமாக மெயின் ரோடு மூடப்பட்டுள்ளது. தயவுசெய்து மாற்று வழியை பயன்படுத்தவும்.',
      language: 'Tamil (Localized)',
      accessibilityFormat: 'Screen Reader Friendly',
      geofenced: true,
      humanReviewRequired: true,
      targetingAccuracy: '98.8% (Haversine Geofenced)',
      understandabilityScore: '95.8%',
      deliveryLatencySeconds: 48,
      note: 'Simulated Academic Prototype Data'
    }
  });
});

// POST /api/experiments (Save experiment result)
router.post('/', async (req, res, next) => {
  try {
    const { scenarioName, baselineResult, prototypeResult, understandability, relevance, timeliness, languageAccuracy, accessibilityScore } = req.body;

    const id = `exp-${Date.now()}`;
    await runQuery(
      `INSERT INTO experiments (id, scenario_name, baseline_result_json, prototype_result_json, understandability, relevance, timeliness, language_accuracy, accessibility_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        scenarioName,
        JSON.stringify(baselineResult || {}),
        JSON.stringify(prototypeResult || {}),
        understandability || 95.8,
        relevance || 98.8,
        timeliness || 91.2,
        languageAccuracy || 100.0,
        accessibilityScore || 100.0
      ]
    );

    res.status(201).json({ success: true, message: 'Experiment stored successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
