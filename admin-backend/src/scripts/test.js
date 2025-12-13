import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

/**
 * Test script to verify API endpoints
 */

const BASE_URL = `http://localhost:${process.env.PORT || 5001}/api`;
let authToken = '';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const testEndpoint = async (method, endpoint, data = null, useAuth = false) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (useAuth && authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    log(`✓ ${method.toUpperCase()} ${endpoint} - Success`, 'green');
    return response.data;
  } catch (error) {
    log(`✗ ${method.toUpperCase()} ${endpoint} - Failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
};

const runTests = async () => {
  log('\n═══════════════════════════════════════════════', 'blue');
  log('  Admin Backend API Test Suite', 'blue');
  log('═══════════════════════════════════════════════\n', 'blue');

  // Test 1: Health Check
  log('\n[1] Testing Health Check...', 'yellow');
  await testEndpoint('get', '/health', null, false);

  // Test 2: Login
  log('\n[2] Testing Admin Login...', 'yellow');
  const loginResponse = await testEndpoint('post', '/auth/login', {
    email: process.env.ADMIN_EMAIL || 'admin@annavaram.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123'
  }, false);

  if (loginResponse && loginResponse.data) {
    authToken = loginResponse.data.token;
    log('  Token received and saved for subsequent requests', 'green');
  } else {
    log('  Failed to get auth token. Remaining tests will fail.', 'red');
    return;
  }

  // Test 3: Get Profile
  log('\n[3] Testing Get Profile...', 'yellow');
  await testEndpoint('get', '/auth/profile', null, true);

  // Test 4: Get Categories
  log('\n[4] Testing Get Categories...', 'yellow');
  const categoriesResponse = await testEndpoint('get', '/categories', null, true);
  
  let categoryId = null;
  if (categoriesResponse && categoriesResponse.data && categoriesResponse.data.length > 0) {
    categoryId = categoriesResponse.data[0]._id;
    log(`  Found ${categoriesResponse.data.length} categories`, 'green');
  }

  // Test 5: Create Category
  log('\n[5] Testing Create Category...', 'yellow');
  const newCategory = await testEndpoint('post', '/categories', {
    name: `Test Category ${Date.now()}`
  }, true);

  // Test 6: Get Products
  log('\n[6] Testing Get Products...', 'yellow');
  const productsResponse = await testEndpoint('get', '/products', null, true);
  
  let productId = null;
  if (productsResponse && productsResponse.data && productsResponse.data.length > 0) {
    productId = productsResponse.data[0]._id;
    log(`  Found ${productsResponse.data.length} products`, 'green');
  }

  // Test 7: Create Product
  if (categoryId) {
    log('\n[7] Testing Create Product...', 'yellow');
    await testEndpoint('post', '/products', {
      name: `Test Product ${Date.now()}`,
      categoryId: categoryId,
      price: 100,
      totalStock: 50,
      isUnlimitedPurchase: false,
      maxUnitsPerUser: 5,
      imageUrl: 'https://example.com/test-product.jpg'
    }, true);
  }

  // Test 8: Get Orders
  log('\n[8] Testing Get Orders...', 'yellow');
  await testEndpoint('get', '/orders', null, true);

  // Test 9: Get Order Stats
  log('\n[9] Testing Get Order Statistics...', 'yellow');
  await testEndpoint('get', '/orders/stats', null, true);

  // Test 10: Get Reviews
  log('\n[10] Testing Get Reviews...', 'yellow');
  await testEndpoint('get', '/reviews', null, true);

  // Test 11: Get Review Stats
  log('\n[11] Testing Get Review Statistics...', 'yellow');
  await testEndpoint('get', '/reviews/stats', null, true);

  log('\n═══════════════════════════════════════════════', 'blue');
  log('  Test Suite Completed', 'blue');
  log('═══════════════════════════════════════════════\n', 'blue');

  process.exit(0);
};

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
