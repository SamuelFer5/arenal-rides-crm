// src/models/userModel.js
const { query } = require('../config/db');

const userModel = {
  async findByEmail(email) {
    const res = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findAll() {
    const res = await query('SELECT * FROM users ORDER BY created_at ASC');
    return res.rows;
  },

  async setActive(id, active) {
    const res = await query(
      'UPDATE users SET active = $2 WHERE id = $1 RETURNING *',
      [id, active]
    );
    return res.rows[0] || null;
  },

  async setRole(id, role) {
    const res = await query(
      'UPDATE users SET role = $2 WHERE id = $1 RETURNING *',
      [id, role]
    );
    return res.rows[0] || null;
  },

  async create({ name, initials, email, passwordHash, role, color }) {
    const res = await query(
      `INSERT INTO users (name, initials, email, password_hash, role, color)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, initials, email.toLowerCase(), passwordHash, role, color]
    );
    return res.rows[0];
  },

  async updatePassword(id, passwordHash) {
    const res = await query(
      'UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING *',
      [id, passwordHash]
    );
    return res.rows[0] || null;
  },

  async updateName(id, name) {
    const initials = name.trim().split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
    const res = await query(
      'UPDATE users SET name = $2, initials = $3 WHERE id = $1 RETURNING *',
      [id, name.trim(), initials]
    );
    return res.rows[0] || null;
  },
};

module.exports = userModel;
