const evaluateRiskLevel = (incident) => {
  const highImpactTypes = ['evacuation', 'cyclone', 'flood', 'landslide', 'fire', 'medical_emergency'];
  const highImpactSeverities = ['high', 'critical'];

  const isHighImpactType = highImpactTypes.includes(incident.type);
  const isHighImpactSeverity = highImpactSeverities.includes(incident.severity);

  if (isHighImpactSeverity || isHighImpactType) {
    return {
      requiresHumanReview: true,
      riskLevel: incident.severity === 'critical' ? 'CRITICAL_RISK' : 'HIGH_RISK',
      reason: `High-impact disaster (${incident.type}, ${incident.severity.toUpperCase()} severity) requires Commander approval before broadcast.`
    };
  }

  return {
    requiresHumanReview: false,
    riskLevel: 'LOW_RISK',
    reason: `Routine disruption alert. Safe for automated dispatch.`
  };
};

module.exports = {
  evaluateRiskLevel
};
