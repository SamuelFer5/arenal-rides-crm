// src/models/auditModel.js
const { query } = require('../config/db');

const auditModel = {
  async log({ userId, action, entityType, entityId, detail }, client) {
    const runner = client || { query };
    await runner.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, detail)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, action, entityType, entityId ? String(entityId) : null, detail || null]
    );
  },

  async recent(limit = 30) {
    const res = await query(
      `SELECT a.*, u.name AS user_name, u.initials, u.color
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },
};

module.exports = auditModel;
