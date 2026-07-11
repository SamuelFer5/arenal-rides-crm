// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const driverRoutes = require('./routes/driverRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
// CORS: acepta una lista de orígenes separados por coma en FRONTEND_URL.
// Ejemplo: FRONTEND_URL=http://localhost:5173,https://arenalrides.onrender.com
// Si no se define, en desarrollo permite cualquier origen.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Peticiones sin origin (curl, apps móviles, same-origin) se permiten.
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/drivers', driverRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
