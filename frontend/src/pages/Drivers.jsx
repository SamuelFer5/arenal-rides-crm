// src/pages/Drivers.jsx
import { useEffect, useMemo, useState } from 'react';
import { reportsApi } from '../api/reports';
import { money } from '../utils/format';
import { useDebounce } from '../hooks/useDebounce';
import './Drivers.css';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    reportsApi.drivers().then((res) => setDrivers(res.drivers)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = q ? drivers.filter((d) => d.driver.toLowerCase().includes(q)) : drivers;
    return [...list].sort((a, b) => b.rack - a.rack);
  }, [drivers, debouncedSearch]);

  const maxRack = filtered.length ? Math.max(...filtered.map((d) => d.rack)) : 1;

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-header-title">Conductores</div>
          <div className="app-header-subtitle">{drivers.length} conductores registrados</div>
        </div>
        <div className="app-header-actions">
          <div className="app-header-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#98A199" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conductor…" />
          </div>
        </div>
      </header>

      <div className="app-content">
        <div className="app-content-inner">
          {loading && <div className="dash-empty">Cargando…</div>}
          {!loading && (
            <div className="drivers-grid">
              {filtered.map((d) => (
                <div className="driver-card" key={d.driver}>
                  <div className="driver-card-top">
                    <div className="driver-avatar">{d.driver.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="driver-name">{d.driver}</div>
                      <div className="driver-trips">{d.count} viajes · {d.pax} pax</div>
                    </div>
                  </div>
                  <div className="driver-bar-track">
                    <div className="driver-bar-fill" style={{ width: `${(d.rack / maxRack) * 100}%` }} />
                  </div>
                  <div className="driver-stats">
                    <div>
                      <div className="driver-stat-label">Rack generado</div>
                      <div className="driver-stat-value">{money(d.rack)}</div>
                    </div>
                    <div>
                      <div className="driver-stat-label">Net pagado</div>
                      <div className="driver-stat-value driver-stat-net">{money(d.net)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
