import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalStock: {
    type: Number,
    required: true,
    min: 0
  },
  maxUnitsPerUser: {
    type: Number,
    required: true,
    min: 1
  },
  isUnlimitedPurchase: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-disable product when stock reaches 0
productSchema.pre('save', function(next) {
  if (this.totalStock === 0) {
    this.isActive = false;
  }
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('AdminProduct', productSchema);

export default Product;
