-- ══════════════════════════════════════════════════════════════
-- Security fixes — resolve Supabase advisor errors
-- Run in the Supabase SQL editor (service role / dashboard).
-- ══════════════════════════════════════════════════════════════


-- ── Fix 1: security_definer_view ──────────────────────────────
-- us_recipe_analysis was defined with SECURITY DEFINER, meaning
-- it runs with the view creator's permissions rather than the
-- querying user's. Recreate it with security_invoker = true so
-- it respects RLS of the calling role instead.
--
-- The DO block reads the existing view definition from the
-- system catalogue and recreates it with the correct flag,
-- so you don't need to know the SELECT body ahead of time.

DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_viewdef('public.us_recipe_analysis'::regclass, true)
  INTO v_def;

  -- Drop and recreate with security_invoker (Postgres 15+)
  EXECUTE format(
    'CREATE OR REPLACE VIEW public.us_recipe_analysis
       WITH (security_invoker = true)
       AS %s',
    v_def
  );
END;
$$;


-- ── Fix 2: rls_disabled_in_public ────────────────────────────
-- us_trim_selector is a public table with no RLS enabled.
-- The app uses only the anon key (no user authentication),
-- so we enable RLS and add a blanket SELECT policy for the
-- anon and authenticated roles — matching every other table.

ALTER TABLE public.us_trim_selector ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted read access for the anon key
CREATE POLICY "public_read"
  ON public.us_trim_selector
  FOR SELECT
  TO anon, authenticated
  USING (true);
