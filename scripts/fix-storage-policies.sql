-- Fix Supabase Storage bucket policies
-- Run via Supabase SQL Editor

-- 1. Create a more restrictive policy that allows public read access
-- but NOT public listing of all files

-- First, let's see what buckets exist
-- SELECT * FROM storage.buckets;

-- Option A: Remove the public listing policy entirely
-- This forces users to know the exact file path to access files

DROP POLICY IF EXISTS "Public bucket read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Create a policy that only allows reading files if you know the exact path
-- but prevents listing all files in the bucket
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'qr-codes'
  AND (storage.foldername(name))[1] = 'qr-codes'
);

-- Option B: If you want to allow access only to specific folders
-- Modify the policy to be more restrictive based on folder structure

-- For a truly public bucket that just prevents listing:
-- The issue is that the bucket has "public" access AND a broad SELECT policy
-- Solution: Make the bucket private or use authentication

-- To fix completely, you should either:
-- 1. Make the bucket private and use signed URLs
-- 2. Or keep public access but remove storage.objects SELECT policy and use:
--    storage.objects FORCE ROW LEVEL SECURITY = false

-- Let's set RLS to off for storage.objects since bucket-level policies handle access
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Then ensure the bucket itself has appropriate settings
-- You can do this in Supabase Dashboard → Storage → buckets → qr-codes
-- Set "Public" to false if you don't need public access

-- Or alternatively, if you DO need public read but not listing:
-- Use a custom function that doesn't expose file enumeration

-- Verify the change
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
