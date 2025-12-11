# TODO (prioritized)

## P0 – Fix critical auth/checkout flows
- [ ] Redirect authenticated/verified users to home after login/signup, skipping OTP when already verified.
- [ ] After OTP verification, land on home page instead of the login page.
- [ ] During forgot password, if the email is not registered, inform the user and suggest signup.
- [ ] Split forgot password into two steps: OTP entry, then reset password on a separate page.
- [ ] After login, signup, or password reset, keep the user signed in without re-prompting credentials.
- [ ] Redirect unauthenticated users who hit cart or checkout to the login page.
- [ ] Disable the checkout button when the cart is empty.

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
