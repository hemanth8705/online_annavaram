import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
  updateProductStock
} from '../controllers/productController.js';
import { authenticateAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All product routes require admin authentication
router.use(authenticateAdmin);

// Create product
router.post('/', createProduct);

// Get all products (with filters)
router.get('/', getAllProducts);

// Get single product
router.get('/:id', getProductById);

// Update product
router.put('/:id', updateProduct);

// Update product stock
router.patch('/:id/stock', updateProductStock);

// Toggle product status
router.patch('/:id/toggle-status', toggleProductStatus);

// Delete product (soft delete)
router.delete('/:id', deleteProduct);

export default router;
