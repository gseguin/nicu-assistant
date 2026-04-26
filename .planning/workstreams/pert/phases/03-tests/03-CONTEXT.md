# Phase 3: Tests — Context

**Gathered:** 2026-04-25
**Status:** Ready for planning
**Source:** /gsd-discuss-phase --auto (15 gray areas auto-resolved with recommended defaults; user should review D-01..D-15 below before /gsd-plan-phase locks them)

<domain>
## Phase Boundary

Phase 3 ships test coverage for the calc layer + components shipped in Phase 1 + Phase 2. It does NOT modify any production code. The phase grows the project's test surface to match the depth of the v1.8 GIR / v1.12 Feeds / v1.13 UAC-UVC milestones, locks xlsx-canonical math against parity fixtures, exercises both modes through component + e2e tests, and confirms the 4 PERT axe sweeps already shipped in Phase 1 stay green.

**In scope:**
- `src/lib/pert/calculations.test.ts` — pure-function unit tests + spreadsheet-parity vitest fixtures (Oral 3×3 = 9 + Tube-Feed 3×3×2 = 18 = 27 fixtures total).
- `src/lib/pert/pert-parity.fixtures.json` — hand-derived xlsx cell values, anchor row 0 = xlsx default, no implementation-derived numbers.
- `src/lib/pert/PertCalculator.test.ts` — component tests (hero, secondaries, tertiary, STOP-red advisory, warning advisory, empty-state).
- `src/lib/pert/PertInputs.test.ts` — component tests (SegmentedToggle binding, formula/medication/strength picker behavior, D-11 medication-change strength reset).
- Possibly a small additive vitest in `src/lib/pert/config.test.ts` to wire fixture row 0 end-to-end through config + calc (planner decides if needed; most of PERT-TEST-04 already covered by Phase 1 shape tests).
- `e2e/pert.spec.ts` — Playwright E2E happy path at mobile 375 + desktop 1280, both modes, mode-switch state preservation, favorites round-trip, localStorage round-trip, `inputmode="decimal"` regression guard.

**Out of scope (declared complete-by-prior-phase):**
- **PERT-TEST-06** (axe sweeps) — Phase 1 Plan 01-02 + 01-04 already shipped 4 PERT axe sweeps (synthetic light + dark + literal `/pert` light + dark) all green first run, no `disableRules`. Phase 3 verifies the count via `CI=1 pnpm exec playwright test pert-a11y` returning 4/4 and declares PERT-TEST-06 satisfied; no new axe specs.
- **Config shape tests** (most of PERT-TEST-04) — Phase 1 `config.test.ts` ships 11 tests including FDA-allowlist hostile-injection. Phase 3 may add a single end-to-end wiring test but does not re-test what Phase 1 already covers.

**Out of scope (Phase 4+):**
- Design polish / `/impeccable` critique sweep (PERT-DESIGN-*) — Phase 4.
- Release artifacts (version bump, AboutSheet version reflect, ROADMAP completion, REQUIREMENTS wording cleanup) — Phase 5.

</domain>

<decisions>
## Implementation Decisions

**Status:** /gsd-discuss-phase --auto produced D-01..D-15 [auto-recommended] on 2026-04-25. The xlsx live read this session resolved several documentation drifts (cell mapping B10 / B11 / B14 / B15, Kate Farms fatGPerL=48 not 40, weight=15 not 6.80 in lbs); decisions below cite the actual xlsx, not the ROADMAP wording. Planner should treat all D-XX as authoritative.

### Test framework

- **D-01 [auto]:** Component + unit tests use **vitest 4.1.2 + @testing-library/svelte** (jsdom env). Mirrors `src/lib/feeds/FeedAdvanceCalculator.test.ts` + `FeedAdvanceInputs.test.ts` + `calculations.test.ts` exactly. E2E uses **Playwright 1.58.2**, mirroring `e2e/feeds.spec.ts` + `e2e/feeds-a11y.spec.ts` (already shipped for PERT in Phase 1). NO Playwright Component Tests, NO new test framework.

### Parity epsilon contract

