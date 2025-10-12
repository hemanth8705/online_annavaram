const mongoose = require('mongoose');

const { Schema } = mongoose;

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: 'IN', uppercase: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'pending',
        'paid',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending_payment',
      index: true,
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentIntentId: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
