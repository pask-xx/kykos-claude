-- AlterTable
ALTER TABLE "users" ADD COLUMN "deactivatedAt" TIMESTAMP(3),
ADD COLUMN "deactivatedActions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex for finding deactivated users with a still-valid authUserId
-- (used by a future cron job to clean up orphaned Supabase Auth accounts)
CREATE INDEX "User_deactivatedAt_idx" ON "users"("deactivatedAt");
