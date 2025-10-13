const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../middlewares/asyncHandler');
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

module.exports = router;
