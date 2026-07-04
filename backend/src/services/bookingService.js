// src/services/bookingService.js
const { withTransaction } = require('../config/db');
const bookingModel = require('../models/bookingModel');
const auditModel = require('../models/auditModel');

// Un bloqueo "vivo" simulado en el prototipo nunca caducaba; aquí le damos
// una expiración real para que si alguien cierra el navegador a medio
// editar, la reserva no quede bloqueada para siempre.
const LOCK_TTL_MINUTES = 15;

class BookingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function isLockExpired(lockedAt) {
  if (!lockedAt) return true;
  const ageMs = Date.now() - new Date(lockedAt).getTime();
  return ageMs > LOCK_TTL_MINUTES * 60 * 1000;
}

// Suma los números dentro de un texto de pax tipo "2.0" o "2+3" (igual que
// paxNum() en el prototipo original).
function parsePax(pax) {
  if (!pax) return 0;
  const matches = String(pax).match(/\d+/g);
  if (!matches) return 0;
  return matches.reduce((sum, n) => sum + parseInt(n, 10), 0);
}

const bookingService = {
  parsePax,

  async list({ month, year }) {
    return bookingModel.findAll({ month, year });
  },

  async getById(id) {
    const booking = await bookingModel.findById(id);
    if (!booking) throw new BookingError('Reserva no encontrada.', 404);
    return booking;
  },

  async getByDate(date) {
    return bookingModel.findByDate(date);
  },

  async getLocked() {
    return bookingModel.findLocked();
  },

  /**
   * Intenta tomar el lock de edición de una reserva para un usuario.
   * Si está bloqueada por otra persona y el lock no ha expirado, falla.
   */
  async acquireLock(bookingId, user) {
    const booking = await bookingModel.findById(bookingId);
    if (!booking) throw new BookingError('Reserva no encontrada.', 404);

    const lockedByOther = booking.locked_by && booking.locked_by !== user.id;
    if (lockedByOther && !isLockExpired(booking.locked_at)) {
      throw new BookingError(
        `Esta reserva está siendo editada por ${booking.locked_by_name || 'otro usuario'}.`,
        409
      );
    }

    await bookingModel.setLock(bookingId, user.id);
    return bookingModel.findById(bookingId);
  },

  async releaseLock(bookingId, user) {
    const booking = await bookingModel.findById(bookingId);
    if (!booking) throw new BookingError('Reserva no encontrada.', 404);
    if (booking.locked_by && booking.locked_by !== user.id && user.role !== 'admin') {
      throw new BookingError('No tienes permiso para liberar este bloqueo.', 403);
    }
    await bookingModel.releaseLock(bookingId);
  },

  /**
   * Crea una reserva nueva. El profit SIEMPRE se calcula en el servidor a
   * partir de rack/net — nunca se confía en un profit enviado por el cliente.
   */
  async create(payload, user) {
    const driverId = await bookingModel.resolveDriverId(payload.driver);
    const rack = payload.rack === '' || payload.rack == null ? null : Number(payload.rack);
    const net = payload.net === '' || payload.net == null ? null : Number(payload.net);
    const profit = rack != null && net != null ? +(rack - net).toFixed(2) : null;

    const data = {
      date: payload.date,
      time: payload.time || null,
      customer: payload.customer,
      service: payload.service || null,
      pax: payload.pax || null,
      pickup: payload.pickup || null,
      dropoff: payload.dropoff || null,
      status: payload.status || 'Confirmed',
      driverId,
      rack, net, profit,
      deposit: payload.deposit === '' || payload.deposit == null ? null : Number(payload.deposit),
      phone: payload.phone || null,
      notes: payload.notes || null,
      createdBy: user.id,
    };

    if (!data.customer || !data.date) {
      throw new BookingError('Cliente y fecha son obligatorios.');
    }

    return withTransaction(async (client) => {
      const id = await bookingModel.create(data, client);
      await auditModel.log(
        { userId: user.id, action: 'create_booking', entityType: 'booking', entityId: id },
        client
      );
      return id;
    }).then((id) => bookingModel.findById(id));
  },

  /**
   * Actualiza una reserva existente, respetando el bloqueo de edición.
   */
  async update(id, payload, user) {
    const existing = await bookingModel.findById(id);
    if (!existing) throw new BookingError('Reserva no encontrada.', 404);

    const lockedByOther = existing.locked_by && existing.locked_by !== user.id;
    if (lockedByOther && !isLockExpired(existing.locked_at)) {
      throw new BookingError(
        `No puedes editar: ${existing.locked_by_name || 'otro usuario'} está editando esta reserva.`,
        409
      );
    }

    const driverId = payload.driver !== undefined
      ? await bookingModel.resolveDriverId(payload.driver)
      : existing.driver_id;

    const merged = {
      date: payload.date !== undefined ? payload.date : existing.date,
      time: payload.time !== undefined ? payload.time : existing.time,
      customer: payload.customer !== undefined ? payload.customer : existing.customer,
      service: payload.service !== undefined ? payload.service : existing.service,
      pax: payload.pax !== undefined ? payload.pax : existing.pax,
      pickup: payload.pickup !== undefined ? payload.pickup : existing.pickup,
      dropoff: payload.dropoff !== undefined ? payload.dropoff : existing.dropoff,
      status: payload.status !== undefined ? payload.status : existing.status,
      rack: payload.rack !== undefined ? payload.rack : existing.rack,
      net: payload.net !== undefined ? payload.net : existing.net,
      deposit: payload.deposit !== undefined ? payload.deposit : existing.deposit,
      phone: payload.phone !== undefined ? payload.phone : existing.phone,
      notes: payload.notes !== undefined ? payload.notes : existing.notes,
    };

    const rack = merged.rack === '' || merged.rack == null ? null : Number(merged.rack);
    const net = merged.net === '' || merged.net == null ? null : Number(merged.net);
    const profit = rack != null && net != null ? +(rack - net).toFixed(2) : null;

    const data = {
      date: merged.date,
      time: merged.time || null,
      customer: merged.customer,
      service: merged.service || null,
      pax: merged.pax || null,
      pickup: merged.pickup || null,
      dropoff: merged.dropoff || null,
      status: merged.status || 'Confirmed',
      driverId,
      rack, net, profit,
      deposit: merged.deposit === '' || merged.deposit == null ? null : Number(merged.deposit),
      phone: merged.phone || null,
      notes: merged.notes || null,
      modifiedBy: user.id,
    };

    return withTransaction(async (client) => {
      await bookingModel.update(id, data, client);
      await auditModel.log(
        { userId: user.id, action: 'update_booking', entityType: 'booking', entityId: id },
        client
      );
    }).then(() => bookingModel.findById(id));
  },

  async remove(id, user) {
    const existing = await bookingModel.findById(id);
    if (!existing) throw new BookingError('Reserva no encontrada.', 404);

    if (user.role !== 'admin' && existing.created_by !== user.id) {
      throw new BookingError('No tienes permiso para eliminar esta reserva.', 403);
    }

    return withTransaction(async (client) => {
      await bookingModel.delete(id, client);
      await auditModel.log(
        { userId: user.id, action: 'delete_booking', entityType: 'booking', entityId: id },
        client
      );
    });
  },

  /**
   * Agrega rack/net/profit/pax/conteos de una lista de reservas — usado por
   * dashboard y agenda. Replica agg() del prototipo.
   */
  aggregate(bookings) {
    let rack = 0, net = 0, pax = 0, confirmed = 0, canceled = 0, pending = 0;
    for (const b of bookings) {
      const status = (b.status || '').toLowerCase();
      if (status.includes('cancel')) { canceled++; continue; }
      rack += Number(b.rack) || 0;
      net += Number(b.net) || 0;
      pax += parsePax(b.pax);
      if (status.includes('confirm')) confirmed++;
      else pending++;
    }
    const total = bookings.length;
    const activeCount = total - canceled;
    return { rack, net, profit: rack - net, pax, count: activeCount, total, confirmed, canceled, pending };
  },
};

module.exports = { bookingService, BookingError };
