const mongoose = require('mongoose');

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    label: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: 'IN', uppercase: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
      index: true,
    },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    emailVerification: {
      type: new Schema(
        {
          otpHash: String,
          otpExpiresAt: Date,
          attempts: { type: Number, default: 0 },
          sentHistory: { type: [Date], default: [] },
        },
        { _id: false }
      ),
      default: () => ({ attempts: 0, sentHistory: [] }),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
