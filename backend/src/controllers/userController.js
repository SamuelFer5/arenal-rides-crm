// src/controllers/userController.js
const { userService } = require('../services/userService');
const auditModel = require('../models/auditModel');
const asyncHandler = require('../utils/asyncHandler');

const userController = {
  list: asyncHandler(async (req, res) => {
    const users = await userService.listAll();
    res.json({ users });
  }),

  toggleActive: asyncHandler(async (req, res) => {
    const user = await userService.toggleActive(req.params.id, req.user);
    res.json({ user });
  }),

  setRole: asyncHandler(async (req, res) => {
    const user = await userService.setRole(req.params.id, req.body.role, req.user);
    res.json({ user });
  }),

  create: asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body, req.user);
    res.status(201).json({ user });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await userService.changeOwnPassword(req.user.id, currentPassword, newPassword);
    res.json({ ok: true });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    const userModel = require('../models/userModel');
    const updated = await userModel.updateName(req.user.id, name);
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ user: userService.toPublic(updated) });
  }),

  auditLog: asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 30;
    const log = await auditModel.recent(limit);
    res.json({ log });
  }),
};

module.exports = userController;
