-- Phased lead capture — split the single end-of-flow write into two:
--   1. INSERT at scan-start  : gender + goal + optional demographics
--   2. UPSERT at form submit : name / phone / email + body_type / frame_size
-- Same row both times, linked by an unguessable scan_id (UUID).
--
-- Why: marketing wants the conversion funnel, not just the bottom. Visitors
-- who scan but walk away before claiming the workout still produce a row
-- with gender/goal/demographics — name stays NULL.
--
-- Idempotent — safe to re-run.

-- ============================== SCHEMA ====================================

-- New stable key linking the two writes. Generated client-side as a v4 UUID
-- via crypto.randomUUID(); 122 bits of entropy makes it act as a one-time
-- bearer token for the row's brief unfinalised window.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS scan_id    UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS frame_size TEXT;

-- UNIQUE without failing if it already exists (UNIQUE INDEX is idempotent
-- via IF NOT EXISTS; ALTER TABLE ADD UNIQUE is not).
CREATE UNIQUE INDEX IF NOT EXISTS leads_scan_id_uniq ON public.leads (scan_id);

-- Contact fields are filled at form submit, not at scan-start. Drop the
-- NOT NULL constraints from the original schema so the initial row is valid.
ALTER TABLE public.leads ALTER COLUMN name  DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN phone DROP NOT NULL;

-- ============================== RLS POLICY ================================
--
-- The anon role needs to UPDATE the row at form submit. We scope this
-- tightly: only rows that are still unfinalised (name IS NULL) AND fresh
-- (captured within the last 10 minutes). After form submit sets name, the
-- row is locked from anon edits. Scan_id is the practical security
-- (122 bits, never persisted server-side outside this row, browser-only).

DROP POLICY IF EXISTS "anon can update unfinalised leads" ON public.leads;
CREATE POLICY "anon can update unfinalised leads"
  ON public.leads
  FOR UPDATE
  TO anon
  USING (name IS NULL AND captured_at > now() - interval '10 minutes')
  WITH CHECK (true);

-- ============================== SANITY ====================================
-- After running, both INSERT and UPDATE policies should exist:
--   SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'leads';
--
-- Expected:
--   "anon can insert leads"            INSERT  {anon}
--   "anon can update unfinalised leads" UPDATE  {anon}
