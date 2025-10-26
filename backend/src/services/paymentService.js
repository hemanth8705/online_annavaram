const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayClient;

function isConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET);
}

function getClient() {
  if (!isConfigured()) {
    throw new Error('Razorpay credentials are not configured');
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
  }
  return razorpayClient;
}

async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes }) {
  const client = getClient();
  return client.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_SECRET;
  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return expectedSignature === signature;
}

module.exports = {
  isConfigured,
  getClient,
  createRazorpayOrder,
  verifyRazorpaySignature,
};
