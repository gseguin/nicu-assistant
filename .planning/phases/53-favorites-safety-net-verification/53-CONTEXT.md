# Phase 53: Favorites Safety Net + Verification - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Guarantee that a user who upgraded from v1.15+ with `'pert'` in their `localStorage` favorites array experiences zero disruption after the Phase 52 PERT purge: the now-unknown ID is silently filtered out, the app loads cleanly, no console errors, no missing-icon placeholders.

**This phase is verification + regression-test work, NOT new filtering logic.** The unknown-ID filter already exists in `src/lib/shared/favorites.svelte.ts` (`recover()` step 4, lines 52–55) and has handled this exact upgrade scenario by design since v1.13 (D-08/D-21). Phase 52 removing `'pert'` from `CALCULATOR_REGISTRY` is what makes `'pert'` an "unknown" ID — so the existing filter now drops it automatically. The job here is to PROVE that behavior with tests and lock it against regression, not to add or rewrite the filter.

Scope anchor: SAFE-01 (clean upgrade load), SAFE-02 (unit test of the `['morphine-wean','formula','pert','gir'] → ['morphine-wean','formula','gir']` upgrade path), SAFE-03 (first-run-defaults regression guard that defaults never contain `'pert'`).

</domain>

<decisions>
## Implementation Decisions

### Filtering approach (verify, don't add)
- **D-01:** Do NOT add or modify the unknown-ID filter. `recover()` in `src/lib/shared/favorites.svelte.ts:36-59` already filters stored IDs to registry-known strings (`valid.has(id)`, step 4) and preserves the user's stored order verbatim (step 6, D-21). Carries forward 52-CONTEXT D-10. The planner must treat the filter as a fixed, pre-existing asset and write tests against it — any task that proposes editing `recover()` for SAFE-01/02 is out of scope.
- **D-02:** `'pert'` becomes an unknown ID purely as a consequence of Phase 52 dropping it from `CALCULATOR_REGISTRY` (which feeds `validIds()`). No PERT-specific code path is needed or wanted — the filter is feature-agnostic.

### Test placement & shape
- **D-03:** SAFE-02 and SAFE-03 tests live in `src/lib/shared/favorites.test.ts`, co-located with the existing favorites suite (where the Phase 52 T-21 regression test was already added). Do not create a new test file.
- **D-04:** SAFE-02 may assert the literal upgrade path with `'pert'` specifically (the requirement names it) — this is acceptable here even though the Phase 52 T-21 test deliberately used a generic `'unknown-calculator-id'` literal (D-11). Rationale: SAFE-02 is documenting the *real historical upgrade scenario* (v1.15 users had `'pert'` favorited), so naming `'pert'` makes the regression's intent legible. The grep gate (D-19, word-boundary) is scoped to exclude test-intent strings only if needed; prefer keeping `'pert'` in this one assertion for documentary value, but if the grep gate flags it, fall back to a comment-annotated constant. The planner decides at write time based on whether the D-19 gate excludes `*.test.ts`.
- **D-05:** SAFE-03 asserts `defaultIds()` (or the first-run defaults array) does not include `'pert'` and matches the v1.13 baseline intent `['morphine-wean','formula','gir','feeds']`. Note: `defaultIds()` recomputes from `CALCULATOR_REGISTRY.slice(0, FAVORITES_MAX)` (D-09), so this is a regression guard documenting that registry order yields the expected defaults — not a hardcoded-array change.

### SAFE-01 verification strategy
- **D-06:** SAFE-01's "loads cleanly / no console errors / no missing-icon placeholders" criterion is verified at two levels: (a) **automated unit assertion** on `recover()` output proves the unknown ID is filtered (this is the load-bearing proof and the meaningful test); (b) the full browser-level "renders clean across bottom-bar / hamburger / desktop nav with no console errors or missing icons" is a **Playwright/human-observable gate**, not something a jsdom unit test can fully assert. The planner should land the unit proof as the hard gate and document the browser-level check as a CI/human verification item rather than blocking the phase on a flaky e2e assertion.

### Claude's Discretion
- Exact test naming, `describe`/`it` block structure, and whether to assert via `favorites.init()` + mocked `localStorage` vs. calling `recover()` directly — planner/researcher choose based on the existing favorites.test.ts patterns. Mocked-localStorage + `init()` is closer to the real upgrade path; direct `recover()` is simpler. Either satisfies SAFE-02.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & roadmap
- `.planning/ROADMAP.md` §"Phase 53: Favorites Safety Net + Verification" — goal + 3 explicit Success Criteria (the de-facto spec for this phase)
- `.planning/REQUIREMENTS.md` — SAFE-01, SAFE-02, SAFE-03 acceptance text

