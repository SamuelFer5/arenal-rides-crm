// src/components/ConfirmModal.jsx
import './BookingFormModal.css';

export default function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title || '¿Estás seguro?'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
            <button
              type="button"
              className={danger ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Procesando…' : confirmLabel || 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
