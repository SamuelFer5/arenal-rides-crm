// src/config/db.js
// Pool de conexiones a PostgreSQL. Toda la app comparte este mismo pool.
require('dotenv').config();
const { Pool } = require('pg');

const useSSL = process.env.PGSSL === 'true';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // Conexiones inactivas que el servidor de PostgreSQL cierra no deben
  // tumbar el proceso completo de Node.
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta una query contra la base de datos.
 * @param {string} text - SQL con placeholders $1, $2, ...
 * @param {Array} params
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - start;
    console.log('[db]', text.slice(0, 80).replace(/\s+/g, ' '), `${duration}ms`, `rows=${res.rowCount}`);
  }
  return res;
}

/**
 * Ejecuta una serie de operaciones dentro de una transacción.
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
