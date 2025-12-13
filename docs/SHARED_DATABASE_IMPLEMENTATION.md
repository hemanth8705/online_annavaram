# Shared Database Implementation Plan

## Current State Analysis

### Admin Backend (Node.js/MongoDB)
- **Database**: `online_annavaram` (MongoDB Atlas)
- **Collections**:
  - `adminproducts` - Products (model name: 'AdminProduct')
  - `categories` - Product categories
  - `orders` - All orders
  - `reviews` - Product reviews
  - `admins` - Admin users

### User Backend (Python/FastAPI/Beanie)
- **Database**: Same cluster but using different collection names
- **Collections**:
  - `products` - Products (different schema)
  - `users` - Customer users
  - `carts` - Shopping carts
  - `cart_items` - Cart items
  - `orders` - Orders (different schema)
  - `order_items` - Order items
  - `reviews` - Reviews (different schema)
  - `payments` - Payment records
  - `sessions` - User sessions
  - `wishlists` - User wishlists

## Problems Identified

1. **Separate Product Collections**: Admin uses `adminproducts`, User uses `products`
2. **Schema Mismatches**: Different field names and structures
3. **No Data Sharing**: Products created by admin don't appear in user app
4. **Duplicate Collections**: Orders and reviews exist in both backends with different schemas
5. **No Role-Based Access**: Missing unified authentication and authorization

## Unified Database Schema

### Core Principle
**One database, one collection per entity type, role-based access control**

### Collection Structure

#### 1. `products` Collection (Single Source of Truth)
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (indexed, unique),
  description: String,
  price: Number (>=0),
  currency: String (default: "INR"),
  stock: Number (>=0),
  maxUnitsPerUser: Number (>=1),
  isUnlimitedPurchase: Boolean,
  category: String (category name or ID reference),
  categoryId: ObjectId (ref: Category),
  images: [String],
  imageUrl: String (primary image),
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```
**Access Rules**:
- Admin: Full CRUD
- User: Read-only (only active products)

#### 2. `categories` Collection
```javascript
{
  _id: ObjectId,
  name: String (unique),
  slug: String (indexed, unique),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```
**Access Rules**:
- Admin: Full CRUD
- User: Read-only (only active categories)

#### 3. `orders` Collection
```javascript
{
  _id: ObjectId,
  orderId: String (unique, generated),
  userId: ObjectId (ref: User),
  user: ObjectId (for Python backend compatibility),
  items: [{
    productId: ObjectId,
    productName: String,
    quantity: Number,
    unitPrice: Number,
    subtotal: Number
  }],
  totalAmount: Number,
  currency: String (default: "INR"),
  status: Enum [
    'order_created',
    'payment_confirmed',
    'dispatched',
    'reached_city',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ],
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: ObjectId (admin),
    notes: String
  }],
  shippingAddress: {
    name: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  paymentIntentId: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```
**Access Rules**:
- Admin: View all orders, update status
- User: View own orders only, create orders

#### 4. `reviews` Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  user: ObjectId (for Python compatibility),
  productId: ObjectId (ref: Product),
  product: ObjectId (for Python compatibility),
  rating: Number (1-5),
  title: String (optional),
  reviewText: String,
  comment: String (alias for reviewText),
  isVerifiedPurchase: Boolean,
  isApproved: Boolean (default: true),
  isDeleted: Boolean,
  helpfulCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```
**Access Rules**:
- Admin: View all, edit/delete any
- User: Create only, view approved reviews

#### 5. `users` Collection
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique, indexed),
  passwordHash: String,
  phone: String,
  role: Enum ['customer', 'admin'],
  addresses: [{
    id: String,
    label: String,
    contactName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  }],
  isActive: Boolean,
  emailVerified: Boolean,
  emailVerifiedAt: Date,
  googleId: String,
  createdAt: Date,
  updatedAt: Date
}
```
**Access Rules**:
- Admin: View all users (read-only from admin backend)
- User: View/edit own profile only

#### 6. `carts` Collection (User Backend Only)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  status: Enum ['active', 'converted', 'abandoned'],
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. `cart_items` Collection (User Backend Only)
```javascript
{
  _id: ObjectId,
  cart: ObjectId (ref: Cart),
  product: ObjectId (ref: Product),
  quantity: Number,
  priceAtAddition: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 8. `admins` Collection (Admin Backend Only)
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: String (default: 'super_admin'),
  createdAt: Date
}
```

## Implementation Steps

### Phase 1: Unify Product Schema
1. Rename admin model from 'AdminProduct' to 'Product'
2. Update Python Product model to match Node.js schema
3. Add missing fields to both models for compatibility
4. Ensure both backends read from `products` collection

### Phase 2: Unify Categories
1. Add slug field to Category model
2. Ensure both backends use `categories` collection
3. Implement cascading updates/deletes

### Phase 3: Unify Orders
1. Merge order schemas from both backends
2. Add order_items as embedded documents
3. Ensure both backends use `orders` collection
4. Update status flow to match admin requirements

### Phase 4: Unify Reviews
1. Merge review schemas
2. Add approval workflow
3. Ensure both backends use `reviews` collection

### Phase 5: Implement Role-Based Access
1. Add middleware to check user role
2. Enforce read-only for users on admin-managed collections
3. Enforce ownership checks for user-created data

### Phase 6: Database Migration
1. Create migration scripts to consolidate data
2. Map `adminproducts` → `products`
3. Merge duplicate orders and reviews
4. Verify data integrity

## Expected Outcomes

✅ **Single Database**: All data in one MongoDB database  
✅ **No Duplication**: One collection per entity type  
✅ **Shared Products**: Admin creates, users view  
✅ **Shared Orders**: Users create, admin manages  
✅ **Shared Reviews**: Users create, admin moderates  
✅ **Role-Based Access**: Proper permissions at API layer  
✅ **Real-Time Sync**: Changes reflect immediately across both apps

## Rollout Strategy

1. **Development**: Implement changes in development environment
2. **Testing**: Verify all CRUD operations work correctly
3. **Migration**: Run data migration scripts on production
4. **Deployment**: Deploy both backends simultaneously
5. **Monitoring**: Monitor for any data inconsistencies
