import Product from '../models/Product.js';
import Category from '../models/Category.js';

/**
 * Product Management Controller
 */

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      categoryId, 
      price, 
      totalStock, 
      isUnlimitedPurchase, 
      maxUnitsPerUser, 
      imageUrl 
    } = req.body;

    // Validate required fields
    if (!name || !categoryId || !price || totalStock === undefined || !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided (name, categoryId, price, totalStock, imageUrl)' 
      });
    }

    // Validate price
    if (price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price must be greater than 0' 
      });
    }

    // Validate stock
    if (totalStock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock cannot be negative' 
      });
    }

    // Check if category exists and is active
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    if (!category.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot add products to an inactive category' 
      });
    }

    // Determine maxUnitsPerUser based on unlimited purchase flag
    let finalMaxUnits;
    if (isUnlimitedPurchase) {
      finalMaxUnits = totalStock;
    } else {
      finalMaxUnits = maxUnitsPerUser || 1;
    }

    // Create product
    const product = new Product({
      name: name.trim(),
      categoryId,
      price,
      totalStock,
      maxUnitsPerUser: finalMaxUnits,
      isUnlimitedPurchase: isUnlimitedPurchase || false,
      imageUrl: imageUrl.trim(),
      isActive: totalStock > 0
    });

    await product.save();

    // Populate category info
    await product.populate('categoryId', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating product' 
    });
  }
};

// Get all products (with filters and pagination)
export const getAllProducts = async (req, res) => {
  try {
    const { 
      search, 
      categoryId, 
      isActive, 
      sortBy = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = { isDeleted: false };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get products
    const products = await Product
      .find(filter)
      .populate('categoryId', 'name isActive')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching products' 
    });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product
      .findOne({ _id: id, isDeleted: false })
      .populate('categoryId', 'name isActive');

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching product' 
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      categoryId, 
      price, 
      totalStock, 
      maxUnitsPerUser,
      isUnlimitedPurchase,
      imageUrl,
      isActive
    } = req.body;

    // Find product
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Validate price if provided
    if (price !== undefined && price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price must be greater than 0' 
      });
    }

    // Validate stock if provided
    if (totalStock !== undefined && totalStock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock cannot be negative' 
      });
    }

    // If category is being changed, validate it
    if (categoryId && categoryId !== product.categoryId.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }
      if (!category.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot move product to an inactive category' 
        });
      }
      product.categoryId = categoryId;
    }

    // Update fields if provided
    if (name) product.name = name.trim();
    if (price !== undefined) product.price = price;
    if (totalStock !== undefined) {
      product.totalStock = totalStock;
      // Auto-disable if stock is 0
      if (totalStock === 0) {
        product.isActive = false;
      }
    }
    if (imageUrl) product.imageUrl = imageUrl.trim();
    if (isActive !== undefined && product.totalStock > 0) {
      product.isActive = isActive;
    }

    // Handle unlimited purchase logic
    if (isUnlimitedPurchase !== undefined) {
      product.isUnlimitedPurchase = isUnlimitedPurchase;
      if (isUnlimitedPurchase) {
        product.maxUnitsPerUser = product.totalStock;
      } else if (maxUnitsPerUser !== undefined) {
        product.maxUnitsPerUser = maxUnitsPerUser;
      }
    } else if (maxUnitsPerUser !== undefined) {
      product.maxUnitsPerUser = maxUnitsPerUser;
    }

    await product.save();
    await product.populate('categoryId', 'name isActive');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating product' 
    });
  }
};

// Toggle product active status
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Cannot enable product with 0 stock
    if (!product.isActive && product.totalStock === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot enable product with zero stock. Please add stock first.' 
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'enabled' : 'disabled'} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while toggling product status' 
    });
  }
};

// Soft delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Note: In a real system, we should check if product exists in any orders
    // For now, we'll allow soft deletion
    
    product.isDeleted = true;
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting product' 
    });
  }
};

// Update product stock
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid stock value is required (must be >= 0)' 
      });
    }

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    product.totalStock = stock;
    
    // Auto-disable if stock becomes 0
    if (stock === 0) {
      product.isActive = false;
    }

    // Update max units if unlimited purchase
    if (product.isUnlimitedPurchase) {
      product.maxUnitsPerUser = stock;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product stock updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating stock' 
    });
  }
};
