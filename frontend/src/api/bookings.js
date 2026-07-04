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
