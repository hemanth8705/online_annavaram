const mongoose = require('mongoose');

const {
  CartItem,
  Order,
  OrderItem,
  Payment,
  Product,
} = require('../models');
const {
  getOrCreateActiveCart,
  buildCartSnapshot,
  clearCart,
  verifyStockLevels,
} = require('../services/cartService');
const paymentService = require('../services/paymentService');

exports.createOrder = async (req, res) => {
  const { shippingAddress, notes } = req.body;

  const cart = await getOrCreateActiveCart(req.user._id);
  const snapshot = await buildCartSnapshot(cart._id);

  if (!snapshot.items.length) {
    const error = new Error('Cart is empty');
    error.status = 400;
    throw error;
  }

  await verifyStockLevels(snapshot.items);

  const totalAmount = snapshot.totals.amount;
  const order = await Order.create({
    user: req.user._id,
    cart: cart._id,
    totalAmount,
    currency: 'INR',
    status: paymentService.isConfigured() ? 'pending_payment' : 'paid',
    shippingAddress,
    paymentIntentId: null,
    notes,
  });

  const orderItemsData = snapshot.items.map((item) => ({
    order: order._id,
    product: item.productId,
    productName: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));

  await OrderItem.insertMany(orderItemsData);

  for (const item of snapshot.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity },
    });
  }

  let razorpayOrder = null;

  if (paymentService.isConfigured()) {
    try {
      razorpayOrder = await paymentService.createRazorpayOrder({
        amount: totalAmount,
        currency: 'INR',
        receipt: order._id.toString(),
        notes: {
          userId: req.user._id.toString(),
        },
      });
      order.paymentIntentId = razorpayOrder.id;
      await order.save();
    } catch (err) {
      console.error('Failed to create Razorpay order', err);
      await Order.deleteOne({ _id: order._id });
      await OrderItem.deleteMany({ order: order._id });
      const error = new Error('Unable to initiate payment. Please try again later.');
      error.status = 502;
      throw error;
    }
  }

  const payment = await Payment.create({
    order: order._id,
    gateway: paymentService.isConfigured() ? 'razorpay' : 'manual',
    amount: totalAmount,
    currency: 'INR',
    status: paymentService.isConfigured() ? 'initiated' : 'captured',
    transactionId: paymentService.isConfigured() ? null : 'offline',
    rawResponse: razorpayOrder,
  });

  await clearCart(cart._id);

  const populated = await Order.findById(order._id)
    .populate('user', 'fullName email')
    .lean();

  res.status(201).json({
    success: true,
    data: {
      order: populated,
      items: orderItemsData,
      payment,
      razorpay: razorpayOrder
        ? {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            name: 'Online Annavaram',
            description: `Temple pantry order ${populated._id}`,
          }
        : null,
    },
  });
};

exports.listOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: orders });
};

exports.getOrder = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid order ID');
    error.status = 400;
    throw error;
  }

  const order = await Order.findOne({ _id: id, user: req.user._id })
    .populate('user', 'fullName email')
    .lean();

  if (!order) {
    const error = new Error('Order not found');
    error.status = 404;
    throw error;
  }

  const items = await OrderItem.find({ order: order._id }).lean();

  res.json({ success: true, data: { order, items } });
};

exports.listAllOrders = async (_req, res) => {
  const orders = await Order.find()
    .populate('user', 'fullName email role')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: orders });
};
