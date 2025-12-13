import express from 'express';
import {
  createCategory,
  getAllCategories,
  getActiveCategories,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
} from '../controllers/categoryController.js';
import { authenticateAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All category routes require admin authentication
router.use(authenticateAdmin);

// Create category
router.post('/', createCategory);

// Get all categories
router.get('/', getAllCategories);

// Get active categories only
router.get('/active', getActiveCategories);

// Update category
router.put('/:id', updateCategory);

// Toggle category status
router.patch('/:id/toggle-status', toggleCategoryStatus);

// Delete category
router.delete('/:id', deleteCategory);

export default router;
