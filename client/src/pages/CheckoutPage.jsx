import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useCart from '../hooks/useCart';
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

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, placeOrder, useLocal } = useCart();
  const [formValues, setFormValues] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const isCartEmpty = cart.items.length === 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isCartEmpty) {
      navigate('/products');
      return;
    }
    setStatus('submitting');
    setError(null);

    try {
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
      const response = await placeOrder(payload);
      navigate('/order/success', {
        state: {
          order: response.order,
          items: response.items,
          payment: response.payment,
          fallback: useLocal,
        },
      });
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
                  {status === 'submitting' ? 'Placing order…' : 'Place Order'}
                </button>
              </form>

              <aside className="checkout-summary">
                <h2>Order Summary</h2>
                <ul>
                  {cart.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.name} × {item.quantity}
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
