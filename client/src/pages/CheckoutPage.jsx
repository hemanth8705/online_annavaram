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
  contactName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
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
  const { user, accessToken, hydrated } = useAuth();
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
      console.warn('Failed to load addresses', err);
      setAddressError(err);
    } finally {
      setAddressStatus('ready');
    }
  }, [accessToken]);

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
              orderId: order._id,
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
  };

  const startEditAddress = (addressId) => {
    const addr = addresses.find((item) => item.id === addressId);
    if (!addr) return;
    setAddressForm({
      contactName: addr.contactName || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'IN',
    });
    setAddressFormMode('edit');
    setEditingAddressId(addressId);
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    if (!accessToken) return;
    setAddressStatus('saving');
    setAddressError(null);
    try {
      let response;
      if (addressFormMode === 'edit' && editingAddressId) {
        response = await updateAddressRequest(accessToken, editingAddressId, addressForm);
      } else {
        response = await createAddress(accessToken, addressForm);
      }
      const list = response?.data?.addresses || [];
      setAddresses(list);
      const newSelected = addressFormMode === 'edit' ? editingAddressId : list[list.length - 1]?.id;
      setSelectedAddressId(newSelected || list[0]?.id || null);
      setAddressForm(initialAddressState);
      setAddressFormMode('create');
      setEditingAddressId(null);
    } catch (err) {
      console.warn('Save address failed', err);
      setAddressError(err);
    } finally {
      setAddressStatus('ready');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!accessToken) return;
    setAddressStatus('deleting');
    setAddressError(null);
    try {
      const response = await deleteAddressRequest(accessToken, addressId);
      const list = response?.data?.addresses || [];
      setAddresses(list);
      if (selectedAddressId === addressId) {
        setSelectedAddressId(list[0]?.id || null);
      }
    } catch (err) {
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
    setStatus('submitting');
    setError(null);

    const activeAddress = selectedAddress || addressForm;

    const payload = {
      shippingAddress: {
        name: activeAddress.contactName || formValues.name,
        phone: activeAddress.phone || formValues.phone,
        line1: activeAddress.line1 || formValues.line1,
        line2: activeAddress.line2 || formValues.line2,
        city: activeAddress.city || formValues.city,
        state: activeAddress.state || formValues.state,
        postalCode: activeAddress.postalCode || formValues.postalCode,
        country: activeAddress.country || formValues.country || 'IN',
      },
      notes: formValues.notes,
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

          {isCartEmpty ? (
            <div className="empty-state">
              <h3>No items to checkout</h3>
              <p>Add your favourite snacks before completing the order.</p>
            </div>
          ) : (
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
                              <strong>{addr.contactName || 'Saved Address'}</strong>
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
                            <button type="button" className="btn btn-secondary" onClick={() => startEditAddress(addr.id)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => handleDeleteAddress(addr.id)}
                              disabled={addressStatus === 'deleting'}
                            >
                              Delete
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
                  <legend>{addressFormMode === 'edit' ? 'Edit Address' : 'Add Address'}</legend>
                  <div className="form-field">
                    <label htmlFor="contactName">Full Name</label>
                    <input
                      id="contactName"
                      name="contactName"
                      value={addressForm.contactName}
                      onChange={handleAddressFormChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressFormChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="line1">Address Line 1</label>
                    <input
                      id="line1"
                      name="line1"
                      value={addressForm.line1}
                      onChange={handleAddressFormChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="line2">Address Line 2</label>
                    <input
                      id="line2"
                      name="line2"
                      value={addressForm.line2}
                      onChange={handleAddressFormChange}
                    />
                  </div>
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
                          // Allow manual entry if city not in list
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
                  <div className="form-field inline">
                    <div>
                      <label htmlFor="postalCode">PIN Code</label>
                      <input
                        id="postalCode"
                        name="postalCode"
                        value={addressForm.postalCode}
                        onChange={handleAddressFormChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="country">Country</label>
                      <select
                        id="country"
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressFormChange}
                        required
                      >
                        {COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="address-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddressSubmit}
                      disabled={addressStatus === 'saving' || addresses.length >= 5 && addressFormMode !== 'edit'}
                    >
                      {addressFormMode === 'edit' ? 'Save Changes' : 'Save Address'}
                    </button>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Notes</legend>
                  <div className="form-field">
                    <label htmlFor="notes">Special Instructions</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formValues.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Mention auspicious dates, delivery landmarks, etc."
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
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CheckoutPage;
