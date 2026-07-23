// src/models/driverModel.js
const { query } = require('../config/db');

const driverModel = {
  async findAll() {
    const res = await query(`
      SELECT d.*,
        COUNT(b.id) FILTER (WHERE b.status != 'Canceled') AS trip_count,
        COALESCE(SUM(b.rack) FILTER (WHERE b.status != 'Canceled'), 0) AS total_rack,
        COALESCE(SUM(b.net) FILTER (WHERE b.status != 'Canceled'), 0) AS total_net
      FROM drivers d
      LEFT JOIN bookings b ON b.driver_id = d.id
      GROUP BY d.id
      ORDER BY d.active DESC, total_rack DESC
    `);
    return res.rows;
  },

  async findActive() {
    const res = await query('SELECT id, name FROM drivers WHERE active = true ORDER BY name ASC');
    return res.rows;
  },

  async findById(id) {
    const res = await query('SELECT * FROM drivers WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async toggleActive(id) {
    const res = await query(
      'UPDATE drivers SET active = NOT active WHERE id = $1 RETURNING *',
      [id]
    );
    return res.rows[0] || null;
  },

  async setPaymentStatus(id, status) {
    const updates = status === 'al_dia'
      ? 'payment_status = $2, last_paid_date = CURRENT_DATE'
      : 'payment_status = $2';
    const res = await query(
      `UPDATE drivers SET ${updates} WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return res.rows[0] || null;
  },

  async create(name) {
    const res = await query(
      'INSERT INTO drivers (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [name.trim()]
    );
    return res.rows[0];
  },
};

module.exports = driverModel;
