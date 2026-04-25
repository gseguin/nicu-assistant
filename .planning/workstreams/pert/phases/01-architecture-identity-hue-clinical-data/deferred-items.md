# Phase 1 — Deferred Items

Out-of-scope failures discovered during plan execution. Tracked here so they
are not lost; not fixed inside the plan that surfaced them.

## Pre-existing Playwright failures on Plan 01-01 baseline (HEAD = 34d64d6)

Discovered while running the full Playwright suite as a sanity check during
Plan 01-02 execution. These three tests fail on the unmodified baseline
(verified by stashing 01-02 changes and re-running) — they are residue from
the Wave-0 registry alphabetization that landed in 01-01 but were not
captured in 01-01's verification gate (which used `pnpm test` / vitest, not
Playwright).

| Spec | Test | Likely cause |
|------|------|--------------|
| `e2e/favorites-nav.spec.ts:69` | `Favorites nav — mobile (375x667) › FAV-TEST-03-2: re-favorite Feeds → bar shows 4 tabs in registry order` | Test asserts the v1.13 registry order; needs alphabetical update post-01-01. |
| `e2e/favorites-nav.spec.ts:69` | `Favorites nav — desktop (1280x800) › FAV-TEST-03-2: re-favorite Feeds → bar shows 4 tabs in registry order` | Same as above (parameterized desktop variant). |
| `e2e/navigation.spec.ts:28` | `Navigation (v1.2 restructure) › mobile bottom nav has only calculator tabs filling full width` | Likely tab-count expectation tied to pre-alphabetization registry. |

**Out-of-scope rationale:** Plan 01-02's `files_modified` list is restricted
to `src/app.css` and the axe spec; touching navigation/favorites Playwright
specs would breach the workstream constraint. These are leftover Wave-0
test debt and should be picked up by either:

- A targeted follow-up to Plan 01-01 (analogous to that plan's Rule-1
  deviation that fixed `NavShell.test.ts` / `HamburgerMenu.test.ts` vitest
  specs but did not run Playwright), or
- Plan 01-04, which already touches navigation surfaces and can naturally
  re-baseline these e2e specs alongside the route shell landing.
