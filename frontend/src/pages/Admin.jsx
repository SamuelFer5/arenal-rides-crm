// src/pages/Admin.jsx
import { useEffect, useState } from 'react';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import CreateUserModal from '../components/CreateUserModal';
import './Admin.css';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([usersApi.list(), usersApi.auditLog(30)])
      .then(([u, l]) => { setUsers(u.users); setLog(l.log); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggle(u) {
    try {
      await usersApi.toggleActive(u.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function changeRole(u, role) {
    try {
      await usersApi.setRole(u.id, role);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreate(form) {
    setSaving(true);
    setSaveError('');
    try {
      await usersApi.create(form);
      setCreating(false);
      load();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const ACTION_LABEL = {
    login: 'Inició sesión',
    create_booking: 'Creó una reserva',
    update_booking: 'Editó una reserva',
    delete_booking: 'Eliminó una reserva',
  };

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-header-title">Administración</div>
          <div className="app-header-subtitle">Usuarios y auditoría del sistema</div>
        </div>
      </header>

      <div className="app-content">
        <div className="app-content-inner">
          {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

          <div className="admin-grid">
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="dash-card-title" style={{ margin: 0 }}>Usuarios</div>
                <button className="admin-new-btn" onClick={() => { setSaveError(''); setCreating(true); }}>
                  + Nuevo usuario
                </button>
              </div>
              {loading && <div className="dash-empty">Cargando…</div>}
              {!loading && (
                <table className="admin-table">
                  <thead>
                    <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-avatar" style={{ background: u.color }}>{u.initials}</div>
                            <div>
                              <div className="admin-user-name">{u.name}</div>
                              <div className="admin-user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            value={u.role}
                            disabled={u.id === currentUser.id}
                            onChange={(e) => changeRole(u, e.target.value)}
                            className="admin-role-select"
                          >
                            <option value="admin">Administrador</option>
                            <option value="empleado">Empleado</option>
                          </select>
                        </td>
                        <td>
                          <span className={`admin-status ${u.active ? 'active' : 'inactive'}`}>
                            {u.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          {u.id !== currentUser.id && (
                            <button className="admin-toggle-btn" onClick={() => toggle(u)}>
                              {u.active ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-card">
              <div className="dash-card-title">Auditoría reciente</div>
              <div className="audit-list">
                {log.map((entry) => (
                  <div className="audit-item" key={entry.id}>
                    <div className="audit-avatar" style={{ background: entry.color || '#999' }}>
                      {entry.initials || '?'}
                    </div>
                    <div className="audit-text">
                      <strong>{entry.user_name || 'Usuario eliminado'}</strong>{' '}
                      {ACTION_LABEL[entry.action] || entry.action}
                      {entry.entity_id && <span className="audit-entity"> #{entry.entity_id}</span>}
                    </div>
                    <div className="audit-time">{new Date(entry.created_at).toLocaleString('es-CR')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onSave={handleCreate}
          saving={saving}
          error={saveError}
        />
      )}
    </>
  );
}
