const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticate } = require('../middlewares/auth');
const { validateRequest, buildBodyValidator } = require('../middlewares/validateRequest');

const router = express.Router();

const emailValidator = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email format';

const signupValidator = buildBodyValidator({
  fullName: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim(),
  },
  email: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim().toLowerCase(),
    validate: emailValidator,
  },
  password: {
    required: true,
    type: 'string',
    transform: (v) => String(v),
    validate: (value) =>
      value.length >= 8 ? null : 'Password must be at least 8 characters',
  },
  phone: {
    required: false,
    type: 'string',
    transform: (v) => String(v).trim(),
  },
});

const loginValidator = buildBodyValidator({
  email: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim().toLowerCase(),
    validate: emailValidator,
  },
  password: {
    required: true,
    type: 'string',
    transform: (v) => String(v),
  },
});

const otpValidator = buildBodyValidator({
  email: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim().toLowerCase(),
    validate: emailValidator,
  },
  otp: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim(),
  },
});

const resendValidator = buildBodyValidator({
  email: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim().toLowerCase(),
    validate: emailValidator,
  },
});

const resetValidator = buildBodyValidator({
  email: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim().toLowerCase(),
    validate: emailValidator,
  },
  otp: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim(),
  },
  newPassword: {
    required: true,
    type: 'string',
    transform: (v) => String(v),
    validate: (value) =>
      value.length >= 8 ? null : 'Password must be at least 8 characters',
  },
});

router.post(
  '/signup',
  validateRequest(signupValidator),
  asyncHandler(authController.signup)
);

router.post(
  '/login',
  validateRequest(loginValidator),
  asyncHandler(authController.login)
);

router.post('/refresh', asyncHandler(authController.refreshSession));

router.post(
  '/verify-email',
  validateRequest(otpValidator),
  asyncHandler(authController.verifyEmail)
);

router.post(
  '/resend-otp',
  validateRequest(resendValidator),
  asyncHandler(authController.resendOtp)
);

router.post(
  '/forgot-password',
  validateRequest(resendValidator),
  asyncHandler(authController.requestPasswordReset)
);

router.post(
  '/reset-password',
  validateRequest(resetValidator),
  asyncHandler(authController.resetPassword)
);

router.post('/logout', authenticate, asyncHandler(authController.logout));
router.post('/logout-all', authenticate, asyncHandler(authController.logoutAll));
router.get('/me', authenticate, asyncHandler(authController.currentUser));

module.exports = router;
