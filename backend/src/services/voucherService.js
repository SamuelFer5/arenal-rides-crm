// src/services/voucherService.js
const PDFDocument = require('pdfkit');

const ACCENT = '#274C66';
const LIGHT_BG = '#F6F7F3';
const BORDER = '#E8EAE4';
const GREEN = '#1E7A4C';
const MUTED = '#5C675E';

/**
 * Genera un PDF de voucher y lo escribe a un stream (res).
 * @param {object} booking - La reserva con sus datos (incluyendo driver)
 * @param {'driver'|'client'} type - Tipo de voucher
 * @param {object} stream - Stream de escritura (res de Express)
 * @param {string} generatedBy - Nombre del usuario que genera el voucher
 */
function generateVoucher(booking, type, stream, generatedBy) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: type === 'driver'
        ? `Orden de Servicio #${booking.id}`
        : `Confirmación de Reserva #${booking.id}`,
      Author: 'Travio',
    },
  });

  doc.pipe(stream);

  // ---- Header ----
  doc
    .fontSize(22)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text('Travio', 50, 50);

  doc
    .fontSize(9)
    .fillColor(MUTED)
    .font('Helvetica')
    .text('Gestión de transporte', 50, 76);

  // Tipo de documento
  const docTitle = type === 'driver'
    ? 'ORDEN DE SERVICIO'
    : 'CONFIRMACIÓN DE RESERVA';

  doc
    .fontSize(11)
    .fillColor(ACCENT)
    .font('Helvetica-Bold')
    .text(docTitle, 350, 50, { align: 'right' });

  doc
    .fontSize(18)
    .text(`#${booking.id}`, 350, 65, { align: 'right' });

  // Línea separadora
  doc
    .moveTo(50, 100)
    .lineTo(545, 100)
    .strokeColor(BORDER)
    .lineWidth(1)
    .stroke();

  // ---- Info principal ----
  let y = 120;

  // Fecha y hora
  const dateStr = formatDate(booking.date);
  const timeStr = booking.time || 'Por confirmar';

  drawField(doc, 'Fecha', dateStr, 50, y);
  drawField(doc, 'Hora', timeStr, 300, y);
  y += 40;

  // Estado
  const statusLabel = getStatusLabel(booking.status);
  drawField(doc, 'Estado', statusLabel, 50, y);
  y += 40;

  // Cliente
  drawField(doc, 'Cliente', booking.customer || '—', 50, y);
  if (type === 'driver') {
    drawField(doc, 'Pasajeros', booking.pax || '—', 300, y);
  }
  y += 40;

  // Servicio
  drawField(doc, 'Servicio', booking.service || '—', 50, y, 495);
  y += 40;

  // Pickup / Dropoff
  drawField(doc, 'Recogida (Pickup)', booking.pickup || '—', 50, y, 495);
  y += 40;
  drawField(doc, 'Destino (Dropoff)', booking.dropoff || '—', 50, y, 495);
  y += 50;

  // ---- Sección dependiente del tipo ----

  if (type === 'driver') {
    // Voucher para conductor: SOLO datos operativos, SIN montos
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor(BORDER)
      .stroke();
    y += 20;

    drawField(doc, 'Pasajeros', booking.pax || '—', 50, y);
    drawField(doc, 'Conductor asignado', booking.driver || 'Por asignar', 250, y);
    y += 40;

    drawField(doc, 'Teléfono del cliente', booking.phone || '—', 50, y);
    y += 40;

    if (booking.notes) {
      drawField(doc, 'Notas', '', 50, y);
      y += 18;
      doc
        .fontSize(10)
        .fillColor('#333')
        .font('Helvetica')
        .text(booking.notes, 50, y, { width: 495 });
      y += doc.heightOfString(booking.notes, { width: 495 }) + 20;
    }
  } else {
    // Voucher para cliente: datos de confirmación CON precios
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor(BORDER)
      .stroke();
    y += 20;

    doc
      .fontSize(12)
      .fillColor(ACCENT)
      .font('Helvetica-Bold')
      .text('Detalle de precio', 50, y);
    y += 25;

    // Tabla de precios
    const rack = booking.rack != null ? `$${Number(booking.rack).toLocaleString('en-US')}` : '—';
    const deposit = booking.deposit != null ? `$${Number(booking.deposit).toLocaleString('en-US')}` : '—';
    const balance = (booking.rack != null && booking.deposit != null)
      ? `$${(Number(booking.rack) - Number(booking.deposit)).toLocaleString('en-US')}`
      : '—';

    drawPriceRow(doc, 'Precio total', rack, 50, y);
    y += 24;
    drawPriceRow(doc, 'Depósito recibido', deposit, 50, y);
    y += 24;

    doc
      .moveTo(300, y)
      .lineTo(545, y)
      .strokeColor(BORDER)
      .stroke();
    y += 8;

    drawPriceRow(doc, 'Balance pendiente', balance, 50, y, true);
    y += 40;

    if (booking.notes) {
      drawField(doc, 'Notas', booking.notes, 50, y, 495);
      y += 40;
    }
  }

  // ---- Footer ----
  const footerY = 750;
  doc
    .moveTo(50, footerY)
    .lineTo(545, footerY)
    .strokeColor(BORDER)
    .stroke();

  doc
    .fontSize(8)
    .fillColor(MUTED)
    .font('Helvetica')
    .text(
      `Generado por ${generatedBy || 'Sistema'} el ${new Date().toLocaleDateString('es-CR')} · Travio`,
      50, footerY + 10, { align: 'center', width: 495 }
    );

  doc.end();
}

function drawField(doc, label, value, x, y, maxWidth) {
  doc
    .fontSize(8)
    .fillColor(MUTED)
    .font('Helvetica-Bold')
    .text(label.toUpperCase(), x, y);

  doc
    .fontSize(12)
    .fillColor('#16201A')
    .font('Helvetica')
    .text(value || '—', x, y + 14, maxWidth ? { width: maxWidth } : {});
}

function drawPriceRow(doc, label, value, x, y, bold) {
  doc
    .fontSize(11)
    .fillColor(MUTED)
    .font('Helvetica')
    .text(label, x, y);

  doc
    .fontSize(bold ? 14 : 12)
    .fillColor(bold ? GREEN : '#16201A')
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .text(value, 400, y, { align: 'right', width: 145 });
}

function formatDate(d) {
  if (!d) return '—';
  const iso = String(d).slice(0, 10);
  const [year, month, day] = iso.split('-');
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
}

function getStatusLabel(status) {
  const v = (status || '').toLowerCase();
  if (v.includes('cancel')) return 'Cancelada';
  if (v.includes('confirm')) return 'Confirmada';
  return status || 'Pendiente';
}

/**
 * Verifica si una reserva tiene toda la información obligatoria.
 * Campos requeridos: customer, date, pickup, dropoff, driver, rack.
 */
function isComplete(booking) {
  return !!(
    booking.customer &&
    booking.date &&
    booking.pickup &&
    booking.dropoff &&
    (booking.driver || booking.driver_id) &&
    booking.rack != null && booking.rack !== ''
  );
}

module.exports = { generateVoucher, isComplete };
