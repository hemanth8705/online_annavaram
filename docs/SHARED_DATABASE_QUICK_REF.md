# Shared Database - Quick Reference

## Database Connection

Both backends connect to the same MongoDB database:
```
mongodb+srv://hemanth:hemanth@cluster0.jnclnxy.mongodb.net/online_annavaram
```

## Collection Names (Unified)

| Collection | Admin Access | User Access | Notes |
|------------|--------------|-------------|-------|
| `products` | Full CRUD | Read-only (active) | Single source of truth |
| `categories` | Full CRUD | Read-only (active) | Managed by admin only |
| `orders` | Read, Update status | Create, Read own | Users create, admin manages |
| `reviews` | Read, Moderate | Create, Read approved | Users create, admin moderates |
| `users` | Read-only | Own profile CRUD | Customer accounts |
| `admins` | Self-manage | No access | Admin accounts (separate) |
| `carts` | No access | Own cart CRUD | User-only |
| `cart_items` | No access | Own items CRUD | User-only |
| `payments` | Read-only | Own payments | Payment tracking |
| `sessions` | No access | Own session | Authentication |
| `wishlists` | No access | Own wishlist | User feature |

## Field Naming Compatibility

Models support both naming conventions automatically:

### Products
- `stock` ↔ `totalStock` (synced)
- `imageUrl` ↔ `images[0]` (synced)
- `category` (name) ↔ `categoryId` (reference)

### Orders
- `userId` ↔ `user` (synced)
- `products` ↔ `items` (synced)
- Product items: `productId` ↔ `product` (synced)

### Reviews
- `userId` ↔ `user` (synced)
- `productId` ↔ `product` (synced)
- `reviewText` ↔ `comment` (synced)

## Status Enums

### Order Status (Unified)
```
pending_payment    → Order created, awaiting payment
pending           → Payment processing
paid              → Payment confirmed (user backend)
order_created     → Order created (admin backend)
payment_confirmed → Payment verified
dispatched        → Order shipped from warehouse
shipped           → In transit (user backend)
reached_city      → Arrived at destination city
out_for_delivery  → Out for final delivery
delivered         → Successfully delivered
cancelled         → Order cancelled
```

## Role-Based Permissions

### Admin Can:
- ✅ Create/update/delete products
- ✅ Create/update/delete categories
- ✅ View all orders
- ✅ Update order status
- ✅ View all reviews
- ✅ Approve/delete reviews
- ✅ View all users (read-only)

### User Can:
- ✅ View active products only
- ✅ View active categories only
- ✅ Create orders
- ✅ View own orders only
- ✅ Create reviews
- ✅ View approved reviews only
- ❌ Cannot edit products/categories
- ❌ Cannot update order status
- ❌ Cannot edit/delete reviews after creation

### User Cannot See:
- Inactive products (`isActive: false`)
- Deleted products (`isDeleted: true`)
- Unapproved reviews (`isApproved: false`)
- Deleted reviews (`isDeleted: true`)
- Other users' orders
- Other users' carts

## API Endpoints

### Admin Backend (Port 5001)
```
POST   /api/products              - Create product
GET    /api/products              - List all products
GET    /api/products/:id          - Get product details
PUT    /api/products/:id          - Update product
DELETE /api/products/:id          - Delete product

POST   /api/categories            - Create category
GET    /api/categories            - List all categories
PUT    /api/categories/:id        - Update category
DELETE /api/categories/:id        - Delete category

GET    /api/orders                - List all orders
GET    /api/orders/:id            - Get order details
PUT    /api/orders/:id/status     - Update order status

GET    /api/reviews               - List all reviews
PUT    /api/reviews/:id           - Update review
DELETE /api/reviews/:id           - Delete review
```