- **D-02 [auto]:** Spreadsheet-parity tests use the same `closeEnough(actual, expected)` helper as `src/lib/feeds/calculations.test.ts:25-31`:
  - `EPSILON = 0.01` (1% relative).
  - `ABS_FLOOR = 0.5` (catches zero-vs-one boundary; capsule counts are integers but the helper is shared with non-integer secondaries like `lipasePerKg`).
  - `if (absDiff <= ABS_FLOOR) return true; if (expected === 0) return absDiff < EPSILON; return Math.abs(absDiff / expected) <= EPSILON;`
- ROADMAP success criteria say "within 1% epsilon" — D-02 honors this verbatim with the abs-floor accommodation.

### Fixture matrix shape

- **D-03 [auto]:** Oral fixture matrix = 9 rows minimum (3 weights × 3 fat-grams). Weights: 5, 10, 25 kg (covers neonate / xlsx-default / large pediatric). Fat-grams: 10, 25, 60 g (covers low / xlsx-default / high). lipasePerGramOfFat: vary 1000 / 2000 / 3000 across rows for picker variety. Medication × strength: rotate Creon 12000 (xlsx default) / Zenpep 10000 / Pancreaze 21000 across rows. Row 0 = xlsx default verbatim.
- Tube-Feed fixture matrix = 18 rows minimum (3 weights × 3 formulas × 2 volumes). Weights: 8, 15, 30 kg (covers small pediatric / xlsx-default / large pediatric). Formulas: Kate Farms Pediatric Standard 1.2 (fatGPerL=48, xlsx default) / PediaSure Grow & Gain (fatGPerL=38) / Peptamen Junior 1.5 (fatGPerL=68 — high-fat). Volumes: 800 mL, 1500 mL (1500 = xlsx default). lipasePerGramOfFat = 2500 (xlsx default for tube). Medication × strength: rotate Pancreaze 37000 (xlsx default) / Creon 24000 / Zenpep 25000.
- Total fixture count: **9 oral + 18 tube = 27 rows**, exceeding ROADMAP "≥3×3 + ≥3×3×2" minimum.

### Cell-mapping ground truth (xlsx live read)

- **D-04 [auto-from-xlsx]:** xlsx cell mapping (verified via openpyxl this session against `epi-pert-calculator.xlsx` at workstream root):
  - **Pediatric PERT Tool (oral) sheet:** `B10` = capsulesPerDose (formula `=ROUND(B9/B8,0)` where `B9 = B5*B6` total lipase, `B8` = strength). **`B11` = max-lipase cap** (formula `=B4*10000` where `B4` = weight). NOT capsules.
  - **Pediatric Tube Feed PERT sheet:** `B12` = total lipase (formula `=B8*B9`). `B13` = lipase per kg (formula `=ROUND(B12/B4,0)`). `B14` = capsules per day (formula `=ROUND(B12/B11,0)`). `B15` = capsules per month (formula `=B14*30`).
- ROADMAP success criterion 1 + 2 wording cites `B11` / `B13` / `B14` for capsules — wrong on oral (correct cell is B10) and partially correct on tube (B14 is right; B13 is lipase-per-kg, not capsules; capsulesPerMonth is B15 not B14). Phase 3 fixture JSON `_cellRefs` comment cites the **actual** xlsx cells. ROADMAP cleanup deferred to Phase 5 per workstream-completion pattern.

### xlsx-default fixture row 0 (canonical anchor)

- **D-05 [auto-from-xlsx live read]:** Fixture row 0 anchors per mode:
  - **Oral row 0 (xlsx default):** weight=10 kg, fat=25 g, lipasePerGramOfFat=2000, medication=Creon, strength=12000. Hand-computed: `totalLipase = 25 × 2000 = 50000`; `capsulesPerDose = ROUND(50000 / 12000) = ROUND(4.167) = 4`; `lipasePerDose = 4 × 12000 = 48000`; `estimatedDailyTotal = 4 × 3 = 12`. Expected B10 = **4 capsules**.
  - **Tube row 0 (xlsx default):** weight=15 kg, formula="Kate Farms Pediatric Standard 1.2" (fatGPerL=48 — xlsx live read; ROADMAP wording "40 g/L" is wrong), volume=1500 mL, lipasePerGramOfFat=2500, medication=Pancreaze, strength=37000. Hand-computed: `totalFatG = ROUND(48 × 1500 / 1000, 1) = 72.0`; `totalLipase = 72 × 2500 = 180000`; `capsulesPerDay = ROUND(180000 / 37000) = ROUND(4.864) = 5`; `lipasePerKg = ROUND(180000 / 15) = 12000`; `capsulesPerMonth = 5 × 30 = 150`. Expected B14 = **5 capsules/day**, B15 = **150 capsules/month**, B13 = **12000 lipase per kg**.
