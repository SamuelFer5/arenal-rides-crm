// src/models/bookingModel.js
const { query } = require('../config/db');

// Columnas expuestas con JOIN a drivers/users para no resolver nombres en cada request del frontend.
const BASE_SELECT = `
  SELECT
    b.id, b.date, b.time, b.customer, b.service, b.pax, b.pickup, b.dropoff,
    b.status, b.rack, b.net, b.profit, b.deposit, b.phone, b.notes,
    b.driver_id, d.name AS driver,
    b.created_by, cu.name AS created_by_name,
    b.created_at,
    b.modified_by, mu.name AS modified_by_name,
    b.modified_at,
    b.confirmed_by, cfu.name AS confirmed_by_name,
    b.confirmed_at,
    b.locked_by, lu.name AS locked_by_name, lu.initials AS locked_by_initials, lu.color AS locked_by_color,
    b.locked_at
  FROM bookings b
  LEFT JOIN drivers d ON d.id = b.driver_id
  LEFT JOIN users cu ON cu.id = b.created_by
  LEFT JOIN users mu ON mu.id = b.modified_by
  LEFT JOIN users cfu ON cfu.id = b.confirmed_by
  LEFT JOIN users lu ON lu.id = b.locked_by
`;

const bookingModel = {
  async findAll({ month, year } = {}) {
    let sql = BASE_SELECT;
    const params = [];
    if (month) {
      params.push(`${year || '2026'}-${String(month).padStart(2, '0')}%`);
      sql += ` WHERE b.date::text LIKE $${params.length}`;
    }
    sql += ' ORDER BY b.date ASC, b.time ASC';
    const res = await query(sql, params);
    return res.rows;
  },

  async findById(id) {
    const res = await query(`${BASE_SELECT} WHERE b.id = $1`, [id]);
    return res.rows[0] || null;
  },

  async findByDate(date) {
    const res = await query(`${BASE_SELECT} WHERE b.date = $1 ORDER BY b.time ASC`, [date]);
    return res.rows;
  },

  async findLocked() {
    const res = await query(`${BASE_SELECT} WHERE b.locked_by IS NOT NULL ORDER BY b.locked_at DESC`);
    return res.rows;
  },

  async resolveDriverId(driverName, client) {
    const runner = client || { query };
    if (!driverName || !driverName.trim()) return null;
    const found = await (client ? client.query : query)(
      'SELECT id FROM drivers WHERE name = $1',
      [driverName.trim()]
    );
    if (found.rows[0]) return found.rows[0].id;
    const created = await (client ? client.query : query)(
      'INSERT INTO drivers (name) VALUES ($1) RETURNING id',
      [driverName.trim()]
    );
    return created.rows[0].id;
  },

  async create(data, client) {
    const runner = client || { query };
    const res = await runner.query(
      `INSERT INTO bookings
        (date, time, customer, service, pax, pickup, dropoff, status, driver_id,
         rack, net, profit, deposit, phone, notes, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now())
       RETURNING id`,
      [
        data.date, data.time, data.customer, data.service, data.pax,
        data.pickup, data.dropoff, data.status, data.driverId,
        data.rack, data.net, data.profit, data.deposit, data.phone, data.notes,
        data.createdBy,
      ]
    );
    return res.rows[0].id;
  },

  async update(id, data, client) {
    const runner = client || { query };
    await runner.query(
      `UPDATE bookings SET
        date=$2, time=$3, customer=$4, service=$5, pax=$6, pickup=$7, dropoff=$8,
        status=$9, driver_id=$10, rack=$11, net=$12, profit=$13, deposit=$14,
        phone=$15, notes=$16, modified_by=$17, modified_at=now(),
        confirmed_by = CASE WHEN $9 = 'Confirmed' AND status != 'Confirmed' THEN $17 ELSE confirmed_by END,
        confirmed_at = CASE WHEN $9 = 'Confirmed' AND status != 'Confirmed' THEN now() ELSE confirmed_at END,
        locked_by=NULL, locked_at=NULL
       WHERE id=$1`,
      [
        id, data.date, data.time, data.customer, data.service, data.pax,
        data.pickup, data.dropoff, data.status, data.driverId,
        data.rack, data.net, data.profit, data.deposit, data.phone, data.notes,
        data.modifiedBy,
      ]
    );
  },

  async delete(id, client) {
    const runner = client || { query };
    await runner.query('DELETE FROM bookings WHERE id = $1', [id]);
  },

  async setLock(id, userId, client) {
    const runner = client || { query };
    await runner.query(
      'UPDATE bookings SET locked_by = $2, locked_at = now() WHERE id = $1',
      [id, userId]
    );
  },

  async releaseLock(id, client) {
    const runner = client || { query };
    await runner.query(
      'UPDATE bookings SET locked_by = NULL, locked_at = NULL WHERE id = $1',
      [id]
    );
  },

  // ---------- Agregaciones para dashboard / ventas / conductores ----------

  async monthlyTotals() {
    const res = await query(`
      SELECT
        to_char(date, 'Month') AS month_name,
        EXTRACT(MONTH FROM date)::int AS month_num,
        COUNT(*) FILTER (WHERE status != 'Canceled') AS count,
        COALESCE(SUM(rack) FILTER (WHERE status != 'Canceled'), 0) AS rack,
        COALESCE(SUM(net) FILTER (WHERE status != 'Canceled'), 0) AS net,
        COALESCE(SUM(profit) FILTER (WHERE status != 'Canceled'), 0) AS profit
      FROM bookings
      GROUP BY month_name, month_num
      ORDER BY month_num
    `);
    return res.rows;
  },

  async driverTotals() {
    const res = await query(`
      SELECT
        d.name AS driver,
        COUNT(b.id) AS count,
        COALESCE(SUM(b.rack) FILTER (WHERE b.status != 'Canceled'), 0) AS rack,
        COALESCE(SUM(b.net) FILTER (WHERE b.status != 'Canceled'), 0) AS net
      FROM drivers d
      JOIN bookings b ON b.driver_id = d.id
      WHERE b.status != 'Canceled'
      GROUP BY d.name
      ORDER BY rack DESC
    `);
    return res.rows;
  },

  async statusCountsForMonth(month, year = '2026') {
    const res = await query(
      `SELECT status, COUNT(*) AS count
       FROM bookings
       WHERE date::text LIKE $1
       GROUP BY status`,
      [`${year}-${String(month).padStart(2, '0')}%`]
    );
    return res.rows;
  },

  async distinctDriversForMonth(month, year = '2026') {
    const res = await query(
      `SELECT DISTINCT d.name
       FROM bookings b JOIN drivers d ON d.id = b.driver_id
       WHERE b.date::text LIKE $1
       ORDER BY d.name`,
      [`${year}-${String(month).padStart(2, '0')}%`]
    );
    return res.rows.map((r) => r.name);
  },
};

module.exports = bookingModel;
