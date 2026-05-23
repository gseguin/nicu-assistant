# Phase 53: Favorites Safety Net + Verification — Research

**Researched:** 2026-05-23
**Domain:** Vitest unit testing of a Svelte 5 module-scope `$state` store; upgrade-path regression coverage
**Confidence:** HIGH — all claims verified directly against live source files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Do NOT add or modify the unknown-ID filter. `recover()` in `src/lib/shared/favorites.svelte.ts:36-59` already filters stored IDs to registry-known strings (`valid.has(id)`, step 4) and preserves the user's stored order verbatim (step 6, D-21). The planner must treat the filter as a fixed, pre-existing asset and write tests against it — any task that proposes editing `recover()` for SAFE-01/02 is out of scope.
- **D-02:** `'pert'` becomes an unknown ID purely as a consequence of Phase 52 dropping it from `CALCULATOR_REGISTRY`. No PERT-specific code path is needed or wanted.
- **D-03:** SAFE-02 and SAFE-03 tests live in `src/lib/shared/favorites.test.ts`, co-located with the existing favorites suite. Do not create a new test file.
- **D-04:** SAFE-02 may assert the literal upgrade path with `'pert'` specifically — acceptable for documentary value. If the D-19 grep gate flags it, fall back to a comment-annotated constant. The planner decides at write time based on whether the D-19 gate excludes `*.test.ts`.
- **D-05:** SAFE-03 asserts `defaultIds()` (or first-run defaults array) does not include `'pert'` and matches the v1.13 baseline intent. Note: `defaultIds()` recomputes from `CALCULATOR_REGISTRY.slice(0, FAVORITES_MAX)` — this is a regression guard, not a hardcoded-array change.
- **D-06:** SAFE-01's "loads cleanly / no console errors / no missing-icon placeholders" criterion is verified at two levels: (a) automated unit assertion on `recover()` output is the hard gate; (b) browser-level rendering is a Playwright/human-observable gate, not a jsdom unit test. Unit proof is the blocking test; browser check is a CI/human verification item.

### Claude's Discretion

- Exact test naming, `describe`/`it` block structure, and whether to assert via `favorites.init()` + mocked `localStorage` vs. calling `recover()` directly — planner/researcher choose based on the existing favorites.test.ts patterns. Mocked-localStorage + `init()` is closer to the real upgrade path; direct `recover()` is simpler. Either satisfies SAFE-02.

### Deferred Ideas (OUT OF SCOPE)

- **WR-01:** `recover()` does not de-duplicate valid duplicate IDs. A stored `['gir','gir']` would survive the filter and corrupt `count`/`isFull`/nav rendering. Real hardening gap, but OUT OF SCOPE for Phase 53. Capture as favorites-hardening candidate for a future phase.
- **IN-01:** `e2e/desktop-full-nav.spec.ts` clears a non-existent disclaimer key (`nicu:disclaimer-accepted`; real keys are `nicu_assistant_disclaimer_v1/v2`). Unrelated pre-existing cross-spec inconsistency. Note for test-hygiene cleanup, not Phase 53.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAFE-01 | A user whose localStorage contained `'pert'` in their favorites (from v1.15+) loads the app cleanly after the upgrade — `favoritesStore` filters the unknown ID out silently; bottom-bar / hamburger / desktop nav render with only valid IDs; no crash, no console error, no missing-icon placeholder | The filter already exists at `recover()` step 4 (`valid.has(id)`) — verified in live source. Unit test proves the filter; browser-level check documented as manual/Playwright gate per D-06. |
| SAFE-02 | Unit test: load `['morphine-wean','formula','pert','gir']` from localStorage → assert `favorites.current === ['morphine-wean','formula','gir']`; fails meaningfully if filter is removed | The `vi.resetModules()` + dynamic import pattern already in suite handles module-scope `$state` reset. The exact localStorage seed pattern is established in T-07/T-21. |
| SAFE-03 | First-run defaults do not include `'pert'` — regression guard; defaults stay the v1.13 baseline `['morphine-wean','formula','gir','feeds']` | `defaultIds()` derives from `CALCULATOR_REGISTRY.slice(0, FAVORITES_MAX)`; registry has 5 entries (no pert), alphabetical, first 4 = `['feeds','formula','gir','morphine-wean']`. Existing T-01/T-20 already assert this exact array. See ordering note below. |

