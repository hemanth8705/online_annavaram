/**
 * Database Migration Script
 * Consolidates data from separate collections into unified schema
 * 
 * Run this script ONCE to migrate existing data to the shared database structure
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateProducts() {
  console.log('🔄 Migrating products...');
  
  const adminProducts = await mongoose.connection.db.collection('adminproducts').find({}).toArray();
  const userProducts = await mongoose.connection.db.collection('products').find({}).toArray();
  
  console.log(`Found ${adminProducts.length} admin products and ${userProducts.length} user products`);
  
  // Create a unified products collection
  const productsToMigrate = [];
  const productMap = new Map();
  
  // Process admin products first (they are the source of truth)
  for (const product of adminProducts) {
    const unified = {
      _id: product._id,
      name: product.name,
      slug: product.slug || generateSlug(product.name),
      description: product.description || '',
      categoryId: product.categoryId,
      category: product.category || '',
      price: product.price,
      currency: product.currency || 'INR',
      stock: product.totalStock || product.stock || 0,
      totalStock: product.totalStock || product.stock || 0,
      maxUnitsPerUser: product.maxUnitsPerUser || 1,
      isUnlimitedPurchase: product.isUnlimitedPurchase || false,
      imageUrl: product.imageUrl || '',
      images: product.images || (product.imageUrl ? [product.imageUrl] : []),
      isActive: product.isActive !== undefined ? product.isActive : true,
      isDeleted: product.isDeleted || false,
      createdAt: product.createdAt || new Date(),
      updatedAt: product.updatedAt || new Date()
    };
    
    productsToMigrate.push(unified);
    productMap.set(product.name.toLowerCase(), unified._id);
  }
  
  // Check for user products that don't exist in admin products
  for (const product of userProducts) {
    const key = product.name.toLowerCase();
    if (!productMap.has(key)) {
      const unified = {
        _id: product._id,
        name: product.name,
        slug: product.slug || generateSlug(product.name),
        description: product.description || '',
        categoryId: null,
        category: product.category || '',
        price: product.price,
        currency: product.currency || 'INR',
        stock: product.stock || 0,
        totalStock: product.stock || 0,
        maxUnitsPerUser: 1,
        isUnlimitedPurchase: false,
        imageUrl: product.images && product.images[0] ? product.images[0] : '',
        images: product.images || [],
        isActive: product.isActive !== undefined ? product.isActive : true,
        isDeleted: false,
        createdAt: product.createdAt || new Date(),
        updatedAt: product.updatedAt || new Date()
      };
      
      productsToMigrate.push(unified);
    }
  }
  
  // Drop old collections and insert unified data
  try {
    await mongoose.connection.db.collection('products_backup').insertMany(
      userProducts.length > 0 ? userProducts : [{_backup: true, timestamp: new Date()}]
    );
    await mongoose.connection.db.collection('adminproducts_backup').insertMany(
      adminProducts.length > 0 ? adminProducts : [{_backup: true, timestamp: new Date()}]
    );
    
    // Clear products collection
    await mongoose.connection.db.collection('products').deleteMany({});
    
    // Insert unified products
    if (productsToMigrate.length > 0) {
      await mongoose.connection.db.collection('products').insertMany(productsToMigrate);
    }
    
    console.log(`✅ Migrated ${productsToMigrate.length} products successfully`);
  } catch (error) {
    console.error('❌ Error migrating products:', error);
    throw error;
  }
}

async function migrateOrders() {
  console.log('🔄 Migrating orders...');
  
  const orders = await mongoose.connection.db.collection('orders').find({}).toArray();
  console.log(`Found ${orders.length} orders`);
  
  // Update product references from AdminProduct to Product
  for (const order of orders) {
    const updates = {};
    
    // Sync userId and user
    if (order.userId && !order.user) {
      updates.user = order.userId;
    } else if (order.user && !order.userId) {
      updates.userId = order.user;
    }
    
    // Sync products array
    if (order.products && order.products.length > 0) {
      const updatedProducts = order.products.map(item => ({
        ...item,
        product: item.productId || item.product,
        productId: item.productId || item.product
      }));
      
      updates.products = updatedProducts;
      updates.items = updatedProducts;
    }
    
    // Add missing fields
    if (!order.currency) updates.currency = 'INR';
    if (!order.updatedAt) updates.updatedAt = order.createdAt || new Date();
    if (!order.statusHistory) {
      updates.statusHistory = [{
        status: order.status,
        timestamp: order.createdAt || new Date()
      }];
    }
    
    if (Object.keys(updates).length > 0) {
      await mongoose.connection.db.collection('orders').updateOne(
        { _id: order._id },
        { $set: updates }
      );
    }
  }
  
  console.log(`✅ Updated ${orders.length} orders successfully`);
}

async function migrateReviews() {
  console.log('🔄 Migrating reviews...');
  
  const reviews = await mongoose.connection.db.collection('reviews').find({}).toArray();
  console.log(`Found ${reviews.length} reviews`);
  
  for (const review of reviews) {
    const updates = {};
    
    // Sync userId and user
    if (review.userId && !review.user) {
      updates.user = review.userId;
    } else if (review.user && !review.userId) {
      updates.userId = review.user;
    }
    
    // Sync productId and product
    if (review.productId && !review.product) {
      updates.product = review.productId;
    } else if (review.product && !review.productId) {
      updates.productId = review.product;
    }
    
    // Sync reviewText and comment
    if (review.reviewText && !review.comment) {
      updates.comment = review.reviewText;
    } else if (review.comment && !review.reviewText) {
      updates.reviewText = review.comment;
    }
    
    // Add default values for new fields
    if (review.isApproved === undefined) updates.isApproved = true;
    if (review.isVerifiedPurchase === undefined) updates.isVerifiedPurchase = false;
    if (review.helpfulCount === undefined) updates.helpfulCount = 0;
    if (!review.updatedAt) updates.updatedAt = review.createdAt || new Date();
    
    if (Object.keys(updates).length > 0) {
      await mongoose.connection.db.collection('reviews').updateOne(
        { _id: review._id },
        { $set: updates }
      );
    }
  }
  
  console.log(`✅ Updated ${reviews.length} reviews successfully`);
}

async function migrateCategories() {
  console.log('🔄 Migrating categories...');
  
  const categories = await mongoose.connection.db.collection('categories').find({}).toArray();
  console.log(`Found ${categories.length} categories`);
  
  for (const category of categories) {
    const updates = {};
    
    // Add slug if missing
    if (!category.slug) {
      updates.slug = generateSlug(category.name);
    }
    
    // Add updatedAt if missing
    if (!category.updatedAt) {
      updates.updatedAt = category.createdAt || new Date();
    }
    
    if (Object.keys(updates).length > 0) {
      await mongoose.connection.db.collection('categories').updateOne(
        { _id: category._id },
        { $set: updates }
      );
    }
  }
  
  console.log(`✅ Updated ${categories.length} categories successfully`);
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('🚀 Starting database migration...\n');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    await migrateProducts();
    await migrateCategories();
    await migrateOrders();
    await migrateReviews();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nBackup collections created:');
    console.log('  - adminproducts_backup');
    console.log('  - products_backup');
    console.log('\nYou can safely delete these after verifying the migration.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration
main();
