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

  auditLog: asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 30;
    const log = await auditModel.recent(limit);
    res.json({ log });
  }),
};

module.exports = userController;
