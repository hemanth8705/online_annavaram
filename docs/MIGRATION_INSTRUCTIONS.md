# Database Migration Instructions

## ⚠️ IMPORTANT: Read Before Running Migration

This migration script will:
- ✅ Create backups of existing collections
- ✅ Consolidate `adminproducts` → `products`
- ✅ Update all product references in orders and reviews
- ✅ Sync field naming across all documents
- ✅ Add missing fields with default values

**Estimated Time**: 2-5 minutes (depending on data volume)

---

## 🔍 Pre-Migration Checklist

Before running the migration, ensure:

- [ ] **Database backup created** (see below)
- [ ] **Both backends are stopped** (no active connections)
- [ ] **Environment variables are correct** (check `.env` files)
- [ ] **Node.js is installed** (v14 or higher)
- [ ] **MongoDB connection is stable** (test connection first)
- [ ] **You have database admin access**

---

## 📦 Step 1: Create Full Backup

### Option A: Using MongoDB Atlas UI
1. Go to MongoDB Atlas dashboard
2. Select your cluster
3. Click "..." → "Take Snapshot Now"
4. Wait for snapshot to complete

### Option B: Using mongodump
```bash
# Install MongoDB tools if not installed
# Windows: Download from https://www.mongodb.com/try/download/database-tools

# Create backup
mongodump --uri="mongodb+srv://hemanth:hemanth@cluster0.jnclnxy.mongodb.net/online_annavaram" --out=./backup_$(date +%Y%m%d_%H%M%S)
```

---

## 🚀 Step 2: Run Migration Script

### Navigate to Admin Backend
```powershell
cd "h:\Manasa gari Website\online_annavaram\admin-backend"
```

### Install Dependencies (if needed)
```powershell
npm install
```

### Run Migration
```powershell
node src/scripts/migrate-database.js
```

### Expected Output
```
🚀 Starting database migration...
✅ Connected to MongoDB

🔄 Migrating products...
Found 50 admin products and 45 user products
✅ Migrated 75 products successfully

🔄 Migrating categories...
Found 10 categories
✅ Updated 10 categories successfully

🔄 Migrating orders...
Found 120 orders
✅ Updated 120 orders successfully

🔄 Migrating reviews...
Found 85 reviews
✅ Updated 85 reviews successfully

✅ Migration completed successfully!

Backup collections created:
  - adminproducts_backup
  - products_backup

You can safely delete these after verifying the migration.
```

---

## ✅ Step 3: Verify Migration

### Check Products
```javascript
// Connect to MongoDB Atlas or use MongoDB Compass
use online_annavaram

// Count products
db.products.countDocuments()

// Sample product with all fields
db.products.findOne()

// Verify no admin products remain
db.adminproducts.countDocuments() // Should be 0 or error
```

### Check Orders
```javascript
// Verify orders have correct product references
db.orders.findOne({ products: { $exists: true, $ne: [] } })

// Check userId/user sync
db.orders.findOne({ userId: { $exists: true } })
```

### Check Reviews
```javascript
// Verify reviews have all fields
db.reviews.findOne()

// Check approved reviews
db.reviews.countDocuments({ isApproved: true })
```

### Check Categories
```javascript
// Verify categories have slugs
db.categories.find({ slug: { $exists: true } })
```

---

## 🔧 Step 4: Update Application Code

### Admin Backend - No code changes needed!
The models are already updated. Just restart:
```powershell
cd admin-backend
npm start
```

### User Backend - No code changes needed!
The models are already updated. Just restart:
```powershell
cd backend
.\\env\\Scripts\\Activate.ps1
python -m uvicorn src.server:app --reload --port 4000
```

---

## 🧪 Step 5: Test Everything

### Test Product Management
1. **Admin**: Create a new product
   - Go to admin panel → Products → Add New
   - Fill details and save
   
2. **User**: View the product
   - Go to user website → Products
   - Verify new product appears
   
3. **Admin**: Update product stock
   - Go to admin panel → Products → Edit
   - Change stock quantity
   
4. **User**: Verify updated stock
   - Refresh product page
   - Check stock shows correct value

### Test Order Flow
1. **User**: Place an order
   - Add products to cart
   - Complete checkout
   
2. **Admin**: View the order
   - Go to admin panel → Orders
   - Verify order appears with correct details
   
3. **Admin**: Update order status
   - Change status to "Dispatched"
   - Save changes
   
4. **User**: Check order status
   - Go to My Orders
   - Verify status updated

### Test Review System
1. **User**: Submit a review
   - Go to product page
   - Write and submit review
   
