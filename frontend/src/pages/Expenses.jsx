// src/pages/Expenses.jsx
import { useEffect, useState } from 'react';
import { reportsApi } from '../api/reports';
import KpiCard from '../components/KpiCard';
import { money } from '../utils/format';
import './Expenses.css';

export default function Expenses() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.finance().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-content"><div className="app-content-inner">Cargando…</div></div>;

  const net = data.payoutTotal - data.expenseTotal;

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-header-title">Gastos</div>
          <div className="app-header-subtitle">Gastos operativos y pagos a proveedores</div>
        </div>
      </header>

      <div className="app-content">
        <div className="app-content-inner">
          <div className="kpi-grid">
            <KpiCard label="Gastos operativos" value={money(data.expenseTotal)} />
            <KpiCard label="Pagos a proveedores" value={money(data.payoutTotal)} />
            <KpiCard label="Diferencia" value={money(net)} color={net >= 0 ? '#1E7A4C' : '#B23A48'} />
          </div>

          <div className="expenses-grid">
            <div className="expenses-card">
              <div className="dash-card-title">Gastos operativos</div>
              <table className="expenses-table">
                <tbody>
                  {data.expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="exp-concept">{e.concept}</td>
                      <td className="num mono">{money(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="expenses-card">
              <div className="dash-card-title">Pagos a proveedores</div>
              <table className="expenses-table">
                <tbody>
                  {data.providerPayouts.map((p) => (
                    <tr key={p.id}>
                      <td className="exp-concept">{p.name}</td>
                      <td className="num mono">{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
