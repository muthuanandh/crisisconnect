const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'crisisconnect_secret_key_capstone_2026';

// Middleware to authenticate JWT token (or bypass gracefully for demo mode header)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Optional header for session role switcher in demo UI
  const demoRole = req.headers['x-demo-role'];
  const demoUserId = req.headers['x-demo-user-id'];

  if (demoUserId && demoRole) {
    req.user = {
      id: demoUserId,
      role: demoRole,
      name: req.headers['x-demo-user-name'] || 'Demo User'
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires ${roles.join(' or ')} permission.`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
