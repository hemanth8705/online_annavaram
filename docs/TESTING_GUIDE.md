# Quick Start & Testing Guide

## 🚀 Quick Start (5 Minutes)

### 1. Setup Environment Files

**Backend** (`backend/.env`):
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/online_annavaram
JWT_ACCESS_SECRET=your-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this-too
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_SECRET=your_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Online Annavaram <your-email@gmail.com>"
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend** (`client/.env`):
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 2. Install & Run

**Terminal 1 - Backend:**
```powershell
cd backend
python -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.server:app --reload --port 4000
```

**Terminal 2 - Frontend:**
```powershell
cd client
npm install
npm run dev
```

### 3. Verify Running
- Backend: http://localhost:4000/api/docs
- Frontend: http://localhost:5173

---

## ✅ Test Flow Scenarios

### Scenario 1: Guest User Flow (No Login)
```
1. Visit http://localhost:5173
2. Click "Browse Products" or navigate to /products
3. Click "Add to Cart" on any product
   ✅ Cart count increases in header
   ✅ Button changes to quantity controls
4. Click "Go to Cart"
   ✅ Cart page shows items
   ✅ Can update quantities
   ✅ Totals calculate correctly
5. Try to checkout
   ⚠️  Should prompt to login (or allow guest checkout with local storage)
```

**Expected Behavior**: 
- Products load from backend
- Cart stores items in localStorage
- All operations work offline

### Scenario 2: Complete User Journey
```
1. Register Account
   - Navigate to /auth/signup
   - Fill form and submit
   - Check email for OTP
   - Go to /auth/verify and enter OTP
   ✅ Account verified

2. Login
   - Navigate to /auth/login
   - Enter credentials
   ✅ Redirects to home
   ✅ Name appears in header
   ✅ Token stored in localStorage

3. Shop
   - Browse /products
   - Filter by category
   - Click product → /products/:id
   - Click "Add to Cart"
   ✅ Item added via API (check Network tab)
   ✅ Authorization header present

4. Manage Cart
   - Navigate to /cart
   - Update quantities
   - Remove items
   ✅ All changes sync to backend
   ✅ Page refresh preserves cart

5. Checkout
   - Click "Checkout" from cart
   - Fill shipping address
   - Click "Place Order"
   ✅ Razorpay modal opens
   - Complete payment (test mode)
   ✅ Redirects to /order/success
   ✅ Order details displayed
   ✅ Cart cleared

6. Logout
   - Click "Logout"
   ✅ Token removed
   ✅ Redirects to home
   ✅ Cart switches to localStorage
```

### Scenario 3: API Integration Test
```powershell
# 1. Test product listing
Invoke-RestMethod -Uri "http://localhost:4000/api/products"

# 2. Login and get token
$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `
    -Method POST -Body $loginData -ContentType "application/json"

$token = $response.data.accessToken
Write-Host "Token: $token"

# 3. Test authenticated cart endpoint
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:4000/api/cart" -Headers $headers

