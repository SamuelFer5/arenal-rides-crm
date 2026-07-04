// src/components/Sidebar.jsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import logo from '../assets/logo.png';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '◆' },
  { to: '/reservas', label: 'Reservas', icon: '☰' },
  { to: '/agenda', label: 'Agenda', icon: '◷' },
  { to: '/conductores', label: 'Conductores', icon: '◈' },
  { to: '/gastos', label: 'Gastos', icon: '◷' },
  { to: '/ventas', label: 'Ventas', icon: '▲' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="Arenal Rides" className="sidebar-logo" />
        <div>
          <div className="sidebar-title">Arenal Rides</div>
          <div className="sidebar-subtitle">Control de viajes</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-icon">⚙</span>
            <span className="sidebar-label">Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-userbtn"
          onClick={() => setShowPassword(true)}
          title="Cambiar mi contraseña"
        >
          <div
            className="sidebar-avatar"
            style={{ background: user?.color || '#5C675E' }}
          >
            {user?.initials}
          </div>
          <div className="sidebar-userinfo">
            <div className="sidebar-username">{user?.name}</div>
            <div className="sidebar-userrole">
              {user?.role === 'admin' ? 'Administrador' : 'Empleado'}
            </div>
          </div>
        </button>
        <button className="sidebar-logout" title="Cerrar sesión" onClick={logout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>

      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </aside>
  );
}
