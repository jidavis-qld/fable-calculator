# Decisions — fable-calculator

> The single home for anything waiting on Ji, and for rulings already made.
> Open questions: newest on top; each states its default-if-unanswered. Rulings: never
> re-litigate — link here instead. Created 2026-08-10 (repo-memory onboarding; toolkit
> `REPO_DOCS.md`).

## Open questions (waiting on Ji)

| # | Question | Default if unanswered | Where the detail lives | Since |
|---|---|---|---|---|
| D1 | **Where does the `send-results` PII go, and for how long?** The email modal collects first name, last name, email and company (`js/email.js:24-28`) and POSTs them to the `send-results` Supabase Edge Function. `supabase/functions/send-results/index.ts` is in the repo but is deployed by hand, so the live version may differ, and nothing anywhere in the repo documents whether those details are stored, forwarded to a mail provider, or added to a marketing list. This is a *public* form, so it is a real privacy question rather than an internal one. Needs a one-line answer recorded in the App profile, plus a check that the live function matches the committed source. | Undocumented. Nobody can answer "what do you do with my details" from this repo | IMPROVEMENT_LOG.md owed check 2 | 2026-08-10 |

## Rulings (made — do not re-litigate)

- **The Supabase anon key in client code stays** (2026-08-10). `js/supabase-config.js:18` holds
  the `anon`/publishable JWT, which is client-public by design: it ships to every browser and is
  gated by RLS. `supabase/migrations/20260310_security_fixes.sql` confirms RLS is enabled with
  read-only `public_read` policies for `anon`, and the `service_role` key appears nowhere in
  client code. The file already documents all of this at `:6-11`. **Do not** report it as a
  leaked secret, and do not "fix" it by moving it to an environment variable — there is no build
  step to substitute one. Re-open only if a `service_role` key appears in client code, or if a
  table reachable with the anon key stops being read-only reference data. Also recorded in
  IMPROVEMENT_LOG.md's Won't-do.

- **`validator.html` being public is intended** (2026-08-10). It shows every recipe/trim
  combination, beef prices included, and is linked twice from the customer-facing results page
  (`index.html:326` "View All Recipes", `:487` "See all recipe comparisons"). Checked
  specifically for accidental exposure of internal pricing; it is the product. Do not re-raise.
