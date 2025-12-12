import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderFailurePage from './pages/OrderFailurePage';
import AuthSignupPage from './pages/AuthSignupPage';
import AuthLoginPage from './pages/AuthLoginPage';
import AuthVerifyEmailPage from './pages/AuthVerifyEmailPage';
import AuthForgotPasswordPage from './pages/AuthForgotPasswordPage';
import AuthResetPasswordPage from './pages/AuthResetPasswordPage';
import AuthResetPasswordNewPage from './pages/AuthResetPasswordNewPage';
import WishlistPage from './pages/WishlistPage';

const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/products/:productId" element={<ProductDetailPage />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/wishlist" element={<WishlistPage />} />
    <Route path="/order/success" element={<OrderSuccessPage />} />
    <Route path="/order/failure" element={<OrderFailurePage />} />
    <Route path="/auth/signup" element={<AuthSignupPage />} />
    <Route path="/auth/login" element={<AuthLoginPage />} />
    <Route path="/auth/verify" element={<AuthVerifyEmailPage />} />
    <Route path="/auth/forgot-password" element={<AuthForgotPasswordPage />} />
    <Route path="/auth/reset-password" element={<AuthResetPasswordPage />} />
    <Route path="/auth/reset-password/new" element={<AuthResetPasswordNewPage />} />
  </Routes>
);

export default App;
