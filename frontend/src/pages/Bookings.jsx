// src/pages/Bookings.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { bookingsApi, downloadVoucher } from '../api/bookings';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import BookingFormModal from '../components/BookingFormModal';
import BookingDetail from '../components/BookingDetail';
import ConfirmModal from '../components/ConfirmModal';
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
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const debouncedSearch = useDebounce(search, 250);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [viewing, setViewing] = useState(null); // Reserva seleccionada para el panel de detalle
  const [confirmDelete, setConfirmDelete] = useState(null); // Reserva a eliminar
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      setViewing(null); // Cerrar detalle si estaba abierto
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

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await bookingsApi.remove(confirmDelete.id);
      setConfirmDelete(null);
      setViewing(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

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
                  <th className="num">Net</th>
                  <th className="num">Utilidad</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={10} className="empty-row">Cargando…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={10} className="empty-row">No hay reservas que coincidan.</td></tr>
                )}
                {!loading && filtered.map((b) => (
                  <tr
                    key={b.id}
                    className={`booking-row ${b.locked_by ? 'row-locked' : ''} ${viewing?.id === b.id ? 'row-selected' : ''}`}
                    onClick={() => setViewing(b)}
                  >
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
                    <td><StatusBadge status={b.status} complete={b.complete} /></td>
                    <td className="num mono">{money(b.rack)}</td>
                    <td className="num mono">{money(b.net)}</td>
                    <td className="num mono profit-cell">{money(b.profit)}</td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button className="icon-btn" title="Voucher conductor" onClick={() => downloadVoucher(b.id, 'driver').catch(e => alert(e.message))}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
                      </button>
                      <button className="icon-btn" title="Editar" onClick={() => openEdit(b)}>✎</button>
                      <button className="icon-btn danger" title="Eliminar" onClick={() => setConfirmDelete(b)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Panel lateral de detalle */}
      {viewing && (
        <BookingDetail
          booking={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => openEdit(viewing)}
        />
      )}

      {/* Modal de crear/editar */}
      {editing && (
        <BookingFormModal
          booking={editing.__new ? null : editing}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
          error={formError}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Eliminar reserva"
          message={`¿Estás seguro de eliminar la reserva de "${confirmDelete.customer}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar reserva"
          danger
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
