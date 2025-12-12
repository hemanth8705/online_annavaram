# 🚀 Quick Start Guide - After Fixes

## ⚡ What Changed?

**5 major issues fixed:**
1. ✅ Auth refresh endpoint (422 error fixed)
2. ✅ Products/Cart routes (307 redirects fixed)
3. ✅ Cart item updates (404 error fixed)
4. ✅ Wishlist now stored in MongoDB
5. ✅ Logout clears all user data

---

## 🔄 Restart Your Servers

### Backend (FastAPI)
Stop the current server (Ctrl+C) and restart:
```powershell
cd backend
python -m uvicorn src.server:app --reload --port 4000
```

### Frontend (Vite)
Stop the current server (Ctrl+C) and restart:
```powershell
cd client
npm run dev
```

---

## 🧪 Quick Test (2 minutes)

1. **Open the app in browser**
2. **Login to your account**
3. **Check the FastAPI logs** - you should see:
   ```
   ✅ INFO: "POST /api/auth/login HTTP/1.1" 200 OK
   ✅ INFO: "GET /api/cart HTTP/1.1" 200 OK     (no 307!)
   ✅ INFO: "GET /api/products HTTP/1.1" 200 OK  (no 307!)
   ```

4. **Add a product to cart** - should work without 404
5. **Change quantity** - should work without 404
6. **Add to wishlist** - check FastAPI logs for:
   ```
   ✅ INFO: "POST /api/wishlist/toggle HTTP/1.1" 200 OK
   ```

7. **Logout** - Open DevTools → Application → Local Storage
   - Should be EMPTY (all data cleared!)

8. **Login again** - wishlist should load from backend

---

## 📊 What to Look For

### ✅ Success Indicators
- No 307 redirects in logs
- No 422 errors on refresh
- No 404 errors on cart updates
- Wishlist persists after logout → login
- localStorage cleared on logout

### ❌ Problems to Report
- Any 4xx or 5xx errors in FastAPI logs
- Console errors in browser
- Data not clearing on logout
- Wishlist not syncing

---

## 🔍 Monitoring Tips

### FastAPI Logs
Watch for these patterns:
```
✅ Good: "... HTTP/1.1" 200 OK
✅ Good: "... HTTP/1.1" 201 Created
⚠️  Check: "... HTTP/1.1" 307 Temporary Redirect  (shouldn't happen now)
❌ Bad: "... HTTP/1.1" 4XX Client Error
❌ Bad: "... HTTP/1.1" 5XX Server Error
```

### Browser Console
Open DevTools (F12) → Console tab:
```
✅ Good: [Cart] hydrating from backend
✅ Good: [Wishlist] Hydrating from backend
⚠️  Check: network-error messages
❌ Bad: Uncaught TypeError
❌ Bad: 404 errors
```

---

## 🆕 New API Endpoints

### Wishlist Endpoints
All require authentication (`Authorization: Bearer <token>`):

```http
GET    /api/wishlist           - Get wishlist items
POST   /api/wishlist           - Add to wishlist
POST   /api/wishlist/toggle    - Toggle wishlist item
DELETE /api/wishlist/:id        - Remove from wishlist
DELETE /api/wishlist            - Clear wishlist
```

### Test with curl:
```bash
# Get wishlist (replace TOKEN with your access token)
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/wishlist

# Add to wishlist
curl -X POST -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"productId":"YOUR_PRODUCT_ID"}' \
     http://localhost:4000/api/wishlist/toggle
```

---

## 📝 Testing Checklist

Quick 5-minute test:

- [ ] Start backend server
- [ ] Start frontend server  
- [ ] Login to account
- [ ] Check FastAPI logs for 200 status codes
- [ ] Add item to cart → Update quantity
- [ ] Add item to wishlist
- [ ] Refresh page → Wishlist should persist
- [ ] Logout → Check localStorage is empty
- [ ] Login again → Wishlist should load from backend

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found: Wishlist"
**Solution:** Restart the backend server completely

### Issue: "404 Not Found on wishlist"
**Solution:** Check that wishlist_router is imported in server.py

### Issue: Wishlist not persisting
**Solution:** Check if user is authenticated (accessToken present)

### Issue: Cart updates still 404
**Solution:** 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check item ID is valid ObjectId

---

## 💡 Pro Tips

1. **Keep FastAPI logs visible** while testing - you'll see exactly what's happening

2. **Use browser DevTools Network tab** to see API calls in real-time

3. **Check localStorage** after each action:
   - DevTools → Application → Local Storage → http://localhost:5173

4. **Test logout thoroughly** - it should clear EVERYTHING

5. **Test wishlist sync** - add items, logout, login - should reappear

---

## 📞 Need Help?

If you encounter issues:

1. **Check the logs** (both FastAPI and browser console)
2. **Note the exact error message**
3. **Try the same action with DevTools Network tab open**
4. **Check if the endpoint exists** (visit http://localhost:4000/api/docs)

---

## ✨ What's Better Now?

| Before | After |
|--------|-------|
| 422 errors on refresh | ✅ Works smoothly |
| 307 redirects on products | ✅ Direct routing |
| 404 on cart updates | ✅ Updates work |
| Wishlist in localStorage | ✅ MongoDB + sync |
| Data persists after logout | ✅ Completely cleared |

---

*Happy testing! 🎉*

*All changes are backward compatible - if something doesn't work, the app falls back gracefully.*
