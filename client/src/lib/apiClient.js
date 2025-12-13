const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

if (typeof console !== 'undefined') {
  console.info('[api] Using API_BASE_URL:', API_BASE_URL);
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJSON = contentType.includes('application/json');
  const payload = isJSON ? await response.json() : await response.text();

  if (!response.ok) {
    // FastAPI sends errors in 'detail' field, fallback to 'message' for other APIs
    let message = typeof payload === 'object' && (payload?.detail || payload?.message)
      ? (payload.detail || payload.message)
      : `Request failed with status ${response.status}`;
    
    // Only use generic messages if the server didn't provide a specific one
    if (!payload?.detail && !payload?.message) {
      if (response.status === 401) {
        message = 'Your session has expired. Please log in again to continue.';
      } else if (response.status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (response.status === 404) {
        message = 'The requested resource was not found.';
      } else if (response.status === 421) {
        message = 'Request format is incorrect. Please refresh the page and try again.';
      } else if (response.status >= 500) {
        message = 'Server error occurred. Please try again later.';
      }
    }
    
    const error = new Error(message);
    error.status = response.status;
    error.details = typeof payload === 'object' ? payload : undefined;
    error.requiresAuth = response.status === 401;
    throw error;
  }

  return payload;
}

async function request(path, { method = 'GET', data, headers = {}, accessToken, signal } = {}) {
  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    signal,
    credentials: 'include',
  };

  if (data !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(data);
  }

  if (accessToken) {
    init.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Normalize path - remove trailing slashes to prevent 401 errors
  const normalizedPath = path.replace(/\/+$/, '');
  const url = `${API_BASE_URL}${normalizedPath}`;
  const logContext = {
    method: init.method,
    url,
    hasAuth: !!accessToken,
    hasBody: typeof init.body !== 'undefined',
  };

  console.debug('[api] request:start', logContext);

  let response;
  try {
    response = await fetch(url, init);
  } catch (networkError) {
    console.error('[api] request:network-error', {
      ...logContext,
      message: networkError?.message,
    });
    throw networkError;
  }

  try {
    const payload = await parseResponse(response);
    console.debug('[api] request:success', {
      ...logContext,
      status: response.status,
      payload,
    });
    return payload;
  } catch (error) {
    console.error('[api] request:error', {
      ...logContext,
      status: response?.status,
      message: error?.message,
      details: error?.details,
    });
    throw error;
  }
}

export function getProducts(params = {}, options = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return request(`/products${suffix}`, options);
}

export function getProductById(id, options = {}) {
  return request(`/products/${id}`, options);
}

export function getCart(accessToken, options = {}) {
  return request('/cart', { ...options, accessToken });
}

export function addCartItem(accessToken, payload, options = {}) {
  return request('/cart/items', { method: 'POST', data: payload, accessToken, ...options });
}

export function updateCartItem(accessToken, itemId, payload, options = {}) {
  return request(`/cart/items/${itemId}`, {
    method: 'PATCH',
    data: payload,
    accessToken,
    ...options,
  });
}

export function deleteCartItem(accessToken, itemId, options = {}) {
  return request(`/cart/items/${itemId}`, { method: 'DELETE', accessToken, ...options });
}

export function createOrder(accessToken, payload, options = {}) {
  return request('/orders', { method: 'POST', data: payload, accessToken, ...options });
}

export function listOrders(accessToken, options = {}) {
  return request('/orders', { accessToken, ...options });
}

export function getOrder(accessToken, orderId, options = {}) {
  return request(`/orders/${orderId}`, { accessToken, ...options });
}

export function deleteOrder(accessToken, orderId, options = {}) {
  return request(`/orders/${orderId}`, { method: 'DELETE', accessToken, ...options });
}

export function signup(payload, options = {}) {
  return request('/auth/signup', { method: 'POST', data: payload, ...options });
}

export function verifyEmail(payload, options = {}) {
  return request('/auth/verify-email', { method: 'POST', data: payload, ...options });
}

export function resendOtp(payload, options = {}) {
  return request('/auth/resend-otp', { method: 'POST', data: payload, ...options });
}

export function login(payload, options = {}) {
  return request('/auth/login', { method: 'POST', data: payload, ...options });
}

export function googleAuth(payload, options = {}) {
  return request('/auth/google', { method: 'POST', data: payload, ...options });
}

export function listAddresses(accessToken, options = {}) {
  return request('/auth/addresses', { accessToken, ...options });
}

export function createAddress(accessToken, payload, options = {}) {
  return request('/auth/addresses', { method: 'POST', data: payload, accessToken, ...options });
}

export function updateAddress(accessToken, addressId, payload, options = {}) {
  return request(`/auth/addresses/${addressId}`, {
    method: 'PUT',
    data: payload,
    accessToken,
    ...options,
  });
}

export function deleteAddress(accessToken, addressId, options = {}) {
  return request(`/auth/addresses/${addressId}`, { method: 'DELETE', accessToken, ...options });
}

export function updatePhone(accessToken, payload, options = {}) {
  return request('/auth/phone', { method: 'PUT', data: payload, accessToken, ...options });
}

export function requestEmailChangeOtp(accessToken, payload, options = {}) {
  return request('/auth/email/request-change', { method: 'POST', data: payload, accessToken, ...options });
}

export function verifyEmailChange(accessToken, payload, options = {}) {
  return request('/auth/email/verify-change', { method: 'POST', data: payload, accessToken, ...options });
}

export function requestPasswordReset(payload, options = {}) {
  return request('/auth/forgot-password', { method: 'POST', data: payload, ...options });
}

export function resetPassword(payload, options = {}) {
  return request('/auth/reset-password', { method: 'POST', data: payload, ...options });
}

export function verifyRazorpayPayment(accessToken, payload, options = {}) {
  return request('/payments/razorpay/verify', { method: 'POST', data: payload, accessToken, ...options });
}

export function refreshSession(options = {}) {
  return request('/auth/refresh', { method: 'POST', ...options });
}

export function getWishlist(accessToken, options = {}) {
  return request('/wishlist', { accessToken, ...options });
}

export function addToWishlist(accessToken, payload, options = {}) {
  return request('/wishlist', { method: 'POST', data: payload, accessToken, ...options });
}

export function removeFromWishlist(accessToken, productId, options = {}) {
  return request(`/wishlist/${productId}`, { method: 'DELETE', accessToken, ...options });
}

export function toggleWishlistItem(accessToken, payload, options = {}) {
  return request('/wishlist/toggle', { method: 'POST', data: payload, accessToken, ...options });
}

export function clearWishlist(accessToken, options = {}) {
  return request('/wishlist', { method: 'DELETE', accessToken, ...options });
}

export function getProductReviews(productId, params = {}, options = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return request(`/reviews/products/${productId}${suffix}`, options);
}

export function createReview(accessToken, payload, options = {}) {
  return request('/reviews', { method: 'POST', data: payload, accessToken, ...options });
}

export function updateReview(accessToken, reviewId, payload, options = {}) {
  return request(`/reviews/${reviewId}`, { method: 'PUT', data: payload, accessToken, ...options });
}

export function deleteReview(accessToken, reviewId, options = {}) {
  return request(`/reviews/${reviewId}`, { method: 'DELETE', accessToken, ...options });
}

export function getMyReviews(accessToken, options = {}) {
  return request('/reviews/my-reviews', { accessToken, ...options });
}
