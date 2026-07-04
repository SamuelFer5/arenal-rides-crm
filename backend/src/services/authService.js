// src/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const auditModel = require('../models/auditModel');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}

const authService = {
  async login(email, password) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new AuthError('Correo no registrado.');
    }
    if (!user.active) {
      throw new AuthError('Cuenta desactivada. Contacta al administrador.');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AuthError('Contraseña incorrecta.');
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await auditModel.log({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id });

    return {
      token,
      user: authService.toPublicUser(user),
    };
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new AuthError('Token inválido o expirado.');
    }
  },

  toPublicUser(user) {
    return {
      id: user.id,
      name: user.name,
      initials: user.initials,
      email: user.email,
      role: user.role,
      color: user.color,
      active: user.active,
    };
  },
};

module.exports = { authService, AuthError };
