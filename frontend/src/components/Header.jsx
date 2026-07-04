// src/components/Header.jsx
import './Header.css';
import { MONTHS } from '../utils/format';

export default function Header({
  title,
  subtitle,
  search,
  onSearch,
  month,
  onMonth,
  onNew,
  showSearch = true,
  showMonth = true,
  showNew = true,
}) {
  return (
    <header className="app-header">
      <div>
        <div className="app-header-title">{title}</div>
        {subtitle && <div className="app-header-subtitle">{subtitle}</div>}
      </div>
      <div className="app-header-actions">
        {showSearch && (
          <div className="app-header-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#98A199" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              value={search || ''}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Buscar cliente, ruta, chofer…"
            />
          </div>
        )}
        {showMonth && (
          <select value={month} onChange={(e) => onMonth?.(e.target.value)} className="app-header-month">
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
        {showNew && (
          <button className="app-header-new" onClick={onNew}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva reserva
          </button>
        )}
      </div>
    </header>
  );
}
