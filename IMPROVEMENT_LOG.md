# Improvement Log — fable-calculator

> Maintained by the Fable continuous-improvement system. Newest on top. Do not delete.
> Ranked backlog: `docs/backlog/BACKLOG.md` · Decisions: `docs/decisions/DECISIONS.md`

## Health: 9/10 — nothing confirmed wrong; the one structural risk is that a push to `main` publishes straight to the public internet with no gate

Created 2026-08-10. This repo took the managed continuous-improvement block on 2026-08-03
(`a45f064`) but never got an IMPROVEMENT_LOG.md, so the weekly fleet triage has scored it as
an unknown ever since.

This is the healthiest of the six repos onboarded today, and the score reflects work already
done rather than generosity. Evidence for the good half, so a later run does not re-audit it:

- `README.md` is 100+ lines and genuinely accurate — file structure, JS load order and *why*
  it matters, the five Supabase tables, all four countries' currency/price-unit/label systems,
  and the per-country health-claim thresholds. `SCORING_RULES.md` documents the engine in plain
  English; `STYLE_GUIDE.md` exists too.
- Supabase advisor findings were **fixed, not noted** — `supabase/migrations/20260310_security_fixes.sql`
  recreates `us_recipe_analysis` with `security_invoker = true` and enables RLS with an explicit
  `public_read` policy on `us_trim_selector`, with the reasoning written into the migration.
- The anon key in `js/supabase-config.js:18` is correct and correctly reasoned about — the
  file's own comment (`:6-11`) explains that it is the publishable key, client-public by design,
  gated by RLS on read-only non-PII tables, and that `service_role` never appears in client
  code. **This is not a secret leak and must not be reported as one.**
- A prior session already fixed a silent-failure bug the right way: `js/email.js:70-84`
  (KAN-543, `02206b2`) detects a failed DOM scrape and refuses to send a blank results card,
  instead of emailing nothing and hoping.
- All ten JS files pass `node --check` (2026-08-10).
- `validator.html` was checked for accidental exposure of internal pricing and is **intended**
  to be public: `index.html:326` and `:487` link to it as "View All Recipes" / "See all recipe
  comparisons". Not a finding.

Confirmed deductions:

- **Release safety −0.5.** GitHub Pages serves `main` at `/` with `build_type: legacy`
  (`gh api repos/jidavis-qld/fable-calculator/pages`), so every merge publishes to the public
  internet immediately. There are no tests and the only CI is gitleaks, so nothing — not even
  `node --check` — stands between a merged typo and Fable's only publicly reachable app.
  BACKLOG **M1**.
- **Small stuff −0.5.** An unescaped user-typed email interpolated into `innerHTML`
  (`js/email.js:115`, self-XSS only — BACKLOG **L1**), and a `CLAUDE.md` with no
  repo-specific content at all (BACKLOG **L2**).

Tests: **0.** Not the right number here the way it is for `fable-homepage` — there is 1,743
lines of scoring, nutrition-label and claim-threshold logic that a test could hold still — but
no test would have caught anything found today, so it is a gap rather than a defect. See M1 for
the cheapest first step.

## App profile (audit memory — update each /fable-audit)

**App type:** A public, browser-only sales tool: a 6-step wizard that recommends a Fable
Shiitake Infusion recipe and beef trim for a customer's stated priority (cost, nutrition,
balance, sustainability), plus a Recipe Validator that shows every recipe/trim combination.
No backend of its own — plain HTML/CSS/JS with classic `<script>` globals (no bundler, no
`package.json`, no framework), reading Supabase at runtime.

**Deploy: GitHub Pages, not Cloud Run** — the only app in this group that is not in
`in-demand-87605`. Live at `https://jidavis-qld.github.io/fable-calculator/`, `status: built`,
`public: true`, `https_enforced: true`, source `main` at path `/`, `build_type: legacy`,
`custom_404: false`. **This is Fable's only publicly reachable app of the six onboarded
2026-08-10** — everything else sits behind IAP. Nothing here is IAP-gated, so anyone with the
URL sees it.

**Surfaces present:** **PUBLIC WEB** (unauthenticated, indexable) · **EXTERNAL INTEGRATION**
(Supabase: five read-only reference tables + one Edge Function) · **OUTBOUND** (the
`send-results` Edge Function emails a results card to a visitor-supplied address) · **PII**
(first/last name, email, company collected in the email modal) · **REGULATED CONTENT** — the
output renders front-of-pack nutrition labels and health claims per jurisdiction: FSA Traffic
Light (UK), Health Star Rating (AU, FSANZ), Nutri-Score (EU), USDA FSIS nutrition facts (US),
plus "High in"/"Source of" fibre and protein badges against per-country thresholds. **No auth,
no money written, no scheduler, no LLM.**