</phase_requirements>

---

## Summary

Phase 53 is a pure test-authoring phase. No implementation code changes. The unknown-ID filter under test already exists and is already working — Phase 52 completing (PERT removed from `CALCULATOR_REGISTRY`) automatically made `'pert'` an unknown ID that `recover()`'s step 4 (`valid.has(id)`) will drop.

The research confirms:
1. The filter is live and correct in `src/lib/shared/favorites.svelte.ts` lines 52-55.
2. `CALCULATOR_REGISTRY` has 5 entries, no `'pert'`, alphabetical order: `['feeds','formula','gir','morphine-wean','uac-uvc']`.
3. `defaultIds()` produces `['feeds','formula','gir','morphine-wean']` — NOT `['morphine-wean','formula','gir','feeds']`.
4. The existing test suite (`favorites.test.ts`) establishes a precise, repeatable idiom: `vi.resetModules()` in `beforeEach`, then `await import('./favorites.svelte.js')` in each test for a fresh module state.
5. Two existing tests (T-07, T-21) already cover the generic unknown-ID filter — SAFE-02 adds the historically specific `'pert'` upgrade path and SAFE-03 adds the first-run no-pert regression guard.

**Primary recommendation:** Add two test cases to `favorites.test.ts` following the T-21 pattern exactly. No code changes required. The phase is ~15 lines of new test code total.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Unknown-ID filtering | Module store (`favorites.svelte.ts`) | — | `recover()` is the single gate; runs at `init()` call time before any UI renders |
| First-run defaults | Module store (`favorites.svelte.ts`) | Registry (`registry.ts`) | `defaultIds()` delegates to `CALCULATOR_REGISTRY` — registry is the source of truth |
| Regression test coverage | Test file (`favorites.test.ts`) | — | Co-located unit tests, no UI layer needed for this assertion |
| Browser-level verification (SAFE-01b) | Playwright / human gate | — | jsdom cannot assert "no missing-icon placeholder" — this is a visual/DOM-rendering concern |

---

## The Filter: Exact Code Verified [VERIFIED: live source]

**File:** `src/lib/shared/favorites.svelte.ts`

```typescript
// Lines 52-58 (verified 2026-05-23)
const valid = validIds();                                         // Set of registry IDs
const filtered = (parsed as StoredShape).ids
    .filter((id): id is string => typeof id === 'string' && valid.has(id))  // step 4
    .slice(0, FAVORITES_MAX);                                     // step 5
if (filtered.length === 0) return defaultIds();                   // step 6a
// D-21: preserve user's stored order verbatim. Only filter+cap remain.
return filtered as CalculatorId[];                                // step 6b
```

`validIds()` returns `new Set(CALCULATOR_REGISTRY.map((c) => c.id))`. With the Phase 52 registry (5 entries, no `'pert'`), `valid.has('pert')` is `false`. The filter drops `'pert'` exactly as required by SAFE-01/02. [VERIFIED: live source read]

---

## The Registry: Exact State Verified [VERIFIED: live source]

**File:** `src/lib/shell/registry.ts`

```typescript
export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  feedsModule,       // id: 'feeds'
  fortificationModule, // id: 'formula'
  girModule,         // id: 'gir'
  morphineModule,    // id: 'morphine-wean'
  uacUvcModule       // id: 'uac-uvc'
];
```

5 entries, no `pertModule` import, no `'pert'` ID. [VERIFIED: live source read + confirmed via `grep -rn "id:" src/lib/{feeds,fortification,gir,morphine,uac-uvc}/calculator.ts`]

---

## Critical Ordering Note for SAFE-03 [VERIFIED]

