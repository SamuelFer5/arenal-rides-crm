// src/components/StatusBadge.jsx
import { statusInfo } from '../utils/format';
import './StatusBadge.css';

export default function StatusBadge({ status, complete }) {
  // Si la reserva no está cancelada y le falta información obligatoria → gris con advertencia
  const st = (status || '').toLowerCase();
  const isCanceled = st.includes('cancel');

  if (!isCanceled && complete === false) {
    return (
      <span className="status-badge status-incomplete" title="Faltan datos obligatorios">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: 4}}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Incompleta
      </span>
    );
  }

  const { label, className } = statusInfo(status);
  return <span className={`status-badge ${className}`}>{label}</span>;
}
