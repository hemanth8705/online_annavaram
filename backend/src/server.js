const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
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
const openapiDocument = require('./docs/openapi');

const app = express();
app.set('trust proxy', 1);
let serverInstance;

const port = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const implicitOrigins = [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
  process.env.API_PUBLIC_ORIGIN,
].filter(Boolean);

const allowedOriginSet = new Set([...allowedOrigins, ...implicitOrigins]);

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOriginSet.size === 0 ||
      allowedOriginSet.has(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type,Authorization');
    res.set('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  return next();
});
app.use(express.json());
app.use(cookieParser());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, { explorer: true }));
app.get('/api/docs.json', (_req, res) => {
  res.json(openapiDocument);
});

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
