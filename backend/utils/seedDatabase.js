const bcrypt = require('bcryptjs');
const { initDatabase, runQuery } = require('../database/database');

const seedDatabase = async () => {
  console.log('🌱 Initializing & Seeding CrisisConnect SQLite Database...');

  try {
    await initDatabase();

    const passwordHashAdmin = bcrypt.hashSync('Admin@123', 10);
    const passwordHashOperator = bcrypt.hashSync('Operator@123', 10);
    const passwordHashCitizen = bcrypt.hashSync('Citizen@123', 10);

    // 1. Seed Core Officers & Citizens into Users Table
    const coreUsers = [
      {
        id: 'usr-admin',
        name: 'Commander R. Srinivasan',
        email: 'admin@crisisconnect.local',
        password_hash: passwordHashAdmin,
        role: 'admin',
        language: 'en',
        accessibility: 'standard',
        area: 'Control Room HQ',
        phone: '+91 98400 10001'
      },
      {
        id: 'usr-op1',
        name: 'Operator Priya Nair',
        email: 'operator@crisisconnect.local',
        password_hash: passwordHashOperator,
        role: 'operator',
        language: 'en',
        accessibility: 'standard',
        area: 'Control Room HQ',
        phone: '+91 98400 10002'
      },
      {
        id: 'usr-cit1',
        name: 'Arun Kumar (Singanallur)',
        email: 'citizen@crisisconnect.local',
        password_hash: passwordHashCitizen,
        role: 'citizen',
        language: 'ta',
        accessibility: 'screen_reader',
        lat: 11.00,
        lng: 77.00,
        area: 'Singanallur',
        route: 'Route 18',
        phone: '+91 98400 10003'
      },
      {
        id: 'usr-cit2',
        name: 'Priya Sharma (RS Puram)',
        email: 'priya@crisisconnect.local',
        password_hash: passwordHashCitizen,
        role: 'citizen',
        language: 'en',
        accessibility: 'standard',
        lat: 11.01,
        lng: 76.95,
        area: 'RS Puram',
        route: 'Route 5C',
        phone: '+91 98400 10004'
      },
      {
        id: 'usr-cit3',
        name: 'Rahul Verma (Coastal Area)',
        email: 'rahul@crisisconnect.local',
        password_hash: passwordHashCitizen,
        role: 'citizen',
        language: 'hi',
        accessibility: 'large_text',
        lat: 13.00,
        lng: 80.25,
        area: 'Coastal Area',
        route: 'Route 21G',
        phone: '+91 98400 10005'
      }
    ];

    for (const u of coreUsers) {
      await runQuery(
        `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, language, accessibility, lat, lng, area, route, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.email, u.password_hash, u.role, u.language, u.accessibility, u.lat || null, u.lng || null, u.area || null, u.route || null, u.phone || null]
      );
    }

    // 2. Generate 100+ Distributed Citizens across Chennai & Coimbatore
    const areas = [
      { name: 'Singanallur', lat: 11.0000, lng: 77.0000, routes: ['Route 18', 'Route 5C'] },
      { name: 'RS Puram', lat: 11.0100, lng: 76.9500, routes: ['Route 5C', 'Route 21G'] },
      { name: 'Coastal Area', lat: 13.0063, lng: 80.2574, routes: ['Route 21G', 'Route 102'] },
      { name: 'Anna Nagar', lat: 13.0850, lng: 80.2101, routes: ['Route 18', 'Route 5C'] },
      { name: 'Guindy', lat: 13.0090, lng: 80.2210, routes: ['Route 21G', 'Route 5C'] },
      { name: 'Velachery', lat: 12.9796, lng: 80.2196, routes: ['Route 102', 'Route 221'] },
      { name: 'Mylapore', lat: 13.0330, lng: 80.2690, routes: ['Route 21G', 'Route 47'] },
      { name: 'Tambaram', lat: 12.9229, lng: 80.1275, routes: ['Route 18', 'Route 221'] }
    ];

    for (let i = 1; i <= 100; i++) {
      const id = `res-${i}`;
      const areaObj = areas[i % areas.length];
      const latOffset = (Math.random() - 0.5) * 0.015;
      const lngOffset = (Math.random() - 0.5) * 0.015;

      const langRand = Math.random();
      const language = langRand < 0.5 ? 'ta' : langRand < 0.8 ? 'en' : 'hi';

      const accRand = Math.random();
      let accessibility = 'standard';
      if (accRand > 0.6) {
        const formats = ['simplified', 'large_text', 'high_contrast', 'screen_reader', 'audio'];
        accessibility = formats[Math.floor(Math.random() * formats.length)];
      }

      const name = `Resident ${i} (${areaObj.name})`;
      const email = `resident${i}@crisisconnect.net`;
      const lat = Number((areaObj.lat + latOffset).toFixed(5));
      const lng = Number((areaObj.lng + lngOffset).toFixed(5));
      const route = areaObj.routes[i % areaObj.routes.length];
      const phone = `+91 98400 ${String(10000 + i).substring(1)}`;

      await runQuery(
        `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, language, accessibility, lat, lng, area, route, phone)
         VALUES (?, ?, ?, ?, 'citizen', ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, email, passwordHashCitizen, language, accessibility, lat, lng, areaObj.name, route, phone]
      );

      await runQuery(
        `INSERT OR REPLACE INTO citizens (id, user_id, name, email, phone, lat, lng, area, route, preferred_language, accessibility_requirement, notification_preference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'web')`,
        [id, id, name, email, phone, lat, lng, areaObj.name, route, language, accessibility]
      );
    }

    // 3. Seed Incidents / Disasters Table
    const demoDisasters = [
      {
        id: 'inc-1',
        title: 'Singanallur Severe Waterlogging & Inundation',
        type: 'flood',
        description: 'Heavy precipitation causing rapid waterlogging up to 3 feet in low-lying residential sectors.',
        severity: 'high',
        status: 'active',
        lat: 11.0000,
        lng: 77.0000,
        radius: 5.0,
        affected_routes_json: JSON.stringify(['Route 18', 'Main Road']),
        affected_services_json: JSON.stringify(['Metropolitan Bus Service Line 18', 'Substation 4 Line']),
        recommended_action: 'Avoid Main Road subway. Divert to Alternate Bypass Road A.',
        emergency_contact: '1077 (Control Room Helpline)',
        start_time: new Date(Date.now() - 3600000 * 2).toISOString(),
        agencies_conflicting: 0
      },
      {
        id: 'inc-2',
        title: 'Coastal Cyclonic Storm Warning & Wind Gusts',
        type: 'cyclone',
        description: 'Imminent coastal storm surge with wind gusts up to 85 km/h. Coastal evacuations in progress.',
        severity: 'critical',
        status: 'active',
        lat: 13.0063,
        lng: 80.2574,
        radius: 10.0,
        affected_routes_json: JSON.stringify(['Route 21G', 'Coastal Expressway']),
        affected_services_json: JSON.stringify(['Coastal Power Substation', 'Marine Fishing Fleet']),
        recommended_action: 'Evacuate low-lying coastal huts to Relief Camp #3 (Community Center).',
        emergency_contact: '108 (Emergency Operations Response)',
        start_time: new Date(Date.now() - 3600000 * 5).toISOString(),
        agencies_conflicting: 0
      },
      {
        id: 'inc-3',
        title: 'Highway Substation Fire & Industrial Disruption',
        type: 'power_outage',
        description: 'Electrical transformer fire causing localized grid power failure and traffic signal blackout.',
        severity: 'medium',
        status: 'active',
        lat: 13.0090,
        lng: 80.2210,
        radius: 3.0,
        affected_routes_json: JSON.stringify(['Route 5C', 'Industrial Corridor']),
        affected_services_json: JSON.stringify(['Grid Substation B', 'Traffic Signal Line 5']),
        recommended_action: 'Expect signal blackouts. Proceed with caution under manual traffic police direction.',
        emergency_contact: '101 (Fire & Rescue Services)',
        start_time: new Date(Date.now() - 3600000 * 8).toISOString(),
        agencies_conflicting: 0
      }
    ];

    for (const d of demoDisasters) {
      await runQuery(
        `INSERT OR REPLACE INTO disasters (id, title, type, description, severity, status, lat, lng, radius, affected_routes_json, affected_services_json, recommended_action, emergency_contact, start_time, agencies_conflicting)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.id, d.title, d.type, d.description, d.severity, d.status, d.lat, d.lng, d.radius, d.affected_routes_json, d.affected_services_json, d.recommended_action, d.emergency_contact, d.start_time, d.agencies_conflicting]
      );
    }

    // 4. Seed Affected Areas & Routes
    await runQuery(
      `INSERT OR REPLACE INTO affected_areas (id, name, lat, lng, radius, severity, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['area-1', 'Singanallur Sector', 11.00, 77.00, 5.0, 'high', 'Flooding waterlogging', 'active']
    );

    await runQuery(
      `INSERT OR REPLACE INTO affected_routes (id, route_name, starting_point, destination, status, reason, alternative_route)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['rt-1', 'Route 18 - Main Road', 'Singanallur Junction', 'City Center', 'BLOCKED', 'Flood water inundation (2.5 ft)', 'Alternate Route A via Expressway']
    );

    // 5. Seed Citizen Reports
    const sampleReports = [
      {
        id: 'cr-101',
        citizen_id: 'usr-cit1',
        citizen_name: 'Arun Kumar',
        report_type: 'Flood',
        description: 'Water accumulation of over 2 feet near Singanallur bus stop. Vehicles stalling.',
        lat: 11.0012,
        lng: 77.0034,
        location_name: 'Singanallur Bus Stand',
        severity: 'high',
        status: 'pending_review',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString()
      },
      {
        id: 'cr-102',
        citizen_id: 'usr-cit3',
        citizen_name: 'Rahul Verma',
        report_type: 'Fallen Tree',
        description: 'Large banyan tree fallen across Coastal Expressway blocking northbound lane.',
        lat: 13.0075,
        lng: 80.2580,
        location_name: 'Coastal Expressway Km 4',
        severity: 'medium',
        status: 'approved',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];

    for (const r of sampleReports) {
      await runQuery(
        `INSERT OR REPLACE INTO citizen_reports (id, citizen_id, citizen_name, report_type, description, lat, lng, location_name, severity, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.citizen_id, r.citizen_name, r.report_type, r.description, r.lat, r.lng, r.location_name, r.severity, r.status, r.created_at]
      );
    }

    // 6. Seed Sample Alerts
    const sampleAlert = {
      id: 'msg-prop-inc-1-usr-cit1',
      incident_id: 'inc-1',
      citizen_id: 'usr-cit1',
      language: 'ta',
      accessibility_format: 'screen_reader',
      subject: '🚨 வெள்ள எச்சரிக்கை: சிங்கநல்லூர்',
      content: 'உங்கள் பகுதியில் வெள்ளம் காரணமாக மெயின் ரோடு மூடப்பட்டுள்ளது. தயவுசெய்து மாற்று வழியை பயன்படுத்தவும்.',
      status: 'pending_review',
      severity: 'high',
      explanation_json: JSON.stringify({
        locationMatch: true,
        routeMatch: true,
        distanceKm: 0.45,
        severityReason: 'High severity flood warning',
        languageReason: 'Citizen preference: Tamil',
        accessibilityReason: 'Screen Reader format enabled'
      })
    };

    await runQuery(
      `INSERT OR REPLACE INTO alerts (id, incident_id, citizen_id, language, accessibility_format, subject, content, status, severity, explanation_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sampleAlert.id, sampleAlert.incident_id, sampleAlert.citizen_id, sampleAlert.language, sampleAlert.accessibility_format, sampleAlert.subject, sampleAlert.content, sampleAlert.status, sampleAlert.severity, sampleAlert.explanation_json]
    );

    // Audit Log entry
    await runQuery(
      `INSERT OR REPLACE INTO audit_logs (id, user, action, resource, resource_id, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['log-init', 'System Administrator', 'Database Seeding', 'SQLite DB', 'crisisconnect.db', 'Successfully seeded core users, 100+ citizens, 3 disasters, routes, and sample reports.']
    );

    console.log('✅ SQLite Database Seeding Completed Successfully!');
  } catch (err) {
    console.error('❌ Error seeding SQLite database:', err);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
