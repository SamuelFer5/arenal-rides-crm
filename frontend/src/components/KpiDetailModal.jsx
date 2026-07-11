// src/components/KpiDetailModal.jsx
import { useState } from 'react';
import { money } from '../utils/format';
import './KpiDetailModal.css';

export default function KpiDetailModal({ type, monthly, bookings, onClose }) {
  const activeMonths = monthly.filter((m) => m.rack > 0);

  function renderContent() {
    switch (type) {
      case 'rack':
        return (
          <>
            <h3>Desglose de ingresos por mes</h3>
            <table className="kpi-detail-table">
              <thead><tr><th>Mes</th><th className="num">Reservas</th><th className="num">Pax</th><th className="num">Rack</th></tr></thead>
              <tbody>
                {activeMonths.map((m) => (
                  <tr key={m.month}>
                    <td>{m.month}</td>
                    <td className="num">{m.pax}</td>
                    <td className="num">{m.pax}</td>
                    <td className="num mono">{money(m.rack)}</td>
                  </tr>
                ))}
                <tr className="kpi-total-row">
                  <td><strong>Total</strong></td>
                  <td className="num"><strong>{activeMonths.reduce((s, m) => s + m.pax, 0)}</strong></td>
                  <td className="num"></td>
                  <td className="num mono"><strong>{money(activeMonths.reduce((s, m) => s + m.rack, 0))}</strong></td>
                </tr>
              </tbody>
            </table>
            <h3 style={{marginTop: 20}}>Top 10 servicios por ingreso</h3>
            <ServiceRanking bookings={bookings} />
          </>
        );
      case 'net':
        return (
          <>
            <h3>Desglose de costos por mes</h3>
            <table className="kpi-detail-table">
              <thead><tr><th>Mes</th><th className="num">Net</th><th className="num">% del Rack</th></tr></thead>
              <tbody>
                {activeMonths.map((m) => (
                  <tr key={m.month}>
                    <td>{m.month}</td>
                    <td className="num mono">{money(m.net)}</td>
                    <td className="num">{m.rack > 0 ? Math.round((m.net / m.rack) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      case 'profit':
        return (
          <>
            <h3>Utilidad por mes</h3>
            <table className="kpi-detail-table">
              <thead><tr><th>Mes</th><th className="num">Rack</th><th className="num">Net</th><th className="num">Utilidad</th><th className="num">Margen</th></tr></thead>
              <tbody>
                {activeMonths.map((m) => (
                  <tr key={m.month}>
                    <td>{m.month}</td>
                    <td className="num mono">{money(m.rack)}</td>
                    <td className="num mono">{money(m.net)}</td>
                    <td className="num mono" style={{color:'#1E7A4C', fontWeight:700}}>{money(m.profit)}</td>
                    <td className="num">{m.rack > 0 ? Math.round((m.profit / m.rack) * 100) : 0}%</td>
                  </tr>
                ))}
                <tr className="kpi-total-row">
                  <td><strong>Total</strong></td>
                  <td className="num mono"><strong>{money(activeMonths.reduce((s, m) => s + m.rack, 0))}</strong></td>
                  <td className="num mono"><strong>{money(activeMonths.reduce((s, m) => s + m.net, 0))}</strong></td>
                  <td className="num mono" style={{color:'#1E7A4C'}}><strong>{money(activeMonths.reduce((s, m) => s + m.profit, 0))}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </>
        );
      case 'status':
        const confirmed = bookings.filter((b) => (b.status || '').toLowerCase().includes('confirm'));
        const pending = bookings.filter((b) => !(b.status || '').toLowerCase().includes('cancel') && !(b.status || '').toLowerCase().includes('confirm'));
        const canceled = bookings.filter((b) => (b.status || '').toLowerCase().includes('cancel'));
        return (
          <>
            <div className="status-summary">
              <div className="status-summary-item confirmed">
                <span className="status-summary-count">{confirmed.length}</span>
                <span>Confirmadas</span>
              </div>
              <div className="status-summary-item pending">
                <span className="status-summary-count">{pending.length}</span>
                <span>Pendientes</span>
              </div>
              <div className="status-summary-item canceled">
                <span className="status-summary-count">{canceled.length}</span>
                <span>Canceladas</span>
              </div>
            </div>
            {pending.length > 0 && (
              <>
                <h3>Reservas pendientes</h3>
                <ExpandableList items={pending} renderRow={(b) => (
                  <tr key={b.id}>
                    <td className="mono">{String(b.date).slice(0, 10)}</td>
                    <td>{b.customer}</td>
                    <td className="cell-faint">{b.service || '—'}</td>
                    <td className="num mono">{money(b.rack)}</td>
                  </tr>
                )} headers={['Fecha', 'Cliente', 'Servicio', 'Rack']} />
              </>
            )}
            {canceled.length > 0 && (
              <>
                <h3>Últimas cancelaciones</h3>
                <ExpandableList items={canceled} renderRow={(b) => (
                  <tr key={b.id}>
                    <td className="mono">{String(b.date).slice(0, 10)}</td>
                    <td>{b.customer}</td>
                    <td className="cell-faint">{b.service || '—'}</td>
                  </tr>
                )} headers={['Fecha', 'Cliente', 'Servicio']} />
              </>
            )}
          </>
        );
      default:
        return null;
    }
  }

  const titles = {
    rack: 'Detalle de ingresos',
    net: 'Detalle de costos',
    profit: 'Detalle de utilidad',
    status: 'Estado de reservas',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="kpi-detail-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{titles[type]}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="kpi-detail-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

function ServiceRanking({ bookings }) {
  const serviceMap = new Map();
  for (const b of bookings) {
    if ((b.status || '').toLowerCase().includes('cancel')) continue;
    const svc = b.service || 'Sin servicio';
    const prev = serviceMap.get(svc) || { count: 0, rack: 0 };
    serviceMap.set(svc, { count: prev.count + 1, rack: prev.rack + (Number(b.rack) || 0) });
  }
  const sorted = [...serviceMap.entries()].sort((a, b) => b[1].rack - a[1].rack).slice(0, 10);

  return (
    <table className="kpi-detail-table">
      <thead><tr><th>Servicio</th><th className="num">Viajes</th><th className="num">Rack total</th></tr></thead>
      <tbody>
        {sorted.map(([svc, data]) => (
          <tr key={svc}>
            <td>{svc}</td>
            <td className="num">{data.count}</td>
            <td className="num mono">{money(data.rack)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExpandableList({ items, renderRow, headers, initialCount = 20 }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, initialCount);
  const remaining = items.length - initialCount;

  return (
    <>
      <table className="kpi-detail-table">
        <thead><tr>{headers.map((h, i) => <th key={i} className={i === headers.length - 1 ? 'num' : ''}>{h}</th>)}</tr></thead>
        <tbody>{visible.map(renderRow)}</tbody>
      </table>
      {remaining > 0 && !showAll && (
        <button className="kpi-expand-btn" onClick={() => setShowAll(true)}>
          Ver {remaining} más ▼
        </button>
      )}
      {showAll && items.length > initialCount && (
        <button className="kpi-expand-btn" onClick={() => setShowAll(false)}>
          Mostrar menos ▲
        </button>
      )}
    </>
  );
}
