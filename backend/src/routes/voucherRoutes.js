// src/routes/voucherRoutes.js
const express = require('express');
const voucherController = require('../controllers/voucherController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/vouchers/:id?type=driver  → PDF orden de servicio
// GET /api/vouchers/:id?type=client  → PDF confirmación de reserva
router.get('/:id', voucherController.download);

module.exports = router;
