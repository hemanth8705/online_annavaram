const bcrypt = require('bcryptjs');

const { User } = require('../models');
const {
  createSession,
  rotateSession,
  revokeSession,
  revokeByRefreshToken,
  revokeAllUserSessions,
} = require('../services/sessionService');
const { assignOtp, verifyOtp, OTP_EXPIRY_MINUTES } = require('../services/otpService');
const { sendOtpEmail, sendPasswordResetEmail } = require('../services/mailer');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_SECURE =
  String(process.env.REFRESH_TOKEN_COOKIE_SECURE || 'false').toLowerCase() === 'true';

function getRefreshCookieOptions(expiresAt) {
  const isSecure = REFRESH_COOKIE_SECURE || process.env.NODE_ENV === 'production';
  const sameSite = isSecure ? 'none' : 'lax';
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    expires: expiresAt,
    path: '/api/auth',
  };
}

function serializeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions(expiresAt));
}

function clearRefreshCookie(res) {
  const options = getRefreshCookieOptions(new Date(0));
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}

function getClientMetadata(req) {
  return {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  };
}

function extractRefreshToken(req) {
  const candidates = [
    req.cookies && req.cookies[REFRESH_COOKIE_NAME],
    req.body && req.body.refreshToken,
    req.headers['x-refresh-token'],
  ].filter(Boolean);
  return candidates.length > 0 ? candidates[0] : null;
}

function buildAuthResponse({ user, accessToken, accessTokenExpiresAt, session }) {
  return {
    success: true,
    message: 'Authentication successful.',
    data: {
      accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      session: {
        id: session._id,
        expiresAt: session.expiresAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
      user: serializeUser(user),
    },
  };
}

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

  const { otp } = await assignOtp(user, 'emailVerification');
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

  const { otp } = await assignOtp(user, 'emailVerification');
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

  await verifyOtp(user, 'emailVerification', otp);
  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
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

  const metadata = getClientMetadata(req);
  const { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, session } =
    await createSession({
      user,
      ...metadata,
    });

  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
  res.json({
    ...buildAuthResponse({ user, accessToken, accessTokenExpiresAt, session }),
    message: 'Login successful.',
  });
}

async function refreshSessionHandler(req, res) {
  const refreshToken = extractRefreshToken(req);
  if (!refreshToken) {
    const error = new Error('Refresh token required.');
    error.status = 401;
    throw error;
  }

  const metadata = getClientMetadata(req);
  const {
    user,
    accessToken,
    accessTokenExpiresAt,
    refreshToken: nextRefreshToken,
    refreshTokenExpiresAt,
    session,
  } = await rotateSession({
    refreshToken,
    ...metadata,
  });

  setRefreshCookie(res, nextRefreshToken, refreshTokenExpiresAt);
  res.json({
    ...buildAuthResponse({ user, accessToken, accessTokenExpiresAt, session }),
    message: 'Session refreshed.',
  });
}

async function logout(req, res) {
  clearRefreshCookie(res);
  if (req.auth && req.auth.sessionId) {
    await revokeSession(req.auth.sessionId);
  } else {
    const refreshToken = extractRefreshToken(req);
    if (refreshToken) {
      await revokeByRefreshToken(refreshToken);
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

async function logoutAll(req, res) {
  clearRefreshCookie(res);
  await revokeAllUserSessions(req.user._id);
  res.json({
    success: true,
    message: 'All sessions revoked successfully.',
  });
}

async function requestPasswordReset(req, res) {
  const { email } = req.body;
  const normalisedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalisedEmail });

  if (!user) {
    const error = new Error('This email is not registered with us. Please sign up first.');
    error.status = 404;
    throw error;
  }

  if (!user.emailVerified) {
    const error = new Error(
      'This email is not verified yet. Please verify your account before resetting the password.'
    );
    error.status = 400;
    throw error;
  }

  const { otp } = await assignOtp(user, 'passwordReset');
  await user.save();
  await sendPasswordResetEmail({ to: user.email, otp, expiresMinutes: OTP_EXPIRY_MINUTES });

  res.json({
    success: true,
    message: 'If an account exists, a password reset code has been sent.',
  });
}

async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;
  const normalisedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalisedEmail });

  if (!user) {
    res.json({
      success: true,
      message: 'If an account exists, the password has been reset.',
    });
    return;
  }

  await verifyOtp(user, 'passwordReset', otp);
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await revokeAllUserSessions(user._id);

  res.json({
    success: true,
    message: 'Password updated successfully. You can now log in with your new password.',
  });
}

async function currentUser(req, res) {
  res.json({
    success: true,
    data: {
      user: serializeUser(req.user),
    },
  });
}

module.exports = {
  signup,
  resendOtp,
  verifyEmail,
  login,
  refreshSession: refreshSessionHandler,
  logout,
  logoutAll,
  requestPasswordReset,
  resetPassword,
  currentUser,
};
