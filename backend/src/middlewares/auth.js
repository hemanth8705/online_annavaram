const mongoose = require('mongoose');

const { User } = require('../models');

async function authenticate(req, _res, next) {
  try {
    const userId =
      req.headers['x-user-id'] ||
      (req.user && req.user.id) ||
      (req.auth && req.auth.id);

    if (!userId) {
      const error = new Error('Authentication required');
      error.status = 401;
      throw error;
    }

    if (!mongoose.isValidObjectId(userId)) {
      const error = new Error('Invalid user identifier');
      error.status = 400;
      throw error;
    }

    const user = await User.findById(userId);
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
