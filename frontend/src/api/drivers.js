// src/api/drivers.js
import { api } from './client';

export const driversApi = {
  listAll: () => api.get('/drivers'),
  listActive: () => api.get('/drivers/active'),
  toggleActive: (id) => api.patch(`/drivers/${id}/active`),
  setPaymentStatus: (id, status) => api.patch(`/drivers/${id}/payment`, { status }),
  create: (name) => api.post('/drivers', { name }),
};
