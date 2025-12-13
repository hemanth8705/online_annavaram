# TODO (prioritized)

## P0 - Fix critical auth/checkout and routing
- [x] Redirect authenticated/verified users to home after login/signup, skipping OTP when already verified.
- [x] After OTP verification, land on home page instead of the login page.
- [x] During forgot password, if the email is not registered, inform the user and suggest signup.
- [x] Split forgot password into two steps: OTP entry, then reset password on a separate page.
- [x] After login, signup, or password reset, keep the user signed in without re-prompting credentials.
- [x] Redirect unauthenticated users who hit cart or checkout to the login page.
- [x] Disable the checkout button when the cart is empty.
- [x] Require authentication before adding items to the cart; redirect unauthenticated attempts to login/signup.
- [x] On the profile page, show a login/sign-up prompt instead of account info when the user is not authenticated.
- [x] Fix client-side routing so deep links (e.g., /products/<id>) work on hard refresh/direct loads without 404/errors.
- [x] Add Google sign-in using ID tokens (verify token server-side; not just client ID/secret).

## P1 - Checkout experience and address handling
- [x] Auto-load saved address/contact from DB during checkout; prefill with signup info if no record exists.
- [x] Support multiple saved addresses during checkout.
- [x] Provide city search suggestions plus state and pincode capture while entering the address.
- [x] Show a toast message "Added to cart" when items are added.

## P2 - UX polish and navigation links
- [x] Improve mobile responsiveness and accessibility across the app.
- [x] Optimize images and assets for faster load times.
- [x] Update the banner social media links to the actual URLs.
- [x] Ensure footer/bottom navigation links point to the correct destinations (update with provided URLs).

## P3 - User features and UI tweaks
- [x] Add a profile page for users to view order history.
- [x] Add a wishlist feature.
- [x] Add user reviews and ratings for products.
- [x] Implement product filtering and sorting options.
- [x] Add a review modal (similar to the address modal) with star-based rating input; refresh the review UI.
- [x] Add visible product star ratings derived from user reviews.
- [ ] Update the wishlist icon to the desired design (fix alignment inside the circle).

## P4 - Growth, payments, and operations
- [x] Razorpay subscriptions (completed).
- [ ] Implement an admin panel for order management and analytics, including product creation, order views, and status updates for payments/orders.
- [ ] Add admin-specific folders in this repo: `admin-client/` and `admin-backend/`.
- [ ] Implement simple admin auth using env-configured email/password (no external SSO); block access otherwise.
- [ ] Define and implement the minimum production-ready checklist (security, scalability, reliability, monitoring).
- [ ] Define the minimal admin panel capabilities required for public launch and prioritize them.
