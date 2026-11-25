# fable-calculator — handover guide

Written at the 2026-11 handover for **Chris McCallum**, who takes over this site. "Ji" in older records (IMPROVEMENT_LOG, backlog,
decisions) is Ji Davis, the previous owner. The repo is at `jidavis-qld/fable-calculator` (Ji's personal GitHub account) and is
being transferred to the new maintainer's account, which **changes the public web address** (section 5). How to work here with
Claude Code: [`CLAUDE.md`](CLAUDE.md) (including "Safety rules for anyone's Claude"), [`README.md`](README.md) and [`docs/INDEX.md`](docs/INDEX.md).

Anything about live state outside this repo (Supabase, HubSpot, DNS) could **not be checked from the repo**; where it matters, how to check is given.

## 1. What the app is for, and who uses it

A public sales tool: a six-step quiz that recommends a **Fable Shiitake Infusion** recipe and beef trim for a customer's priority (cost,
nutrition, balance or sustainability), for four countries (US, UK, AU, EU), with the right front-of-pack nutrition label for each country,
and a **Recipe Validator** page showing every recipe/trim combination. Customers and the sales team use it. Visitors can type their
name, email and company to have the results emailed to them, which also adds them to HubSpot. Anyone with the address can use it; there is no sign-in.
It is Fable's only publicly reachable app. How much it is used was not measured from this repo.

## 2. The moving parts

| Thing | Detail |
|---|---|
| **GitHub Pages** site | Served from branch `main`, path `/`, build type "legacy" (GitHub builds on every push), HTTPS enforced, **no custom domain**, status `built` (checked with `gh api repos/jidavis-qld/fable-calculator/pages` on 2026-11-25). Address today: `https://jidavis-qld.github.io/fable-calculator/` |
| Supabase project (referenced in `js/supabase-config.js`) | Holds the data the site reads at runtime (beef prices, nutrition, recipes, CO2, scoring weights; five tables). Row-level security is on with read-only public policies (`supabase/migrations/20260310_security_fixes.sql`). |
| Supabase Edge Function `send-results` | `supabase/functions/send-results/index.ts`. **Deployed by hand**, so the live version may differ from the repo. Creates/updates a HubSpot contact and sends the results email through HubSpot. Limits each IP to 5 requests per 15 minutes (kept in memory per instance), allows any website to call it (`Access-Control-Allow-Origin: *`). |
| Google Cloud | **None.** No Cloud Run, no Cloud Build trigger, no alerts, no schedules. The new `#ai-app-alerts` alerts do not cover this site. |
| CI | A secret scan (`gitleaks`, GitHub Actions) which has been failing on every `main` run since 2026-06-04 (backlog L3, decision D2). It does not block merging. |

What it reads and writes:

| System | Access | Notes |
|---|---|---|
| Supabase tables (anon key from the browser) | Read | The anon key in `js/supabase-config.js` is public by design (ruled 2026-08-10). Do not report it as a leak. |
| HubSpot (via the edge function) | **Write** | Contact upsert and a transactional email. |
| Visitors' personal data | Collected | First name, last name, email, company (`js/email.js`). Where it ends up and for how long is an open question (DECISIONS D1). |

## 3. How to tell it is broken, and where alerts go

Nothing alerts on this site. Signs: the page does not load, shows blank prices or "failed to load data", the results look wrong
(Supabase data changed), or the "email me" button reports an error. To check from a terminal:

```bash
# Run as: any (public, needs your own GitHub login for the first command)
gh api repos/cmac282/fable-calculator/pages --jq '{status, html_url}'   # use jidavis-qld until the repo is transferred
curl -s -o /dev/null -w "%{http_code}\n" https://jidavis-qld.github.io/fable-calculator/   # change the address after transfer
```

Rollback: revert the commit on `main` through a pull request; Pages republishes the previous version.
For wrong numbers the cause is usually in Supabase (the data is not in git), so check the tables before the code.

## 4. Making and deploying a change with Claude Code

1. Branch from `main`; edit; run `for f in js/*.js; do node --check "$f" || echo "FAIL $f"; done`; look at both pages locally with
   `python3 -m http.server` (it reads live Supabase data).
