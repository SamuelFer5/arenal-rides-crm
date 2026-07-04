// src/pages/Bookings.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { bookingsApi } from '../api/bookings';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import BookingFormModal from '../components/BookingFormModal';
import { useDebounce } from '../hooks/useDebounce';
import { money, fmtDate, MONTHS, monthFromDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import './Bookings.css';

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Arranca en el mes actual; si no hay datos ahí, el usuario cambia el selector.
  // Para el negocio real esto tiene sentido (ven el mes en curso primero).
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const debouncedSearch = useDebounce(search, 250);

  const [editing, setEditing] = useState(null); // null = cerrado, {} = nuevo, {...} = editar
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    bookingsApi
      .list({})
      .then((res) => setBookings(res.bookings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      if (monthFromDate(b.date) !== month) return false;
      if (!q) return true;
      return (
        b.customer?.toLowerCase().includes(q) ||
        b.pickup?.toLowerCase().includes(q) ||
        b.dropoff?.toLowerCase().includes(q) ||
        b.driver?.toLowerCase().includes(q) ||
        b.service?.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [bookings, debouncedSearch, month]);

  async function openEdit(booking) {
    setFormError('');
    try {
      const res = await bookingsApi.acquireLock(booking.id);
      setEditing(res.booking);
    } catch (err) {
      setError(err.message);
    }
  }

  function openNew() {
    setFormError('');
    setEditing({ __new: true });
  }

  async function closeModal() {
    if (editing && !editing.__new && editing.id) {
      try { await bookingsApi.releaseLock(editing.id); } catch { /* ignore */ }
    }
    setEditing(null);
  }

  async function handleSave(form) {
    setSaving(true);
    setFormError('');
    try {
      if (editing.__new) {
        await bookingsApi.create(form);
      } else {
        await bookingsApi.update(editing.id, form);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(booking) {
    if (!window.confirm(`¿Eliminar la reserva de ${booking.customer}? Esta acción no se puede deshacer.`)) return;
    try {
      await bookingsApi.remove(booking.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  const canManage = (b) => user?.role === 'admin' || b.created_by === user?.id;

  return (
    <>
      <Header
        title="Reservas"
        subtitle={`${filtered.length} reservas en ${month}`}
        search={search}
        onSearch={setSearch}
        month={month}
        onMonth={setMonth}
        onNew={openNew}
      />

      <div className="app-content">
        <div className="app-content-inner">
          {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

          <div className="bookings-table-card">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Ruta</th>
                  <th>Conductor</th>
                  <th>Estado</th>
                  <th className="num">Rack</th>
                  <th className="num">Utilidad</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="empty-row">Cargando…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} className="empty-row">No hay reservas que coincidan.</td></tr>
                )}
                {!loading && filtered.map((b) => (
                  <tr key={b.id} className={b.locked_by ? 'row-locked' : ''}>
                    <td className="mono">{fmtDate(b.date)}</td>
                    <td>
                      <div className="cell-main">{b.customer}</div>
                      {b.locked_by && (
                        <div className="lock-pill" style={{ background: b.locked_by_color || '#999' }}>
                          {b.locked_by_initials} editando…
                        </div>
                      )}
                    </td>
                    <td className="cell-faint">{b.service || '—'}</td>
                    <td className="cell-faint">{b.pickup} → {b.dropoff}</td>
                    <td>{b.driver || '—'}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="num mono">{money(b.rack)}</td>
                    <td className="num mono profit-cell">{money(b.profit)}</td>
                    <td className="actions-cell">
                      <button className="icon-btn" title="Editar" onClick={() => openEdit(b)}>✎</button>
                      {canManage(b) && (
                        <button className="icon-btn danger" title="Eliminar" onClick={() => handleDelete(b)}>🗑</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <BookingFormModal
          booking={editing.__new ? null : editing}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
          error={formError}
        />
      )}
    </>
  );
}
