// src/api/bookings.js
import { api } from './client';

export const bookingsApi = {
  list: (params) => api.get('/bookings', params),
  getById: (id) => api.get(`/bookings/${id}`),
  getByDate: (date) => api.get(`/bookings/by-date/${date}`),
  getLocked: () => api.get('/bookings/locked'),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  remove: (id) => api.delete(`/bookings/${id}`),
  acquireLock: (id) => api.post(`/bookings/${id}/lock`),
  releaseLock: (id) => api.delete(`/bookings/${id}/lock`),
};

/**
 * Descarga un voucher PDF. Usa fetch directo porque no es JSON.
 */
export async function downloadVoucher(bookingId, type) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  let token = null;
  try { token = localStorage.getItem('arenal_token'); } catch { /* */ }

  const res = await fetch(`${API_URL}/vouchers/${bookingId}?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = type === 'driver'
    ? `Orden_Servicio_${bookingId}.pdf`
    : `Confirmacion_Reserva_${bookingId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
