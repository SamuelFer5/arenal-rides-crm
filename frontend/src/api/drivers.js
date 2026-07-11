// src/api/drivers.js
import { api } from './client';

export const driversApi = {
  listAll: () => api.get('/drivers'),
  listActive: () => api.get('/drivers/active'),
  toggleActive: (id) => api.patch(`/drivers/${id}/active`),
  create: (name) => api.post('/drivers', { name }),
};
