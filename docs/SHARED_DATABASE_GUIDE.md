# Shared Database Implementation Guide

## Overview

This implementation establishes a **single MongoDB database** shared between the admin and user applications, with proper **role-based access control** ensuring data integrity and security.

## ✅ What Has Been Implemented

### 1. Unified Database Models

#### Admin Backend (Node.js) Models Updated:
- ✅ **Product.js**: Now uses collection `products` (was `adminproducts`)
  - Added `slug`, `description`, `category`, `currency`, `stock`, `images` fields
  - Maintains backward compatibility with `totalStock`, `imageUrl`
  - Auto-generates slugs from product names
  - Syncs stock fields automatically

- ✅ **Category.js**: Uses collection `categories`
  - Added `slug`, `description`, `updatedAt` fields
  - Auto-generates slugs from category names

- ✅ **Order.js**: Uses collection `orders`
  - Added support for both `userId`/`user` naming conventions
  - Added `currency`, `paymentIntentId`, `cart`, `notes` fields
  - Extended status enum to include user backend statuses
  - Syncs product references automatically

- ✅ **Review.js**: Uses collection `reviews`
  - Added support for both `userId`/`user` and `productId`/`product` naming
  - Added `title`, `comment`, `isVerifiedPurchase`, `isApproved`, `helpfulCount`
  - Syncs field naming automatically

#### User Backend (Python) Models Updated:
- ✅ **Product.py**: Uses collection `products`
  - Added `categoryId`, `totalStock`, `maxUnitsPerUser`, `isUnlimitedPurchase`, `imageUrl`, `isDeleted`
  - Maintains backward compatibility with existing fields
  - Auto-syncs stock and image fields

- ✅ **Order.py**: Uses collection `orders`
  - Added `orderId`, `userId`, `products`, `items`, `statusHistory`
  - Extended status enum to match admin backend
  - Embedded order items instead of separate collection

- ✅ **Review.py**: Uses collection `reviews`
  - Added `userId`, `productId`, `reviewText`, `isDeleted`
  - Maintains backward compatibility with existing fields
  - Auto-syncs field naming

### 2. Role-Based Access Control (RBAC)

#### Admin Backend: `middlewares/rbac.js`
- ✅ Middleware for admin-only product/category operations
- ✅ Middleware for admin-only order status updates
- ✅ Middleware for review moderation
- ✅ Query filters for active products and approved reviews

#### User Backend: `middlewares/rbac.py`
- ✅ Functions to check admin role
- ✅ Functions to check resource ownership
- ✅ Functions to validate product/category modifications
- ✅ Functions to validate order and review permissions
- ✅ Query filters for user-facing data

### 3. Database Configuration

#### Admin Backend (.env)
```
MONGODB_URI=mongodb+srv://hemanth:hemanth@cluster0.jnclnxy.mongodb.net/online_annavaram
```

#### User Backend (.env)
```
MONGODB_URI=mongodb+srv://hemanth:hemanth@cluster0.jnclnxy.mongodb.net/
MONGODB_DB_NAME=online_annavaram
```

### 4. Migration Script

✅ Created `admin-backend/src/scripts/migrate-database.js`:
- Consolidates `adminproducts` → `products`
- Updates all product references in orders and reviews
- Syncs field naming across collections
- Creates backup collections before migration
- Adds missing fields and default values

## 📋 Access Control Rules

### Products & Categories
| Operation | Admin | User |
|-----------|-------|------|
| Create | ✅ | ❌ |
| Read All | ✅ | ✅ (active only) |
| Read Single | ✅ | ✅ (active only) |
| Update | ✅ | ❌ |
| Delete | ✅ | ❌ |

### Orders
| Operation | Admin | User |
|-----------|-------|------|
| Create | ❌ | ✅ |
| Read All | ✅ | ❌ |
| Read Own | N/A | ✅ |
| Read Single | ✅ | ✅ (own only) |
| Update Status | ✅ | ❌ |
| Cancel | ✅ | ❌ |

### Reviews
| Operation | Admin | User |
|-----------|-------|------|
| Create | ❌ | ✅ |
| Read All | ✅ | ✅ (approved only) |
| Read Single | ✅ | ✅ (approved only) |
| Update | ✅ | ❌ |
| Delete | ✅ | ❌ |
| Moderate | ✅ | ❌ |

### Cart & Cart Items
| Operation | Admin | User |
|-----------|-------|------|
| Create | ❌ | ✅ |
| Read | ❌ | ✅ (own only) |
| Update | ❌ | ✅ (own only) |
| Delete | ❌ | ✅ (own only) |

## 🚀 Deployment Steps

### Step 1: Backup Current Database
```bash
# Using MongoDB tools
mongodump --uri="mongodb+srv://hemanth:hemanth@cluster0.jnclnxy.mongodb.net/online_annavaram" --out=./backup
```

### Step 2: Run Migration Script
```bash
cd admin-backend
node src/scripts/migrate-database.js
```

