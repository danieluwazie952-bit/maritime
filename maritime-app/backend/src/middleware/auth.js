const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a signed JWT for a user (or super_admin)
 */
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

/**
 * Middleware: verify Bearer token and attach req.user
 * Super admin has no DB record — only a role in the JWT payload.
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'super_admin') {
      req.user = { role: 'super_admin' };
      return next();
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Middleware factory: restrict access to specific roles
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };

module.exports = { signToken, authenticate, authorize };
