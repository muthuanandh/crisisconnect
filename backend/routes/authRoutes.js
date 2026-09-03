const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery, allQuery } = require('../database/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    await runQuery(
      `INSERT INTO audit_logs (id, user, action, resource, details) VALUES (?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, user.name, 'User Login', 'Auth', `Logged in as ${user.role.toUpperCase()}`]
    );

    const { password_hash, ...userProfile } = user;
    res.json({
      success: true,
      token,
      user: userProfile
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'citizen', language = 'en', accessibility = 'standard', lat, lng, area, route, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const id = `usr-${Date.now()}`;
    const password_hash = bcrypt.hashSync(password, 10);

    await runQuery(
      `INSERT INTO users (id, name, email, password_hash, role, language, accessibility, lat, lng, area, route, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, password_hash, role, language, accessibility, lat || null, lng || null, area || null, route || null, phone || null]
    );

    if (role === 'citizen') {
      await runQuery(
        `INSERT INTO citizens (id, user_id, name, email, phone, lat, lng, area, route, preferred_language, accessibility_requirement)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, id, name, email, phone || null, lat || null, lng || null, area || null, route || null, language, accessibility]
      );
    }

    const token = jwt.sign({ id, role, email, name }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      token,
      user: { id, name, email, role, language, accessibility, lat, lng, area, route, phone }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await getQuery('SELECT id, name, email, role, language, accessibility, lat, lng, area, route, phone FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/users
router.get('/users', async (req, res, next) => {
  try {
    const users = await allQuery('SELECT id, name, email, role, language, accessibility, lat, lng, area, route, phone FROM users');
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
