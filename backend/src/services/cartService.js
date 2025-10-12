const { Cart, CartItem, Product } = require('../models');

async function getOrCreateActiveCart(userId) {
  let cart = await Cart.findOne({ user: userId, status: 'active' });
  if (!cart) {
    cart = await Cart.create({ user: userId, status: 'active' });
  }
  return cart;
}

async function buildCartSnapshot(cartId) {
  const items = await CartItem.find({ cart: cartId })
    .populate('product')
    .lean();

  const formattedItems = items.map((item) => {
    const product = item.product || {};
    return {
      id: item._id,
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: item.priceAtAddition,
      subtotal: item.priceAtAddition * item.quantity,
      productSnapshot: {
        slug: product.slug,
        stock: product.stock,
        isActive: product.isActive,
        category: product.category,
        images: product.images,
      },
    };
  });

  const totals = formattedItems.reduce(
    (acc, item) => {
      acc.quantity += item.quantity;
      acc.amount += item.subtotal;
      return acc;
    },
    { quantity: 0, amount: 0 }
  );

  return {
    items: formattedItems,
    totals,
  };
}

async function clearCart(cartId) {
  await CartItem.deleteMany({ cart: cartId });
  await Cart.findByIdAndUpdate(cartId, { status: 'converted' });
}

async function verifyStockLevels(cartItems) {
  for (const item of cartItems) {
    const product = await Product.findById(item.productId || item.product);
    if (!product || !product.isActive) {
      const error = new Error('Product not available');
      error.status = 400;
      throw error;
    }

    if (product.stock < item.quantity) {
      const error = new Error(`Insufficient stock for ${product.name}`);
      error.status = 400;
      throw error;
    }
  }
}

module.exports = {
  getOrCreateActiveCart,
  buildCartSnapshot,
  clearCart,
  verifyStockLevels,
};