# 4. Add item to cart
$cartItem = @{
    productId = "your-product-id-here"
    quantity = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/cart/items" `
    -Method POST -Body $cartItem -Headers $headers -ContentType "application/json"
```

---

## 🔍 Verification Checklist

### Backend Health Checks
```powershell
# Check server is running
Invoke-RestMethod -Uri "http://localhost:4000/"

# Check API docs accessible
Start-Process "http://localhost:4000/api/docs"

# Check MongoDB connection
# Should see "MongoDB connection established" in terminal
```

### Frontend Health Checks
```powershell
# Check dev server running
# Visit http://localhost:5173

# Open browser console (F12)
# Should see: [api] Using API_BASE_URL: http://localhost:4000/api
```

### Integration Checks
- [ ] Products page loads data (check Network tab)
- [ ] Add to cart sends Authorization header (when logged in)
- [ ] Cart operations return 200 status
- [ ] Checkout creates order successfully
- [ ] Payment verification works
- [ ] Token persists on page refresh

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "MongoDB connection failed"**
```powershell
# Start MongoDB locally
mongod

# Or check if service is running
Get-Service -Name MongoDB
```

**Error: "SMTP authentication failed"**
```
Solution: 
1. For Gmail, enable 2FA
2. Generate App Password
3. Use App Password in SMTP_PASS
```

**Error: "Port 4000 already in use"**
```powershell
# Find and kill process
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Or change PORT in .env
```

### Frontend Issues

**Error: "Failed to fetch" in console**
```
Solution:
1. Check backend is running on port 4000
2. Verify VITE_API_BASE_URL in client/.env
3. Check CORS_ALLOWED_ORIGINS includes http://localhost:5173
```

**Error: "401 Unauthorized" on cart/orders**
```
Solution:
1. Login to get access token
2. Check localStorage has 'online-annavaram@access-token'
3. Verify token is not expired (15 min default)
```

**Error: Cart not persisting**
```
Solution:
1. Check localStorage in DevTools (Application tab)
2. Verify 'online-annavaram@cart' exists for offline mode
3. When logged in, cart should sync to backend
```

### Database Issues

**Need to reset database**
```javascript
// Connect to MongoDB
mongosh mongodb://127.0.0.1:27017/online_annavaram

// Drop all collections
db.dropDatabase()

// Restart backend to recreate collections
```

**View database contents**
```javascript
mongosh mongodb://127.0.0.1:27017/online_annavaram

show collections
db.users.find().pretty()
db.products.find().pretty()
db.carts.find().pretty()
db.orders.find().pretty()
```

---

## 🧪 Testing Best Practices

### 1. Always Test in This Order
1. Backend health → Frontend health → Integration
2. Guest flow → Authenticated flow
3. Success paths → Error paths

### 2. Use Browser DevTools
- **Network Tab**: Verify API calls, headers, responses
- **Console Tab**: Check for errors, warnings
- **Application Tab**: Inspect localStorage, cookies

### 3. Monitor Backend Logs
- Watch terminal for request logs
- Check for errors or warnings
- Verify MongoDB queries executing

### 4. Test Error Scenarios
- Try invalid login credentials
- Add invalid product IDs
- Test with expired tokens
- Simulate network errors (offline mode)

---

## 📊 Expected API Responses

### Successful Login
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGc...",
    "accessTokenExpiresAt": "2025-12-11T10:00:00.000Z",
    "user": {
      "id": "675...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "session": {
      "id": "675...",
      "expiresAt": "2025-12-18T09:00:00.000Z"
    }
  }
}
```

### Cart Response
```json
{
  "success": true,
  "data": {
    "id": "675...",
    "status": "active",
    "items": [
      {
        "id": "item123",
        "productId": "prod456",
        "name": "Palm Jaggery",
        "quantity": 2,
        "unitPrice": 49900,
        "subtotal": 99800,
        "productSnapshot": {
          "category": "jaggery",
          "images": ["..."],
          "slug": "palm-jaggery",
          "stock": 50
        }
      }
    ],
    "totals": {
      "quantity": 2,
      "amount": 99800
    }
  }
}
```

### Order Creation
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "675...",
      "status": "pending_payment",
      "totalAmount": 99800,
      "currency": "INR",
      "shippingAddress": {...}
    },
    "items": [...],
    "payment": {
      "_id": "675...",
      "gateway": "razorpay",
      "status": "initiated"
    },
    "razorpay": {
      "orderId": "order_ABC123",
      "amount": 99800,
      "currency": "INR",
      "keyId": "rzp_test_..."
    }
  }
}
```

---

## 🎯 Success Criteria

Your integration is working correctly when:

✅ All API calls return 200/201 status codes  
✅ Authorization headers present on protected routes  
✅ Products load and display on frontend  
✅ Cart syncs between frontend and backend  
✅ Orders create successfully  
✅ Razorpay checkout opens and processes payments  
✅ Database shows correct data after operations  
✅ No console errors in browser  
✅ No exceptions in backend logs  
✅ Token persists across page refreshes  

---

## 📞 Need Help?

1. Check INTEGRATION_ANALYSIS.md for detailed architecture
2. Review docs/api-endpoints.md for API documentation
3. Inspect backend logs for error details
4. Use browser DevTools Network tab to debug API calls
5. Test individual API endpoints with Postman/cURL first

---

**Last Updated**: December 11, 2025  
**Version**: 1.0
