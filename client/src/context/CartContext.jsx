import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addCartItem,
  createOrder,
  deleteCartItem,
  getCart,
  updateCartItem,
} from '../lib/apiClient';

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

  return {
    id: base.id,
    status: base.status || 'active',
    items,
    totals: base.totals || computeTotals(items),
  };
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
  const userId = import.meta.env.VITE_DEMO_USER_ID || null;
  const [cart, setCart] = useState({ items: [], totals: { quantity: 0, amount: 0 }, status: 'active' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [useLocal, setUseLocal] = useState(!userId);

  const hydrateFromBackend = useCallback(async () => {
    if (!userId) {
      setUseLocal(true);
      setCart(loadLocalCart());
      return;
    }

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
    hydrateFromBackend();
  }, [hydrateFromBackend]);

  const applyLocalUpdate = useCallback((updater) => {
    setCart((prev) => {
      const nextItems = updater(prev.items);
      persistLocalCart(nextItems);
      const totals = computeTotals(nextItems);
      return { ...prev, items: nextItems, totals };
    });
  }, []);

  const addItem = useCallback(
    async (product, quantity = 1) => {
      const productId = product?._id || product?.id || product?.productId;
      if (!productId) {
        throw new Error('Product identifier missing');
      }

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
              images: product.images,
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
    persistLocalCart([]);
    setCart({ items: [], totals: { quantity: 0, amount: 0 }, status: 'active' });
  }, []);

  const placeOrder = useCallback(
    async (payload) => {
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