**Key output + how to re-derive:** the recommended blend (ratio, trim, recipe) and its cost /
nutrition / carbon numbers. **None of the inputs live in this repo** — beef prices, nutrition
per 100g, recipe ratios, CO₂e and every scoring weight live in Supabase
(`beef_prices`, `nutrition`, `recipes`, `co2_kg_e`, `scoring_config`), so the same commit
produces different answers as that data changes. Re-derive the algorithm from
`SCORING_RULES.md` + `js/engine.js`; re-derive claim thresholds from `COUNTRY_CONFIG` in
`js/country.js`; re-derive labels from `js/nutriscore.js`.

**Invariants:**
- **JS load order is load-bearing** and enforced only by `index.html`'s script tag order:
  `config → country → supabase-config → data → engine → quiz → render → nutriscore → misc`.
  `country.js` declares the shared global data stores the others write to, and
  `supabase-config.js` declares `SUPABASE_URL`/`SUPABASE_KEY`, so both must precede `data.js`.
  Consumers must not redeclare those globals (`js/supabase-config.js:12-14`).
- Country codes are the 2-letter `US`/`UK`/`EU`/`AU`, matching `COUNTRY_CONFIG[*].code` in
  `js/country.js` and the `country` column in every Supabase table.
- `validator.html` deliberately duplicates the data-loading and rendering logic in one inline
  `<script>`; it shares only `js/supabase-config.js`. A fix to loading logic must be made twice.
- Every Supabase table has RLS on with a read-only `public_read` policy for `anon`. The
  `service_role` key never appears in client code.
- Migrations and the Edge Function are **applied by hand** — `20260310_security_fixes.sql` says
  so in its header ("Run in the Supabase SQL editor"). Nothing in CI applies them.

**Verification commands that work here:**
- There is **no** test command and no `package.json`. Do not report one.
- Syntax-check every file (the closest thing to a build): `for f in js/*.js; do node --check "$f" || echo "FAIL $f"; done`
  → all 10 clean (2026-08-10).
- Publish state, without leaving the terminal:
  `gh api repos/jidavis-qld/fable-calculator/pages`
- Run locally: `python3 -m http.server` from the repo root and open `index.html` — it reads live
  Supabase with the anon key, so the numbers are real.
- **This app CAN be verified live**, unlike the IAP-gated fleet — the Pages URL needs no login.
  Use it.

**Sharp edges:**
- **Not on Cloud Run and not in `in-demand-87605`.** `gcloud run services describe` will never
  find it; there is no Cloud Build trigger. The deploy is GitHub Pages off `main`.
- **A merge is a publish.** No build step, no staging, no approval gate. Treat any change to
  `js/` or the two HTML files as going live the moment it lands.
- **The anon key is meant to be there** (`js/supabase-config.js:18`). Every fresh secret-scan
  or review will want to flag it; the file already explains why that is wrong. Do not
  re-litigate it — and do not "fix" it by moving it to an env var, because there is no build
  step to inject one.
- **Prices and weights are not in git.** A number changing on the live site with no commit is
  normal and expected: `scoring_config` and `beef_prices` are edited in Supabase. Never debug a
  changed output by reading only the diff.
- `custom_404: false` — an unknown path shows GitHub's generic 404, not a Fable page.

**Deep-dive rotation:** 2026-08-10 = first pass; **release path + client security** (the
publish gate, the email modal, the anon-key question settled). Next: **the scoring engine and
claim thresholds** — `js/engine.js` and `js/nutriscore.js` against `SCORING_RULES.md` and the
per-country regulatory thresholds, which this pass read but did not verify against the source
regulations.

**Owed live checks (settle FIRST next run):**
1. **Does the live site still calculate correctly end to end?** Not attempted this session —
   outbound HTTP to `jidavis-qld.github.io` was not available. It is the one app here that
   needs no login, so this is a genuinely cheap check next time: load the page, complete the
   wizard for each of the four countries, and confirm the label block renders.
2. **Does the `send-results` Edge Function still work, and what does it retain?** The function
   is in-repo (`supabase/functions/send-results/index.ts`) but is deployed by hand, so the live
   version may not match. It receives name/email/company — worth confirming where that PII
   lands and for how long, since nothing in this repo documents it.

## Won't-do

