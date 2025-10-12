import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const OrderFailurePage = () => {
  const location = useLocation();
  const message =
    location.state?.message ||
    'We could not process your payment. Please verify details and try again.';

  return (
    <Layout>
      <section className="section">
        <div className="container order-state">
          <div className="order-state__icon failure" aria-hidden="true">
            ⚠️
          </div>
          <h1>Payment Unsuccessful</h1>
          <p>{message}</p>
          <div className="order-actions">
            <Link to="/checkout" className="btn btn-primary">
              Retry Checkout
            </Link>
            <Link to="/cart" className="btn btn-secondary">
              Review Cart
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderFailurePage;
