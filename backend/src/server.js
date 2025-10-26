const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { connectToDatabase, disconnectFromDatabase } = require('./db');
require('./models');
const testRoute = require('./routes/testRoute');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
let serverInstance;

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Server running' });
});

app.use('/api/test', testRoute);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

app.use(errorHandler);

const port = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectToDatabase();

    if (serverInstance) {
      return serverInstance;
    }

    await new Promise((resolve) => {
      serverInstance = app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        resolve(serverInstance);
      });
    });

    return serverInstance;
  } catch (error) {
    console.error('Failed to start server', error);
    throw error;
  }
}

async function stopServer() {
  if (!serverInstance) {
    return;
  }

  await new Promise((resolve, reject) => {
    serverInstance.close((err) => {
      if (err) {
        if (err.code === 'ERR_SERVER_NOT_RUNNING') {
          resolve();
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
  serverInstance = undefined;

  await disconnectFromDatabase();
}

if (require.main === module) {
  startServer().catch(() => {
    process.exit(1);
  });
}

module.exports = { app, startServer, stopServer };
