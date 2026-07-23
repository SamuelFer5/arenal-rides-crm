// src/controllers/voucherController.js
const { bookingService } = require('../services/bookingService');
const { generateVoucher } = require('../services/voucherService');
const asyncHandler = require('../utils/asyncHandler');

const voucherController = {
  download: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // 'driver' o 'client'

    if (!type || !['driver', 'client'].includes(type)) {
      return res.status(400).json({ error: 'Parámetro type requerido: driver o client.' });
    }

    const booking = await bookingService.getById(id);

    const filename = type === 'driver'
      ? `Orden_Servicio_${id}.pdf`
      : `Confirmacion_Reserva_${id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateVoucher(booking, type, res, req.user.name);
  }),
};

module.exports = voucherController;
