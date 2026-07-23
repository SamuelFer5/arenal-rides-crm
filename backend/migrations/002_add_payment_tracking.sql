-- migrations/002_add_payment_tracking.sql
-- Columnas nuevas que se agregan sobre el esquema existente.
-- Usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS para ser idempotente.

-- Estado de pago del conductor (lo pone el admin manualmente)
DO $$ BEGIN
  ALTER TABLE drivers ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'pendiente';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Fecha en que el admin marcó el último pago como completado
DO $$ BEGIN
  ALTER TABLE drivers ADD COLUMN last_paid_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Quién confirmó la reserva (puede ser distinto de quien la creó)
DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN confirmed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
