const bcrypt = require('bcryptjs');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_MAX_PER_DAY = Number(process.env.OTP_MAX_PER_DAY || 3);

function generateOtp() {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function purgeHistory(history = []) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return history.filter((timestamp) => new Date(timestamp).getTime() > cutoff);
}

async function assignOtpToUser(user) {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const history = purgeHistory(user.emailVerification?.sentHistory || []);
  if (history.length >= OTP_MAX_PER_DAY) {
    const error = new Error('OTP request limit reached. Try again later.');
    error.status = 429;
    throw error;
  }

  const updatedHistory = [...history, now];

  user.emailVerification = {
    otpHash,
    otpExpiresAt: expiresAt,
    attempts: 0,
    sentHistory: updatedHistory,
  };

  return { otp, expiresAt };
}

async function verifyUserOtp(user, otp) {
  if (!user.emailVerification?.otpHash) {
    const error = new Error('No OTP request found. Please request a new code.');
    error.status = 400;
    throw error;
  }

  const { otpHash, otpExpiresAt, attempts = 0 } = user.emailVerification;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    const error = new Error('Maximum OTP attempts exceeded. Request a new code.');
    error.status = 429;
    throw error;
  }

  if (!otpExpiresAt || new Date(otpExpiresAt).getTime() < Date.now()) {
    const error = new Error('OTP has expired. Request a new code.');
    error.status = 400;
    throw error;
  }

  const matches = await bcrypt.compare(otp, otpHash);
  if (!matches) {
    user.emailVerification.attempts = attempts + 1;
    await user.save();
    const error = new Error('Invalid OTP. Please try again.');
    error.status = 400;
    throw error;
  }

  // successful verification
  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerification = {
    otpHash: undefined,
    otpExpiresAt: undefined,
    attempts: 0,
    sentHistory: purgeHistory(user.emailVerification.sentHistory),
  };
}

module.exports = {
  assignOtpToUser,
  verifyUserOtp,
  OTP_EXPIRY_MINUTES,
};
