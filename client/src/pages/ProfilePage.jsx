import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoadingState from '../components/common/LoadingState';
import ErrorMessage from '../components/common/ErrorMessage';
import Modal from '../components/common/Modal';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { listOrders, createReview, verifyRazorpayPayment } from '../lib/apiClient';
import { formatCurrency } from '../lib/formatters';

// Load Razorpay Script
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const ProfilePage = () => {
  const { user, accessToken, hydrated } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Phone/Email edit state
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Payment state
  const [paymentLoading, setPaymentLoading] = useState(false);

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
        return 'status-badge status-warning';
      case 'pending_payment':
        return 'status-badge status-pending';
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

  // View Order Details Modal
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Track Package Modal
  const openTrackingModal = (order) => {
    setSelectedOrder(order);
    setShowTrackingModal(true);
  };

  // Get tracking steps based on order status
  const getTrackingSteps = (orderStatus) => {
    const steps = [
      { id: 1, label: 'Order Placed', icon: '📦' },
      { id: 2, label: 'Payment Confirmed', icon: '✅' },
      { id: 3, label: 'Processing', icon: '⚙️' },
      { id: 4, label: 'Shipped', icon: '🚚' },
      { id: 5, label: 'Delivered', icon: '🏠' },
    ];

    let completedSteps = 1;
    switch (orderStatus) {
      case 'pending_payment':
        completedSteps = 1;
        break;
      case 'paid':
        completedSteps = 2;
        break;
      case 'processing':
        completedSteps = 3;
        break;
      case 'shipped':
        completedSteps = 4;
        break;
      case 'delivered':
        completedSteps = 5;
        break;
      case 'cancelled':
        completedSteps = 0;
        break;
      default:
        completedSteps = 1;
    }

    return steps.map((step) => ({
      ...step,
      completed: step.id <= completedSteps,
      current: step.id === completedSteps,
    }));
  };

  // Make Payment for pending orders
  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleMakePayment = async () => {
    if (!selectedOrder) return;

    setPaymentLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        showToast('Unable to load payment gateway. Please try again.', 'error');
        setPaymentLoading(false);
        return;
      }

      const razorpayOrderId = selectedOrder.paymentIntentId;
      if (!razorpayOrderId) {
        showToast('Payment session expired. Please contact support.', 'error');
        setPaymentLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(selectedOrder.totalAmount * 100),
        currency: selectedOrder.currency || 'INR',
        name: 'Kana Vindu',
        description: `Order #${String(selectedOrder.id || selectedOrder._id).slice(-8).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: {
          name: selectedOrder.shippingAddress?.name || user?.fullName || '',
          email: user?.email || '',
          contact: selectedOrder.shippingAddress?.phone || user?.phone || '',
        },
        theme: { color: '#b45309' },
        handler: async (paymentResult) => {
          try {
            await verifyRazorpayPayment(accessToken, {
              orderId: selectedOrder.id || selectedOrder._id,
              paymentId: paymentResult.razorpay_payment_id,
              signature: paymentResult.razorpay_signature,
              razorpayOrderId: paymentResult.razorpay_order_id,
              payload: paymentResult,
            });
            showToast('Payment successful!', 'success');
            setShowPaymentModal(false);
            const response = await listOrders(accessToken);
            setOrders(response?.data ?? response ?? []);
          } catch (err) {
            console.error('Payment verification failed', err);
            showToast(err.message || 'Payment verification failed', 'error');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            showToast('Payment cancelled', 'info');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (failure) => {
        console.error('Payment failed', failure);
        showToast(failure.error?.description || 'Payment failed', 'error');
        setPaymentLoading(false);
      });
      razorpayInstance.open();
    } catch (err) {
      console.error('Payment initiation failed', err);
      showToast(err.message || 'Failed to initiate payment', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Review Modal
  const openReviewModal = (order) => {
    if (order.items && order.items.length > 0) {
      setReviewProduct(order.items[0]);
      setSelectedOrder(order);
      setReviewRating(0);
      setReviewTitle('');
      setReviewComment('');
      setShowReviewModal(true);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewProduct || reviewRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    setReviewLoading(true);
    try {
      await createReview(accessToken, {
        productId: reviewProduct.product || reviewProduct.productId,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      showToast('Review submitted successfully!', 'success');
      setShowReviewModal(false);
    } catch (err) {
      console.error('Review submission failed', err);
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  // Phone Number Edit
  const openPhoneModal = () => {
    setPhoneNumber(user?.phone || '');
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      showToast('Phone number update feature coming soon', 'info');
      setShowPhoneModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to update phone number', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Email Edit with OTP
  const openEmailModal = () => {
    setNewEmail(user?.email || '');
    setEmailOtp('');
    setEmailOtpSent(false);
    setShowEmailModal(true);
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail || newEmail === user?.email) {
      showToast('Please enter a new email address', 'error');
      return;
    }
    setProfileLoading(true);
    try {
      showToast('Email change feature coming soon', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailOtpSent) {
      handleSendEmailOtp();
      return;
    }
    
    setProfileLoading(true);
    try {
      showToast('Email verification feature coming soon', 'info');
      setShowEmailModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to verify email', 'error');
    } finally {
      setProfileLoading(false);
    }
  };
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="profile-info__value">{user?.email || 'N/A'}</span>
                  <button
                    type="button"
                    onClick={openEmailModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div className="profile-info__item">
                <span className="profile-info__label">Phone:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="profile-info__value">{user?.phone || 'Not provided'}</span>
                  <button
                    type="button"
                    onClick={openPhoneModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {user?.phone ? 'Edit' : 'Add'}
                  </button>
                </div>
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
                          {new Date(order.createdAt).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={getStatusBadgeClass(order.status)}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
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
                            {order.items.slice(0, 3).map((item, index) => (
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
                            {order.items.length > 3 && (
                              <li className="order-item" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                                + {order.items.length - 3} more item(s)
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      <div className="order-card__actions" style={{ 
                        display: 'flex', 
                        gap: '0.75rem', 
                        marginTop: '1rem',
                        flexWrap: 'wrap' 
                      }}>
                        {order.status === 'pending_payment' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openPaymentModal(order)}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                          >
                            Make Payment
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openOrderDetails(order)}
                          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        >
                          View Details
                        </button>
                        {(order.status === 'shipped' || order.status === 'delivered' || order.status === 'paid') && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => openTrackingModal(order)}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                          >
                            Track Package
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openReviewModal(order)}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                          >
                            Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        title="Order Details"
        size="large"
      >
        {selectedOrder && (
          <div className="order-details-modal">
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                  Order #{String(selectedOrder.id || selectedOrder._id).slice(-8).toUpperCase()}
                </h3>
                <span className={getStatusBadgeClass(selectedOrder.status)}>
                  {formatStatus(selectedOrder.status)}
                </span>
              </div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                Order Items
              </h4>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                {selectedOrder.items?.map((item, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '500' }}>{item.productName || item.name}</span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                        × {item.quantity}
                      </span>
                    </div>
                    <span style={{ fontWeight: '500', color: '#8f2d06' }}>
                      {formatCurrency((item.price || item.unitPrice) * item.quantity)}
                    </span>
                  </div>
                ))}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1rem',
                  backgroundColor: '#fef3c7',
                  fontWeight: '600'
                }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#8f2d06' }}>
                    {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {selectedOrder.shippingAddress && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                  Shipping Address
                </h4>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: '500' }}>
                    {selectedOrder.shippingAddress.name}
                  </p>
                  {selectedOrder.shippingAddress.phone && (
                    <p style={{ margin: '0 0 0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      📞 {selectedOrder.shippingAddress.phone}
                    </p>
                  )}
                  <p style={{ margin: '0 0 0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    {selectedOrder.shippingAddress.line1}
                  </p>
                  {selectedOrder.shippingAddress.line2 && (
                    <p style={{ margin: '0 0 0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {selectedOrder.shippingAddress.line2}
                    </p>
                  )}
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                Payment Information
              </h4>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#6b7280' }}>Payment Status:</span>
                  <span style={{ 
                    fontWeight: '500',
                    color: selectedOrder.status === 'pending_payment' ? '#dc2626' : '#059669'
                  }}>
                    {selectedOrder.status === 'pending_payment' ? 'Pending' : 'Completed'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#6b7280' }}>Payment Method:</span>
                  <span style={{ fontWeight: '500' }}>Razorpay</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Amount:</span>
                  <span style={{ fontWeight: '500', color: '#8f2d06' }}>
                    {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                  </span>
                </div>
                {selectedOrder.paymentIntentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ color: '#6b7280' }}>Transaction ID:</span>
                    <span style={{ fontWeight: '500', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {selectedOrder.paymentIntentId.slice(-12)}...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                  Delivery Notes
                </h4>
                <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontStyle: 'italic' }}>
                  {selectedOrder.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Make Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Payment"
        size="medium"
      >
        {selectedOrder && (
          <div className="payment-modal">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💳</div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                Complete Your Order
              </h3>
              <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                Order #{String(selectedOrder.id || selectedOrder._id).slice(-8).toUpperCase()}
              </p>
            </div>

            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                Order Summary
              </h4>
              {selectedOrder.items?.slice(0, 3).map((item, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                    color: '#6b7280'
                  }}
                >
                  <span>{item.productName || item.name} × {item.quantity}</span>
                  <span>{formatCurrency((item.price || item.unitPrice) * item.quantity)}</span>
                </div>
              ))}
              {selectedOrder.items?.length > 3 && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                  + {selectedOrder.items.length - 3} more item(s)
                </div>
              )}
              <div style={{ 
                borderTop: '1px solid #e5e7eb', 
                marginTop: '0.75rem', 
                paddingTop: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: '600'
              }}>
                <span>Total</span>
                <span style={{ color: '#8f2d06' }}>
                  {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                </span>
              </div>
            </div>

            {selectedOrder.shippingAddress && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Delivering To
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                  {selectedOrder.shippingAddress.name}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleMakePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Processing...' : `Pay ${formatCurrency(selectedOrder.totalAmount)}`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Track Package Modal */}
      <Modal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        title="Track Package"
        size="medium"
      >
        {selectedOrder && (
          <div className="tracking-modal">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                Order #{String(selectedOrder.id || selectedOrder._id).slice(-8).toUpperCase()}
              </h3>
              <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                {selectedOrder.status === 'delivered' ? 'Delivered' : 'Estimated delivery: 3-5 business days'}
              </p>
            </div>

            <div style={{ padding: '1rem 0' }}>
              {getTrackingSteps(selectedOrder.status).map((step, index) => (
                <div 
                  key={step.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    marginBottom: index < 4 ? '1rem' : 0,
                    position: 'relative'
                  }}
                >
                  {index < 4 && (
                    <div style={{
                      position: 'absolute',
                      left: '1.25rem',
                      top: '2.5rem',
                      width: '2px',
                      height: '1.5rem',
                      backgroundColor: step.completed ? '#059669' : '#e5e7eb'
                    }} />
                  )}
                  
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: step.completed ? '#059669' : '#e5e7eb',
                    color: step.completed ? 'white' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    border: step.current ? '3px solid #fbbf24' : 'none',
                    boxShadow: step.current ? '0 0 0 3px rgba(251, 191, 36, 0.3)' : 'none'
                  }}>
                    {step.completed ? step.icon : '○'}
                  </div>
                  
                  <div style={{ marginLeft: '1rem', paddingTop: '0.5rem' }}>
                    <p style={{ 
                      margin: 0, 
                      fontWeight: step.current ? '600' : '400',
                      color: step.completed ? '#059669' : '#6b7280'
                    }}>
                      {step.label}
                    </p>
                    {step.current && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                        Current Status
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedOrder.status === 'cancelled' && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#fee2e2', 
                borderRadius: '0.5rem',
                textAlign: 'center',
                marginTop: '1rem'
              }}>
                <p style={{ margin: 0, color: '#991b1b', fontWeight: '500' }}>
                  This order has been cancelled
                </p>
              </div>
            )}

            {selectedOrder.shippingAddress && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem',
                marginTop: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Delivery Address
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                  {selectedOrder.shippingAddress.name}<br />
                  {selectedOrder.shippingAddress.line1}<br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
        size="medium"
      >
        <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviewProduct && (
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Reviewing: <strong>{reviewProduct.productName || reviewProduct.name}</strong>
              </p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Rating <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '2rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: star <= reviewRating ? '#fbbf24' : '#d1d5db',
                    transition: 'color 0.2s'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            {reviewRating > 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                You rated {reviewRating} star{reviewRating !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Review Title (optional)
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              disabled={reviewLoading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Your Review <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              maxLength={1000}
              rows={5}
              disabled={reviewLoading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              disabled={reviewLoading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewLoading || reviewRating === 0}
              className="btn btn-primary"
            >
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Phone Number Modal */}
      <Modal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        title={user?.phone ? 'Edit Phone Number' : 'Add Phone Number'}
        size="small"
      >
        <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              pattern="[+]?[0-9\s-]{10,15}"
              required
              disabled={profileLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowPhoneModal(false)}
              disabled={profileLoading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={profileLoading}
              className="btn btn-primary"
            >
              {profileLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Email Edit Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Update Email Address"
        size="small"
      >
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={profileLoading || emailOtpSent}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>

          {emailOtpSent && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Enter OTP sent to your new email
              </label>
              <input
                type="text"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                disabled={profileLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  textAlign: 'center',
                  letterSpacing: '0.5rem'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowEmailModal(false)}
              disabled={profileLoading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={profileLoading}
              className="btn btn-primary"
            >
              {profileLoading ? 'Processing...' : (emailOtpSent ? 'Verify & Update' : 'Send OTP')}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ProfilePage;