- These row-0 anchors are HARD-LOCKED — every other fixture row varies one or more inputs but row 0 must reproduce the xlsx default verbatim or the parity gate fails.

### Fixture authoring methodology

- **D-06 [auto]:** Fixtures live at `src/lib/pert/pert-parity.fixtures.json`. Mirror `src/lib/feeds/feeds-parity.fixtures.json` shape: top-level `_comment` ("NEVER edit to match code changes"), `_cellRefs` (xlsx cell map), then per-row `{input: {...}, expected: {...}, _derivation: "..."}`. **All `expected` values are HAND-DERIVED** by applying the xlsx-canonical formulas (D-15/D-16 from Phase 2 CONTEXT) to the input row — NOT copied from running calculations.ts. The point of parity tests is independence from the implementation.
- Each row carries an explicit `_derivation` string showing the math (e.g., `"50000 / 12000 = 4.167 → ROUND → 4"`).

### Component-test scope split

- **D-07 [auto]:** Two test files mirror the feeds split:
  - `src/lib/pert/PertCalculator.test.ts`: hero (capsulesPerDose / capsulesPerDay numeral renders with `class="num"`); secondary outputs (totalLipase, lipasePerDose for Oral; totalFatG / totalLipase / lipasePerKg / capsulesPerMonth for Tube); tertiary "Estimated daily total (3 meals/day)" rendered ONLY in Oral mode; STOP-red advisory card renders below hero with `border-[var(--color-error)]` + `OctagonAlert` icon + `role="alert"` when the cap fires; warning advisory renders neutral (existing feeds pattern); empty-state hero copy (`validationMessages.emptyOral` / `emptyTubeFeed`); secondaries hidden in empty state.
  - `src/lib/pert/PertInputs.test.ts`: SegmentedToggle binding (clicking toggle flips `pertState.current.mode`); medication picker selection updates `pertState.current.medicationId` AND resets `strengthValue` to null (D-11); strength picker filtered by selected medication (only `getStrengthsForMedication(medicationId)` values appear); formula picker shows all 17 options + filters via search (per UI-SPEC searchable=true); `inputmode="decimal"` present on every numeric input; mode-switch preserves shared inputs (weight/medication/strength), restores mode-specific inputs (fat/formula/volume/lipasePerGramOfFat) from the correct sub-object.
- **NOT covered (already Phase-1-frozen):** the SHARED `<SegmentedToggle>` component's keyboard nav (←/→/Home/End) is unit-tested in `src/lib/shared/components/SegmentedToggle.test.ts`; Phase 3 does not re-test what's already covered. PertInputs.test.ts asserts the BINDING (toggle activation flips mode), not the keyboard mechanism.

### Calc-layer pure-function tests

- **D-08 [auto]:** `src/lib/pert/calculations.test.ts` (NEW) covers:
  - Spreadsheet-parity matrix (D-03 fixture rows iterated through `computeOralResult` / `computeTubeFeedResult`, asserted via `closeEnough` D-02).
  - Defensive zero-return: null inputs → `{capsulesPerDose: 0, ...}`; NaN/Infinity → 0; ≤0 → 0 (per D-02 from Phase 2 CONTEXT).
  - `getTriggeredAdvisories` semantics: max-lipase fires when `dailyLipase > weightKg × 10000`; range advisories fire from JSON config; severity-DESC ordering (D-10); empty-state input set hides all advisories (returns []).
  - **STOP-red trigger fixture:** at least one fixture row that's deliberately above the 10000 cap (e.g., weight=2 kg + fat=50 g + lipasePerG=4000 + Creon 6000 → totalLipase=200000, capsulesPerDose=33, dailyLipase=33×6000×3=594000, cap = 2×10000=20000 → fires).

### Config integration delta (PERT-TEST-04 closure)

