﻿# online_annavaram

OCT 8: Repo creation

OCT 8: Step 1 (Home Page) completed
- Scaffolded React client with Vite + Tailwind
- Added base layout, slider, category/search, product grid
- Built successfully

OCT 12: Step 1 (Backend Setup) completed
- Created Express backend with MongoDB connection helper (falls back to in-memory server for local dev)
- Added `/` health route and `/api/test` sample endpoint
- Documented backend usage and scripts

OCT 12: Step 2 (DB Schema & Models) completed
- Documented entity relationships in `docs/schema.md`
- Implemented Mongoose models for users, products, carts, orders, order items, cart items, and payments
- Added seed script (`npm run seed`) that inserts sample data and runs verification queries

OCT 12: Step 3 (API Endpoints) completed
- Added controllers, routes, and validation for products, cart, orders, and admin order listing
- Implemented header-based auth middleware and centralized error handling
- Created automated smoke test (`npm run test:api`) and documented endpoints in `docs/api-endpoints.md`

OCT 12: Frontend multi-page flow completed
- Introduced React Router pages for products, product detail, cart, checkout, and order status
- Added cart context with backend integration and local fallback
- Updated global styling and docs to reflect new routes and environment options

OCT 13: Email OTP authentication added
- Integrated SMTP mailer with reusable service and env-driven configuration
- Added frontend auth context and signup/login/verify pages integrated with backend OTP flow
- Implemented signup, login, OTP resend, and email verification endpoints with rate limiting
- Extended schema docs and README; seed data now includes hashed demo passwords
