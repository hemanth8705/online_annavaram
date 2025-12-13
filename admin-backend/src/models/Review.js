import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // Support both naming conventions
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
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  reviewText: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
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

// Create compound index for unique review per user per product
reviewSchema.index({ productId: 1, userId: 1 });
reviewSchema.index({ product: 1, user: 1 });

// Sync field names for compatibility
reviewSchema.pre('save', function(next) {
  // Sync user fields
  if (this.userId && !this.user) {
    this.user = this.userId;
  } else if (this.user && !this.userId) {
    this.userId = this.user;
  }
  
  // Sync product fields
  if (this.productId && !this.product) {
    this.product = this.productId;
  } else if (this.product && !this.productId) {
    this.productId = this.product;
  }
  
  // Sync comment and reviewText
  if (this.reviewText && !this.comment) {
    this.comment = this.reviewText;
  } else if (this.comment && !this.reviewText) {
    this.reviewText = this.comment;
  }
  
  this.updatedAt = Date.now();
  next();
});

const Review = mongoose.model('Review', reviewSchema, 'reviews');

export default Review;