### User Backend (Port 4000)
```
GET    /api/products              - List active products
GET    /api/products/:id          - Get product details

GET    /api/categories            - List active categories

POST   /api/orders                - Create order
GET    /api/orders                - List own orders
GET    /api/orders/:id            - Get own order details

POST   /api/reviews               - Create review
GET    /api/reviews               - List approved reviews
GET    /api/products/:id/reviews  - Get product reviews

GET    /api/cart                  - Get own cart
POST   /api/cart/items            - Add to cart
PUT    /api/cart/items/:id        - Update cart item
DELETE /api/cart/items/:id        - Remove from cart
```

## Migration Checklist

- [x] Update admin backend models
- [x] Update user backend models
- [x] Add RBAC middleware
- [x] Create migration script
- [x] Update environment variables
- [x] Create implementation guides
- [ ] Run database migration
- [ ] Test admin product creation
- [ ] Test user product viewing
- [ ] Test order flow (user → admin)
- [ ] Test review flow (user → admin)
- [ ] Deploy to production

## Common Queries

### Get Active Products for Users
```javascript
// Admin Backend
Product.find({ isActive: true, isDeleted: false })
```
```python
# User Backend
Product.find(Product.isActive == True, Product.isDeleted == False)
```

### Get All Orders for Admin
```javascript
// Admin Backend
Order.find({}).sort({ createdAt: -1 })
```

### Get User's Own Orders
```javascript
// Admin Backend
Order.find({ userId: userId })
```
```python
# User Backend
Order.find(Order.user == user_id).sort(-Order.createdAt)
```

### Get Approved Reviews for Product
```javascript
// Admin Backend
Review.find({ productId: productId, isApproved: true, isDeleted: false })
```
```python
# User Backend
Review.find(
    Review.product == product_id,
    Review.isApproved == True,
    Review.isDeleted == False
)
```

## Environment Variables

### Admin Backend (.env)
```env
PORT=5001
MONGODB_URI=mongodb+srv://hemanth:hemanth@cluster0.jnclnxy.mongodb.net/online_annavaram
JWT_SECRET=hemanth8705
ADMIN_EMAIL=admin@annavaram.com
ADMIN_PASSWORD=Admin@123
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

### User Backend (.env)
```env
PORT=4000
MONGODB_URI=mongodb+srv://hemanth:hemanth@cluster0.jnclnxy.mongodb.net/
MONGODB_DB_NAME=online_annavaram
JWT_ACCESS_SECRET=qwertyuiop
JWT_REFRESH_SECRET=asdfghjkl
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://online-annavaram.vercel.app
```

## Troubleshooting

### Issue: Products not appearing in user app
**Check**: `isActive` and `isDeleted` flags  
**Fix**: Update product in admin backend

### Issue: Orders not visible to admin
**Check**: `userId` or `orderId` field exists  
**Fix**: Re-run migration script

### Issue: Reviews not showing
**Check**: `isApproved` and `isDeleted` flags  
**Fix**: Approve review in admin backend

### Issue: Field sync not working
**Check**: Model pre-save hooks are running  
**Fix**: Ensure documents are saved, not just updated

## Performance Tips

1. **Index Key Fields**: Products, orders, and reviews are indexed on key fields
2. **Filter Early**: Apply `isActive` and `isDeleted` filters at database level
3. **Limit Results**: Use pagination for large datasets
4. **Cache Categories**: Categories change infrequently, can be cached
5. **Batch Updates**: Use bulk operations for mass updates

## Security Notes

1. **Never expose admin endpoints** to user frontend
2. **Always validate user role** before sensitive operations
3. **Validate input data** on both frontends and backends
4. **Use HTTPS** in production
5. **Rotate JWT secrets** regularly
6. **Monitor failed auth attempts**
7. **Sanitize user inputs** to prevent injection attacks

## Contact

For issues or questions about the shared database implementation, refer to:
- [SHARED_DATABASE_GUIDE.md](./SHARED_DATABASE_GUIDE.md) - Full implementation guide
- [SHARED_DATABASE_IMPLEMENTATION.md](./SHARED_DATABASE_IMPLEMENTATION.md) - Architecture details
