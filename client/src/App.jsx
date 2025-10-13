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

const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/products/:productId" element={<ProductDetailPage />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/order/success" element={<OrderSuccessPage />} />
    <Route path="/order/failure" element={<OrderFailurePage />} />
    <Route path="/auth/signup" element={<AuthSignupPage />} />
    <Route path="/auth/login" element={<AuthLoginPage />} />
    <Route path="/auth/verify" element={<AuthVerifyEmailPage />} />
  </Routes>
);

export default App;
