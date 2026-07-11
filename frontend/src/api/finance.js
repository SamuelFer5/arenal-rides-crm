// src/api/finance.js
import { api } from './client';

export const financeApi = {
  // Gastos operativos
  listExpenses: () => api.get('/finance/expenses'),
  createExpense: (concept, amount) => api.post('/finance/expenses', { concept, amount }),
  updateExpense: (id, concept, amount) => api.put(`/finance/expenses/${id}`, { concept, amount }),
  deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),

  // Pagos a proveedores
  listPayouts: () => api.get('/finance/payouts'),
  createPayout: (name, amount) => api.post('/finance/payouts', { name, amount }),
  updatePayout: (id, name, amount) => api.put(`/finance/payouts/${id}`, { name, amount }),
  deletePayout: (id) => api.delete(`/finance/payouts/${id}`),
};
