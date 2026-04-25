# Phase 3: Tests — Research

**Researched:** 2026-04-25
**Domain:** Test coverage (vitest parity + component, Playwright e2e, axe regression-watch) for the calc layer + components shipped in Phase 1 + Phase 2
**Confidence:** HIGH

## Summary

Phase 3 grows the PERT test surface to match the depth of v1.8 GIR / v1.12 Feeds / v1.13 UAC-UVC milestones. The CONTEXT.md (D-01..D-15) locks every framework + topology decision. The remaining research load is: (1) hand-derive 27 fixture rows from the xlsx authority via openpyxl + apply Phase 2 D-15/D-16/D-12/D-02 formulas, (2) extract the precise selectors / aria-labels Phase 3's e2e and component tests will target, (3) map each PERT-TEST-* requirement to a runnable test command. PERT-TEST-04 is mostly satisfied by Phase 1's 11-test config.test.ts (D-09); PERT-TEST-06 is fully satisfied by Phase 1's 4-sweep pert-a11y.spec.ts (D-12). Phase 3 ships ~5 new files (1 fixture JSON + 1 calc test + 2 component tests + 1 e2e spec) and modifies zero production files.

xlsx live-read this session via `openpyxl data_only=False` confirmed all cell formulas verbatim. Cell map: **B10 oral capsulesPerDose** = `ROUND(B9/B8,0)`, **B11 oral max-lipase cap** = `B4*10000`, **B14 tube capsulesPerDay** = `ROUND(B12/B11,0)`, **B15 tube capsulesPerMonth** = `B14*30`, **B13 tube lipasePerKg** = `ROUND(B12/B4,0)`. xlsx oral default has `lipasePerG=2000` (NOT 1000); xlsx tube default has `lipasePerG=2500` (NOT 1000); Kate Farms Pediatric Standard 1.2 = `fatGPerL=48` (NOT 40). Row 0 anchors per CONTEXT D-05 are **independently re-verified**.

**Primary recommendation:** Plan ~5 plans across 3 waves (W0 fixture JSON; W1 calc + 2 component tests parallel-eligible; W2 e2e + verification gate). Hand-derive each fixture row's expected values from D-15/D-16/D-02 only, never by running `calculations.ts`. Inline the `closeEnough` helper in calculations.test.ts verbatim from `feeds/calculations.test.ts:25-31`. Mirror feeds-parity.fixtures.json shape per-named-key (input + expected + _derivation). Do not modify Phase-1-frozen tests, do not add new axe sweeps, do not touch production code.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Test framework:** vitest 4.1.2 + @testing-library/svelte (jsdom env). E2E via Playwright 1.58.2. Mirrors `src/lib/feeds/calculations.test.ts` + `FeedAdvanceCalculator.test.ts` + `FeedAdvanceInputs.test.ts` + `e2e/feeds.spec.ts` + `e2e/feeds-a11y.spec.ts`. NO Playwright Component Tests, NO new test framework.

**D-02 — Parity epsilon contract:** Use the same `closeEnough(actual, expected)` helper as `src/lib/feeds/calculations.test.ts:25-31`. `EPSILON = 0.01` (1% relative). `ABS_FLOOR = 0.5` (catches zero-vs-one boundary). Logic: `if (absDiff <= ABS_FLOOR) return true; if (expected === 0) return absDiff < EPSILON; return Math.abs(absDiff / expected) <= EPSILON;`.

**D-03 — Fixture matrix shape:** Oral = 9 rows (3 weights × 3 fat-grams). Weights {5, 10, 25}. Fat-grams {10, 25, 60}. lipasePerGramOfFat varies {1000, 2000, 3000}. Medications/strengths rotate {Creon 12000, Zenpep 10000, Pancreaze 21000}. Row 0 = xlsx default verbatim. Tube = 18 rows (3 weights × 3 formulas × 2 volumes). Weights {8, 15, 30}. Formulas {Kate Farms Pediatric Standard 1.2 fatGPerL=48 (xlsx default), PediaSure Grow & Gain fatGPerL=38, Peptamen Junior 1.5 fatGPerL=68}. Volumes {800, 1500}. lipasePerGramOfFat=2500. Medications/strengths rotate {Pancreaze 37000, Creon 24000, Zenpep 25000}. **Total = 27 rows**, exceeding ROADMAP "≥3×3 + ≥3×3×2" minimum.

**D-04 — Cell-mapping ground truth (xlsx live read):** Pediatric PERT Tool sheet — `B10` capsulesPerDose = `ROUND(B9/B8,0)`; `B11` max-lipase-cap = `B4*10000`. Pediatric Tube Feed PERT sheet — `B12` totalLipase = `B8*B9`; `B13` lipasePerKg = `ROUND(B12/B4,0)`; `B14` capsulesPerDay = `ROUND(B12/B11,0)`; `B15` capsulesPerMonth = `B14*30`. **ROADMAP cell labels are stale** — Phase 3 honors xlsx, not ROADMAP wording.

**D-05 — Anchor row 0:** Oral row 0 = `{weight:10, fat:25, lipasePerG:2000, Creon 12000} → capsulesPerDose=4, lipasePerDose=48000, estimatedDailyTotal=12, totalLipase=50000`. Tube row 0 = `{weight:15, KateFarms 48, volume:1500, lipasePerG:2500, Pancreaze 37000} → totalFatG=72.0, totalLipase=180000, capsulesPerDay=5, lipasePerKg=12000, capsulesPerMonth=150`. **HARD-LOCKED.**

**D-06 — Fixture authoring methodology:** Fixtures at `src/lib/pert/pert-parity.fixtures.json`. Mirror `src/lib/feeds/feeds-parity.fixtures.json` shape: top-level `_comment` + `_cellRefs`, then per-named-key `{input, expected, _derivation}`. **All `expected` values HAND-DERIVED** from xlsx-canonical formulas (D-15/D-16 + D-02 from Phase 2) — NOT copied from running `calculations.ts`.

**D-07 — Component-test scope split:** Two test files mirror the feeds split. `src/lib/pert/PertCalculator.test.ts`: hero (capsulesPerDose / capsulesPerDay numeral renders with `class="num"`); secondaries; tertiary "Estimated daily total (3 meals/day)" Oral-only; STOP-red advisory card with `border-2 border-[var(--color-error)]` + `OctagonAlert` + `role="alert"` + `aria-live="assertive"`; warning advisory neutral; empty-state hero copy; secondaries hidden in empty state. `src/lib/pert/PertInputs.test.ts`: SegmentedToggle binding (clicking flips `pertState.current.mode`); medication picker selection updates `medicationId` AND resets `strengthValue` to null (D-11); strength picker filtered by selected medication; formula picker shows 17 options + filters via search; `inputmode="decimal"` present on every numeric input; mode-switch preserves shared inputs (weight/medication/strength) + restores mode-specific inputs (fat/formula/volume/lipasePerGramOfFat). **NOT covered (Phase-1-frozen):** SegmentedToggle keyboard nav `←/→/Home/End` is unit-tested at `src/lib/shared/components/SegmentedToggle.test.ts`.

**D-08 — Calc-layer pure-function tests:** `src/lib/pert/calculations.test.ts` (NEW) covers (a) spreadsheet-parity matrix (D-03 fixture rows iterated through `computeOralResult` / `computeTubeFeedResult`, asserted via `closeEnough`); (b) defensive zero-return: null inputs → 0 result fields, NaN/Infinity → 0, ≤ 0 → 0; (c) `getTriggeredAdvisories` semantics — max-lipase fires when `dailyLipase > weightKg × 10000`, range advisories fire from JSON config, severity-DESC ordering, empty-state input set returns []; (d) STOP-red trigger fixture: at least one row deliberately above the 10000 cap (e.g., weight=2 kg + fat=50 g + lipasePerG=4000 + Creon 6000).

**D-09 — Config integration delta (PERT-TEST-04 closure):** PERT-TEST-04 is **already covered by Phase 1 `src/lib/pert/config.test.ts` (11 tests including FDA-allowlist hostile-injection)**. Phase 3 adds a SINGLE integration test in `calculations.test.ts` wiring fixture row 0's `medicationId` + `formulaId` lookups through `getMedicationById` / `getFormulaById` / `getStrengthsForMedication` into the calc layer end-to-end. **No new file at `config.test.ts`; Phase 1's 11 tests stay frozen.**

**D-10 — E2E spec topology:** NEW `e2e/pert.spec.ts` (mirrors `e2e/feeds.spec.ts`) covers happy-path Oral + Tube-Feed at mobile 375 + desktop 1280; mode-switch state preservation; favorites round-trip; localStorage round-trip; `inputmode="decimal"` regression guard. Existing `e2e/pert-a11y.spec.ts` UNCHANGED.

**D-11 — Storage round-trip semantics:** Phase 3 e2e tests **localStorage** round-trip key `nicu_pert_state` (NOT sessionStorage `nicu:pert:mode` per ROADMAP — that wording is documentation drift; Phase 1 D-09 reinterpreted to single localStorage blob, Phase 2 ships against that contract).

**D-12 — Axe-suite already complete (PERT-TEST-06 closure):** PERT-TEST-06 is **already satisfied by Phase 1 Plan 01-02 + 01-04**. The 4 axe sweeps in `e2e/pert-a11y.spec.ts` (synthetic light + synthetic dark + literal `/pert` light + literal `/pert` dark) all pass on first run with no `disableRules`. Phase 3 verifies via `CI=1 pnpm exec playwright test pert-a11y --reporter=line` returning 4/4. **No new axe specs.**

**D-13 — Favorites round-trip protocol:** Mirror `e2e/favorites-nav.spec.ts:69` FAV-TEST-03-2: pre-clear localStorage `nicu:favorites` + `nicu_pert_state` via `addInitScript`; navigate `/pert`; open hamburger menu; click `Add PERT to favorites` (aria-label confirmed via HamburgerMenu.svelte:117-118); reload; assert mobile bottom-nav `<md` or desktop top-nav `>=md` contains a `/pert` link.

**D-14 — `inputmode="decimal"` regression guard:** In `e2e/pert.spec.ts`, after rendering each numeric input on `/pert`, assert `inputmode="decimal"` via `await expect(input).toHaveAttribute('inputmode', 'decimal')`. The shared `<NumericInput>` already renders this attribute (NumericInput.svelte:157); the test is a regression guard.

**D-15 — xlsx fixture extraction methodology:** Use Python + openpyxl with `data_only=False` to extract formula strings (not last-saved cached values). Hand-compute expected values per fixture row by applying D-15/D-16 (Phase 2 CONTEXT) + D-02 (Math.round). Document each row with a `_derivation` string. **Fixtures independent of live `calculations.ts`** (`"_comment": "NEVER edit to match code changes"`).

### Claude's Discretion

- File-level layout for fixture rows (single big JSON object vs. per-mode sub-arrays) — planner picks; mirror feeds-parity.fixtures.json shape (per-named-key sub-objects with `input` + `expected` + `_derivation`).
- Whether `calculations.test.ts` exposes a single `describe('parity', ...)` block or splits into `describe('Oral parity', ...)` + `describe('Tube-Feed parity', ...)` — planner picks; the latter likely reads cleaner.
- Whether the STOP-red component test uses `screen.getByRole('alert')` or a more specific selector — planner picks; `role="alert"` is in the UI-SPEC.
- Whether to mock `localStorage` in component tests vs. let it persist — feeds tests reset state via `feedsState.reset()` in `beforeEach`; mirror with `pertState.reset()`.
- Exact wave structure — likely 3 waves: W0 fixture authoring (JSON only), W1 calc-layer + component tests (parallel-eligible), W2 e2e + verification (depends on W0 + W1). Planner refines.

### Deferred Ideas (OUT OF SCOPE)

