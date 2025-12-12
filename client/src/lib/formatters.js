export function formatCurrency(amount, currency = 'INR') {
  const safeAmount = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
  // Amounts throughout the app are stored in rupees; do not divide by 100.
  return formatter.format(safeAmount);
}

export function formatStatus(status = '') {
  const normalized = status.replace(/_/g, ' ').toLowerCase();
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
