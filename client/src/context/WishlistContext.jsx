import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';

const WishlistContext = createContext(undefined);

const STORAGE_PREFIX = 'online-annavaram@wishlist';

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

function storageKey(user) {
  const suffix = user?.id || user?._id || 'guest';
  return `${STORAGE_PREFIX}:${suffix}`;
}

function normaliseProduct(product) {
  const id = deriveProductId(product);
  if (!id) return null;
  return {
    id,
    name: product.name,
    price: product.price,
    category: product.category,
    slug: product.slug,
    images: product.images || (product.image ? [product.image] : []),
    image: product.image,
    stock: product.stock,
  };
}

export const WishlistProvider = ({ children }) => {
  const { user, hydrated } = useAuth();
  const [items, setItems] = useState([]);

  const loadWishlist = useCallback(() => {
    if (!hydrated) return;
    try {
      const raw = localStorage.getItem(storageKey(user));
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.warn('Failed to load wishlist', error);
      setItems([]);
    }
  }, [hydrated, user]);

  const persist = useCallback(
    (nextItems) => {
      try {
        localStorage.setItem(storageKey(user), JSON.stringify(nextItems));
      } catch (error) {
        console.warn('Failed to persist wishlist', error);
      }
    },
    [user]
  );

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isWishlisted = useCallback(
    (product) => {
      const id = typeof product === 'string' ? product : deriveProductId(product);
      if (!id) return false;
      return items.some((item) => String(item.id) === String(id));
    },
    [items]
  );

  const toggleWishlist = useCallback(
    (product) => {
      const parsed = normaliseProduct(product);
      if (!parsed) {
        throw new Error('Unable to identify product to wishlist');
      }
      setItems((prev) => {
        const exists = prev.some((item) => String(item.id) === String(parsed.id));
        const nextItems = exists ? prev.filter((item) => String(item.id) !== String(parsed.id)) : [...prev, parsed];
        persist(nextItems);
        return nextItems;
      });
    },
    [persist]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({
      items,
      isWishlisted,
      toggleWishlist,
      clearWishlist,
      reload: loadWishlist,
    }),
    [clearWishlist, isWishlisted, items, loadWishlist, toggleWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlistContext must be used within WishlistProvider');
  }
  return ctx;
}
