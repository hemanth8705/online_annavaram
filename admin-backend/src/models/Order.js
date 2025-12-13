import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminProduct',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: [
      'order_created',
      'payment_confirmed',
      'dispatched',
      'reached_city',
      'out_for_delivery',
      'delivered'
    ],
    default: 'order_created'
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    notes: String
  }],
  shippingAddress: {
    name: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'IN' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add initial status to history on creation
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: this.createdAt
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
