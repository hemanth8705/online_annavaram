const express = require('express');

const productController = require('../controllers/productController');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  validateRequest,
  buildBodyValidator,
} = require('../middlewares/validateRequest');

const router = express.Router();

const createProductValidator = buildBodyValidator({
  name: { required: true, type: 'string', transform: (v) => String(v).trim() },
  slug: {
    required: true,
    type: 'string',
    transform: (v) => String(v).trim().toLowerCase(),
  },
  description: {
    required: false,
    type: 'string',
    transform: (v) => String(v).trim(),
  },
  price: {
    required: true,
    transform: (v) => Number(v),
    validate: (value) => (value >= 0 ? null : 'Must be a positive number'),
    type: 'number',
  },
  currency: {
    required: false,
    type: 'string',
    transform: (v) => String(v).trim().toUpperCase(),
  },
  stock: {
    required: true,
    transform: (v) => Number(v),
    validate: (value) =>
      Number.isInteger(value) && value >= 0 ? null : 'Stock must be >= 0',
    type: 'number',
  },
  category: {
    required: false,
    type: 'string',
    transform: (v) => String(v).trim(),
  },
  images: {
    required: false,
    validate: (value) =>
      Array.isArray(value) || typeof value === 'string'
        ? null
        : 'Images must be an array of URLs',
    transform: (v) => {
      if (Array.isArray(v)) {
        return v.map((item) => String(item).trim()).filter(Boolean);
      }
      if (typeof v === 'string') {
        return [v.trim()].filter(Boolean);
      }
      return [];
    },
  },
  isActive: {
    required: false,
    transform: (v) => {
      if (typeof v === 'boolean') {
        return v;
      }
      const normalized = String(v).toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
      return Boolean(v);
    },
    type: 'boolean',
  },
});

const updateProductValidator = buildBodyValidator({
  name: { required: false, type: 'string', transform: (v) => String(v).trim() },
  slug: {
    required: false,
    type: 'string',
    transform: (v) => String(v).trim().toLowerCase(),
  },
  description: {
    required: false,
    type: 'string',
    transform: (v) => String(v).trim(),
  },
  price: {
    required: false,
    transform: (v) => Number(v),
    validate: (value) => (value >= 0 ? null : 'Must be a positive number'),
    type: 'number',
  },
  currency: {
    required: false,
    type: 'string',
    transform: (v) => String(v).trim().toUpperCase(),
  },
  stock: {
    required: false,
    transform: (v) => Number(v),
    validate: (value) =>
      Number.isInteger(value) && value >= 0 ? null : 'Stock must be >= 0',
    type: 'number',
  },
  category: {
    required: false,
    type: 'string',
    transform: (v) => String(v).trim(),
  },
  images: {
    required: false,
    validate: (value) =>
      Array.isArray(value) || typeof value === 'string'
        ? null
        : 'Images must be an array of URLs',
    transform: (v) => {
      if (Array.isArray(v)) {
        return v.map((item) => String(item).trim()).filter(Boolean);
      }
      if (typeof v === 'string') {
        return [v.trim()].filter(Boolean);
      }
      return [];
    },
  },
  isActive: {
    required: false,
    transform: (v) => {
      if (typeof v === 'boolean') {
        return v;
      }
      const normalized = String(v).toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
      return Boolean(v);
    },
    type: 'boolean',
  },
});

router.get('/', asyncHandler(productController.listProducts));
router.get('/:id', asyncHandler(productController.getProduct));

router.post(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(createProductValidator),
  asyncHandler(productController.createProduct)
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(updateProductValidator),
  asyncHandler(productController.updateProduct)
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(productController.deleteProduct)
);

module.exports = router;
