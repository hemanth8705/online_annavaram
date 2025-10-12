const mongoose = require('mongoose');

const { CartItem, Product } = require('../models');
const {
  getOrCreateActiveCart,
  buildCartSnapshot,
} = require('../services/cartService');

exports.getCart = async (req, res) => {
  const cart = await getOrCreateActiveCart(req.user._id);
  const snapshot = await buildCartSnapshot(cart._id);

  res.json({
    success: true,
    data: {
      id: cart._id,
      status: cart.status,
      ...snapshot,
    },
  });
};

exports.addItem = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    const error = new Error('Invalid product ID');
    error.status = 400;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    const error = new Error('Product not available');
    error.status = 404;
    throw error;
  }

  if (product.stock < quantity) {
    const error = new Error('Insufficient stock for requested quantity');
    error.status = 400;
    throw error;
  }

  const cart = await getOrCreateActiveCart(req.user._id);

  const existingItem = await CartItem.findOne({
    cart: cart._id,
    product: product._id,
  });

  if (existingItem) {
    existingItem.quantity += quantity;
    if (existingItem.quantity <= 0) {
      await existingItem.deleteOne();
    } else {
      await existingItem.save();
    }
  } else {
    await CartItem.create({
      cart: cart._id,
      product: product._id,
      quantity,
      priceAtAddition: product.price,
    });
  }

  const snapshot = await buildCartSnapshot(cart._id);
  res.status(201).json({
    success: true,
    data: {
      id: cart._id,
      status: cart.status,
      ...snapshot,
    },
  });
};

exports.updateItem = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!mongoose.isValidObjectId(itemId)) {
    const error = new Error('Invalid cart item ID');
    error.status = 400;
    throw error;
  }

  const cart = await getOrCreateActiveCart(req.user._id);
  const item = await CartItem.findOne({ _id: itemId, cart: cart._id });
  if (!item) {
    const error = new Error('Cart item not found');
    error.status = 404;
    throw error;
  }

  if (quantity <= 0) {
    await item.deleteOne();
  } else {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      const error = new Error('Product not available');
      error.status = 400;
      throw error;
    }

    if (product.stock < quantity) {
      const error = new Error('Insufficient stock for requested quantity');
      error.status = 400;
      throw error;
    }

    item.quantity = quantity;
    await item.save();
  }

  const snapshot = await buildCartSnapshot(cart._id);
  res.json({
    success: true,
    data: {
      id: cart._id,
      status: cart.status,
      ...snapshot,
    },
  });
};

exports.removeItem = async (req, res) => {
  const { itemId } = req.params;

  if (!mongoose.isValidObjectId(itemId)) {
    const error = new Error('Invalid cart item ID');
    error.status = 400;
    throw error;
  }

  const cart = await getOrCreateActiveCart(req.user._id);
  await CartItem.deleteOne({ _id: itemId, cart: cart._id });

  const snapshot = await buildCartSnapshot(cart._id);
  res.json({
    success: true,
    data: {
      id: cart._id,
      status: cart.status,
      ...snapshot,
    },
  });
};
