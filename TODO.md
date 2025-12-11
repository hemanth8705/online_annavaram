# TODO (prioritized)

## P0 – Fix critical auth/checkout flows
- [x] Redirect authenticated/verified users to home after login/signup, skipping OTP when already verified.
- [x] After OTP verification, land on home page instead of the login page.
- [x] During forgot password, if the email is not registered, inform the user and suggest signup.
- [x] Split forgot password into two steps: OTP entry, then reset password on a separate page.
- [x] After login, signup, or password reset, keep the user signed in without re-prompting credentials.
- [x] Redirect unauthenticated users who hit cart or checkout to the login page.
- [x] Disable the checkout button when the cart is empty.
- [x] Require authentication before adding items to the cart; redirect unauthenticated attempts to login/signup.

## P1 – Checkout experience & address handling
- [ ] Auto-load saved address/contact from DB during checkout; prefill with signup info if no record exists.
- [ ] Support multiple saved addresses during checkout.
- [ ] Provide city search suggestions plus state and pincode capture while entering the address.
- [ ] Show a toast message “Added to cart” when items are added.

## P2 – UX polish & performance
- [ ] Improve mobile responsiveness and accessibility across the app.
- [ ] Optimize images and assets for faster load times.
- [ ] Update the banner social media links to the actual URLs.

## P3 – User features
- [ ] Add a profile page for users to view order history.
- [ ] Add a wishlist feature.
- [ ] Add user reviews and ratings for products.
- [ ] Implement product filtering and sorting options.

## P4 – Growth & monetization
- [ ] Integrate Google OAuth for quicker signup/login.
- [ ] Integrate Razorpay subscriptions.
- [ ] Implement an admin panel for order management and analytics.





