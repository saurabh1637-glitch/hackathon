export default function StatusBadge({ status, label }) {
  const slug = String(status).toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${slug}`}>{label || status}</span>;
}
