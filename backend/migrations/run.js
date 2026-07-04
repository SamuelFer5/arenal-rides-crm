// migrations/run.js
// Ejecuta todos los archivos .sql de esta carpeta en orden alfabético.
// Uso: npm run migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Encontradas ${files.length} migraciones.`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`→ Aplicando ${file}...`);
    try {
      await pool.query(sql);
      console.log(`  OK`);
    } catch (err) {
      console.error(`  ERROR en ${file}:`, err);
      await pool.end();
      process.exit(1);
    }
  }

  console.log('Migraciones completadas.');
  await pool.end();
}

main();
