# Backlog — fable-calculator

> The ranked open backlog. `/fable-audit` fills it; `/fable-daily` drains it. Item ids are
> stable — done items keep their entry (marked DONE) and the fix is recorded in
> IMPROVEMENT_LOG.md History. Created 2026-08-10 (repo-memory onboarding; toolkit
> `REPO_DOCS.md`).
>
> Every item below was confirmed at `file:line` or against GitHub's own API in this session.
> This is a short list because this repo is in good shape — see IMPROVEMENT_LOG.md for the
> evidence, including two things checked and *cleared* rather than filed.

## Next candidates

Tag key: **safe-for-daily** = mechanical, low blast radius, revertible. **needs-decision** =
touches auth / external integrations / release behaviour — human ruling first, and it also gets
an entry in `docs/decisions/DECISIONS.md`.

### Critical
_(none)_

### High
_(none)_

### Medium

- **[M1] A merge to `main` publishes to the public internet past no check at all.** Confirmed
  from GitHub's API, not inferred: `gh api repos/jidavis-qld/fable-calculator/pages` returns
  `build_type: "legacy"`, `source: {branch: "main", path: "/"}`, `public: true`. Legacy Pages
  serves the branch directly, so there is no workflow between merge and live. And there is
  nothing to gate with: no tests, no `package.json`, no linter, and
  `.github/workflows/` holds only `gitleaks.yml`. **Impact:** the nine JS files load as classic
  scripts in an order `README.md` documents as load-bearing (`country.js` before `data.js`,
  `supabase-config.js` before `data.js`). A syntax error or a broken rename in any of them takes
  the calculator down for every visitor the moment it merges — no build failure, no red CI, and
  no prior revision to roll back to, because Pages serves whatever `main` says. This is Fable's
  only publicly reachable app of the six onboarded 2026-08-10. **Fix:** a pull-request job
  running `for f in js/*.js; do node --check "$f" || exit 1; done`. All ten files pass today
  (2026-08-10), so it goes green immediately and only ever fails on a real regression. A test
  framework is the bigger conversation; this is the floor. **safe-for-daily.**

### Low

- **[L1] The email success message writes a user-typed address into `innerHTML` unescaped.**
  Confirmed. `js/email.js:111-118` replaces the modal's contents with a template literal and
  `:115` embeds `${email}` as markup. The value comes from `#email-address` (`:24`) and the only
  validation is `email.includes('@')` (`:32`), so `x@<img src=x onerror=…>` renders as HTML.
  **Impact — deliberately not overstated: this is self-XSS only.** No URL parameter reaches it,
  nothing is persisted and re-served to another visitor, and the payload is typed by the same
  person who sees it. Recorded because it is a confirmed unescaped-user-input-into-`innerHTML`
  on a public page and the fix is three lines: build the success block with `textContent` for
  the address, or reuse the `escapeHtml` helper pattern from
  `fable-homepage/main.js:52-59`. **safe-for-daily.**

- **[L2] `CLAUDE.md` contains no information about this repo.** Confirmed: the file is the
  single heading `# fable-calculator` followed immediately by the managed
  continuous-improvement block. No stack, no deploy, no conventions, no pointer to `README.md`.
  **Impact:** the three things a session most needs before touching this repo are all missing
  from the file it reads first — that a merge is a publish (M1), that the Supabase anon key at
  `js/supabase-config.js:18` is intentional and must not be "fixed", and that prices and
  scoring weights live in Supabase rather than git, so an output can change with no commit.
  `README.md` is excellent and covers the app itself, so the fix is a short Stack/Deploy section
  plus a pointer, not new prose. **safe-for-daily.**