The ROADMAP Success Criterion 3 and CONTEXT.md D-05 both reference the "v1.13 baseline `['morphine-wean','formula','gir','feeds']`". This is the **historical ordering** from before D-19 (registry alphabetization). The **current actual defaults** are:

```
['feeds', 'formula', 'gir', 'morphine-wean']
```

This is confirmed by:
- `defaultIds()` → `CALCULATOR_REGISTRY.slice(0,4)` → `['feeds','formula','gir','morphine-wean']`
- Existing tests T-01, T-03, T-04, T-05, T-06, T-09, T-18, T-20 ALL assert `['feeds','formula','gir','morphine-wean']`

**The ROADMAP wording "v1.13 baseline" means "same 4 IDs, no pert" — it is NOT a literal order assertion.** SAFE-03 MUST assert `['feeds', 'formula', 'gir', 'morphine-wean']` to match the live codebase, NOT the historical v1.13 ordering. Asserting `['morphine-wean','formula','gir','feeds']` would be a test bug — it would fail on every run.

---

## The Test Idiom: Exact Pattern from Existing Suite [VERIFIED: live source]

The established pattern for all tests in `favorites.test.ts`:

### Module Reset Pattern
```typescript
describe('favorites store', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.resetModules(); // fresh module state per test
    });

    it('T-XX description', async () => {
        // 1. Seed localStorage BEFORE import (module reads it on first import)
        localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: [...] }));
        
        // 2. Dynamic import — gets fresh module instance with fresh $state
        const { favorites } = await import('./favorites.svelte.js');
        
        // 3. Call init() — reads localStorage, calls recover(), sets _ids
        favorites.init();
        
        // 4. Assert (spread to plain array for deep equality)
        expect([...favorites.current]).toEqual([...]);
    });
});
```

**Why `vi.resetModules()`:** `favorites.svelte.ts` has module-scope `$state` (`let _ids = $state<CalculatorId[]>(defaultIds())`). Without module reset, state leaks between tests. `vi.resetModules()` + dynamic import is the established Svelte 5 singleton test pattern — used identically in `disclaimer` and `theme` store tests per the comment at line 6.

**Why spread `[...favorites.current]`:** `favorites.current` returns `readonly CalculatorId[]`. Vitest's `toEqual` works on the spread copy; this is the pattern used throughout the existing suite (T-01, T-07, T-10, T-11, etc.).

**Why seed localStorage BEFORE import:** The module initializes `_ids = $state<CalculatorId[]>(defaultIds())` at module scope on first import, but `init()` is what reads localStorage. Order is: `localStorage.setItem` → `import` → `favorites.init()`. The import order does not matter for the localStorage read (init() does the read), but the module reset must happen before import.

---

## T-21: The Closest Existing Test (Use as Template) [VERIFIED: live source]

```typescript
describe('T-21 — unknown-calculator-id forward compatibility regression', () => {
    it('T-21: unknown id (e.g. a removed calculator) is silently filtered, preserving order of valid ids', async () => {
        localStorage.setItem(
            'nicu:favorites',
            JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'unknown-calculator-id', 'gir'] })
        );
        vi.resetModules();
        const { favorites } = await import('./favorites.svelte.js');
        favorites.init();
        expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir']);
    });
});
```

SAFE-02 is structurally identical to T-21, replacing `'unknown-calculator-id'` with `'pert'`. The planner should use this as a direct template.

**Note on T-21 describe structure:** T-21 is in its own top-level `describe` block (not nested inside the main `'favorites store'` describe). T-20 is also its own top-level block. This pattern — named regression guards in their own `describe` blocks — is available to the planner for SAFE-02 and SAFE-03.

---

## SAFE-02: Recommended Implementation

