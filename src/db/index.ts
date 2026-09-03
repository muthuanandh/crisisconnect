import type { User, Incident, Message, Notification, Feedback, AuditLog, UsabilityRating } from './types';

// Helper to generate 105 mock residents spread across Chennai with various profiles
const generateResidents = (): User[] => {
  
  // Key areas in Chennai
  const areas = [
    { name: 'Anna Nagar', lat: 13.0850, lng: 80.2101, routes: ['Route 18', 'Route 5C'] },
    { name: 'Adyar', lat: 13.0063, lng: 80.2574, routes: ['Route 21G', 'Route 102'] },
    { name: 'T. Nagar', lat: 13.0418, lng: 80.2341, routes: ['Route 18', 'Route 47'] },
    { name: 'Guindy', lat: 13.0090, lng: 80.2210, routes: ['Route 21G', 'Route 5C'] },
    { name: 'Velachery', lat: 12.9796, lng: 80.2196, routes: ['Route 102', 'Route 221'] },
    { name: 'Mylapore', lat: 13.0330, lng: 80.2690, routes: ['Route 21G', 'Route 47'] },
    { name: 'Tambaram', lat: 12.9229, lng: 80.1275, routes: ['Route 18', 'Route 221'] },
    { name: 'Nungambakkam', lat: 13.0600, lng: 80.2400, routes: ['Route 5C', 'Route 47'] },
  ];

  const residents: User[] = [];
  
  for (let i = 1; i <= 105; i++) {
    const areaObj = areas[i % areas.length];
    
    // Add small random offset to distribute geographically
    const latOffset = (Math.random() - 0.5) * 0.015;
    const lngOffset = (Math.random() - 0.5) * 0.015;
    
    // Distribute languages: 50% Tamil, 30% English, 20% Hindi
    const langRand = Math.random();
    const language = langRand < 0.5 ? 'ta' : langRand < 0.8 ? 'en' : 'hi';
    
    // Distribute accessibility preferences: 60% Standard, 40% other formats
    const accRand = Math.random();
    let accessibility: User['accessibility'] = 'standard';
    if (accRand > 0.6) {
      const otherFormats: User['accessibility'][] = ['simplified', 'large_text', 'high_contrast', 'screen_reader', 'audio'];
      accessibility = otherFormats[Math.floor(Math.random() * otherFormats.length)];
    }

    residents.push({
      id: `res-${i}`,
      name: `Resident ${i} (${areaObj.name})`,
      role: 'citizen',
      language,
      accessibility,
      lat: Number((areaObj.lat + latOffset).toFixed(5)),
      lng: Number((areaObj.lng + lngOffset).toFixed(5)),
      area: areaObj.name,
      route: areaObj.routes[i % areaObj.routes.length],
      email: `resident${i}@crisisconnect.net`,
      phone: `+91 98400 ${String(10000 + i).substring(1)}`,
    });
  }

  return residents;
};

