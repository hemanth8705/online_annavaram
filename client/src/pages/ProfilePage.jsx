import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoadingState from '../components/common/LoadingState';
import ErrorMessage from '../components/common/ErrorMessage';
import useAuth from '../hooks/useAuth';
import { listOrders } from '../lib/apiClient';
import { formatCurrency } from '../lib/formatters';

const ProfilePage = () => {
  const { user, accessToken } = useAuth();
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
