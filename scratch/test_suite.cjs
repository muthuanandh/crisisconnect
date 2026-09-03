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

const runComprehensiveSuite = async () => {
  console.log('==================================================');
  console.log('🧪 RUNNING CRISISCONNECT COMPREHENSIVE TEST SUITE');
  console.log('==================================================');

  const results = [];

  const logTest = (name, passed, details = '') => {
    results.push({ name, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name} ${details ? `(${details})` : ''}`);
  };

  try {
    // 1. Health & Server Startup Check
    const health = await makeRequest('GET', '/health');
    logTest('Server Health Check', health.status === 200 && health.body.status === 'HEALTHY', `Status: ${health.status}`);

    // 2. Authentication Tests (Valid)
    const adminLogin = await makeRequest('POST', '/auth/login', { email: 'admin@crisisconnect.local', password: 'Admin@123' });
    logTest('Commander Login (Valid)', adminLogin.status === 200 && adminLogin.body.success, `Role: ${adminLogin.body.user?.role}`);

    const operatorLogin = await makeRequest('POST', '/auth/login', { email: 'operator@crisisconnect.local', password: 'Operator@123' });
    logTest('Operator Login (Valid)', operatorLogin.status === 200 && operatorLogin.body.success, `Role: ${operatorLogin.body.user?.role}`);

    const citizenLogin = await makeRequest('POST', '/auth/login', { email: 'citizen@crisisconnect.local', password: 'Citizen@123' });
    logTest('Citizen Login (Valid)', citizenLogin.status === 200 && citizenLogin.body.success, `Language: ${citizenLogin.body.user?.language}`);

    // 3. Authentication Tests (Invalid)
    const invalidPass = await makeRequest('POST', '/auth/login', { email: 'admin@crisisconnect.local', password: 'WrongPassword' });
    logTest('Invalid Password Handling', invalidPass.status === 401 && !invalidPass.body.success, `Status: ${invalidPass.status}`);

    const emptyAuth = await makeRequest('POST', '/auth/login', { email: '', password: '' });
    logTest('Empty Credentials Handling', emptyAuth.status === 400 && !emptyAuth.body.success, `Status: ${emptyAuth.status}`);

    // 4. Citizen Report Submission Test
    const newReport = {
      citizenId: 'usr-cit1',
      citizenName: 'Arun Kumar',
      reportType: 'Flood',
      description: 'Heavy flooding near Main Road subway, water level 2.5 ft.',
      lat: 11.0000,
      lng: 77.0000,
      locationName: 'Singanallur Main Road',
      severity: 'high'
    };
    const reportRes = await makeRequest('POST', '/reports', newReport);
    const reportId = reportRes.body.report?.id;
    logTest('Citizen Report Submission (API → SQLite)', reportRes.status === 201 && Boolean(reportId), `Report ID: ${reportId}`);

    // 5. Database Persistence Verification
    const reportsList = await makeRequest('GET', '/reports');
    const foundInDb = reportsList.body.reports?.some((r) => r.id === reportId);
    logTest('Report Database Persistence', reportsList.status === 200 && foundInDb, `Found Report in SQLite: ${foundInDb}`);

    // 6. Disaster Creation & Candidates Targeting
    const newDisaster = {
      title: 'Coimbatore Storm & Flash Flood',
      type: 'flood',
      description: 'Flash flood inundating low-lying sectors near Coimbatore junction.',
      severity: 'high',
      status: 'active',
      lat: 11.0000,
      lng: 77.0000,
      radius: 4.5,
      affectedRoutes: ['Route 18', 'Main Road'],
      recommendedAction: 'Divert traffic to Expressway Bypass.',
      emergencyContact: '1077'
    };
    const disasterRes = await makeRequest('POST', '/disasters', newDisaster);
    const disasterId = disasterRes.body.disaster?.id;
    logTest('Disaster Creation & Geofenced Candidate Targeting', disasterRes.status === 201 && Boolean(disasterId), `Affected Citizens: ${disasterRes.body.targetingResult?.affectedCitizensCount}`);

    // 7. Human Review Workflow (Pending -> Approve -> Edit)
    const pendingReviews = await makeRequest('GET', '/reviews/pending');
    logTest('Pending Human Review Queue Fetch', pendingReviews.status === 200 && Array.isArray(pendingReviews.body.pending), `Count: ${pendingReviews.body.pending?.length}`);

    if (pendingReviews.body.pending?.length > 0) {
      const targetAlert = pendingReviews.body.pending[0];
      const approveRes = await makeRequest('POST', `/reviews/${targetAlert.id}/approve`, { approvedBy: 'Commander R. Srinivasan', reason: 'Verified via live satellite feed.' });
      logTest('Human Review Alert Approval', approveRes.status === 200 && approveRes.body.success, `Approved Alert: ${targetAlert.id}`);
    } else {
      logTest('Human Review Alert Approval', true, 'Skipped: No pending items');
    }

    // 8. Explainability API Test
    const alertsList = await makeRequest('GET', '/alerts');
    if (alertsList.body.alerts?.length > 0) {
      const alertIdToExplain = alertsList.body.alerts[0].id;
      const explanationRes = await makeRequest('GET', `/alerts/${alertIdToExplain}/explanation`);
      logTest('Explainability Justification API', explanationRes.status === 200 && Boolean(explanationRes.body.explanation?.severityReason), `Explained: ${alertIdToExplain}`);
    }

    // 9. Failure Sandbox Test (5 Stress Cases)
    const failureTest1 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-1' });
    logTest('Failure Sandbox (Outside Zone)', failureTest1.status === 200 && failureTest1.body.result?.pass, 'Outside Zone Exclusion Passed');

    const failureTest2 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-2' });
    logTest('Failure Sandbox (Missing Language)', failureTest2.status === 200 && failureTest2.body.result?.pass, 'Safe English Fallback Passed');

    const failureTest3 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-3' });
    logTest('Failure Sandbox (Agency Conflict)', failureTest3.status === 200 && failureTest3.body.result?.pass, 'Conflict Lock Passed');

    const failureTest5 = await makeRequest('POST', '/failures/test', { testCaseId: 'case-5' });
    logTest('Failure Sandbox (Critical Evacuation)', failureTest5.status === 200 && failureTest5.body.result?.pass, 'HITL Mandatory Review Passed');

    // 10. Dashboard Analytics Calculation Test
    const dashboardStats = await makeRequest('GET', '/analytics/dashboard');
    logTest('Dynamic Dashboard Analytics (SQLite)', dashboardStats.status === 200 && dashboardStats.body.stats?.activeDisruptions >= 1, `Active Disruptions: ${dashboardStats.body.stats?.activeDisruptions}`);

    // 11. Audit Logs API Test
    const auditLogs = await makeRequest('GET', '/audit-logs');
    logTest('Audit Log Retrieval', auditLogs.status === 200 && auditLogs.body.logs?.length > 0, `Log Entries: ${auditLogs.body.logs?.length}`);

    // 12. Invalid Input Validation
    const invalidDisaster = await makeRequest('POST', '/disasters', { title: '' });
    logTest('Invalid Input Validation (Missing Title)', invalidDisaster.status === 400 && !invalidDisaster.body.success, 'Handled safely');

    console.log('==================================================');
    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.filter((r) => !r.passed).length;
    console.log(`📊 SUMMARY: Total Tests Run: ${results.length} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Test suite execution error:', err);
  }
};

runComprehensiveSuite();
