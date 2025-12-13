# Admin E-Commerce Backend

A Node.js/Express backend system for managing an e-commerce admin panel. This system provides API endpoints for admin authentication, category management, product management, order tracking, and review management.

## 📋 Features

### Phase 0 (Completed)
- ✅ **Admin Authentication**: JWT-based login system
- ✅ **Category Management**: Create, update, enable/disable categories
- ✅ **Product Management**: Full CRUD operations with stock management
- ✅ **Stock Safety**: Automatic product disabling when stock reaches zero

### Phase 1 (Completed)
- ✅ **Order Management**: View orders, update status with history tracking
- ✅ **Review Management**: View and edit customer reviews

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or remote)

### Installation

1. **Navigate to admin backend directory**:
   ```powershell
   cd admin-backend
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Create environment file**:
   ```powershell
   Copy-Item .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/annavaram_admin
   JWT_SECRET=your_super_secret_jwt_key_here
   ADMIN_EMAIL=admin@annavaram.com
   ADMIN_PASSWORD=Admin@123
   CLIENT_URL=http://localhost:5173
   ```

5. **Start the server**:
   ```powershell
   # Development mode (with watch)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5001`

## 📚 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@annavaram.com",
  "password": "Admin@123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "...",
      "email": "admin@annavaram.com",
      "role": "super_admin"
    }
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

---

### Categories

All category endpoints require authentication.

#### Create Category
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Telugu Snacks"
}
```

#### Get All Categories
```http
GET /api/categories
Authorization: Bearer <token>
```

#### Get Active Categories
```http
GET /api/categories/active
Authorization: Bearer <token>
```

#### Update Category
```http
PUT /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Category Name"
}
```

#### Toggle Category Status
```http
PATCH /api/categories/:id/toggle-status
Authorization: Bearer <token>
```

#### Delete Category
```http
DELETE /api/categories/:id
Authorization: Bearer <token>
```

---

### Products

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mixture",
  "categoryId": "category_id_here",
  "price": 150,
  "totalStock": 100,
  "isUnlimitedPurchase": false,
  "maxUnitsPerUser": 5,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Get All Products
```http
GET /api/products?search=mixture&categoryId=xxx&isActive=true&sortBy=price&order=asc&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Single Product
```http
GET /api/products/:id
Authorization: Bearer <token>
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Product Name",
  "price": 200,
  "totalStock": 150
}
```

#### Update Product Stock
```http
PATCH /api/products/:id/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "stock": 50
}
```

#### Toggle Product Status
```http
PATCH /api/products/:id/toggle-status
Authorization: Bearer <token>
```

#### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

---

### Orders

#### Get All Orders
```http
GET /api/orders?status=dispatched&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Single Order
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "dispatched",
  "notes": "Order has been dispatched via courier"
}
```

Valid statuses (in order):
- `order_created`
- `payment_confirmed`
- `dispatched`
- `reached_city`
- `out_for_delivery`
- `delivered`

#### Get Order Statistics
```http
GET /api/orders/stats
Authorization: Bearer <token>
```

---

### Reviews

#### Get All Reviews
```http
GET /api/reviews?productId=xxx&rating=5&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Product Reviews
```http
GET /api/reviews/product/:productId
Authorization: Bearer <token>
```

#### Get Single Review
```http
GET /api/reviews/:id
Authorization: Bearer <token>
```

#### Edit Review
```http
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "reviewText": "Updated review text"
}
```

#### Delete Review
```http
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

#### Get Review Statistics
```http
GET /api/reviews/stats
Authorization: Bearer <token>
```

---

## 🗄️ Data Models

### Admin
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: String (default: 'super_admin'),
  createdAt: Date
}
```

### Category
```javascript
{
  name: String (unique),
  isActive: Boolean,
  createdAt: Date
}
```

### Product
```javascript
{
  name: String,
  categoryId: ObjectId (ref: Category),
  price: Number,
  totalStock: Number,
  maxUnitsPerUser: Number,
  isUnlimitedPurchase: Boolean,
  imageUrl: String,
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  orderId: String (unique),
  userId: ObjectId,
  products: [{
    productId: ObjectId,
    productName: String,
    quantity: Number,
    unitPrice: Number,
    subtotal: Number
  }],
  totalAmount: Number,
  status: String,
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: ObjectId (ref: Admin),
    notes: String
  }],
  shippingAddress: Object,
  createdAt: Date
}
```

### Review
```javascript
{
  userId: ObjectId,
  productId: ObjectId (ref: Product),
  rating: Number (1-5),
  reviewText: String,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected routes requiring valid tokens
- Token expiration (7 days)
- CORS configuration

---

## 📝 Business Rules

### Category Management
- Category names must be unique
- Categories cannot be hard deleted, only disabled
- Products cannot be added to inactive categories
- Categories with products cannot be deleted

### Product Management
- Price must be greater than 0
- Stock cannot be negative
- Products with 0 stock are automatically disabled
- Soft delete only (prevents order data corruption)
- Unlimited purchase sets maxUnitsPerUser = totalStock

### Order Management
- Only successful orders (payment confirmed+) are shown
- Status updates are tracked in history
- Manual status correction is allowed
- Each status change is logged with admin ID and timestamp

### Review Management
- Reviews can be edited by admin (text and rating)
- Soft delete only (audit trail)
- Rating must be between 1-5
- UserId and ProductId cannot be changed

---

## 🧪 Testing

### Health Check
```powershell
curl http://localhost:5001/health
```

### Test Login
```powershell
curl -X POST http://localhost:5001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@annavaram.com","password":"Admin@123"}'
```

---

## 📦 Project Structure

```
admin-backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── models/
│   │   ├── Admin.js           # Admin user model
│   │   ├── Category.js        # Category model
│   │   ├── Product.js         # Product model
│   │   ├── Order.js           # Order model
│   │   └── Review.js          # Review model
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── reviewController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── reviews.js
│   ├── middlewares/
│   │   └── auth.js            # JWT authentication
│   └── server.js              # Entry point
├── .env.example               # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **CORS**: cors middleware

---

## 🚦 Error Handling

All endpoints return standardized responses:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

---

## 🔄 Future Enhancements

**Out of Scope (Not Implemented):**
- Image uploads
- Payment processing
- Email notifications
- Analytics dashboards
- User authentication
- Recommendation systems

---

## 📞 Support

For issues or questions, please check:
1. Environment variables are correctly set
2. MongoDB is running and accessible
3. Dependencies are installed
4. Port 5001 is not in use

---

## 📄 License

See LICENSE file in the root directory.
