import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { formatCurrency, formatStatus } from '../lib/formatters';

const OrderSuccessPage = () => {
  const location = useLocation();
  const orderData = location.state || {};
  const { order, items, payment, fallback } = orderData;

  return (
    <Layout>
      <section className="section">
        <div className="container order-state">
          <div className="order-state__icon success" aria-hidden="true">
            ✅
          </div>
          <h1>Order Confirmed!</h1>
          <p>
            Thank you for choosing Online Annavaram. Our kitchen has started preparing your batch.
          </p>

          {order && (
            <div className="order-details">
              <dl>
                <div>
                  <dt>Order ID</dt>
                  <dd>{order._id || order.id}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{formatStatus(order.status)}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.totalAmount)}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>{payment ? formatStatus(payment.status) : 'Pending confirmation'}</dd>
                </div>
              </dl>
            </div>
          )}

          {items && (
            <div className="order-items">
              <h2>Kitchen Checklist</h2>
              <ul>
                {items.map((item) => (
                  <li key={`${item.product}-${item.productName}`}>
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fallback && (
            <p className="order-note">
              You are currently offline. We saved the order locally and will sync when we reconnect.
            </p>
          )}

          <div className="order-actions">
            <Link to="/products" className="btn btn-secondary">
              Continue Shopping
            </Link>
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderSuccessPage;
