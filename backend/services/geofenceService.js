// Haversine formula for distance calculation in kilometers
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

// Check if citizen is affected by location radius or transit route line
const findAffectedCitizens = (incident, citizens) => {
  const affected = [];

  const affectedRoutes = Array.isArray(incident.affected_routes_json)
    ? incident.affected_routes_json
    : typeof incident.affected_routes_json === 'string'
    ? JSON.parse(incident.affected_routes_json || '[]')
    : [];

  citizens.forEach((citizen) => {
    let locationMatch = false;
    let routeMatch = false;
    let distanceKm = Infinity;

    if (citizen.lat !== undefined && citizen.lng !== undefined) {
      distanceKm = getDistanceKm(incident.lat, incident.lng, citizen.lat, citizen.lng);
      if (distanceKm <= incident.radius) {
        locationMatch = true;
      }
    }

    if (citizen.route && affectedRoutes.includes(citizen.route)) {
      routeMatch = true;
    }

    if (locationMatch || routeMatch) {
      affected.push({
        citizen,
        match: {
          locationMatch,
          routeMatch,
          distanceKm: distanceKm === Infinity ? undefined : distanceKm,
          reason: locationMatch
            ? `Within ${distanceKm} km of ${incident.title}`
            : `Uses affected commuting transit corridor ${citizen.route}`
        }
      });
    }
  });

  return affected;
};

module.exports = {
  getDistanceKm,
  findAffectedCitizens
};
