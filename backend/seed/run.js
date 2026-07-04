// seed/run.js
// Carga usuarios (con contraseñas hasheadas), conductores y las 1352
// reservas reales del prototipo de Claude Design hacia PostgreSQL.
//
// Uso: npm run seed   (requiere que las migraciones ya se hayan corrido)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Usuarios del seed con contraseñas temporales (ver credenciales_temporales.txt)
const USERS = [
  { id: 'u1', name: 'Admin', initials: 'AD', email: 'admin@arenalrides.com', password: 'Arenal2026!', role: 'admin', color: '#274C66', active: true },
  { id: 'u2', name: 'Carla Mora', initials: 'CM', email: 'carla@arenalrides.com', password: 'Carla2026!', role: 'empleado', color: '#2F6E8F', active: true },
  { id: 'u3', name: 'Diego Solís', initials: 'DS', email: 'diego@arenalrides.com', password: 'Diego2026!', role: 'empleado', color: '#B5552B', active: true },
  { id: 'u4', name: 'Mariana Vargas', initials: 'MV', email: 'mariana@arenalrides.com', password: 'Mariana2026!', role: 'empleado', color: '#7A5C9E', active: true },
  { id: 'u5', name: 'Esteban Rojas', initials: 'ER', email: 'esteban@arenalrides.com', password: 'Esteban2026!', role: 'empleado', color: '#9A7416', active: false },
];

// Normaliza el status igual que el prototipo original (statusInfo en el HTML):
// cualquier cosa que no contenga "cancel" ni "confirm" cae en Pendiente.
function normalizeStatus(raw) {
  const v = (raw || '').toLowerCase();
  if (v.includes('cancel')) return 'Canceled';
  if (v.includes('confirm') || v.includes('verified') || v.includes('verif')) return 'Confirmed';
  return 'Pending';
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ---------- USERS ----------
    console.log('Insertando usuarios...');
    const userIdMap = {}; // id viejo (u1..u5) -> uuid real generado por la BD
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const res = await client.query(
        `INSERT INTO users (name, initials, email, password_hash, role, color, active)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [u.name, u.initials, u.email, hash, u.role, u.color, u.active]
      );
      userIdMap[u.id] = res.rows[0].id;
    }

    // ---------- DATA SOURCE ----------
    const dataPath = path.join(__dirname, 'crm_data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // ---------- DRIVERS ----------
    console.log(`Insertando ${data.drivers.length} conductores...`);
    const driverIdMap = {}; // nombre -> id serial generado
    for (const d of data.drivers) {
      const res = await client.query(
        `INSERT INTO drivers (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [d.driver]
      );
      driverIdMap[d.driver] = res.rows[0].id;
    }

    // ---------- BOOKINGS ----------
    // Replicamos exactamente la lógica de seed del prototipo original:
    // asigna createdBy/modifiedBy/lockedBy entre los empleados de forma
    // determinística, para que la auditoría tenga datos de ejemplo realistas.
    console.log(`Insertando ${data.bookings.length} reservas...`);
    const empleados = USERS.filter((u) => u.role === 'empleado');
    let inserted = 0;

    for (const b of data.bookings) {
      const status = normalizeStatus(b.status);
      const driverName = (b.driver || '').trim();
      let driverId = null;
      if (driverName) {
        if (!driverIdMap[driverName]) {
          // Conductor presente en bookings pero no en la tabla drivers (no debería pasar, pero por seguridad)
          const res = await client.query(
            `INSERT INTO drivers (name) VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [driverName]
          );
          driverIdMap[driverName] = res.rows[0].id;
        }
        driverId = driverIdMap[driverName];
      }

      const creator = empleados[b.id % empleados.length];
      const createdBy = userIdMap[creator.id];

      let modifiedBy = null;
      let modifiedAt = null;
      if (b.id % 5 === 0) {
        const modifier = empleados[(b.id + 2) % empleados.length];
        modifiedBy = userIdMap[modifier.id];
        modifiedAt = b.date;
      }

      const rack = b.rack === null || b.rack === undefined ? null : Number(b.rack);
      const net = b.net === null || b.net === undefined ? null : Number(b.net);
      const profit = rack !== null && net !== null ? +(rack - net).toFixed(2) : null;

      await client.query(
        `INSERT INTO bookings
          (date, time, customer, service, pax, pickup, dropoff, status, driver_id,
           rack, net, profit, deposit, phone, notes, created_by, created_at, modified_by, modified_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          b.date,
          b.time || null,
          b.customer,
          b.service || null,
          b.pax || null,
          b.pickup || null,
          b.dropoff || null,
          status,
          driverId,
          rack,
          net,
          profit,
          b.deposit === null || b.deposit === undefined ? null : Number(b.deposit),
          b.phone || null,
          b.notes || null,
          createdBy,
          b.date,
          modifiedBy,
          modifiedAt,
        ]
      );
      inserted++;
    }
    console.log(`  ${inserted} reservas insertadas.`);

    // ---------- EXPENSES ----------
    console.log(`Insertando ${data.expenses.length} gastos...`);
    for (const e of data.expenses) {
      await client.query(
        `INSERT INTO expenses (concept, amount) VALUES ($1,$2)`,
        [e.concept, e.amount]
      );
    }

    // ---------- PROVIDER PAYOUTS ----------
    console.log(`Insertando ${data.providerPayouts.length} pagos a proveedores...`);
    for (const p of data.providerPayouts) {
      await client.query(
        `INSERT INTO provider_payouts (name, amount) VALUES ($1,$2)`,
        [p.name, p.amount]
      );
    }

    await client.query('COMMIT');
    console.log('Seed completado con éxito.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante el seed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