- **Spreadsheet-parity test for the STOP-red advisory firing** — covered in `calculations.test.ts` D-08 STOP-red trigger fixture (NOT a new file).
- **Adult Oral / Adult Tube Feed PERT modes** — out of scope for v1.15 entirely.
- **Per-meal historical logging** — out of scope.
- **Custom formula entry** — out of scope.
- **ROADMAP wording cleanup (cell labels, Kate Farms fatGPerL=40 → 48, sessionStorage → localStorage, "33/33 → 35/35" arithmetic)** — Phase 5 release cleanup per the 4 doc-drift items in workstream STATE.md.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERT-TEST-01 | Spreadsheet-parity vitest within 1% epsilon for Oral mode (≥ 3 weight × 3 fat fixtures including xlsx default) | 9 oral fixture rows hand-derived below in Code Examples §Fixture Matrix; xlsx live-read confirms B10 = `ROUND(B9/B8,0)`; Phase 2 calc layer `computeOralResult` per D-15 reproduces it; closeEnough helper at `feeds/calculations.test.ts:25-31` |
| PERT-TEST-02 | Spreadsheet-parity vitest within 1% epsilon for Tube-Feed mode (≥ 3 weight × 3 formula × 2 volume fixtures including xlsx default) | 18 tube fixture rows hand-derived below; xlsx live-read confirms B14/B15/B13 cells; Phase 2 calc layer `computeTubeFeedResult` per D-16 + D-12 reproduces it |
| PERT-TEST-03 | Component tests for `PertCalculator.svelte` covering empty / Oral / Tube-Feed / mode-switch / advisory rendering / max-lipase advisory firing + config shape tests | Two component test files per D-07: `PertCalculator.test.ts` (output surface) + `PertInputs.test.ts` (input wiring). Patterns from `src/lib/feeds/FeedAdvanceCalculator.test.ts` + `FeedAdvanceInputs.test.ts`. SegmentedToggle keyboard nav already at `src/lib/shared/components/SegmentedToggle.test.ts` (Phase-1-frozen). |
| PERT-TEST-04 | Config shape tests | **MOSTLY Phase-1-covered (per D-09)** by `src/lib/pert/config.test.ts` (11 tests including FDA-allowlist hostile-injection). Phase 3 adds ONE integration test in `calculations.test.ts` wiring fixture row 0 through `getMedicationById` + `getFormulaById` + `getStrengthsForMedication` into `computeOralResult`. |
| PERT-TEST-05 | Playwright E2E happy path mobile + desktop both modes + `inputmode="decimal"` + favorites round-trip + localStorage round-trip | NEW `e2e/pert.spec.ts` per D-10 + D-11 + D-13 + D-14. Mirrors `e2e/feeds.spec.ts` viewport-loop + `getInputsScope` + `e2e/favorites-nav.spec.ts:69` FAV-TEST-03-2 + `e2e/disclaimer-banner.spec.ts:48-51` localStorage pre-clear. |
| PERT-TEST-06 | Axe sweeps for `/pert` light + dark | **FULLY Phase-1-covered (per D-12)** by `e2e/pert-a11y.spec.ts` (4/4 axe sweeps green). Phase 3 verifies stays green via `CI=1 pnpm exec playwright test pert-a11y --reporter=line` returning 4/4. **No new axe specs.** |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Spreadsheet-parity unit tests (calc layer) | Vitest unit (jsdom) | — | Pure functions in `calculations.ts`; no DOM; jsdom only because vitest config defaults to it |
| Component rendering tests (hero / outputs / advisories) | Vitest component (jsdom + @testing-library/svelte) | — | Render Svelte components; assert DOM via screen queries; reset module-scope state via `pertState.reset()` in beforeEach |
| Component input wiring tests (SegmentedToggle / SelectPicker / NumericInput binding) | Vitest component (jsdom + @testing-library/svelte) | — | fireEvent.click / fill on inputs; assert `pertState.current.*` mutations |
| E2E happy path (mobile 375 + desktop 1280, both modes) | Playwright (real Chromium) | — | Real browser needed for viewport-conditional UI (desktop aside vs mobile drawer), real localStorage, real keyboard navigation |
| E2E favorites round-trip | Playwright (real Chromium) | — | Cross-route navigation + localStorage persistence + hamburger drawer interaction |
| E2E localStorage round-trip + reload | Playwright (real Chromium) | — | Real reload semantics (re-runs `pertState.init()` from stored blob) |
| `inputmode="decimal"` regression guard | Playwright (real Chromium) | Vitest component | Browser is the source of truth for HTML attributes on numeric inputs; component test in jsdom can assert as defense-in-depth but the spec lives in e2e per D-14 |
| Axe sweeps (PERT-TEST-06) | Playwright + @axe-core/playwright (Phase-1-frozen) | — | Already shipped; Phase 3 verifies regression-free via `CI=1 pnpm exec playwright test pert-a11y` |

## Standard Stack

### Core (already installed; verified `package.json` 2026-04-25)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vitest` | ^4.1.4 (D-01 says 4.1.2; package.json shows 4.1.4 — both are post-4.0 final) | Unit + component test runner | The project's existing test runner; Phase 1 + Phase 2 ship 17 PERT vitest tests under it |
| `@testing-library/svelte` | ^5.3.1 | Render Svelte components in jsdom + screen queries + fireEvent | Industry standard for Svelte component tests; matches Phase 1 + Phase 2 pattern |
| `@testing-library/jest-dom` | (loaded in `src/test-setup.ts:1`) | Custom DOM matchers (`toBeVisible`, `toHaveAttribute`, `toBeTruthy`) | Already wired |
| `@playwright/test` | ^1.59.1 (D-01 says 1.58.2; both work) | E2E test runner | Project's E2E layer; Phase 1 ships pert-a11y.spec.ts |
| `@axe-core/playwright` | ^4.11.2 | Axe-core integration for Playwright | Phase-1-frozen; Phase 3 does NOT add new axe specs |

### Supporting (already installed)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `vitest`'s `vi` | `vi.resetModules()` for re-importing module-scope singletons (already used in `state.test.ts:5-8`) | If integration test needs a fresh `pertState` (likely NOT needed in Phase 3 — `pertState.reset()` suffices) |
| Playwright's `addInitScript` | Pre-clear localStorage before navigation (every reload) | localStorage round-trip tests + favorites round-trip pre-clear |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `closeEnough` in calculations.test.ts | Extract to `src/lib/shared/test-utils.ts` | DRY across feeds + gir + pert, but adds project surface; no other tests would consume it; deferred to a future "test-utils consolidation" phase if it ever grows. **Recommend (a) inline** — matches feeds + gir which both inline their own copies. |
| Two component test files (`PertCalculator.test.ts` + `PertInputs.test.ts`) | One combined `Pert.test.ts` | Combined would be ~150-200 lines with mixed input/output assertions; the feeds split (FeedAdvanceCalculator.test.ts at 106 lines + FeedAdvanceInputs.test.ts at 54 lines) is cleaner. **D-07 locks the split.** |
| Playwright Component Tests (PCT) | Vitest + @testing-library/svelte | PCT requires a separate framework + bundler config; project has no PCT precedent. **D-01 locks vitest.** |

**Installation:** **None needed.** All packages above are already in `package.json` and `pnpm install` is part of the existing workflow.

**Version verification (2026-04-25 against `node_modules`):** `vitest@4.1.4`, `@testing-library/svelte@5.3.1`, `@playwright/test@1.59.1`, `@axe-core/playwright@4.11.2`. [VERIFIED: package.json grep + pnpm-lock.yaml]

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │  epi-pert-calculator.xlsx           │
                    │  (workstream root, parity authority)│
                    └─────────────┬───────────────────────┘
                                  │ openpyxl data_only=False
                                  │ (research-time only; no runtime dep)
                                  ▼
                    ┌─────────────────────────────────────┐
                    │  pert-parity.fixtures.json (NEW)    │
                    │  - 9 oral rows + 18 tube rows       │
                    │  - 1 STOP-red trigger row           │
                    │  - per-row {input, expected,        │
                    │    _derivation}                     │
                    │  - "_comment": NEVER edit ...       │
                    └─────────┬───────────────────────────┘
                              │ import
                              ▼
       ┌───────────────────────────────────────────────────┐
       │  src/lib/pert/calculations.test.ts (NEW)          │
       │  - parity matrix iteration through                │
       │    computeOralResult / computeTubeFeedResult      │
       │  - defensive zero-return                          │
       │  - getTriggeredAdvisories                         │
       │  - STOP-red trigger fixture                       │
       │  - PERT-TEST-04 integration delta                 │
       └───────────────────────────────────────────────────┘

       ┌───────────────────────────────────────────────────┐
       │  src/lib/pert/PertCalculator.test.ts (NEW)        │
       │  - hero numeral + secondaries + tertiary          │
       │  - STOP-red role="alert" + aria-live="assertive"  │
       │  - empty-state hero copy                          │
       │  uses: render() + screen.* + pertState.reset()    │
       └───────────────────────────────────────────────────┘

       ┌───────────────────────────────────────────────────┐
       │  src/lib/pert/PertInputs.test.ts (NEW)            │
       │  - SegmentedToggle binding                        │
       │  - SelectPicker (medication/strength/formula)     │
       │  - D-11 strength reset on medication change       │
       │  - inputmode="decimal" defense-in-depth           │
       │  - mode-switch shared+specific input preservation │
       └───────────────────────────────────────────────────┘

       ┌───────────────────────────────────────────────────┐
       │  e2e/pert.spec.ts (NEW)                           │
       │  - viewport loop {mobile 375, desktop 1280}       │
       │  - happy path Oral + Tube-Feed                    │
       │  - mode-switch state preservation                 │
       │  - favorites round-trip (FAV-TEST-03-2 mirror)    │
       │  - localStorage round-trip (nicu_pert_state)      │
       │  - inputmode="decimal" regression guard           │
       │  uses: addInitScript + getInputsScope helper      │
       └───────────────────────────────────────────────────┘

       ┌───────────────────────────────────────────────────┐
       │  e2e/pert-a11y.spec.ts (Phase-1-frozen)           │
       │  Phase 3 verifies 4/4 stays green                 │
       │  CI=1 pnpm exec playwright test pert-a11y         │
       └───────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/lib/pert/
├── calculations.ts                  # Phase 2 — Phase 3 tests this
├── calculations.test.ts             # NEW (Phase 3) — parity matrix + advisory engine + integration
├── pert-parity.fixtures.json        # NEW (Phase 3) — 27 hand-derived rows + 1 STOP-red trigger row
├── PertCalculator.svelte            # Phase 2 — Phase 3 tests this
├── PertCalculator.test.ts           # NEW (Phase 3) — output surface
├── PertInputs.svelte                # Phase 2 — Phase 3 tests this
├── PertInputs.test.ts               # NEW (Phase 3) — input wiring
├── config.test.ts                   # Phase 1 — Phase 3 does NOT modify
├── state.test.ts                    # Phase 1 — Phase 3 does NOT modify
├── config.ts, state.svelte.ts, types.ts, pert-config.json  # Phase 1+2 — frozen
└── (no new shared utilities)

e2e/
├── pert.spec.ts                     # NEW (Phase 3)
└── pert-a11y.spec.ts                # Phase 1 — Phase 3 verifies regression-free
```

### Pattern 1: closeEnough helper inlined verbatim

**What:** Copy `feeds/calculations.test.ts:23-31` verbatim into `pert/calculations.test.ts`. EPSILON = 0.01, ABS_FLOOR = 0.5. No extraction to shared util.
**When to use:** Every parity assertion (D-02). Wraps `expect(actual).toBe(expected)` with a 1%-relative-OR-0.5-absolute tolerance.
**Example:**
```typescript
// Source: src/lib/feeds/calculations.test.ts:23-31 (verbatim copy per D-02)
const EPSILON = 0.01; // 1% relative
const ABS_FLOOR = 0.5; // absolute floor for small values

function closeEnough(actual: number, expected: number): boolean {
  const absDiff = Math.abs(actual - expected);
  if (absDiff <= ABS_FLOOR) return true;
  if (expected === 0) return absDiff < EPSILON;
  return Math.abs(absDiff / expected) <= EPSILON;
}
```

### Pattern 2: Parity-fixture iteration with describe blocks per mode

**What:** One `describe('Oral parity', ...)` block iterating over `Object.entries(fixtures.oral)`, one `describe('Tube-Feed parity', ...)` block iterating over `Object.entries(fixtures.tubeFeed)`. Each row produces 4 oral assertions or 5 tube assertions.
**When to use:** PERT-TEST-01 + PERT-TEST-02 parity assertion structure.
**Example:**
```typescript
// Source: pattern derived from src/lib/feeds/calculations.test.ts:37-92 (sheet1 + sheet2 per-block)
import { describe, it, expect } from 'vitest';
import { computeOralResult, computeTubeFeedResult, getTriggeredAdvisories, MAX_LIPASE_PER_KG_PER_DAY } from './calculations.js';
import { advisories, getMedicationById, getFormulaById, getStrengthsForMedication } from './config.js';
import fixtures from './pert-parity.fixtures.json';

describe('PERT Oral parity (xlsx Pediatric PERT Tool, B10)', () => {
  for (const [rowName, row] of Object.entries(fixtures.oral)) {
    if (rowName.startsWith('_')) continue;
    it(`${rowName}: ${row._derivation}`, () => {
      const actual = computeOralResult({
        fatGrams: row.input.fatGrams,
        lipasePerKgPerMeal: row.input.lipasePerGramOfFat,  // legacy JSON key per D-17
        strengthValue: row.input.strengthValue
      });
      expect(closeEnough(actual.capsulesPerDose, row.expected.capsulesPerDose)).toBe(true);
      expect(closeEnough(actual.totalLipase, row.expected.totalLipase)).toBe(true);
      expect(closeEnough(actual.lipasePerDose, row.expected.lipasePerDose)).toBe(true);
      expect(closeEnough(actual.estimatedDailyTotal, row.expected.estimatedDailyTotal)).toBe(true);
    });
  }
});
```

### Pattern 3: Component test with pertState.reset() in beforeEach

**What:** `beforeEach(() => pertState.reset())` mirrors `feedsState.reset()` at `feeds/FeedAdvanceCalculator.test.ts:13-15`. Reset clears localStorage AND resets in-memory state to defaults — prevents test bleed.
**When to use:** Every component test file (PertCalculator.test.ts + PertInputs.test.ts).
**Example:**
```typescript
// Source: src/lib/feeds/FeedAdvanceCalculator.test.ts:13-15 (verbatim pattern)
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PertCalculator from './PertCalculator.svelte';
import { pertState } from './state.svelte.js';

describe('PertCalculator', () => {
  beforeEach(() => {
    pertState.reset();
  });

  it('shows Oral empty-state hero copy when fat/medication missing', () => {
    pertState.current.weightKg = 10;
    pertState.current.mode = 'oral';
    render(PertCalculator);
    expect(screen.getByText(/Enter weight and fat grams/)).toBeTruthy();
  });
});
```

### Pattern 4: E2E viewport loop + getInputsScope helper

**What:** Outer `for (const viewport of [mobile, desktop])` loop; each iteration runs `test.use({ viewport })` + a `getInputsScope(page, viewport.name)` helper that returns either the desktop sticky aside (`page.locator('aside[aria-label="PERT inputs"]')`) or the mobile drawer dialog (`page.getByRole('dialog', { name: 'PERT inputs' })`). The aria-label `PERT inputs` is confirmed via `+page.svelte:105` (desktop aside) and `+page.svelte:115` (drawer title).
**When to use:** Every functional e2e test for `/pert`. Mirrors `e2e/feeds.spec.ts:8-15`.
**Example:**
```typescript
// Source: e2e/feeds.spec.ts:8-15 (adapted for /pert)
import { test, expect, type Page } from '@playwright/test';

