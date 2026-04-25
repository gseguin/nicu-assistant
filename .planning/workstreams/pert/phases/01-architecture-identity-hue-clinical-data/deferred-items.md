# Phase 1 — Deferred Items

Out-of-scope failures discovered during plan execution. Tracked here so they
are not lost; not fixed inside the plan that surfaced them.

## Status: ALL RESOLVED — closed by Plan 01-04

The three pre-existing Playwright failures previously logged here were
absorbed by Plan 01-04 as Rule-1 deviations (orchestrator-authorized) and
are all passing on the post-01-04 baseline. Plan 01-05 (clinical-gate
verification) re-confirmed the resolution: full Playwright suite reports
**103 passed + 3 skipped (PWA prod-build only) + 0 failed** on HEAD =
d9486ec.

### Resolution audit

| Spec | Test | Status | Closed by |
|------|------|--------|-----------|
| `e2e/favorites-nav.spec.ts:69` | `Favorites nav — mobile (375x667) › FAV-TEST-03-2` | RESOLVED | Plan 01-04 (re-baselined to alphabetical registry order, citing D-19/D-20/D-21) |
| `e2e/favorites-nav.spec.ts:69` | `Favorites nav — desktop (1280x800) › FAV-TEST-03-2` | RESOLVED | Plan 01-04 (parameterized variant of the above) |
| `e2e/navigation.spec.ts:28` | `Navigation (v1.2 restructure) › mobile bottom nav has only calculator tabs filling full width` | RESOLVED | Plan 01-04 (re-baselined `toContainText` assertions to alphabetical order) |

No outstanding deferred items remain for Phase 1.

---

## Historical context (preserved for traceability)

### Pre-existing Playwright failures on Plan 01-01 baseline (HEAD = 34d64d6)

Discovered while running the full Playwright suite as a sanity check during
Plan 01-02 execution. These three tests failed on the unmodified baseline
(verified by stashing 01-02 changes and re-running) — they were residue
from the Wave-0 registry alphabetization that landed in 01-01 but were not
captured in 01-01's verification gate (which used `pnpm test` / vitest, not
Playwright).

| Spec | Test | Cause |
|------|------|-------|
| `e2e/favorites-nav.spec.ts:69` | `Favorites nav — mobile (375x667) › FAV-TEST-03-2: re-favorite Feeds → bar shows 4 tabs in registry order` | Test asserted the v1.13 registry order; needed alphabetical update post-01-01. |
| `e2e/favorites-nav.spec.ts:69` | `Favorites nav — desktop (1280x800) › FAV-TEST-03-2: re-favorite Feeds → bar shows 4 tabs in registry order` | Same as above (parameterized desktop variant). |
| `e2e/navigation.spec.ts:28` | `Navigation (v1.2 restructure) › mobile bottom nav has only calculator tabs filling full width` | Tab-count + tab-order expectation tied to pre-alphabetization registry. |

**Original out-of-scope rationale:** Plan 01-02's `files_modified` list was
restricted to `src/app.css` and the axe spec; touching navigation/favorites
Playwright specs would have breached the workstream constraint. The
orchestrator brief for Plan 01-04 then explicitly authorized re-baselining
these three tests as Rule-1 deviations alongside the route-shell landing,
which is what closed them.
