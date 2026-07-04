// src/services/userService.js
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const userService = {
  async listAll() {
    const users = await userModel.findAll();
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      initials: u.initials,
      email: u.email,
      role: u.role,
      color: u.color,
      active: u.active,
    }));
  },

  async toggleActive(id, actingUser) {
    if (actingUser.role !== 'admin') {
      throw new UserError('Solo un administrador puede activar/desactivar usuarios.', 403);
    }
    const user = await userModel.findById(id);
    if (!user) throw new UserError('Usuario no encontrado.', 404);
    if (user.id === actingUser.id) {
      throw new UserError('No puedes desactivar tu propia cuenta.', 400);
    }
    const updated = await userModel.setActive(id, !user.active);
    return userService.toPublic(updated);
  },

  async setRole(id, role, actingUser) {
    if (actingUser.role !== 'admin') {
      throw new UserError('Solo un administrador puede cambiar roles.', 403);
    }
    if (!['admin', 'empleado'].includes(role)) {
      throw new UserError('Rol inválido.', 400);
    }
    const user = await userModel.findById(id);
    if (!user) throw new UserError('Usuario no encontrado.', 404);
    const updated = await userModel.setRole(id, role);
    return userService.toPublic(updated);
  },

  toPublic(u) {
    return {
      id: u.id,
      name: u.name,
      initials: u.initials,
      email: u.email,
      role: u.role,
      color: u.color,
      active: u.active,
    };
  },

  async createUser({ name, email, password, role }, actingUser) {
    if (actingUser.role !== 'admin') {
      throw new UserError('Solo un administrador puede crear usuarios.', 403);
    }

    // Validaciones básicas de entrada
    if (!name || !name.trim()) throw new UserError('El nombre es obligatorio.', 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new UserError('Correo electrónico inválido.', 400);
    }
    if (!password || password.length < 8) {
      throw new UserError('La contraseña debe tener al menos 8 caracteres.', 400);
    }
    if (!['admin', 'empleado'].includes(role)) {
      throw new UserError('Rol inválido.', 400);
    }

    const existing = await userModel.findByEmail(email);
    if (existing) throw new UserError('Ya existe un usuario con ese correo.', 409);

    const initials = name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');

    const passwordHash = await bcrypt.hash(password, 10);
    const colors = ['#274C66', '#2F6E8F', '#B5552B', '#7A5C9E', '#9A7416', '#1E6B45'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const created = await userModel.create({ name: name.trim(), initials, email, passwordHash, role, color });
    return userService.toPublic(created);
  },

  /**
   * Cambio de contraseña propia. Requiere la contraseña actual para
   * confirmar identidad — así, si alguien deja la sesión abierta, un
   * tercero no puede cambiarla sin conocer la actual.
   */
  async changeOwnPassword(userId, currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw new UserError('La nueva contraseña debe tener al menos 8 caracteres.', 400);
    }
    const user = await userModel.findById(userId);
    if (!user) throw new UserError('Usuario no encontrado.', 404);

    const valid = await bcrypt.compare(currentPassword || '', user.password_hash);
    if (!valid) throw new UserError('La contraseña actual es incorrecta.', 400);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, passwordHash);
    return { ok: true };
  },
};

module.exports = { userService, UserError };
