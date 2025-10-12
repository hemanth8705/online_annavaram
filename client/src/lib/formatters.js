const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

export function formatCurrency(paiseAmount) {
  if (typeof paiseAmount !== 'number' || Number.isNaN(paiseAmount)) {
    return currencyFormatter.format(0);
  }

  return currencyFormatter.format(paiseAmount / 100);
}

export function formatStatus(status = '') {
  const normalized = status.replace(/_/g, ' ').toLowerCase();
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
