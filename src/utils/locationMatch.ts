import type { Incident, User } from '../db/types';

/**
 * Calculates the geodetic distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export interface MatchResult {
  isAffected: boolean;
  isLocationMatch: boolean;
  isRouteMatch: boolean;
  distanceKm?: number;
  reason: string;
}

/**
 * Checks if a citizen is affected by an incident based on radius and route matches.
 */
export const checkCitizenStatus = (citizen: User, incident: Incident): MatchResult => {
  // If user location is missing: Failure Case 1
  if (citizen.lat === undefined || citizen.lng === undefined) {
    return {
      isAffected: false,
      isLocationMatch: false,
      isRouteMatch: false,
      reason: 'Location unavailable – manual verification required'
    };
  }

  const distance = calculateDistance(citizen.lat, citizen.lng, incident.lat, incident.lng);
  const isLocationMatch = distance <= incident.radius;
  
  // Route matching
  let isRouteMatch = false;
  if (citizen.route && incident.affectedRoutes.length > 0) {
    isRouteMatch = incident.affectedRoutes.some(
      r => r.toLowerCase().trim() === citizen.route?.toLowerCase().trim()
    );
  }

  const isAffected = isLocationMatch || isRouteMatch;

  let reason = '';
  if (isLocationMatch && isRouteMatch) {
    reason = `Resident is inside the affected radius (${distance.toFixed(2)} km <= ${incident.radius} km) and uses route ${citizen.route}.`;
  } else if (isLocationMatch) {
    reason = `Resident is inside the affected radius (${distance.toFixed(2)} km <= ${incident.radius} km).`;
  } else if (isRouteMatch) {
    reason = `Resident uses affected route (${citizen.route}).`;
  } else {
    reason = `Resident is outside the zone (${distance.toFixed(2)} km > ${incident.radius} km) and route is unaffected.`;
  }

  return {
    isAffected,
    isLocationMatch,
    isRouteMatch,
    distanceKm: Number(distance.toFixed(2)),
    reason
  };
};

/**
 * Returns all residents affected by a specific incident.
 */
export const getAffectedResidents = (residents: User[], incident: Incident): { resident: User; match: MatchResult }[] => {
  return residents
    .map(r => ({ resident: r, match: checkCitizenStatus(r, incident) }))
    .filter(item => item.match.isAffected);
};
