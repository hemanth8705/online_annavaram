const express = require('express');

const cartController = require('../controllers/cartController');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticate } = require('../middlewares/auth');
const {
  validateRequest,
  buildBodyValidator,
} = require('../middlewares/validateRequest');

const router = express.Router();

const addItemValidator = buildBodyValidator({
  productId: { required: true, type: 'string', transform: (v) => String(v) },
  quantity: {
    required: true,
    transform: (v) => Number(v),
    validate: (value) =>
      Number.isInteger(value) && value > 0 ? null : 'Quantity must be > 0',
    type: 'number',
  },
});

const updateItemValidator = buildBodyValidator({
  quantity: {
    required: true,
    transform: (v) => Number(v),
    validate: (value) =>
      Number.isInteger(value) && value >= 0
        ? null
        : 'Quantity must be >= 0 (0 removes item)',
    type: 'number',
  },
});

router.use(authenticate);

router.get('/', asyncHandler(cartController.getCart));
router.post(
  '/items',
  validateRequest(addItemValidator),
  asyncHandler(cartController.addItem)
);
router.patch(
  '/items/:itemId',
  validateRequest(updateItemValidator),
  asyncHandler(cartController.updateItem)
);
router.delete('/items/:itemId', asyncHandler(cartController.removeItem));

module.exports = router;
