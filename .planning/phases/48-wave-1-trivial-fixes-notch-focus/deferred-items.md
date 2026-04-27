# Phase 48 — Deferred Items (out of scope)

Logged per SCOPE BOUNDARY rule from gsd-executor: pre-existing failures or
out-of-scope follow-ups discovered during Phase 48 execution that should NOT
be auto-fixed in this phase.

## webkit-iphone Playwright failures in non-migrated specs (31 cases)

**Found during:** Phase 48 / Plan 01 / Task 4 verification (full Playwright run)

**Specs affected** (all `[webkit-iphone]` project):
- `e2e/favorites-nav-a11y.spec.ts` (2 cases)
- `e2e/feeds-a11y.spec.ts` (6 cases)
- `e2e/feeds.spec.ts` (~? cases — see full output)
- `e2e/formula.spec.ts` (1 case)
- `e2e/fortification-a11y.spec.ts` (6 cases)
- `e2e/gir-a11y.spec.ts` (6 cases)
- `e2e/morphine-wean-a11y.spec.ts` (6 cases)
- `e2e/morphine-wean.spec.ts` (2 cases)
- `e2e/pert-a11y.spec.ts` (2 cases)

**Why deferred:**

CONTEXT.md D-21 explicitly states:

> Phase 48 does NOT migrate the existing 6 calculator e2e specs to also run
> under `webkit-iphone` — that's a Phase 47 deferred follow-up.

These specs were authored against the chromium project's defaults (Desktop
Chrome viewport / behavior). Running them under the new `webkit-iphone`
project (added by Phase 47 D-15 — both projects run all e2e specs by default)
surfaces viewport / device assumptions that the specs were never designed to
satisfy.

The Phase 48 plan only requires:
- Existing 99-passing chromium suite remains green ✓ (verified: 128 passing, 0 failed in chromium)
- New webkit-iphone smoke spec from Phase 47 remains green ✓ (verified: webkit-smoke.spec.ts passing)
- New `drawer-no-autofocus.spec.ts` passes under both projects ✓ (12/12 passing)

**Recommended next phase:** Phase 47-followup or a future test-migration
phase. Per D-15: webkit-iphone migration of existing specs is a known
deferred Phase 47 follow-up, not a Phase 48 blocker.

**Status:** NOT FIXED in Phase 48 / Plan 01 (out of scope per D-21).
