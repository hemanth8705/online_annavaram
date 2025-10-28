const components = require('./components');
const systemPaths = require('./paths/system');
const authPaths = require('./paths/auth');
const productsPaths = require('./paths/products');
const cartPaths = require('./paths/cart');
const ordersPaths = require('./paths/orders');
const adminPaths = require('./paths/admin');
const paymentsPaths = require('./paths/payments');

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Online Annavaram API',
    version: '1.0.0',
    description:
      'REST API for the Online Annavaram storefront. Each endpoint includes sample requests and responses to speed up integration.',
    contact: {
      name: 'Online Annavaram',
      email: 'support@onlineannavaram.example',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local development',
    },
    {
      url: 'https://online-annavaram-backend.onrender.com',
      description: 'Production',
    },
  ],
  tags: [
    { name: 'System', description: 'Service health endpoints' },
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'Products', description: 'Product catalogue management' },
    { name: 'Cart', description: 'Shopping cart operations' },
    { name: 'Orders', description: 'Customer order workflows' },
    { name: 'Payments', description: 'Payment integrations' },
    { name: 'Admin', description: 'Administrator endpoints' },
  ],
  components,
  paths: {
    ...systemPaths,
    ...authPaths,
    ...productsPaths,
    ...cartPaths,
    ...ordersPaths,
    ...adminPaths,
    ...paymentsPaths,
  },
};