// Initial Incident Database Seeding
const initialIncidents: Incident[] = [
  {
    id: 'inc-1',
    title: 'Severe Flooding near Anna Nagar',
    type: 'flood',
    description: 'Continuous heavy rainfall has caused severe waterlogging. Water levels have reached 3 feet in low-lying residential sectors.',
    severity: 'critical',
    status: 'active',
    lat: 13.0850,
    lng: 80.2101,
    radius: 3.5, // 3.5 km radius
    affectedRoutes: ['Route 18', 'Route 5C'],
    affectedServices: ['Road Transport', 'Water Supply'],
    recommendedAction: 'Evacuate ground floors. Move to municipal shelters at Anna Nagar Central School.',
    emergencyContact: '+91 44 2464 1234',
    startTime: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'inc-2',
    title: 'Adyar River Canal Overflow Warning',
    type: 'cyclone',
    description: 'Pre-cyclonic depression is causing heavy rain. River levels are near warning marks. Vulnerable zones are put on high alert.',
    severity: 'high',
    status: 'active',
    lat: 13.0063,
    lng: 80.2574,
    radius: 4.0,
    affectedRoutes: ['Route 21G'],
    affectedServices: ['Power Grid'],
    recommendedAction: 'Keep emergency supplies ready. Secure loose roofing materials.',
    emergencyContact: '+91 44 2464 1235',
    startTime: new Date(Date.now() - 3600000 * 8).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'inc-3',
    title: 'Route 18 Road Closure - T. Nagar',
    type: 'road_closure',
    description: 'A major tree collapse has completely blocked the arterial lanes of Route 18 near Usman Road. Clearance work is underway.',
    severity: 'medium',
    status: 'active',
    lat: 13.0418,
    lng: 80.2341,
    radius: 1.5,
    affectedRoutes: ['Route 18'],
    affectedServices: ['Public Bus Transit'],
    recommendedAction: 'Use Route 47 diversion or take the Chennai Metro instead.',
    emergencyContact: '+91 44 2464 1236',
    startTime: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'inc-4',
    title: 'Transformer Fire and Power Outage in Guindy',
    type: 'fire',
    description: 'Substation transformer burst occurred due to overload. Grid is temporarily shut down for emergency repair.',
    severity: 'high',
    status: 'active',
    lat: 13.0090,
    lng: 80.2210,
    radius: 2.0,
    affectedRoutes: ['Route 5C'],
    affectedServices: ['Electricity Grid', 'Communication Lines'],
    recommendedAction: 'Avoid going near the Industrial Estate Substation. Turn off high-voltage home appliances.',
    emergencyContact: '+91 44 2464 1237',
    startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'inc-5',
    title: 'Minor Landslide on Bypass Link Road',
    type: 'landslide',
    description: 'Soil erosion near quarry zone has caused debris to fall on the outer link bypass. Traffic restricted to single lane.',
    severity: 'medium',
    status: 'active',
    lat: 12.9500,
    lng: 80.1500,
    radius: 1.0,
    affectedRoutes: ['Route 221'],
    affectedServices: ['Road Highway'],
    recommendedAction: 'Drive slowly, follow signage, or use service road bypass.',
    emergencyContact: '+91 44 2464 1238',
    startTime: new Date(Date.now() - 3600000 * 10).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 9).toISOString(),
  },
  // Failure Case 3: Conflicting Incident Info (Agency A vs Agency B)
  {
    id: 'inc-6',
    title: 'CONFLICTING: Route 18 Clearance Status',
    type: 'road_closure',
    description: 'Traffic Dept reports Route 18 is open after tree removal. Disaster Response Force states water log still blocks lanes.',
    severity: 'medium',
    status: 'active',
    lat: 13.0418,
    lng: 80.2341,
    radius: 1.5,
    affectedRoutes: ['Route 18'],
    affectedServices: ['Road Transport'],
    recommendedAction: 'Verification required before sending alert.',
    emergencyContact: '+91 44 2464 1239',
    startTime: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    lastUpdated: new Date(Date.now() - 1800000).toISOString(),
    agenciesConflicting: true, // Flag for Failure Case 3
  },
  // Failure Case 4: Outdated Incident (Last updated > 12h ago)
  {
    id: 'inc-7',
    title: 'OUTDATED: Water Grid Rupture in Mylapore',
    type: 'water_supply_disruption',
    description: 'Main pipe rupture near Kapaleeshwarar Temple. Repair team was dispatched. No updates have been received since yesterday.',
    severity: 'medium',
    status: 'active',
    lat: 13.0330,
    lng: 80.2690,
    radius: 2.5,
    affectedRoutes: ['Route 47'],
    affectedServices: ['Water Supply'],
    recommendedAction: 'Information may be outdated. Boil tap water before consumption.',
    emergencyContact: '+91 44 2464 1240',
    startTime: new Date(Date.now() - 3600000 * 30).toISOString(), // 30 hours ago
    lastUpdated: new Date(Date.now() - 3600000 * 20).toISOString(), // 20 hours ago (Stale > 12h)
  },
  {
    id: 'inc-8',
    title: 'Gas Leak Containment at Tambaram Outer Area',
    type: 'evacuation',
    description: 'Industrial gas cylinder leak reported. Containment crew has cordoned off the facility. Resident evacuation in progress.',
    severity: 'critical',
    status: 'resolved', // Historical Resolved Incident
    lat: 12.9229,
    lng: 80.1275,
    radius: 1.2,
    affectedRoutes: ['Route 221'],
    affectedServices: ['Emergency Services'],
    recommendedAction: 'Evacuate within 1km. Wear damp masks or cloth over face.',
    emergencyContact: '+91 44 2464 1241',
    startTime: new Date(Date.now() - 3600000 * 48).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: 'inc-9',
    title: 'Severe Thunderstorm Warning',
    type: 'extreme_weather',
    description: 'Meteorological department predicts heavy gusts (up to 70 kmph) and high lightning density for metropolitan areas.',
    severity: 'high',
    status: 'resolved',
    lat: 13.0600,
    lng: 80.2400,
    radius: 10.0,
    affectedRoutes: ['Route 5C', 'Route 47', 'Route 18'],
    affectedServices: ['All municipal services'],
    recommendedAction: 'Stay indoors. Unplug electronic appliances.',
    emergencyContact: '+91 44 2464 1242',
    startTime: new Date(Date.now() - 3600000 * 72).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 68).toISOString(),
  },
  {
    id: 'inc-10',
    title: 'Metro Rail Grid Commutation Issue',
    type: 'public_transport_disruption',
    description: 'OHE overhead traction line issue near Guindy Metro. Operations suspended on Blue Line.',
    severity: 'medium',
    status: 'resolved',
    lat: 13.0090,
    lng: 80.2210,
    radius: 3.0,
    affectedRoutes: ['Route 21G'],
    affectedServices: ['Metro Transit'],
    recommendedAction: 'Take local sub-urban trains or road transport instead.',
    emergencyContact: '+91 44 2464 1243',
    startTime: new Date(Date.now() - 3600000 * 96).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 94).toISOString(),
  }
];

