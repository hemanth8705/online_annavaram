import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';

// Import routes
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
// Configure CORS to accept configured client URL(s).
// Supports comma-separated CLIENT_URL env var and allows localhost:5174 during development.
const rawClientUrls = process.env.CLIENT_URL || 'http://localhost:5173';
const clientUrls = rawClientUrls.split(',').map((s) => s.trim()).filter(Boolean);
if (process.env.NODE_ENV !== 'production' && !clientUrls.includes('http://localhost:5174')) {
  clientUrls.push('http://localhost:5174');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);
    if (clientUrls.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Initialize admin user if not exists
const initializeAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('Warning: ADMIN_EMAIL and ADMIN_PASSWORD not set in environment variables');
      return;
    }

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const admin = new Admin({
        email: adminEmail,
        password: adminPassword,
        role: 'super_admin'
      });
      
      await admin.save();
      console.log('✓ Initial admin user created successfully');
      console.log(`  Email: ${adminEmail}`);
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize admin user
    await initializeAdmin();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log('  Admin E-Commerce Backend');
      console.log('═══════════════════════════════════════════════');
      console.log(`  Server running on port: ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Database: ${process.env.MONGODB_URI}`);
      console.log('');
      console.log('  Available endpoints:');
      console.log('  - POST   /api/auth/login');
      console.log('  - GET    /api/auth/profile');
      console.log('  - POST   /api/categories');
      console.log('  - GET    /api/categories');
      console.log('  - POST   /api/products');
      console.log('  - GET    /api/products');
      console.log('  - GET    /api/orders');
      console.log('  - PATCH  /api/orders/:id/status');
      console.log('  - GET    /api/reviews');
      console.log('  - PUT    /api/reviews/:id');
      console.log('═══════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

export default app;
