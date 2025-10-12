# online_annavaram

Andhra Pradesh-style foods website. Built step-by-step, referencing `MERN_Stack_Project_Ecommerce_Hayroo` only for layout ideas. This repo is independent.

## Homepage (Andhra Foods)
- Slider showcases signature snacks (replace images under `public/telugu_snacks_images`).
- Promo tiles highlight hampers and snack shelves.
- Hero CTA links to the full product catalogue.

Config: `online_annavaram/client/src/config/site.js`
- Update `brand`, `navLinks`, and homepage `productSections`.
- `FALLBACK_PRODUCTS` powers the UI when the API is offline.

### Frontend Routes
- `/` — Home hero + curated sections.
- `/products` — Catalogue with category filtering.
- `/products/:id` — Product detail with quantity control.
- `/cart` — Review, edit, and remove cart items.
- `/checkout` — Shipping form + order summary.
- `/order/success` & `/order/failure` — Payment result views.

## Prerequisites
- Node.js 18+ and npm

## Frontend (Vite + React)
```bash
cd online_annavaram/client
npm install
npm run dev
```
Open the URL printed by Vite (typically `http://localhost:5173`).

Optional environment overrides: `online_annavaram/client/.env`
```
VITE_API_BASE_URL=http://localhost:4000/api
# Map to a real MongoDB user id for backend-powered cart/orders.
VITE_DEMO_USER_ID=<paste-seeded-user-id>
```
If `VITE_DEMO_USER_ID` is omitted or the API is unreachable, the cart falls back to local storage.

### Build (Prod)
```bash
cd online_annavaram/client
npm run build
```
Output in `online_annavaram/client/dist`.

## Backend API (Express + MongoDB)
```bash
cd online_annavaram/backend
npm install
```

Config: `online_annavaram/backend/.env`  
Example values in `.env.example`. Set:
- `PORT` (defaults to `4000`)
- `MONGODB_URI` (MongoDB connection string; leave empty to use the in-memory dev database)

Run (Dev):
```bash
cd online_annavaram/backend
npm run dev
```
The server listens on `http://localhost:4000` (or your configured port).

Quick checks:
- `GET /` → health check (`{"message":"Server running"}`)
- `GET /api/test` → verifies API wiring and database status

Full endpoint reference: `docs/api-endpoints.md`.  
Schema reference: `docs/schema.md`.

### Sample Data & Smoke Tests
```bash
# reseed demo data
npm run seed

# run scripted product/cart/order flow
npm run test:api
```

## Deploy (Vercel)
Option A (via UI):
- Import the Git repo into Vercel.
- Set Project Root to `online_annavaram/client`.
- Framework preset: Vite.
- Build Command: `npm run build`. Output Directory: `dist`.

Option B (via config):
- The repo includes `vercel.json` that builds `online_annavaram/client` with `@vercel/static-build` and serves as a SPA with rewrites.

## Roadmap
- Wire real product data and cart/checkout.
- Add product detail routes and SEO meta.
- Integrate order/contact flows suitable for Andhra foods.