- **D-09 [auto]:** PERT-TEST-04 success criterion ("every medication has brand + strengths[]; every formula has name + fatGPerL; no out-of-FDA-set strength values surviving the load filter") is **already covered by Phase 1 `src/lib/pert/config.test.ts` (11 tests including FDA-allowlist hostile-injection)**. Phase 3 adds a SINGLE integration-style test in `calculations.test.ts` wiring fixture row 0's `medicationId` + `formulaId` lookups through `getMedicationById`/`getFormulaById`/`getStrengthsForMedication` into the calc layer end-to-end. This proves the config wrapper feeds the calc layer correctly. No new file at `config.test.ts`; Phase 1's 11 tests stay frozen.

### E2E spec topology

- **D-10 [auto]:** NEW `e2e/pert.spec.ts` (mirrors `e2e/feeds.spec.ts`) covers:
  - **Happy path Oral mode** at mobile 375 × desktop 1280: navigate `/pert` → fill weight + fat + lipasePerG + select medication + select strength → assert hero shows expected capsulesPerDose for fixture row 0 inputs.
  - **Happy path Tube-Feed mode** at mobile 375 × desktop 1280: switch SegmentedToggle to Tube-Feed → fill weight + select formula + volume + lipasePerG + medication + strength → assert hero shows expected capsulesPerDay for tube row 0 inputs.
  - **Mode-switch state preservation:** in Oral mode, fill weight=10 + medication=Creon + strength=12000; switch to Tube-Feed; assert weight + medication + strength preserved; switch back to Oral; assert original Oral inputs (fat + lipasePerG) restored.
  - **Favorites round-trip:** open hamburger → favorite "PERT" → reload → confirm pert appears in bottom-nav 4-cap (mirror `e2e/favorites-nav.spec.ts:69` FAV-TEST-03-2 pattern).
  - **localStorage round-trip:** fill all required Oral inputs → reload → assert form re-renders with same values (D-09 reinterpretation per Phase 1: spec said sessionStorage `nicu:pert:mode`, actual implementation uses single localStorage blob `nicu_pert_state`).
  - **`inputmode="decimal"` regression guard:** `await expect(page.getByRole('spinbutton').first()).toHaveAttribute('inputmode', 'decimal')` for every numeric input.
- Existing `e2e/pert-a11y.spec.ts` UNCHANGED — Phase 1 shipped 4 axe sweeps; Phase 3 verifies they stay green.

### Storage round-trip semantics (D-09 reinterpretation)

- **D-11 [auto]:** Phase 3 e2e tests **localStorage** round-trip (key `nicu_pert_state`) — the actual implementation per Phase 1 D-09. The original ROADMAP wording "sessionStorage round-trip (`nicu:pert:mode` schema `{v:1, mode}`)" is documentation drift superseded by Phase 1 D-09 + Phase 2's working calculator. Test reads `localStorage.getItem('nicu_pert_state')` after input changes and asserts the JSON shape contains the entered values. Phase 5 release updates the ROADMAP wording.

### Axe-suite already complete (PERT-TEST-06 closure)

- **D-12 [auto]:** **PERT-TEST-06 is already satisfied by Phase 1 Plan 01-02 + 01-04.** The 4 axe sweeps in `e2e/pert-a11y.spec.ts` (synthetic light + synthetic dark + literal `/pert` light + literal `/pert` dark) all pass on first run with no `disableRules`. Phase 3 declares PERT-TEST-06 complete-by-prior-phase. Phase 3's verification gate runs `CI=1 pnpm exec playwright test pert-a11y --reporter=line` and asserts 4/4 to confirm no regression.
- The ROADMAP success criterion 4 wording "extended axe suite grows from 33/33 to 35/35" is arithmetic drift — the v1.13 baseline was 33; Phase 1 added 4 PERT axe tests (not 2); today the extended a11y glob runs 30/30 per Phase 1 verifier (or 4/4 for the pert-a11y subset). The "33/33 → 35/35" framing is documentation noise and is corrected to: "axe suite extended by 4 PERT sweeps at Phase 1; Phase 3 verifies they stay green." Phase 5 release updates ROADMAP wording.

### Favorites round-trip protocol

- **D-13 [auto]:** Mirror `e2e/favorites-nav.spec.ts:69` FAV-TEST-03-2. Steps:
  1. Pre-clear localStorage `nicu_favorites` + `nicu_pert_state` via `addInitScript`.
  2. Navigate `/pert`.
  3. Open hamburger menu.
  4. Click "Favorite PERT" (or equivalent — confirm exact text/aria-label by reading `src/lib/shell/HamburgerMenu.svelte` during planning).
  5. Reload page.
  6. Assert mobile bottom-nav (`<md`) or desktop top-nav (`>=md`) contains a link to `/pert`.
