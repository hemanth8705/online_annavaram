const { User } = require('../models');
const {
  verifyAccessToken,
  validateSession,
} = require('../services/sessionService');

async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null;

    if (!token) {
      const error = new Error('Authentication required');
      error.status = 401;
      throw error;
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      const error = new Error('Invalid or expired access token');
      error.status = 401;
      throw error;
    }

    const session = await validateSession(payload.sid, payload.sub);

    const user = await User.findById(payload.sub);
    if (!user) {
      const error = new Error('User not found');
      error.status = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('User is disabled');
      error.status = 403;
      throw error;
    }

    req.auth = {
      userId: String(user._id),
      sessionId: String(session._id),
      role: user.role,
    };
    req.session = session;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    const error = new Error('Admin privileges required');
    error.status = 403;
    throw error;
  }
  next();
}

module.exports = {
  authenticate,
  requireAdmin,
};