// Pre-seed Historical Notifications and Feedback for baseline vs proposed analytics charts
const generateHistoricalAnalytics = (residents: User[]): { notifications: Notification[], feedback: Feedback[] } => {
  const notifications: Notification[] = [];
  const feedback: Feedback[] = [];
  
  // Simulate 350 historical notification dispatches across past resolved incidents (inc-8, inc-9, inc-10)
  // Let's create two batches: Baseline System (150 alerts) vs Proposed System (200 alerts)
  
  // --- BATCH 1: BASELINE (Generic, English-only standard alerts sent to all nearby residents)
  // Let's take residents and dispatch generic alerts for inc-9
  const incident9 = initialIncidents.find(i => i.id === 'inc-9')!;
  let notifId = 1;
  let feedId = 1;

  // Baseline target: 150 dispatches
  for (let i = 0; i < 150; i++) {
    const resident = residents[i % residents.length];
    
    // Baseline sends alert to everyone regardless of whether they match language or accessibility
    // Delivery statistics: Baseline has lower delivery success and longer average latency
    const status = Math.random() < 0.88 ? 'delivered' : 'failed'; // 12% fail rate
    const deliveryTime = 1200 + Math.floor(Math.random() * 5000); // 1.2s to 6.2s delay
    const sentAt = new Date(Date.now() - 3600000 * 71).toISOString();
    
    const notif: Notification = {
      id: `notif-base-${notifId++}`,
      messageId: `msg-base-9`,
      incidentId: incident9.id,
      residentId: resident.id,
      channel: 'sms',
      status,
      deliveryTime: status === 'delivered' ? deliveryTime : 0,
      sentAt,
      systemType: 'baseline',
      errorMessage: status === 'failed' ? 'Carrier connection timed out' : undefined
    };
    notifications.push(notif);

    if (status === 'delivered') {
      // Citizen feedback on Baseline alerts:
      // - English speakers + standard formats understand it (100%)
      // - Tamil/Hindi speakers or simplified/audio format users struggle with generic English text (understandability ~45%)
      const isEnglishSpeaker = resident.language === 'en';
      const isStandardAcc = resident.accessibility === 'standard';
      const isUnderstandable = (isEnglishSpeaker && isStandardAcc) ? (Math.random() < 0.95) : (Math.random() < 0.45);
      
      // Timeliness: Baseline is slower, so timeliness feedback is lower (~65% positive)
      const isTimely = Math.random() < 0.65;
      
      const rating = isUnderstandable ? (isTimely ? 4 : 3) : (Math.random() < 0.5 ? 2 : 1);

      feedback.push({
        id: `feed-base-${feedId++}`,
        notificationId: notif.id,
        incidentId: incident9.id,
        citizenId: resident.id,
        understandable: isUnderstandable,
        timely: isTimely,
        rating,
        comments: isUnderstandable ? 'Arrived late but ok.' : 'Cannot read English/Text is too small.',
        submittedAt: new Date(Date.now() - 3600000 * 70).toISOString(),
        systemType: 'baseline'
      });
    }
  }

  // --- BATCH 2: PROPOSED SYSTEM (Tailored alerts in user language & accessibility format)
  // Let's do 200 dispatches for inc-8 and inc-10
  const incident8 = initialIncidents.find(i => i.id === 'inc-8')!;
  const incident10 = initialIncidents.find(i => i.id === 'inc-10')!;
  
  const proposedIncidents = [incident8, incident10];

  for (let i = 0; i < 200; i++) {
    const resident = residents[i % residents.length];
    const incident = proposedIncidents[i % proposedIncidents.length];
    
    // Proposed delivery: Highly optimized routing (98% delivery rate, low latency)
    const status = Math.random() < 0.98 ? 'delivered' : 'failed'; // 2% fail rate
    const deliveryTime = 150 + Math.floor(Math.random() * 800); // 150ms to 950ms
    const sentAt = new Date(Date.now() - 3600000 * (incident.id === 'inc-8' ? 47 : 95)).toISOString();

    const notif: Notification = {
      id: `notif-prop-${notifId++}`,
      messageId: `msg-prop-${incident.id}-${resident.id}`,
      incidentId: incident.id,
      residentId: resident.id,
      channel: resident.accessibility === 'audio' ? 'web' : (Math.random() < 0.5 ? 'sms' : 'push'),
      status,
      deliveryTime: status === 'delivered' ? deliveryTime : 0,
      sentAt,
      systemType: 'proposed',
      errorMessage: status === 'failed' ? 'Network packet loss' : undefined
    };
    notifications.push(notif);

    if (status === 'delivered') {
      // Citizen feedback on Proposed alerts:
      // Since it's translated to Tamil/Hindi and rendered in Large Text/High Contrast/Audio/Screen Reader:
      // Understandability rate is extremely high (~95%)
      const isUnderstandable = Math.random() < 0.96;
      // Timeliness: 92% positive
      const isTimely = Math.random() < 0.92;
      const rating = isUnderstandable ? (isTimely ? 5 : 4) : 2;

      feedback.push({
        id: `feed-prop-${feedId++}`,
        notificationId: notif.id,
        incidentId: incident.id,
        citizenId: resident.id,
        understandable: isUnderstandable,
        timely: isTimely,
        rating,
        comments: isUnderstandable 
          ? (resident.language === 'ta' ? 'அறிவிப்பு மிகவும் தெளிவாக இருந்தது.' : 'जानकारी के लिए धन्यवाद।')
          : 'Accessibility rendering was slightly slow.',
        submittedAt: new Date(Date.now() - 3600000 * (incident.id === 'inc-8' ? 46 : 94)).toISOString(),
        systemType: 'proposed'
      });
    }
  }

  return { notifications, feedback };
};


