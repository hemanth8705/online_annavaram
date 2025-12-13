import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addCartItem,
  createOrder,
  deleteCartItem,
  getCart,
  updateCartItem,
  verifyRazorpayPayment,
} from '../lib/apiClient';
import useAuth from '../hooks/useAuth';
import { useToast } from './ToastContext';

const CartContext = createContext(undefined);

const LOCAL_STORAGE_KEY = 'online-annavaram@cart';

function computeTotals(items = []) {
  return items.reduce(
    (acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice || item.priceAtAddition || 0);
      acc.quantity += quantity;
      acc.amount += quantity * unitPrice;
      return acc;
    },
    { quantity: 0, amount: 0 }
  );
}

function deriveProductId(product) {
  if (!product) return null;
  const rawId =
    product._id ||
    product.id ||
    product.productId ||
    product.slug ||
    (product.name ? product.name.toLowerCase().replace(/\s+/g, '-') : null);
  return rawId ? String(rawId) : null;
}

function normaliseCart(payload) {
  if (!payload) {
    return { items: [], totals: { quantity: 0, amount: 0 }, status: 'active' };
  }

  const base = payload.data || payload;
  const items = (base.items || []).map((item) => ({
    id: item.id || item._id,
    productId: item.productId || item.product,
    name: item.name || item.productName || item.productSnapshot?.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice ?? item.priceAtAddition,
    subtotal: item.subtotal ?? item.quantity * (item.unitPrice ?? item.priceAtAddition ?? 0),
    productSnapshot: item.productSnapshot || {
      category: item.category,
      images: item.images,
      slug: item.slug,
      stock: item.stock,
      isActive: item.isActive,
    },
  }));

  const normalised = {
    id: base.id,
    status: base.status || 'active',
    items,
    totals: base.totals || computeTotals(items),
  };
  console.log('[Cart] normalised payload', normalised);
  return normalised;
}

function loadLocalCart() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return { items: [], totals: { quantity: 0, amount: 0 }, status: 'active' };
    }
    const items = JSON.parse(raw);
    return { items, totals: computeTotals(items), status: 'active' };
  } catch (error) {
    console.warn('Failed to parse local cart', error);
    return { items: [], totals: { quantity: 0, amount: 0 }, status: 'active' };
  }
}

function persistLocalCart(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to persist local cart', error);
  }
}

const EMPTY_CART = { items: [], totals: { quantity: 0, amount: 0 }, status: 'active' };

