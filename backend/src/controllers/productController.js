const mongoose = require('mongoose');

const { Product } = require('../models');

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 12, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

exports.listProducts = async (req, res) => {
  const { search, category, isActive } = req.query;
  const { limit, skip, page } = parsePagination(req.query);

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) {
    filter.category = category;
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const [items, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      totalItems: total,
    },
  });
};

exports.getProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid product ID');
    error.status = 400;
    throw error;
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  res.json({ success: true, data: product });
};

exports.createProduct = async (req, res) => {
  const payload = req.body;

  const product = await Product.create(payload);

  res.status(201).json({ success: true, data: product });
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid product ID');
    error.status = 400;
    throw error;
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  res.json({ success: true, data: product });
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid product ID');
    error.status = 400;
    throw error;
  }

  const product = await Product.findById(id);
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  await product.deleteOne();

  res.json({ success: true, message: 'Product deleted' });
};
