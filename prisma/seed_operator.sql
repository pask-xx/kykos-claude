-- Create test operator for CARITAS-CENTRO-ROMA
DO $$
DECLARE
  org_record RECORD;
  op_id TEXT;
BEGIN
  -- Get organization id as TEXT
  SELECT id INTO org_record FROM organizations WHERE code = 'CARITAS-CENTRO-ROMA';

  op_id := 'op_test_mario_rossi_001';

  INSERT INTO operators (id, username, email, phone, "firstName", "lastName", "passwordHash", role, permissions, active, "createdAt", "updatedAt", "organizationId")
  VALUES (
    op_id,
    'mario.rossi',
    'mario.rossi@caritas.it',
    '+39 333 1234567',
    'Mario',
    'Rossi',
    '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    'GESTORE_RICHIESTE',
    ARRAY['RECIPIENT_AUTHORIZE', 'REQUEST_PROXY'],
    true,
    NOW(),
    NOW(),
    org_record.id
  )
  ON CONFLICT ON CONSTRAINT operators_organizationId_username_key DO UPDATE SET email = EXCLUDED.email;

  RAISE NOTICE 'Done for org: % (%)', org_record.id, org_record.code;
END $$;

-- Verify
SELECT id, username, role, active FROM operators WHERE username = 'mario.rossi';
