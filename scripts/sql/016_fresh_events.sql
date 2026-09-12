-- =============================================================
-- 016_fresh_events.sql
-- Migration manuale per Supabase SQL Editor
-- =============================================================
--
-- Data: 2026-09-13
-- Scopo: Distribuzione Prodotti Freschi — nuova famiglia di modelli
--        FreshEventTemplate (ricorrente) + FreshEvent (slot singolo)
--        + FreshEventSubscription (iscrizione template)
--        + FreshEventReservation (prenotazione slot con QR e waiting list).
--
-- Cosa fa:
--   1. Crea 3 nuovi enum: FreshEventTemplateStatus, FreshEventStatus,
--      FreshReservationStatus.
--   2. Crea 4 nuove tabelle con FK, unique constraint, indici.
--   3. Aggiunge colonne User.freshWarnings + User.freshSuspendedUntil.
--   4. Aggiunge colonne Organization.freshWarningThreshold +
--      Organization.freshSuspensionDays.
--   5. Estende enum NotificationType con 5 nuovi valori.
--
-- Retrocompatibilità: TOTALE.
--   - Nessun modello esistente viene modificato/rimosso.
--   - Tutti i nuovi campi sono additivi con default sensato.
--   - MultiAvailability continua a funzionare come prima.
--
-- Istruzioni:
--   1. Aprire Supabase SQL Editor
--   2. Incollare TUTTO il contenuto di questo file
--   3. Eseguire
--   4. Verificare:
--        SELECT typname FROM pg_type
--        WHERE typname IN ('FreshEventStatus','FreshEventTemplateStatus','FreshReservationStatus');
--        → 3 righe attese
--        SELECT table_name FROM information_schema.tables
--        WHERE table_name IN ('fresh_event_templates','fresh_events',
--                             'fresh_event_subscriptions','fresh_event_reservations');
--        → 4 righe attese
--
-- Note: lo script è idempotente (IF NOT EXISTS + DO block per enum).
--        Eseguibile più volte senza errori.
-- =============================================================

