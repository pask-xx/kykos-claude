-- KYKOS Database Schema
-- Generated from Prisma schema
-- Run this script on a new Supabase project to create the database structure

BEGIN;

-- ================== ENUMS ==================

CREATE TYPE "Role" AS ENUM ('DONOR', 'RECIPIENT', 'INTERMEDIARY', 'ADMIN');
CREATE TYPE "OperatorRole" AS ENUM ('ADMIN', 'GESTORE_RICHIESTE', 'GESTORE_OGGETTI', 'GESTORE_VOLONTARI', 'OPERATORE');
CREATE TYPE "OperatorPermission" AS ENUM ('RECIPIENT_AUTHORIZE', 'OBJECT_RECEIVE', 'OBJECT_DELIVER', 'VOLUNTEER_MANAGE', 'REQUEST_PROXY', 'ORGANIZATION_ADMIN');
CREATE TYPE "OrgType" AS ENUM ('CHARITY', 'CHURCH', 'ASSOCIATION');
CREATE TYPE "Category" AS ENUM ('FURNITURE', 'ELECTRONICS', 'CLOTHING', 'BOOKS', 'KITCHEN', 'SPORTS', 'TOYS', 'OTHER');
CREATE TYPE "Condition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR');
CREATE TYPE "ObjectStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'DEPOSITED', 'DONATED', 'CANCELLED', 'BLOCKED');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "DonorLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');
CREATE TYPE "NotificationType" AS ENUM (
  'DONATION_CONFIRMED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'OBJECT_AVAILABLE',
  'OBJECT_RESERVED', 'OBJECT_DELIVERED', 'OBJECT_DEPOSITED', 'OBJECT_CANCELLED',
  'REPORT_RECEIVED', 'REPORT_RESOLVED', 'MESSAGE_FROM_OPERATOR',
  'NEW_REQUEST', 'NEW_REPORT', 'REQUEST_EXPIRED', 'OBJECT_BLOCKED',
  'GOODS_REQUEST_CREATED', 'GOODS_REQUEST_APPROVED', 'GOODS_REQUEST_REJECTED',
  'GOODS_REQUEST_FULFILLED', 'GOODS_OFFER_RECEIVED'
);
CREATE TYPE "RequestType" AS ENUM ('GOODS', 'SERVICES');
CREATE TYPE "GoodsRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'FULFILLED', 'DELIVERED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "GoodsOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
CREATE TYPE "RecipientType" AS ENUM ('USER', 'OPERATOR');
CREATE TYPE "VolunteerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'WITHDRAWN');
CREATE TYPE "AdesioneStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- ================== TABLES (in dependency order) ==================

-- 1. Base tables (no dependencies)
CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "authUserId" TEXT UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT,
  "role" "Role" NOT NULL DEFAULT 'DONOR',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "firstName" TEXT,
  "lastName" TEXT,
  "birthDate" TIMESTAMPTZ,
  "fiscalCode" TEXT,
  "address" TEXT,
  "houseNumber" TEXT,
  "cap" TEXT,
  "city" TEXT,
  "province" TEXT,
  "referenceEntityId" TEXT,
  "isee" DECIMAL(65,30),
  "authorized" BOOLEAN NOT NULL DEFAULT false,
  "authorizedAt" TIMESTAMPTZ,
  "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "emailConfirmedAt" TIMESTAMPTZ,
  "canProvideServices" BOOLEAN NOT NULL DEFAULT false,
  "canProvideServicesAt" TIMESTAMPTZ,
  "canRequestGoods" BOOLEAN NOT NULL DEFAULT true,
  "canRequestServices" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "provinces" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sigla" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL
);

CREATE TABLE "comunes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "istat" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "provinceSigla" TEXT NOT NULL
);

CREATE TABLE "adesione_enti" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "denominazione" TEXT NOT NULL,
  "nomeReferente" TEXT NOT NULL,
  "cognomeReferente" TEXT NOT NULL,
  "telefono" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "indirizzo" TEXT NOT NULL,
  "civico" TEXT NOT NULL,
  "cap" TEXT NOT NULL,
  "citta" TEXT NOT NULL,
  "provincia" TEXT,
  "nota" TEXT NOT NULL,
  "website" TEXT,
  "status" "AdesioneStatus" NOT NULL DEFAULT 'PENDING',
  "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "emailConfirmToken" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "notify_emails" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tables depending on users
CREATE TABLE "donor_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "totalDonations" INTEGER NOT NULL DEFAULT 0,
  "totalObjects" INTEGER NOT NULL DEFAULT 0,
  "level" "DonorLevel" NOT NULL DEFAULT 'BRONZE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId" TEXT NOT NULL UNIQUE
);

