// src/middlewares/security.js
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter para el login: máximo 10 intentos por IP cada 15 minutos.
 * Después de 10 intentos fallidos, bloquea esa IP temporalmente.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Solo cuenta intentos fallidos (status >= 400)
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter general para la API: máximo 200 requests por minuto por IP.
 * Protege contra scraping masivo y DoS básico.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limita el tamaño máximo del body a 1MB.
 * Previene ataques de payload gigante que pueden tumbar el servidor.
 */
const MAX_BODY_SIZE = '1mb';

/**
 * Sanitiza strings cortando longitud excesiva y removiendo caracteres peligrosos.
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        // Cortar strings a 2000 caracteres máximo (excepto 'notes' que puede ser más largo)
        const maxLen = key === 'notes' ? 5000 : 2000;
        if (value.length > maxLen) {
          req.body[key] = value.slice(0, maxLen);
        }
      }
    }
  }
  next();
}

module.exports = { loginLimiter, apiLimiter, MAX_BODY_SIZE, sanitizeBody };
