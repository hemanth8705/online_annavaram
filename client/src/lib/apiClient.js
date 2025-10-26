const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJSON = contentType.includes('application/json');
  const payload = isJSON ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload?.message
        ? payload.message
        : `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = typeof payload === 'object' ? payload : undefined;
    throw error;
  }

  return payload;
}

async function request(path, { method = 'GET', data, headers = {}, userId, signal } = {}) {
  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    signal,
  };

  if (data !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(data);
  }

  if (userId) {
    init.headers['x-user-id'] = userId;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);
  return parseResponse(response);
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

export function getCart(userId, options = {}) {
  return request('/cart', { ...options, userId });
}

export function addCartItem(userId, payload, options = {}) {
  return request('/cart/items', { method: 'POST', data: payload, userId, ...options });
}

export function updateCartItem(userId, itemId, payload, options = {}) {
  return request(`/cart/items/${itemId}`, {
    method: 'PATCH',
    data: payload,
    userId,
    ...options,
  });
}

export function deleteCartItem(userId, itemId, options = {}) {
  return request(`/cart/items/${itemId}`, { method: 'DELETE', userId, ...options });
}

export function createOrder(userId, payload, options = {}) {
  return request('/orders', { method: 'POST', data: payload, userId, ...options });
}

export function listOrders(userId, options = {}) {
  return request('/orders', { userId, ...options });
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

export function requestPasswordReset(payload, options = {}) {
  return request('/auth/forgot-password', { method: 'POST', data: payload, ...options });
}

export function resetPassword(payload, options = {}) {
  return request('/auth/reset-password', { method: 'POST', data: payload, ...options });
}

export function verifyRazorpayPayment(userId, payload, options = {}) {
  return request('/payments/razorpay/verify', { method: 'POST', data: payload, userId, ...options });
}