CREATE TABLE "organizations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "type" "OrgType" NOT NULL,
  "vatNumber" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "address" TEXT,
  "houseNumber" TEXT,
  "cap" TEXT,
  "city" TEXT,
  "province" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "autoApproveRequests" BOOLEAN NOT NULL DEFAULT false,
  "autoApproveGoodsRequests" BOOLEAN NOT NULL DEFAULT true,
  "autoApproveServicesRequests" BOOLEAN NOT NULL DEFAULT false,
  "hoursInfo" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId" TEXT NOT NULL UNIQUE
);

CREATE TABLE "operators" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "supabaseAuthId" TEXT UNIQUE,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT,
  "phone" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "passwordHash" TEXT,
  "role" "OperatorRole" NOT NULL DEFAULT 'OPERATORE',
  "permissions" TEXT[] NOT NULL DEFAULT '{}',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "organizationId" TEXT NOT NULL
);

CREATE TABLE "volunteer_associations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" "VolunteerStatus" NOT NULL DEFAULT 'PENDING',
  "skills" TEXT[] NOT NULL DEFAULT '{}',
  "note" TEXT,
  "cvUrl" TEXT,
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "organizationId")
);

CREATE TABLE "goods_requests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "category" "Category" NOT NULL,
  "description" TEXT,
  "type" "RequestType" NOT NULL DEFAULT 'GOODS',
  "status" "GoodsRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "beneficiaryId" TEXT NOT NULL,
  "intermediaryId" TEXT NOT NULL,
  "fulfilledById" TEXT,
  "fulfilledAt" TIMESTAMPTZ,
  "depositLocation" TEXT,
  "depositNotes" TEXT
);

CREATE TABLE "goods_offers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "message" TEXT,
  "status" "GoodsOfferStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "requestId" TEXT NOT NULL,
  "offeredById" TEXT NOT NULL,
  "imageUrls" TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE "objects" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "Category" NOT NULL,
  "condition" "Condition" NOT NULL,
  "status" "ObjectStatus" NOT NULL DEFAULT 'AVAILABLE',
  "imageUrls" TEXT[] NOT NULL DEFAULT '{}',
  "depositLocation" TEXT,
  "depositNotes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "donorId" TEXT NOT NULL,
  "intermediaryId" TEXT NOT NULL
);

CREATE TABLE "payments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "amount" DECIMAL(65,30) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "intermediaryId" TEXT NOT NULL,
  "donationId" TEXT UNIQUE
);

CREATE TABLE "requests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "objectId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "intermediaryId" TEXT NOT NULL
);

CREATE TABLE "donations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "amount" DECIMAL(65,30) NOT NULL DEFAULT 1.00,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "objectId" TEXT NOT NULL UNIQUE,
  "donorId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL UNIQUE,
  "paymentId" TEXT UNIQUE
);

CREATE TABLE "reports" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reason" TEXT NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "objectId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "intermediaryId" TEXT NOT NULL
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "link" TEXT,
  "data" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "recipientType" "RecipientType" NOT NULL DEFAULT 'USER',
  "recipientUserId" TEXT,
  "recipientOperatorId" TEXT,
  "reportId" TEXT,
  UNIQUE ("recipientUserId", "recipientOperatorId")
);

-- ================== FOREIGN KEYS ==================

-- Users references
ALTER TABLE "users" ADD CONSTRAINT "users_referenceEntityId_fkey"
  FOREIGN KEY ("referenceEntityId") REFERENCES "organizations"("id") ON DELETE SET NULL;

-- Organizations references
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Operators references
ALTER TABLE "operators" ADD CONSTRAINT "operators_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- Comuni references
ALTER TABLE "comunes" ADD CONSTRAINT "comunes_provinceSigla_fkey"
  FOREIGN KEY ("provinceSigla") REFERENCES "provinces"("sigla") ON DELETE RESTRICT;

