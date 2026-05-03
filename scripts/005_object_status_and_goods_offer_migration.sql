-- =====================================================
-- KYKOS - Migration Script
-- ObjectStatus: WITHDRAWN -> DEPOSITED, CANCELLED
-- RequestStatus: add CANCELLED
-- GoodsOfferStatus: new enum
-- NotificationType: OBJECT_WITHDRAWN -> OBJECT_DEPOSITED, OBJECT_CANCELLED
-- =====================================================
-- Run this script directly on your Supabase database
-- =====================================================

-- Step 1: Rename WITHDRAWN to DEPOSITED in ObjectStatus enum
BEGIN;
ALTER TYPE "ObjectStatus" ADD VALUE IF NOT EXISTS 'DEPOSITED';
ALTER TYPE "ObjectStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "ObjectStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';
COMMIT;

-- Step 2: Verify current enum values
-- SELECT enumlabel FROM pg_enum WHERE enumlabel ~ '^(AVAILABLE|RESERVED|DEPOSITED|DONATED|CANCELLED)$';

-- Step 3: Add CANCELLED to RequestStatus enum
BEGIN;
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
COMMIT;

-- Step 4: Create GoodsOfferStatus enum
BEGIN;
CREATE TYPE "GoodsOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
COMMIT;

-- Step 5: Update GoodsOffer status column from String to GoodsOfferStatus
BEGIN;
ALTER TABLE "goods_offers" ALTER COLUMN "status" TYPE "GoodsOfferStatus" USING "status"::"GoodsOfferStatus";
ALTER TABLE "goods_offers" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- Step 6: Update NotificationType enum (replace OBJECT_WITHDRAWN with OBJECT_DEPOSITED and OBJECT_CANCELLED)
BEGIN;
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OBJECT_DEPOSITED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OBJECT_CANCELLED';
COMMIT;

-- Step 7: Verify all changes
-- SELECT enumlabel FROM pg_enum WHERE enumlabel ~ '^(AVAILABLE|RESERVED|DEPOSITED|DONATED|CANCELLED|PENDING|APPROVED|REJECTED|EXPIRED)$';
-- SELECT enumlabel FROM pg_enum WHERE enumlabel ~ '^(PENDING|ACCEPTED|REJECTED|CANCELLED)$';
-- SELECT enumlabel FROM pg_enum WHERE enumlabel ~ '^(OBJECT_DEPOSITED|OBJECT_CANCELLED)$';

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- BEGIN;
-- -- Remove CANCELLED from RequestStatus
-- ALTER TYPE "RequestStatus" DROP VALUE 'CANCELLED';
-- COMMIT;

-- BEGIN;
-- -- Drop GoodsOfferStatus enum (requires column change first)
-- ALTER TABLE "goods_offers" ALTER COLUMN "status" TYPE TEXT;
-- DROP TYPE "GoodsOfferStatus";
-- COMMIT;

-- BEGIN;
-- -- Remove new notification types
-- ALTER TYPE "NotificationType" DROP VALUE 'OBJECT_DEPOSITED';
-- ALTER TYPE "NotificationType" DROP VALUE 'OBJECT_CANCELLED';
-- COMMIT;
-- =====================================================
