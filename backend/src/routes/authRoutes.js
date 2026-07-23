// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/security');

const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.get('/me', requireAuth, authController.me);

module.exports = router;
