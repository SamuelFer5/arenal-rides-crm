// src/pages/Drivers.jsx
import { useEffect, useMemo, useState } from 'react';
import { driversApi } from '../api/drivers';
import { bookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';
import { useDebounce } from '../hooks/useDebounce';
import './Drivers.css';

export default function Drivers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [allDrivers, setAllDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const debouncedSearch = useDebounce(search, 250);

  function load() {
    setLoading(true);
    Promise.all([driversApi.listAll(), bookingsApi.list({})])
      .then(([d, b]) => { setAllDrivers(d.drivers); setBookings(b.bookings); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = q ? allDrivers.filter((d) => d.name.toLowerCase().includes(q)) : allDrivers;
    return [...list].sort((a, b) => Number(b.total_rack) - Number(a.total_rack));
  }, [allDrivers, debouncedSearch]);

  const maxRack = filtered.length ? Math.max(...filtered.map((d) => Number(d.total_rack))) : 1;

  // Determinar estado visual: payment_status de la BD + auto-vencido si >1 mes en pendiente
  function getVisualStatus(d) {
    if (d.payment_status === 'al_dia') return 'al_dia';
    // Si está pendiente, verificar si tiene >1 mes para marcarlo como vencido
    const now = new Date();
    const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastPaid = d.last_paid_date ? new Date(d.last_paid_date) : null;
    if (!lastPaid || lastPaid < oneMonthAgo) return 'vencido';
    return 'pendiente';
  }

  // Detalle del conductor
  const driverDetail = useMemo(() => {
    if (!selected) return null;
    const trips = bookings.filter((b) =>
      b.driver === selected.name && !(b.status || '').toLowerCase().includes('cancel')
    );
    const totalNet = trips.reduce((s, b) => s + (Number(b.net) || 0), 0);
    return { trips, totalNet };
  }, [selected, bookings]);

  async function togglePayment(driver) {
    const newStatus = driver.payment_status === 'al_dia' ? 'pendiente' : 'al_dia';
    try {
      await driversApi.setPaymentStatus(driver.id, newStatus);
      load();
    } catch (err) { alert(err.message); }
  }

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-header-title">Conductores</div>
          <div className="app-header-subtitle">{allDrivers.length} conductores registrados</div>
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
                const vs = getVisualStatus(d);
                return (
                  <div
                    className={`driver-card ${selected?.id === d.id ? 'driver-selected' : ''} ${!d.active ? 'driver-frozen' : ''}`}
                    key={d.id}
                    onClick={() => setSelected(d)}
                  >
                    <div className="driver-card-top">
                      <div className="driver-avatar">{d.name.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="driver-name">{d.name}</div>
                        <div className="driver-trips">{Number(d.trip_count)} viajes</div>
                      </div>
                      {d.active && vs === 'vencido' && <span className="driver-pay-badge overdue" title="Pago vencido (>1 mes)">!</span>}
                      {d.active && vs === 'pendiente' && <span className="driver-pay-badge pending" title="Pago pendiente">$</span>}
                      {d.active && vs === 'al_dia' && <span className="driver-pay-badge paid" title="Al día">✓</span>}
                      {!d.active && <span className="driver-pay-badge frozen" title="Congelado">✕</span>}
                    </div>
                    <div className="driver-bar-track">
                      <div className="driver-bar-fill" style={{ width: `${(Number(d.total_rack) / maxRack) * 100}%` }} />
                    </div>
                    <div className="driver-stats">
                      <div>
                        <div className="driver-stat-label">Rack generado</div>
                        <div className="driver-stat-value">{money(Number(d.total_rack))}</div>
                      </div>
                      <div>
                        <div className="driver-stat-label">Net pagado</div>
                        <div className="driver-stat-value driver-stat-net">{money(Number(d.total_net))}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral de detalle */}
      {selected && driverDetail && (
        <div className="detail-overlay" onClick={() => setSelected(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <div className="detail-title">{selected.name}</div>
                <div className="detail-subtitle">
                  {Number(selected.trip_count)} viajes · {selected.active ? 'Activo' : 'Congelado'}
                </div>
              </div>
              <button className="detail-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="detail-body">
              <div className="detail-section detail-finances">
                <div className="detail-section-title">Resumen financiero</div>
                <div className="detail-row">
                  <div className="detail-field">
                    <span className="detail-label">Rack generado</span>
                    <span className="detail-value mono">{money(Number(selected.total_rack))}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Total Net (a pagar)</span>
                    <span className="detail-value mono">{money(driverDetail.totalNet)}</span>
                  </div>
                </div>
              </div>

              {/* Estado de pago - solo admin puede cambiar */}
              <div className="detail-section">
                <div className="detail-section-title">Estado de pago</div>
                <div className="driver-payment-cards">
                  {getVisualStatus(selected) === 'al_dia' && (
                    <div className="driver-payment-card paid">
                      <div className="driver-payment-label">✓ Al día</div>
                      {selected.last_paid_date && <div className="driver-payment-count">Último pago: {String(selected.last_paid_date).slice(0, 10)}</div>}
                    </div>
                  )}
                  {getVisualStatus(selected) === 'pendiente' && (
                    <div className="driver-payment-card pending">
                      <div className="driver-payment-label">$ Pendiente</div>
                    </div>
                  )}
                  {getVisualStatus(selected) === 'vencido' && (
                    <div className="driver-payment-card overdue">
                      <div className="driver-payment-label">! Vencido</div>
                      <div className="driver-payment-count">Más de 1 mes sin pagar</div>
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button
                    className={`driver-pay-toggle ${selected.payment_status === 'al_dia' ? 'is-paid' : 'is-pending'}`}
                    onClick={() => togglePayment(selected)}
                  >
                    {selected.payment_status === 'al_dia' ? 'Marcar como pendiente' : 'Marcar como pagado'}
                  </button>
                )}
              </div>

              {/* Viajes */}
              <div className="detail-section">
                <div className="detail-section-title">Viajes ({driverDetail.trips.length})</div>
                <div className="driver-trips-list">
                  {driverDetail.trips.slice(0, 40).map((b) => (
                    <div className="driver-trip-item" key={b.id}>
                      <div className="driver-trip-date mono">{String(b.date).slice(0, 10)}</div>
                      <div className="driver-trip-info">
                        <div className="driver-trip-customer">{b.customer}</div>
                        <div className="driver-trip-route">{b.pickup} → {b.dropoff}</div>
                      </div>
                      <div className="driver-trip-amounts mono">{money(b.net)}</div>
                    </div>
                  ))}
                  {driverDetail.trips.length > 40 && (
                    <div className="dash-empty">y {driverDetail.trips.length - 40} viajes más…</div>
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
