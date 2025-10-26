const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_MAX_PER_DAY = Number(process.env.OTP_MAX_PER_DAY || 3);

const SUPPORTED_BUCKETS = ['emailVerification', 'passwordReset'];

function ensureBucket(user, bucketKey) {
  if (!SUPPORTED_BUCKETS.includes(bucketKey)) {
    throw new Error(`Unsupported OTP bucket: ${bucketKey}`);
  }
  if (!user[bucketKey] || mongoose.isObjectIdOrHexString(user[bucketKey])) {
    user[bucketKey] = { attempts: 0, sentHistory: [] };
  } else {
    user[bucketKey].attempts = user[bucketKey].attempts || 0;
    user[bucketKey].sentHistory = user[bucketKey].sentHistory || [];
  }
  return user[bucketKey];
}

function generateOtp() {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function purgeHistory(history = []) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return history.filter((timestamp) => new Date(timestamp).getTime() > cutoff);
}

async function assignOtp(user, bucketKey = 'emailVerification') {
  const bucket = ensureBucket(user, bucketKey);

  const history = purgeHistory(bucket.sentHistory);
  if (history.length >= OTP_MAX_PER_DAY) {
    const error = new Error('OTP request limit reached. Try again later.');
    error.status = 429;
    throw error;
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  bucket.otpHash = otpHash;
  bucket.otpExpiresAt = expiresAt;
  bucket.attempts = 0;
  bucket.sentHistory = [...history, now];

  return { otp, expiresAt };
}

async function verifyOtp(user, bucketKey, otp) {
  const bucket = ensureBucket(user, bucketKey);

  if (!bucket.otpHash) {
    const error = new Error('No OTP request found. Please request a new code.');
    error.status = 400;
    throw error;
  }

  if (bucket.attempts >= OTP_MAX_ATTEMPTS) {
    const error = new Error(
      'Maximum OTP attempts exceeded. Request a new code.'
    );
    error.status = 429;
    throw error;
  }

  if (!bucket.otpExpiresAt || new Date(bucket.otpExpiresAt).getTime() < Date.now()) {
    const error = new Error('OTP has expired. Request a new code.');
    error.status = 400;
    throw error;
  }

  const matches = await bcrypt.compare(otp, bucket.otpHash);
  if (!matches) {
    bucket.attempts += 1;
    await user.save();
    const error = new Error('Invalid OTP. Please try again.');
    error.status = 400;
    throw error;
  }

  bucket.otpHash = undefined;
  bucket.otpExpiresAt = undefined;
  bucket.attempts = 0;
  bucket.sentHistory = purgeHistory(bucket.sentHistory);

  return true;
}

module.exports = {
  assignOtp,
  verifyOtp,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_PER_DAY,
};
