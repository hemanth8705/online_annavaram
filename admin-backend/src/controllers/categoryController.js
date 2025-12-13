import Category from '../models/Category.js';
import Product from '../models/Product.js';

/**
 * Category Management Controller
 */

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name is required' 
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: name.trim() 
    });

    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category with this name already exists' 
      });
    }

    // Create category
    const category = new Category({
      name: name.trim()
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating category' 
    });
  }
};

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching categories' 
    });
  }
};

// Get active categories only
export const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get active categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching active categories' 
    });
  }
};

// Update category name
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name is required' 
      });
    }

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Check if new name already exists (excluding current category)
    const existingCategory = await Category.findOne({ 
      name: name.trim(),
      _id: { $ne: id }
    });

    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Another category with this name already exists' 
      });
    }

    // Update category
    category.name = name.trim();
    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating category' 
    });
  }
};

// Toggle category active status
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Toggle status
    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isActive ? 'enabled' : 'disabled'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while toggling category status' 
    });
  }
};

// Delete category (soft delete - actually just disable)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ 
      categoryId: id,
      isDeleted: false 
    });

    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category. It has ${productCount} product(s). Please remove or reassign products first.` 
      });
    }

    // Disable category instead of deleting
    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Category disabled successfully',
      data: category
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting category' 
    });
  }
};
