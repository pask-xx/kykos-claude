-- ============================================================================
-- Storage policies per il bucket "legal-documents"
-- ============================================================================
--
-- I PDF di Termini e Privacy sono DOCUMENTI PUBBLICI per definizione (art. 13
-- GDPR: l'informativa privacy deve essere accessibile a chiunque senza
-- registrazione). Quindi:
--
--   * SELECT pubblico (chiunque può scaricare il PDF conoscendo il path)
--   * INSERT/UPDATE/DELETE solo via SERVICE ROLE (lato server con
--     supabaseAdmin) — l'admin passa per POST /api/admin/legal/upload che
--     usa la service role key, che bypassa RLS.
--
-- NB: la policy di SELECT si applica solo al client anonimo (NEXT_PUBLIC_*
-- keys). Le mutation server-side con la service role key non sono filtrate
-- da RLS. Quindi per i client non-autenticati serve solo la policy di
-- SELECT. Le mutation non servono policy (sono implicitamente deny-all per
-- il client anonimo, e allowed-all per service role).
--
-- Prerequisito: il bucket "legal-documents" deve esistere ed essere
-- "public: true". Per crearlo:
--
--   1. Supabase Dashboard → Storage → New bucket
--   2. Name: legal-documents
--   3. Public bucket: ON
--   4. Allowed MIME types: application/pdf (opzionale, restrizione lato UI)
--
-- Poi esegui questo script nel SQL Editor.
-- ============================================================================

-- Policy 1: SELECT pubblico per il bucket legal-documents
-- Chiunque (anche non autenticato) può scaricare un PDF sapendo l'URL.
-- Questa policy non permette di LISTARE i file nel bucket, solo di accedere
-- a un file specifico (è la semantica standard di Supabase Storage).
DROP POLICY IF EXISTS "Public read access on legal-documents" ON storage.objects;

CREATE POLICY "Public read access on legal-documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'legal-documents'
);

-- Le mutation (INSERT, UPDATE, DELETE) NON hanno policy. Questo significa:
-- - Anon client (anon key): deny-all implicito → non può scrivere.
-- - Service role (server-side, supabaseAdmin): bypass RLS → può scrivere.
--
-- Questo è il pattern standard: pubblico in lettura, service role in
-- scrittura, senza bisogno di policy esplicite per service role.

-- Verifica
-- SELECT policyname, cmd FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage'
-- AND policyname LIKE '%legal%';
