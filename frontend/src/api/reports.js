// src/api/reports.js
import { api } from './client';

export const reportsApi = {
  monthly: () => api.get('/reports/monthly'),
  drivers: () => api.get('/reports/drivers'),
  finance: () => api.get('/reports/finance'),
  statusCounts: (month) => api.get('/reports/status-counts', { month }),
  driverOptions: (month) => api.get('/reports/driver-options', { month }),
};
