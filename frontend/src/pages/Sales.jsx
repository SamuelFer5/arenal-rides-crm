// src/pages/Sales.jsx
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { reportsApi } from '../api/reports';
import { money, moneyK } from '../utils/format';
import './Sales.css';

export default function Sales() {
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.monthly().then((res) => setMonthly(res.monthly)).finally(() => setLoading(false));
  }, []);

  const activeMonths = monthly.filter((m) => m.rack > 0);
  const totalRack = activeMonths.reduce((s, m) => s + m.rack, 0);
  const totalProfit = activeMonths.reduce((s, m) => s + m.profit, 0);
  const totalPax = activeMonths.reduce((s, m) => s + m.pax, 0);

  if (loading) return <div className="app-content"><div className="app-content-inner">Cargando…</div></div>;

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-header-title">Ventas</div>
          <div className="app-header-subtitle">Desempeño mensual del negocio</div>
        </div>
      </header>

      <div className="app-content">
        <div className="app-content-inner">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Ingresos totales</div>
              <div className="kpi-value">{money(totalRack)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Utilidad total</div>
              <div className="kpi-value" style={{ color: '#1E7A4C' }}>{money(totalProfit)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Pasajeros totales</div>
              <div className="kpi-value">{totalPax.toLocaleString()}</div>
            </div>
          </div>

          <div className="sales-chart-card">
            <div className="dash-card-title">Ingresos vs. utilidad por mes</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF0EC" vertical={false} />
                <XAxis dataKey="month" tickFormatter={(m) => m.slice(0, 3)} tick={{ fontSize: 11, fill: '#8A958C' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={moneyK} tick={{ fontSize: 11, fill: '#8A958C' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rack" name="Ingresos" fill="#274C66" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Utilidad" fill="#9FBAC9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="sales-chart-card">
            <div className="dash-card-title">Pasajeros por mes</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthly} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF0EC" vertical={false} />
                <XAxis dataKey="month" tickFormatter={(m) => m.slice(0, 3)} tick={{ fontSize: 11, fill: '#8A958C' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8A958C' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip />
                <Line type="monotone" dataKey="pax" stroke="#E07B2A" strokeWidth={2.4} dot={{ r: 3 }} name="Pasajeros" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="sales-table-card">
            <div className="dash-card-title">Detalle mensual</div>
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="num">Pax</th>
                  <th className="num">Rack</th>
                  <th className="num">Net</th>
                  <th className="num">Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.month}>
                    <td>{m.month}</td>
                    <td className="num mono">{m.pax}</td>
                    <td className="num mono">{money(m.rack)}</td>
                    <td className="num mono">{money(m.net)}</td>
                    <td className="num mono profit-cell">{money(m.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
