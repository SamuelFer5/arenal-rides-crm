// src/controllers/authController.js
const { authService } = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const authController = {
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }
    const result = await authService.login(email, password);
    res.json(result);
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
};

module.exports = authController;
