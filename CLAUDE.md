# fable-calculator

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
