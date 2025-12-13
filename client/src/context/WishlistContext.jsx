import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useAuth from '../hooks/useAuth';
import {
  getWishlist,
  addToWishlist as addToWishlistAPI,
  removeFromWishlist as removeFromWishlistAPI,
  toggleWishlistItem,
  clearWishlist as clearWishlistAPI,
} from '../lib/apiClient';

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
    productId: id,
    name: product.name,
    price: product.price,
    category: product.category,
    slug: product.slug,
    images: product.images || (product.image ? [product.image] : []),
    image: product.image || (product.images && product.images[0]),
    stock: product.stock,
  };
}

export const WishlistProvider = ({ children }) => {
  const { user, accessToken, hydrated } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('idle');
  const [useLocal, setUseLocal] = useState(!accessToken);
  const hadAuthenticatedSession = useRef(false);

  const loadLocalWishlist = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey(user));
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.warn('[Wishlist] Failed to load local wishlist', error);
      setItems([]);
    }
  }, [user]);

  const persistLocal = useCallback(
    (nextItems) => {
      try {
        localStorage.setItem(storageKey(user), JSON.stringify(nextItems));
      } catch (error) {
        console.warn('[Wishlist] Failed to persist local wishlist', error);
      }
    },
    [user]
  );

  const hydrateFromBackend = useCallback(async () => {
    if (!accessToken) {
      console.log('[Wishlist] No access token, wishlist requires authentication');
      setUseLocal(false);
      setItems([]);
      setStatus('ready');
      return;
    }

    console.log('[Wishlist] Hydrating from backend', { hasToken: !!accessToken });
    setStatus('loading');
    try {
      const response = await getWishlist(accessToken);
      const wishlistItems = response?.data?.items || [];
      setItems(wishlistItems);
      setStatus('ready');
      setUseLocal(false);
    } catch (err) {
      console.error('[Wishlist] Failed to load from backend', err);
      setItems([]);
      setStatus('error');
      setUseLocal(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!hydrated) return;

    const hasToken = !!accessToken;
    if (hasToken) {
      hadAuthenticatedSession.current = true;
      setUseLocal(false);
      hydrateFromBackend();
    } else {
      // Clear wishlist when not authenticated
      console.log('[Wishlist] No authentication, clearing wishlist');
      setItems([]);
      setUseLocal(false);
      setStatus('ready');
    }
  }, [accessToken, hydrateFromBackend, hydrated]);

  const isWishlisted = useCallback(
    (product) => {
      const id = typeof product === 'string' ? product : deriveProductId(product);
      if (!id) return false;
      return items.some((item) => String(item.productId || item.id) === String(id));
    },
    [items]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      const parsed = normaliseProduct(product);
      if (!parsed) {
        throw new Error('Unable to identify product to wishlist');
      }

      const productId = parsed.productId;

      // Require authentication for wishlist
      if (!accessToken) {
        const error = new Error('Please log in to add items to your wishlist');
        error.requiresAuth = true;
        throw error;
      }

      // Use backend only (no local fallback)
      try {
        setStatus('updating');
        const response = await toggleWishlistItem(accessToken, { productId });
        const inWishlist = response?.data?.inWishlist;
        
        if (inWishlist) {
          // Added to wishlist
          setItems((prev) => [...prev, parsed]);
        } else {
          // Removed from wishlist
          setItems((prev) => prev.filter((item) => String(item.productId || item.id) !== String(productId)));
        }
        setStatus('ready');
        return;
      } catch (err) {
        setStatus('ready');
        console.error('[Wishlist] Failed to toggle wishlist item', err);
        throw err;
      }
    },
    [accessToken]
  );

  const clearWishlist = useCallback(async () => {
    console.log('[Wishlist] Clearing wishlist');
    
    if (!accessToken) {
      const error = new Error('Please log in to manage your wishlist');
      error.requiresAuth = true;
      throw error;
    }
    
    try {
      await clearWishlistAPI(accessToken);
      setItems([]);
    } catch (err) {
      console.error('[Wishlist] Failed to clear on backend', err);
      throw err;
    }
  }, [accessToken]);

  const value = useMemo(
    () => ({
      items,
      isWishlisted,
      toggleWishlist,
      clearWishlist,
      reload: hydrateFromBackend,
      status,
      useLocal,
    }),
    [clearWishlist, hydrateFromBackend, isWishlisted, items, status, toggleWishlist, useLocal]
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
