// src/routes/driverRoutes.js
const express = require('express');
const driverController = require('../controllers/driverController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', driverController.listAll);
router.get('/active', driverController.listActive);
router.post('/', driverController.create);
router.patch('/:id/active', requireRole('admin'), driverController.toggleActive);

module.exports = router;
