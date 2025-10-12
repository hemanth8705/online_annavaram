const mongoose = require('mongoose');

const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    cart: {
      type: Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceAtAddition: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

cartItemSchema.index({ cart: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema);
