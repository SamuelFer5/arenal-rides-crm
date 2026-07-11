// src/pages/Drivers.jsx
import { useEffect, useMemo, useState } from 'react';
import { reportsApi } from '../api/reports';
import { bookingsApi } from '../api/bookings';
import { money } from '../utils/format';
import { useDebounce } from '../hooks/useDebounce';
import './Drivers.css';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // conductor seleccionado para detalle
  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    Promise.all([reportsApi.drivers(), bookingsApi.list({})])
      .then(([d, b]) => { setDrivers(d.drivers); setBookings(b.bookings); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = q ? drivers.filter((d) => d.driver.toLowerCase().includes(q)) : drivers;
    return [...list].sort((a, b) => b.rack - a.rack);
  }, [drivers, debouncedSearch]);

  const maxRack = filtered.length ? Math.max(...filtered.map((d) => d.rack)) : 1;

  // Calcular detalle del conductor seleccionado
  const driverDetail = useMemo(() => {
    if (!selected) return null;
    const trips = bookings.filter((b) =>
      b.driver === selected.driver && !(b.status || '').toLowerCase().includes('cancel')
    );
    const totalNet = trips.reduce((s, b) => s + (Number(b.net) || 0), 0);

    // Clasificar por antigüedad de pago
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recent = []; // < 1 mes
    const overdue = []; // > 1 mes

    trips.forEach((b) => {
      const bDate = new Date(String(b.date).slice(0, 10));
      if (bDate < oneMonthAgo) overdue.push(b);
      else recent.push(b);
    });

    const overdueNet = overdue.reduce((s, b) => s + (Number(b.net) || 0), 0);
    const recentNet = recent.reduce((s, b) => s + (Number(b.net) || 0), 0);

    return { trips, totalNet, recent, overdue, overdueNet, recentNet };
  }, [selected, bookings]);

  // Determinar estado de pago de cada conductor
  function getPaymentStatus(driverName) {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const trips = bookings.filter((b) =>
      b.driver === driverName && !(b.status || '').toLowerCase().includes('cancel') && Number(b.net) > 0
    );
    if (trips.length === 0) return 'none';

    const hasOverdue = trips.some((b) => new Date(String(b.date).slice(0, 10)) < oneMonthAgo);
    if (hasOverdue) return 'overdue';
    return 'pending';
  }

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-header-title">Conductores</div>
          <div className="app-header-subtitle">{drivers.length} conductores registrados</div>
        </div>
        <div className="app-header-actions">
          <div className="app-header-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2">
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
              {filtered.map((d) => {
                const payStatus = getPaymentStatus(d.driver);
                return (
                  <div
                    className={`driver-card ${selected?.driver === d.driver ? 'driver-selected' : ''}`}
                    key={d.driver}
                    onClick={() => setSelected(d)}
                  >
                    <div className="driver-card-top">
                      <div className="driver-avatar">{d.driver.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="driver-name">{d.driver}</div>
                        <div className="driver-trips">{d.count} viajes · {d.pax} pax</div>
                      </div>
                      {payStatus === 'overdue' && <span className="driver-pay-badge overdue" title="Pagos con más de 1 mes">!</span>}
                      {payStatus === 'pending' && <span className="driver-pay-badge pending" title="Pagos pendientes">$</span>}
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral de detalle del conductor */}
      {selected && driverDetail && (
        <div className="detail-overlay" onClick={() => setSelected(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <div className="detail-title">{selected.driver}</div>
                <div className="detail-subtitle">{selected.count} viajes · {selected.pax} pasajeros</div>
              </div>
              <button className="detail-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="detail-body">
              {/* Resumen financiero */}
              <div className="detail-section detail-finances">
                <div className="detail-section-title">Resumen financiero</div>
                <div className="detail-row">
                  <div className="detail-field">
                    <span className="detail-label">Rack generado</span>
                    <span className="detail-value mono">{money(selected.rack)}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Total Net (a pagar)</span>
                    <span className="detail-value mono">{money(driverDetail.totalNet)}</span>
                  </div>
                </div>
              </div>

              {/* Estado de pagos */}
              <div className="detail-section">
                <div className="detail-section-title">Estado de pagos</div>
                <div className="driver-payment-cards">
                  {driverDetail.overdueNet > 0 && (
                    <div className="driver-payment-card overdue">
                      <div className="driver-payment-amount">{money(driverDetail.overdueNet)}</div>
                      <div className="driver-payment-label">Vencido (&gt;1 mes)</div>
                      <div className="driver-payment-count">{driverDetail.overdue.length} viajes</div>
                    </div>
                  )}
                  {driverDetail.recentNet > 0 && (
                    <div className="driver-payment-card pending">
                      <div className="driver-payment-amount">{money(driverDetail.recentNet)}</div>
                      <div className="driver-payment-label">Pendiente</div>
                      <div className="driver-payment-count">{driverDetail.recent.length} viajes</div>
                    </div>
                  )}
                  {driverDetail.totalNet === 0 && (
                    <div className="driver-payment-card paid">
                      <div className="driver-payment-amount">$0</div>
                      <div className="driver-payment-label">Sin deuda</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Viajes recientes */}
              <div className="detail-section">
                <div className="detail-section-title">Últimos viajes ({driverDetail.trips.length})</div>
                <div className="driver-trips-list">
                  {driverDetail.trips.slice(0, 30).map((b) => (
                    <div className="driver-trip-item" key={b.id}>
                      <div className="driver-trip-date mono">{String(b.date).slice(0, 10)}</div>
                      <div className="driver-trip-info">
                        <div className="driver-trip-customer">{b.customer}</div>
                        <div className="driver-trip-route">{b.pickup} → {b.dropoff}</div>
                      </div>
                      <div className="driver-trip-amounts">
                        <div className="mono">{money(b.net)}</div>
                      </div>
                    </div>
                  ))}
                  {driverDetail.trips.length > 30 && (
                    <div className="dash-empty">y {driverDetail.trips.length - 30} viajes más…</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
