const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { assignOtpToUser, verifyUserOtp, OTP_EXPIRY_MINUTES } = require('../services/otpService');
const { sendOtpEmail } = require('../services/mailer');

async function signup(req, res) {
  const { fullName, email, password, phone } = req.body;
  const normalisedEmail = email.toLowerCase();

  const existing = await User.findOne({ email: normalisedEmail });
  if (existing) {
    const error = new Error('An account already exists with this email.');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: normalisedEmail,
    passwordHash,
    phone,
    emailVerified: false,
  });

  const { otp } = await assignOtpToUser(user);
  await user.save();
  await sendOtpEmail({ to: user.email, otp, expiresMinutes: OTP_EXPIRY_MINUTES });

  res.status(201).json({
    success: true,
    message: 'Signup successful. Please verify your email using the OTP sent to your inbox.',
  });
}

async function resendOtp(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const error = new Error('Account not found.');
    error.status = 404;
    throw error;
  }

  if (user.emailVerified) {
    res.json({ success: true, message: 'Email already verified.' });
    return;
  }

  const { otp } = await assignOtpToUser(user);
  await user.save();
  await sendOtpEmail({ to: user.email, otp, expiresMinutes: OTP_EXPIRY_MINUTES });

  res.json({
    success: true,
    message: 'A new OTP has been sent to your email address.',
  });
}

async function verifyEmail(req, res) {
  const { email, otp } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const error = new Error('Account not found.');
    error.status = 404;
    throw error;
  }

  await verifyUserOtp(user, otp);
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully.',
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  if (!user.emailVerified) {
    const error = new Error('Email not verified. Please verify before logging in.');
    error.status = 403;
    throw error;
  }

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    },
  });
}

module.exports = {
  signup,
  resendOtp,
  verifyEmail,
  login,
};
