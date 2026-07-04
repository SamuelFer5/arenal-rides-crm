// src/models/financeModel.js
const { query } = require('../config/db');

const financeModel = {
  async listExpenses() {
    const res = await query('SELECT * FROM expenses ORDER BY amount DESC');
    return res.rows;
  },

  async listProviderPayouts() {
    const res = await query('SELECT * FROM provider_payouts ORDER BY amount DESC');
    return res.rows;
  },

  async expenseTotal() {
    const res = await query('SELECT COALESCE(SUM(amount),0) AS total FROM expenses');
    return Number(res.rows[0].total);
  },

  async payoutTotal() {
    const res = await query('SELECT COALESCE(SUM(amount),0) AS total FROM provider_payouts');
    return Number(res.rows[0].total);
  },
};

module.exports = financeModel;
