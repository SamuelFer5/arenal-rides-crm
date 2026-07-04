// src/components/StatusBadge.jsx
import { statusInfo } from '../utils/format';
import './StatusBadge.css';

export default function StatusBadge({ status }) {
  const { label, className } = statusInfo(status);
  return <span className={`status-badge ${className}`}>{label}</span>;
}
