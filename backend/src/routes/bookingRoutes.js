// src/routes/bookingRoutes.js
const express = require('express');
const bookingController = require('../controllers/bookingController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth); // todas las rutas de reservas requieren sesión

router.get('/', bookingController.list);
router.get('/locked', bookingController.getLocked);
router.get('/by-date/:date', bookingController.getByDate);
router.get('/:id', bookingController.getById);
router.post('/', bookingController.create);
router.put('/:id', bookingController.update);
router.delete('/:id', bookingController.remove);
router.post('/:id/lock', bookingController.acquireLock);
router.delete('/:id/lock', bookingController.releaseLock);

module.exports = router;
