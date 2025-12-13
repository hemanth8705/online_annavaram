# Admin Backend API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. Admin Login
**Endpoint:** `POST /auth/login`  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "admin@annavaram.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "65abc123def456...",
      "email": "admin@annavaram.com",
      "role": "super_admin"
    }
  }
}
```

### 2. Get Admin Profile
**Endpoint:** `GET /auth/profile`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "65abc123def456...",
    "email": "admin@annavaram.com",
    "role": "super_admin",
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

---

## 📁 Category Endpoints

### 1. Create Category
**Endpoint:** `POST /categories`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "Telugu Snacks"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "65abc123def456...",
    "name": "Telugu Snacks",
    "isActive": true,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### 2. Get All Categories
**Endpoint:** `GET /categories`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc123def456...",
      "name": "Telugu Snacks",
      "isActive": true,
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Get Active Categories
**Endpoint:** `GET /categories/active`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc123def456...",
      "name": "Telugu Snacks",
      "isActive": true,
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 4. Update Category
**Endpoint:** `PUT /categories/:id`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated Telugu Snacks"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "65abc123def456...",
    "name": "Updated Telugu Snacks",
    "isActive": true,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### 5. Toggle Category Status
**Endpoint:** `PATCH /categories/:id/toggle-status`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Category disabled successfully",
  "data": {
    "_id": "65abc123def456...",
    "name": "Telugu Snacks",
    "isActive": false,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### 6. Delete Category
**Endpoint:** `DELETE /categories/:id`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Category disabled successfully",
  "data": {
    "_id": "65abc123def456...",
    "name": "Telugu Snacks",
    "isActive": false,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

**Note:** Categories with products cannot be deleted.

---

## 📦 Product Endpoints

### 1. Create Product
**Endpoint:** `POST /products`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "Mixture",
  "categoryId": "65abc123def456...",
  "price": 150,
  "totalStock": 100,
  "isUnlimitedPurchase": false,
  "maxUnitsPerUser": 5,
  "imageUrl": "https://example.com/mixture.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "65abc789ghi012...",
    "name": "Mixture",
    "categoryId": {
      "_id": "65abc123def456...",
      "name": "Telugu Snacks"
    },
    "price": 150,
    "totalStock": 100,
    "maxUnitsPerUser": 5,
    "isUnlimitedPurchase": false,
    "imageUrl": "https://example.com/mixture.jpg",
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### 2. Get All Products
**Endpoint:** `GET /products`  
**Authentication:** Required

**Query Parameters:**
- `search` (string): Search by product name
- `categoryId` (string): Filter by category
- `isActive` (boolean): Filter by active status
- `sortBy` (string): Sort field (default: `createdAt`)
- `order` (string): Sort order - `asc` or `desc` (default: `desc`)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Example:**
```
GET /products?search=mixture&categoryId=65abc123def456&isActive=true&sortBy=price&order=asc&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc789ghi012...",
      "name": "Mixture",
      "categoryId": {
        "_id": "65abc123def456...",
        "name": "Telugu Snacks",
        "isActive": true
      },
      "price": 150,
      "totalStock": 100,
      "maxUnitsPerUser": 5,
      "isUnlimitedPurchase": false,
      "imageUrl": "https://example.com/mixture.jpg",
      "isActive": true,
      "isDeleted": false,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 3. Get Single Product
**Endpoint:** `GET /products/:id`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789ghi012...",
    "name": "Mixture",
    "categoryId": {
      "_id": "65abc123def456...",
      "name": "Telugu Snacks",
      "isActive": true
    },
    "price": 150,
    "totalStock": 100,
    "maxUnitsPerUser": 5,
    "isUnlimitedPurchase": false,
    "imageUrl": "https://example.com/mixture.jpg",
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### 4. Update Product
**Endpoint:** `PUT /products/:id`  
**Authentication:** Required

**Request Body:** (all fields optional)
```json
{
  "name": "Premium Mixture",
  "categoryId": "65abc123def456...",
  "price": 180,
  "totalStock": 150,
  "maxUnitsPerUser": 10,
  "isUnlimitedPurchase": false,
  "imageUrl": "https://example.com/premium-mixture.jpg",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "65abc789ghi012...",
    "name": "Premium Mixture",
    "price": 180,
    "totalStock": 150,
    "maxUnitsPerUser": 10,
    ...
  }
}
```

