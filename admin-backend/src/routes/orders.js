import express from 'express';
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats
} from '../controllers/orderController.js';
import { authenticateAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All order routes require admin authentication
router.use(authenticateAdmin);

// Get order statistics
router.get('/stats', getOrderStats);

// Get all orders (with filters)
router.get('/', getAllOrders);

// Get single order
router.get('/:id', getOrderById);

// Update order status
router.patch('/:id/status', updateOrderStatus);

export default router;
