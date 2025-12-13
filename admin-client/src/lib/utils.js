/**
 * Format currency to INR
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to readable format
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get status badge class
 */
export const getStatusBadgeClass = (status) => {
  const statusMap = {
    active: 'badge-success',
    inactive: 'badge-danger',
    payment_confirmed: 'badge-info',
    dispatched: 'badge-warning',
    delivered: 'badge-success',
    reached_city: 'badge-info',
    out_for_delivery: 'badge-warning',
  };
  return statusMap[status] || 'badge-info';
};
