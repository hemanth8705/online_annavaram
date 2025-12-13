/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('adminToken');
  return !!token;
};

/**
 * Get current admin user
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('adminUser');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Set authentication data
 */
export const setAuthData = (token, user) => {
  localStorage.setItem('adminToken', token);
  localStorage.setItem('adminUser', JSON.stringify(user));
};

/**
 * Clear authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

/**
 * Logout user
 */
export const logout = () => {
  clearAuthData();
  window.location.href = '/login';
};