- This is a pert-specific assertion grafted onto the existing favorites-nav infrastructure. The full favorites store / hamburger / first-run-defaults coverage already exists in `e2e/favorites-nav.spec.ts`.

### inputmode="decimal" regression guard

- **D-14 [auto]:** In `e2e/pert.spec.ts`, after rendering each numeric input on `/pert`, assert `inputmode="decimal"` via `await expect(input).toHaveAttribute('inputmode', 'decimal')`. The shared `<NumericInput>` already renders this attribute (project convention); the test is a regression guard ensuring future changes don't accidentally drop it.

### xlsx fixture extraction methodology

- **D-15 [auto]:** Use Python + openpyxl with `data_only=False` to extract formula strings (not last-saved cached values). Hand-compute expected values per fixture row by applying D-15/D-16 (Phase 2 CONTEXT xlsx-canonical formulas) + D-02 (Math.round). Document each row with a `_derivation` string showing the math. Fixtures are independent of the live `calculations.ts` implementation (matches feeds-parity.fixtures.json convention `"_comment": "NEVER edit to match code changes"`).

### Claude's Discretion

- File-level layout for fixture rows (single big JSON object vs. per-mode sub-arrays) — planner picks; mirror feeds-parity.fixtures.json shape (per-named-key sub-objects with `input` + `expected` + `_derivation`).
- Whether `calculations.test.ts` exposes a single `describe('parity', ...)` block or splits into `describe('Oral parity', ...)` + `describe('Tube-Feed parity', ...)` — planner picks; the latter likely reads cleaner.
- Whether the STOP-red component test uses `screen.getByRole('alert')` or a more specific selector — planner picks; `role="alert"` is in the UI-SPEC § STOP-red detail.
- Whether to mock `localStorage` in component tests vs. let it persist — feeds tests reset state via `feedsState.reset()` in `beforeEach`; mirror with `pertState.reset()`.
- Exact wave structure — likely 3 waves: W0 fixture authoring (JSON only), W1 calc-layer + component tests (parallel), W2 e2e + verification (depends on W0 + W1). Planner refines.

### Folded Todos

None — no pending todos matched Phase 3 scope.

</decisions>

<specifics>
## Specific Ideas

- **xlsx is the parity authority.** The fixture JSON `expected` values are hand-derived from D-15/D-16 formulas applied to the input row, NOT copied from `pnpm test` output. If a Phase-3 fixture row's expected value disagrees with what `calculations.ts` produces, the calc layer is buggy (and the test should fail) — never the fixture. The whole point of spreadsheet-parity is independence.
- **The xlsx defaults are clinical-data-corrected.** Phase 1 Plan 01-03's deviations (Zenpep 60000 + Pancreaze 37000 strengths added; 11 of 17 formula `fatGPerL` corrected) are now the live `pert-config.json` values, and the xlsx live read agrees with those corrections. Kate Farms Pediatric Standard 1.2 = **48 g/L** (NOT 40 from ROADMAP); xlsx-default tube fixture uses Pancreaze 37000 (which Phase 1 added).
- **PERT-TEST-04 + PERT-TEST-06 are already mostly/fully satisfied by Phase 1.** Phase 3 verifies and declares complete-by-prior-phase; the test phase is smaller than the ROADMAP-as-written suggests. The actual new test surface is calc-parity + components + e2e happy-path + favorites/localStorage round-trips.
- **D-09 (Phase 1) reinterpretation matters here.** ROADMAP says sessionStorage `nicu:pert:mode`; reality is single localStorage blob `nicu_pert_state`. Phase 3 e2e tests the actual implementation. Don't be confused by the ROADMAP wording — it's stale.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workstream-local

- `.planning/workstreams/pert/PROJECT.md`
- `.planning/workstreams/pert/REQUIREMENTS.md` — Phase 3 owns PERT-TEST-01..06 (note: PERT-TEST-04 mostly Phase-1-covered; PERT-TEST-06 fully Phase-1-covered per D-09 + D-12 above)
- `.planning/workstreams/pert/ROADMAP.md` § "Phase 3: Tests" (note: cell labels, fatGPerL=40, sessionStorage wording all stale; see D-04 / D-05 / D-11 for ground truth)
- `.planning/workstreams/pert/STATE.md` — Phase 1 + Phase 2 outcomes + the 4 doc-drift items deferred to Phase 5

