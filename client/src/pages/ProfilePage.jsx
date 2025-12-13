import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoadingState from '../components/common/LoadingState';
import ErrorMessage from '../components/common/ErrorMessage';
import useAuth from '../hooks/useAuth';
import { listOrders } from '../lib/apiClient';
import { formatCurrency } from '../lib/formatters';

const ProfilePage = () => {
  const { user, accessToken, hydrated } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    async function loadOrders() {
      setStatus('loading');
      setError(null);
      try {
        const response = await listOrders(accessToken);
        const orderList = response?.data ?? response ?? [];
        setOrders(orderList);
        setStatus('ready');
      } catch (err) {
        console.error('[Profile] Failed to load orders', err);
        setError(err);
        setStatus('error');
      }
    }

    loadOrders();
  }, [accessToken]);

  const getStatusBadgeClass = (orderStatus) => {
    switch (orderStatus) {
      case 'delivered':
        return 'status-badge status-success';
      case 'shipped':
        return 'status-badge status-info';
      case 'paid':
      case 'pending':
        return 'status-badge status-warning';
      case 'cancelled':
        return 'status-badge status-error';
      default:
        return 'status-badge';
    }
  };

  const formatStatus = (orderStatus) => {
    return orderStatus
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Show loading state while hydrating auth
  if (!hydrated) {
    return (
      <Layout>
        <section className="section">
          <div className="container">
            <LoadingState label="Loading..." />
          </div>
        </section>
      </Layout>
    );
  }

  // Show login prompt if not authenticated
  if (!accessToken || !user) {
    return (
      <Layout>
        <section className="page-header">
          <div className="container page-header__inner">
            <h1>My Profile</h1>
            <p>Sign in to view your account and order history</p>
          </div>
        </section>
        
        <section className="section">
          <div className="container">
            <div className="auth-prompt" style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.75rem',
              maxWidth: '32rem',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.75rem', color: '#111827' }}>
                Sign in to Your Account
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Please log in or create an account to view your profile, track orders, and manage your account settings.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link 
                  to="/auth/login" 
                  state={{ from: location.pathname }}
                  className="btn btn-primary"
                >
                  Log In
                </Link>
                <Link 
                  to="/auth/signup" 
                  className="btn btn-secondary"
                  style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #d1d5db',
                    color: '#374151'
                  }}
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="page-header">
        <div className="container page-header__inner">
          <h1>My Profile</h1>
          <p>Manage your account and view order history</p>
        </div>
      </section>

      <section className="section">
        <div className="container profile-container">
          {/* User Information */}
          <div className="profile-card">
            <h2 className="profile-card__title">Account Information</h2>
            <div className="profile-info">
              <div className="profile-info__item">
                <span className="profile-info__label">Name:</span>
                <span className="profile-info__value">{user?.fullName || 'N/A'}</span>
              </div>
              <div className="profile-info__item">
                <span className="profile-info__label">Email:</span>
                <span className="profile-info__value">{user?.email || 'N/A'}</span>
              </div>
              <div className="profile-info__item">
                <span className="profile-info__label">Phone:</span>
                <span className="profile-info__value">{user?.phone || 'Not provided'}</span>
              </div>
              <div className="profile-info__item">
                <span className="profile-info__label">Member Since:</span>
                <span className="profile-info__value">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="profile-card">
            <h2 className="profile-card__title">Order History</h2>
            
            {status === 'loading' && <LoadingState label="Loading orders..." />}
            
            {status === 'error' && (
              <ErrorMessage
                title="Unable to load orders"
                message={error?.message || 'Please try again later.'}
              />
            )}
            
            {status === 'ready' && orders.length === 0 && (
              <div className="empty-state">
                <p className="empty-state__message">You haven't placed any orders yet.</p>
                <Link to="/products" className="btn btn-primary">
                  Start Shopping
                </Link>
              </div>
            )}
            
            {status === 'ready' && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id || order._id} className="order-card">
                    <div className="order-card__header">
                      <div>
                        <h3 className="order-card__id">
                          Order #{String(order.id || order._id).slice(-8).toUpperCase()}
                        </h3>
                        <p className="order-card__date">
                          Placed on{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className={getStatusBadgeClass(order.status)}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    
                    <div className="order-card__body">
                      <div className="order-card__info">
                        <div className="order-info__item">
                          <span className="order-info__label">Total Amount:</span>
                          <span className="order-info__value">
                            {formatCurrency(order.totalAmount, order.currency)}
                          </span>
                        </div>
                        {order.shippingAddress && (
                          <div className="order-info__item">
                            <span className="order-info__label">Shipping To:</span>
                            <span className="order-info__value">
                              {order.shippingAddress.name}, {order.shippingAddress.city}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {order.items && order.items.length > 0 && (
                        <div className="order-items">
                          <h4 className="order-items__title">Items ({order.items.length})</h4>
                          <ul className="order-items__list">
                            {order.items.map((item, index) => (
                              <li key={index} className="order-item">
                                <span className="order-item__name">
                                  {item.productName || item.name}
                                </span>
                                <span className="order-item__quantity">Qty: {item.quantity}</span>
                                <span className="order-item__price">
                                  {formatCurrency(item.price || item.unitPrice, order.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProfilePage;
