# CrisisConnect – Location, Language and Accessibility-Aware Disaster Communication Platform

### College Capstone Research Prototype Operations Manual

---

## 1. Project Overview & Problem Statement
During natural disasters and infrastructure breakdowns (e.g. cyclonic storms, extreme waterlogging, substation fires), municipal authorities broadcast general warning advisories to entire regions. However, this static approach fails to serve diverse citizen cohorts because it ignores:
1.  **Geographical Bounds**: Citizens outside the danger radius receive unnecessary alerts, causing alarm fatigue (High False Alert Rates).
2.  **Language Boundaries**: Critical advisories published in English do not reach native vernacular speakers.
3.  **Accessibility Needs**: Visually impaired citizens, screen-reader users, and individuals requiring simplified language cannot parse the alerts.

**CrisisConnect** is a location-, language-, and accessibility-aware crisis communication system. It integrates geospatial coordinates matching, template translation arrays, and cognitive layouts (Standard, Simplified, High Contrast, Screen Reader, Audio TTS) with a **mandatory human review checkpoint** to coordinate alerts safely and measurably.

---

## 2. Core Research Contribution
We contrast the proposed system against a baseline:
*   **Baseline System**: One generic, text-only English warning advisory broadcasted to all citizens in the municipal sector (*"Disruption reported in your area. Take precautions."*).
*   **Proposed System**: Location-fenced, native-language, and cognitively adapted alerts targeted only at citizens inside affected radii or utilizing affected transit routes.

---

## 3. Database Design
Data is persisted inside the browser's `localStorage` schema:
*   `User`: Registered name, role (Admin, Operator, Citizen), preferences (Language, Accessibility), geofence coordinate properties (Lat, Lng, Sector Area), transit route mapping.
*   `Incident`: Type, severity (Low, Medium, High, Critical), coordinate origin, circle radius (km), affected route lines, recommended actions, emergency hotlines, conflict flags.
*   `Message`: Localized drafts awaiting audit, targeting reason logs, approval timestamps.
*   `Notification`: Live delivery status records, latencies (ms), error messages.
*   `Feedback`: Citizen understandability ratings (1-5), timeliness indicators, qualitative feedback logs.
*   `AuditLog`: Historical record of admin/operator decisions.

---

## 4. Key Features & Edge Case Handling
1.  **Missing Location (Failure Case 1)**: Citizens with unconfigured coordinates are classified as "Location Unavailable" and routed for manual dispatcher review.
2.  **Unsupported Language (Failure Case 2)**: Fallback filters default translation calls to English with warning banners.
3.  **Conflicting Agency Inputs (Failure Case 3)**: Discrepant agency feeds lock the alert approval controls, requiring human resolution.
4.  **Stale Incident Logs (Failure Case 4)**: Outdated incident times (>12 hours) flag alerts as "Outdated - Needs verification".
5.  **Network Delivery Retry (Failure Case 5)**: Network losses log failures in the dashboard, enabling manual "Retry Dispatch" actions.

---

## 5. Demo Credentials & Operation Flow

### Responder Accounts:
*   **Administrator**: Commander R. Srinivasan (`usr-admin`)
*   **Operator**: Operator Priya Nair (`usr-op1`)

### Demonstration Steps:
1.  **Login**: Switch role to **Admin** using the top dropdown.
2.  **Log Incident**: Navigate to *Log New Disruption*. Pin coordinates, set radius, set routes (e.g., `Route 18`), and save.
3.  **Human Review**: The alert enters the *Review Queue* (since it is Critical severity). Inspect explainability criteria, edit message text if desired, and click **Approve & Dispatch**.
4.  **Citizen View**: Switch role to a **Citizen** (e.g., `Resident 2` - Tamil/Large Text).
5.  **Comprehend & Listen**: Read the Tamil Large Text layout, play the audio readout, and submit a positive feedback rating.
6.  **Benchmark**: Navigate back to **Admin** -> *Benchmark Analytics* to view live improvements.

---

## 6. Academic Disclaimer
This application is a research/academic prototype using simulated data. It must not be used as the sole source for real emergency decisions or public safety communication.
