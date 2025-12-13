import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  category: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  // Support both naming conventions for stock
  totalStock: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
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
  // Support both image formats
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  images: {
    type: [String],
    default: function() {
      return this.imageUrl ? [this.imageUrl] : [];
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
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

// Virtual field to sync totalStock with stock
productSchema.virtual('stockValue').get(function() {
  return this.stock !== undefined ? this.stock : this.totalStock;
});

// Auto-generate slug from name if not provided
productSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Sync stock fields
  if (this.stock === undefined) {
    this.stock = this.totalStock;
  } else if (this.isModified('stock')) {
    this.totalStock = this.stock;
  } else if (this.isModified('totalStock')) {
    this.stock = this.totalStock;
  }
  
  // Sync category name if categoryId is populated
  if (this.populated('categoryId') && this.categoryId.name) {
    this.category = this.categoryId.name;
  }
  
  // Auto-disable product when stock reaches 0
  if (this.totalStock === 0 || this.stock === 0) {
    this.isActive = false;
  }
  
  // Ensure images array includes imageUrl
  if (this.imageUrl && (!this.images || this.images.length === 0)) {
    this.images = [this.imageUrl];
  }
  
  this.updatedAt = Date.now();
  next();
});

// Use 'products' collection name to match Python backend
const Product = mongoose.model('Product', productSchema, 'products');

export default Product;
