// src/utils/asyncHandler.js

/**
 * Envuelve un controlador async para que cualquier excepción se pase
 * automáticamente a next(err) en vez de tumbar el proceso o requerir
 * try/catch repetido en cada controlador.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
