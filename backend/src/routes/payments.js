const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticate } = require('../middlewares/auth');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.use(authenticate);

router.post(
  '/razorpay/verify',
  asyncHandler(paymentController.verifyRazorpayPayment)
);

module.exports = router;
