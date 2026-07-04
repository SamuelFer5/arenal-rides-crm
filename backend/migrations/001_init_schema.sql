-- migrations/001_init_schema.sql
-- Esquema inicial de Arenal Rides CRM
-- Convención: timestamps en UTC, ids de texto para usuarios (u1, u2...) se
-- migran a UUID real; bookings usa SERIAL porque ya viene con ids numéricos
-- del sistema anterior.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- para gen_random_uuid()

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  initials      VARCHAR(4)   NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'empleado')),
  color         VARCHAR(9),
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- DRIVERS (conductores / proveedores de transporte)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(160) NOT NULL UNIQUE,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- BOOKINGS (reservas) - el núcleo del CRM
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id            SERIAL PRIMARY KEY,
  date          DATE NOT NULL,
  time          VARCHAR(16),
  customer      VARCHAR(160) NOT NULL,
  service       VARCHAR(255),
  pax           VARCHAR(40),          -- texto libre tipo "2.0" o "2+1", se parsea en la app
  pickup        VARCHAR(255),
  dropoff       VARCHAR(255),
  status        VARCHAR(20) NOT NULL DEFAULT 'Confirmed'
                  CHECK (status IN ('Confirmed', 'Pending', 'Canceled')),
  driver_id     INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  rack          NUMERIC(10,2),         -- precio facturado al cliente
  net           NUMERIC(10,2),         -- costo pagado al proveedor/conductor
  profit        NUMERIC(10,2),         -- rack - net (se recalcula en backend, no se confía en el cliente)
  deposit       NUMERIC(10,2),
  phone         VARCHAR(120),          -- a veces incluye más de un contacto separado por "/"
  notes         TEXT,

  -- Auditoría
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  modified_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  modified_at   TIMESTAMPTZ,

  -- Bloqueo de edición concurrente (con expiración real, no como el prototipo)
  locked_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings USING gin (to_tsvector('spanish', coalesce(customer,'') || ' ' || coalesce(pickup,'') || ' ' || coalesce(dropoff,'')));

-- ---------------------------------------------------------------------
-- EXPENSES (gastos operativos)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id         SERIAL PRIMARY KEY,
  concept    VARCHAR(160) NOT NULL,
  amount     NUMERIC(10,2) NOT NULL,
  month      VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- PROVIDER PAYOUTS (pagos a proveedores externos, distinto de conductores)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_payouts (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(160) NOT NULL,
  amount     NUMERIC(10,2) NOT NULL,
  month      VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- AUDIT LOG (bitácora explícita, además de created_by/modified_by)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(40) NOT NULL,   -- 'create_booking', 'update_booking', 'delete_booking', 'login', etc.
  entity_type VARCHAR(40) NOT NULL,   -- 'booking', 'user', etc.
  entity_id   VARCHAR(40),
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

-- ---------------------------------------------------------------------
-- Trigger genérico para mantener updated_at en users
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
