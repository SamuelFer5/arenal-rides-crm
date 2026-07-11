// src/components/KpiCard.jsx
import './KpiCard.css';

export default function KpiCard({ label, value, sub, delta, trend, color, onClick }) {
  return (
    <div className="kpi-card" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-row">
        <div className="kpi-value" style={color ? { color } : undefined}>{value}</div>
        {trend === 'up' && delta && (
          <div className="kpi-delta kpi-delta-up">▲ {delta}</div>
        )}
        {trend === 'down' && delta && (
          <div className="kpi-delta kpi-delta-down">▼ {delta}</div>
        )}
      </div>
      {sub && <div className="kpi-sub" style={color ? { color } : undefined}>{sub}</div>}
      {onClick && <div className="kpi-click-hint">Clic para ver detalle →</div>}
    </div>
  );
}
