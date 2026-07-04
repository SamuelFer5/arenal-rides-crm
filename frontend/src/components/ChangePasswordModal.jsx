// src/components/ChangePasswordModal.jsx
import { useState } from 'react';
import { usersApi } from '../api/users';
import './BookingFormModal.css';

export default function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (next !== confirm) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await usersApi.changePassword(current, next);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cambiar mi contraseña</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <label>Contraseña actual
            <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          </label>
          <label>Nueva contraseña
            <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </label>
          <label>Confirmar nueva contraseña
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">Contraseña actualizada correctamente.</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving || success}>
              {saving ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
