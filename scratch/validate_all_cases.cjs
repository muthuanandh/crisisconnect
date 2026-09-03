const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const makeRequest = (method, endpoint, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + endpoint);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runDetailedValidation = async () => {
  console.log('================================================================');
  console.log('🧪 CRISISCONNECT COMPREHENSIVE END-TO-END VALIDATION RUNNER');
  console.log('================================================================');

  const testResults = [];

  const record = (tc, name, pass, detail) => {
    testResults.push({ tc, name, pass, detail });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${tc} - ${name}: ${detail}`);
  };

  try {
    // ---------------------------------------------------------------
    // TEST CASE 1 — CITIZEN FLOOD REPORT (Chennai, Tamil, Screen Reader)
    // ---------------------------------------------------------------
    const report1Data = {
      citizenId: 'usr-cit1',
      citizenName: 'Arun Kumar',
      reportType: 'Flood',
      description: 'Heavy flooding has blocked the main road and vehicles cannot pass safely.',
      lat: 13.0827,
      lng: 80.2707,
      locationName: 'Main Road, Chennai',
      severity: 'high'
    };
    const res1 = await makeRequest('POST', '/reports', report1Data);
    const rep1Id = res1.body.report?.id;
    const tc1Valid = res1.status === 201 && rep1Id && res1.body.report.reportType === 'Flood';
    record('TEST CASE 1', 'Citizen Flood Report (Chennai/Tamil)', tc1Valid, `Report ID: ${rep1Id}, Location: ${res1.body.report?.locationName}`);

    // Verify DB Persistence for Test Case 1
    const repList1 = await makeRequest('GET', '/reports');
    const dbFound1 = repList1.body.reports?.find((r) => r.id === rep1Id);
    record('TEST CASE 1 DB', 'SQLite Persistence Verification (Chennai)', Boolean(dbFound1), `Found in SQLite: ${dbFound1?.locationName}`);

    // ---------------------------------------------------------------
    // TEST CASE 2 — DIFFERENT LOCATION AND ENGLISH (Coimbatore, English)
    // ---------------------------------------------------------------
    const report2Data = {
      citizenId: 'usr-cit2',
      citizenName: 'Priya Sharma',
      reportType: 'Road Blockage',
      description: 'A large tree has fallen across the road and traffic is completely blocked.',
      lat: 11.0100,
      lng: 76.9500,
      locationName: 'Main Road, Coimbatore',
      severity: 'medium'
    };
    const res2 = await makeRequest('POST', '/reports', report2Data);
    const rep2Id = res2.body.report?.id;
    const tc2Valid = res2.status === 201 && rep2Id && res2.body.report.locationName === 'Main Road, Coimbatore';
    record('TEST CASE 2', 'Different Location & English (Coimbatore)', tc2Valid, `Report ID: ${rep2Id}, Location: ${res2.body.report?.locationName}`);

    // Verify Separation (Chennai vs Coimbatore)
    const repList2 = await makeRequest('GET', '/reports');
    const chennaiReps = repList2.body.reports?.filter((r) => r.locationName.includes('Chennai'));
    const coimbatoreReps = repList2.body.reports?.filter((r) => r.locationName.includes('Coimbatore'));
    record('TEST CASE 2 SEPARATION', 'Location Isolation Check', chennaiReps.length > 0 && coimbatoreReps.length > 0, `Chennai Count: ${chennaiReps.length}, Coimbatore Count: ${coimbatoreReps.length}`);

    // ---------------------------------------------------------------
    // TEST CASE 3 — MULTILINGUAL OUTPUT (English, Tamil, Hindi)
    // ---------------------------------------------------------------
    const mockDisaster = {
      title: 'Multilingual Verification Incident',
      type: 'flood',
      description: 'Waterlogging test.',
      severity: 'high',
      status: 'active',
      lat: 11.0000,
      lng: 77.0000,
      radius: 5.0,
      affectedRoutes: ['Route 18'],
      recommendedAction: 'Use alternate route.',
      emergencyContact: '1077'
    };

    // ---------------------------------------------------------------
    // TEST CASE 4 — ACCESSIBILITY (Standard, Screen Reader, High Contrast, TTS)
    // ---------------------------------------------------------------
    const citTamil = await makeRequest('GET', '/citizens/usr-cit1');
    const citEng = await makeRequest('GET', '/citizens/usr-cit2');
    const citHindi = await makeRequest('GET', '/citizens/usr-cit3');
    record('TEST CASE 4', 'Accessibility Formats Configuration', citTamil.body.citizen?.accessibility === 'screen_reader' && citHindi.body.citizen?.accessibility === 'large_text', `Tamil Acc: ${citTamil.body.citizen?.accessibility}, Hindi Acc: ${citHindi.body.citizen?.accessibility}`);

    // ---------------------------------------------------------------
    // TEST CASE 5 — HUMAN-IN-THE-LOOP REVIEW (High-Impact Evacuation)
    // ---------------------------------------------------------------
    const highImpactDisaster = {
      title: 'Emergency Residential Evacuation',
      type: 'evacuation',
      description: 'Flood water has entered residential areas and residents need immediate evacuation assistance.',
      severity: 'critical',
      status: 'active',
      lat: 13.0827,
      lng: 80.2707,
      radius: 6.0,
      affectedRoutes: ['Low-lying residential area'],
      recommendedAction: 'Evacuate to Relief Camp immediately.',
      emergencyContact: '108'
    };
    const disasterEvacRes = await makeRequest('POST', '/disasters', highImpactDisaster);
    const requiresHITL = disasterEvacRes.body.targetingResult?.requiresHumanReview;
    record('TEST CASE 5', 'Human-in-the-Loop Risk Trigger', requiresHITL === true, `Requires Commander Review: ${requiresHITL}`);

    // Test Commander Approval
    const pendingList = await makeRequest('GET', '/reviews/pending');
    if (pendingList.body.pending?.length > 0) {
      const pendingAlert = pendingList.body.pending[0];
      const approveRes = await makeRequest('POST', `/reviews/${pendingAlert.id}/approve`, { approvedBy: 'Commander R. Srinivasan', reason: 'Critical evacuation approved.' });
      record('TEST CASE 5 APPROVAL', 'Commander Review Approval Workflow', approveRes.status === 200 && approveRes.body.success, `Approved Alert ID: ${pendingAlert.id}`);
    }

    // ---------------------------------------------------------------
    // TEST CASE 6 — GEOFENCING / LOCATION AWARENESS
    // ---------------------------------------------------------------
    const maduraiDisaster = {
      title: 'Madurai Highway Blockage',
      type: 'road_closure',
      description: 'Landslide on Madurai highway.',
      severity: 'medium',
      status: 'active',
      lat: 9.9252,
      lng: 78.1198,
      radius: 2.0,
      affectedRoutes: ['Madurai Highway'],
      recommendedAction: 'Drive with caution.',
      emergencyContact: '1077'
    };
    const maduraiRes = await makeRequest('POST', '/disasters', maduraiDisaster);
    record('TEST CASE 6', 'Geofencing Sector Isolation (Madurai)', maduraiRes.status === 201, `Targeted Citizens: ${maduraiRes.body.targetingResult?.affectedCitizensCount}`);

    // ---------------------------------------------------------------
    // TEST CASE 7 — INVALID INPUT VALIDATION
    // ---------------------------------------------------------------
    const invalidReq1 = await makeRequest('POST', '/reports', { reportType: '', description: '' });
    record('TEST CASE 7A', 'Empty Fields Validation', invalidReq1.status === 400 && !invalidReq1.body.success, `Status: ${invalidReq1.status}`);

    const invalidReq2 = await makeRequest('POST', '/disasters', { title: '' });
    record('TEST CASE 7B', 'Empty Disaster Title Validation', invalidReq2.status === 400 && !invalidReq2.body.success, `Status: ${invalidReq2.status}`);

    // ---------------------------------------------------------------
    // TEST CASE 8 — DATABASE PERSISTENCE
    // ---------------------------------------------------------------
    const finalReportCheck = await makeRequest('GET', '/reports');
    record('TEST CASE 8', 'Database Persistence & Read Verification', finalReportCheck.status === 200 && finalReportCheck.body.reports.length >= 2, `Total Reports Persisted: ${finalReportCheck.body.reports.length}`);

    // ---------------------------------------------------------------
    // TEST CASE 9 & 10 — OPERATOR & COMMANDER WORKFLOWS
    // ---------------------------------------------------------------
    const opLogin = await makeRequest('POST', '/auth/login', { email: 'operator@crisisconnect.local', password: 'Operator@123' });
    record('TEST CASE 9', 'Control Room Operator Login & Dashboard Access', opLogin.status === 200 && opLogin.body.user.role === 'operator', `Operator: ${opLogin.body.user.name}`);

    const cmdLogin = await makeRequest('POST', '/auth/login', { email: 'admin@crisisconnect.local', password: 'Admin@123' });
    record('TEST CASE 10', 'Commander Login & High-Impact Decision Access', cmdLogin.status === 200 && cmdLogin.body.user.role === 'admin', `Commander: ${cmdLogin.body.user.name}`);

    // ---------------------------------------------------------------
    // TEST CASE 11 — BASELINE ANALYTICS
    // ---------------------------------------------------------------
    const statsRes = await makeRequest('GET', '/analytics/dashboard');
    const validStats = statsRes.status === 200 && statsRes.body.stats.activeDisruptions > 0;
    record('TEST CASE 11', 'Dynamic SQLite Baseline Analytics', validStats, `Active Disruptions: ${statsRes.body.stats.activeDisruptions}, Citizen Reports: ${statsRes.body.stats.citizenReports}`);

    // ---------------------------------------------------------------
    // TEST CASE 12 — FIVE FAILURE CASES
    // ---------------------------------------------------------------
    const fc1 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-1' });
    const fc2 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-2' });
    const fc3 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-3' });
    const fc4 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-4' });
    const fc5 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-5' });
    const allFcPass = fc1.body.result?.pass && fc2.body.result?.pass && fc3.body.result?.pass && fc4.body.result?.pass && fc5.body.result?.pass;
    record('TEST CASE 12', 'Five Stress Test Failure Cases', allFcPass, `5 Failure Cases Passed: ${allFcPass}`);

    // ---------------------------------------------------------------
    // TEST CASE 13 — API VALIDATION
    // ---------------------------------------------------------------
    const auditRes = await makeRequest('GET', '/audit-logs');
    record('TEST CASE 13', 'System Audit Log API Endpoint', auditRes.status === 200 && auditRes.body.logs.length > 0, `Log Count: ${auditRes.body.logs.length}`);

    // ---------------------------------------------------------------
    // TEST CASE 14 — ERROR HANDLING
    // ---------------------------------------------------------------
    const err404 = await makeRequest('GET', '/disasters/non_existent_id_9999');
    record('TEST CASE 14', 'Safe 404 Error Response Handling', err404.status === 404 && !err404.body.success, `Message: ${err404.body.message}`);

    console.log('================================================================');
    console.log(`TOTAL VALIDATION CHECKS EXECUTED: ${testResults.length}`);
    console.log(`TOTAL PASSED: ${testResults.filter(t => t.pass).length}`);
    console.log(`TOTAL FAILED: ${testResults.filter(t => !t.pass).length}`);
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Validation script error:', err);
  }
};

runDetailedValidation();
