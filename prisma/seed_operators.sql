-- Seed: Create test operators for existing intermediaries
-- Run this in Supabase SQL Editor

-- First, find the organization id
DO $$
DECLARE
  org_id UUID;
  org_code VARCHAR(50);
BEGIN
  -- Find CARITAS-ROMA or any CHARITY type org
  SELECT id, code INTO org_id, org_code
  FROM organizations
  WHERE type = 'CHARITY'
  LIMIT 1;

  RAISE NOTICE 'Found organization: % (%)', org_id, org_code;

  -- Check if operator already exists
  IF NOT EXISTS (
    SELECT 1 FROM operators
    WHERE organization_id = org_id AND username = 'mario.rossi'
  ) THEN
    -- Create operator (password: ente123, hashed with SHA256)
    INSERT INTO operators (id, username, email, phone, first_name, last_name, password_hash, role, permissions, active, created_at, updated_at, organization_id)
    VALUES (
      gen_random_uuid(),
      'mario.rossi',
      'mario.rossi@caritas.it',
      '+39 333 1234567',
      'Mario',
      'Rossi',
      '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- ente123
      'GESTORE_RICHIESTE',
      ARRAY['RECIPIENT_AUTHORIZE', 'REQUEST_PROXY']::TEXT[],
      true,
      NOW(),
      NOW(),
      org_id
    );

    RAISE NOTICE 'Created operator mario.rossi for organization %', org_code;
  ELSE
    RAISE NOTICE 'Operator mario.rossi already exists';
  END IF;
END $$;

-- Show all organizations and their codes
SELECT id, code, name, type FROM organizations;
