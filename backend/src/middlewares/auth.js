// src/middlewares/auth.js
const { authService, AuthError } = require('../services/authService');
const userModel = require('../models/userModel');

/**
 * Verifica el JWT del header Authorization: Bearer <token> y adjunta el
 * usuario completo (fresco desde la BD, no solo lo que dice el token) a
 * req.user. Así, si un admin desactiva a alguien a mitad de sesión, el
 * siguiente request de esa persona ya falla.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    const payload = authService.verifyToken(token);
    const user = await userModel.findById(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Sesión inválida o cuenta desactivada.' });
    }
    req.user = authService.toPublicUser(user);
    next();
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * Restringe una ruta a uno o más roles. Uso: requireRole('admin')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