2. Open a pull request. **Merging publishes to the public internet immediately**: there is no staging site and no automated test
   (backlog M1). Review the diff by eye and test the quiz in the browser before merging.
3. Changes to `supabase/` (migrations, the edge function) are **hand-applied** in Supabase and fall in the stop-at-a-pull-request
   categories (database schema; writes to HubSpot; personal data). Nothing in this repo applies them.
4. `validator.html` repeats the data-loading and rendering logic in one inline script; a fix to loading logic must be made in both pages.
5. After the merge, see "Safety rules", section 4 in `CLAUDE.md` for what to check.

## 5. Routine chores

| When | Chore | Where |
|---|---|---|
| **At repo transfer (the one that matters)** | The site's address is `https://<GitHub account>.github.io/<repo name>/`. After the repo moves to `cmac282` the address becomes **`https://cmac282.github.io/fable-calculator/`** (assuming the repo name is kept). GitHub redirects repository pages but is not documented to redirect the published website, so assume **the old address stops working** (confirm after the move). Then: (1) re-enable Pages on the new repo if it was switched off by the transfer (Settings > Pages > Source: branch `main`, folder `/`), (2) tell everyone who has the old link (sales decks, emails, HubSpot templates, Slack, bookmarks: **nobody has listed where it is linked, could not check from the repo**), (3) or avoid the change entirely by setting a custom domain such as `calculator.fablefood.co`: add the domain in Settings > Pages, create a `CNAME` DNS record pointing at `<account>.github.io` (DNS is managed by whoever owns the `fablefood.co` zone: could not check), and keep "Enforce HTTPS" on. Using a custom domain makes future moves painless. | GitHub Settings > Pages; DNS |
| At repo transfer | Pages is configured as: source = branch `main`, path `/`, legacy build, no custom domain, HTTPS enforced (from `gh api repos/jidavis-qld/fable-calculator/pages`). Recreate exactly that, or the site goes offline. | GitHub Settings > Pages |
| Ji's last day | Ji is an owner of the Supabase organisations per the handover access map; confirm which organisation owns **this** project (it is not one of the two Supabase projects named in the access map) and that the HubSpot key used by the edge function does not belong to Ji's personal account. | Supabase dashboard; HubSpot private apps |
| When prices or recipes change | Edit the rows in Supabase (`beef_prices`, `recipes`, `nutrition`, `scoring_config`); no deploy needed. | Supabase dashboard |

## 6. Known rough edges and open items

- **Personal data (DECISIONS D1):** the email modal collects name, email and company; nothing in the repo says where it goes or how long it is kept. The edge function in the repo shows it goes to HubSpot, but the live version may differ.
- The edge function allows requests from any origin and rate-limits only in memory per instance.
- The `gitleaks` CI check is permanently red (D2), which would hide a new leak; no baseline accepted.
- Merges publish with no check at all (M1). A small email-confirmation message writes the visitor's address into the page without escaping it (L1, only affects the visitor who typed it).
- The repo name and the Supabase project are tied to Ji's accounts today; neither was checked from here.

## 7. Who to ask about the business side

The sales and product team for the recipes, prices and health-claim wording; whoever owns HubSpot for the email and the contact list.
Technical: Chris McCallum.

## 8. Where each secret comes from (names only, never values)

| Name | Used by | Purpose | Notes |
|---|---|---|---|
| Supabase anon key | `js/supabase-config.js` (public, in the repo) | Read-only access for browsers | Public by design; protected by row-level security |
| `HUBSPOT_API_KEY` | Edge function `send-results` | HubSpot contact upsert and email | Set in Supabase function secrets, not in the repo. Which HubSpot account or app it belongs to could not be checked. |
| `HUBSPOT_EMAIL_ID` | Edge function | HubSpot transactional email template id | Same place |
| `FROM_EMAIL`, `FROM_NAME` | Edge function | Sender (defaults `hello@fablefood.co`, `Fable Food`) | Same place |
| Supabase `service_role` key | nowhere in client code | Must never appear in this repo | |
