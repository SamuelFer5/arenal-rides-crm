// src/controllers/bookingController.js
const { bookingService } = require('../services/bookingService');
const { isComplete } = require('../services/voucherService');
const asyncHandler = require('../utils/asyncHandler');

const bookingController = {
  list: asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    const bookings = await bookingService.list({ month, year });
    // Añadir flag de completitud a cada reserva
    const enriched = bookings.map((b) => ({ ...b, complete: isComplete(b) }));
    res.json({ bookings: enriched });
  }),

  getById: asyncHandler(async (req, res) => {
    const booking = await bookingService.getById(req.params.id);
    res.json({ booking: { ...booking, complete: isComplete(booking) } });
  }),

  getByDate: asyncHandler(async (req, res) => {
    const bookings = await bookingService.getByDate(req.params.date);
    res.json({ bookings });
  }),

  getLocked: asyncHandler(async (req, res) => {
    const bookings = await bookingService.getLocked();
    res.json({ bookings });
  }),

  create: asyncHandler(async (req, res) => {
    const booking = await bookingService.create(req.body, req.user);
    res.status(201).json({ booking });
  }),

  update: asyncHandler(async (req, res) => {
    const booking = await bookingService.update(req.params.id, req.body, req.user);
    res.json({ booking });
  }),

  remove: asyncHandler(async (req, res) => {
    await bookingService.remove(req.params.id, req.user);
    res.status(204).send();
  }),

  acquireLock: asyncHandler(async (req, res) => {
    const booking = await bookingService.acquireLock(req.params.id, req.user);
    res.json({ booking });
  }),

  releaseLock: asyncHandler(async (req, res) => {
    await bookingService.releaseLock(req.params.id, req.user);
    res.status(204).send();
  }),
};

module.exports = bookingController;
