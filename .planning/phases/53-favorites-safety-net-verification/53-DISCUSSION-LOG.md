# Phase 53: Favorites Safety Net + Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 53-favorites-safety-net-verification
**Areas discussed:** Filtering approach, Test placement & shape, SAFE-01 verification strategy, Dedup gap (WR-01)
**Mode:** `--auto` (autonomous single-pass; recommended option auto-selected per area, no interactive prompts)

---

## Filtering approach (add vs. verify)

| Option | Description | Selected |
|--------|-------------|----------|
| Verify existing filter + add regression tests | `recover()` step 4 already filters to registry-known IDs; PERT is now unknown post-Phase-52. Treat filter as fixed asset, prove with tests. | ✓ |
| Add/rewrite the unknown-ID filter | Implement new filtering logic in favoritesStore | |

**User's choice (auto):** Verify existing + add regression tests (recommended default)
**Notes:** Codebase scout confirmed `favorites.svelte.ts:52-55` already filters via `valid.has(id)` and preserves order (D-21). Carries forward 52-CONTEXT D-10. Editing `recover()` for SAFE-01/02 is explicitly out of scope.

---

## Test placement & shape

| Option | Description | Selected |
|--------|-------------|----------|
| `favorites.test.ts` (co-located) | Land SAFE-02/03 in the existing favorites suite where T-21 already lives | ✓ |
| New dedicated test file | Separate safety-net test module | |

**User's choice (auto):** favorites.test.ts (recommended default)
**Notes:** SAFE-02 may name `'pert'` literally for documentary value (the real upgrade scenario), unlike the Phase 52 T-21 generic literal (D-11); planner reconciles against the D-19 word-boundary grep gate at write time.

---

## SAFE-01 verification strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Automated unit proof + note browser-level as human/CI | Unit assertion on recover() output is the hard gate; full app-render-clean is a Playwright/human check | ✓ |
| Block phase on full e2e clean-render assertion | Require Playwright to assert no console errors / no missing icons | |

**User's choice (auto):** Automated where feasible + human/CI note (recommended default)
**Notes:** jsdom unit tests can prove the filter; they cannot fully assert browser-level clean render. Avoid blocking on a flaky e2e assertion.

---

## Dedup gap (WR-01 from Phase 52 code review)

| Option | Description | Selected |
|--------|-------------|----------|
| Defer — out of SAFE scope | SAFE is about the unknown `'pert'` ID, not valid-duplicate IDs | ✓ |
| Fix dedup in Phase 53 | Add de-duplication to recover() now | |

**User's choice (auto):** Defer (recommended default)
**Notes:** Captured in CONTEXT.md Deferred Ideas as a favorites-hardening candidate.

## Claude's Discretion

- Exact `describe`/`it` structure and whether to test via mocked-`localStorage` + `favorites.init()` vs. calling `recover()` directly — planner chooses based on existing favorites.test.ts patterns.

## Deferred Ideas

- **WR-01:** `recover()` does not de-duplicate valid duplicate IDs (e.g. `['gir','gir']`) — favorites-hardening candidate for a future phase/backlog.
- **IN-01:** `e2e/desktop-full-nav.spec.ts` clears a non-existent disclaimer key — test-hygiene cleanup, unrelated to favorites safety.
