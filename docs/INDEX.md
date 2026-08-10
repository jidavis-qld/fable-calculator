# Docs index — fable-calculator

> The front door. Every doc in this repo gets a row here with a status:
> **ACTIVE** (current, act on it) · **REFERENCE** (still-true background) · **ARCHIVED**
> (historical). If it is not in this index, it is lost. Maintained in the same commit as any
> `docs/` change (toolkit `REPO_DOCS.md`).

| Doc | Status | What it is |
|---|---|---|
| [`../IMPROVEMENT_LOG.md`](../IMPROVEMENT_LOG.md) | ACTIVE | Health score, App profile (surfaces, invariants, verification commands, sharp edges, owed live checks), Won't-do, and History. The shared memory — read it first. |
| [`backlog/BACKLOG.md`](backlog/BACKLOG.md) | ACTIVE | The ranked open backlog. `/fable-audit` fills it, `/fable-daily` drains it. |
| [`decisions/DECISIONS.md`](decisions/DECISIONS.md) | ACTIVE | Open questions waiting on Ji, and rulings already made — including two standing rulings (the anon key, and `validator.html` being public) that exist to stop them being re-raised. |
| [`../README.md`](../README.md) | ACTIVE | The best doc in the repo: file structure, the load-bearing JS load order, the five Supabase tables, all four countries' currency/price-unit/label systems, and the per-country health-claim thresholds. Read it before touching `js/`. |
| [`../SCORING_RULES.md`](../SCORING_RULES.md) | REFERENCE | The scoring engine in plain English — candidate pool, normalisation, nutrition composite, priority weights, balance adjustments. The companion to `js/engine.js`. |
| [`../STYLE_GUIDE.md`](../STYLE_GUIDE.md) | REFERENCE | Brand and UI conventions for the quiz and results pages. |
| [`../CLAUDE.md`](../CLAUDE.md) | ACTIVE | **Currently carries no repo-specific content** — one heading plus the managed continuous-improvement block. See BACKLOG [L2]. |
| [`../supabase/schema_snapshot.sql`](../supabase/schema_snapshot.sql) | REFERENCE | Point-in-time snapshot of the public schema, committed for reproducibility (`f66dadb`). Not applied by anything — the live schema is authoritative. |
| [`../supabase/migrations/`](../supabase/migrations/) | REFERENCE | Four migrations (multi-country, EU, AU, security fixes). **Applied by hand in the Supabase SQL editor** — nothing in CI runs them, and `20260310_security_fixes.sql` says so in its header. |

Not created yet (create when there is content, not ceremonially): `prompts/`, `runbooks/`,
`reference/`, `programs/`, `archive/`.
