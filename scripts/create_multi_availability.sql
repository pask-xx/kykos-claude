-- ================================================
-- Script creazione tabelle per Disponibilità Multipla
-- Da eseguire su Supabase
-- ================================================

-- Enum MultiAvailabilityStatus
CREATE TYPE "MultiAvailabilityStatus" AS ENUM ('OPEN', 'CLOSED', 'EXHAUSTED');

-- Enum MultiAvailabilityRequestStatus
CREATE TYPE "MultiAvailabilityRequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- Table multi_availabilities
CREATE TABLE "multi_availabilities" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "Category" NOT NULL,
  "image_urls" TEXT[] NOT NULL DEFAULT '{}',
  "available_qty" INTEGER NOT NULL,
  "assigned_qty" INTEGER NOT NULL DEFAULT 0,
  "status" "MultiAvailabilityStatus" NOT NULL DEFAULT 'OPEN',
  "deadline" TIMESTAMP(3),
  "exhaust_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organization_id" TEXT NOT NULL
);

-- Table multi_availability_requests
CREATE TABLE "multi_availability_requests" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "need_score_snapshot" INTEGER NOT NULL,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "MultiAvailabilityRequestStatus" NOT NULL DEFAULT 'PENDING',
  "qr_code" TEXT,
  "fulfilled_at" TIMESTAMP(3),
  "notified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "multi_availability_id" TEXT NOT NULL,
  "beneficiary_id" TEXT NOT NULL
);

-- Indexes
CREATE INDEX "multi_availabilities_organization_id_idx" ON "multi_availabilities"("organization_id");
CREATE INDEX "multi_availabilities_status_idx" ON "multi_availabilities"("status");
CREATE INDEX "multi_availability_requests_multi_availability_id_idx" ON "multi_availability_requests"("multi_availability_id");
CREATE INDEX "multi_availability_requests_beneficiary_id_idx" ON "multi_availability_requests"("beneficiary_id");

-- Constraints
ALTER TABLE "multi_availabilities" ADD CONSTRAINT "multi_availabilities_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

ALTER TABLE "multi_availability_requests" ADD CONSTRAINT "multi_availability_requests_multi_availability_id_fkey"
  FOREIGN KEY ("multi_availability_id") REFERENCES "multi_availabilities"("id") ON DELETE CASCADE;

ALTER TABLE "multi_availability_requests" ADD CONSTRAINT "multi_availability_requests_beneficiary_id_fkey"
  FOREIGN KEY ("beneficiary_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "multi_availability_requests" ADD CONSTRAINT "multi_availability_requests_multi_availability_id_beneficiary_id_unique"
  UNIQUE ("multi_availability_id", "beneficiary_id");

-- ================================================
-- Per rollback (se necessario):
-- ================================================

-- DROP TABLE IF EXISTS "multi_availability_requests";
-- DROP TABLE IF EXISTS "multi_availabilities";
-- DROP TYPE IF EXISTS "MultiAvailabilityRequestStatus";
-- DROP TYPE IF EXISTS "MultiAvailabilityStatus";