2. **Admin**: View the review
   - Go to admin panel → Reviews
   - Verify review appears
   
3. **Admin**: Moderate review
   - Approve or delete review
   
4. **User**: Check review visibility
   - Refresh product page
   - Verify moderation reflected

---

## 🐛 Troubleshooting

### Issue: Migration script fails with "Cannot connect to MongoDB"
**Solution**:
1. Check internet connection
2. Verify MongoDB URI in `.env` file
3. Check MongoDB Atlas whitelist (allow your IP)
4. Try connecting with MongoDB Compass

### Issue: "Duplicate key error" during migration
**Solution**:
1. Check if migration already ran
2. Check `products` collection for existing data
3. If needed, manually clear `products` collection:
   ```javascript
   db.products.deleteMany({})
   ```
4. Re-run migration

### Issue: Products appear in admin but not in user app
**Solution**:
1. Check product `isActive` flag:
   ```javascript
   db.products.updateMany({}, { $set: { isActive: true } })
   ```
2. Check product `isDeleted` flag:
   ```javascript
   db.products.updateMany({}, { $set: { isDeleted: false } })
   ```
3. Restart user backend

### Issue: Orders not showing in admin
**Solution**:
1. Check order collection:
   ```javascript
   db.orders.find().limit(5)
   ```
2. Verify `userId` or `user` field exists
3. Re-run migration if needed

### Issue: Field sync not working
**Solution**:
1. Check model files are updated
2. Restart both backends
3. Clear any caches
4. Test by creating new document

---

## 🔄 Rollback Procedure (If Needed)

If something goes wrong and you need to rollback:

### Option A: Restore from Backup Collections
```javascript
use online_annavaram

// Restore products
db.products.drop()
db.products_backup.aggregate([
  { $match: {} },
  { $out: "products" }
])

// Restore admin products
db.adminproducts_backup.aggregate([
  { $match: {} },
  { $out: "adminproducts" }
])
```

### Option B: Restore from MongoDB Snapshot
1. Go to MongoDB Atlas dashboard
2. Select your cluster
3. Click "Backup" tab
4. Select snapshot created before migration
5. Click "Restore"

### Option C: Restore from mongodump
```bash
mongorestore --uri="mongodb+srv://hemanth:hemanth@cluster0.jnclnxy.mongodb.net/online_annavaram" --drop ./backup_YYYYMMDD_HHMMSS
```

---

## 🧹 Step 6: Cleanup (After Verification)

Once everything is working correctly (wait at least 24-48 hours):

### Delete Backup Collections
```javascript
use online_annavaram

// List backup collections
db.getCollectionNames().filter(name => name.includes('_backup'))

// Delete backups (BE SURE EVERYTHING WORKS FIRST!)
db.products_backup.drop()
db.adminproducts_backup.drop()
```

### Delete Old adminproducts Collection (if exists)
```javascript
// Only if migration was successful and verified
db.adminproducts.drop()
```

---

## 📊 Migration Statistics

Track these metrics during migration:

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| Collections | 11 | 11 | Same count |
| Products (admin) | X | 0 | Merged into products |
| Products (user) | Y | X+Y | Unified collection |
| Orders | Z | Z | Updated references |
| Reviews | W | W | Updated references |
| Database Size | ? MB | ? MB | Should be similar |

---

## 📞 Support

If you encounter issues during migration:

1. **Check logs**: Both backends log errors
2. **Review documentation**: See `SHARED_DATABASE_GUIDE.md`
3. **Verify connections**: Test with MongoDB Compass
4. **Check backups**: Ensure backups exist before proceeding
5. **Document errors**: Note exact error messages

---

## ✅ Post-Migration Checklist

After migration and testing:

- [ ] All products visible in both admin and user apps
- [ ] New products created by admin appear in user app
- [ ] Orders created by users appear in admin dashboard
- [ ] Order status updates reflect in user app
- [ ] Reviews created by users appear in admin dashboard
- [ ] Review moderation works correctly
- [ ] No errors in backend logs
- [ ] Database size is reasonable
- [ ] Backup collections exist
- [ ] Performance is acceptable

---

## 🎉 Success Criteria

Migration is successful when:

1. ✅ No errors in migration script output
2. ✅ All products accessible from both backends
3. ✅ Orders flow correctly from user to admin
4. ✅ Reviews flow correctly from user to admin
5. ✅ Role-based access works as expected
6. ✅ No data loss (count before = count after)
7. ✅ Application performance is normal
8. ✅ Backup collections created successfully

---

**Last Updated**: December 14, 2025  
**Version**: 1.0.0  
**Status**: Ready for Production
