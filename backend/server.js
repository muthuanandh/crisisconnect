const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for development
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'CrisisConnect Combined Full-Stack Server',
    database: 'SQLite (crisisconnect.db)',
    timestamp: new Date().toISOString()
  });
});

// Register API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/citizens', require('./routes/citizenRoutes'));
app.use('/api/disasters', require('./routes/disasterRoutes'));
app.use('/api/areas', require('./routes/areaRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/failures', require('./routes/failureRoutes'));
app.use('/api/experiments', require('./routes/experimentRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));

// Serve Combined Single Localhost Frontend (React/Vite Production Build)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Catch-all route for SPA wildcard routing in Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use(require('./middleware/errorHandler'));

// Start Express Combined Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 CrisisConnect Combined Single Localhost Server Active!`);
  console.log(`🌐 SINGLE LOCALHOST LINK: http://localhost:${PORT}`);
  console.log(`🗄️ Database: SQLite (backend/database/crisisconnect.db)`);
  console.log(`==================================================`);
});

module.exports = app;
