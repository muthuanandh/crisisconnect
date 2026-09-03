export type UserRole = 'admin' | 'operator' | 'citizen';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type IncidentType =
  | 'flood'
  | 'cyclone'
  | 'earthquake'
  | 'fire'
  | 'landslide'
  | 'road_closure'
  | 'public_transport_disruption'
  | 'power_outage'
  | 'water_supply_disruption'
  | 'communication_outage'
  | 'evacuation'
  | 'extreme_weather';

export type LanguageCode = 'en' | 'ta' | 'hi';
export type AccessibilityFormat =
  | 'standard'
  | 'simplified'
  | 'large_text'
  | 'high_contrast'
  | 'screen_reader'
  | 'audio';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  language: LanguageCode;
  accessibility: AccessibilityFormat;
  lat?: number;
  lng?: number;
  area?: string;
  route?: string;
  email?: string;
  phone?: string;
}

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  description: string;
  severity: SeverityLevel;
  status: 'active' | 'resolved';
  lat: number;
  lng: number;
  radius: number; // in kilometers
  affectedRoutes: string[];
  affectedServices: string[];
  recommendedAction: string;
  emergencyContact: string;
  startTime: string;
  lastUpdated: string;
  agenciesConflicting?: boolean; // For Failure Case 3 (Conflict check)
}

export interface Message {
  id: string;
  incidentId: string;
  language: LanguageCode;
  accessibilityFormat: AccessibilityFormat;
  subject: string;
  content: string;
  explanation: {
    locationMatch: boolean;
    routeMatch: boolean;
    distance?: number;
    severityReason: string;
    languageReason: string;
    accessibilityReason: string;
  };
  status: 'pending_review' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface Notification {
  id: string;
  messageId: string;
  incidentId: string;
  residentId: string;
  channel: 'web' | 'sms' | 'email' | 'push';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  deliveryTime: number; // in milliseconds
  errorMessage?: string;
  sentAt: string;
  systemType: 'baseline' | 'proposed'; // for comparison
}

export interface Feedback {
  id: string;
  notificationId: string;
  incidentId: string;
  citizenId: string;
  understandable: boolean;
  timely: boolean;
  rating: number; // 1 to 5
  comments: string;
  submittedAt: string;
  systemType: 'baseline' | 'proposed'; // for comparison
}

export interface AuditLog {
  id: string;
  user: string;
  timestamp: string;
  action: string;
  incidentId?: string;
  prevValue?: string;
  newValue?: string;
}

export interface UsabilityRating {
  id: string;
  personaName: string;
  role: string;
  language: string;
  accessibility: string;
  clarity: number; // 1-5
  easeOfUnderstanding: number; // 1-5
  timeToFindNeededAction: number; // 1-5
  accessibilitySatisfaction: number; // 1-5
  trust: number; // 1-5
  explanationUsefulness: number; // 1-5
  feedbackText: string;
}
