-- Add profileImageUrl field to users table
ALTER TABLE "users" ADD COLUMN "profileImageUrl" TEXT;

-- Add profileImageUrl field to operators table
ALTER TABLE "operators" ADD COLUMN "profileImageUrl" TEXT;

-- Optional: Add indexes for faster lookups
-- CREATE INDEX "idx_users_profileImageUrl" ON "users"("profileImageUrl");
-- CREATE INDEX "idx_operators_profileImageUrl" ON "operators"("profileImageUrl");