-- =====================================================
-- Cause Feature - Manual Table Creation
-- Run on PostgreSQL database
-- =====================================================

-- 1. Create causes table
CREATE TABLE IF NOT EXISTS "causes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrls" TEXT[] NOT NULL DEFAULT '{}',
    "targetQty" INTEGER,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "causes_organization_id_idx" ON "causes"("organizationId");

-- 2. Create cause_participants table
CREATE TABLE IF NOT EXISTS "cause_participants" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "causeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    UNIQUE("causeId", "userId")
);

CREATE INDEX IF NOT EXISTS "cause_participants_cause_id_idx" ON "cause_participants"("causeId");
CREATE INDEX IF NOT EXISTS "cause_participants_user_id_idx" ON "cause_participants"("userId");

-- 3. Add foreign keys
ALTER TABLE "causes" ADD CONSTRAINT "causes_organization_id_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

ALTER TABLE "cause_participants" ADD CONSTRAINT "cause_participants_cause_id_fkey"
  FOREIGN KEY ("causeId") REFERENCES "causes"("id") ON DELETE CASCADE;

ALTER TABLE "cause_participants" ADD CONSTRAINT "cause_participants_user_id_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- 4. Verify
-- SELECT * FROM causes;
-- SELECT * FROM cause_participants;
