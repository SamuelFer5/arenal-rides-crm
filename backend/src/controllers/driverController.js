// src/controllers/driverController.js
const driverModel = require('../models/driverModel');
const asyncHandler = require('../utils/asyncHandler');

const driverController = {
  /** Todos los conductores con métricas (admin) */
  listAll: asyncHandler(async (req, res) => {
    const drivers = await driverModel.findAll();
    res.json({ drivers });
  }),

  /** Solo activos (para dropdowns) */
  listActive: asyncHandler(async (req, res) => {
    const drivers = await driverModel.findActive();
    res.json({ drivers });
  }),

  toggleActive: asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo admin puede activar/desactivar conductores.' });
    }
    const driver = await driverModel.toggleActive(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado.' });
    res.json({ driver });
  }),

  create: asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }
    const driver = await driverModel.create(name);
    res.status(201).json({ driver });
  }),
};

module.exports = driverController;
