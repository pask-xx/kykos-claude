-- =====================================================
-- Street Operators Feature - Manual Table Creation
-- Run on PostgreSQL database
-- =====================================================

-- 1. Add flags to operators table
ALTER TABLE "operators" ADD COLUMN IF NOT EXISTS "isOfficeOperator" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "operators" ADD COLUMN IF NOT EXISTS "isStreetOperator" BOOLEAN NOT NULL DEFAULT false;

-- Existing operators: isOfficeOperator=true (current behavior), isStreetOperator=false
-- New street-only operators: isOfficeOperator=false, isStreetOperator=true
-- Operators with both: isOfficeOperator=true, isStreetOperator=true

-- 2. Add isStreetManaged flag to users table (for RECIPIENT role)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isStreetManaged" BOOLEAN NOT NULL DEFAULT false;

-- Default false preserves current behavior (account normali)
-- true = beneficiario senza account, gestito da street operators

-- 3. Create street_operator_beneficiaries junction table
CREATE TABLE IF NOT EXISTS "street_operator_beneficiaries" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streetOperatorId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    UNIQUE("streetOperatorId", "beneficiaryId")
);

CREATE INDEX IF NOT EXISTS "street_operator_beneficiaries_street_operator_id_idx" ON "street_operator_beneficiaries"("streetOperatorId");
CREATE INDEX IF NOT EXISTS "street_operator_beneficiaries_beneficiary_id_idx" ON "street_operator_beneficiaries"("beneficiaryId");

-- 4. Add foreign keys
ALTER TABLE "street_operator_beneficiaries" ADD CONSTRAINT "street_operator_beneficiaries_street_operator_id_fkey"
  FOREIGN KEY ("streetOperatorId") REFERENCES "operators"("id") ON DELETE CASCADE;

ALTER TABLE "street_operator_beneficiaries" ADD CONSTRAINT "street_operator_beneficiaries_beneficiary_id_fkey"
  FOREIGN KEY ("beneficiaryId") REFERENCES "users"("id") ON DELETE CASCADE;

-- 5. Verify
-- SELECT id, name, "isOfficeOperator", "isStreetOperator" FROM operators;
-- SELECT id, email, role, "isStreetManaged" FROM users WHERE role = 'RECIPIENT';
-- SELECT * FROM street_operator_beneficiaries;