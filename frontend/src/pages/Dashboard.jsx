// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { bookingsApi } from '../api/bookings';
import { reportsApi } from '../api/reports';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import { money, moneyK, fmtDate } from '../utils/format';
import './Dashboard.css';

export default function Dashboard() {
  const [monthly, setMonthly] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([reportsApi.monthly(), bookingsApi.list({})])
      .then(([m, b]) => {
        if (!active) return;
        setMonthly(m.monthly);
        setBookings(b.bookings);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => {
    let rack = 0, net = 0, pax = 0, confirmed = 0, pending = 0, canceled = 0;
    for (const b of bookings) {
      const st = (b.status || '').toLowerCase();
      if (st.includes('cancel')) { canceled++; continue; }
      rack += Number(b.rack) || 0;
      net += Number(b.net) || 0;
      if (st.includes('confirm')) confirmed++;
      else pending++;
    }
    return { rack, net, profit: rack - net, confirmed, pending, canceled, total: bookings.length };
  }, [bookings]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return bookings
      .filter((b) => b.date.slice(0, 10) >= today && !(b.status || '').toLowerCase().includes('cancel'))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [bookings]);

  if (loading) return <div className="app-content"><div className="app-content-inner">Cargando…</div></div>;
  if (error) return <div className="app-content"><div className="app-content-inner">Error: {error}</div></div>;

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-header-title">Dashboard</div>
          <div className="app-header-subtitle">Resumen general de la operación</div>
        </div>
      </header>

      <div className="app-content">
        <div className="app-content-inner">
          <div className="kpi-grid">
            <KpiCard label="Ingresos (rack)" value={money(totals.rack)} sub={`${totals.total} reservas totales`} />
            <KpiCard label="Costo (net)" value={money(totals.net)} />
            <KpiCard label="Utilidad" value={money(totals.profit)} color="#1E7A4C" />
            <KpiCard
              label="Estado de reservas"
              value={`${totals.confirmed} confirmadas`}
              sub={`${totals.pending} pendientes · ${totals.canceled} canceladas`}
            />
          </div>

          <div className="dash-grid">
            <div className="dash-chart-card">
              <div className="dash-card-title">Tendencia mensual</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthly} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rackGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#274C66" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#274C66" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFF0EC" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={(m) => m.slice(0, 3)} tick={{ fontSize: 11, fill: '#8A958C' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={moneyK} tick={{ fontSize: 11, fill: '#8A958C' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip formatter={(v) => money(v)} labelStyle={{ fontWeight: 600 }} />
                  <Area type="monotone" dataKey="rack" stroke="#274C66" fill="url(#rackGrad)" strokeWidth={2} name="Ingresos" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-list-card">
              <div className="dash-card-title">Próximas reservas</div>
              <div className="dash-upcoming-list">
                {upcoming.length === 0 && <div className="dash-empty">No hay reservas próximas.</div>}
                {upcoming.map((b) => (
                  <div className="dash-upcoming-item" key={b.id}>
                    <div className="dash-upcoming-date">{fmtDate(b.date)}</div>
                    <div className="dash-upcoming-info">
                      <div className="dash-upcoming-customer">{b.customer}</div>
                      <div className="dash-upcoming-route">{b.pickup} → {b.dropoff}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
