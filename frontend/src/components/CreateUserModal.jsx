// src/components/CreateUserModal.jsx
import { useState } from 'react';
import './BookingFormModal.css';

export default function CreateUserModal({ onClose, onSave, saving, error }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'empleado' });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo usuario</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <label>Nombre completo
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej: Laura Jiménez" />
          </label>

          <label>Correo electrónico
            <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="laura@arenalrides.com" />
          </label>

          <label>Contraseña inicial
            <input required value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" />
            <span className="field-hint">Compártela con la persona. Podrá cambiarla después desde su perfil.</span>
          </label>

          <label>Rol
            <select value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="empleado">Empleado</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
