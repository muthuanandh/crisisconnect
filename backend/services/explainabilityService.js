const generateExplanation = (citizen, incident, distanceKm) => {
  const affectedRoutes = Array.isArray(incident.affected_routes_json)
    ? incident.affected_routes_json
    : typeof incident.affected_routes_json === 'string'
    ? JSON.parse(incident.affected_routes_json || '[]')
    : [];

  const locationMatch = distanceKm !== undefined && distanceKm <= incident.radius;
  const routeMatch = Boolean(citizen.route && affectedRoutes.includes(citizen.route));

  const langNames = {
    en: 'English',
    ta: 'Tamil (தமிழ்)',
    hi: 'Hindi (हिंदी)'
  };

  const accNames = {
    standard: 'Standard Layout',
    simplified: 'Simplified Plain Language',
    large_text: 'Large Text (24pt Font)',
    high_contrast: 'High Contrast (WCAG AAA)',
    screen_reader: 'Screen Reader Structure',
    audio: 'Audio Speech Synthesis'
  };

  const reasons = [
    locationMatch
      ? `✓ Citizen located inside affected radius (${distanceKm} km from incident centroid)`
      : `✓ Citizen transit route (${citizen.route || 'Local Route'}) intersects affected corridor`,
    `✓ Incident severity classified as ${incident.severity.toUpperCase()}`,
    `✓ Citizen language preference: ${langNames[citizen.language] || citizen.language}`,
    `✓ Accessibility format enabled: ${accNames[citizen.accessibility] || citizen.accessibility}`,
    incident.severity === 'high' || incident.severity === 'critical'
      ? `✓ High-impact decision requires Human Review approval`
      : `✓ Low-impact alert logged with audit trail`
  ];

  return {
    locationMatch,
    routeMatch,
    distanceKm,
    severityReason: `${incident.severity.toUpperCase()} severity ${incident.type}`,
    languageReason: `Citizen language: ${langNames[citizen.language] || citizen.language}`,
    accessibilityReason: `Accessibility setting: ${accNames[citizen.accessibility] || citizen.accessibility}`,
    auditSummary: reasons.join('\n')
  };
};

module.exports = {
  generateExplanation
};