### Prior-phase locked decisions (carry forward)
- `.planning/phases/52-code-purge-test-suite-repair/52-CONTEXT.md` §"Favorites Migration (Upgrade Safety)" — D-10 (keep filter as-is), D-11 (generic literal in T-21 test), D-19 (word-boundary grep gate), D-21 (preserve stored order)
- `.planning/phases/52-code-purge-test-suite-repair/52-REVIEW.md` — WR-01 (recover() does not dedup *valid* duplicate IDs) and IN-01 (desktop-full-nav.spec.ts clears a non-existent disclaimer key) — informational; see Deferred Ideas

### Implementation surface
- `src/lib/shared/favorites.svelte.ts` — the favorites store; `recover()` is the unknown-ID filter under test (DO NOT edit for this phase)
- `src/lib/shared/favorites.test.ts` — existing favorites test suite; SAFE-02/03 tests land here
- `src/lib/shell/registry.ts` — `CALCULATOR_REGISTRY`, the single source of truth feeding `validIds()` and `defaultIds()`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `recover(raw)` (favorites.svelte.ts:36): six-step recovery pipeline. Step 4 filters to registry-known IDs; step 6 preserves order. This IS the SAFE-01/02 behavior — already implemented, just needs test coverage.
- `defaultIds()` (favorites.svelte.ts:17): recomputes defaults from `CALCULATOR_REGISTRY.slice(0, FAVORITES_MAX)`. PERT no longer in registry ⇒ never in defaults. This IS the SAFE-03 behavior.
- `favorites.init()` (favorites.svelte.ts:112): reads localStorage, calls `recover()`, seeds defaults on first run. The realistic entry point for an upgrade-path test using a mocked `localStorage`.

### Established Patterns
- favorites store mirrors `theme.svelte.ts` / `disclaimer.svelte.ts` (module-scope `$state` + getter + `init()`). Tests should follow the existing favorites.test.ts style.
- Phase 47 test scaffolding (visualViewport polyfill, jsdom setup) is already in place; SAFE tests are plain vitest unit tests needing only a `localStorage` mock (jsdom provides one).

### Integration Points
- localStorage key `nicu:favorites` (schema `{v:1, ids:string[]}`) — the upgrade artifact a v1.15 user carries. SAFE-02 seeds this with `'pert'` present and asserts the recovered array.
- `validIds()` derives from `CALCULATOR_REGISTRY`; the Phase 52 registry edit (5 entries, no pertModule) is the upstream cause that makes `'pert'` filterable. SAFE depends on Phase 52 (already complete).

</code_context>

<specifics>
## Specific Ideas

- SAFE-02 exact fixture (from ROADMAP Success Criterion 2): `localStorage` `nicu:favorites = {v:1, ids:['morphine-wean','formula','pert','gir']}` must resolve to `favorites.current === ['morphine-wean','formula','gir']` — PERT dropped, order preserved. The test must fail meaningfully if the filter is removed.
- SAFE-03 baseline (from Success Criterion 3): first-run defaults stay the v1.13 baseline `['morphine-wean','formula','gir','feeds']`.

</specifics>

<deferred>
## Deferred Ideas

- **WR-01 — `recover()` does not de-duplicate *valid* duplicate IDs.** A stored array like `['gir','gir']` would survive the filter and corrupt `count`/`isFull`/nav rendering. This is a real hardening gap surfaced by the Phase 52 code review, but it is OUT OF SCOPE for Phase 53: SAFE is specifically about silently dropping the *unknown* `'pert'` ID, not about duplicate valid IDs. Capture as a favorites-hardening candidate for a future phase or backlog item — do not fold into Phase 53.
- **IN-01 — `e2e/desktop-full-nav.spec.ts` clears a non-existent disclaimer key** (`nicu:disclaimer-accepted`; real keys are `nicu_assistant_disclaimer_v1/v2`). Pre-existing cross-spec inconsistency, unrelated to favorites safety. Note for a test-hygiene cleanup, not Phase 53.

</deferred>

---

*Phase: 53-favorites-safety-net-verification*
*Context gathered: 2026-05-23*