```typescript
describe('SAFE-02 — pert upgrade path regression (v1.15+ users)', () => {
    it('SAFE-02: stored favorites containing pert silently drops it, preserving valid-id order', async () => {
        // D-04 (53-CONTEXT): using 'pert' literal here is intentional —
        // this documents the real historical upgrade scenario (v1.15 users had 'pert' favorited).
        localStorage.setItem(
            'nicu:favorites',
            JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'pert', 'gir'] })
        );
        vi.resetModules();
        const { favorites } = await import('./favorites.svelte.js');
        favorites.init();
        // 'pert' silently dropped; order of remaining valid IDs preserved (D-21)
        expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir']);
    });
});
```

**Meaningful failure mode:** If `recover()` step 4 filter is removed, `'pert'` would remain in the output (as a string) and the test would fail with `received: ['morphine-wean', 'formula', 'pert', 'gir']` vs `expected: ['morphine-wean', 'formula', 'gir']`. Failure is immediately legible.

---

## SAFE-03: Recommended Implementation

```typescript
describe('SAFE-03 — first-run defaults never contain pert (regression guard)', () => {
    it('SAFE-03: first-run defaults are the v1.13 four-calculator baseline with no pert', async () => {
        vi.resetModules();
        const { favorites } = await import('./favorites.svelte.js');
        // No localStorage seed — first-run scenario
        favorites.init();
        expect(favorites.current).not.toContain('pert');
        // Assert full default array (regression guard: documents expected baseline,
        // not just absence of 'pert')
        expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
    });
});
```

**Why both assertions:** `not.toContain('pert')` is the named SAFE-03 requirement. The full `toEqual` assertion documents the complete baseline and catches future registry reorderings that would silently change defaults. Either assertion alone satisfies SAFE-03; both together make the test a stronger regression guard.

**Why `['feeds','formula','gir','morphine-wean']` not `['morphine-wean','formula','gir','feeds']`:** See Critical Ordering Note above. The live registry is alphabetical (D-19 invariant); T-01/T-20 already assert this exact array.

---

## D-19 Grep Gate Analysis [VERIFIED: live git grep]

Running `git grep -niwE 'pert|PERT' -- ':(exclude).planning/'` on the current codebase returns:

```
CLAUDE.md: (historical PERT reference in project description)
PRODUCT.md: (historical PERT reference in product description)
```

There are already non-test hits in doc files. The gate is not clean-to-zero currently — `CLAUDE.md` and `PRODUCT.md` both contain `'PERT'` in historical project context.

**Implication for D-04:** The D-19 gate does NOT exclude `*.test.ts` files from the word-boundary scan. Adding `'pert'` as a string literal in `favorites.test.ts` WILL be caught by the gate. However, the gate already has hits in `CLAUDE.md`/`PRODUCT.md`, so adding it to `favorites.test.ts` does not make the gate "more dirty" — it is already non-zero.

**Planner decision (D-04 resolution):** Since the gate is already non-zero from doc files, using `'pert'` in the SAFE-02 test is acceptable for Phase 53 documentary value. If a future phase cleans the gate to zero, that phase will need to decide whether to keep `'pert'` in `favorites.test.ts` or convert it to a comment-annotated constant. Document this in the test comment.

---

## SAFE-01 Verification Strategy (D-06 Two-Level Split)

### Level A: Unit assertion (hard gate, automated)
SAFE-02 IS the unit proof for SAFE-01. Loading `['morphine-wean','formula','pert','gir']` and getting back `['morphine-wean','formula','gir']` proves the filter runs. This is the blocking automated gate.

### Level B: Browser-level check (soft gate, manual/Playwright)
The requirement says "bottom-bar / hamburger menu / desktop nav render with only valid IDs; no crash, no console error, no missing-icon placeholder." jsdom cannot assert visual rendering. The planner should document this as:
- A developer manually runs the app with `localStorage nicu:favorites = {v:1, ids:['morphine-wean','formula','pert','gir']}` pre-seeded and observes clean load.
- OR: an existing Playwright spec that runs `favorites.init()` in a real browser context could be extended — but D-06 explicitly says this is NOT a blocking hard gate.
- The PLAN should include a verification task noting this manual/observational check.

---

## Architecture Patterns

