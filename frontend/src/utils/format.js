// src/utils/format.js

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const ABBR = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function money(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(Number(n)).toLocaleString('en-US');
}

export function moneyK(n) {
  return '$' + Math.round(Number(n) / 1000) + 'k';
}

export function parsePax(pax) {
  if (!pax) return 0;
  const matches = String(pax).match(/\d+/g);
  if (!matches) return 0;
  return matches.reduce((sum, m) => sum + parseInt(m, 10), 0);
}

function toDateOnly(d) {
  return String(d).slice(0, 10);
}

export function fmtDate(d) {
  if (!d) return '';
  const parts = toDateOnly(d).split('-');
  return `${parts[2]} ${ABBR[parseInt(parts[1], 10) - 1]}`;
}

export function fmtDateFull(d) {
  if (!d) return '';
  const parts = toDateOnly(d).split('-');
  const dt = new Date(`${toDateOnly(d)}T00:00:00`);
  return `${DIAS[dt.getDay()]} ${parts[2]} ${MONTHS[parseInt(parts[1], 10) - 1].toLowerCase()} ${parts[0]}`;
}

export function monthFromDate(d) {
  const parts = toDateOnly(d).split('-');
  return MONTHS[parseInt(parts[1], 10) - 1];
}

export function statusInfo(status) {
  const v = (status || '').toLowerCase();
  if (v.includes('cancel')) {
    return { label: 'Cancelada', className: 'status-canceled' };
  }
  if (v.includes('confirm')) {
    return { label: 'Confirmada', className: 'status-confirmed' };
  }
  return { label: status || 'Pendiente', className: 'status-pending' };
}

export { MONTHS, ABBR };
