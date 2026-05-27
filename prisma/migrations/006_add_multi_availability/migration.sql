-- Migration: 006_add_multi_availability
-- Created: 2026-05-27
-- Desc: Aggiunge modelli MultiAvailability e MultiAvailabilityRequest

-- ================================================
-- Up Migration
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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL
);

-- Table multi_availability_requests
CREATE TABLE "multi_availability_requests" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "needScoreSnapshot" INTEGER NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "MultiAvailabilityRequestStatus" NOT NULL DEFAULT 'PENDING',
  "qrCode" TEXT,
  "fulfilledAt" TIMESTAMP(3),
  "notifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "multiAvailabilityId" TEXT NOT NULL,
  "beneficiaryId" TEXT NOT NULL
);

-- Indexes
CREATE INDEX "multi_availabilities_organization_id_idx" ON "multi_availabilities"("organizationId");
CREATE INDEX "multi_availabilities_status_idx" ON "multi_availabilities"("status");
CREATE INDEX "multi_availability_requests_multi_availability_id_idx" ON "multi_availability_requests"("multiAvailabilityId");
CREATE INDEX "multi_availability_requests_beneficiary_id_idx" ON "multi_availability_requests"("beneficiaryId");

-- Constraints
ALTER TABLE "multi_availabilities" ADD CONSTRAINT "multi_availabilities_organization_id_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

ALTER TABLE "multi_availability_requests" ADD CONSTRAINT "multi_availability_requests_multi_availability_id_fkey"
  FOREIGN KEY ("multiAvailabilityId") REFERENCES "multi_availabilities"("id") ON DELETE CASCADE;

ALTER TABLE "multi_availability_requests" ADD CONSTRAINT "multi_availability_requests_beneficiary_id_fkey"
  FOREIGN KEY ("beneficiaryId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "multi_availability_requests" ADD CONSTRAINT "multi_availability_requests_multi_availability_id_beneficiary_id_unique"
  UNIQUE ("multiAvailabilityId", "beneficiaryId");

-- ================================================
-- Down Migration (rollback)
-- ================================================

DROP TABLE IF EXISTS "multi_availability_requests";
DROP TABLE IF EXISTS "multi_availabilities";
DROP TYPE IF EXISTS "MultiAvailabilityRequestStatus";
DROP TYPE IF EXISTS "MultiAvailabilityStatus";