// src/api/users.js
import { api } from './client';

export const usersApi = {
  list: () => api.get('/users'),
  toggleActive: (id) => api.patch(`/users/${id}/active`),
  setRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  create: (data) => api.post('/users', data),
  changePassword: (currentPassword, newPassword) =>
    api.post('/users/change-password', { currentPassword, newPassword }),
  updateProfile: (data) => api.patch('/users/profile', data),
  auditLog: (limit) => api.get('/users/audit-log', { limit }),
};
