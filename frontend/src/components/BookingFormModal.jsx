// src/components/BookingFormModal.jsx
import { useEffect, useState } from 'react';
import './BookingFormModal.css';

const EMPTY = {
  date: '', time: '', customer: '', service: '', pax: '', pickup: '', dropoff: '',
  status: 'Confirmed', driver: '', rack: '', net: '', deposit: '', phone: '', notes: '',
};

export default function BookingFormModal({ booking, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (booking) {
      setForm({
        date: booking.date?.slice(0, 10) || '',
        time: booking.time || '',
        customer: booking.customer || '',
        service: booking.service || '',
        pax: booking.pax || '',
        pickup: booking.pickup || '',
        dropoff: booking.dropoff || '',
        status: booking.status || 'Confirmed',
        driver: booking.driver || '',
        rack: booking.rack ?? '',
        net: booking.net ?? '',
        deposit: booking.deposit ?? '',
        phone: booking.phone || '',
        notes: booking.notes || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [booking]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  const profit = (Number(form.rack) || 0) - (Number(form.net) || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{booking ? 'Editar reserva' : 'Nueva reserva'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-row">
            <label>Fecha
              <input type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} />
            </label>
            <label>Hora
              <input type="text" placeholder="08:00" value={form.time} onChange={(e) => set('time', e.target.value)} />
            </label>
            <label>Estado
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="Confirmed">Confirmada</option>
                <option value="Pending">Pendiente</option>
                <option value="Canceled">Cancelada</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="grow">Cliente
              <input required value={form.customer} onChange={(e) => set('customer', e.target.value)} placeholder="Nombre del cliente" />
            </label>
            <label>Pax
              <input value={form.pax} onChange={(e) => set('pax', e.target.value)} placeholder="2.0" />
            </label>
          </div>

          <label>Servicio
            <input value={form.service} onChange={(e) => set('service', e.target.value)} placeholder="Private Transfer..." />
          </label>

          <div className="form-row">
            <label className="grow">Pickup
              <input value={form.pickup} onChange={(e) => set('pickup', e.target.value)} />
            </label>
            <label className="grow">Dropoff
              <input value={form.dropoff} onChange={(e) => set('dropoff', e.target.value)} />
            </label>
          </div>

          <div className="form-row">
            <label className="grow">Conductor
              <input value={form.driver} onChange={(e) => set('driver', e.target.value)} placeholder="Nombre del conductor" />
            </label>
            <label>Teléfono
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </label>
          </div>

          <div className="form-row">
            <label>Rack ($)
              <input type="number" step="0.01" value={form.rack} onChange={(e) => set('rack', e.target.value)} />
            </label>
            <label>Net ($)
              <input type="number" step="0.01" value={form.net} onChange={(e) => set('net', e.target.value)} />
            </label>
            <label>Depósito ($)
              <input type="number" step="0.01" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} />
            </label>
            <label>Utilidad
              <input value={`$${profit.toFixed(2)}`} disabled className="profit-readonly" />
            </label>
          </div>

          <label>Notas
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : booking ? 'Guardar cambios' : 'Crear reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
