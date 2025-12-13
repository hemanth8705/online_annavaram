# Admin Backend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Navigate to Admin Backend
```powershell
cd "h:\Manasa gari Website\online_annavaram\admin-backend"
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Configure Environment
```powershell
# Copy the example environment file
Copy-Item .env.example .env

# Edit .env file with your settings (optional - defaults work fine)
notepad .env
```

**Default Configuration (.env):**
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/annavaram_admin
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_EMAIL=admin@annavaram.com
ADMIN_PASSWORD=Admin@123
CLIENT_URL=http://localhost:5173
```

### Step 4: Start MongoDB
Make sure MongoDB is running on your system:
```powershell
# If using MongoDB service
Start-Service MongoDB

# OR if running manually
mongod --dbpath "C:\data\db"
```

### Step 5: Seed Database (Optional but Recommended)
```powershell
npm run seed
```

This will:
- Create the admin user
- Add sample categories (Telugu Snacks, Chocolates, etc.)
- Add sample products

### Step 6: Start Server
```powershell
# Development mode (with auto-reload)
npm run dev

# OR production mode
npm start
```

You should see:
```
═══════════════════════════════════════════════
  Admin E-Commerce Backend
═══════════════════════════════════════════════
  Server running on port: 5001
  Environment: development
  Database: mongodb://localhost:27017/annavaram_admin
...
```

### Step 7: Test the API
```powershell
# Run the test suite
npm run test
```

---

## 🎯 Quick API Test

### Test 1: Health Check
```powershell
curl http://localhost:5001/health
```

### Test 2: Login
```powershell
$body = @{
    email = "admin@annavaram.com"
    password = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$token = $response.data.token
Write-Host "Token: $token"
```

### Test 3: Get Products
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5001/api/products" `
    -Method Get `
    -Headers $headers
```

---

## 📁 What You Have Now

After completing the setup, you have:

### ✅ Phase 0 Features
- **Admin Authentication**: Login with JWT tokens
- **Category Management**: Create, update, enable/disable categories
- **Product Management**: Full CRUD with stock management
- **Stock Safety**: Auto-disable products when stock = 0

### ✅ Phase 1 Features
- **Order Management**: View and update order status
- **Review Management**: View and edit customer reviews
- **Statistics**: Order and review analytics

---

## 🔑 Default Credentials

```
Email: admin@annavaram.com
Password: Admin@123
```

**⚠️ IMPORTANT:** Change these credentials in production!

---

## 📚 Next Steps

1. **Read API Documentation**: See `API_DOCUMENTATION.md` for full API details

2. **Customize Categories**: Add your own product categories
   ```powershell
   POST /api/categories
   ```

3. **Add Products**: Create products with proper images and pricing
   ```powershell
   POST /api/products
   ```

4. **Test Order Flow**: Manually create test orders to test status updates

5. **Build Admin Frontend**: Use these APIs to build a React/Vue admin panel

---

## 🛠️ Useful Commands

```powershell
# Start development server (auto-reload)
npm run dev

# Start production server
npm start

# Seed database with sample data
npm run seed

# Run API tests
npm run test
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
**Problem:** `Error: connect ECONNREFUSED`  
**Solution:** Make sure MongoDB is running
```powershell
Start-Service MongoDB
# OR
mongod --dbpath "C:\data\db"
```

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::5001`  
**Solution:** Change PORT in `.env` file or kill the process using port 5001
```powershell
# Find process using port 5001
netstat -ano | findstr :5001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Admin User Not Created
**Problem:** Can't login with default credentials  
**Solution:** Run the seed script
```powershell
npm run seed
```

### JWT Token Expired
**Problem:** `Token expired. Please login again.`  
**Solution:** Login again to get a new token (tokens expire after 7 days)

---

## 📊 Sample Workflow

Here's a typical admin workflow:

1. **Login** → Get JWT token
2. **Create Categories** → Telugu Snacks, Chocolates, etc.
3. **Add Products** → Add products with category, price, stock, images
4. **View Orders** → Check customer orders
5. **Update Order Status** → Mark as dispatched, delivered, etc.
6. **Manage Reviews** → Edit or delete inappropriate reviews
7. **Check Statistics** → View order and review stats

---

## 🔐 Security Notes

- JWT tokens are valid for 7 days
- Passwords are hashed using bcryptjs
- All admin routes require authentication
- CORS is configured for specified client URL
- Change default admin credentials in production!

---

## 📞 Need Help?

1. Check `README.md` for detailed documentation
2. Read `API_DOCUMENTATION.md` for API reference
3. Review error messages in console
4. Check MongoDB connection and logs

---

## ✨ You're All Set!

Your admin backend is now running and ready to manage your e-commerce platform. Start by exploring the API endpoints or build a frontend to interact with these APIs.

**Server URL:** `http://localhost:5001`  
**API Base:** `http://localhost:5001/api`  
**Health Check:** `http://localhost:5001/health`