function getInputsScope(page: Page, viewport: 'mobile' | 'desktop') {
  if (viewport === 'mobile') {
    return page.getByRole('dialog', { name: 'PERT inputs' });
  }
  return page.locator('aside[aria-label="PERT inputs"]');
}

for (const viewport of [
  { name: 'mobile' as const, width: 375, height: 667 },
  { name: 'desktop' as const, width: 1280, height: 800 }
]) {
  test.describe(`PERT happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/pert');
      await page.getByRole('button', { name: /understand/i }).click({ timeout: 2000 }).catch(() => {});
      if (viewport.name === 'mobile') {
        await page.getByRole('button', { name: /tap to edit inputs/i }).click();
      }
    });
    // ... tests ...
  });
}
```

### Pattern 5: localStorage pre-clear via addInitScript

**What:** `await page.addInitScript(() => { localStorage.removeItem('nicu_pert_state'); localStorage.removeItem('nicu:favorites'); });` — script runs on every navigation including `page.reload()`. Test that needs a specific stored state registers a SET script via `addInitScript` AFTER the REMOVE; SET wins per registration order (per `e2e/favorites-nav.spec.ts:6-7` comment).
**When to use:** localStorage round-trip + favorites round-trip e2e tests.
**Example:**
```typescript
// Source: e2e/favorites-nav.spec.ts:32-35 (REMOVE script in beforeEach)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('nicu_pert_state');
    localStorage.removeItem('nicu:favorites');
    localStorage.removeItem('nicu:disclaimer-accepted');  // suppress disclaimer banner
  });
  await page.goto('/pert');
});
```

### Anti-Patterns to Avoid

- **Deriving expected values by running `calculations.ts`:** D-06 forbids it. Fixtures are derivation-locked and independent of the implementation. If `calculations.ts` is buggy, the test fails — never the fixture.
- **Using `sessionStorage` in e2e tests:** D-11 ground-truth is `localStorage` `nicu_pert_state`. ROADMAP wording `nicu:pert:mode` (sessionStorage) is stale.
- **Adding a new axe sweep file:** D-12 closes PERT-TEST-06 — Phase 1 already shipped 4 sweeps. New axe specs are out of scope.
- **Modifying `config.test.ts` or `state.test.ts`:** Both are Phase-1-frozen (workstream STATE.md confirms: 17/17 vitest tests preserved across Phase 2 + verified by negative-space audit). Phase 3 must NOT touch them.
- **Hand-rolling spreadsheet math at component-test time:** Component tests assert RENDER, not math. Set `pertState.current.weightKg = 10` etc., let the calc layer compute, assert the rendered string. Math correctness is calc-layer's responsibility.
- **Testing the SHARED `<SegmentedToggle>` keyboard nav:** Already covered at `src/lib/shared/components/SegmentedToggle.test.ts`. PertInputs.test.ts asserts the BINDING (toggle activation flips mode), not the keyboard mechanism.
- **Asserting exact pixel widths or theme colors in component tests:** jsdom does not compute layout or apply CSS variables. Use role/aria queries + presence assertions, not visual properties.
- **Running Playwright with `pnpm dev` server (default port 5173):** A sibling clone may have grabbed 5173. Phase 1 + Phase 2 verifiers used `CI=1 pnpm exec playwright test` to spin up the build+preview server on port 4173 (per `playwright.config.ts:21-27`). Phase 3 e2e + axe verification gates use `CI=1`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Floating-point parity comparison | Custom delta loops or `expect(a).toBeCloseTo(b, n)` with arbitrary digits | `closeEnough(actual, expected)` per D-02 | The 1% relative + 0.5 absolute floor is a clinical-meaning contract, not a numeric quirk; `toBeCloseTo` with digits=2 conflates relative + absolute and produces test failures on the zero-vs-one boundary |
| Module-scope singleton reset | Manually delete each `pertState.current.*` field | `pertState.reset()` (already exists in state.svelte.ts:69) | `reset()` is the documented contract; mirrors `feedsState.reset()`; clears localStorage AND in-memory state |
| Reading xlsx at runtime | Add SheetJS / xlsx-populate / openpyxl-js to the bundle | Hand-derive expected values to JSON at fixture-authoring time | Adds 100KB+ to the bundle for a one-time build-step concern; D-15 forbids runtime xlsx |
| Picking the right `<PertInputs />` instance in e2e | Use `.first()` / `.last()` or `.nth(N)` blindly | `getInputsScope(page, viewport.name)` returning the active scope | Mobile renders the inputs inside `<dialog role="dialog" aria-label="PERT inputs">`; desktop renders them inside `<aside aria-label="PERT inputs">`. The strict-locator-mode rule fails on `.getByLabel('Weight')` if both copies are in the DOM. Scope-first eliminates the strict-mode failures. |
| Pre-clearing localStorage between Playwright tests | Manually `await page.evaluate(() => localStorage.clear())` after navigation | `addInitScript` in `beforeEach` BEFORE navigation | `evaluate` runs after the page loads — the app's `pertState.init()` has already read stale data. `addInitScript` runs BEFORE every navigation including reloads. |
| Asserting `nicu_pert_state` JSON shape after a reload | Manually re-derive the state object | `await page.evaluate(() => localStorage.getItem('nicu_pert_state'))` + `JSON.parse` | The state schema is a Phase-1-frozen blob; tests should re-read it as-is, not mirror the schema (which would create a fragile coupling) |
| Ensuring the disclaimer banner is dismissed before assertions | Wait for selector + click | `await page.getByRole('button', { name: /understand/i }).click({ timeout: 2000 }).catch(() => {})` | Phase 1 + Phase 2 e2e specs all use this pattern (5 occurrences); the `.catch(() => {})` swallows the timeout when the banner is already dismissed |
| Pulse-key invalidation | Hand-roll a `key={...}` block in tests | (No need — HeroResult already handles `pulseKey`; component tests assert presence of the value, not the pulse animation, since jsdom Element.animate is shimmed in `src/test-setup.ts:39-66`) | The pulse animation is purely cosmetic; the value rendering is what matters |

**Key insight:** Every analog in the codebase (feeds, gir, uac-uvc) ships these patterns; if Phase 3 reaches for a custom helper, it's almost certainly a sign the analog wasn't read carefully enough. Read the feeds equivalent first.

## Common Pitfalls

### Pitfall 1: Treating `lipasePerKg` as integer-equal to xlsx B13

**What goes wrong:** xlsx B13 = `ROUND(B12/B4, 0)` returns an integer (e.g., 12000 for row 0). The PERT calc layer's `lipasePerKg = totalLipase / weightKg` does NOT apply `Math.round` — only `capsulesPerDay` (B14) and `capsulesPerMonth` (B15) are rounded in calculations.ts. Render layer wraps lipasePerKg in `Math.round` for display; the result-object value is the unrounded number.
**Why it happens:** Inconsistent rounding-semantics between xlsx + render-layer + result-object. CONTEXT D-16 says lipasePerKg is "secondary display, NOT divisor" but doesn't explicitly call out the rounding asymmetry.
**How to avoid:** In `pert-parity.fixtures.json`, document `expected.lipasePerKg` as the **unrounded value** (matching what `computeTubeFeedResult` returns). Use `closeEnough` for the assertion — the 0.5 absolute floor absorbs the rounding gap (`|11999.99 - 12000| = 0.01 < 0.5`). For row 0 specifically: unrounded = 180000 / 15 = 12000.0 exactly (matches the xlsx integer); for non-divisible rows like tube row 3 (76000 / 15 = 5066.667), the fixture's expected = 5066.667, not 5067.
**Warning signs:** A parity test failing with `actual=5066.667, expected=5067` means the fixture used the xlsx-rounded value instead of the calc-layer's unrounded value.

### Pitfall 2: Confusing `lipasePerKgPerMeal` JSON key with actual semantic

**What goes wrong:** The JSON state schema uses `oral.lipasePerKgPerMeal` as the key name, but post-Phase-2 D-17 it represents **lipase units per gram of fat** (xlsx B6 = 2000 by default). Fixture `input.lipasePerGramOfFat` should map to `state.oral.lipasePerKgPerMeal` when the test calls `computeOralResult`.
**Why it happens:** D-17 deliberately froze the JSON key for state-schema continuity; UI label changed to "Lipase per gram of fat", but the calc-layer interface kept the legacy field name. Fixture authors who use the field name verbatim risk thinking it's still "per kg per meal".
**How to avoid:** In fixture JSON, name the input field `lipasePerGramOfFat` (semantic name); in the test loop, map it explicitly: `lipasePerKgPerMeal: row.input.lipasePerGramOfFat`. Add a comment.
**Warning signs:** Tests with `weight × 1000` math producing values that match xlsx — a sign the fixture interpreted the field as "per kg per meal" not "per gram of fat".

### Pitfall 3: Math.round half-to-even (banker's) vs half-away-from-zero

**What goes wrong:** Some languages and libraries (Python 3 `round`, NumPy) implement half-to-even (banker's). JavaScript `Math.round` and Excel `ROUND` both implement **half-away-from-zero** (positive halves round up, negative halves round down, e.g., `Math.round(7.5) = 8`, `Math.round(-7.5) = -7`).
**Why it happens:** Fixture authors who hand-derive in Python and use `round(x, 0)` get banker's; xlsx + JS use half-away. Discrepancy at every `.5` boundary.
**How to avoid:** Hand-derive each fixture row's expected with a calculator or `math.floor(x + 0.5)` (Python) or simply with `Math.round` semantics in mind. Document the rounded result explicitly in `_derivation` (e.g., `"50000 / 12000 = 4.1667 → ROUND → 4"`). For `.5` boundaries, write `"75000 / 10000 = 7.5 → ROUND → 8"` so the reviewer sees the intent.
**Warning signs:** Oral row 6 in the matrix below: `25 × 3000 / 10000 = 7.5 → ROUND → 8`. If the fixture says 7, fixture is wrong (banker's bias).

### Pitfall 4: lipasePerG=2000 vs 1000 confusion (xlsx default vs Phase-1 config default)

**What goes wrong:** xlsx oral default is `lipasePerG=2000` (B6); xlsx tube default is `lipasePerG=2500` (B9). But `pert-config.json` `defaults.oral.lipasePerKgPerMeal=1000` and `defaults.tubeFeed.lipasePerKgPerDay=1000` (per CFF guideline conservative starting point). Fixture row 0 must use **xlsx defaults** (2000 oral, 2500 tube) per D-05; if tests use config defaults instead, every fixture's expected would be off by 2× or 2.5×.
**Why it happens:** Two valid "default" sources. Fixture author may grab from `pert-config.json` thinking that's authoritative.
**How to avoid:** D-05 hard-locks row 0 inputs to xlsx defaults. Every other oral row uses lipasePerG ∈ {1000, 2000, 3000} explicitly per D-03. Tube uses lipasePerG=2500 across all 18 rows (xlsx default).
**Warning signs:** Oral row 0 expected.capsulesPerDose=2 instead of 4 — fixture used config default (1000) not xlsx default (2000).

### Pitfall 5: SelectPicker `<dialog>` showModal in jsdom

**What goes wrong:** `bits-ui` SelectPicker opens a modal `<dialog>` for the picker UI. jsdom v29 does not implement HTMLDialogElement.showModal — `src/test-setup.ts:80-126` polyfills it, but the polyfill defaults closed dialogs to `display:none`, opens them with `open` attribute, and dispatches `close` events synchronously.
**Why it happens:** Component tests that try to fireEvent.click the SelectPicker trigger expect the dialog to be visible immediately (it is — polyfill sets display='') but later tests may see stale `open` state if the dialog wasn't closed.
**How to avoid:** Use `keyboard.press('Escape')` or `screen.getByRole('button', { name: /close/i })` to close the dialog explicitly between picker interactions in component tests. For the formula picker filter test, mount the component, fire-click the trigger, type into the search box, then fire-click an option — the polyfill handles the rest.
**Warning signs:** Test fails with "found 2 dialogs" — a previous test left a dialog open (use `pertState.reset()` + close any remaining dialogs in beforeEach if needed).

### Pitfall 6: Two `<PertInputs />` instances on the same singleton

**What goes wrong:** `src/routes/pert/+page.svelte` mounts `<PertInputs />` TWICE — once in the desktop sticky aside (lines 105-109) and once in the mobile InputDrawer (lines 119-121). Both bind to the same module-scope `pertState` singleton. In e2e, `page.getByLabel('Weight')` resolves to BOTH copies in strict-locator mode, throwing `strict mode violation: locator resolved to 2 elements`.
**Why it happens:** Svelte renders both copies into the DOM; CSS hides one (`hidden md:block` for desktop aside; drawer is conditionally visible). Playwright's strict locator counts BOTH.
**How to avoid:** Use the `getInputsScope(page, viewport)` helper to scope every input query to either the desktop aside OR the mobile drawer. NEVER use unscoped `page.getByLabel(...)` for inputs.
**Warning signs:** "strict mode violation: locator('label="Weight"') resolved to 2 elements" — missing scope.

### Pitfall 7: `Add PERT to favorites` aria-label exact wording

**What goes wrong:** HamburgerMenu.svelte uses `aria-label={isFavorite ? 'Remove ${calc.label} from favorites' : 'Add ${calc.label} to favorites (limit reached. Remove one to add another.)' : 'Add ${calc.label} to favorites'}` — the cap-blocked variant has different copy. If favorites are at the 4-cap limit during the test, the button label changes.
**Why it happens:** First-run defaults are `[feeds, formula, gir, morphine-wean]` (4 favorites, AT cap). Adding PERT requires removing one first.
**How to avoid:** `addInitScript` to set localStorage `nicu:favorites` to a 3-item subset (e.g., `['feeds', 'formula', 'gir']`) BEFORE navigating. Mirrors `e2e/favorites-nav.spec.ts:76-79` `[formula, gir, morphine-wean]` setup before adding feeds.
**Warning signs:** `getByRole('button', { name: /add pert to favorites/i })` not found — favorites at cap, button shows "Add PERT to favorites (limit reached. ...)".

### Pitfall 8: Empty-state input gate vs result-zero gate (component test)

**What goes wrong:** PertCalculator.svelte:22-31 + 33-45 use **input-null checks** for the empty-state gate, NOT result-zero checks. The calc layer returns zero results defensively on null/NaN/≤0 inputs (D-02), but zero is a valid clinical result for very low fat doses. Component tests that check `screen.getByText('0')` for empty-state will FAIL because the empty-state branch never renders the numeral row.
**Why it happens:** The two gating mechanisms (input-null gate in render, defensive-zero in calc) coexist; the render layer is the source of truth for empty-state copy.
**How to avoid:** For empty-state assertions, query for the `validationMessages.emptyOral` / `emptyTubeFeed` strings ("Enter weight and fat grams" / "Enter weight and select a formula"). For valid-state assertions, set ALL required inputs and query for the rendered numeral.
**Warning signs:** Test sets `weightKg=10` only, expects `screen.getByText('0')` to appear — gate hides the numeral; query for the empty-state string instead.

### Pitfall 9: STOP-red vs warning advisory distinction in component test

**What goes wrong:** Both advisory branches render at the same DOM level (after the secondaries section). Querying `getByRole('alert')` returns ONLY the STOP-red branch (`<section role="alert" aria-live="assertive">`). Warnings render with `role="note"`. `getAllByRole('alert')` after a STOP-red trigger returns exactly 1; warnings are NOT alerts.
**Why it happens:** D-04 deliberately distinguishes — STOP-red is the ONE Red-Means-Wrong carve-out; warnings stay neutral.
**How to avoid:** Use `screen.getByRole('alert')` for STOP-red assertions; use `screen.getAllByRole('note')` for warning assertions. Assert the message text explicitly to disambiguate.
**Warning signs:** Component test triggers a warning advisory, queries `getByRole('alert')`, fails — wrong role.

### Pitfall 10: Test message strings and the em-dash ban

**What goes wrong:** DESIGN.md line 312 forbids em-dashes in **user-rendered strings, aria-label, and screen-reader copy**. Test description strings (`it('should ...')`, comment text) are NOT user-rendered. However, Phase 1 + Phase 2 plan-acceptance gates were unconditional `grep "—"` — comment-blind. Both Phase 2 plans (02-03, 02-04) had to scrub comment em-dashes to satisfy the gate.
**Why it happens:** The strict reading of DESIGN.md says em-dashes in TEST FILES are fine. The plan-author convention has applied the ban to comments too as a uniform-grep pragmatism.
**How to avoid:** Phase 3 plan acceptance gates SHOULD continue the comment-em-dash-free convention to keep the project signature uniform; rendered strings inside test code (e.g., `expect(text).toBe('...')`) MUST be em-dash-free if they assert against user-rendered copy. **Recommendation: Phase 3 test files use ASCII colons / semicolons / periods in all comments and message strings to match Phase 1 + Phase 2 convention.**
**Warning signs:** `pnpm svelte-check` passes but plan acceptance gate `grep -c "—"` returns non-zero — comment cleanup required.

## Code Examples

Verified patterns from official sources, plus the 27 hand-derived fixture rows.

### Example A: closeEnough helper inlined (verbatim from feeds)

```typescript
// Source: src/lib/feeds/calculations.test.ts:23-31 (verbatim)
const EPSILON = 0.01; // 1% relative
const ABS_FLOOR = 0.5; // absolute floor for small values

function closeEnough(actual: number, expected: number): boolean {
  const absDiff = Math.abs(actual - expected);
  if (absDiff <= ABS_FLOOR) return true;
  if (expected === 0) return absDiff < EPSILON;
  return Math.abs(absDiff / expected) <= EPSILON;
}
```

### Example B: pert-parity.fixtures.json shape

```json
{
  "_comment": "Hand-derived from epi-pert-calculator.xlsx Pediatric tabs via openpyxl data_only=False. Each row's `expected` values come from applying CONTEXT D-15 (oral) / D-16 (tube) / D-12 (capsulesPerMonth × 30) / D-02 (Math.round) by hand, NOT by running ./calculations.ts. NEVER edit to match code changes.",
  "_cellRefs": {
    "oral": "Pediatric PERT Tool!B5..B11 — B5=fat g, B6=lipasePerG, B8=strength, B9=B5*B6 totalLipase, B10=ROUND(B9/B8,0) capsulesPerDose, B11=B4*10000 max-lipase cap",
    "tubeFeed": "Pediatric Tube Feed PERT!B6..B15 — B6=fatGPerL, B7=volume mL, B8=ROUND(B6*B7/1000,1) totalFatG, B9=lipasePerG, B11=strength, B12=B8*B9 totalLipase, B13=ROUND(B12/B4,0) lipasePerKg display, B14=ROUND(B12/B11,0) capsulesPerDay, B15=B14*30 capsulesPerMonth"
  },
  "oral": {
    "row0_xlsx_default": {
      "_derivation": "weight 10kg, fat 25g, lipasePerG 2000, Creon 12000. totalLipase = 25 * 2000 = 50000. capsulesPerDose = ROUND(50000 / 12000) = ROUND(4.1667) = 4. lipasePerDose = 4 * 12000 = 48000. estimatedDailyTotal = 4 * 3 = 12. Daily lipase 4*12000*3=144000 vs cap 10*10000=100000 -> EXCEEDS cap (STOP-red fires).",
      "input": { "weightKg": 10, "fatGrams": 25, "lipasePerGramOfFat": 2000, "medicationId": "creon", "strengthValue": 12000 },
      "expected": { "capsulesPerDose": 4, "totalLipase": 50000, "lipasePerDose": 48000, "estimatedDailyTotal": 12 }
    },
    ...
  },
  "tubeFeed": { ... },
  "stopRedTrigger": {
    "_mode": "oral",
    "_derivation": "Deliberate over-cap row. weight 2kg, fat 50g, lipasePerG 4000, Creon 6000. totalLipase = 50*4000 = 200000. capsulesPerDose = ROUND(200000/6000) = ROUND(33.333) = 33. lipasePerDose = 33*6000 = 198000. estimatedDailyTotal = 99. Daily lipase = 33*6000*3 = 594000 vs cap = 2*10000 = 20000. 594000 > 20000 -> STOP-red max-lipase-cap advisory fires.",
    "input": { "weightKg": 2, "fatGrams": 50, "lipasePerGramOfFat": 4000, "medicationId": "creon", "strengthValue": 6000 },
    "expected": { "capsulesPerDose": 33, "totalLipase": 200000, "lipasePerDose": 198000, "estimatedDailyTotal": 99, "stopRedTriggers": true }
  }
}
```

### Example C: 27 hand-derived fixture rows + 1 STOP-red trigger row

> **Math executed by hand using xlsx-canonical formulas (CONTEXT D-15/D-16/D-12) + JS `Math.round` half-away-from-zero. Row 0 verified against D-05 anchor.**
> **Verified live against `epi-pert-calculator.xlsx` via openpyxl in this research session: oral B10=`ROUND(B9/B8,0)`, tube B14=`ROUND(B12/B11,0)`, B15=`B14*30`, B13=`ROUND(B12/B4,0)`.**

#### Oral matrix — 9 rows (3 weights {5, 10, 25} × 3 fat-grams {10, 25, 60})

| # | name | weight | fat | lipG | medication | strength | totalLipase | capsulesPerDose | lipasePerDose | estDailyTotal | dailyLipase | cap (w×10000) | STOP-red? |
|---|------|--------|-----|------|-----------|----------|-------------|-----------------|---------------|---------------|-------------|---------------|-----------|
| 0 | row0_xlsx_default | 10 | 25 | 2000 | creon | 12000 | 50000 | ROUND(4.1667)=**4** | 48000 | 12 | 144000 | 100000 | YES |
| 1 | row1 | 10 | 10 | 1000 | zenpep | 10000 | 10000 | ROUND(1.0)=**1** | 10000 | 3 | 30000 | 100000 | no |
| 2 | row2 | 10 | 60 | 3000 | pancreaze | 21000 | 180000 | ROUND(8.5714)=**9** | 189000 | 27 | 567000 | 100000 | YES |
| 3 | row3 | 5 | 25 | 1000 | pancreaze | 21000 | 25000 | ROUND(1.1905)=**1** | 21000 | 3 | 63000 | 50000 | YES |
| 4 | row4 | 5 | 10 | 2000 | creon | 12000 | 20000 | ROUND(1.6667)=**2** | 24000 | 6 | 72000 | 50000 | YES |
| 5 | row5 | 5 | 60 | 3000 | zenpep | 10000 | 180000 | ROUND(18.0)=**18** | 180000 | 54 | 540000 | 50000 | YES |
| 6 | row6 | 25 | 25 | 3000 | zenpep | 10000 | 75000 | ROUND(7.5)=**8** *(JS half-away)* | 80000 | 24 | 240000 | 250000 | no |
| 7 | row7 | 25 | 10 | 2000 | pancreaze | 21000 | 20000 | ROUND(0.9524)=**1** | 21000 | 3 | 63000 | 250000 | no |
| 8 | row8 | 25 | 60 | 1000 | creon | 12000 | 60000 | ROUND(5.0)=**5** | 60000 | 15 | 180000 | 250000 | no |

**Verbatim _derivation strings for fixture JSON:**

- row0: `"weight 10kg, fat 25g, lipasePerG 2000, Creon 12000. totalLipase = 25 * 2000 = 50000. capsulesPerDose = ROUND(50000 / 12000) = ROUND(4.1667) = 4. lipasePerDose = 4 * 12000 = 48000. estimatedDailyTotal = 4 * 3 = 12."`
- row1: `"weight 10kg, fat 10g, lipasePerG 1000, Zenpep 10000. totalLipase = 10 * 1000 = 10000. capsulesPerDose = ROUND(10000 / 10000) = ROUND(1.0) = 1. lipasePerDose = 1 * 10000 = 10000. estimatedDailyTotal = 1 * 3 = 3."`
- row2: `"weight 10kg, fat 60g, lipasePerG 3000, Pancreaze 21000. totalLipase = 60 * 3000 = 180000. capsulesPerDose = ROUND(180000 / 21000) = ROUND(8.5714) = 9. lipasePerDose = 9 * 21000 = 189000. estimatedDailyTotal = 9 * 3 = 27."`
- row3: `"weight 5kg, fat 25g, lipasePerG 1000, Pancreaze 21000. totalLipase = 25 * 1000 = 25000. capsulesPerDose = ROUND(25000 / 21000) = ROUND(1.1905) = 1. lipasePerDose = 1 * 21000 = 21000. estimatedDailyTotal = 1 * 3 = 3."`
- row4: `"weight 5kg, fat 10g, lipasePerG 2000, Creon 12000. totalLipase = 10 * 2000 = 20000. capsulesPerDose = ROUND(20000 / 12000) = ROUND(1.6667) = 2. lipasePerDose = 2 * 12000 = 24000. estimatedDailyTotal = 2 * 3 = 6."`
- row5: `"weight 5kg, fat 60g, lipasePerG 3000, Zenpep 10000. totalLipase = 60 * 3000 = 180000. capsulesPerDose = ROUND(180000 / 10000) = ROUND(18.0) = 18. lipasePerDose = 18 * 10000 = 180000. estimatedDailyTotal = 18 * 3 = 54."`
- row6: `"weight 25kg, fat 25g, lipasePerG 3000, Zenpep 10000. totalLipase = 25 * 3000 = 75000. capsulesPerDose = ROUND(75000 / 10000) = ROUND(7.5) = 8 (JS Math.round half-away-from-zero, matches xlsx ROUND). lipasePerDose = 8 * 10000 = 80000. estimatedDailyTotal = 8 * 3 = 24."`
- row7: `"weight 25kg, fat 10g, lipasePerG 2000, Pancreaze 21000. totalLipase = 10 * 2000 = 20000. capsulesPerDose = ROUND(20000 / 21000) = ROUND(0.9524) = 1. lipasePerDose = 1 * 21000 = 21000. estimatedDailyTotal = 1 * 3 = 3."`
- row8: `"weight 25kg, fat 60g, lipasePerG 1000, Creon 12000. totalLipase = 60 * 1000 = 60000. capsulesPerDose = ROUND(60000 / 12000) = ROUND(5.0) = 5. lipasePerDose = 5 * 12000 = 60000. estimatedDailyTotal = 5 * 3 = 15."`

#### Tube-Feed matrix — 18 rows (3 weights {8, 15, 30} × 3 formulas × 2 volumes {800, 1500}); lipasePerG=2500 fixed

Formulas: KF = `kate-farms-ped-std-12` (fatGPerL=48), PS = `pediasure-grow-gain` (fatGPerL=38), PJ = `peptamen-junior-15` (fatGPerL=68). Medications rotate: P=Pancreaze 37000, C=Creon 24000, Z=Zenpep 25000.

| # | name | wt | formula | fatG/L | vol | medication | strength | totalFatG | totalLipase | capsulesPerDay | lipasePerKg (unrounded) | capsulesPerMonth | dailyLipase | cap (wt×10000) | STOP-red? |
|---|------|----|---------|--------|-----|-----------|----------|-----------|-------------|----------------|--------------------------|------------------|-------------|----------------|-----------|
| 0 | row0_xlsx_default | 15 | KF | 48 | 1500 | pancreaze | 37000 | 72.0 | 180000 | ROUND(4.864)=**5** | 12000.0 | **150** | 185000 | 150000 | YES |
| 1 | row1 | 15 | KF | 48 | 800 | creon | 24000 | 38.4 | 96000 | ROUND(4.0)=**4** | 6400.0 | 120 | 96000 | 150000 | no |
| 2 | row2 | 15 | PS | 38 | 1500 | zenpep | 25000 | 57.0 | 142500 | ROUND(5.7)=**6** | 9500.0 | 180 | 150000 | 150000 | no (==, NOT >) |
| 3 | row3 | 15 | PS | 38 | 800 | pancreaze | 37000 | 30.4 | 76000 | ROUND(2.054)=**2** | 5066.667 | 60 | 74000 | 150000 | no |
| 4 | row4 | 15 | PJ | 68 | 1500 | creon | 24000 | 102.0 | 255000 | ROUND(10.625)=**11** | 17000.0 | 330 | 264000 | 150000 | YES |
| 5 | row5 | 15 | PJ | 68 | 800 | zenpep | 25000 | 54.4 | 136000 | ROUND(5.44)=**5** | 9066.667 | 150 | 125000 | 150000 | no |
| 6 | row6 | 8 | KF | 48 | 1500 | creon | 24000 | 72.0 | 180000 | ROUND(7.5)=**8** | 22500.0 | 240 | 192000 | 80000 | YES |
| 7 | row7 | 8 | KF | 48 | 800 | zenpep | 25000 | 38.4 | 96000 | ROUND(3.84)=**4** | 12000.0 | 120 | 100000 | 80000 | YES |
| 8 | row8 | 8 | PS | 38 | 1500 | pancreaze | 37000 | 57.0 | 142500 | ROUND(3.851)=**4** | 17812.5 | 120 | 148000 | 80000 | YES |
| 9 | row9 | 8 | PS | 38 | 800 | creon | 24000 | 30.4 | 76000 | ROUND(3.167)=**3** | 9500.0 | 90 | 72000 | 80000 | no |
| 10 | row10 | 8 | PJ | 68 | 1500 | zenpep | 25000 | 102.0 | 255000 | ROUND(10.2)=**10** | 31875.0 | 300 | 250000 | 80000 | YES |
| 11 | row11 | 8 | PJ | 68 | 800 | pancreaze | 37000 | 54.4 | 136000 | ROUND(3.676)=**4** | 17000.0 | 120 | 148000 | 80000 | YES |
| 12 | row12 | 30 | KF | 48 | 1500 | zenpep | 25000 | 72.0 | 180000 | ROUND(7.2)=**7** | 6000.0 | 210 | 175000 | 300000 | no |
| 13 | row13 | 30 | KF | 48 | 800 | pancreaze | 37000 | 38.4 | 96000 | ROUND(2.595)=**3** | 3200.0 | 90 | 111000 | 300000 | no |
| 14 | row14 | 30 | PS | 38 | 1500 | creon | 24000 | 57.0 | 142500 | ROUND(5.9375)=**6** | 4750.0 | 180 | 144000 | 300000 | no |
| 15 | row15 | 30 | PS | 38 | 800 | zenpep | 25000 | 30.4 | 76000 | ROUND(3.04)=**3** | 2533.333 | 90 | 75000 | 300000 | no |
| 16 | row16 | 30 | PJ | 68 | 1500 | pancreaze | 37000 | 102.0 | 255000 | ROUND(6.892)=**7** | 8500.0 | 210 | 259000 | 300000 | no |
| 17 | row17 | 30 | PJ | 68 | 800 | creon | 24000 | 54.4 | 136000 | ROUND(5.667)=**6** | 4533.333 | 180 | 144000 | 300000 | no |

**Verbatim _derivation strings for fixture JSON (tube rows):**

- row0: `"weight 15kg, formula Kate Farms Pediatric Standard 1.2 (fatGPerL=48), volume 1500mL, lipasePerG 2500, Pancreaze 37000. totalFatG = ROUND(48 * 1500 / 1000, 1) = 72.0. totalLipase = 72.0 * 2500 = 180000. capsulesPerDay = ROUND(180000 / 37000) = ROUND(4.8649) = 5. lipasePerKg (display, calc-layer unrounded) = 180000 / 15 = 12000.0 (xlsx B13 ROUND = 12000). capsulesPerMonth = 5 * 30 = 150."`
- row1: `"weight 15kg, KF (48), volume 800mL, lipasePerG 2500, Creon 24000. totalFatG = ROUND(48*800/1000,1) = ROUND(38.4,1) = 38.4. totalLipase = 38.4*2500 = 96000. capsulesPerDay = ROUND(96000/24000) = ROUND(4.0) = 4. lipasePerKg = 96000/15 = 6400.0. capsulesPerMonth = 4*30 = 120."`
- row2: `"weight 15kg, PediaSure G&G (38), volume 1500mL, lipasePerG 2500, Zenpep 25000. totalFatG = ROUND(38*1500/1000,1) = 57.0. totalLipase = 57.0*2500 = 142500. capsulesPerDay = ROUND(142500/25000) = ROUND(5.7) = 6. lipasePerKg = 142500/15 = 9500.0. capsulesPerMonth = 6*30 = 180."`
- row3: `"weight 15kg, PS (38), volume 800mL, lipasePerG 2500, Pancreaze 37000. totalFatG = ROUND(38*800/1000,1) = 30.4. totalLipase = 30.4*2500 = 76000. capsulesPerDay = ROUND(76000/37000) = ROUND(2.054) = 2. lipasePerKg = 76000/15 = 5066.667. capsulesPerMonth = 2*30 = 60."`
- row4: `"weight 15kg, Peptamen Jr 1.5 (68), volume 1500mL, lipasePerG 2500, Creon 24000. totalFatG = ROUND(68*1500/1000,1) = 102.0. totalLipase = 102.0*2500 = 255000. capsulesPerDay = ROUND(255000/24000) = ROUND(10.625) = 11. lipasePerKg = 255000/15 = 17000.0. capsulesPerMonth = 11*30 = 330."`
- row5: `"weight 15kg, PJ (68), volume 800mL, lipasePerG 2500, Zenpep 25000. totalFatG = ROUND(68*800/1000,1) = 54.4. totalLipase = 54.4*2500 = 136000. capsulesPerDay = ROUND(136000/25000) = ROUND(5.44) = 5. lipasePerKg = 136000/15 = 9066.667. capsulesPerMonth = 5*30 = 150."`
- row6: `"weight 8kg, KF (48), volume 1500mL, lipasePerG 2500, Creon 24000. totalFatG = ROUND(48*1500/1000,1) = 72.0. totalLipase = 72.0*2500 = 180000. capsulesPerDay = ROUND(180000/24000) = ROUND(7.5) = 8 (JS half-away). lipasePerKg = 180000/8 = 22500.0. capsulesPerMonth = 8*30 = 240."`
- row7: `"weight 8kg, KF (48), volume 800mL, lipasePerG 2500, Zenpep 25000. totalFatG = ROUND(48*800/1000,1) = 38.4. totalLipase = 38.4*2500 = 96000. capsulesPerDay = ROUND(96000/25000) = ROUND(3.84) = 4. lipasePerKg = 96000/8 = 12000.0. capsulesPerMonth = 4*30 = 120."`
- row8: `"weight 8kg, PS (38), volume 1500mL, lipasePerG 2500, Pancreaze 37000. totalFatG = ROUND(38*1500/1000,1) = 57.0. totalLipase = 57.0*2500 = 142500. capsulesPerDay = ROUND(142500/37000) = ROUND(3.851) = 4. lipasePerKg = 142500/8 = 17812.5. capsulesPerMonth = 4*30 = 120."`
- row9: `"weight 8kg, PS (38), volume 800mL, lipasePerG 2500, Creon 24000. totalFatG = ROUND(38*800/1000,1) = 30.4. totalLipase = 30.4*2500 = 76000. capsulesPerDay = ROUND(76000/24000) = ROUND(3.167) = 3. lipasePerKg = 76000/8 = 9500.0. capsulesPerMonth = 3*30 = 90."`
- row10: `"weight 8kg, PJ (68), volume 1500mL, lipasePerG 2500, Zenpep 25000. totalFatG = ROUND(68*1500/1000,1) = 102.0. totalLipase = 102.0*2500 = 255000. capsulesPerDay = ROUND(255000/25000) = ROUND(10.2) = 10. lipasePerKg = 255000/8 = 31875.0. capsulesPerMonth = 10*30 = 300."`
- row11: `"weight 8kg, PJ (68), volume 800mL, lipasePerG 2500, Pancreaze 37000. totalFatG = ROUND(68*800/1000,1) = 54.4. totalLipase = 54.4*2500 = 136000. capsulesPerDay = ROUND(136000/37000) = ROUND(3.676) = 4. lipasePerKg = 136000/8 = 17000.0. capsulesPerMonth = 4*30 = 120."`
- row12: `"weight 30kg, KF (48), volume 1500mL, lipasePerG 2500, Zenpep 25000. totalFatG = ROUND(48*1500/1000,1) = 72.0. totalLipase = 72.0*2500 = 180000. capsulesPerDay = ROUND(180000/25000) = ROUND(7.2) = 7. lipasePerKg = 180000/30 = 6000.0. capsulesPerMonth = 7*30 = 210."`
- row13: `"weight 30kg, KF (48), volume 800mL, lipasePerG 2500, Pancreaze 37000. totalFatG = ROUND(48*800/1000,1) = 38.4. totalLipase = 38.4*2500 = 96000. capsulesPerDay = ROUND(96000/37000) = ROUND(2.595) = 3. lipasePerKg = 96000/30 = 3200.0. capsulesPerMonth = 3*30 = 90."`
- row14: `"weight 30kg, PS (38), volume 1500mL, lipasePerG 2500, Creon 24000. totalFatG = ROUND(38*1500/1000,1) = 57.0. totalLipase = 57.0*2500 = 142500. capsulesPerDay = ROUND(142500/24000) = ROUND(5.9375) = 6. lipasePerKg = 142500/30 = 4750.0. capsulesPerMonth = 6*30 = 180."`
- row15: `"weight 30kg, PS (38), volume 800mL, lipasePerG 2500, Zenpep 25000. totalFatG = ROUND(38*800/1000,1) = 30.4. totalLipase = 30.4*2500 = 76000. capsulesPerDay = ROUND(76000/25000) = ROUND(3.04) = 3. lipasePerKg = 76000/30 = 2533.333. capsulesPerMonth = 3*30 = 90."`
- row16: `"weight 30kg, PJ (68), volume 1500mL, lipasePerG 2500, Pancreaze 37000. totalFatG = ROUND(68*1500/1000,1) = 102.0. totalLipase = 102.0*2500 = 255000. capsulesPerDay = ROUND(255000/37000) = ROUND(6.892) = 7. lipasePerKg = 255000/30 = 8500.0. capsulesPerMonth = 7*30 = 210."`
- row17: `"weight 30kg, PJ (68), volume 800mL, lipasePerG 2500, Creon 24000. totalFatG = ROUND(68*800/1000,1) = 54.4. totalLipase = 54.4*2500 = 136000. capsulesPerDay = ROUND(136000/24000) = ROUND(5.667) = 6. lipasePerKg = 136000/30 = 4533.333. capsulesPerMonth = 6*30 = 180."`

#### STOP-red trigger row (per CONTEXT D-08; oral mode; lives outside the 9-row matrix as a dedicated test fixture)

| name | mode | weight | fat | lipG | medication | strength | capsulesPerDose | dailyLipase | cap | result |
|------|------|--------|-----|------|-----------|----------|-----------------|-------------|-----|--------|
| stopRedTrigger | oral | 2 | 50 | 4000 | creon | 6000 | 33 | 594000 | 20000 | **STOP-red fires** |

`_derivation`: `"Deliberate over-cap row. weight 2kg, fat 50g, lipasePerG 4000, Creon 6000. totalLipase = 50 * 4000 = 200000. capsulesPerDose = ROUND(200000 / 6000) = ROUND(33.333) = 33. lipasePerDose = 33*6000 = 198000. estimatedDailyTotal = 33*3 = 99. Daily lipase = 33 * 6000 * 3 = 594000. Cap = 2 * 10000 = 20000. 594000 > 20000 -> STOP-red max-lipase-cap advisory fires."`

> **NOTE on STOP-red coverage from the matrix:** Per the table above, **9 of the 27 matrix rows ALSO trigger the STOP-red cap** (oral rows 0/2/3/4/5; tube rows 0/4/6/7/8/10/11). This is incidental — the matrix was designed for input-axis variety (D-03), not for advisory coverage. The dedicated `stopRedTrigger` row is the **named, documented STOP-red fixture** that PERT-TEST-03's component test references in its STOP-red advisory assertion. The matrix rows that incidentally trigger the cap are tested via `closeEnough` on the result fields only — the advisory-firing semantics are tested ONCE via the dedicated `stopRedTrigger` row + the `getTriggeredAdvisories` test block.

### Example D: PertCalculator.test.ts skeleton (output surface; D-07)

```typescript
// Source pattern: src/lib/feeds/FeedAdvanceCalculator.test.ts (adapted for PERT)
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PertCalculator from './PertCalculator.svelte';
import { pertState } from './state.svelte.js';

describe('PertCalculator — output surface', () => {
  beforeEach(() => {
    pertState.reset();
  });

  it('does not render input fields itself (extracted to PertInputs per Phase 2 D-07)', () => {
    render(PertCalculator);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('shows Oral empty-state hero copy when fat is null', () => {
    pertState.current.weightKg = 10;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = null;
    render(PertCalculator);
    expect(screen.getByText(/Enter weight and fat grams/)).toBeTruthy();
  });

  it('shows Tube-Feed empty-state hero copy when formula null', () => {
    pertState.current.mode = 'tube-feed';
    pertState.current.weightKg = 15;
    pertState.current.medicationId = 'pancreaze';
    pertState.current.strengthValue = 37000;
    pertState.current.tubeFeed.formulaId = null;
    render(PertCalculator);
    expect(screen.getByText(/Enter weight and select a formula/)).toBeTruthy();
  });

  it('renders Oral hero capsulesPerDose with class="num" when fixture row 0 inputs set', () => {
    pertState.current.weightKg = 10;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = 25;
    pertState.current.oral.lipasePerKgPerMeal = 2000;
    render(PertCalculator);
    // Hero numeral row appears with capsulesPerDose=4 (xlsx default)
    const heroNumeral = screen.getByText('4', { selector: '.num' });
    expect(heroNumeral).toBeTruthy();
  });

  it('renders Oral tertiary "Estimated daily total (3 meals/day)" eyebrow', () => {
    pertState.current.weightKg = 10;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = 25;
    pertState.current.oral.lipasePerKgPerMeal = 2000;
    render(PertCalculator);
    expect(screen.getByText('Estimated daily total (3 meals/day)')).toBeTruthy();
  });

  it('does NOT render tertiary in Tube-Feed mode (Oral-only per D-09)', () => {
    pertState.current.mode = 'tube-feed';
    pertState.current.weightKg = 15;
    pertState.current.medicationId = 'pancreaze';
    pertState.current.strengthValue = 37000;
    pertState.current.tubeFeed.formulaId = 'kate-farms-ped-std-12';
    pertState.current.tubeFeed.volumePerDayMl = 1500;
    pertState.current.tubeFeed.lipasePerKgPerDay = 2500;
    render(PertCalculator);
    expect(screen.queryByText('Estimated daily total (3 meals/day)')).toBeNull();
  });

  it('renders Tube-Feed Capsules per month secondary (D-12: capsulesPerDay × 30)', () => {
    pertState.current.mode = 'tube-feed';
    pertState.current.weightKg = 15;
    pertState.current.medicationId = 'pancreaze';
    pertState.current.strengthValue = 37000;
    pertState.current.tubeFeed.formulaId = 'kate-farms-ped-std-12';
    pertState.current.tubeFeed.volumePerDayMl = 1500;
    pertState.current.tubeFeed.lipasePerKgPerDay = 2500;
    render(PertCalculator);
    expect(screen.getByText('Capsules per month')).toBeTruthy();
    // capsulesPerMonth = 5 * 30 = 150 → toLocaleString → "150"
    expect(screen.getByText('150', { selector: '.num' })).toBeTruthy();
  });

  it('STOP-red advisory fires with role="alert" + aria-live="assertive" when daily lipase > weight × 10000', () => {
    // Use the dedicated stopRedTrigger fixture (oral, weight=2, fat=50, lipG=4000, Creon 6000)
    pertState.current.weightKg = 2;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 6000;
    pertState.current.oral.fatGrams = 50;
    pertState.current.oral.lipasePerKgPerMeal = 4000;
    render(PertCalculator);
    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveTextContent(/Exceeds 10,000 units.kg.day cap/i);
  });

  it('warning advisory uses role="note" (NOT role="alert")', () => {
    // Trigger weight-out-of-range warning (config range: min 0.5, max 50)
    pertState.current.weightKg = 60;  // out-of-range high
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = 25;
    pertState.current.oral.lipasePerKgPerMeal = 1000;
    render(PertCalculator);
    expect(screen.queryByRole('alert')).toBeNull();
    const notes = screen.getAllByRole('note');
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.some((n) => n.textContent?.includes('Outside expected pediatric range'))).toBe(true);
  });

  it('hides secondaries on empty state', () => {
    pertState.current.weightKg = 10;  // weight only — no medication/strength/fat
    render(PertCalculator);
    expect(screen.queryByText('Total lipase needed')).toBeNull();
    expect(screen.queryByText('Lipase per dose')).toBeNull();
  });
});
```

### Example E: PertInputs.test.ts skeleton (input wiring; D-07 + D-11 + D-14)

```typescript
// Source pattern: src/lib/feeds/FeedAdvanceInputs.test.ts (adapted for PERT)
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PertInputs from './PertInputs.svelte';
import { pertState } from './state.svelte.js';

describe('PertInputs — input wiring', () => {
  beforeEach(() => {
    pertState.reset();
  });

  it('renders Weight + mode toggle in shared card', () => {
    render(PertInputs);
    expect(screen.getByLabelText('Weight')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Oral/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Tube-Feed/i })).toBeTruthy();
  });

  it('Oral mode renders Fat per meal + Lipase per gram of fat inputs', () => {
    pertState.current.mode = 'oral';
    render(PertInputs);
    expect(screen.getByLabelText('Fat per meal')).toBeTruthy();
    // Both Oral and Tube-Feed have a "Lipase per gram of fat" input — 1 visible per mode.
    const lipaseLabels = screen.getAllByLabelText(/Lipase per gram of fat/);
    expect(lipaseLabels).toHaveLength(1);
  });

  it('Tube-Feed mode renders Formula (searchable) + Volume + Lipase per gram of fat inputs', () => {
    pertState.current.mode = 'tube-feed';
    render(PertInputs);
    expect(screen.getByLabelText('Volume per day')).toBeTruthy();
    expect(screen.getByLabelText('Formula')).toBeTruthy();
    expect(screen.getAllByLabelText(/Lipase per gram of fat/)).toHaveLength(1);
  });

  it('clicking Tube-Feed tab updates pertState.current.mode (binding test)', async () => {
    pertState.current.weightKg = 10;
    render(PertInputs);
    const tubeFeedTab = screen.getByRole('tab', { name: /Tube-Feed/i });
    await fireEvent.click(tubeFeedTab);
    expect(pertState.current.mode).toBe('tube-feed');
    // Shared input preserved across mode switch (PERT-MODE-03)
    expect(pertState.current.weightKg).toBe(10);
  });

  it('mode-switch preserves shared inputs (weight/medication/strength) per D-07', async () => {
    pertState.current.mode = 'oral';
    pertState.current.weightKg = 10;
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    pertState.current.oral.fatGrams = 25;
    pertState.current.oral.lipasePerKgPerMeal = 2000;
    render(PertInputs);
    // Switch to Tube-Feed
    await fireEvent.click(screen.getByRole('tab', { name: /Tube-Feed/i }));
    expect(pertState.current.mode).toBe('tube-feed');
    expect(pertState.current.weightKg).toBe(10);
    expect(pertState.current.medicationId).toBe('creon');
    expect(pertState.current.strengthValue).toBe(12000);
    // Mode-specific Oral inputs preserved (read from pertState.current.oral, not lost)
    expect(pertState.current.oral.fatGrams).toBe(25);
    expect(pertState.current.oral.lipasePerKgPerMeal).toBe(2000);
  });

  it('D-11: changing medicationId resets strengthValue to null', async () => {
    pertState.current.medicationId = 'creon';
    pertState.current.strengthValue = 12000;
    render(PertInputs);
    // Simulate medication change (the $effect lastMedId tracker fires on cur !== last)
    pertState.current.medicationId = 'zenpep';
    // Effect runs synchronously inside Svelte runes batch; assert post-flush
    await Promise.resolve();
    expect(pertState.current.strengthValue).toBeNull();
  });

  it('D-14: every numeric input has inputmode="decimal"', () => {
    render(PertInputs);
    const numericInputs = screen.getAllByRole('spinbutton');
    expect(numericInputs.length).toBeGreaterThan(0);
    for (const input of numericInputs) {
      expect(input).toHaveAttribute('inputmode', 'decimal');
    }
  });
});
```

### Example F: e2e/pert.spec.ts skeleton (D-10 + D-11 + D-13 + D-14)

```typescript
// Source pattern: e2e/feeds.spec.ts + e2e/favorites-nav.spec.ts (adapted for PERT)
import { test, expect, type Page } from '@playwright/test';

function getInputsScope(page: Page, viewport: 'mobile' | 'desktop') {
  if (viewport === 'mobile') {
    return page.getByRole('dialog', { name: 'PERT inputs' });
  }
  return page.locator('aside[aria-label="PERT inputs"]');
}

for (const viewport of [
  { name: 'mobile' as const, width: 375, height: 667 },
  { name: 'desktop' as const, width: 1280, height: 800 }
]) {
  test.describe(`PERT happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    const isDesktop = viewport.width >= 768;

    test.beforeEach(async ({ page }) => {
      // Pre-clear PERT state + favorites to ensure each test starts fresh.
      await page.addInitScript(() => {
        localStorage.removeItem('nicu_pert_state');
        localStorage.removeItem('nicu_pert_state_ts');
      });
      await page.goto('/pert');
      await page.getByRole('button', { name: /understand/i }).click({ timeout: 2000 }).catch(() => {});
      if (viewport.name === 'mobile') {
        await page.getByRole('button', { name: /tap to edit inputs/i }).click();
      }
    });

    test('Oral mode happy path: fixture row 0 produces capsulesPerDose=4', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      // Already in Oral mode by default (state.svelte.ts defaultState).
      await scope.getByLabel('Weight', { exact: true }).fill('10');
      await scope.getByLabel('Fat per meal').fill('25');
      await scope.getByLabel('Lipase per gram of fat').fill('2000');
      // Medication picker (SelectPicker dialog)
      await scope.getByRole('button', { name: /select medication/i }).click();
      await page.getByRole('option', { name: /Creon/ }).click();
      // Strength picker (filtered by medication)
      await scope.getByRole('button', { name: /select strength/i }).click();
      await page.getByRole('option', { name: /12,000 units/ }).click();
      if (viewport.name === 'mobile') await page.keyboard.press('Escape');
      // Hero numeral = 4 (capsulesPerDose for xlsx default oral row)
      await expect(page.getByText('4', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('capsules/dose')).toBeVisible();
    });

    test('Tube-Feed mode happy path: fixture row 0 produces capsulesPerDay=5 + capsulesPerMonth=150', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await scope.getByRole('tab', { name: /Tube-Feed/i }).click();
      await scope.getByLabel('Weight', { exact: true }).fill('15');
      // Formula picker (searchable; type to filter)
      await scope.getByRole('button', { name: /select formula/i }).click();
      await page.getByRole('searchbox').fill('Kate Farms');
      await page.getByRole('option', { name: /Kate Farms Pediatric Standard 1\.2/ }).click();
      await scope.getByLabel('Volume per day').fill('1500');
      await scope.getByLabel('Lipase per gram of fat').fill('2500');
      await scope.getByRole('button', { name: /select medication/i }).click();
      await page.getByRole('option', { name: /Pancreaze/ }).click();
      await scope.getByRole('button', { name: /select strength/i }).click();
      await page.getByRole('option', { name: /37,000 units/ }).click();
      if (viewport.name === 'mobile') await page.keyboard.press('Escape');
      await expect(page.getByText('5', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('capsules/day')).toBeVisible();
      // Capsules per month = 150
      await expect(page.getByText('Capsules per month')).toBeVisible();
      await expect(page.getByText('150')).toBeVisible();
    });

    test('mode-switch state preservation', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      // Fill Oral inputs.
      await scope.getByLabel('Weight', { exact: true }).fill('10');
      await scope.getByLabel('Fat per meal').fill('25');
      await scope.getByLabel('Lipase per gram of fat').fill('2000');
      // Switch to Tube-Feed.
      await scope.getByRole('tab', { name: /Tube-Feed/i }).click();
      // Weight preserved across modes (PERT-MODE-03).
      await expect(scope.getByLabel('Weight', { exact: true })).toHaveValue('10');
      // Switch back to Oral.
      await scope.getByRole('tab', { name: /Oral/i }).click();
      // Oral-specific inputs restored.
      await expect(scope.getByLabel('Fat per meal')).toHaveValue('25');
      await expect(scope.getByLabel('Lipase per gram of fat')).toHaveValue('2000');
    });

    test('localStorage round-trip: reload restores form values', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await scope.getByLabel('Weight', { exact: true }).fill('10');
      await scope.getByLabel('Fat per meal').fill('25');
      await scope.getByLabel('Lipase per gram of fat').fill('2000');
      // Verify localStorage was written before reload.
      const stored = await page.evaluate(() => localStorage.getItem('nicu_pert_state'));
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.weightKg).toBe(10);
      expect(parsed.oral.fatGrams).toBe(25);
      expect(parsed.oral.lipasePerKgPerMeal).toBe(2000);
      // Reload and assert form values restored. NOTE: addInitScript in beforeEach
      // would clear state on reload — this test must NOT use the default beforeEach
      // (or override the addInitScript to set it before reload, mirroring favorites-nav).
      // Implementation: use a separate test.describe block with its own beforeEach that
      // does NOT pre-clear, OR re-set the stored value via addInitScript before reload.
    });

    test('every numeric input has inputmode="decimal" (PERT-TEST-05 / D-14)', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await expect(scope.getByLabel('Weight', { exact: true })).toHaveAttribute('inputmode', 'decimal');
      await expect(scope.getByLabel('Fat per meal')).toHaveAttribute('inputmode', 'decimal');
      await expect(scope.getByLabel('Lipase per gram of fat')).toHaveAttribute('inputmode', 'decimal');
    });
  });

  // Favorites round-trip (mirrors e2e/favorites-nav.spec.ts:69 FAV-TEST-03-2)
  test.describe(`PERT favorites round-trip (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    const isDesktop = viewport.width >= 768;

    test('favorite PERT → reload → /pert appears in nav', async ({ page }) => {
      // Pre-state: 3 of the 4 alphabetical defaults so a 4th slot is open.
      await page.addInitScript(() => {
        localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['feeds', 'formula', 'gir'] }));
      });
      await page.goto('/pert');
      await page.getByRole('button', { name: /understand/i }).click({ timeout: 2000 }).catch(() => {});
      // Open hamburger and add PERT.
      await page.getByRole('button', { name: 'Open calculator menu' }).click();
      await page.getByRole('dialog').waitFor({ state: 'visible' });
      await page.getByRole('button', { name: /add pert to favorites/i }).click();
      await page.keyboard.press('Escape');
      // Bar shows 4 tabs; PERT is one of them.
      const nav = isDesktop
        ? page.locator('nav[aria-label="Calculator navigation"]').first()
        : page.locator('nav[aria-label="Calculator navigation"]').last();
      const tabs = nav.getByRole('tab');
      await expect(tabs).toHaveCount(4);
      await expect(nav.getByRole('tab', { name: /pert/i })).toBeVisible();
      // localStorage persists.
      const stored = await page.evaluate(() => localStorage.getItem('nicu:favorites'));
      expect(JSON.parse(stored!).ids).toContain('pert');
    });
  });
}
```

### Example G: PERT-TEST-04 integration delta (in calculations.test.ts)

```typescript
// PERT-TEST-04 closure per CONTEXT D-09: ONE integration test wires fixture row 0
// through getMedicationById + getFormulaById + getStrengthsForMedication into
// computeOralResult / computeTubeFeedResult to prove the config wrapper feeds the
// calc layer end-to-end.

import { getMedicationById, getFormulaById, getStrengthsForMedication } from './config.js';

describe('PERT-TEST-04 config-to-calc integration (D-09 delta)', () => {
  it('Oral fixture row 0: config accessors → computeOralResult produces fixture-expected', () => {
    const med = getMedicationById('creon');
    expect(med).toBeDefined();
    expect(med!.brand).toBe('Creon');
    const strengths = getStrengthsForMedication('creon');
    expect(strengths).toContain(12000);
    const result = computeOralResult({
      fatGrams: 25,
      lipasePerKgPerMeal: 2000,
      strengthValue: 12000
    });
    expect(result.capsulesPerDose).toBe(4);
    expect(result.totalLipase).toBe(50000);
  });

  it('Tube fixture row 0: config accessors → computeTubeFeedResult produces fixture-expected', () => {
    const formula = getFormulaById('kate-farms-ped-std-12');
    expect(formula).toBeDefined();
    expect(formula!.fatGPerL).toBe(48);
    const result = computeTubeFeedResult({
      formulaFatGPerL: formula!.fatGPerL,
      volumePerDayMl: 1500,
      lipasePerKgPerDay: 2500,
      weightKg: 15,
      strengthValue: 37000
    });
    expect(result.capsulesPerDay).toBe(5);
    expect(result.capsulesPerMonth).toBe(150);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ROADMAP "weight 22 lbs ≈ 9.98 kg + Creon 12000 + 25g fat + 1000 lipase/kg" | xlsx default `weight=10kg, fat=25g, lipasePerG=2000, Creon 12000` (Oral); `weight=15kg, KateFarms-48, vol=1500mL, lipasePerG=2500, Pancreaze-37000` (Tube) | Phase 2 xlsx live-read 2026-04-25 (CONTEXT D-04, D-05) | ROADMAP wording is doc drift; Phase 3 fixtures honor xlsx, not ROADMAP |
| ROADMAP "Kate Farms Pediatric Standard 1.2 at 40 g/L" | Kate Farms Pediatric Standard 1.2 at **48 g/L** (verified xlsx + live read this session) | Phase 1 Plan 01-03 clinical-data corrections | Fixture row 0 expected values use 48, not 40 |
| ROADMAP "sessionStorage `nicu:pert:mode` schema `{v:1, mode}`" | localStorage `nicu_pert_state` blob | Phase 1 D-09 reinterpretation | Phase 3 e2e tests localStorage, not sessionStorage |
| ROADMAP "axe suite from 33/33 to 35/35" | Phase 1 added 4 PERT axe sweeps (synthetic + literal × light + dark); pert-a11y subset is 4/4 | Phase 1 Plan 01-02 + 01-04 | PERT-TEST-06 already complete; Phase 3 verifies 4/4 stays green |
| REQUIREMENTS PERT-ORAL-06 `(weight × lipasePerKg) / strength` | xlsx fat-based `(fatGrams × lipasePerG) / strength` | Phase 2 D-15 user-locked 2026-04-25 | Calc layer reproduces xlsx formula; fixture expected = ROUND(fat×lipG/strength) |
| REQUIREMENTS PERT-TUBE-06 `× weight` multiplier | xlsx tube `(fatGPerL × vol/1000) × lipasePerG / strength` | Phase 2 D-16 user-locked 2026-04-25 | Calc layer reproduces xlsx formula; fixture expected uses xlsx-canonical math |

**Deprecated/outdated:**
- REQUIREMENTS PERT-ORAL-06 + PERT-TUBE-06 wording (Phase 5 release cleanup).
- ROADMAP Phase 3 success criterion #1 + #2 (cell labels, weight-in-lbs, fatGPerL=40, sessionStorage) — Phase 5 release cleanup.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The dialog `aria-label` for the desktop aside is `"PERT inputs"` (matches mobile drawer title `"PERT inputs"`) — verified via `+page.svelte:105` (`aria-label="PERT inputs"`) and `+page.svelte:115` (`title="PERT inputs"`). | Pattern 4 (e2e scope helper) | LOW — verified in source. |
| A2 | The hamburger button's accessible name is `"Open calculator menu"` (verified via favorites-nav.spec.ts:48 + HamburgerMenu.svelte source). | Example F (favorites round-trip) | LOW — verified. |
| A3 | The favorite-toggle button's aria-label is `"Add PERT to favorites"` when not favorited and not at cap (verified via HamburgerMenu.svelte:117-118). When at-cap, the label changes to `"Add PERT to favorites (limit reached. Remove one to add another.)"` — Phase 3 e2e MUST pre-clear favorites to a 3-item subset to avoid the cap variant. | Example F + Pitfall 7 | LOW — verified. |
| A4 | `Math.round(7.5)` returns 8 in JavaScript (half-away-from-zero), matching xlsx ROUND. Row 6 and tube row 6 fixture expected values rely on this. | Code Examples §Fixture Matrix + Pitfall 3 | LOW — JS spec is unambiguous (`Math.round` rounds half-positive UP). |
| A5 | `Math.round(7.5)` and `Math.round(-7.5)` are NOT symmetric in JS (`Math.round(-7.5) = -7`, not -8). No fixture in the matrix involves negative inputs (all weights/fats are positive), so this is not material. | Pitfall 3 (defensive note) | NONE — not exercised. |
| A6 | `closeEnough` with EPSILON=0.01 + ABS_FLOOR=0.5 absorbs the `lipasePerKg` unrounded-vs-xlsx-rounded discrepancy (max gap = 0.5; absolute floor = 0.5; `<=` test in helper passes). | Pitfall 1 + lipasePerKg fixture column | LOW — math works out. |
| A7 | The 9 of 27 matrix rows that incidentally trigger STOP-red do NOT cause the parity tests to fail — `closeEnough` only asserts result-field math, not advisory firing. The dedicated `stopRedTrigger` row is the ONE fixture that exercises advisory firing. | Code Examples §Fixture Matrix + Example D | LOW — separation of concerns is clean. |
| A8 | The em-dash ban in DESIGN.md:312 forbids em-dashes in **user-rendered strings, aria-label, screen-reader copy** — NOT in test files / comments. Phase 1 + Phase 2 plans applied the ban broadly because their `grep "—"` acceptance gates were comment-blind. Phase 3 plans should continue this convention to keep the project signature uniform. | Pitfall 10 + Open Question Q1 | LOW — strict reading exempts test files; pragmatic convention applies the ban anyway. Decision flagged for discuss-phase. |
| A9 | The `strengthValue=null` reset in PertInputs.test.ts test "D-11: changing medicationId resets strengthValue to null" can be observed via a `Promise.resolve()` await between mutation + assertion. Svelte 5 `$effect` runs synchronously inside a microtask flush; `await Promise.resolve()` flushes the queue. | Example E | LOW — Svelte 5 effect timing semantics are well-defined; consistent with feeds component test patterns. |
| A10 | `calculations.ts` does NOT round `lipasePerKg` (calc-layer line 144 = `totalLipase / weightKg`, no Math.round) — but `PertCalculator.svelte:277` wraps it in `Math.round` for display. Fixture's `expected.lipasePerKg` uses the unrounded value (matches calc-layer return). | Pitfall 1 | LOW — verified in calculations.ts source. |

**If this table is empty:** Not the case — 10 assumptions documented above. None are blocking; all are LOW risk and either verified directly or follow from documented Svelte/JS semantics.

## Open Questions

1. **Q1: Em-dash convention in test files (DESIGN.md scope)**
   - What we know: DESIGN.md:312 bans em-dashes in user-rendered strings + aria-label + screen-reader copy. Phase 1 + Phase 2 plan acceptance gates extended this to comments via comment-blind `grep "—"`.
   - What's unclear: Should Phase 3 plan acceptance gates continue the broad ban (comments + strings), or restrict to user-rendered output (matching DESIGN.md strict reading)?
   - Recommendation: **Continue the broad ban for uniformity.** Phase 3 plan acceptance gates use `grep "—"` returning empty across all NEW test files. Adds zero work (just write ASCII colons/periods) and matches Phase 1 + Phase 2 convention. If user wants to relax this for tests, lock as Phase 3 D-decision.

2. **Q2: localStorage round-trip test design (addInitScript collision with reload)**
   - What we know: `e2e/favorites-nav.spec.ts:6-7` documents that `addInitScript` runs on every navigation including reload — the REMOVE script in beforeEach would re-clear state on reload, defeating round-trip.
   - What's unclear: Should the localStorage round-trip test (a) skip the default beforeEach pre-clear, (b) use a separate top-level test.describe block, or (c) re-set the state via a SET script before reload?
   - Recommendation: **Split into a separate `test.describe` block** that does NOT use the default pre-clear beforeEach. The block fills state, evaluates `localStorage.getItem('nicu_pert_state')` to assert pre-reload, then reloads (without addInitScript REMOVE in beforeEach), then asserts inputs are restored. Cleaner than option (c). Planner picks topology.

3. **Q3: Should Phase 3 add a Wave-3 verification gate that the existing 105/106 Playwright baseline is preserved?**
   - What we know: Phase 1 + Phase 2 verifiers asserted 105/106 (the 1 baseline flake is `disclaimer-banner.spec.ts:28` pre-existing).
   - What's unclear: Phase 3's `e2e/pert.spec.ts` is NEW — running full `CI=1 pnpm exec playwright test` will execute it AND every other spec. The expectation should be 105/106 + (NEW `e2e/pert.spec.ts` count). Each viewport-loop test in pert.spec.ts produces 2 entries (mobile + desktop); the favorites round-trip block adds 2 more. Estimated new count: 5 happy-path × 2 viewports + 2 favorites = 12 new.
   - Recommendation: **YES** — Phase 3 verification gate runs `CI=1 pnpm exec playwright test` and asserts: (a) `pert-a11y` 4/4, (b) `pert.spec.ts` ALL green (no flakes), (c) total Playwright count = 105 + 12 (new) = 117 with the same 1 baseline flake. Plan locks the new count at plan-time after the spec is drafted.

4. **Q4: Should `lipasePerKg` fixture values use the unrounded (calc-layer) form or the xlsx-rounded form?**
   - What we know: calc-layer returns unrounded; xlsx B13 stores rounded; closeEnough EPSILON=0.01 + ABS_FLOOR=0.5 absorbs the difference.
   - What's unclear: Pure documentation choice — which representation is more useful in the fixture for a future reader?
   - Recommendation: **Use the unrounded value** (matches what `computeTubeFeedResult` returns; the test asserts the calc-layer return). Add `_xlsxB13Rounded` field to the JSON for cross-reference if reviewer wants xlsx parity at a glance. Planner picks. (Default: unrounded only, no extra field.)

5. **Q5: Should the STOP-red component test use the dedicated `stopRedTrigger` fixture row OR pick one of the matrix rows that incidentally trigger?**
   - What we know: 9 of 27 matrix rows trigger STOP-red; one row (`stopRedTrigger`, oral, weight=2/fat=50/lipG=4000/Creon 6000) is dedicated as the named STOP-red fixture per CONTEXT D-08.
   - What's unclear: Pure naming/documentation choice for the component test.
   - Recommendation: **Use the dedicated `stopRedTrigger` fixture** in the component test for clarity. The matrix rows that incidentally trigger are not named or documented as STOP-red; the dedicated row is.

6. **Q6: Should Phase 3 add a STOP-red trigger fixture for tube-feed mode too?**
   - What we know: CONTEXT D-08 names ONE oral STOP-red trigger; tube-feed has natural triggers in the matrix (rows 0/4/6/7/8/10/11).
   - What's unclear: Symmetry — should the dedicated trigger row exist for tube-feed too?
   - Recommendation: **Optional**. The matrix's natural tube triggers (e.g., row 0: `dailyLipase=185000 > cap=150000`) suffice for testing the cap firing in tube-feed mode. If symmetry is preferred, add a `stopRedTriggerTubeFeed` row using the same pattern: weight=2 + KF (48) + vol=1500 + lipG=2500 + Pancreaze 37000 (would yield: totalFatG=72, totalLipase=180000, capsulesPerDay=ROUND(180000/37000)=5, dailyLipase=5×37000=185000, cap=2×10000=20000, fires). Planner picks.

7. **Q7: Should Wave 0 include a `pnpm test:run` baseline preservation check?**
   - What we know: Phase 1 + Phase 2 verifiers asserted 361/361 vitest (38 files; same as Phase 1 baseline). Phase 3 ships ~3 new vitest files (calculations.test.ts + 2 component tests) which will grow the count to ~38 + 3 = 41 files (and +N tests).
   - What's unclear: Should each wave's verification gate assert "all pre-existing tests still green + N new tests green" or just "all tests green"?
   - Recommendation: **Each wave asserts (a) all prior-phase 361 tests still green, (b) new test files all green.** This catches accidental Phase-1-frozen modifications (e.g., `state.test.ts` accidentally edited).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | (from project — implicit, see CLAUDE.md) | — |
| pnpm | All | ✓ | ^10.33.0 (CLAUDE.md) | — |
| vitest | calc + component tests | ✓ | 4.1.4 (verified `package.json` 2026-04-25) | — |
| @testing-library/svelte | component tests | ✓ | 5.3.1 | — |
| @playwright/test | e2e + axe | ✓ | 1.59.1 | — |
| @axe-core/playwright | axe verification | ✓ | 4.11.2 | — |
| Playwright Chromium browser | e2e + axe | ✓ | (already installed; Phase 1 + Phase 2 ran 105/106) | — |
| jsdom (vitest env) | component tests | ✓ | bundled with vitest 4.x | — |
| Python 3 + openpyxl (research-only) | xlsx fixture extraction (this RESEARCH session) | ✓ | (used inline this session) | — (NOT a runtime dep; fixture authoring is one-time) |
| `epi-pert-calculator.xlsx` | research-only (fixture authoring) | ✓ | workstream root, copied 2026-04-25 (CONTEXT D-18) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.4 + @testing-library/svelte 5.3.1 (jsdom env via `vite.config.ts:60-65`) + Playwright 1.59.1 + @axe-core/playwright 4.11.2 |
| Config file | `vite.config.ts` (vitest config inlined at lines 60-65: `globals: true, environment: 'jsdom', include: ['src/**/*.{test,spec}.{js,ts}'], setupFiles: ['src/test-setup.ts']`); `playwright.config.ts` for e2e |
| Quick run command | `pnpm test:run src/lib/pert/` (PERT-only vitest, ~17/17 + new tests) |
| Full suite command | `pnpm svelte-check && pnpm test:run && CI=1 pnpm exec playwright test && pnpm build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERT-TEST-01 | Oral parity within 1% epsilon (≥ 9 fixtures including row 0 = xlsx default) | unit | `pnpm test:run src/lib/pert/calculations.test.ts -t "Oral parity"` | ❌ Wave 0 (fixture JSON) + Wave 1 (calculations.test.ts) |
| PERT-TEST-02 | Tube-Feed parity within 1% epsilon (≥ 18 fixtures including row 0 = xlsx default) | unit | `pnpm test:run src/lib/pert/calculations.test.ts -t "Tube-Feed parity"` | ❌ Wave 0 + Wave 1 |
| PERT-TEST-03 | Component tests for PertCalculator + PertInputs covering empty / Oral / Tube-Feed / mode-switch / advisories / max-lipase firing | component | `pnpm test:run src/lib/pert/PertCalculator.test.ts src/lib/pert/PertInputs.test.ts` | ❌ Wave 1 |
| PERT-TEST-04 | Config shape (already covered by Phase 1 11-test config.test.ts; Phase 3 adds ONE integration test in calculations.test.ts) | unit (existing) + integration delta (new) | `pnpm test:run src/lib/pert/config.test.ts` (existing) + `pnpm test:run src/lib/pert/calculations.test.ts -t "config-to-calc integration"` (new delta) | ✅ Phase 1 (frozen) + ❌ Wave 1 (delta added in calculations.test.ts) |
| PERT-TEST-05 | Playwright E2E happy path mobile + desktop both modes + inputmode + favorites + localStorage | e2e | `CI=1 pnpm exec playwright test pert.spec.ts` | ❌ Wave 2 |
| PERT-TEST-06 | Axe sweeps light + dark for `/pert` (Phase-1-frozen; Phase 3 verifies regression-free) | e2e (axe) | `CI=1 pnpm exec playwright test pert-a11y --reporter=line` (4/4) | ✅ Phase 1 (frozen) — Phase 3 verifies stays green |

### Sampling Rate

- **Per task commit:** `pnpm test:run src/lib/pert/` (≤ 5s, runs PERT-only vitest)
- **Per wave merge:** `pnpm svelte-check && pnpm test:run` (full vitest, all 38 + 3 new files)
- **Per e2e wave:** `CI=1 pnpm exec playwright test pert.spec.ts pert-a11y` (PERT-scoped Playwright)
- **Phase gate:** `pnpm svelte-check && pnpm test:run && CI=1 pnpm exec playwright test && pnpm build` (full clinical gate green)

### Wave 0 Gaps

- [ ] `src/lib/pert/pert-parity.fixtures.json` — covers PERT-TEST-01 + PERT-TEST-02 (NEW; 27 hand-derived rows + 1 stopRedTrigger row)
- [ ] `src/lib/pert/calculations.test.ts` — covers PERT-TEST-01 + PERT-TEST-02 + PERT-TEST-04 delta (NEW; parity matrix + advisory engine + integration delta)
- [ ] `src/lib/pert/PertCalculator.test.ts` — covers PERT-TEST-03 output surface (NEW)
- [ ] `src/lib/pert/PertInputs.test.ts` — covers PERT-TEST-03 input wiring + D-11 + D-14 (NEW)
- [ ] `e2e/pert.spec.ts` — covers PERT-TEST-05 (NEW)

(All Wave-0 / Wave-1 / Wave-2 gaps; nothing else needed — vitest config + Playwright config + test-setup.ts are already wired.)

*(Framework install: NONE needed — vitest, @testing-library/svelte, @playwright/test, @axe-core/playwright all already in `package.json`.)*

## Project Constraints (from CLAUDE.md)

- **Tech stack pin:** SvelteKit 2 + Svelte 5 + Tailwind CSS 4 + Vite + pnpm. No new test runner; mirror existing.
- **No native:** PWA only.
- **Offline-first:** All clinical data embedded; xlsx is research-time only (no runtime dep).
- **Accessibility WCAG 2.1 AA:** Axe sweeps already shipped (Phase 1); Phase 3 must NOT regress.
- **Touch targets 48px:** Already enforced in shared components; e2e doesn't re-test.
- **Code reuse:** Mirror feeds + gir + uac-uvc patterns; no new test utilities or shared helpers introduced in Phase 3.

## Project Constraints (from DESIGN.md)

- **Em-dash ban (line 312):** Forbidden in user-rendered strings, aria-label, screen-reader copy. Phase 1 + Phase 2 plan convention applies the ban broadly to comments via comment-blind `grep "—"` acceptance gates; Phase 3 should continue this convention (Pitfall 10 + Open Question Q1).
- **Identity-Inside Rule:** Component tests do NOT need to verify identity color (jsdom does not compute layout); axe sweeps (Phase 1, frozen) cover this.
- **Tabular numerics (`class="num"` on numerical outputs):** Component tests assert `screen.getByText('4', { selector: '.num' })` to verify the class is applied to hero/secondary numerals.
- **Red-Means-Wrong with PERT-SAFE-01 carve-out:** STOP-red advisory uses `--color-error` border + `OctagonAlert` + `role="alert"`. Component test asserts these specifically (Example D §STOP-red advisory test).

## Sources

### Primary (HIGH confidence)

- **xlsx live read** (this session, openpyxl `data_only=False`): cell formulas verified verbatim — Pediatric PERT Tool sheet `B10`/`B11`, Pediatric Tube Feed PERT sheet `B12..B15`. xlsx defaults: oral lipasePerG=2000, tube lipasePerG=2500, Kate Farms fatGPerL=48.
- **CONTEXT.md D-01..D-15** at `.planning/workstreams/pert/phases/03-tests/03-CONTEXT.md` — locked decisions framing all of Phase 3.
- **Phase 1 + Phase 2 outputs** (`01-CONTEXT.md` D-09/D-10, `02-CONTEXT.md` D-15/D-16/D-12/D-02/D-17/D-03/D-04, `02-02-SUMMARY.md`, `02-03-SUMMARY.md`, `02-04-SUMMARY.md`).
- **Live Phase 1+2 source** at `src/lib/pert/calculations.ts` (verified Math.round semantics + defensive zero-return + advisory engine), `PertInputs.svelte` (verified string-bridge SelectPicker pattern + D-11 reset + aria-label/labels), `PertCalculator.svelte` (verified empty-state input gate + STOP-red render + role="alert"/"note"), `state.svelte.ts` (verified localStorage key `nicu_pert_state` + STORAGE_KEY constant).
- **CLAUDE.md** (project tech-stack pin) and **DESIGN.md** (em-dash ban line 312, Identity-Inside Rule, Red-Means-Wrong + STOP-red carve-out).
- **vite.config.ts** (vitest config inlined at lines 60-65 — globals: true, jsdom env, src/test-setup.ts setup file).
- **playwright.config.ts** (CI=1 → port 4173 with `pnpm run build && pnpm run preview`; CI=0 → port 5173 with `pnpm run dev`).
- **Test analogs (HIGH confidence — read this session):**
  - `src/lib/feeds/calculations.test.ts:23-31` — closeEnough helper verbatim.
  - `src/lib/feeds/feeds-parity.fixtures.json` — fixture shape (`_comment` + `_cellRefs` + per-named-key `{input, expected, _derivation}`).
  - `src/lib/feeds/FeedAdvanceCalculator.test.ts` (106 lines) — output-surface component test pattern with `feedsState.reset()` in beforeEach.
  - `src/lib/feeds/FeedAdvanceInputs.test.ts` (54 lines) — input-wiring component test pattern with mode-toggle binding + fireEvent.click.
  - `src/lib/gir/calculations.test.ts:1-80` + `gir-parity.fixtures.json` — second-source parity pattern.
  - `e2e/feeds.spec.ts` (98 lines) — viewport-loop + getInputsScope helper.
  - `e2e/favorites-nav.spec.ts:1-167` — favorites round-trip + addInitScript pattern + nav locator (first/last).
  - `e2e/disclaimer-banner.spec.ts:48-51` — addInitScript + setItem pattern for pre-state.
  - `src/lib/shell/HamburgerMenu.svelte:113-118` — favorite-toggle aria-label exact wording (`Add ${calc.label} to favorites`).
  - `src/lib/shared/components/NumericInput.svelte:157` — `inputmode="decimal"` already on every numeric input.
  - `src/lib/shared/favorites.svelte.ts:9` — favorites localStorage key `nicu:favorites`.
- **`src/lib/pert/config.test.ts`** (Phase-1-frozen, 11 tests) — verified: shape tests cover medication count + strengths-allowlist + formula count + lipase rates + advisory count + STOP severity + FDA filter + accessor functions. PERT-TEST-04 already mostly covered.
- **`src/lib/pert/state.test.ts`** (Phase-1-frozen, 6 tests) — verified: defaults + persist+restore + defensive merge + reset.
- **`e2e/pert-a11y.spec.ts`** (Phase-1-frozen, 4 tests) — verified: 4 axe sweeps (synthetic light + synthetic dark + literal /pert light + literal /pert dark). PERT-TEST-06 already complete.

### Secondary (MEDIUM confidence)

- **Existing component test patterns in feeds + gir + uac-uvc** consulted but not all read line-by-line (only feeds for Pattern 3 + 4 verbatim sourcing).
- **Phase 2 RESEARCH.md xlsx-extraction methodology** referenced from CONTEXT canonical refs but not re-read (D-18 + D-15 already lock the methodology).

### Tertiary (LOW confidence)

- None. Every claim above is verified against project source code or xlsx live-read.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — all 5 packages already in package.json + node_modules; versions verified.
- Architecture: **HIGH** — feeds/gir/uac-uvc analogs are read-and-confirmed; Phase 3 mirrors them.
- Pitfalls: **HIGH** — every pitfall is grounded in source observations (Math.round semantics, `pertState` singleton scope, two-mount `<PertInputs />` pattern, em-dash ban precedent, etc.).
- Fixture matrix correctness: **HIGH** — math hand-derived from xlsx-canonical formulas + verified against D-05 anchors; row-0 anchors match Phase 2 02-02-SUMMARY's smoke-test computations exactly.
- E2E selectors / aria-labels: **HIGH** — every selector/label cited has a source-line reference (PertInputs.svelte / +page.svelte / HamburgerMenu.svelte).
- Validation Architecture mapping: **HIGH** — every PERT-TEST-* requirement maps to a runnable command + identified file.

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (30 days; stack is stable, but Phase 4/5 may invalidate "PERT-TEST-04 already covered" if config.test.ts is touched in Phase 4 polish — check if config-related changes ship before this research is consumed)

---

*Phase: 03-tests*
*Workstream: pert*
*Researched: 2026-04-25*
*xlsx live-read this session: openpyxl `data_only=False` against `epi-pert-calculator.xlsx` (workstream root, copied 2026-04-25). Cell formulas verbatim verified.*
*All 27 fixture rows hand-derived; row 0 anchors cross-checked against Phase 2 D-05 + 02-02-SUMMARY smoke tests.*
