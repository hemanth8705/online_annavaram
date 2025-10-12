# API Endpoints — Online Annavaram

Base URL: `/api`

Authentication: send header `x-user-id` with a valid MongoDB ObjectId referencing a `User` document. Admin-only routes additionally require that user to have `role: "admin"`.

Standard Error Shape:
```json
{ "success": false, "message": "Explanation", "details": { "field": "reason" } }
```

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
    "payment": { "_id": "...", "gateway": "manual", "status": "initiated" }
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
- Response `200`: `{ "success": true, "data": [ { "user": { "fullName": "..." }, ... } ] }`

## Utility

### `GET /test`
- Description: Health check returning DB connection status.
- Response `200`: `{ "message": "Test endpoint is working", "database": "connected", "timestamp": "..." }`

## Local Testing Helpers
- `npm run seed` — resets database with demo data.
- `npm run test:api` — runs scripted smoke tests covering product, cart, order, and admin flows.
