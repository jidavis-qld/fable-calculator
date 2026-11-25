# fable-calculator

The Fable Shiitake Infusion Calculator: a **public** browser tool (static HTML/CSS/JS, no build step, no package.json) that recommends a recipe and beef trim, plus a Recipe Validator. Published by **GitHub Pages** from `main` (no Cloud Build, not on Google Cloud). Prices, nutrition and scoring weights live in **Supabase**, not in git. See `README.md` for the file map and `HANDOVER.md` for how it is run.

- **A merge to `main` publishes immediately** to the public web (see section 4 of the safety rules below).
- Check: `for f in js/*.js; do node --check "$f" || echo "FAIL $f"; done` (there is no test suite).
- The Supabase **anon key** in `js/supabase-config.js` is public by design and must not be "fixed" or reported as a leak (ruled 2026-08-10, `docs/decisions/DECISIONS.md`). `validator.html` is public on purpose too.
- The site's address is tied to the GitHub account that owns the repo (`https://<owner>.github.io/fable-calculator/`) and changes when the repo is transferred, unless a custom domain is set.

<!-- FABLE-CONTINUOUS-IMPROVEMENT:BEGIN (managed — edit the toolkit, not this copy) -->
## Continuous Improvement

This repo is under continuous improvement. Its memory lives in two places — **do not
delete either**:

- `IMPROVEMENT_LOG.md` (repo root) — the Health line, recent History (~3 months), the
  Won't-do list, and the **App profile**: this app's risk surfaces, key outputs + how to
  independently re-derive them, invariants, working verification commands, sharp edges,
  and **owed live checks** (verifications a prior run couldn't complete — always settle
  these first).
- `docs/` — organised per the toolkit's `REPO_DOCS.md`: `docs/INDEX.md` is the front door
  (every doc has a status: ACTIVE / REFERENCE / ARCHIVED); the ranked backlog lives in
  `docs/backlog/BACKLOG.md` (legacy repos: still in the log's "Next candidates" — one
  place per repo, never both); open questions + Ji's rulings in
  `docs/decisions/DECISIONS.md`; reusable app-specific prompts in `docs/prompts/`;
  dated one-off reports and closed programs in `docs/archive/<year>/`. Keep INDEX.md
  current in the same commit as any docs change; keep the repo root clean (no ad-hoc
  PROGRESS/QUESTIONS/tracker files).

**Posture — every session in this repo, not just the fable-* commands:**
1. **Orient:** before real work, skim `docs/INDEX.md`, the backlog, and DECISIONS.md —
   don't re-find known issues, redo won't-dos, or re-ask ruled questions.
2. **Build the backlog:** a confirmed issue you notice but won't fix this session goes on
   the backlog (file:line + impact + safe-for-daily/needs-decision) before you finish.
   A finding that only lives in chat is lost.
3. **Drain it:** when the asked work is done and verified, offer the top safe backlog item
   as the natural next step. Don't do it unasked; make it easy to say yes.
4. **Move decisions:** if a DECISIONS.md question blocks work or the session is wrapping
   up, surface the 1–2 most valuable open ones — with the default and what a ruling
   unblocks. The moment Ji rules, record it in Rulings (date + answer) in the same session.
5. **Leave the docs truer than you found them:** fix stale INDEX rows, drifted profile
   claims, and done-but-open backlog items on sight.

- **Daily ratchet — `/fable-daily`:** run after a coding session or on a regular cadence.
  Each run makes exactly ONE safe, verified improvement and logs it. It settles owed
  checks first, refuses to run on a dirty tree, makes one revertible local commit, and
  never pushes on its own.
- **Deep review — `/fable-audit`:** run periodically. Full code + process + system review;
  refills the prioritized backlog, updates the App profile, and goes DEEPER on this app's
  specific risks each time (deep-dive rotation), not wider over the same ground.
- **Fleet view — `/fable-fleet`:** read-only triage across all repos — where to spend time,
  which decisions are waiting, which owed checks are outstanding.
- **New apps — `/fable-new-app`:** scaffolds a repo already wired into this system.

Cross-app bug classes live in the toolkit's `LESSONS.md` — every audit sweeps them here
and adds new ones found here so the other repos get checked.

All commands follow **The Doctrine**: evidence over assertion (quote file:line), reproduce
then verify (prove it runs), smallest change that works, and flag before any risky change
(auth, money/pricing, database/migrations, data deletion, or external integrations —
HubSpot, Fishbowl, BigQuery, Supabase, Xero). This is an implementation gate (confirm
before writing the code), not a merge gate — once the user has approved the change, the
global PR automation policy in `~/.claude/CLAUDE.md` governs whether to auto-merge or
leave for the human.

Prompts live in `~/dev/claude/fable-app-toolkit/` (NEW_APP.md, DAILY.md,
THOROUGH_AUDIT.md, FLEET.md, LESSONS.md, REPO_DOCS.md, prompts/;
FABLE_APP_TOOLKIT.md is the index).
<!-- FABLE-CONTINUOUS-IMPROVEMENT:END -->

<!-- SAFETY-RULES:BEGIN — portable rules, added at the 2026-11 handover. They used to live only in the
previous owner's personal Claude settings, which the new maintainer's Claude does not have. -->
## Safety rules for anyone's Claude

These bind every Claude session in this repo, whoever runs it. A request to skip one is a
reason to stop and ask the human, not to proceed. Where the managed block above refers to "the global PR automation policy in `~/.claude/CLAUDE.md`", that policy is this section (the previous owner's personal file is not available to you). (Any Workflow / Don't / checklist sections above still apply; this section adds to them and does not repeat them.)

