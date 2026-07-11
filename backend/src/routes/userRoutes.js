// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', userController.list);
router.post('/change-password', userController.changePassword);
router.patch('/profile', userController.updateProfile);
router.get('/audit-log', requireRole('admin'), userController.auditLog);
router.patch('/:id/active', requireRole('admin'), userController.toggleActive);
router.patch('/:id/role', requireRole('admin'), userController.setRole);
router.post('/', requireRole('admin'), userController.create);

module.exports = router;
