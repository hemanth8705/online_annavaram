# API Endpoints - Online Annavaram

Base URL: `/api`

Authentication: send `Authorization: Bearer <accessToken>` on protected endpoints. Access tokens are issued by `/auth/login` and refreshed with `/auth/refresh`. Refresh tokens are stored as HttpOnly cookies and rotated automatically. Admin-only routes additionally require the authenticated user to have `role: "admin"`.

Standard Error Shape:
```json
{ "success": false, "message": "Explanation", "details": { "field": "reason" } }
```

## Authentication

### `POST /auth/signup`
- Description: Create an account and trigger an email OTP.
- Body:
```json
{ "fullName": "Sita Lakshmi", "email": "sita@example.com", "password": "passw0rd!", "phone": "9999999901" }
```
- Response `201`: `{ "success": true, "message": "Signup successful. Please verify..." }`

### `POST /auth/verify-email`
- Description: Verify the OTP sent to the user's email.
- Body:
```json
{ "email": "sita@example.com", "otp": "123456" }
```
- Response `200`: `{ "success": true, "message": "Email verified successfully." }`

### `POST /auth/resend-otp`
- Description: Request another OTP (max 3 sends per 24 hours).
- Body: `{ "email": "sita@example.com" }`
- Response `200`: `{ "success": true, "message": "A new OTP has been sent..." }`

### `POST /auth/login`
- Description: Password login (requires verified email). Returns an access token in the response body and sets a refresh token cookie.
- Body:
```json
{ "email": "sita@example.com", "password": "passw0rd!" }
```
- Response `200`:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresAt": "2025-10-27T09:45:30.000Z",
    "session": {
      "id": "67203456893a8b34f0ab9051",
      "expiresAt": "2025-11-24T09:15:30.000Z",
      "createdAt": "2025-10-27T09:15:30.000Z",
      "updatedAt": "2025-10-27T09:15:30.000Z"
    },
    "user": {
      "id": "671f2b8b9d1d27c8d12c0a61",
      "fullName": "Sita Lakshmi",
      "email": "sita@example.com",
      "role": "customer"
    }
  }
}
```
- Errors: `403` if email not verified, `401` for invalid credentials.

### `POST /auth/refresh`
- Description: Exchanges the HttpOnly refresh token cookie for a new access token (automatically rotates the refresh token). Call with `credentials: "include"` from the browser.
- Response `200`: same shape as `POST /auth/login` with updated token/session timestamps.
- Errors: `401` if the refresh token is missing, expired, or revoked.

### `POST /auth/forgot-password`
- Description: Send a password reset OTP to a verified email.
- Body: `{ "email": "sita@example.com" }`
- Response `200`: `{ "success": true, "message": "If an account exists, a password reset code has been sent." }`

### `POST /auth/reset-password`
- Description: Verify OTP and set a new password.
- Body:
```json
{ "email": "sita@example.com", "otp": "654321", "newPassword": "NewPass123!" }
```
- Response `200`: `{ "success": true, "message": "Password updated successfully." }`

### `POST /payments/razorpay/verify`
- Description: Confirm a Razorpay payment and mark the order as paid.
- Headers: `Authorization: Bearer <accessToken>`
- Body:
```json
{
  "orderId": "<mongo order id>",
  "razorpayOrderId": "order_ABC123",
  "razorpayPaymentId": "pay_DEF456",
  "razorpaySignature": "<signature>"
}
```
- Response `200`: `{ "success": true, "data": { "order": { ... }, "payment": { ... } } }`

## Products

### `GET /products`
- Description: List products with pagination and optional filters.
- Query params:
  - `page` (number, default 1)
  - `limit` (number, default 12, max 100)
  - `search` (string, matches name/description/category)
  - `category` (string)
  - `isActive` (`true` or `false`)
- Response `200`:
```json
{
  "success": true,
  "data": [ { "name": "...", "price": 49900, ... } ],
  "meta": { "page": 1, "limit": 12, "totalPages": 1, "totalItems": 2 }
}
```

### `GET /products/:id`
- Description: Fetch single product by id.
- Response `200`: `{ "success": true, "data": { ... } }`
- Errors:
  - `400` invalid id
  - `404` not found

### `POST /products` (admin)
- Description: Create a product.
- Body (JSON):
```json
{
  "name": "Organic Palm Jaggery",
  "slug": "organic-palm-jaggery",
  "description": "Traditionally prepared jaggery...",
  "price": 49900,
  "currency": "INR",
  "stock": 120,
  "category": "jaggery",
  "images": ["https://.../jaggery.jpg"],
  "isActive": true
}
```
- Response `201`: `{ "success": true, "data": { ... } }`

### `PUT /products/:id` (admin)
- Description: Update product fields (partial).
- Body: any subset of fields used in create.
- Response `200`: `{ "success": true, "data": { ...updated... } }`

### `DELETE /products/:id` (admin)
- Description: Permanently remove product.
- Response `200`: `{ "success": true, "message": "Product deleted" }`

## Cart (authenticated)

### `GET /cart`
- Description: Fetch active cart for current user (creates one if missing).
- Response `200`:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "active",
    "items": [
      {
        "id": "...",
        "productId": "...",
        "name": "Organic Palm Jaggery",
        "quantity": 2,
        "unitPrice": 49900,
        "subtotal": 99800,
        "productSnapshot": { "slug": "...", "stock": 120, ... }
      }
    ],
    "totals": { "quantity": 2, "amount": 99800 }
  }
}
```

