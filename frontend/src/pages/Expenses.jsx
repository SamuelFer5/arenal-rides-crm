// src/pages/Expenses.jsx
import { useEffect, useState, useCallback } from 'react';
import { financeApi } from '../api/finance';
import KpiCard from '../components/KpiCard';
import ConfirmModal from '../components/ConfirmModal';
import { money } from '../utils/format';
import './Expenses.css';

function ItemModal({ type, item, onClose, onSave }) {
  const isExpense = type === 'expense';
  const [label, setLabel] = useState(item ? (isExpense ? item.concept : item.name) : '');
  const [amount, setAmount] = useState(item ? item.amount : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (item) {
        if (isExpense) await financeApi.updateExpense(item.id, label, Number(amount));
        else await financeApi.updatePayout(item.id, label, Number(amount));
      } else {
        if (isExpense) await financeApi.createExpense(label, Number(amount));
        else await financeApi.createPayout(label, Number(amount));
      }
      onSave();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Editar' : 'Agregar'} {isExpense ? 'gasto' : 'pago a proveedor'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="booking-form">
          <label>{isExpense ? 'Concepto' : 'Nombre del proveedor'}
            <input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder={isExpense ? 'Ej: Combustible' : 'Ej: North Fields'} />
          </label>
          <label>Monto ($)
            <input type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal de agregar/editar
  const [editingItem, setEditingItem] = useState(null); // { type, item? }
  // Modal de confirmar borrado
  const [deleting, setDeleting] = useState(null); // { type, item }
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([financeApi.listExpenses(), financeApi.listPayouts()])
      .then(([e, p]) => {
        setExpenses(e.expenses); setExpenseTotal(e.total);
        setPayouts(p.payouts); setPayoutTotal(p.total);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      if (deleting.type === 'expense') await financeApi.deleteExpense(deleting.item.id);
      else await financeApi.deletePayout(deleting.item.id);
      setDeleting(null);
      load();
    } catch (err) { alert(err.message); }
    finally { setDeleteLoading(false); }
  }

  const net = payoutTotal - expenseTotal;

  if (loading) return <div className="app-content"><div className="app-content-inner">Cargando…</div></div>;

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
            <KpiCard label="Gastos operativos" value={money(expenseTotal)} />
            <KpiCard label="Pagos a proveedores" value={money(payoutTotal)} />
            <KpiCard label="Diferencia" value={money(net)} color={net >= 0 ? '#1E7A4C' : '#B23A48'} />
          </div>

          <div className="expenses-grid">
            {/* Gastos operativos */}
            <div className="expenses-card">
              <div className="expenses-card-header">
                <div className="dash-card-title" style={{ margin: 0 }}>Gastos operativos</div>
                <button className="exp-add-btn" onClick={() => setEditingItem({ type: 'expense' })}>+ Agregar</button>
              </div>
              <table className="expenses-table">
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="exp-concept">{e.concept}</td>
                      <td className="num mono">{money(e.amount)}</td>
                      <td className="exp-actions">
                        <button className="exp-icon-btn" title="Editar" onClick={() => setEditingItem({ type: 'expense', item: e })}>✎</button>
                        <button className="exp-icon-btn exp-icon-danger" title="Eliminar" onClick={() => setDeleting({ type: 'expense', item: e })}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && <tr><td colSpan={3} className="exp-empty">No hay gastos registrados.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Pagos a proveedores */}
            <div className="expenses-card">
              <div className="expenses-card-header">
                <div className="dash-card-title" style={{ margin: 0 }}>Pagos a proveedores</div>
                <button className="exp-add-btn" onClick={() => setEditingItem({ type: 'payout' })}>+ Agregar</button>
              </div>
              <table className="expenses-table">
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="exp-concept">{p.name}</td>
                      <td className="num mono">{money(p.amount)}</td>
                      <td className="exp-actions">
                        <button className="exp-icon-btn" title="Editar" onClick={() => setEditingItem({ type: 'payout', item: p })}>✎</button>
                        <button className="exp-icon-btn exp-icon-danger" title="Eliminar" onClick={() => setDeleting({ type: 'payout', item: p })}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && <tr><td colSpan={3} className="exp-empty">No hay pagos registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal agregar/editar */}
      {editingItem && (
        <ItemModal
          type={editingItem.type}
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
          onSave={() => { setEditingItem(null); load(); }}
        />
      )}

      {/* Modal confirmar borrado */}
      {deleting && (
        <ConfirmModal
          title="Eliminar registro"
          message={`¿Estás seguro de eliminar "${deleting.type === 'expense' ? deleting.item.concept : deleting.item.name}" por ${money(deleting.item.amount)}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
