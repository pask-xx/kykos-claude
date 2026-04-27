-- Migration for PendingRegistration table
-- Run this on your Supabase PostgreSQL database

CREATE TABLE IF NOT EXISTS "pending_registrations" (
    "id" TEXT NOT NULL DEFAULT cuid(),
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "birthDate" TIMESTAMP(3),
    "fiscalCode" TEXT,
    "address" TEXT,
    "houseNumber" TEXT,
    "cap" TEXT,
    "city" TEXT,
    "province" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "referenceEntityId" TEXT,
    "isee" DECIMAL(65,30),
    "orgName" TEXT,
    "orgType" "OrgType",
    "otpCode" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pending_registrations_email_idx" ON "pending_registrations"("email");
CREATE INDEX IF NOT EXISTS "pending_registrations_otpCode_idx" ON "pending_registrations"("otpCode");
