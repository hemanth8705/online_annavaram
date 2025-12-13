# Admin Client - E-commerce Management Panel

A minimal, form-focused admin panel for managing the e-commerce platform. Built with React, Vite, and Tailwind CSS.

## Features

### Authentication
- Admin login with email/password
- JWT token-based authentication
- Protected routes with auto-redirect

### Dashboard
- Order statistics (total, revenue, average value)
- Product count
- Quick navigation cards
- Real-time data from backend API

### Category Management
- Create, view, update, delete categories
- Toggle category active/inactive status
- Validation: unique names, required fields

### Product Management
- Full CRUD operations for products
- Product fields: name, category, price, stock, image URL
- Unlimited purchase toggle
- Max units per order (when not unlimited)
- Search by product name
- Filter by category
- Toggle product active/inactive status
- Real-time stock and price updates

### Order Management
- View all orders with filters (status, date range)
- Order statistics dashboard
- Order details page with:
  - Full order information
  - Product list with images and quantities
  - Shipping address
  - Status update form
  - Complete status history timeline
- 6 order statuses supported:
  - Order Created
  - Payment Confirmed
  - Dispatched
  - Reached City
  - Out for Delivery
  - Delivered

### Review Management
- View all product reviews
- Filter by product and rating
- Review statistics (total, average rating, distribution)
- Edit reviews (rating and comment)
- Delete reviews
- Star rating visualization

## Tech Stack

- **React 18.2** - UI library
- **Vite 5.0** - Build tool and dev server
- **React Router DOM 6.20** - Client-side routing
- **Axios 1.6** - HTTP client
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **PostCSS** - CSS processing

## Design System

### Colors
- **Primary**: `#FF6B35` (Orange) - Main actions, headings
- **Secondary**: `#FFA500` (Yellow-Orange) - Accents, highlights
- **Dark**: `#2C3E50` - Text, dark elements
- **Light**: `#F8F9FA` - Backgrounds, cards

### Components
- Minimal form-focused UI
- Clean tables with hover states
- Color-coded status badges
- Responsive grid layouts
- Modal dialogs for editing

## Project Structure

```
admin-client/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── ProtectedRoute.jsx
│   │   └── Sidebar.jsx
│   ├── layouts/         # Layout wrappers
│   │   └── DashboardLayout.jsx
│   ├── lib/             # Utilities and API client
│   │   ├── api.js       # API functions (all endpoints)
│   │   ├── apiClient.js # Axios instance with interceptors
│   │   ├── auth.js      # Auth utilities (login, logout, getToken)
│   │   └── utils.js     # Formatters (currency, date/time)
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Categories.jsx
│   │   ├── Products.jsx
│   │   ├── Orders.jsx
│   │   ├── OrderDetail.jsx
│   │   └── Reviews.jsx
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## API Integration

All 26 backend endpoints are integrated:

### Auth API (2 endpoints)
- `POST /api/admin/auth/login` - Admin login

### Category API (6 endpoints)
- `GET /api/admin/categories` - Get all categories
- `GET /api/admin/categories/:id` - Get category by ID
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `PUT /api/admin/categories/:id/toggle-status` - Toggle active status
- `DELETE /api/admin/categories/:id` - Delete category

### Product API (7 endpoints)
- `GET /api/admin/products` - Get all products (with filters)
- `GET /api/admin/products/:id` - Get product by ID
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `PUT /api/admin/products/:id/stock` - Update stock
- `PUT /api/admin/products/:id/toggle-status` - Toggle active status
- `DELETE /api/admin/products/:id` - Delete product

### Order API (4 endpoints)
- `GET /api/admin/orders` - Get all orders (with filters)
- `GET /api/admin/orders/:id` - Get order by ID
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/orders/stats` - Get order statistics

### Review API (6 endpoints)
- `GET /api/admin/reviews` - Get all reviews
- `GET /api/admin/reviews/:id` - Get review by ID
- `GET /api/admin/reviews/product/:productId` - Get reviews by product
- `PUT /api/admin/reviews/:id` - Update review
- `DELETE /api/admin/reviews/:id` - Delete review
- `GET /api/admin/reviews/stats` - Get review statistics

## Prerequisites

- Node.js 18+ installed
- Admin backend running on `http://localhost:5001`
- MongoDB database with seeded data

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:5174`

## Build

Create production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Admin Credentials

For security, default admin credentials are NOT included in this README or in the UI. Create an admin account by setting environment variables in the backend or by running the backend seed script with secure values. Do not hardcode credentials in client files.

## Usage Guide

### First Time Setup
1. Start MongoDB
2. Start the backend server (`cd admin-backend && npm run dev`)
3. Seed the database (`cd admin-backend && npm run seed`)
4. Start the admin client (`cd admin-client && npm run dev`)
5. Navigate to `http://localhost:5174/login`
6. Log in with the admin account you provisioned on the backend

### Managing Categories
1. Go to Categories page
2. Fill in category name and description
3. Click "Create Category"
4. Edit existing categories using the Edit button
5. Toggle active/inactive status
6. Delete categories (only if not used by products)

### Managing Products
1. Go to Products page
2. Select category from dropdown (only active categories shown)
3. Fill in product details:
   - Name
   - Price (in rupees)
   - Stock quantity
   - Image URL
   - Toggle "Unlimited Purchase" if no limit
   - Set max units if limited
4. Click "Create Product"
5. Use search to find products by name
6. Filter by category using dropdown
7. Edit, toggle status, or delete products

### Managing Orders
1. Go to Orders page
2. View order statistics at the top
3. Filter orders by:
   - Status (all statuses supported)
   - Date range (start and end date)
4. Click "View Details" to see full order
5. On detail page:
   - View all order information
   - See product list with images
   - Check shipping address
   - View complete status history
   - Update order status with optional notes

### Managing Reviews
1. Go to Reviews page
2. View review statistics
3. Filter reviews by:
   - Product (dropdown of all products)
   - Rating (1-5 stars)
4. Edit reviews:
   - Click Edit button
   - Update rating and/or comment
   - Save changes
5. Delete inappropriate reviews

## Environment Variables

The API base URL is configured in `src/lib/apiClient.js`:
```javascript
const API_BASE_URL = 'http://localhost:5001/api/admin';
```

Change this if your backend runs on a different port.

## Key Features

### Authentication Flow
- Login redirects to dashboard on success
- JWT token stored in localStorage
- Token included in all API requests via interceptor
- Auto-redirect to login on 401 errors
- Logout clears token and redirects to login

### Error Handling
- Form validation on all inputs
- API error messages displayed to user
- Success confirmations for actions
- Loading states during API calls

### Responsive Design
- Mobile-friendly layouts
- Responsive tables and forms
- Hamburger menu for mobile (sidebar)

## Troubleshooting

### Cannot connect to backend
- Ensure backend is running on port 5001
- Check MongoDB is running
- Verify backend logs for errors

### Login fails
- Verify admin account exists in database
- Run seed script: `cd admin-backend && npm run seed`
- Check credentials match seed data

### Categories not appearing in product form
- Only active categories are shown
- Create and activate at least one category first

### Orders not loading
- Ensure backend has order data
- Check browser console for API errors
- Verify order API endpoints are working

## API Response Format

All API responses follow this format:

Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error info"
}
```

## License

Same as main project