- **Do not treat `SUPABASE_KEY` in `js/supabase-config.js:18` as a leaked secret.** It is the
  anon/publishable key, client-public by design and gated by RLS on read-only non-PII tables;
  the file documents this at `:6-11`. Rejected 2026-08-10 after reading the key's role and the
  RLS policies. Re-open only if a *service_role* key appears in client code, or if a table
  reachable with the anon key stops being read-only reference data.

---

## 2026-08-10 — repo-memory onboarding; a merge here is a publish, and nothing gates it

### 1. Every push to `main` reaches the public internet, past no test and no check

**Confirmed** from GitHub's own API rather than inferred:

```
$ gh api repos/jidavis-qld/fable-calculator/pages
{"status":"built", "html_url":"https://jidavis-qld.github.io/fable-calculator/",
 "build_type":"legacy", "source":{"branch":"main","path":"/"}, "public":true,
 "https_enforced":true, "custom_404":false}
```

`build_type: legacy` with `source: main:/` means GitHub publishes the branch contents directly
— there is no workflow between merge and live. And there is nothing to gate it with: no tests
exist, `.github/workflows/` contains only `gitleaks.yml`, and there is no `package.json`, no
linter and no `node --check` step anywhere.

**Impact, concretely.** The nine JS files are loaded as classic scripts in a fixed order that
`README.md` documents as load-bearing. A syntax error in any one of them — or a rename that
breaks the `country.js`-before-`data.js` rule — takes the whole calculator down for every
visitor the instant it merges, with no build failure, no red CI, and no revision to roll back
to (Pages serves whatever `main` says). This is Fable's only publicly reachable app of the six
onboarded today; everything else is behind IAP where a bad deploy is embarrassing rather than
public.

The cheapest honest fix is not a test framework. It is one CI job running
`for f in js/*.js; do node --check "$f"; done` on pull requests, which today passes for all ten
files and would have to keep passing. BACKLOG **M1**.

### 2. The email success message interpolates a user-typed address into `innerHTML`

**Confirmed.** `js/email.js:111-118` replaces the modal's contents with a template literal, and
`:115` embeds the visitor's email unescaped:

```js
<p>We've sent your blend results to <strong>${email}</strong>.<br>…
```

`email` comes straight from `#email-address` (`:24`) and the only validation is
`email.includes('@')` (`:32`), so a value like `x@<img src=x onerror=…>` is written into the
DOM as markup.

**Being precise about severity: this is self-XSS and nothing more.** There is no URL parameter
that reaches it, nothing is persisted and re-rendered to another visitor, and the value is
typed by the same person who sees the result. Nobody can be attacked with it except by
convincing them to paste a payload into a form. So it is **Low**, not a vulnerability to
escalate — recorded because it is a confirmed unescaped-user-input-into-`innerHTML` on a public
page, the fix is three lines (`textContent`, or the same `escapeHtml` helper
`fable-homepage/main.js:52-59` already uses), and it should not survive the next time someone
audits this file and finds it fresh. BACKLOG **L1**.

### 3. `CLAUDE.md` contains no information about this repo

**Confirmed.** The file is exactly one heading — `# fable-calculator` — followed immediately by
the managed continuous-improvement block. No stack, no deploy, no conventions, no pointer to
`README.md`, and nothing that says this app is public, on GitHub Pages, or backed by Supabase.

The information all exists and is good; it is just in `README.md`, which is not the file a
session reads first. Everything a session most needs to know before touching this repo is
absent from where it looks: that a merge is a publish, that the anon key is intentional, and
that prices are not in git. BACKLOG **L2**.

### 4. Two things checked and cleared, recorded so they are not re-checked

- **The anon Supabase key is fine.** `js/supabase-config.js:18` holds a publishable `anon` JWT.
  `:6-11` already explains why that is correct, and `20260310_security_fixes.sql` shows RLS is
  on with read-only `public_read` policies. Added to Won't-do.
- **`validator.html` is not accidentally exposed internal data.** It is linked from the
  customer-facing results page twice (`index.html:326`, `:487`) as "View All Recipes" and "See
  all recipe comparisons", so showing every recipe/trim combination — beef prices included — is
  the intended product, not a leak.

### 5. Repo-memory onboarding

`IMPROVEMENT_LOG.md`, `docs/INDEX.md`, `docs/backlog/BACKLOG.md` and
`docs/decisions/DECISIONS.md` created per the toolkit's `REPO_DOCS.md`. The managed CLAUDE.md
block has pointed at all four since 2026-08-03; none existed.

**Health: 9/10 (first score).**

**If you only do one thing:** add a pull-request CI job that runs `node --check` over `js/*.js`
— it is the only thing standing between a merged typo and Fable's public calculator going dark
(BACKLOG M1).
