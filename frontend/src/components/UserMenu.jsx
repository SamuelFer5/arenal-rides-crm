// src/components/UserMenu.jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import './UserMenu.css';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('arenal_dark') === 'true'; } catch { return false; }
  });
  const menuRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Aplicar modo oscuro
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    try { localStorage.setItem('arenal_dark', darkMode); } catch { /* */ }
  }, [darkMode]);

  function toggleDark() {
    setDarkMode((d) => !d);
  }

  return (
    <div className="usermenu-wrapper" ref={menuRef}>
      <button className="usermenu-trigger" onClick={() => setOpen((o) => !o)}>
        <div className="usermenu-avatar" style={{ background: user?.color || '#5C675E' }}>
          {user?.initials}
        </div>
        <div className="usermenu-info">
          <div className="usermenu-name">{user?.name}</div>
          <div className="usermenu-role">{user?.role === 'admin' ? 'Administrador' : 'Empleado'}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="usermenu-chevron">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="usermenu-dropdown">
          <div className="usermenu-dropdown-header">
            <div className="usermenu-avatar-lg" style={{ background: user?.color || '#5C675E' }}>
              {user?.initials}
            </div>
            <div>
              <div className="usermenu-dropdown-name">{user?.name}</div>
              <div className="usermenu-dropdown-email">{user?.email}</div>
            </div>
          </div>

          <div className="usermenu-divider" />

          <button className="usermenu-item" onClick={() => { setOpen(false); setShowPassword(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Cambiar contraseña
          </button>

          <button className="usermenu-item" onClick={() => { setOpen(false); setShowEditName(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Editar perfil
          </button>

          <button className="usermenu-item" onClick={toggleDark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {darkMode
                ? <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>
                : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              }
            </svg>
            {darkMode ? 'Modo claro' : 'Modo oscuro'}
            <span className="usermenu-toggle-indicator">{darkMode ? '☀️' : '🌙'}</span>
          </button>

          <div className="usermenu-divider" />

          <button className="usermenu-item usermenu-item-danger" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}

      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
      {showEditName && <EditProfileModal user={user} onClose={() => setShowEditName(false)} />}
    </div>
  );
}

function EditProfileModal({ user, onClose }) {
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre no puede estar vacío.'); return; }
    setSaving(true); setError('');
    try {
      const { usersApi } = await import('../api/users');
      await usersApi.updateProfile({ name: name.trim() });
      setSuccess(true);
      setTimeout(() => { onClose(); window.location.reload(); }, 800);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar perfil</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="edit-profile-avatar" style={{ background: user?.color || '#5C675E' }}>
            {user?.initials}
          </div>
          <label>Nombre completo
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>Correo electrónico
            <input value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
            <span className="field-hint">El correo no se puede cambiar.</span>
          </label>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">Perfil actualizado.</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving || success}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
