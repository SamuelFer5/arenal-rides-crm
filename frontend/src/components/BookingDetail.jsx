// src/components/BookingDetail.jsx
import StatusBadge from './StatusBadge';
import { money, fmtDateFull } from '../utils/format';
import { downloadVoucher } from '../api/bookings';
import './BookingDetail.css';

export default function BookingDetail({ booking, onClose, onEdit }) {
  if (!booking) return null;
  const b = booking;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div>
            <div className="detail-title">{b.customer}</div>
            <div className="detail-subtitle">Reserva #{b.id} · {fmtDateFull(b.date)}</div>
          </div>
          <div className="detail-header-actions">
            <button className="btn-secondary" onClick={onEdit}>✎ Editar</button>
            <button className="detail-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-section">
            <div className="detail-row">
              <div className="detail-field">
                <span className="detail-label">Estado</span>
                <StatusBadge status={b.status} complete={b.complete} />
              </div>
              <div className="detail-field">
                <span className="detail-label">Hora</span>
                <span className="detail-value">{b.time || '—'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Pasajeros</span>
                <span className="detail-value">{b.pax || '—'}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Servicio</div>
            <div className="detail-value-lg">{b.service || '—'}</div>
          </div>

          <div className="detail-section">
            <div className="detail-row">
              <div className="detail-field grow">
                <span className="detail-label">Recogida (Pickup)</span>
                <span className="detail-value">{b.pickup || '—'}</span>
              </div>
              <div className="detail-field grow">
                <span className="detail-label">Destino (Dropoff)</span>
                <span className="detail-value">{b.dropoff || '—'}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-row">
              <div className="detail-field grow">
                <span className="detail-label">Conductor</span>
                <span className="detail-value">{b.driver || <span className="text-warn">Sin asignar</span>}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Teléfono</span>
                <span className="detail-value">{b.phone || '—'}</span>
              </div>
            </div>
          </div>

          <div className="detail-section detail-finances">
            <div className="detail-section-title">Finanzas</div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="detail-label">Rack (precio cliente)</span>
                <span className="detail-value mono">{money(b.rack)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Net (pago conductor)</span>
                <span className="detail-value mono">{money(b.net)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Utilidad</span>
                <span className="detail-value mono profit-green">{money(b.profit)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Depósito</span>
                <span className="detail-value mono">{money(b.deposit)}</span>
              </div>
            </div>
          </div>

          {b.notes && (
            <div className="detail-section">
              <div className="detail-section-title">Notas</div>
              <div className="detail-notes">{b.notes}</div>
            </div>
          )}

          <div className="detail-section">
            <div className="detail-section-title">Auditoría</div>
            <div className="detail-meta">
              {b.created_by_name && <span>Creada por {b.created_by_name}</span>}
              {b.modified_by_name && <span> · Editada por {b.modified_by_name}</span>}
            </div>
          </div>

          <div className="detail-vouchers">
            <button
              className="btn-voucher"
              onClick={() => downloadVoucher(b.id, 'driver').catch(e => alert(e.message))}
            >
              📄 Orden de servicio (conductor)
            </button>
            <button
              className="btn-voucher"
              onClick={() => downloadVoucher(b.id, 'client').catch(e => alert(e.message))}
            >
              📄 Confirmación (cliente)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
