import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import connectDB from '../config/db.js';

dotenv.config();

/**
 * Seed script to initialize the admin backend with sample data
 */

const seedData = async () => {
  try {
    console.log('Starting database seed...\n');

    // Connect to database
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('✓ Existing data cleared\n');

    // Create admin user
    console.log('Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@annavaram.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new Admin({
        email: adminEmail,
        password: adminPassword,
        role: 'super_admin'
      });
      await admin.save();
      console.log(`✓ Admin created: ${adminEmail}\n`);
    } else {
      console.log(`✓ Admin already exists: ${adminEmail}\n`);
    }

    // Create sample categories
    console.log('Creating categories...');
    const categories = [
      { name: 'Telugu Snacks', isActive: true },
      { name: 'Chocolates', isActive: true },
      { name: 'Traditional Sweets', isActive: true },
      { name: 'Dry Fruits', isActive: true }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`✓ Created ${createdCategories.length} categories\n`);

    // Create sample products
    console.log('Creating products...');
    const teluguSnacksCategory = createdCategories[0]._id;
    const chocolatesCategory = createdCategories[1]._id;

    const products = [
      {
        name: 'Mixture',
        categoryId: teluguSnacksCategory,
        price: 150,
        totalStock: 100,
        maxUnitsPerUser: 5,
        isUnlimitedPurchase: false,
        imageUrl: 'https://example.com/mixture.jpg',
        isActive: true
      },
      {
        name: 'Murukku',
        categoryId: teluguSnacksCategory,
        price: 120,
        totalStock: 80,
        maxUnitsPerUser: 5,
        isUnlimitedPurchase: false,
        imageUrl: 'https://example.com/murukku.jpg',
        isActive: true
      },
      {
        name: 'Kakinada Kaja',
        categoryId: teluguSnacksCategory,
        price: 200,
        totalStock: 50,
        maxUnitsPerUser: 3,
        isUnlimitedPurchase: false,
        imageUrl: 'https://example.com/kaja.jpg',
        isActive: true
      },
      {
        name: 'Milk Chocolate Bar',
        categoryId: chocolatesCategory,
        price: 50,
        totalStock: 200,
        maxUnitsPerUser: 10,
        isUnlimitedPurchase: false,
        imageUrl: 'https://example.com/chocolate.jpg',
        isActive: true
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✓ Created ${createdProducts.length} products\n`);

    console.log('═══════════════════════════════════════════════');
    console.log('  Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════');
    console.log('\nYou can now:');
    console.log(`1. Login with: ${adminEmail} / ${adminPassword}`);
    console.log('2. View categories and products via API');
    console.log('3. Start managing your e-commerce admin panel\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed
seedData();
