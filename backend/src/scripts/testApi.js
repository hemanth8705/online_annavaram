const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { startServer, stopServer } = require('../server');
const { User, Product, Cart, CartItem } = require('../models');

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    payload = await response.text();
  }

  return {
    status: response.status,
    payload,
  };
}

async function run() {
  await startServer();
  const port = process.env.PORT || 4000;
  const baseUrl = `http://127.0.0.1:${port}`;

  const customer = await User.findOne({ email: 'sita@example.com' });
  const admin = await User.findOne({ email: 'admin@onlineannavaram.test' });
  if (!customer || !admin) {
    throw new Error('Seed users not found. Run npm run seed first.');
  }

  const login = async (email) => {
    const response = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: 'demo-password',
      }),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to login ${email}: ${JSON.stringify(response.payload)}`);
    }

    return response.payload.data.accessToken;
  };

  const customerAccessToken = await login(customer.email);
  const adminAccessToken = await login(admin.email);

  const authHeaders = {
    customer: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerAccessToken}`,
    },
    admin: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminAccessToken}`,
    },
  };

  const activeCart =
    (await Cart.findOne({ user: customer._id, status: 'active' })) ||
    (await Cart.create({ user: customer._id, status: 'active' }));
  await CartItem.deleteMany({ cart: activeCart._id });

  const products = await Product.find().lean();
  const productForCart = products[0];

  console.log('1) GET /api/products');
  console.log(
    await fetchJson(`${baseUrl}/api/products`, {
      headers: { Authorization: authHeaders.customer.Authorization },
    })
  );

  console.log('2) POST /api/cart/items');
  console.log(
    await fetchJson(`${baseUrl}/api/cart/items`, {
      method: 'POST',
      headers: authHeaders.customer,
      body: JSON.stringify({
        productId: productForCart._id.toString(),
        quantity: 2,
      }),
    })
  );

  const cartItems = await CartItem.find({ cart: activeCart._id }).lean();
  const firstItem = cartItems[0];

  console.log('3) PATCH /api/cart/items/:itemId');
  console.log(
    await fetchJson(`${baseUrl}/api/cart/items/${firstItem._id}`, {
      method: 'PATCH',
      headers: authHeaders.customer,
      body: JSON.stringify({ quantity: 3 }),
    })
  );

  const primaryAddressDoc = customer.addresses && customer.addresses[0];
  const primaryAddress =
    primaryAddressDoc && typeof primaryAddressDoc.toObject === 'function'
      ? primaryAddressDoc.toObject()
      : primaryAddressDoc || null;

  const { _id, id, ...addressFields } = primaryAddress || {};

  const shippingAddress = primaryAddress
    ? {
        ...addressFields,
        name: customer.fullName,
        phone: customer.phone,
      }
    : {
        name: customer.fullName,
        phone: customer.phone,
        line1: 'Fallback Address',
        city: 'Annavaram',
        state: 'Andhra Pradesh',
        postalCode: '533406',
        country: 'IN',
      };

  console.log('4) POST /api/orders');
  console.log(
    await fetchJson(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: authHeaders.customer,
      body: JSON.stringify({
        shippingAddress,
        notes: 'Automated order from test script',
      }),
    })
  );

  console.log('5) GET /api/orders');
  console.log(
    await fetchJson(`${baseUrl}/api/orders`, {
      headers: authHeaders.customer,
    })
  );

  console.log('6) GET /api/admin/orders');
  console.log(
    await fetchJson(`${baseUrl}/api/admin/orders`, {
      headers: authHeaders.admin,
    })
  );

  await stopServer();
}

run().catch(async (error) => {
  console.error('API test script failed', error);
  try {
    await stopServer();
  } catch (stopError) {
    if (stopError.code !== 'ERR_SERVER_NOT_RUNNING') {
      console.error('Failed to stop server cleanly', stopError);
    }
  }
  process.exit(1);
});