// Pre-seeded Usability persona validation ratings (Simulated 5 personas)
const initialUsabilityRatings: UsabilityRating[] = [
  {
    id: 'use-1',
    personaName: 'Anand (Elderly, low vision)',
    role: 'Citizen',
    language: 'Tamil',
    accessibility: 'Large Text',
    clarity: 5,
    easeOfUnderstanding: 5,
    timeToFindNeededAction: 4,
    accessibilitySatisfaction: 5,
    trust: 5,
    explanationUsefulness: 5,
    feedbackText: 'The font size scaling works perfectly in Tamil! I could read the evacuation shelters clearly without my glasses.'
  },
  {
    id: 'use-2',
    personaName: 'Devi (Commuter, route-dependent)',
    role: 'Citizen',
    language: 'English',
    accessibility: 'Standard Text',
    clarity: 4,
    easeOfUnderstanding: 5,
    timeToFindNeededAction: 5,
    accessibilitySatisfaction: 4,
    trust: 4,
    explanationUsefulness: 5,
    feedbackText: 'It specified exactly that Route 18 was closed. I diverted to the metro immediately. The "Why this alert" part makes me trust it.'
  },
  {
    id: 'use-3',
    personaName: 'Sunita (Screen-reader user)',
    role: 'Citizen',
    language: 'Hindi',
    accessibility: 'Screen Reader',
    clarity: 5,
    easeOfUnderstanding: 4,
    timeToFindNeededAction: 4,
    accessibilitySatisfaction: 5,
    trust: 5,
    explanationUsefulness: 4,
    feedbackText: 'Semantic tags and ARIA labels let my screen reader read out the emergency contacts first. Excellent accessibility support.'
  },
  {
    id: 'use-4',
    personaName: 'Karthik (Operator, high stress)',
    role: 'Agency Operator',
    language: 'English',
    accessibility: 'Simplified Text',
    clarity: 5,
    easeOfUnderstanding: 5,
    timeToFindNeededAction: 5,
    accessibilitySatisfaction: 4,
    trust: 5,
    explanationUsefulness: 5,
    feedbackText: 'The mandatory human-review workflow prevents accidental triggers. Generating equivalent multi-lingual drafts instantly saves valuable minutes.'
  },
  {
    id: 'use-5',
    personaName: 'Meera (Cognitive disability)',
    role: 'Citizen',
    language: 'Tamil',
    accessibility: 'Simplified Language',
    clarity: 5,
    easeOfUnderstanding: 5,
    timeToFindNeededAction: 4,
    accessibilitySatisfaction: 5,
    trust: 5,
    explanationUsefulness: 4,
    feedbackText: 'Short, clear sentences made the water logging instructions easy to digest without feeling overwhelmed.'
  }
];