### `POST /cart/items`
- Description: Add product to cart (increments quantity if already present).
- Body:
```json
{ "productId": "...", "quantity": 2 }
```
- Response `201`: cart payload (same shape as `GET /cart`).

### `PATCH /cart/items/:itemId`
- Description: Update quantity (set to 0 to remove).
- Body: `{ "quantity": 3 }`
- Response `200`: cart payload.

### `DELETE /cart/items/:itemId`
- Description: Remove item from cart.
- Response `200`: cart payload.

## Orders (authenticated)

### `POST /orders`
- Description: Create order from active cart; reduces product stock and clears cart.
- Body:
```json
{
  "shippingAddress": {
    "name": "Sita Lakshmi",
    "phone": "9999999901",
    "line1": "12-34 Main Road",
    "line2": "Near Temple Street",
    "city": "Annavaram",
    "state": "Andhra Pradesh",
    "postalCode": "533406",
    "country": "IN"
  },
  "notes": "Leave at the front gate"
}
```
- Response `201`:
```json
{
  "success": true,
  "data": {
    "order": { "_id": "...", "status": "pending_payment", ... },
    "items": [ { "productName": "...", "quantity": 3, "subtotal": 149700 }, ... ],
    "payment": { "_id": "...", "gateway": "razorpay", "status": "initiated" },
    "razorpay": { "orderId": "order_ABC123", "amount": 189700, "currency": "INR", "keyId": "rzp_test_xxx" }
  }
}
```

### `GET /orders`
- Description: List orders for current user, newest first.
- Response `200`: `{ "success": true, "data": [ ... ] }`

### `GET /orders/:id`
- Description: Fetch order + items for current user.
- Response `200`: `{ "success": true, "data": { "order": { ... }, "items": [ ... ] } }`
- Errors: `404` if order does not belong to user or missing.

## Admin

### `GET /admin/orders` (admin)
- Description: List all orders with user info.
- Headers: `Authorization: Bearer <accessToken>`
- Response `200`: `{ "success": true, "data": [ { "user": { "fullName": "..." }, ... } ] }`

## Utility

### `GET /api/test`
- Description: Health check returning DB connection status.
- Response `200`: `{ "message": "Test endpoint is working", "database": "connected", "timestamp": "..." }`

### `GET /api/docs`
- Description: Interactive Swagger UI explorer. No authentication required.

### `GET /api/docs.json`
- Description: Raw OpenAPI specification consumed by the Swagger UI.

## Local Testing Helpers
- `npm run seed` — resets database with demo data.
- `npm run test:api` — runs scripted smoke tests covering product, cart, order, and admin flows.
