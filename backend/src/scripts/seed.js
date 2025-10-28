const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const {
  connectToDatabase,
  disconnectFromDatabase,
} = require('../db');
const {
  User,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
} = require('../models');

async function clearCollections() {
  await CartItem.deleteMany({});
  await OrderItem.deleteMany({});
  await Payment.deleteMany({});
  await Cart.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});
}

async function seedData() {
  const passwordHash = await bcrypt.hash('demo-password', 10);

  const [adminUser, customerUser] = await User.create([
    {
      fullName: 'Online Annavaram Admin',
      email: 'admin@onlineannavaram.test',
      passwordHash,
      role: 'admin',
      phone: '9999999900',
      addresses: [],
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    {
      fullName: 'Sita Lakshmi',
      email: 'sita@example.com',
      passwordHash,
      phone: '9999999901',
      addresses: [
        {
          label: 'Home',
          line1: '12-34 Main Road',
          line2: 'Near Temple Street',
          city: 'Annavaram',
          state: 'Andhra Pradesh',
          postalCode: '533406',
          country: 'IN',
        },
      ],
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  ]);

  const [jaggeryProduct, gheeProduct] = await Product.create([
    {
      name: 'Organic Palm Jaggery',
      slug: 'organic-palm-jaggery',
      description: 'Traditionally prepared jaggery sourced from Annavaram.',
      price: 49900,
      stock: 120,
      category: 'jaggery',
      images: ['https://raw.githubusercontent.com/hemanth8705/online_annavaram/main/client/public/telugu_snacks_images/snacks02.jpg'],
    },
    {
      name: 'Cow Ghee 1L',
      slug: 'cow-ghee-1l',
      description: 'Rich aromatic ghee sourced from local dairy farms.',
      price: 89900,
      stock: 80,
      category: 'ghee',
      images: [ 'https://raw.githubusercontent.com/hemanth8705/online_annavaram/main/client/public/telugu_snacks_images/snacks01.jpg'],
    },
  ]);

  const cart = await Cart.create({
    user: customerUser._id,
    status: 'active',
  });

  const cartItems = await CartItem.create([
    {
      cart: cart._id,
      product: jaggeryProduct._id,
      quantity: 2,
      priceAtAddition: jaggeryProduct.price,
    },
    {
      cart: cart._id,
      product: gheeProduct._id,
      quantity: 1,
      priceAtAddition: gheeProduct.price,
    },
  ]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.priceAtAddition * item.quantity,
    0
  );

  const order = await Order.create({
    user: customerUser._id,
    cart: cart._id,
    totalAmount,
    currency: 'INR',
    status: 'paid',
    shippingAddress: {
      name: customerUser.fullName,
      phone: customerUser.phone,
      ...customerUser.addresses[0],
    },
    paymentIntentId: 'demo_intent_123',
    notes: 'Demo order created via seed script.',
  });

  const productsById = new Map(
    [jaggeryProduct, gheeProduct].map((product) => [
      product._id.toString(),
      product,
    ])
  );

  const orderItems = await OrderItem.create(
    cartItems.map((item) => ({
      order: order._id,
      product: item.product,
      productName: productsById.get(item.product.toString()).name,
      unitPrice: item.priceAtAddition,
      quantity: item.quantity,
      subtotal: item.priceAtAddition * item.quantity,
    }))
  );

  const payment = await Payment.create({
    order: order._id,
    gateway: 'razorpay',
    amount: totalAmount,
    currency: 'INR',
    status: 'captured',
    transactionId: 'pay_demo_123',
    rawResponse: {
      id: 'pay_demo_123',
      status: 'captured',
      amount: totalAmount,
    },
  });

  return {
    adminUser,
    customerUser,
    products: [jaggeryProduct, gheeProduct],
    cart,
    cartItems,
    order,
    orderItems,
    payment,
  };
}

async function runChecks({ customerUser, cart, order }) {
  const allProducts = await Product.find().lean();
  console.log(
    `Products available (${allProducts.length}):`,
    allProducts.map((p) => ({
      name: p.name,
      pricePaise: p.price,
      stock: p.stock,
    }))
  );

  const cartItems = await CartItem.find({ cart: cart._id })
    .populate('product', 'name price')
    .lean();
  console.log(
    `Cart ${cart._id} items:`,
    cartItems.map((item) => ({
      product: item.product.name,
      quantity: item.quantity,
      pricePaise: item.priceAtAddition,
    }))
  );

  const orders = await Order.find({ user: customerUser._id })
    .populate('user', 'fullName email')
    .lean();
  console.log(
    `Orders for ${customerUser.email}:`,
    orders.map((o) => ({
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
    }))
  );

  const payments = await Payment.find({ order: order._id }).lean();
  console.log(
    `Payments for order ${order._id}:`,
    payments.map((p) => ({
      gateway: p.gateway,
      status: p.status,
      amount: p.amount,
    }))
  );
}

async function main() {
  try {
    await connectToDatabase();
    console.log('Connected to database. Clearing collections...');
    await clearCollections();
    console.log('Seeding sample data...');
    const seeded = await seedData();
    console.log('Sample data created successfully.');
    console.log('Running verification queries...');
    await runChecks(seeded);
    console.log('Seed script completed.');
  } catch (error) {
    console.error('Seed script failed', error);
    process.exitCode = 1;
  } finally {
    await disconnectFromDatabase();
  }
}

main();
