const nodemailer = require('nodemailer');

let transporterPromise;

function resolveTransporter() {
  if (!transporterPromise) {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT) {
      throw new Error('SMTP configuration is incomplete. Please set SMTP_HOST and SMTP_PORT.');
    }

    transporterPromise = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: SMTP_USER
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS,
          }
        : undefined,
    });
  }
  return transporterPromise;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = resolveTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error('SMTP_FROM or SMTP_USER must be configured');
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  console.log('[Mailer] message sent', { to, subject, messageId: info.messageId });
  return info;
}

async function sendOtpEmail({ to, otp, expiresMinutes = 10 }) {
  const subject = 'Your Online Annavaram verification code';
  const text = `Use the following verification code to complete your signup: ${otp}. It expires in ${expiresMinutes} minutes.`;
  const html = `<p>Namaste!</p>
  <p>Your verification code is <strong style="font-size:18px;">${otp}</strong>.</p>
  <p>The code will expire in ${expiresMinutes} minutes.</p>
  <p>If you didn't request this code, please ignore this email.</p>
  <p>&mdash; Online Annavaram</p>`;

  return sendMail({ to, subject, text, html });
}

async function sendPasswordResetEmail({ to, otp, expiresMinutes = 10 }) {
  const subject = 'Reset your Online Annavaram password';
  const text = `Use this code to reset your password: ${otp}. It expires in ${expiresMinutes} minutes.`;
  const html = `<p>Namaste!</p>
  <p>Your password reset code is <strong style="font-size:18px;">${otp}</strong>.</p>
  <p>The code will expire in ${expiresMinutes} minutes.</p>
  <p>If you didn't request a reset, you can safely ignore this message.</p>
  <p>&mdash; Online Annavaram</p>`;

  return sendMail({ to, subject, text, html });
}

module.exports = {
  sendMail,
  sendOtpEmail,
  sendPasswordResetEmail,
};