### File Structure (no changes needed)
```
src/lib/shared/
├── favorites.svelte.ts     # DO NOT EDIT — filter already exists
├── favorites.test.ts       # ADD SAFE-02, SAFE-03 test blocks here
└── types.ts                # DO NOT EDIT
src/lib/shell/
└── registry.ts             # DO NOT EDIT — Phase 52 complete
```

### Test Block Placement
The two new test blocks (SAFE-02, SAFE-03) should be appended after the existing T-21 block. Each gets its own top-level `describe` block following the T-20/T-21 pattern, not nested inside the main `'favorites store'` describe.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Module-scope $state reset between tests | Custom state-reset helper | `vi.resetModules()` + `await import(...)` — already established pattern |
| localStorage seeding | Custom mock setup | jsdom's built-in localStorage (already works; `localStorage.clear()` in beforeEach) |
| Registry state mocking | Mock the registry module | Don't — import the real registry (Phase 52 already made it correct) |

**Key insight:** The test environment (jsdom + vitest) already provides everything needed. The existing suite pattern handles all edge cases. Don't introduce mocking complexity that isn't there already.

---

## Common Pitfalls

### Pitfall 1: Asserting the historical ordering for SAFE-03
**What goes wrong:** Writing `toEqual(['morphine-wean', 'formula', 'gir', 'feeds'])` based on ROADMAP/CONTEXT "v1.13 baseline" language. The test will fail on every run.
**Why it happens:** ROADMAP Success Criterion 3 describes the v1.13 baseline conceptually (same 4 IDs). The actual ordering changed to alphabetical with D-19 registry alphabetization.
**How to avoid:** Assert `['feeds', 'formula', 'gir', 'morphine-wean']` — matching T-01/T-20.
**Warning signs:** Test fails immediately on first run with "received: ['feeds', 'formula', 'gir', 'morphine-wean']".

### Pitfall 2: Forgetting `vi.resetModules()` before import
**What goes wrong:** Module-scope `$state` (`_ids`, `_initialized`) bleeds from a previous test. The test may pass by accident (previous test left state in the expected shape) or fail with wrong state.
**Why it happens:** `$state` at module scope is a singleton. Without `resetModules()`, the same instance persists across tests.
**How to avoid:** The `beforeEach` block already contains `vi.resetModules()`. For standalone `describe` blocks (T-20, T-21 pattern), call `vi.resetModules()` explicitly inside the test before the `await import(...)`.
**Warning signs:** Tests pass in isolation but fail when run in sequence.

### Pitfall 3: Seeding localStorage after import
**What goes wrong:** Calling `localStorage.setItem(...)` after `await import('./favorites.svelte.js')`. This does not affect the test result (init() reads localStorage when called, not at import time), but it is inconsistent with the established idiom and can confuse future readers.
**How to avoid:** Seed localStorage, then import, then call init() — always in that order. See T-21 as template.
**Warning signs:** Inconsistent test structure that deviates from established pattern.

### Pitfall 4: Using `favorites.current` without spread for deep equality
**What goes wrong:** `expect(favorites.current).toEqual([...])` may behave unexpectedly with the `readonly CalculatorId[]` return type.
**How to avoid:** Use `expect([...favorites.current]).toEqual([...])` — the spread pattern is consistent across T-01, T-07, T-10, T-11, T-14, T-18 in the existing suite.

### Pitfall 5: Editing `recover()` or `defaultIds()`
**What goes wrong:** Phase scope creep. D-01 locks this: the filter is already correct.
**How to avoid:** The planner and implementer treat the source as read-only for this phase.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| PERT in CALCULATOR_REGISTRY (6 entries) | 5 entries, no pert | Phase 52 complete |
| `'pert'` as valid CalculatorId | Excluded from union | Phase 52 complete |
| No explicit SAFE-02/03 test coverage | T-21 (generic, Phase 52) + SAFE-02/03 (pert-specific, Phase 53) | This phase adds the specific upgrade path doc |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | All claims in this research were verified directly against live source files. No assumed claims. | — | — |

