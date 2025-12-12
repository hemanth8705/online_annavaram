import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../lib/formatters';
import {
  createAddress,
  deleteAddress as deleteAddressRequest,
  listAddresses,
  updateAddress as updateAddressRequest,
} from '../lib/apiClient';
import { INDIAN_STATES, CITIES_BY_STATE, COUNTRIES } from '../data/locations';

const initialAddressState = {
  label: '',
  contactName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  isDefault: false,
};

const initialFormState = { ...initialAddressState, notes: '' };

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

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, placeOrder, confirmPayment, useLocal } = useCart();
  const { user, accessToken, hydrated, refreshSession, logout } = useAuth();
  const [formValues, setFormValues] = useState(initialFormState);
  const [addressForm, setAddressForm] = useState(initialAddressState);
  const [availableCities, setAvailableCities] = useState([]);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [addressStatus, setAddressStatus] = useState('idle');
  const [addressError, setAddressError] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressFormMode, setAddressFormMode] = useState('create');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const isCartEmpty = cart.items.length === 0;

  // All hooks must be called before any conditional returns
  const hydrateAddresses = useCallback(async () => {
    if (!accessToken) return;
    setAddressStatus('loading');
    setAddressError(null);
    try {
      const response = await listAddresses(accessToken);
      const list = response?.data?.addresses || [];
      setAddresses(list);
      if (list.length > 0) {
        setSelectedAddressId(list[0].id);
        setAddressForm(initialAddressState);
        setAddressFormMode('create');
        setEditingAddressId(null);
      }
    } catch (err) {
      if (err?.status === 401) {
        try {
          await refreshSession();
          const retry = await listAddresses(accessToken);
          const list = retry?.data?.addresses || [];
          setAddresses(list);
          if (list.length > 0) {
            setSelectedAddressId(list[0].id);
          }
        } catch (refreshErr) {
          console.warn('Refresh failed while loading addresses', refreshErr);
          setAddressError(refreshErr);
          logout();
        } finally {
          setAddressStatus('ready');
        }
        return;
      }
      console.warn('Failed to load addresses', err);
      setAddressError(err);
    } finally {
      setAddressStatus('ready');
    }
  }, [accessToken, logout, refreshSession]);

  useEffect(() => {
    if (hydrated && accessToken) {
      hydrateAddresses();
    }
  }, [accessToken, hydrateAddresses, hydrated]);

  useEffect(() => {
    if (!hydrated || !user) return;
    if (addresses.length === 0) {
      setAddressForm((prev) => ({
        ...prev,
        contactName: prev.contactName || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [addresses.length, hydrated, user]);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const filteredStates = useMemo(() => {
    if (!stateSearch) return INDIAN_STATES;
    return INDIAN_STATES.filter(state => 
      state.toLowerCase().includes(stateSearch.toLowerCase())
    );
  }, [stateSearch]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return availableCities;
    return availableCities.filter(city =>
      city.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [citySearch, availableCities]);

  const openRazorpayCheckout = useCallback(
    async ({ orderResponse, payload }) => {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Unable to load payment gateway.');
      }
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not available.');
      }

      const { order, razorpay } = orderResponse;
      const options = {
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: razorpay.name,
        description: razorpay.description,
        order_id: razorpay.orderId,
        prefill: {
          name: payload.shippingAddress.name,
          email: user?.email || '',
          contact: payload.shippingAddress.phone || '',
        },
        theme: { color: '#b45309' },
        handler: async (paymentResult) => {
          try {
            const verification = await confirmPayment({
              orderId: order.id || order._id,
              paymentId: paymentResult.razorpay_payment_id,
              signature: paymentResult.razorpay_signature,
              payload: paymentResult,
            });
            navigate('/order/success', {
              state: {
                order: verification.order,
                payment: verification.payment,
                fallback: false,
              },
            });
          } catch (verifyError) {
            console.error('Payment verification failed', verifyError);
            navigate('/order/failure', {
              state: { message: verifyError.message || 'Unable to verify payment.' },
            });
          }
        },
        modal: {
          ondismiss: () => {
            navigate('/order/failure', {
              state: { message: 'Payment cancelled before completion.' },
            });
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (failure) => {
        console.error('Payment failed', failure);
        navigate('/order/failure', {
          state: { message: failure.error?.description || 'Payment failed.' },
        });
      });
      razorpayInstance.open();
    },
    [confirmPayment, navigate, user?.email]
  );

  // Early returns AFTER all hooks to comply with Rules of Hooks
  if (!hydrated) {
    return null;
  }

  if (!accessToken) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  // Event handlers
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressFormChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (selectedState) => {
    setAddressForm((prev) => ({ ...prev, state: selectedState, city: '' }));
    setAvailableCities(CITIES_BY_STATE[selectedState] || []);
    setStateSearch('');
    setCitySearch('');
  };

  const startAddAddress = () => {
    setAddressForm(initialAddressState);
    setAddressFormMode('create');
    setEditingAddressId(null);
    setStateSearch('');
    setCitySearch('');
    setShowAddressModal(true);
  };

  const startEditAddress = (addressId) => {
    const addr = addresses.find((item) => item.id === addressId);
    if (!addr) return;
    setAddressForm({
      label: addr.label || '',
      contactName: addr.contactName || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'India',
      isDefault: addr.isDefault || false,
    });
    setAvailableCities(CITIES_BY_STATE[addr.state] || []);
    setAddressFormMode('edit');
    setEditingAddressId(addressId);
    setStateSearch('');
    setCitySearch('');
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setAddressForm(initialAddressState);
    setAddressFormMode('create');
    setEditingAddressId(null);
    setStateSearch('');
    setCitySearch('');
    setAvailableCities([]);
  };

  const confirmDeleteAddress = (addressId) => {
    const addr = addresses.find((item) => item.id === addressId);
    setAddressToDelete(addr);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAddressToDelete(null);
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    if (!accessToken) return;
    if (
      !addressForm.contactName ||
      !addressForm.phone ||
      !addressForm.line1 ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.postalCode
    ) {
      setAddressError(new Error('Please fill in name, phone, and full address details.'));
      return;
    }
    setAddressStatus('saving');
    setAddressError(null);
    try {
      const performSave = async () => {
        if (addressFormMode === 'edit' && editingAddressId) {
          return updateAddressRequest(accessToken, editingAddressId, addressForm);
        }
        return createAddress(accessToken, addressForm);
      };
      let response = await performSave();
      let list = response?.data?.addresses || [];
      if ((!list || list.length === 0) && response?.data?.address) {
        list = [response.data.address];
      }
      setAddresses(list);
      const newSelected = addressFormMode === 'edit' ? editingAddressId : list[list.length - 1]?.id;
      setSelectedAddressId(newSelected || list[0]?.id || null);
      closeAddressModal();
    } catch (err) {
      if (err?.status === 401) {
        try {
          await refreshSession();
          const retry = await (addressFormMode === 'edit' && editingAddressId
            ? updateAddressRequest(accessToken, editingAddressId, addressForm)
            : createAddress(accessToken, addressForm));
          const list = retry?.data?.addresses || [];
          setAddresses(list);
          setSelectedAddressId(list[list.length - 1]?.id || list[0]?.id || null);
          closeAddressModal();
          setAddressStatus('ready');
          return;
        } catch (refreshErr) {
          console.warn('Save after refresh failed', refreshErr);
          setAddressError(refreshErr);
          logout();
          setAddressStatus('ready');
          return;
        }
      }
      console.warn('Save address failed', err);
      setAddressError(err);
    } finally {
      setAddressStatus('ready');
    }
  };

  const handleDeleteAddress = async () => {
    if (!accessToken || !addressToDelete) return;
    setAddressStatus('deleting');
    setAddressError(null);
    try {
      const addressId = addressToDelete.id;
      const response = await deleteAddressRequest(accessToken, addressId);
      const list = response?.data?.addresses || [];
      setAddresses(list);
      if (selectedAddressId === addressId) {
        setSelectedAddressId(list[0]?.id || null);
      }
      cancelDelete();
    } catch (err) {
      if (err?.status === 401) {
        try {
          await refreshSession();
          const retry = await deleteAddressRequest(accessToken, addressToDelete.id);
          const list = retry?.data?.addresses || [];
          setAddresses(list);
          setSelectedAddressId(list[0]?.id || null);
          cancelDelete();
          setAddressStatus('ready');
          return;
        } catch (refreshErr) {
          console.warn('Delete after refresh failed', refreshErr);
          setAddressError(refreshErr);
          logout();
          setAddressStatus('ready');
          return;
        }
      }
      console.warn('Delete address failed', err);
      setAddressError(err);
    } finally {
      setAddressStatus('ready');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isCartEmpty) {
      navigate('/products');
      return;
    }

    const activeAddress = selectedAddress || addressForm;

    if (!activeAddress || !activeAddress.contactName) {
      setError(new Error('Please select or add a delivery address'));
      return;
    }

    // Show confirmation dialog instead of submitting directly
    setOrderSummary({
      address: activeAddress,
      items: cart.items,
      total: cart.totals.amount,
      notes: formValues.notes,
    });
    setShowOrderConfirm(true);
  };

  const confirmAndPlaceOrder = async () => {
    setStatus('submitting');
    setError(null);
    setShowOrderConfirm(false);

    const payload = {
      shippingAddress: {
        name: orderSummary.address.contactName,
        phone: orderSummary.address.phone,
        line1: orderSummary.address.line1,
        line2: orderSummary.address.line2,
        city: orderSummary.address.city,
        state: orderSummary.address.state,
        postalCode: orderSummary.address.postalCode,
        country: orderSummary.address.country || 'India',
      },
      notes: orderSummary.notes,
    };

    try {
      const response = await placeOrder(payload);

      if (!response.razorpay || useLocal) {
        navigate('/order/success', {
          state: {
            order: response.order,
            items: response.items,
            payment: response.payment,
            fallback: useLocal,
          },
        });
        return;
      }

      await openRazorpayCheckout({ orderResponse: response, payload });
    } catch (err) {
      console.error('Checkout failed', err);
      setError(err);
      navigate('/order/failure', {
        state: { message: err.message || 'Unable to process order right now.' },
      });
    } finally {
      setStatus('idle');
    }
  };

  return (
    <Layout>
      <section className="section">
        <div className="container checkout-page">
          <header className="page-header__inner">
            <div>
              <h1>Checkout</h1>
              <p>Fill in delivery details to receive your Annavaram goodies.</p>
            </div>
          </header>

          <div className="checkout-grid">
              <form className="checkout-form" onSubmit={handleSubmit}>
                <fieldset>
                  <legend>Saved Addresses</legend>
                  {addressError && (
                    <div className="address-error">
                      <strong>Error:</strong> {addressError.message || 'Unable to load your addresses.'}
                      {addressError.requiresAuth && (
                        <button
                          type="button"
                          onClick={() => navigate('/auth/login', { state: { from: '/checkout' } })}
                          className="btn btn-sm btn-primary"
                          style={{ marginLeft: '1rem' }}
                        >
                          Log In Again
                        </button>
                      )}
                    </div>
                  )}
                  {addresses.length === 0 && (
                    <div className="empty-state">
                      <h3>No saved addresses</h3>
                      <p>Add your delivery details to reuse them next time.</p>
                    </div>
                  )}
                  <div className="address-grid">
                    {addresses.map((addr) => {
                      const isSelected = addr.id === selectedAddressId;
                      return (
                        <label
                          key={addr.id}
                          className={`address-card ${isSelected ? 'address-card--selected' : ''}`}
                        >
                          <div className="address-card__header">
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                            />
                            <div>
                              <div className="address-title">
                                {addr.label && <span className="address-badge">{addr.label}</span>}
                                <strong>{addr.contactName || 'Saved Address'}</strong>
                                {addr.isDefault && <span className="default-badge">Default</span>}
                              </div>
                              <div className="address-card__meta">{addr.phone}</div>
                            </div>
                          </div>
                          <div className="address-card__body">
                            <div>{addr.line1}</div>
                            {addr.line2 && <div>{addr.line2}</div>}
                            <div>
                              {addr.city}, {addr.state} {addr.postalCode}
                            </div>
                            <div>{addr.country}</div>
                          </div>
                          <div className="address-card__actions">
                            <button 
                              type="button" 
                              className="btn btn-sm btn-secondary" 
                              onClick={(e) => {
                                e.preventDefault();
                                startEditAddress(addr.id);
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={(e) => {
                                e.preventDefault();
                                confirmDeleteAddress(addr.id);
                              }}
                              disabled={addressStatus === 'deleting'}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="address-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={startAddAddress}
                      disabled={addresses.length >= 5 || addressStatus === 'loading'}
                    >
                      Add Address
                    </button>
                    {addresses.length >= 5 && (
                      <span className="form-hint">You can store up to 5 addresses.</span>
                    )}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Delivery Notes</legend>
                  <div className="form-field">
                    <label htmlFor="notes">Special Instructions (Optional)</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formValues.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Mention auspicious dates, delivery landmarks, preferred delivery time, etc."
                    />
                  </div>
                </fieldset>

                {error && (
                  <p className="form-error">
                    {error.message || 'Unable to reach the kitchen. Please try again.'}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === 'submitting' || isCartEmpty || addressStatus === 'saving'}
                >
                  {status === 'submitting' ? 'Processing...' : 'Place Order'}
                </button>
              </form>

              <aside className="checkout-summary">
                <h2>Order Summary</h2>
                <ul>
                  {cart.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <hr />
                <div className="checkout-summary__total">
                  <span>Total</span>
                  <span>{formatCurrency(cart.totals.amount)}</span>
                </div>
                <p className="checkout-summary__note">
                  We will confirm delivery slot via WhatsApp on successful payment.
                </p>
                {useLocal && (
                  <p className="checkout-summary__note warning">
                    Offline mode: order will be stored locally until backend connection returns.
                  </p>
                )}
              </aside>
            </div>
        </div>
      </section>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={closeAddressModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{addressFormMode === 'edit' ? 'Edit Address' : 'Add New Address'}</h2>
              <button className="modal-close" onClick={closeAddressModal}>&times;</button>
            </div>
            <form onSubmit={handleAddressSubmit} className="modal-body">
              <div className="form-field">
                <label htmlFor="label">Address Label *</label>
                <input
                  id="label"
                  name="label"
                  type="text"
                  value={addressForm.label}
                  onChange={handleAddressFormChange}
                  placeholder="e.g., Home, Office, Parents House"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="contactName">Full Name *</label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  value={addressForm.contactName}
                  onChange={handleAddressFormChange}
                  placeholder="Enter recipient name"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={addressForm.phone}
                  onChange={handleAddressFormChange}
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="line1">Address Line 1 *</label>
                <input
                  id="line1"
                  name="line1"
                  value={addressForm.line1}
                  onChange={handleAddressFormChange}
                  placeholder="House No., Building Name"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="line2">Address Line 2 (Optional)</label>
                <input
                  id="line2"
                  name="line2"
                  value={addressForm.line2}
                  onChange={handleAddressFormChange}
                  placeholder="Street, Area, Landmark"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="state">State/Province *</label>
                  <div className="searchable-select">
                    <input
                      type="text"
                      placeholder="Search or select state..."
                      value={stateSearch || addressForm.state}
                      onChange={(e) => {
                        setStateSearch(e.target.value);
                        if (!e.target.value) {
                          setAddressForm(prev => ({ ...prev, state: '', city: '' }));
                          setAvailableCities([]);
                        }
                      }}
                      onFocus={() => setStateSearch('')}
                      className="search-input"
                      required
                    />
                    {stateSearch && filteredStates.length > 0 && (
                      <div className="dropdown-list">
                        {filteredStates.map((state) => (
                          <div
                            key={state}
                            className="dropdown-item"
                            onClick={() => handleStateChange(state)}
                          >
                            {state}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="city">City *</label>
                  <div className="searchable-select">
                    <input
                      type="text"
                      placeholder={availableCities.length > 0 ? "Search or select city..." : "Select state first"}
                      value={citySearch || addressForm.city}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        if (!e.target.value) {
                          setAddressForm(prev => ({ ...prev, city: '' }));
                        }
                      }}
                      onFocus={() => setCitySearch('')}
                      onBlur={(e) => {
                        if (e.target.value && !availableCities.includes(e.target.value)) {
                          setAddressForm(prev => ({ ...prev, city: e.target.value }));
                        }
                      }}
                      disabled={!addressForm.state}
                      className="search-input"
                      required
                    />
                    {citySearch && filteredCities.length > 0 && (
                      <div className="dropdown-list">
                        {filteredCities.map((city) => (
                          <div
                            key={city}
                            className="dropdown-item"
                            onClick={() => {
                              setAddressForm(prev => ({ ...prev, city }));
                              setCitySearch('');
                            }}
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="postalCode">PIN Code *</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  value={addressForm.postalCode}
                  onChange={handleAddressFormChange}
                  placeholder="6-digit PIN code"
                  pattern="[0-9]{6}"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="country">Country *</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={addressForm.country}
                  onChange={handleAddressFormChange}
                  placeholder="e.g., India"
                  required
                />
              </div>

              {addressFormMode === 'create' && (
                <div className="form-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    />
                    <span>Set as default address</span>
                  </label>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeAddressModal}
                  disabled={addressStatus === 'saving'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addressStatus === 'saving'}
                >
                  {addressStatus === 'saving' ? 'Saving...' : (addressFormMode === 'edit' ? 'Save Changes' : 'Add Address')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && addressToDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Address?</h2>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                Are you sure you want to delete this address?
              </p>
              <div className="address-preview">
                <strong>{addressToDelete.title && `${addressToDelete.title} - `}{addressToDelete.contactName}</strong>
                <div>{addressToDelete.line1}</div>
                <div>{addressToDelete.city}, {addressToDelete.state} {addressToDelete.postalCode}</div>
              </div>
              <p className="confirm-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancelDelete}
                disabled={addressStatus === 'deleting'}
              >
                No, Keep It
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAddress}
                disabled={addressStatus === 'deleting'}
              >
                {addressStatus === 'deleting' ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showOrderConfirm && orderSummary && (
        <div className="modal-overlay" onClick={() => setShowOrderConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Your Order</h2>
              <button className="modal-close" onClick={() => setShowOrderConfirm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <h3 className="section-title">Order Items</h3>
              <div className="order-items-list">
                {orderSummary.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <span className="item-name">{item.name} × {item.quantity}</span>
                    <span className="item-price">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <strong>Total Amount:</strong>
                <strong>{formatCurrency(orderSummary.total)}</strong>
              </div>

              <h3 className="section-title">Delivery Address</h3>
              <div className="address-preview">
                <strong>{orderSummary.address.label && `${orderSummary.address.label} - `}{orderSummary.address.contactName}</strong>
                <div>Phone: {orderSummary.address.phone}</div>
                <div>{orderSummary.address.line1}</div>
                {orderSummary.address.line2 && <div>{orderSummary.address.line2}</div>}
                <div>{orderSummary.address.city}, {orderSummary.address.state} {orderSummary.address.postalCode}</div>
                <div>{orderSummary.address.country}</div>
              </div>

              {orderSummary.notes && (
                <>
                  <h3 className="section-title">Delivery Notes</h3>
                  <p className="delivery-notes">{orderSummary.notes}</p>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowOrderConfirm(false)}
              >
                ← Edit Order
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmAndPlaceOrder}
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Processing...' : 'Confirm Order →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CheckoutPage;
