-- =====================================================
-- KYKOS - Rollback Script (if needed)
-- Remove WITHDRAWN status from VolunteerStatus enum
-- =====================================================
-- WARNING: This will fail if there are existing rows
-- using the WITHDRAWN status. Delete or update those
-- rows first.
-- =====================================================

-- Check for existing WITHDRAWN associations
SELECT COUNT(*) FROM volunteer_associations WHERE status = 'WITHDRAWN';

-- If count > 0, update them to APPROVED or delete them first
-- UPDATE volunteer_associations SET status = 'APPROVED' WHERE status = 'WITHDRAWN';
-- Or: DELETE FROM volunteer_associations WHERE status = 'WITHDRAWN';

-- To remove the enum value (PostgreSQL allows this):
BEGIN;
ALTER TYPE "VolunteerStatus" DROP VALUE 'WITHDRAWN';
COMMIT;