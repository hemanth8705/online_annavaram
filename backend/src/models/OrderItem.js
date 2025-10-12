const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

orderItemSchema.pre('validate', function computeSubtotal(next) {
  if (this.unitPrice != null && this.quantity != null) {
    this.subtotal = Math.round(this.unitPrice * this.quantity);
  }
  next();
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
