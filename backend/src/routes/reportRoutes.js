// src/routes/reportRoutes.js
const express = require('express');
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/monthly', reportController.monthly);
router.get('/drivers', reportController.drivers);
router.get('/finance', reportController.finance);
router.get('/status-counts', reportController.statusCounts);
router.get('/driver-options', reportController.driverOptions);

module.exports = router;