### 5. Update Product Stock
**Endpoint:** `PATCH /products/:id/stock`  
**Authentication:** Required

**Request Body:**
```json
{
  "stock": 75
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product stock updated successfully",
  "data": {
    "_id": "65abc789ghi012...",
    "name": "Mixture",
    "totalStock": 75,
    ...
  }
}
```

### 6. Toggle Product Status
**Endpoint:** `PATCH /products/:id/toggle-status`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Product disabled successfully",
  "data": {
    "_id": "65abc789ghi012...",
    "name": "Mixture",
    "isActive": false,
    ...
  }
}
```

### 7. Delete Product
**Endpoint:** `DELETE /products/:id`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 📦 Order Endpoints

### 1. Get All Orders
**Endpoint:** `GET /orders`  
**Authentication:** Required

**Query Parameters:**
- `status` (string): Filter by order status
- `startDate` (date): Filter orders from this date
- `endDate` (date): Filter orders until this date
- `sortBy` (string): Sort field (default: `createdAt`)
- `order` (string): Sort order - `asc` or `desc` (default: `desc`)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Valid Status Values:**
- `payment_confirmed`
- `dispatched`
- `reached_city`
- `out_for_delivery`
- `delivered`

**Example:**
```
GET /orders?status=dispatched&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65order123...",
      "orderId": "ORD-2024-001",
      "userId": "65user456...",
      "products": [
        {
          "productId": {
            "_id": "65abc789ghi012...",
            "name": "Mixture",
            "imageUrl": "https://example.com/mixture.jpg"
          },
          "productName": "Mixture",
          "quantity": 2,
          "unitPrice": 150,
          "subtotal": 300
        }
      ],
      "totalAmount": 300,
      "status": "dispatched",
      "statusHistory": [
        {
          "status": "payment_confirmed",
          "timestamp": "2024-12-01T10:00:00.000Z"
        },
        {
          "status": "dispatched",
          "timestamp": "2024-12-02T10:00:00.000Z",
          "updatedBy": "65admin123...",
          "notes": "Order dispatched"
        }
      ],
      "shippingAddress": {
        "name": "John Doe",
        "phone": "9876543210",
        "line1": "123 Main St",
        "city": "Hyderabad",
        "state": "Telangana",
        "postalCode": "500001",
        "country": "IN"
      },
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 2. Get Single Order
**Endpoint:** `GET /orders/:id`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65order123...",
    "orderId": "ORD-2024-001",
    "userId": "65user456...",
    "products": [...],
    "totalAmount": 300,
    "status": "dispatched",
    "statusHistory": [...],
    "shippingAddress": {...},
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### 3. Update Order Status
**Endpoint:** `PATCH /orders/:id/status`  
**Authentication:** Required

**Request Body:**
```json
{
  "status": "dispatched",
  "notes": "Order has been dispatched via Blue Dart courier"
}
```

**Valid Status Flow:**
1. `order_created`
2. `payment_confirmed`
3. `dispatched`
4. `reached_city`
5. `out_for_delivery`
6. `delivered`

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "_id": "65order123...",
    "orderId": "ORD-2024-001",
    "status": "dispatched",
    "statusHistory": [
      {
        "status": "payment_confirmed",
        "timestamp": "2024-12-01T10:00:00.000Z"
      },
      {
        "status": "dispatched",
        "timestamp": "2024-12-02T10:00:00.000Z",
        "updatedBy": {
          "_id": "65admin123...",
          "email": "admin@annavaram.com"
        },
        "notes": "Order has been dispatched via Blue Dart courier"
      }
    ],
    ...
  }
}
```

### 4. Get Order Statistics
**Endpoint:** `GET /orders/stats`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 45000,
    "statusBreakdown": [
      {
        "_id": "delivered",
        "count": 100,
        "totalAmount": 30000
      },
      {
        "_id": "out_for_delivery",
        "count": 20,
        "totalAmount": 6000
      },
      {
        "_id": "dispatched",
        "count": 30,
        "totalAmount": 9000
      }
    ]
  }
}
```

---

## ⭐ Review Endpoints

### 1. Get All Reviews
**Endpoint:** `GET /reviews`  
**Authentication:** Required

