const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'crisisconnect.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

// Helper functions for promise-based query execution
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize Database Schema
const initDatabase = async () => {
  // 1. Users Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'citizen')),
      language TEXT DEFAULT 'en',
      accessibility TEXT DEFAULT 'standard',
      lat REAL,
      lng REAL,
      area TEXT,
      route TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Citizens Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS citizens (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      lat REAL,
      lng REAL,
      area TEXT,
      route TEXT,
      preferred_language TEXT DEFAULT 'en',
      accessibility_requirement TEXT DEFAULT 'standard',
      notification_preference TEXT DEFAULT 'web',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Disasters / Incidents Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS disasters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      radius REAL NOT NULL,
      affected_routes_json TEXT DEFAULT '[]',
      affected_services_json TEXT DEFAULT '[]',
      recommended_action TEXT,
      emergency_contact TEXT,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      agencies_conflicting INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Affected Areas Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS affected_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      radius REAL NOT NULL,
      severity TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Affected Routes Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS affected_routes (
      id TEXT PRIMARY KEY,
      route_name TEXT NOT NULL,
      starting_point TEXT,
      destination TEXT,
      status TEXT NOT NULL DEFAULT 'BLOCKED',
      reason TEXT,
      alternative_route TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Citizen Reports Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS citizen_reports (
      id TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL,
      citizen_name TEXT,
      report_type TEXT NOT NULL,
      description TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      location_name TEXT,
      severity TEXT DEFAULT 'medium',
      image_path TEXT,
      status TEXT DEFAULT 'pending_review',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Alerts / Messages Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
      citizen_id TEXT NOT NULL,
      language TEXT NOT NULL,
      accessibility_format TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'approved', 'rejected')),
      severity TEXT DEFAULT 'high',
      approved_by TEXT,
      approved_at DATETIME,
      explanation_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Human Reviews Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS human_reviews (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
      incident_id TEXT NOT NULL,
      citizen_id TEXT NOT NULL,
      original_message TEXT NOT NULL,
      edited_message TEXT,
      reviewer TEXT NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('approve', 'reject', 'edit_approve')),
      review_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Audit Logs Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user TEXT NOT NULL,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Notification Deliveries Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      incident_id TEXT NOT NULL,
      resident_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('sent', 'delivered', 'failed', 'pending')),
      delivery_time_ms INTEGER DEFAULT 0,
      error_message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      system_type TEXT NOT NULL CHECK(system_type IN ('baseline', 'proposed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. Feedback / Ratings Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS citizen_feedback (
      id TEXT PRIMARY KEY,
      notification_id TEXT,
      incident_id TEXT NOT NULL,
      citizen_id TEXT NOT NULL,
      understandable INTEGER DEFAULT 1,
      timely INTEGER DEFAULT 1,
      rating INTEGER DEFAULT 5,
      comments TEXT,
      system_type TEXT NOT NULL CHECK(system_type IN ('baseline', 'proposed')),
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. Experiments Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      scenario_name TEXT NOT NULL,
      baseline_result_json TEXT,
      prototype_result_json TEXT,
      understandability REAL DEFAULT 0,
      relevance REAL DEFAULT 0,
      timeliness REAL DEFAULT 0,
      language_accuracy REAL DEFAULT 0,
      accessibility_score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database schema initialization completed.');
};

module.exports = {
  db,
  initDatabase,
  runQuery,
  getQuery,
  allQuery
};