-- Donor profiles references
ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Volunteer associations references
ALTER TABLE "volunteer_associations" ADD CONSTRAINT "volunteer_associations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "volunteer_associations" ADD CONSTRAINT "volunteer_associations_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- Goods requests references
ALTER TABLE "goods_requests" ADD CONSTRAINT "goods_requests_beneficiaryId_fkey"
  FOREIGN KEY ("beneficiaryId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "goods_requests" ADD CONSTRAINT "goods_requests_intermediaryId_fkey"
  FOREIGN KEY ("intermediaryId") REFERENCES "organizations"("id") ON DELETE RESTRICT;
ALTER TABLE "goods_requests" ADD CONSTRAINT "goods_requests_fulfilledById_fkey"
  FOREIGN KEY ("fulfilledById") REFERENCES "users"("id") ON DELETE SET NULL;

-- Goods offers references
ALTER TABLE "goods_offers" ADD CONSTRAINT "goods_offers_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "goods_requests"("id") ON DELETE CASCADE;
ALTER TABLE "goods_offers" ADD CONSTRAINT "goods_offers_offeredBy_fk"
  FOREIGN KEY ("offeredById") REFERENCES "users"("id") ON DELETE CASCADE;

-- Objects references
ALTER TABLE "objects" ADD CONSTRAINT "objects_donorId_fkey"
  FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "objects" ADD CONSTRAINT "objects_intermediaryId_fkey"
  FOREIGN KEY ("intermediaryId") REFERENCES "organizations"("id") ON DELETE RESTRICT;

-- Payments references
ALTER TABLE "payments" ADD CONSTRAINT "payments_intermediaryId_fkey"
  FOREIGN KEY ("intermediaryId") REFERENCES "organizations"("id") ON DELETE RESTRICT;

-- Requests references
ALTER TABLE "requests" ADD CONSTRAINT "requests_objectId_fkey"
  FOREIGN KEY ("objectId") REFERENCES "objects"("id") ON DELETE CASCADE;
ALTER TABLE "requests" ADD CONSTRAINT "requests_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "requests" ADD CONSTRAINT "requests_intermediaryId_fkey"
  FOREIGN KEY ("intermediaryId") REFERENCES "organizations"("id") ON DELETE RESTRICT;

-- Donations references
ALTER TABLE "donations" ADD CONSTRAINT "donations_objectId_fkey"
  FOREIGN KEY ("objectId") REFERENCES "objects"("id") ON DELETE CASCADE;
ALTER TABLE "donations" ADD CONSTRAINT "donations_donorId_fkey"
  FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "donations" ADD CONSTRAINT "donations_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "donations" ADD CONSTRAINT "donations_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE;
ALTER TABLE "donations" ADD CONSTRAINT "donations_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL;

-- Reports references
ALTER TABLE "reports" ADD CONSTRAINT "reports_objectId_fkey"
  FOREIGN KEY ("objectId") REFERENCES "objects"("id") ON DELETE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "reports" ADD CONSTRAINT "reports_intermediaryId_fkey"
  FOREIGN KEY ("intermediaryId") REFERENCES "organizations"("id") ON DELETE RESTRICT;

-- Notifications references
ALTER TABLE "notifications" ADD CONSTRAINT "notification_user_fk"
  FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notification_operator_fk"
  FOREIGN KEY ("recipientOperatorId") REFERENCES "operators"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE SET NULL;

-- ================== INDEXES ==================

CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "comunes_provinceSigla_idx" ON "comunes"("provinceSigla");
CREATE INDEX "objects_donorId_idx" ON "objects"("donorId");
CREATE INDEX "objects_status_idx" ON "objects"("status");
CREATE INDEX "requests_recipientId_idx" ON "requests"("recipientId");
CREATE INDEX "requests_recipientId_status_idx" ON "requests"("recipientId", "status");
CREATE INDEX "donations_recipientId_idx" ON "donations"("recipientId");
CREATE INDEX "goods_requests_beneficiaryId_idx" ON "goods_requests"("beneficiaryId");
CREATE INDEX "goods_requests_intermediaryId_idx" ON "goods_requests"("intermediaryId");
CREATE INDEX "goods_requests_status_idx" ON "goods_requests"("status");
CREATE INDEX "goods_offers_requestId_idx" ON "goods_offers"("requestId");
CREATE INDEX "volunteer_associations_organizationId_status_idx" ON "volunteer_associations"("organizationId", "status");
CREATE INDEX "reports_status_idx" ON "reports"("status");
CREATE INDEX "notifications_recipientType_createdAt_idx" ON "notifications"("recipientType", "createdAt");
CREATE INDEX "notifications_read_createdAt_idx" ON "notifications"("read", "createdAt");

-- ================== TRIGGERS FOR updatedAt ==================

CREATE OR REPLACE FUNCTION update_updatedAt_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updatedAt BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_organizations_updatedAt BEFORE UPDATE ON "organizations" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_operators_updatedAt BEFORE UPDATE ON "operators" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_objects_updatedAt BEFORE UPDATE ON "objects" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_requests_updatedAt BEFORE UPDATE ON "requests" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_payments_updatedAt BEFORE UPDATE ON "payments" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_donor_profiles_updatedAt BEFORE UPDATE ON "donor_profiles" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_reports_updatedAt BEFORE UPDATE ON "reports" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_goods_requests_updatedAt BEFORE UPDATE ON "goods_requests" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_goods_offers_updatedAt BEFORE UPDATE ON "goods_offers" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_volunteer_associations_updatedAt BEFORE UPDATE ON "volunteer_associations" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();
CREATE TRIGGER update_adesione_enti_updatedAt BEFORE UPDATE ON "adesione_enti" FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

COMMIT;