**Query Parameters:**
- `productId` (string): Filter by product
- `rating` (number): Filter by rating (1-5)
- `sortBy` (string): Sort field (default: `createdAt`)
- `order` (string): Sort order - `asc` or `desc` (default: `desc`)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Example:**
```
GET /reviews?productId=65abc789ghi012&rating=5&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65review123...",
      "userId": "65user456...",
      "productId": {
        "_id": "65abc789ghi012...",
        "name": "Mixture",
        "imageUrl": "https://example.com/mixture.jpg"
      },
      "rating": 5,
      "reviewText": "Excellent product! Very tasty and fresh.",
      "isDeleted": false,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 2. Get Single Review
**Endpoint:** `GET /reviews/:id`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65review123...",
    "userId": "65user456...",
    "productId": {
      "_id": "65abc789ghi012...",
      "name": "Mixture",
      "imageUrl": "https://example.com/mixture.jpg",
      "categoryId": "65abc123def456..."
    },
    "rating": 5,
    "reviewText": "Excellent product! Very tasty and fresh.",
    "isDeleted": false,
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### 3. Get Product Reviews
**Endpoint:** `GET /reviews/product/:productId`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "65abc789ghi012...",
      "name": "Mixture"
    },
    "reviews": [
      {
        "_id": "65review123...",
        "userId": "65user456...",
        "rating": 5,
        "reviewText": "Excellent product!",
        "createdAt": "2024-12-01T10:00:00.000Z"
      }
    ],
    "stats": {
      "totalReviews": 10,
      "averageRating": 4.5
    }
  }
}
```

### 4. Edit Review
**Endpoint:** `PUT /reviews/:id`  
**Authentication:** Required

**Request Body:** (all fields optional)
```json
{
  "rating": 4,
  "reviewText": "Updated review text - Good product overall."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "_id": "65review123...",
    "userId": "65user456...",
    "productId": {
      "_id": "65abc789ghi012...",
      "name": "Mixture",
      "imageUrl": "https://example.com/mixture.jpg"
    },
    "rating": 4,
    "reviewText": "Updated review text - Good product overall.",
    "isDeleted": false,
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2024-12-02T11:00:00.000Z"
  }
}
```

### 5. Delete Review
**Endpoint:** `DELETE /reviews/:id`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### 6. Get Review Statistics
**Endpoint:** `GET /reviews/stats`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReviews": 150,
    "averageRating": 4.3,
    "ratingDistribution": [
      {
        "_id": 5,
        "count": 80
      },
      {
        "_id": 4,
        "count": 50
      },
      {
        "_id": 3,
        "count": 15
      },
      {
        "_id": 2,
        "count": 3
      },
      {
        "_id": 1,
        "count": 2
      }
    ]
  }
}
```

---

## 🔴 Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

### Common HTTP Status Codes:
- `200` - OK (Success)
- `201` - Created
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (Invalid or missing token)
- `404` - Not Found (Resource doesn't exist)
- `500` - Internal Server Error

### Example Error Responses:

**Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Token Expired:**
```json
{
  "success": false,
  "message": "Token expired. Please login again."
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Price must be greater than 0"
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## 🧪 Testing with cURL

### Login Example
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@annavaram.com","password":"Admin@123"}'
```

### Get Products (with auth)
```bash
curl -X GET "http://localhost:5001/api/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Category
```bash
curl -X POST http://localhost:5001/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"New Category"}'
```

### Update Order Status
```bash
curl -X PATCH http://localhost:5001/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status":"dispatched","notes":"Order dispatched"}'
```

---

## 📝 Notes

1. **Token Expiration**: JWT tokens expire after 7 days. After expiration, users must login again.

2. **Soft Deletes**: Products, categories, and reviews use soft deletes (isDeleted flag) to maintain data integrity.

3. **Stock Management**: When stock reaches 0, products are automatically disabled. They can be re-enabled after restocking.

4. **Status Flow**: Order status updates should follow the logical flow, but manual corrections are allowed.

5. **Pagination**: All list endpoints support pagination with `page` and `limit` parameters.

6. **Search & Filters**: Most endpoints support search and filtering capabilities.

7. **Population**: Related data (categories, products) is automatically populated in responses where relevant.
