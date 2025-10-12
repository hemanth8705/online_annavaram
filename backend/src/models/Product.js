const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, trim: true },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