export const CartProvider = ({ children }) => {
  const { user, accessToken, hydrated, refreshSession, logout } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState(EMPTY_CART);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [useLocal, setUseLocal] = useState(!accessToken);
  const hadAuthenticatedSession = useRef(false);
  const pendingUpdateIds = useRef({});
  const lastToastAt = useRef(0);

  const hydrateFromBackend = useCallback(async () => {
    if (!accessToken) {
      console.log('[Cart] No access token, cart requires authentication');
      setUseLocal(false);
      setCart(EMPTY_CART);
      setStatus('ready');
      return;
    }

    console.log('[Cart] hydrating from backend', { hasToken: !!accessToken });
    setStatus('loading');
    setError(null);

    try {
      const response = await getCart(accessToken);
      setCart(normaliseCart(response));
      setStatus('ready');
      setUseLocal(false);
    } catch (err) {
      if (err?.status === 401) {
        try {
          await refreshSession();
          const retry = await getCart(accessToken);
          setCart(normaliseCart(retry));
          setStatus('ready');
          setUseLocal(false);
          return;
        } catch (refreshErr) {
          console.error('Refresh failed', refreshErr);
          logout();
        }
      }
      console.error('Failed to load cart', err);
      setCart(EMPTY_CART);
      setStatus('error');
      setError(err);
      setUseLocal(false);
    }
  }, [accessToken, logout, refreshSession]);

  useEffect(() => {
    if (!hydrated) return;

    const hasToken = !!accessToken;
    if (hasToken) {
      hadAuthenticatedSession.current = true;
      setUseLocal(false);
      setError(null);
      hydrateFromBackend();
    } else {
      // Clear cart when not authenticated
      console.log('[Cart] No authentication, clearing cart');
      setCart(EMPTY_CART);
      setUseLocal(false);
      setStatus('ready');
      setError(null);
    }
  }, [accessToken, hydrateFromBackend, hydrated]);

  const applyLocalUpdate = useCallback((updater) => {
    setCart((prev) => {
      const nextItems = updater(prev.items);
      persistLocalCart(nextItems);
      const totals = computeTotals(nextItems);
      const nextCart = { ...prev, items: nextItems, totals };
      console.log('[Cart] local cart state updated', nextCart);
      return nextCart;
    });
  }, []);

  const addItem = useCallback(
    async (product, quantity = 1) => {
      const productId = deriveProductId(product);
      if (!productId) {
        throw new Error('Product identifier missing');
      }

      if (!accessToken) {
        const authError = new Error('Please log in to add items to your cart.');
        authError.status = 401;
        throw authError;
      }

      console.log('[Cart] addItem called', { productId, quantity, product, hasToken: !!accessToken });
      
      try {
        setStatus('updating');
        const response = await addCartItem(accessToken, {
          productId,
          quantity,
        });
        setCart(normaliseCart(response));
        setStatus('ready');
        showToast(`Added ${product.name} to cart`, 'success');
      } catch (err) {
        setStatus('ready');
        setError(err);
        console.error('[Cart] Failed to add item', err);
        if (err.status === 401) {
          showToast(err.message || 'Session expired. Please log in again.', 'error');
        } else {
          showToast(err.message || 'Failed to add to cart', 'error');
        }
        throw err;
      }
    },
    [accessToken, showToast]
  );

  const updateItemQuantity = useCallback(
    async (itemId, quantity) => {
      if (!accessToken) {
        const authError = new Error('Please log in to update cart.');
        authError.status = 401;
        throw authError;
      }

      console.log('[Cart] updateItemQuantity called', { itemId, quantity, hasToken: !!accessToken });
      const prevCart = cart;
      const requestId = (pendingUpdateIds.current[itemId] || 0) + 1;
      pendingUpdateIds.current[itemId] = requestId;
      // Optimistic UI update so rapid clicks reflect immediately
      setCart((current) => {
        const nextItems = (current.items || []).map((item) =>
          item.id === itemId ? { ...item, quantity, subtotal: item.unitPrice * quantity } : item
        );
        return { ...current, items: nextItems, totals: computeTotals(nextItems) };
      });
      try {
        setStatus('updating');
        const response = await updateCartItem(accessToken, itemId, { quantity });
        // Ignore stale responses (when multiple rapid requests were sent)
        if (pendingUpdateIds.current[itemId] === requestId) {
          setCart(normaliseCart(response));
          const now = Date.now();
          if (now - lastToastAt.current > 800) {
            if (quantity === 0) {
              showToast('Item removed from cart', 'info');
            } else {
              showToast('Cart updated', 'success');
            }
            lastToastAt.current = now;
          }
        }
        setStatus('ready');
      } catch (err) {
        console.error('[Cart] Failed to update item quantity', err);
        // Revert optimistic update on failure
        setCart(prevCart);
        setStatus('ready');
        setError(err);
        if (err.status === 401) {
          showToast(err.message || 'Session expired. Please log in again.', 'error');
        } else {
          showToast(err.message || 'Failed to update cart', 'error');
        }
        throw err;
      }
    },
    [accessToken, cart, showToast]
  );

  const removeItem = useCallback(
    async (itemId) => {
      if (!accessToken) {
        const authError = new Error('Please log in to remove items from cart.');
        authError.status = 401;
        throw authError;
      }

      console.log('[Cart] removeItem called', { itemId, hasToken: !!accessToken });
      try {
        setStatus('updating');
        const response = await deleteCartItem(accessToken, itemId);
        setCart(normaliseCart(response));
        setStatus('ready');
        showToast('Item removed from cart', 'info');
      } catch (err) {
        console.error('[Cart] Failed to remove item', err);
        setStatus('ready');
        setError(err);
        if (err.status === 401) {
          showToast(err.message || 'Session expired. Please log in again.', 'error');
        } else {
          showToast(err.message || 'Failed to remove item', 'error');
        }
        throw err;
      }
    },
    [accessToken, showToast]
  );

  const clearCart = useCallback(() => {
    console.log('[Cart] clearCart invoked');
    setCart(EMPTY_CART);
  }, []);

  const placeOrder = useCallback(
    async (payload) => {
      if (!accessToken) {
        const authError = new Error('Please log in to place an order.');
        authError.status = 401;
        throw authError;
      }

      console.log('[Cart] placeOrder called', { payload, hasToken: !!accessToken });
      const response = await createOrder(accessToken, payload);
      // Note: Cart is NOT cleared here. It will be cleared by the backend after successful payment verification
      return response.data;
    },
    [cart.items, cart.totals.amount, clearCart, useLocal, accessToken]
  );

  const confirmPayment = useCallback(
    async (payload) => {
      if (!accessToken) {
        throw new Error('Please log in to confirm payment.');
      }
      try {
        setStatus('updating');
        setError(null);
        const response = await verifyRazorpayPayment(accessToken, payload);
        setStatus('ready');
        await hydrateFromBackend();
        return response.data;
      } catch (err) {
        setStatus('ready');
        setError(err);
        throw err;
      }
    },
    [hydrateFromBackend, accessToken]
  );

  const value = useMemo(
    () => ({
      cart,
      status,
      error,
      useLocal,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      placeOrder,
      confirmPayment,
      refresh: hydrateFromBackend,
    }),
    [addItem, cart, clearCart, confirmPayment, error, hydrateFromBackend, placeOrder, removeItem, status, updateItemQuantity, useLocal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within CartProvider');
  }
  return context;
}
