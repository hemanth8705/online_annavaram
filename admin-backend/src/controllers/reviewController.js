import Review from '../models/Review.js';
import Product from '../models/Product.js';

/**
 * Review Management Controller (Phase 1)
 */

// Get all reviews with filters
export const getAllReviews = async (req, res) => {
  try {
    const {
      productId,
      rating,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter - exclude deleted reviews
    const filter = { isDeleted: false };

    if (productId) {
      filter.productId = productId;
    }

    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get reviews
    const reviews = await Review
      .find(filter)
      .populate('productId', 'name imageUrl')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
};

// Get single review by ID
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review
      .findOne({ _id: id, isDeleted: false })
      .populate('productId', 'name imageUrl categoryId');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching review'
    });
  }
};

// Get reviews for a specific product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Verify product exists
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const reviews = await Review
      .find({ productId, isDeleted: false })
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.name
        },
        reviews,
        stats: {
          totalReviews: reviews.length,
          averageRating: parseFloat(averageRating.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product reviews'
    });
  }
};

// Edit review (admin can edit text and rating)
export const editReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewText, rating } = req.body;

    const review = await Review.findOne({ _id: id, isDeleted: false });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Validate rating if provided
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      review.rating = rating;
    }

    // Update review text if provided
    if (reviewText !== undefined && reviewText.trim() !== '') {
      review.reviewText = reviewText.trim();
    }

    await review.save();
    await review.populate('productId', 'name imageUrl');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Edit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating review'
    });
  }
};

// Soft delete review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findOne({ _id: id, isDeleted: false });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Soft delete
    review.isDeleted = true;
    await review.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting review'
    });
  }
};

// Get review statistics
export const getReviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    const totalReviews = await Review.countDocuments({ isDeleted: false });

    const allReviews = await Review.find({ isDeleted: false });
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
      : 0;

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingDistribution: stats
      }
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching review statistics'
    });
  }
};
