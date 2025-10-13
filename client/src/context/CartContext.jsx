import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addCartItem,
  createOrder,
  deleteCartItem,
  getCart,
  updateCartItem,
} from '../lib/apiClient';
import useAuth from '../hooks/useAuth';

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

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || null;
  const [cart, setCart] = useState({ items: [], totals: { quantity: 0, amount: 0 }, status: 'active' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [useLocal, setUseLocal] = useState(!userId);

  const hydrateFromBackend = useCallback(async () => {
    if (!userId) {
      console.log('[Cart] hydrating from local storage (no user id)');
      setUseLocal(true);
      setCart(loadLocalCart());
      setStatus('ready');
      return;
    }

    console.log('[Cart] hydrating from backend', { userId });
    setStatus('loading');
    setError(null);

    try {
      const response = await getCart(userId);
      setCart(normaliseCart(response));
      setStatus('ready');
    } catch (err) {
      console.warn('Falling back to local cart', err);
      setUseLocal(true);
      const localCart = loadLocalCart();
      setCart(localCart);
      setStatus('ready');
      setError(err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      setUseLocal(false);
      setError(null);
      hydrateFromBackend();
    } else {
      setUseLocal(true);
      setCart(loadLocalCart());
      setStatus('ready');
      setError(null);
    }
  }, [userId, hydrateFromBackend]);

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

      console.log('[Cart] addItem called', { productId, quantity, product, useLocal, userId });
      if (!useLocal && userId) {
        try {
          setStatus('updating');
          const response = await addCartItem(userId, {
            productId,
            quantity,
          });
          setCart(normaliseCart(response));
          setStatus('ready');
          return;
        } catch (err) {
          console.warn('addItem falling back to local cart', err);
          setUseLocal(true);
          setError(err);
        }
      }

      applyLocalUpdate((items) => {
        const nextItems = [...items];
        const existingIndex = nextItems.findIndex((item) => item.productId === productId);
        if (existingIndex >= 0) {
          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            quantity: nextItems[existingIndex].quantity + quantity,
          };
        } else {
          nextItems.push({
            id: `local-${productId}`,
            productId,
            name: product.name,
            quantity,
            unitPrice: product.price,
            subtotal: quantity * (product.price || 0),
            productSnapshot: {
              images: product.images || (product.image ? [product.image] : []),
              category: product.category,
              slug: product.slug,
              stock: product.stock,
            },
          });
        }
        return nextItems.filter((item) => item.quantity > 0);
      });
    },
    [applyLocalUpdate, useLocal, userId]
  );

  const updateItemQuantity = useCallback(
    async (itemId, quantity) => {
      console.log('[Cart] updateItemQuantity called', { itemId, quantity, useLocal, userId });
      if (!useLocal && userId) {
        try {
          setStatus('updating');
          const response = await updateCartItem(userId, itemId, { quantity });
          setCart(normaliseCart(response));
          setStatus('ready');
          return;
        } catch (err) {
          console.warn('updateItemQuantity falling back to local cart', err);
          setUseLocal(true);
          setError(err);
        }
      }

      applyLocalUpdate((items) =>
        items
          .map((item) => (item.id === itemId ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0)
      );
    },
    [applyLocalUpdate, useLocal, userId]
  );

  const removeItem = useCallback(
    async (itemId) => {
      console.log('[Cart] removeItem called', { itemId, useLocal, userId });
      if (!useLocal && userId) {
        try {
          setStatus('updating');
          const response = await deleteCartItem(userId, itemId);
          setCart(normaliseCart(response));
          setStatus('ready');
          return;
        } catch (err) {
          console.warn('removeItem falling back to local cart', err);
          setUseLocal(true);
          setError(err);
        }
      }

      applyLocalUpdate((items) => items.filter((item) => item.id !== itemId));
    },
    [applyLocalUpdate, useLocal, userId]
  );

  const clearCart = useCallback(() => {
    console.log('[Cart] clearCart invoked');
    persistLocalCart([]);
    setCart({ items: [], totals: { quantity: 0, amount: 0 }, status: 'active' });
  }, []);

  const placeOrder = useCallback(
    async (payload) => {
      console.log('[Cart] placeOrder called', { payload, useLocal, userId });
      if (useLocal || !userId) {
        const mockOrder = {
          order: {
            _id: `local-order-${Date.now()}`,
            status: 'pending_payment',
            totalAmount: cart.totals.amount,
            currency: 'INR',
            createdAt: new Date().toISOString(),
          },
          items: cart.items,
          payment: {
            status: 'initiated',
          },
        };
        clearCart();
        return mockOrder;
      }

      const response = await createOrder(userId, payload);
      setCart({ items: [], totals: { quantity: 0, amount: 0 }, status: 'active' });
      return response.data;
    },
    [cart.items, cart.totals.amount, clearCart, useLocal, userId]
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
      refresh: hydrateFromBackend,
    }),
    [addItem, cart, clearCart, error, hydrateFromBackend, placeOrder, removeItem, status, updateItemQuantity, useLocal]
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
