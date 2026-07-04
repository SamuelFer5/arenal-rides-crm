// src/controllers/reportController.js
const { reportService } = require('../services/reportService');
const asyncHandler = require('../utils/asyncHandler');

const reportController = {
  monthly: asyncHandler(async (req, res) => {
    const monthly = await reportService.monthly();
    res.json({ monthly });
  }),

  drivers: asyncHandler(async (req, res) => {
    const drivers = await reportService.drivers();
    res.json({ drivers });
  }),

  finance: asyncHandler(async (req, res) => {
    const finance = await reportService.finance();
    res.json(finance);
  }),

  statusCounts: asyncHandler(async (req, res) => {
    const counts = await reportService.statusCounts(req.query.month);
    res.json({ counts });
  }),

  driverOptions: asyncHandler(async (req, res) => {
    const drivers = await reportService.driverOptionsForMonth(req.query.month);
    res.json({ drivers });
  }),
};

module.exports = reportController;
