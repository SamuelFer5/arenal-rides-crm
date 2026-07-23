// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import logo from '../assets/logo.svg';
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
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="Travio" className="sidebar-logo" />
        <div>
          <div className="sidebar-title">Travio</div>
          <div className="sidebar-subtitle">Gestión de transporte</div>
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

      <UserMenu />
    </aside>
  );
}
