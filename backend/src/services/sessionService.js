const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Session, User } = require('../models');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

function ensureSecret(secret, name) {
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }
}

function parseDurationToMs(value, fallback) {
  if (!value && fallback) {
    return fallback;
  }

  if (typeof value === 'number') {
    return value * 1000;
  }

  const match = /^(\d+)\s*([smhd])$/i.exec(String(value || '').trim());
  if (!match) {
    if (fallback) {
      return fallback;
    }
    throw new Error(`Invalid duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMultiplier = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit];

  return amount * unitMultiplier;
}

const ACCESS_EXPIRY_MS = parseDurationToMs(ACCESS_EXPIRY, 15 * 60 * 1000);
const REFRESH_EXPIRY_MS = parseDurationToMs(REFRESH_EXPIRY, 7 * 24 * 60 * 60 * 1000);

function hashToken(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateRefreshToken() {
  ensureSecret(REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  const random = crypto.randomBytes(64).toString('hex');
  const signature = crypto.createHmac('sha256', REFRESH_SECRET).update(random).digest('hex');
  return `${random}.${signature}`;
}

function signAccessToken({ userId, sessionId, role }) {
  ensureSecret(ACCESS_SECRET, 'JWT_ACCESS_SECRET');
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + Math.floor(ACCESS_EXPIRY_MS / 1000);

  const token = jwt.sign(
    {
      sub: userId,
      sid: sessionId,
      role,
      iat: issuedAt,
      exp: expiresAtSeconds,
    },
    ACCESS_SECRET
  );

  return {
    token,
    expiresAt: new Date(expiresAtSeconds * 1000),
  };
}

function verifyAccessToken(token) {
  ensureSecret(ACCESS_SECRET, 'JWT_ACCESS_SECRET');
  return jwt.verify(token, ACCESS_SECRET);
}

function extractRefreshComponents(candidate) {
  const parts = String(candidate || '').split('.');
  if (parts.length !== 2) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }
  const [random, signature] = parts;
  ensureSecret(REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  const expectedSignature = crypto.createHmac('sha256', REFRESH_SECRET).update(random).digest('hex');
  const providedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }
  return { random, signature };
}

async function createSession({ user, userAgent, ipAddress, metadata }) {
  const refreshToken = generateRefreshToken();
  const { random } = extractRefreshComponents(refreshToken);
  const refreshTokenHash = hashToken(random);
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

  const session = await Session.create({
    user: user._id,
    refreshTokenHash,
    expiresAt: refreshTokenExpiresAt,
    userAgent,
    ipAddress,
    metadata,
  });

  const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken({
    userId: String(user._id),
    sessionId: String(session._id),
    role: user.role,
  });

  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
    session,
  };
}

async function validateSession(sessionId, userId) {
  const session = await Session.findOne({ _id: sessionId, user: userId });
  if (!session) {
    const error = new Error('Session not found');
    error.status = 401;
    throw error;
  }

  if (session.revokedAt) {
    const error = new Error('Session revoked');
    error.status = 401;
    throw error;
  }

  if (session.expiresAt < new Date()) {
    const error = new Error('Session expired');
    error.status = 401;
    throw error;
  }

  return session;
}

async function rotateSession({ refreshToken, userAgent, ipAddress }) {
  ensureSecret(REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  const { random } = extractRefreshComponents(refreshToken);
  const refreshTokenHash = hashToken(random);

  const session = await Session.findOne({ refreshTokenHash });
  if (!session) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }

  if (session.expiresAt < new Date()) {
    const error = new Error('Session expired');
    error.status = 401;
    throw error;
  }

  if (session.revokedAt) {
    const error = new Error('Session revoked');
    error.status = 401;
    throw error;
  }

  const user = await User.findById(session.user);
  if (!user || !user.isActive) {
    const error = new Error('User account unavailable');
    error.status = 401;
    throw error;
  }

  const nextRefreshToken = generateRefreshToken();
  const { random: nextRandom } = extractRefreshComponents(nextRefreshToken);
  session.refreshTokenHash = hashToken(nextRandom);
  session.expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);
  session.userAgent = userAgent;
  session.ipAddress = ipAddress;
  session.revokedAt = null;
  await session.save();

  const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken({
    userId: String(user._id),
    sessionId: String(session._id),
    role: user.role,
  });

  return {
    session,
    user,
    accessToken,
    accessTokenExpiresAt,
    refreshToken: nextRefreshToken,
    refreshTokenExpiresAt: session.expiresAt,
  };
}

async function revokeSession(sessionId) {
  await Session.updateOne(
    { _id: sessionId },
    { $set: { revokedAt: new Date() } }
  );
}

async function revokeByRefreshToken(refreshToken) {
  try {
    const { random } = extractRefreshComponents(refreshToken);
    await Session.updateOne(
      { refreshTokenHash: hashToken(random) },
      { $set: { revokedAt: new Date() } }
    );
  } catch (_err) {
    // Ignore invalid refresh tokens on logout to avoid leaking info
  }
}

async function revokeAllUserSessions(userId) {
  await Session.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

module.exports = {
  createSession,
  validateSession,
  rotateSession,
  revokeSession,
  revokeByRefreshToken,
  revokeAllUserSessions,
  verifyAccessToken,
};
