export const formatINR = (value) =>
  '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const formatNumber = (value, digits = 0) =>
  Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: digits });

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value.length <= 10 ? value + 'T00:00:00' : value);
  return isNaN(d) ? value : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d)
    ? value
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const toLocalISO = (date) => {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString();
};

export const todayISO = () => toLocalISO(new Date()).slice(0, 10);

export const nowLocalInput = () => toLocalISO(new Date()).slice(0, 16);

export const daysUntil = (iso) => {
  const target = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};