### Phase 1 outputs (foundation)

- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-CONTEXT.md` — D-09 storage-key reinterpretation, D-10 state shape
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-03-SUMMARY.md` — clinical-data corrections (Zenpep 60000, Pancreaze 37000, 11 fatGPerL fixes including Kate Farms 48 g/L)
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-04-SUMMARY.md` — pert-a11y.spec.ts activated (4/4 axe sweeps)
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/VERIFICATION.md` — 14/14 reqs verified

### Phase 2 outputs (foundation)

- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-CONTEXT.md` — D-15 oral formula, D-16 tube formula, D-02 Math.round, D-12 capsulesPerMonth × 30, D-18 xlsx parity authority at workstream root
- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-RESEARCH.md` — xlsx live read evidence; canonical fixture row inputs + expected
- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-02-SUMMARY.md` — calculations.ts surface (computeOralResult, computeTubeFeedResult, getTriggeredAdvisories, MAX_LIPASE_PER_KG_PER_DAY)
- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-03-SUMMARY.md` — PertInputs.svelte surface (string-bridge proxies, mode-conditional inputs, D-11 strength reset)
- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-04-SUMMARY.md` — PertCalculator.svelte body + +page.svelte mount-twice pattern
- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/VERIFICATION.md` — 23/23 reqs verified, 4 quality gates

### Project-level (constraints)

- `CLAUDE.md`
- `DESIGN.md` — em-dash ban applies to any new test-file message strings
- `vitest.config.ts` (project root)
- `playwright.config.ts` (project root)

### Source of clinical truth

- `epi-pert-calculator.xlsx` (workstream root) — Phase 3 reads via openpyxl during fixture authoring; no runtime dependency

### Closest codebase analogs (Phase 3 mirrors these)

- `src/lib/feeds/calculations.test.ts` — closest analog for parity-fixture wiring + closeEnough helper (lines 25-31)
- `src/lib/feeds/feeds-parity.fixtures.json` — fixture JSON shape (top-level _comment + _cellRefs + per-named-key {input, expected, _derivation})
- `src/lib/feeds/FeedAdvanceCalculator.test.ts` — component test pattern (hero + advisories)
- `src/lib/feeds/FeedAdvanceInputs.test.ts` — input-component test pattern (mode toggle binding, picker behavior)
- `src/lib/gir/calculations.test.ts` + `gir-parity.fixtures.json` — second analog
- `e2e/feeds.spec.ts` — happy-path E2E pattern (viewport loop mobile 375 + desktop 1280; getInputsScope helper for desktop-aside-vs-drawer)
- `e2e/feeds-a11y.spec.ts` — axe-spec pattern (already mirrored at e2e/pert-a11y.spec.ts in Phase 1)
- `e2e/favorites-nav.spec.ts` — favorites round-trip pattern (FAV-TEST-03-2 at line 69)
- `e2e/disclaimer-banner.spec.ts` — localStorage pre-clear pattern (addInitScript)

### Live Phase 1+2 code (Phase 3 reads + tests, never modifies)