-- 1. NUOVI ENUM ------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "FreshEventTemplateStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FreshEventStatus" AS ENUM (
    'PUBLISHED',  -- slot aperto alle prenotazioni
    'FULL',       -- capacità raggiunta, no nuove prenotazioni (waiting list ancora accettata)
    'CLOSED',     -- slot chiuso manualmente dall'ente
    'COMPLETED',  -- evento avvenuto (post data/ora fine)
    'CANCELLED'   -- annullato dall'ente
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FreshReservationStatus" AS ENUM (
    'CONFIRMED',  -- nei posti riservati, QR già generato
    'WAITING',    -- in lista d'attesa
    'ADMITTED',   -- ammesso da operatore, QR generato
    'PICKED_UP',  -- QR scansionato, ritiro effettuato
    'NO_SHOW',    -- non si è presentato al ritiro
    'CANCELLED',  -- cancellato dal beneficiario prima del ritiro
    'EXPIRED'     -- slot completato senza ritiro
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABELLE NUOVE ---------------------------------------------

CREATE TABLE IF NOT EXISTS "fresh_event_templates" (
  "id"                        TEXT PRIMARY KEY,
  "title"                     TEXT NOT NULL,
  "description"               TEXT,
  "weekday"                   INTEGER NOT NULL,
  "startTime"                 TEXT NOT NULL,
  "endTime"                   TEXT NOT NULL,
  "capacity"                  INTEGER NOT NULL,
  "defaultLocationId"         TEXT,
  "defaultPickupInstructions" TEXT,
  "isActive"                  BOOLEAN NOT NULL DEFAULT TRUE,
  "status"                    "FreshEventTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL,
  "organizationId"            TEXT NOT NULL,
  CONSTRAINT "fresh_event_templates_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "fresh_event_templates_defaultLocationId_fkey"
    FOREIGN KEY ("defaultLocationId") REFERENCES "locations"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "fresh_event_templates_organizationId_idx"
  ON "fresh_event_templates"("organizationId");
CREATE INDEX IF NOT EXISTS "fresh_event_templates_organizationId_status_idx"
  ON "fresh_event_templates"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "fresh_event_templates_weekday_idx"
  ON "fresh_event_templates"("weekday");

CREATE TABLE IF NOT EXISTS "fresh_events" (
  "id"                TEXT PRIMARY KEY,
  "scheduledStart"    TIMESTAMP(3) NOT NULL,
  "scheduledEnd"      TIMESTAMP(3) NOT NULL,
  "capacity"          INTEGER NOT NULL,
  "reservedCount"     INTEGER NOT NULL DEFAULT 0,
  "waitingCount"      INTEGER NOT NULL DEFAULT 0,
  "pickupLocationId"  TEXT,
  "pickupInstructions" TEXT,
  "status"            "FreshEventStatus" NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt"          TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  "templateId"        TEXT NOT NULL,
  CONSTRAINT "fresh_events_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "fresh_event_templates"("id") ON DELETE CASCADE,
  CONSTRAINT "fresh_events_pickupLocationId_fkey"
    FOREIGN KEY ("pickupLocationId") REFERENCES "locations"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "fresh_events_templateId_idx"
  ON "fresh_events"("templateId");
CREATE INDEX IF NOT EXISTS "fresh_events_status_idx"
  ON "fresh_events"("status");
CREATE INDEX IF NOT EXISTS "fresh_events_scheduledStart_idx"
  ON "fresh_events"("scheduledStart");
CREATE INDEX IF NOT EXISTS "fresh_events_templateId_scheduledStart_idx"
  ON "fresh_events"("templateId", "scheduledStart");

CREATE TABLE IF NOT EXISTS "fresh_event_subscriptions" (
  "id"            TEXT PRIMARY KEY,
  "subscribedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "active"        BOOLEAN NOT NULL DEFAULT TRUE,
  "templateId"    TEXT NOT NULL,
  "beneficiaryId" TEXT NOT NULL,
  CONSTRAINT "fresh_event_subscriptions_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "fresh_event_templates"("id") ON DELETE CASCADE,
  CONSTRAINT "fresh_event_subscriptions_beneficiaryId_fkey"
    FOREIGN KEY ("beneficiaryId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "fresh_event_subscriptions_templateId_beneficiaryId_key"
    UNIQUE ("templateId", "beneficiaryId")
);

CREATE INDEX IF NOT EXISTS "fresh_event_subscriptions_templateId_active_idx"
  ON "fresh_event_subscriptions"("templateId", "active");
CREATE INDEX IF NOT EXISTS "fresh_event_subscriptions_beneficiaryId_idx"
  ON "fresh_event_subscriptions"("beneficiaryId");

CREATE TABLE IF NOT EXISTS "fresh_event_reservations" (
  "id"            TEXT PRIMARY KEY,
  "status"        "FreshReservationStatus" NOT NULL DEFAULT 'WAITING',
  "position"      INTEGER,
  "qrCode"        TEXT,
  "reservedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "admittedAt"    TIMESTAMP(3),
  "pickedUpAt"    TIMESTAMP(3),
  "cancelledAt"   TIMESTAMP(3),
  "noShowAt"      TIMESTAMP(3),
  "notifiedAt"    TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "freshEventId"  TEXT NOT NULL,
  "beneficiaryId" TEXT NOT NULL,
  CONSTRAINT "fresh_event_reservations_freshEventId_fkey"
    FOREIGN KEY ("freshEventId") REFERENCES "fresh_events"("id") ON DELETE CASCADE,
  CONSTRAINT "fresh_event_reservations_beneficiaryId_fkey"
    FOREIGN KEY ("beneficiaryId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "fresh_event_reservations_freshEventId_beneficiaryId_key"
    UNIQUE ("freshEventId", "beneficiaryId")
);

CREATE INDEX IF NOT EXISTS "fresh_event_reservations_freshEventId_status_idx"
  ON "fresh_event_reservations"("freshEventId", "status");
CREATE INDEX IF NOT EXISTS "fresh_event_reservations_freshEventId_position_idx"
  ON "fresh_event_reservations"("freshEventId", "position");
CREATE INDEX IF NOT EXISTS "fresh_event_reservations_beneficiaryId_idx"
  ON "fresh_event_reservations"("beneficiaryId");

-- 3. COLONNE USER AGGIUNTE (warning fresco + sospensione) ----

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "freshWarnings" INTEGER NOT NULL DEFAULT 0;
COMMENT ON COLUMN "users"."freshWarnings" IS 'Contatore warning per no-show prodotti freschi. Al raggiungimento della soglia ente il beneficiario viene sospeso.';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "freshSuspendedUntil" TIMESTAMP(3);
COMMENT ON COLUMN "users"."freshSuspendedUntil" IS 'Se valorizzato e futuro, il beneficiario è sospeso dal prenotare prodotti freschi fino a questa data.';

CREATE INDEX IF NOT EXISTS "users_freshSuspendedUntil_idx"
  ON "users"("freshSuspendedUntil");

-- 4. COLONNE ORGANIZATION AGGIUNTE (soglie warning configurabili) ----

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "freshWarningThreshold" INTEGER NOT NULL DEFAULT 2;
COMMENT ON COLUMN "organizations"."freshWarningThreshold" IS 'Numero di warning no-show prima della sospensione automatica dal diritto di prenotare prodotti freschi.';

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "freshSuspensionDays" INTEGER NOT NULL DEFAULT 30;
COMMENT ON COLUMN "organizations"."freshSuspensionDays" IS 'Durata in giorni della sospensione automatica per warning no-show prodotti freschi.';

-- 5. ESTENSIONE ENUM NotificationType (5 nuovi valori) ----

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRESH_EVENT_PUBLISHED';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRESH_RESERVATION_CONFIRMED';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRESH_WAITING_LIST_ADMITTED';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRESH_NO_SHOW_WARNING';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRESH_SUSPENDED';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- =============================================================
-- Fine migration 016_fresh_events
-- =============================================================
