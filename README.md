# online_annavaram
- Integrate order/contact flows suitable for Andhra foods.

## Homepage (Andhra Foods)
- Slider showcases signature snacks (replace images under `public/telugu_snacks_images`).
- Promo tiles highlight hampers and snack shelves.
- Hero CTA links to the full product catalogue.

Config: `online_annavaram/client/src/config/site.js`
- Update `brand`, `navLinks`, and homepage `productSections`.
- `FALLBACK_PRODUCTS` powers the UI when the API is offline.

### Frontend Routes
- `/` – Home hero + curated sections.
- `/products` – Catalogue with category filtering.
- `/products/:id` – Product detail with quantity control.
- `/cart` – Review, edit, and remove cart items.
- `/checkout` – Shipping form + order summary.
- `/order/success` & `/order/failure` – Payment result views.
- `/auth/signup`, `/auth/verify`, `/auth/login` – Email OTP signup and login flow.

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
```
For production deployments (e.g., Vercel) set `VITE_API_BASE_URL=https://online-annavaram-backend.onrender.com/api` in the project environment variables so the frontend talks to the Render backend.
Cart operations fall back to local storage automatically when no user is logged in.

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
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (SMTP credentials for emailing OTPs and notifications)
- `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET` (Razorpay API credentials for online payments)
- Optional overrides: `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS`, `OTP_MAX_PER_DAY`

Run (Dev):
```bash
cd online_annavaram/backend
npm run dev
```
The server listens on `http://localhost:4000` (or your configured port).

Quick checks:
- `GET /` -> health check (`{"message":"Server running"}`)
- `GET /api/test` -> verifies API wiring and database status
### Authentication (Email OTP)
- `POST /api/auth/signup` creates a user, hashes the password, and emails a 6-digit OTP via SMTP.
- OTP requests are rate-limited to 3 per email per rolling 24 hours.
- `POST /api/auth/verify-email` verifies the OTP and marks `emailVerified = true`.
- `POST /api/auth/login` requires a verified email and returns user details (without sending another OTP).
- `POST /api/auth/resend-otp` is available for unverified accounts within rate limits.
- Configure SMTP credentials before testing; see `docs/api-endpoints.md` for payloads.

### Payments (Razorpay)
- `POST /api/orders` now returns a Razorpay order payload when gateway credentials are configured.
- Frontend opens Razorpay Checkout; on success it calls `POST /api/payments/razorpay/verify` to capture the payment.
- Orders remain in `pending_payment` until verification succeeds, after which they are marked `paid` in MongoDB.

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