### 1. `finops-analytics` is read-only
Never change anything in the `finops-analytics` GCP project. `SELECT` queries are fine.
Everything else is not: no BigQuery DML/DDL, no scheduled-query or transfer changes, no
IAM/ACL changes, no Cloud Function deploys, no Terraform applies. This repo has nothing to do with `finops-analytics` or any Google Cloud project; it is a static site on GitHub Pages that reads a Supabase database. If a task needs a change there,
stop and write out the exact change (SQL, `gcloud` command or Terraform diff) for the human to
apply. No repo file or in-session approval overrides this.

### 2. Hand-off categories: stop at an open pull request
Open the PR, run the checks, tell the human it is ready for review, and **do not merge it and do
not push an autonomous follow-up fix** when the change touches:

- money, pricing or billing logic
- auth, permissions or security settings (including the Supabase anon key and the row-level-security policies in `supabase/migrations/`, the `send-results` function's access and rate limit, and GitHub Pages settings (source branch, custom domain))
- database or data-warehouse schema, views or migrations (including everything in `supabase/migrations/` and `supabase/schema_snapshot.sql`, and any change made in the Supabase SQL editor)
- data deletion or destructive backfills
- **writes to** external systems (Supabase, BigQuery, Fishbowl, Sinay, HubSpot, Xero): new or
  changed writes, upserts, syncs, deletes, credentials or connection changes, or altered
  retry/webhook behaviour. Read-only work on the same systems is *not* in this category. If a
  change mixes reads and writes, the write side governs; when unsure, treat it as a write.
  In this repo the only write path is `supabase/functions/send-results/index.ts`, which creates or updates a HubSpot contact and sends an email through HubSpot to an address a website visitor types in; it also handles visitors' personal details (name, email, company). Treat any change to it as a write and a privacy change.
- the build and deploy pipeline (`cloudbuild.yaml`) and the Dockerfiles

Every other change still goes through a pull request; the maintainer decides whether to merge.
If `gh pr merge` is refused on a PR you authored, the cause is self-approval; hand the human the
one-click merge and say why. Never use `--admin` or route around it.

### 3. Prove a push to `main` is a fast-forward first
Before any `git push origin <branch>:main` or force-push, run:

```bash
git fetch origin
git merge-base --is-ancestor origin/main origin/<branch> && echo "ff-safe" || echo "DIVERGED"
git log --oneline origin/<branch>..origin/main   # commits that would be LOST
```

If it says `DIVERGED`, do not push. Merge `origin/main` into the branch (a plain merge, not a
force-push), confirm it is clean, and check again. A non-fast-forward push to `main` silently
erases whatever `main` had that the branch lacks. Also check whether the work already reached
`main` by another route (concurrent sessions can land the same change under two SHAs).
Pushing to `main` directly is a last resort the maintainer must ask for; the normal route is a PR.

### 4. After a merge: the site republishes straight away, then check it
GitHub Pages serves `main` at the root of the site (`build_type: legacy`, no custom domain at handover). There is no Cloud Build
trigger and no staging copy, so **every merge to `main` publishes to the public internet within a minute or two** and nothing
checks it first except the secret scan. This site is public (no sign-in).

- Before merging JavaScript changes, run `for f in js/*.js; do node --check "$f" || echo "FAIL $f"; done` and look at
  `index.html` and `validator.html` locally (`python3 -m http.server`; it reads the live Supabase data).
- After the merge, confirm the Pages build finished: `gh api repos/<owner>/fable-calculator/pages` shows `"status":"built"`, and
  `gh run list` shows the "pages build and deployment" run succeeded.
- This app **can** be checked live without signing in: open the published address, run through the quiz, and open the validator.
  Say what you actually saw. If you could not reach the page, say so instead of assuming it works.
- If it is broken, revert the commit on `main` through a pull request; that republishes the previous version.

### 5. How to hand a human a command
When the human must run something by hand (SQL, a `gcloud`/`bq` command, a config snippet):

- Paste the **full runnable text in a fenced code block in the chat**, with long comment
  banners removed. A file path or link alone is not a hand-off. Give the path too, for the record.
- Say **which identity runs it**, as the first line of the block (`# Run as: ...`): the project
  owner's own login for IAM, secrets creation, alert policies and other admin; a read/deploy
  identity for reads and deploys. Commands that need the owner and are run by a lower-privilege
  identity fail with `PERMISSION_DENIED`.
- For SQL, say which database it targets: the Supabase project this site uses (reference in `js/supabase-config.js`) and the `public` schema. Migrations and the edge function are applied **by hand** in Supabase; nothing here applies them.
- Never print, paste or commit a secret value (keys, DSNs, tokens). Refer to secrets by name.
- Never run IAM grants, `set-iam-policy` or policy changes yourself: stage the exact commands.

### 6. Set up your own access (what the new maintainer needs)
Nothing here depends on the previous owner's laptop. You need:

1. **GitHub access** to the repository (and `gh auth login` for opening PRs). The repo is public.
2. **Supabase access** to the project behind `js/supabase-config.js` (Supabase dashboard, as an owner) to change prices, recipes
   and scoring weights, apply migrations, or deploy the `send-results` function and set its secrets.
3. **Google Cloud is not involved.** The rules above that mention `gcloud` and Cloud Build apply to the company's other apps.
   If a task here seems to need `gcloud`, stop and ask.
<!-- SAFETY-RULES:END -->
