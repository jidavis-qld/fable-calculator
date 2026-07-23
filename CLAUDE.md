# fable-calculator

<!-- FABLE-CONTINUOUS-IMPROVEMENT:BEGIN (managed — edit the toolkit, not this copy) -->
## Continuous Improvement

This repo is under continuous improvement. Its quality is tracked in `IMPROVEMENT_LOG.md`
(repo root) — the shared memory of what's been fixed, what's queued, and what was
deliberately left alone. **Do not delete it.** It also carries the **App profile**: this
app's risk surfaces, key outputs + how to independently re-derive them, invariants,
working verification commands, sharp edges, and **owed live checks** (verifications a
prior run couldn't complete — always settle these first).

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

Prompts live in `~/Documents/GitHub/claude/fable-app-toolkit/` (NEW_APP.md, DAILY.md,
THOROUGH_AUDIT.md, FLEET.md, LESSONS.md; FABLE_APP_TOOLKIT.md is the index).
<!-- FABLE-CONTINUOUS-IMPROVEMENT:END -->