**Confirmed directly:**
- `recover()` step 4 filter: read `favorites.svelte.ts` lines 52-55 [VERIFIED]
- Registry 5 entries no pert: read `registry.ts` [VERIFIED]
- Calculator IDs: `grep -rn "id:"` across all 5 modules [VERIFIED]
- Test idiom: read `favorites.test.ts` in full [VERIFIED]
- Default ordering `['feeds','formula','gir','morphine-wean']`: T-01/T-20 in test suite [VERIFIED]
- D-19 gate current state: `git grep -niwE 'pert|PERT' -- ':(exclude).planning/'` run live [VERIFIED]

---

## Open Questions

1. **Should SAFE-02 use `'pert'` literal or a named constant?**
   - What we know: D-04 permits `'pert'` literal for documentary value. D-19 gate is not clean-to-zero currently (CLAUDE.md/PRODUCT.md have hits). Using `'pert'` in `*.test.ts` is allowed.
   - What's unclear: Whether a future phase will aim to clean the gate to zero, at which point this test would need updating.
   - Recommendation: Use `'pert'` literal with a comment citing D-04. Add a note in the test that if the D-19 gate is ever cleaned to zero, this literal will need a decision. This is the planner's call per D-04.

2. **Should SAFE-01b (browser-level check) be a plan task or just a verification note?**
   - What we know: D-06 says it is NOT a blocking hard gate. The unit test is the hard gate.
   - Recommendation: Include as a manual verification step in the PLAN verification section, not as an automated task. A brief `localStorage`-seed + dev-server smoke check satisfies it.

---

## Environment Availability

Step 2.6: SKIPPED — this phase has no external dependencies. Changes are test file additions only. Existing test infrastructure (vitest + jsdom, already configured for `*.svelte.ts` compilation) handles all required capabilities. No new tools, services, or runtimes needed.

---

## Security Domain

`security_enforcement` is not set to `false` in config.json. However, this phase writes only test assertions against existing code with no new inputs, outputs, or trust boundaries. The ASVS categories (V2 authentication, V3 session, V4 access control, V5 input validation, V6 cryptography) do not apply to adding vitest unit tests for a favorites localStorage store. No security research needed.

---

## Package Legitimacy Audit

No new packages are installed in this phase. This section is N/A.

---

## Sources

### Primary (HIGH confidence)
- `src/lib/shared/favorites.svelte.ts` — live source read; `recover()` filter at lines 52-58, `defaultIds()` at lines 17-19, `validIds()` at lines 22-24, `init()` at lines 112-124
- `src/lib/shared/favorites.test.ts` — live source read; complete test suite including T-21 template, `vi.resetModules()` + dynamic import pattern, spread + `toEqual` idiom
- `src/lib/shell/registry.ts` — live source read; 5 entries, no pert, alphabetical order confirmed
- `src/lib/{feeds,fortification,gir,morphine,uac-uvc}/calculator.ts` — live grep; IDs: `'feeds'`, `'formula'`, `'gir'`, `'morphine-wean'`, `'uac-uvc'`
- `.planning/phases/53-favorites-safety-net-verification/53-CONTEXT.md` — locked decisions D-01..D-06
- `.planning/REQUIREMENTS.md` — SAFE-01, SAFE-02, SAFE-03 acceptance text

### Secondary (MEDIUM confidence)
- `.planning/phases/52-code-purge-test-suite-repair/52-CONTEXT.md` — D-11 (generic literal in T-21), D-13 (scrub PERT from active test files), D-19 (word-boundary grep gate scope), D-21 (preserve stored order)

---

## Metadata

**Confidence breakdown:**
- Filter behavior: HIGH — read directly from live source, cross-verified with test expectations
- Test idiom: HIGH — read from live test suite with 21 existing tests following the pattern
- Default ordering: HIGH — live source + 8 existing tests asserting exact array
- D-19 gate state: HIGH — live `git grep` run

**Research date:** 2026-05-23
**Valid until:** Stable — no external dependencies; valid until registry.ts or favorites.svelte.ts changes
