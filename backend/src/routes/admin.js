const express = require('express');

const orderController = require('../controllers/orderController');
const asyncHandler = require('../middlewares/asyncHandler');
const { authenticate, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/orders', asyncHandler(orderController.listAllOrders));

module.exports = router;
