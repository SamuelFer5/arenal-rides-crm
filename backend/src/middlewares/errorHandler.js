// src/middlewares/errorHandler.js

/**
 * Middleware de manejo de errores. Cualquier error lanzado en controladores
 * (o pasado a next(err)) cae aquí. Los errores de negocio (BookingError,
 * UserError, AuthError) ya traen un `status` HTTP apropiado; los demás se
 * tratan como 500 y se loguean para debug.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json({
    error: err.message || 'Error interno del servidor.',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