// Seed initial Audit Logs
const initialAuditLogs = (): AuditLog[] => [
  { id: 'log-1', user: 'Commander R. Srinivasan', timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), action: 'System Database Seeding Completed', prevValue: 'None', newValue: 'Seeded 10 incidents & 105 residents' },
  { id: 'log-2', user: 'Commander R. Srinivasan', timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), action: 'Activated Adyar Overflow Warning Alert (inc-2)', prevValue: 'Status: Draft', newValue: 'Status: Active' },
  { id: 'log-3', user: 'Operator Priya Nair', timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), action: 'Suggested message for Usman Road clearance', incidentId: 'inc-3' },
  { id: 'log-4', user: 'Commander R. Srinivasan', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), action: 'Approved Critical Flood alert for Anna Nagar (inc-1)', incidentId: 'inc-1', prevValue: 'Review Status: Pending', newValue: 'Review Status: Approved' }
];

// LocalStorage helpers with type safety
const getItem = <T>(key: string, defaultValue: T): T => {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaultValue;
};

const setItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Database state initializer
export const initDb = (force = false) => {
  if (force || !localStorage.getItem('crisis_connect_initialized')) {
    const residents = generateResidents();
    const histData = generateHistoricalAnalytics(residents);
    
    setItem('crisis_connect_users', [
      { id: 'usr-admin', name: 'Commander R. Srinivasan', role: 'admin', language: 'en', accessibility: 'standard', email: 'srinivasan.r@crisisconnect.gov' },
      { id: 'usr-op1', name: 'Operator Priya Nair', role: 'operator', language: 'en', accessibility: 'standard', email: 'priya.n@crisisconnect.gov' },
      { id: 'usr-op2', name: 'Operator Arun Kumar', role: 'operator', language: 'en', accessibility: 'standard', email: 'arun.k@crisisconnect.gov' },
      ...residents
    ]);
    
    setItem('crisis_connect_incidents', initialIncidents);
    setItem('crisis_connect_notifications', histData.notifications);
    setItem('crisis_connect_feedback', histData.feedback);
    setItem('crisis_connect_audit_logs', initialAuditLogs());
    setItem('crisis_connect_usability', initialUsabilityRatings);
    setItem('crisis_connect_messages', []);
    setItem('crisis_connect_initialized', 'true');
    console.log('CrisisConnect Local Database Initialized & Seeded.');
  }
};

// Seeding trigger (runs immediately upon import)
initDb();

