import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * Order Management Controller (Phase 1)
 */

// Valid status flow
const STATUS_FLOW = [
  'order_created',
  'payment_confirmed',
  'dispatched',
  'reached_city',
  'out_for_delivery',
  'delivered'
];

// Get all orders with filters
export const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter - only show successful orders (payment confirmed and beyond)
    const filter = {
      status: { 
        $in: ['payment_confirmed', 'dispatched', 'reached_city', 'out_for_delivery', 'delivered'] 
      }
    };

    // Filter by specific status if provided
    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get orders
    const orders = await Order
      .find(filter)
      .populate('products.productId', 'name imageUrl')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order
      .findById(id)
      .populate('products.productId', 'name imageUrl categoryId')
      .populate('statusHistory.updatedBy', 'email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${STATUS_FLOW.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check logical flow
    const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
    const newStatusIndex = STATUS_FLOW.indexOf(status);

    // Allow manual correction but warn if going backwards
    if (newStatusIndex < currentStatusIndex) {
      console.warn(`Warning: Moving order ${id} backwards from ${order.status} to ${status}`);
    }

    // Update status
    order.status = status;

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.admin.id,
      notes: notes || `Status updated to ${status}`
    });

    await order.save();
    await order.populate('statusHistory.updatedBy', 'email');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $match: {
          status: { 
            $in: ['payment_confirmed', 'dispatched', 'reached_city', 'out_for_delivery', 'delivered'] 
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments({
      status: { 
        $in: ['payment_confirmed', 'dispatched', 'reached_city', 'out_for_delivery', 'delivered'] 
      }
    });

    const totalRevenue = await Order.aggregate([
      {
        $match: {
          status: { 
            $in: ['payment_confirmed', 'dispatched', 'reached_city', 'out_for_delivery', 'delivered'] 
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order statistics'
    });
  }
};
