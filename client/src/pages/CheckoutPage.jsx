import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../lib/formatters';

const initialFormState = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  notes: '',
};

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
  const { cart, placeOrder, confirmPayment, useLocal } = useCart();
  const { user } = useAuth();
  const [formValues, setFormValues] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const isCartEmpty = cart.items.length === 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

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
              razorpayOrderId: paymentResult.razorpay_order_id,
              razorpayPaymentId: paymentResult.razorpay_payment_id,
              razorpaySignature: paymentResult.razorpay_signature,
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isCartEmpty) {
      navigate('/products');
      return;
    }
    setStatus('submitting');
    setError(null);

    const payload = {
      shippingAddress: {
        name: formValues.name,
        phone: formValues.phone,
        line1: formValues.line1,
        line2: formValues.line2,
        city: formValues.city,
        state: formValues.state,
        postalCode: formValues.postalCode,
        country: formValues.country,
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
                  <legend>Shipping Information</legend>
                  <div className="form-field">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      value={formValues.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      name="phone"
                      value={formValues.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="line1">Address Line 1</label>
                    <input
                      id="line1"
                      name="line1"
                      value={formValues.line1}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="line2">Address Line 2</label>
                    <input
                      id="line2"
                      name="line2"
                      value={formValues.line2}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      name="city"
                      value={formValues.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="state">State</label>
                    <input
                      id="state"
                      name="state"
                      value={formValues.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-field inline">
                    <div>
                      <label htmlFor="postalCode">PIN Code</label>
                      <input
                        id="postalCode"
                        name="postalCode"
                        value={formValues.postalCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="country">Country</label>
                      <input
                        id="country"
                        name="country"
                        value={formValues.country}
                        onChange={handleChange}
                        required
                      />
                    </div>
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

                <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
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
