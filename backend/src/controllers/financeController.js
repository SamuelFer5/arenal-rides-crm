// src/controllers/financeController.js
const financeModel = require('../models/financeModel');
const asyncHandler = require('../utils/asyncHandler');

const financeController = {
  // ---- EXPENSES ----
  listExpenses: asyncHandler(async (req, res) => {
    const expenses = await financeModel.listExpenses();
    const total = await financeModel.expenseTotal();
    res.json({ expenses, total });
  }),

  createExpense: asyncHandler(async (req, res) => {
    const { concept, amount } = req.body;
    if (!concept || !concept.trim()) return res.status(400).json({ error: 'El concepto es obligatorio.' });
    if (!amount || isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
    const expense = await financeModel.createExpense(concept.trim(), amount);
    res.status(201).json({ expense });
  }),

  updateExpense: asyncHandler(async (req, res) => {
    const { concept, amount } = req.body;
    if (!concept || !concept.trim()) return res.status(400).json({ error: 'El concepto es obligatorio.' });
    if (!amount || isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
    const expense = await financeModel.updateExpense(req.params.id, concept.trim(), amount);
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado.' });
    res.json({ expense });
  }),

  deleteExpense: asyncHandler(async (req, res) => {
    await financeModel.deleteExpense(req.params.id);
    res.status(204).send();
  }),

  // ---- PROVIDER PAYOUTS ----
  listPayouts: asyncHandler(async (req, res) => {
    const payouts = await financeModel.listProviderPayouts();
    const total = await financeModel.payoutTotal();
    res.json({ payouts, total });
  }),

  createPayout: asyncHandler(async (req, res) => {
    const { name, amount } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    if (!amount || isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
    const payout = await financeModel.createPayout(name.trim(), amount);
    res.status(201).json({ payout });
  }),

  updatePayout: asyncHandler(async (req, res) => {
    const { name, amount } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    if (!amount || isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
    const payout = await financeModel.updatePayout(req.params.id, name.trim(), amount);
    if (!payout) return res.status(404).json({ error: 'Pago no encontrado.' });
    res.json({ payout });
  }),

  deletePayout: asyncHandler(async (req, res) => {
    await financeModel.deletePayout(req.params.id);
    res.status(204).send();
  }),
};

module.exports = financeController;
