export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Sub Admin',
  manager: 'Manager',
  staff: 'Staff'
};

export const SHIFT_LABELS = {
  day: 'Day Shift',
  night: 'Night Shift'
};

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(date);
}

export function timeAgo(value) {
  if (!value) return '—';
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const ranges = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ];

  for (const [unit, amount] of ranges) {
    if (Math.abs(seconds) >= amount || unit === 'second') {
      const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return formatter.format(Math.round(seconds / amount), unit);
    }
  }

  return '—';
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function stockState(product) {
  if (Number(product.quantity) <= 0) return 'out';
  if (Number(product.quantity) <= Number(product.minStock)) return 'low';
  return 'healthy';
}
