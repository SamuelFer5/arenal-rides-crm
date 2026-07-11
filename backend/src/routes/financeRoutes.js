// src/routes/financeRoutes.js
const express = require('express');
const financeController = require('../controllers/financeController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);

// Gastos operativos
router.get('/expenses', financeController.listExpenses);
router.post('/expenses', financeController.createExpense);
router.put('/expenses/:id', financeController.updateExpense);
router.delete('/expenses/:id', financeController.deleteExpense);

// Pagos a proveedores
router.get('/payouts', financeController.listPayouts);
router.post('/payouts', financeController.createPayout);
router.put('/payouts/:id', financeController.updatePayout);
router.delete('/payouts/:id', financeController.deletePayout);

module.exports = router;
