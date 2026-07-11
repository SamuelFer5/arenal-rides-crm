// src/models/financeModel.js
const { query } = require('../config/db');

const financeModel = {
  // ---- EXPENSES ----
  async listExpenses() {
    const res = await query('SELECT * FROM expenses ORDER BY created_at DESC');
    return res.rows;
  },

  async createExpense(concept, amount) {
    const res = await query(
      'INSERT INTO expenses (concept, amount) VALUES ($1, $2) RETURNING *',
      [concept, Number(amount)]
    );
    return res.rows[0];
  },

  async updateExpense(id, concept, amount) {
    const res = await query(
      'UPDATE expenses SET concept = $2, amount = $3 WHERE id = $1 RETURNING *',
      [id, concept, Number(amount)]
    );
    return res.rows[0];
  },

  async deleteExpense(id) {
    await query('DELETE FROM expenses WHERE id = $1', [id]);
  },

  async expenseTotal() {
    const res = await query('SELECT COALESCE(SUM(amount),0) AS total FROM expenses');
    return Number(res.rows[0].total);
  },

  // ---- PROVIDER PAYOUTS ----
  async listProviderPayouts() {
    const res = await query('SELECT * FROM provider_payouts ORDER BY created_at DESC');
    return res.rows;
  },

  async createPayout(name, amount) {
    const res = await query(
      'INSERT INTO provider_payouts (name, amount) VALUES ($1, $2) RETURNING *',
      [name, Number(amount)]
    );
    return res.rows[0];
  },

  async updatePayout(id, name, amount) {
    const res = await query(
      'UPDATE provider_payouts SET name = $2, amount = $3 WHERE id = $1 RETURNING *',
      [id, name, Number(amount)]
    );
    return res.rows[0];
  },

  async deletePayout(id) {
    await query('DELETE FROM provider_payouts WHERE id = $1', [id]);
  },

  async payoutTotal() {
    const res = await query('SELECT COALESCE(SUM(amount),0) AS total FROM provider_payouts');
    return Number(res.rows[0].total);
  },
};

module.exports = financeModel;
