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
    status: 'pending_payment',
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

  const payment = await Payment.create({
    order: order._id,
    gateway: 'manual',
    amount: totalAmount,
    currency: 'INR',
    status: 'initiated',
    transactionId: null,
    rawResponse: null,
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
