import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Support both naming conventions for user reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Support both 'products' and 'items' naming
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
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
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantity: Number,
    unitPrice: Number,
    subtotal: Number
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  // Extended status enum to support both backends
  status: {
    type: String,
    enum: [
      'pending_payment',
      'pending',
      'paid',
      'order_created',
      'payment_confirmed',
      'dispatched',
      'shipped',
      'reached_city',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ],
    default: 'order_created',
    index: true
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
  // Support payment tracking from user backend
  paymentIntentId: {
    type: String,
    sparse: true
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Sync userId and user fields
orderSchema.pre('save', function(next) {
  // Sync user fields
  if (this.userId && !this.user) {
    this.user = this.userId;
  } else if (this.user && !this.userId) {
    this.userId = this.user;
  }
  
  // Sync product fields in items
  if (this.products && this.products.length > 0) {
    this.products.forEach(item => {
      if (item.productId && !item.product) {
        item.product = item.productId;
      } else if (item.product && !item.productId) {
        item.productId = item.product;
      }
    });
    
    // Sync to items array if empty
    if (!this.items || this.items.length === 0) {
      this.items = this.products;
    }
  } else if (this.items && this.items.length > 0 && (!this.products || this.products.length === 0)) {
    this.products = this.items;
  }
  
  // Add initial status to history on creation
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: this.createdAt
    });
  }
  
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model('Order', orderSchema, 'orders');

export default Order;
