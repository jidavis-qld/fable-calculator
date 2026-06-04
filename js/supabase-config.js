/* ── Supabase connection config (shared) ─────────────────────────────────────
   Single source of truth for the Supabase project URL + anon key. Loaded by
   index.html (before data.js) and validator.html (before its inline script) so
   every page references the SAME credentials — no copy-paste drift.

   SECURITY NOTE: SUPABASE_KEY below is the *anon* (publishable) key. It is
   client-public by design — it ships to every browser that loads the page and
   is gated by row-level security on the read-only, non-PII reference tables.
   This is NOT a secret leak and must NOT be treated as one. The service_role
   key never appears in client code.

   These are declared as plain globals (classic <script>, not a module), so any
   consumer script loaded AFTER this one can reference SUPABASE_URL / SUPABASE_KEY
   directly. Consumers must not redeclare them.
   ─────────────────────────────────────────────────────────────────────────── */

const SUPABASE_URL = 'https://qrtomlulbcuantmtaxfc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydG9tbHVsYmN1YW50bXRheGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTU3MDgsImV4cCI6MjA4NzA5MTcwOH0.hcA0SYB5DEPGjxTdvfbKroixsFbJ83Syi_F9BCn7B9k';
