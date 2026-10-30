export default function KpiCard({ label, value, icon: Icon, tone = 'blue', hint }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon tone-${tone}`}>
        <Icon size={20} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </div>
    </div>
  );
}
