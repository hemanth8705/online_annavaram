import express from 'express';
import { loginAdmin, getProfile } from '../controllers/authController.js';
import { authenticateAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/login', loginAdmin);

// Protected routes
router.get('/profile', authenticateAdmin, getProfile);

export default router;