Expected output:
```
🚀 Starting database migration...
✅ Connected to MongoDB

🔄 Migrating products...
Found X admin products and Y user products
✅ Migrated Z products successfully

🔄 Migrating categories...
Found X categories
✅ Updated X categories successfully

🔄 Migrating orders...
Found X orders
✅ Updated X orders successfully

🔄 Migrating reviews...
Found X reviews
✅ Updated X reviews successfully

✅ Migration completed successfully!
```

### Step 3: Restart Both Backends

#### Admin Backend
```bash
cd admin-backend
npm install
npm start
```

#### User Backend
```bash
cd backend
# Activate virtual environment
.\\env\\Scripts\\Activate.ps1
pip install -r requirements.txt
python -m uvicorn src.server:app --reload --port 4000
```

### Step 4: Verify Data Integrity

#### Test Product Sharing
1. **Admin**: Create a new product
2. **User App**: Verify the product appears in the catalog
3. **Admin**: Update product stock
4. **User App**: Verify updated stock is visible

#### Test Order Flow
1. **User App**: Place an order
2. **Admin**: Verify order appears in admin dashboard
3. **Admin**: Update order status
4. **User App**: Verify updated status in order history

#### Test Review Flow
1. **User App**: Submit a review
2. **Admin**: Verify review appears in admin dashboard
3. **Admin**: Moderate review (approve/delete)
4. **User App**: Verify moderation is reflected

### Step 5: Monitor Logs
Watch for any errors or warnings in both backend logs:
- Check for authentication issues
- Check for permission errors
- Check for data sync issues

## 🔍 Troubleshooting

### Products Not Appearing in User App
**Cause**: Products may be marked as inactive or deleted  
**Solution**: Check product `isActive` and `isDeleted` flags in database

### Orders Not Visible to Admin
**Cause**: Missing `userId` or `orderId` field  
**Solution**: Run migration script again or manually update orders

### Reviews Not Showing
**Cause**: Reviews may not be approved  
**Solution**: Check `isApproved` field in reviews collection

### Field Name Mismatches
**Cause**: Data created before migration  
**Solution**: Models automatically sync field names on save

## 📊 Database Collections

After implementation, your database will have:

| Collection | Purpose | Admin Access | User Access |
|------------|---------|--------------|-------------|
| `products` | Product catalog | Full CRUD | Read-only |
| `categories` | Product categories | Full CRUD | Read-only |
| `orders` | All orders | Read, Update status | Create, Read own |
| `reviews` | Product reviews | Read, Moderate | Create, Read approved |
| `users` | Customer accounts | Read-only | Own profile |
| `admins` | Admin accounts | Self-manage | No access |
| `carts` | Shopping carts | No access | Own cart |
| `cart_items` | Cart items | No access | Own items |
| `payments` | Payment records | Read-only | Own payments |
| `sessions` | User sessions | No access | Own session |
| `wishlists` | User wishlists | No access | Own wishlist |

## 🧪 Testing Checklist

- [ ] Admin can create products ✓
- [ ] Admin can update products ✓
- [ ] Admin can delete/deactivate products ✓
- [ ] Users can view active products ✓
- [ ] Users cannot create/edit products ✓
- [ ] Admin can create categories ✓
- [ ] Users can view active categories ✓
- [ ] Users can place orders ✓
- [ ] Admin can view all orders ✓
- [ ] Admin can update order status ✓
- [ ] Users can view their own orders ✓
- [ ] Users cannot view other users' orders ✓
- [ ] Users can create reviews ✓
- [ ] Users can view approved reviews ✓
- [ ] Admin can moderate reviews ✓
- [ ] Products show correct stock levels ✓
- [ ] Orders reference correct products ✓
- [ ] Reviews reference correct products ✓

## 🎯 Benefits Achieved

✅ **Single Source of Truth**: All data in one database  
✅ **No Data Duplication**: One collection per entity  
✅ **Real-Time Sync**: Changes reflect immediately  
✅ **Role-Based Security**: Proper access controls  
✅ **Backward Compatible**: Existing code continues to work  
✅ **Type Safe**: Field sync happens automatically  
✅ **Scalable**: Easy to add new fields or collections  
✅ **Maintainable**: Clear separation of concerns  

## 📝 Next Steps (Optional Enhancements)

1. **Add Audit Logging**: Track who changed what and when
2. **Add Field-Level Permissions**: More granular access control
3. **Add Data Validation**: Stricter schema validation
4. **Add Indexes**: Optimize query performance
5. **Add Caching**: Reduce database load
6. **Add Rate Limiting**: Prevent abuse
7. **Add Webhooks**: Notify external systems of changes
8. **Add GraphQL API**: Alternative to REST

## 🆘 Support

If you encounter any issues:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure both backends are running
4. Check database connectivity
5. Review the migration script output
6. Verify role assignments in User collection

## 📚 Related Documentation

- [SHARED_DATABASE_IMPLEMENTATION.md](./SHARED_DATABASE_IMPLEMENTATION.md) - Architecture details
- Admin Backend: [API_DOCUMENTATION.md](../admin-backend/API_DOCUMENTATION.md)
- User Backend: [docs/api-endpoints.md](./api-endpoints.md)
