import React, { useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import QuantityInput from '../components/common/QuantityInput';
import { formatCurrency } from '../lib/formatters';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';

const CartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, status, updateItemQuantity, removeItem } = useCart();
  const { accessToken, hydrated } = useAuth();
  const items = cart.items || [];

  const isEmpty = items.length === 0;
  const checkoutDisabled = isEmpty || (cart?.totals?.quantity ?? 0) <= 0;

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

  return (
    <Layout>
      <section className="section">
        <div className="container cart-page">
          <header className="page-header__inner">
            <div>
              <h1>Your Cart</h1>
              <p>Review your selection and update quantities before checkout.</p>
            </div>
            <Link to="/products" className="btn btn-secondary">
              Continue Shopping
            </Link>
          </header>

          {isEmpty && (
            <div className="empty-state">
              <h3>Your cart is empty</h3>
              <p>Fill it with temple-town favourites.</p>
              <Link to="/products" className="btn btn-primary">
                Browse Products
              </Link>
            </div>
          )}

          {!isEmpty && (
            <div className="cart-grid">
              <div className="cart-items">
                {items.map((item) => (
                  <article className="cart-item" key={item.id}>
                    <div className="cart-item__image">
                      <img
                        src={item.productSnapshot?.images?.[0] || '/images/placeholder-product.jpg'}
                        alt={item.name}
                      />
                    </div>
                    <div className="cart-item__details">
                      <h3>{item.name}</h3>
                      <p className="cart-item__price">{formatCurrency(item.unitPrice)}</p>
                      <div className="cart-item__actions">
                        <QuantityInput
                          value={item.quantity}
                          onChange={(qty) => updateItemQuantity(item.id, qty)}
                          min={0}
                          max={10}
                        />
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => removeItem(item.id)}
                          disabled={status === 'updating'}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-item__subtotal">{formatCurrency(item.subtotal)}</div>
                  </article>
                ))}
              </div>
              <aside className="cart-summary">
                <h2>Order Summary</h2>
                <div className="cart-summary__row">
                  <span>Items</span>
                  <span>{cart.totals.quantity}</span>
                </div>
                <div className="cart-summary__row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.totals.amount)}</span>
                </div>
                <div className="cart-summary__row">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <hr />
                <div className="cart-summary__row cart-summary__row--total">
                  <span>Total</span>
                  <span>{formatCurrency(cart.totals.amount)}</span>
                </div>
                <Link
                  to="/checkout"
                  className="btn btn-primary cart-summary__checkout"
                  aria-disabled={checkoutDisabled}
                  onClick={(event) => {
                    if (checkoutDisabled) {
                      event.preventDefault();
                    }
                  }}
                  style={checkoutDisabled ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
                >
                  Checkout
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CartPage;
