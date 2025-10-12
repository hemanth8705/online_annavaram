const express = require('express');

const orderController = require('../controllers/orderController');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticate } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validateRequest');

const router = express.Router();

const createOrderValidator = (req) => {
  const errors = {};
  const body = req.body || {};

  const shippingAddress = body.shippingAddress;
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    errors.shippingAddress = 'shippingAddress object is required';
  } else {
    const requiredFields = [
      'name',
      'line1',
      'city',
      'state',
      'postalCode',
      'country',
    ];
    requiredFields.forEach((field) => {
      if (!shippingAddress[field] || String(shippingAddress[field]).trim() === '') {
        errors[`shippingAddress.${field}`] = 'Field is required';
      }
    });
  }

  if (body.notes && typeof body.notes !== 'string') {
    errors.notes = 'Notes must be a string';
  }

  if (Object.keys(errors).length > 0) {
    return { error: errors };
  }

  return {
    value: {
      body: {
        shippingAddress: {
          ...shippingAddress,
          name: String(shippingAddress.name).trim(),
          line1: String(shippingAddress.line1).trim(),
          line2: shippingAddress.line2
            ? String(shippingAddress.line2).trim()
            : undefined,
          city: String(shippingAddress.city).trim(),
          state: String(shippingAddress.state).trim(),
          postalCode: String(shippingAddress.postalCode).trim(),
          country: String(shippingAddress.country).trim().toUpperCase(),
          phone: shippingAddress.phone
            ? String(shippingAddress.phone).trim()
            : undefined,
        },
        notes: body.notes ? String(body.notes).trim() : undefined,
      },
    },
  };
};

router.use(authenticate);

router.post(
  '/',
  validateRequest(createOrderValidator),
  asyncHandler(orderController.createOrder)
);

router.get('/', asyncHandler(orderController.listOrders));
router.get('/:id', asyncHandler(orderController.getOrder));

module.exports = router;
