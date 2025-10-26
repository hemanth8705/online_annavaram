const mongoose = require('mongoose');
const { Order, Payment } = require('../models');
const paymentService = require('../services/paymentService');

exports.verifyRazorpayPayment = async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    const error = new Error('Incomplete payment verification payload.');
    error.status = 400;
    throw error;
  }

  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error('Invalid order identifier.');
    error.status = 400;
    throw error;
  }

  if (!paymentService.isConfigured()) {
    const error = new Error('Payment gateway is not configured.');
    error.status = 500;
    throw error;
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    const error = new Error('Order not found.');
    error.status = 404;
    throw error;
  }

  const existingPayment = await Payment.findOne({ order: order._id, gateway: 'razorpay' });
  if (existingPayment && existingPayment.status === 'captured') {
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'fullName email')
      .lean();

    res.json({
      success: true,
      data: { order: populatedOrder, payment: existingPayment },
    });
    return;
  }

  if (order.paymentIntentId && order.paymentIntentId !== razorpayOrderId) {
    const error = new Error('Payment order mismatch.');
    error.status = 400;
    throw error;
  }

  const signatureValid = paymentService.verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!signatureValid) {
    const error = new Error('Payment signature verification failed.');
    error.status = 400;
    throw error;
  }

  order.status = 'paid';
  order.paymentIntentId = razorpayOrderId;
  await order.save();

  let payment = await Payment.findOneAndUpdate(
    { order: order._id, gateway: 'razorpay' },
    {
      status: 'captured',
      transactionId: razorpayPaymentId,
      rawResponse: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
    },
    { new: true }
  );

  if (!payment) {
    payment = await Payment.create({
      order: order._id,
      gateway: 'razorpay',
      amount: order.totalAmount,
      currency: order.currency,
      status: 'captured',
      transactionId: razorpayPaymentId,
      rawResponse: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
    });
  }

  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'fullName email')
    .lean();

  res.json({
    success: true,
    data: {
      order: populatedOrder,
      payment,
    },
  });
};