- `src/lib/pert/calculations.ts` (NEW Phase 2; Phase 3 tests this)
- `src/lib/pert/PertCalculator.svelte` (Phase 2; Phase 3 tests this)
- `src/lib/pert/PertInputs.svelte` (NEW Phase 2; Phase 3 tests this)
- `src/lib/pert/state.svelte.ts` (Phase 1; Phase 3 reads via `pertState.reset()` in `beforeEach`)
- `src/lib/pert/types.ts` (Phase 1 + additive Phase 2)
- `src/lib/pert/config.ts` (Phase 1; Phase 3 may import for integration test)
- `src/lib/pert/pert-config.json` (Phase 1 + em-dash fix Phase 2)
- `src/lib/pert/config.test.ts` (Phase 1 — 11 tests; Phase 3 does NOT modify)
- `src/lib/pert/state.test.ts` (Phase 1 — 6 tests; Phase 3 does NOT modify)
- `src/routes/pert/+page.svelte` (Phase 2; Phase 3 navigates to `/pert`)
- `e2e/pert-a11y.spec.ts` (Phase 1; Phase 3 verifies stays green, does NOT modify)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`closeEnough(actual, expected)` helper** at `src/lib/feeds/calculations.test.ts:25-31` — Phase 3 copies verbatim into `src/lib/pert/calculations.test.ts` (or extracts to a shared util if Phase 3 finds a clean home; planner decides). EPSILON=0.01, ABS_FLOOR=0.5.
- **`pertState.reset()` in `beforeEach`** — mirrors `feedsState.reset()` pattern. State singleton is module-scoped; reset between tests prevents bleed.
- **`getInputsScope(page, viewport)` helper** at `e2e/feeds.spec.ts:8-15` — pattern for resolving the desktop-aside-vs-mobile-drawer locator. Phase 3 e2e mirrors with `aria-label="PERT inputs"` (or whatever PertInputs ships per Phase 2 — confirm during planning).
- **`addInitScript` for localStorage pre-clear** at `e2e/favorites-nav.spec.ts:36+` — Phase 3 uses for clearing `nicu_pert_state` and `nicu_favorites` before localStorage round-trip tests.
- **`page.getByRole('alert')`** for STOP-red advisory — Phase 2 D-04 + UI-SPEC §STOP-red render with `role="alert"`.

### Established Patterns

- **Fixture JSON `_comment` lock** — every parity-fixture file in the project carries `"_comment": "...NEVER edit to match code changes"`. Phase 3 honors this; fixtures are derivation-locked.
- **Per-route e2e split: `<route>.spec.ts` (happy path) + `<route>-a11y.spec.ts` (axe)** — already established. Phase 1 shipped pert-a11y; Phase 3 ships pert.spec.ts.
- **Viewport loop in e2e** — `for (const vp of [{name:'mobile',...},{name:'desktop',...}])` — every functional spec runs both. Phase 3 mirrors.
- **Component test split: Calculator.test.ts (output surface) + Inputs.test.ts (input wiring)** — feeds + gir + uac-uvc all do this. Phase 3 mirrors.
- **CI=1 for authoritative Playwright runs** — Phase 1 + Phase 2 verifiers used `CI=1 pnpm exec playwright test` to bypass dev-server reuse from sibling clone (port 5173). Phase 3 e2e + axe verification gates use CI=1.

### Integration Points

- **`src/lib/pert/calculations.test.ts`** — NEW. Imports `computeOralResult` / `computeTubeFeedResult` / `getTriggeredAdvisories` from `./calculations.js`; imports fixtures from `./pert-parity.fixtures.json`.
- **`src/lib/pert/pert-parity.fixtures.json`** — NEW.
- **`src/lib/pert/PertCalculator.test.ts`** — NEW. Imports `PertCalculator` + `pertState`; uses `@testing-library/svelte`'s `render` + `screen`.
- **`src/lib/pert/PertInputs.test.ts`** — NEW. Imports `PertInputs` + `pertState`.
- **`e2e/pert.spec.ts`** — NEW. Mirrors feeds.spec.ts viewport-loop + getInputsScope pattern.

</code_context>

<deferred>
## Deferred Ideas

- **Spreadsheet-parity test for the STOP-red advisory firing** — covered in `calculations.test.ts` D-08 STOP-red trigger fixture.
- **Adult Oral / Adult Tube Feed PERT modes** — out of scope for v1.15 entirely.
- **Per-meal historical logging** — out of scope.
- **Custom formula entry** — out of scope.
- **ROADMAP wording cleanup (cell labels, Kate Farms fatGPerL=40 → 48, sessionStorage → localStorage, "33/33 → 35/35" arithmetic)** — Phase 5 release cleanup per the 4 doc-drift items already tracked in workstream STATE.md.

### Reviewed Todos (not folded)

None — no pending todos matched Phase 3 scope.

</deferred>

---

*Phase: 03-tests*
*Context gathered: 2026-04-25 via /gsd-discuss-phase --auto*
*All D-XX decisions auto-recommended; user should review before /gsd-plan-phase locks them. Key xlsx-canonical inputs (D-04, D-05) verified live this session via openpyxl read of `epi-pert-calculator.xlsx`.*
