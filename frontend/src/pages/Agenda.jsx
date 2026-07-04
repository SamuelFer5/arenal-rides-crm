// src/pages/Agenda.jsx
import { useEffect, useMemo, useState } from 'react';
import { bookingsApi } from '../api/bookings';
import StatusBadge from '../components/StatusBadge';
import { MONTHS, money } from '../utils/format';
import './Agenda.css';

const MONTH_INDEX = Object.fromEntries(MONTHS.map((m, i) => [m, i]));

export default function Agenda() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedDate, setSelectedDate] = useState(null);
  const year = 2026;

  useEffect(() => {
    setLoading(true);
    bookingsApi.list({}).then((res) => setBookings(res.bookings)).finally(() => setLoading(false));
  }, []);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const b of bookings) {
      const d = b.date.slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(b);
    }
    return map;
  }, [bookings]);

  const days = useMemo(() => {
    const monthNum = MONTH_INDEX[month];
    const firstDay = new Date(year, monthNum, 1);
    const startOffset = firstDay.getDay(); // 0=domingo
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, iso, items: byDate.get(iso) || [] });
    }
    return cells;
  }, [month, byDate]);

  const selectedItems = selectedDate ? (byDate.get(selectedDate) || []) : [];

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-header-title">Agenda</div>
          <div className="app-header-subtitle">Vista de calendario mensual</div>
        </div>
        <div className="app-header-actions">
          <select className="app-header-month" value={month} onChange={(e) => { setMonth(e.target.value); setSelectedDate(null); }}>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>

      <div className="app-content">
        <div className="app-content-inner agenda-layout">
          <div className="agenda-calendar">
            <div className="agenda-weekdays">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                <div key={d} className="agenda-weekday">{d}</div>
              ))}
            </div>
            <div className="agenda-grid">
              {loading && <div className="dash-empty">Cargando…</div>}
              {!loading && days.map((cell, idx) => {
                if (!cell) return <div key={idx} className="agenda-cell empty" />;
                const active = cell.items.filter((b) => !(b.status || '').toLowerCase().includes('cancel'));
                return (
                  <button
                    key={cell.iso}
                    className={`agenda-cell${selectedDate === cell.iso ? ' selected' : ''}${active.length ? ' has-items' : ''}`}
                    onClick={() => setSelectedDate(cell.iso)}
                  >
                    <span className="agenda-day-num">{cell.day}</span>
                    {active.length > 0 && <span className="agenda-day-count">{active.length}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="agenda-detail">
            <div className="dash-card-title">
              {selectedDate ? `Reservas del ${selectedDate.slice(8, 10)}/${selectedDate.slice(5, 7)}` : 'Selecciona un día'}
            </div>
            {!selectedDate && <div className="dash-empty">Haz clic en un día del calendario para ver el detalle.</div>}
            {selectedDate && selectedItems.length === 0 && <div className="dash-empty">No hay reservas este día.</div>}
            <div className="agenda-detail-list">
              {selectedItems.map((b) => (
                <div key={b.id} className="agenda-detail-item">
                  <div className="agenda-detail-row">
                    <span className="agenda-detail-time mono">{b.time || '—'}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="agenda-detail-customer">{b.customer}</div>
                  <div className="agenda-detail-route">{b.pickup} → {b.dropoff}</div>
                  <div className="agenda-detail-meta">
                    <span>{b.driver || 'Sin conductor'}</span>
                    <span className="mono">{money(b.rack)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
