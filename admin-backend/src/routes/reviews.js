import express from 'express';
import {
  getAllReviews,
  getReviewById,
  getProductReviews,
  editReview,
  deleteReview,
  getReviewStats
} from '../controllers/reviewController.js';
import { authenticateAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All review routes require admin authentication
router.use(authenticateAdmin);

// Get review statistics
router.get('/stats', getReviewStats);

// Get all reviews (with filters)
router.get('/', getAllReviews);

// Get reviews for a specific product
router.get('/product/:productId', getProductReviews);

// Get single review
router.get('/:id', getReviewById);

// Edit review
router.put('/:id', editReview);

// Delete review (soft delete)
router.delete('/:id', deleteReview);

export default router;