// Database Interface APIs
export const db = {
  // Users / Citizens
  getUsers: (): User[] => getItem('crisis_connect_users', []),
  getResidents: (): User[] => db.getUsers().filter(u => u.role === 'citizen'),
  updateUser: (updated: User) => {
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === updated.id);
    if (idx !== -1) {
      users[idx] = updated;
      setItem('crisis_connect_users', users);
      db.addAuditLog('System', `Updated profile for User ${updated.name}`, undefined, undefined, JSON.stringify(updated));
    }
  },

  // Incidents
  getIncidents: (): Incident[] => getItem('crisis_connect_incidents', []),
  getIncidentById: (id: string): Incident | undefined => db.getIncidents().find(i => i.id === id),
  addIncident: (incident: Incident, operator: string) => {
    const incidents = db.getIncidents();
    incidents.unshift(incident);
    setItem('crisis_connect_incidents', incidents);
    db.addAuditLog(operator, `Created Incident: ${incident.title}`, incident.id, undefined, JSON.stringify(incident));
  },
  updateIncident: (updated: Incident, operator: string) => {
    const incidents = db.getIncidents();
    const idx = incidents.findIndex(i => i.id === updated.id);
    if (idx !== -1) {
      const prev = incidents[idx];
      incidents[idx] = updated;
      setItem('crisis_connect_incidents', incidents);
      db.addAuditLog(operator, `Updated Incident: ${updated.title}`, updated.id, JSON.stringify(prev), JSON.stringify(updated));
    }
  },

  // Messages (Human Review Queue)
  getMessages: (): Message[] => getItem('crisis_connect_messages', []),
  addMessages: (newMessages: Message[]) => {
    const messages = db.getMessages();
    // Remove existing drafts for the same incident/lang/accessibility to prevent duplicates
    const filtered = messages.filter(m => 
      !newMessages.some(nm => nm.incidentId === m.incidentId && nm.language === m.language && nm.accessibilityFormat === m.accessibilityFormat)
    );
    setItem('crisis_connect_messages', [...newMessages, ...filtered]);
  },
  updateMessageStatus: (messageId: string, status: Message['status'], approvedBy: string) => {
    const messages = db.getMessages();
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      const prev = messages[idx];
      messages[idx] = {
        ...messages[idx],
        status,
        approvedBy: status === 'approved' ? approvedBy : undefined,
        approvedAt: status === 'approved' ? new Date().toISOString() : undefined
      };
      setItem('crisis_connect_messages', messages);
      db.addAuditLog(approvedBy, `Alert Message Review Decision: ${status.toUpperCase()} (ID: ${messageId})`, prev.incidentId);
      return messages[idx];
    }
    return undefined;
  },
  updateMessageContent: (messageId: string, content: string, editor: string) => {
    const messages = db.getMessages();
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      const prev = messages[idx];
      messages[idx] = { ...messages[idx], content };
      setItem('crisis_connect_messages', messages);
      db.addAuditLog(editor, `Edited alert content manually (ID: ${messageId})`, prev.incidentId, prev.content, content);
    }
  },

  // Notifications
  getNotifications: (): Notification[] => getItem('crisis_connect_notifications', []),
  addNotifications: (notifs: Notification[]) => {
    const current = db.getNotifications();
    setItem('crisis_connect_notifications', [...notifs, ...current]);
  },
  updateNotificationStatus: (notifId: string, status: Notification['status'], error?: string) => {
    const notifs = db.getNotifications();
    const idx = notifs.findIndex(n => n.id === notifId);
    if (idx !== -1) {
      notifs[idx] = { ...notifs[idx], status, errorMessage: error };
      setItem('crisis_connect_notifications', notifs);
    }
  },

  // Feedback
  getFeedback: (): Feedback[] => getItem('crisis_connect_feedback', []),
  addFeedback: (fb: Feedback) => {
    const current = db.getFeedback();
    current.unshift(fb);
    setItem('crisis_connect_feedback', current);
    db.addAuditLog(`Resident ${fb.citizenId}`, `Submitted feedback for alert ${fb.notificationId}`, fb.incidentId);
  },

  // Usability Validation
  getUsabilityRatings: (): UsabilityRating[] => getItem('crisis_connect_usability', []),
  addUsabilityRating: (rating: UsabilityRating) => {
    const current = db.getUsabilityRatings();
    current.unshift(rating);
    setItem('crisis_connect_usability', current);
  },

  // Audit Logs
  getAuditLogs: (): AuditLog[] => getItem('crisis_connect_audit_logs', []),
  addAuditLog: (user: string, action: string, incidentId?: string, prevValue?: string, newValue?: string) => {
    const logs = db.getAuditLogs();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user,
      timestamp: new Date().toISOString(),
      action,
      incidentId,
      prevValue,
      newValue
    };
    logs.unshift(newLog);
    setItem('crisis_connect_audit_logs', logs);
  },

  // Full Database Reset
  resetDb: () => {
    initDb(true);
  }
};
