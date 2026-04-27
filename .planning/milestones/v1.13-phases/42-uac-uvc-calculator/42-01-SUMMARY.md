---
phase: 42-uac-uvc-calculator
plan: 01
subsystem: calculator
tags:
  - svelte
  - sveltekit
  - oklch
  - identity-tokens
  - calculator
  - parity-tests
  - tdd

# Dependency graph
requires:
  - phase: 40-favorites-store-hamburger-menu
    provides: Registry-driven hamburger menu + favorites-slice defaults behavior that keeps UAC/UVC off the first-run bar
  - phase: 41-favorites-driven-navigation
    provides: Registry-driven activeCalculatorId resolution (no NavShell edits needed for /uac-uvc)
provides:
  - Wave 0 scaffolding for the fifth calculator (UAC/UVC umbilical catheter depth)
  - CalculatorId union extended with 'uac-uvc'; identityClass union extended with 'identity-uac'
  - Registry entry #5 (last) with Ruler icon, href /uac-uvc, identity-uac class
  - .identity-uac OKLCH token pair at hue 350 (light + dark) — locked quartet, zero retune
  - src/lib/uac-uvc/ module — types, config (defaults 2.5 kg), pure calculateUacDepth / calculateUvcDepth / calculateUacUvc, sessionStorage-backed uacUvcState singleton, parity fixtures for 5 weights
  - /uac-uvc route shell with Ruler header + onMount state init + placeholder calculator slot
  - AboutSheet entry 'uac-uvc' citing xlsx B3/B7 with imaging-confirmation caveat (UAC-09)
  - UAC-TEST-01 parity tests (5 weights × 2 formulas) + aggregator null-handling + config shape
affects:
  - 42-02 (UI plan — builds UacUvcCalculator.svelte on top of this module; only two-line swap to route)
  - 42-03 (E2E plan — navigates to /uac-uvc already rendering Ruler header)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mirror-from-GIR pattern for new calculator modules (types/config/calcs/state all 1:1 analogs of src/lib/gir/)"
    - "Locked-OKLCH quartet per identity hue — pasted verbatim from UI-SPEC, never retuned during execution"
    - "sessionStorage singleton with three silent try/catch blocks (invalid JSON, quota exceeded, private browsing) — shipped pattern re-used verbatim"
    - "Array-of-cases parity fixture variant ({cases: [{input, expected}, ...]}) for multi-weight validation"

key-files:
  created:
    - src/lib/uac-uvc/types.ts
    - src/lib/uac-uvc/uac-uvc-config.json
    - src/lib/uac-uvc/uac-uvc-config.ts
    - src/lib/uac-uvc/uac-uvc-config.test.ts
    - src/lib/uac-uvc/calculations.ts
    - src/lib/uac-uvc/calculations.test.ts
    - src/lib/uac-uvc/uac-uvc-parity.fixtures.json
    - src/lib/uac-uvc/state.svelte.ts
    - src/routes/uac-uvc/+page.svelte
  modified:
    - src/lib/shared/types.ts
    - src/lib/shell/registry.ts
    - src/app.css
    - src/lib/shared/about-content.ts
    - src/lib/shell/__tests__/registry.test.ts
    - src/lib/shell/HamburgerMenu.test.ts

key-decisions:
  - "Tasks 1 committed as a single feat() commit even with 4 files touched — Record<CalculatorId, AboutContent> exhaustiveness compiler-gate requires all 4 edits to land together or TS fails"
  - "Task 2 interleaved RED/GREEN rather than strict RED-then-GREEN — test and implementation files are both short enough that holding them apart provides no extra safety"
  - "T-09 HamburgerMenu placeholder test (Phase 40/41 deferred) converted to real cap-full UAC/UVC disabled-star assertion since the 5th calculator now exists"

patterns-established:
  - "Identity CSS block location — .identity-uac sits in the same @layer base block as other .identity-* rules at src/app.css:214-265 (plan said @layer utilities; actual location is @layer base — honored existing structure)"
  - "Route-shell 8-string-swap protocol mirrored from /gir — tabs for indentation, Ruler icon, middle-dot U+00B7 in subtitle"

requirements-completed:
  - UAC-03
  - UAC-04
  - UAC-08
  - UAC-09
  - UAC-ARCH-01
  - UAC-ARCH-02
  - UAC-ARCH-03
  - UAC-ARCH-04
  - UAC-TEST-01

# Metrics
duration: 17min
completed: 2026-04-24
---

# Phase 42 Plan 01: UAC/UVC Wave 0 Scaffolding Summary

**Fifth-calculator scaffold: CalculatorId + registry + identity-uac OKLCH tokens + src/lib/uac-uvc/ pure module (types, config, Shukla/Dunn catheter-depth math, sessionStorage singleton, 5-case parity fixtures) + /uac-uvc route shell — unblocks 42-02 UI + 42-03 E2E with compile-clean code and 9 new passing tests.**

## Performance

- **Duration:** ~17 min
- **Started:** 2026-04-24T01:31:00Z
- **Completed:** 2026-04-24T01:48:00Z
- **Tasks:** 3
- **Files created:** 9
- **Files modified:** 6

## Accomplishments

- Extended `CalculatorId` union with `'uac-uvc'` and the `identityClass` union with `'identity-uac'`, forcing compile-time exhaustiveness on `Record<CalculatorId, AboutContent>` which was satisfied in the same commit.
- Added `Ruler` icon import and appended the 5th (last) `CALCULATOR_REGISTRY` entry, preserving first-run favorites (`defaults = slice(0, 4)` stops before UAC/UVC per Phase 40 D-02).
- Added `.identity-uac` OKLCH token pair at hue 350 (light 42%/0.12 + 95%/0.035; dark 80%/0.10 + 24%/0.05) — four locked values pasted verbatim from 42-UI-SPEC, zero retune.
- Shipped `src/lib/uac-uvc/` as an exact structural mirror of `src/lib/gir/`: `types.ts`, `uac-uvc-config.{json,ts,test.ts}`, `calculations.{ts,test.ts}` with JSDoc citing xlsx B3/B7, `uac-uvc-parity.fixtures.json` (5 weights: 0.3, 1.0, 2.5, 5.0, 10.0 kg), and `state.svelte.ts` with three verbatim silent-`try/catch` blocks.
- Parity tests verify UAC = `w*3+9` and UVC = `(w*3+9)/2` within `1% relative OR 0.01 cm absolute` for all 5 fixtures (10 assertions); aggregator returns `null` when `weightKg` is null and `{ uacCm: 16.5, uvcCm: 8.25 }` at the xlsx default 2.5 kg.
- `/uac-uvc` route shell renders `Ruler` + h1 "UAC/UVC Catheter Depth" + subtitle "cm · weight-based formula" (middle-dot U+00B7) inside the locked `identity-uac mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl` container, with `onMount` wiring `setCalculatorContext({ id: 'uac-uvc', ... })` + `uacUvcState.init()`. Placeholder `<div>` + TODO comment stands in for `<UacUvcCalculator />` until plan 42-02.
- AboutSheet entry `'uac-uvc'` cites `uac-uvc-calculator.xlsx` cells B3/B7 and carries the imaging-confirmation caveat (UAC-09).

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffolding + identity CSS + AboutSheet entry** — `a63619b` (feat)
2. **Task 2: src/lib/uac-uvc/ module — types, config, pure calcs, state, parity fixtures + tests** — `9fa009b` (feat)
3. **Task 3: /uac-uvc route shell with placeholder calculator slot** — `d9d7633` (feat)

_Note: Tasks 1 and 2 were both flagged `tdd="true"` in the plan. For Task 1 the fix-for-regression pattern acted as the RED step (failing HamburgerMenu.test.ts T-02 + registry.test.ts 'contains expected ids' before the union extension was absorbed); for Task 2 the trivial size of each test (2 config-shape + 5 parity + 2 aggregator) allowed interleaved RED/GREEN rather than separate commits. All 9 new tests pass. Plan frontmatter `type: execute` does not require plan-level RED/GREEN/REFACTOR gate commits._

## Files Created/Modified

### Created

- `src/lib/uac-uvc/types.ts` — `UacUvcStateData`, `UacUvcInputRanges`, `UacUvcResult` interfaces.
- `src/lib/uac-uvc/uac-uvc-config.json` — clinical defaults (`weightKg: 2.5`) + input range (`0.3–10 kg` step 0.1).
- `src/lib/uac-uvc/uac-uvc-config.ts` — typed wrapper exporting `defaults`, `inputs`.
- `src/lib/uac-uvc/uac-uvc-config.test.ts` — shape test (2 assertions).
- `src/lib/uac-uvc/calculations.ts` — pure `calculateUacDepth`, `calculateUvcDepth`, `calculateUacUvc` aggregator. JSDoc cites xlsx B3/B7 + Shukla/Dunn attribution.
- `src/lib/uac-uvc/calculations.test.ts` — spreadsheet-parity loop (5 cases × 2 formulas = 10 assertions) + aggregator null and default-case tests (2 assertions). `closeEnough` helper with 1% relative OR 0.01 cm absolute floor (D-13).
- `src/lib/uac-uvc/uac-uvc-parity.fixtures.json` — 5 xlsx-derived cases for 0.3 / 1.0 / 2.5 / 5.0 / 10.0 kg.
- `src/lib/uac-uvc/state.svelte.ts` — `uacUvcState` singleton with `current` / `init()` / `persist()` / `reset()`. Session key `nicu_uac_uvc_state`. Three silent `try/catch` blocks.
- `src/routes/uac-uvc/+page.svelte` — route shell with Ruler header + onMount state init + placeholder `<div aria-hidden="true">` for 42-02 component slot.

### Modified

- `src/lib/shared/types.ts` — `CalculatorId` union extended with `'uac-uvc'` (one-line edit).
- `src/lib/shell/registry.ts` — `Ruler` icon import, `identityClass` union extended with `'identity-uac'`, 5th registry entry `{ id: 'uac-uvc', label: 'UAC/UVC', href: '/uac-uvc', icon: Ruler, ... identityClass: 'identity-uac' }` appended.
- `src/app.css` — `.identity-uac` (light) + `.dark .identity-uac, [data-theme='dark'] .identity-uac` (dark) rule pair appended inside the existing `@layer base` identity block (after `.dark .identity-feeds` closing brace).
- `src/lib/shared/about-content.ts` — `'uac-uvc'` key added to `aboutContent` record with title, description, and 3 notes (xlsx citation + imaging caveat).
- `src/lib/shell/__tests__/registry.test.ts` — expected ids list extended from 4 to 5 entries (regression fix caused by union extension).
- `src/lib/shell/HamburgerMenu.test.ts` — T-02 link count 4 → 5 + UAC/UVC link assertion added; T-09 placeholder converted to real cap-full disabled-star test against the UAC/UVC row.

## Decisions Made

- **CSS block location honored:** The plan text stated to put `.identity-uac` inside `@layer utilities`, but the shipped `.identity-*` rules all live in `@layer base` at `src/app.css:214-265`. Following the actual shipped layout (project conventions > plan text). No semantic impact — CSS custom-property scoping is identical.
- **Single atomic commit per task with all four Task-1 files:** The plan explicitly noted that the Record exhaustiveness compiler gate requires union + AboutSheet to land together; separate commits would leave the tree in a non-compiling intermediate state.
- **T-09 test conversion:** Phase 40/41 intentionally left HamburgerMenu T-09 as a placeholder noting "When Phase 42 adds UAC/UVC, this test MUST be updated to: seed 4 favs, render, find star for uac-uvc row, assert disabled attribute." This plan fulfilled that promise — T-09 now exercises the cap-full disabled-star contract on the UAC/UVC row.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Regression] Updated pre-existing tests invalidated by CalculatorId / registry extension**

- **Found during:** Task 1 verification run (`pnpm test -- --run src/lib/shared/ src/lib/shell/`)
- **Issue:** Two pre-existing tests hardcoded the 4-entry registry state and failed as soon as UAC/UVC was appended:
  1. `src/lib/shell/__tests__/registry.test.ts > CALCULATOR_REGISTRY > contains the expected calculator ids` — expected array `['feeds', 'formula', 'gir', 'morphine-wean']` (sorted).
  2. `src/lib/shell/HamburgerMenu.test.ts > HamburgerMenu > T-02 opens when prop bound to true — lists every registered calculator` — asserted `getAllByRole('link')).toHaveLength(4)`.
- **Fix:** Updated both assertions to account for the 5th calculator. Additionally, HamburgerMenu `T-09` which had been a documented placeholder ("When Phase 42 adds UAC/UVC, this test MUST be updated...") was converted to a real assertion exercising the cap-full UAC/UVC disabled-star contract.
- **Files modified:** `src/lib/shell/__tests__/registry.test.ts`, `src/lib/shell/HamburgerMenu.test.ts`
- **Verification:** `pnpm test -- --run src/lib/shared/ src/lib/shell/` — all 267 tests pass.
- **Committed in:** `a63619b` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 regression caused directly by the plan's registry / union extension).
**Impact on plan:** No scope creep — the changes were single-line numeric / array updates plus activating a test that Phase 40/41 had explicitly marked as awaiting this phase. All of Task 1's acceptance criteria still hold. All Plan-level `success_criteria` items verified.

## Issues Encountered

None during planned work. Pre-commit `Read-before-Edit` hook reminders fired several times even though the files had been read at execution start — the tool calls themselves succeeded, so the reminders were informational only.

## Plan-Level Verification Gate Results

- `pnpm exec svelte-check --tsconfig ./tsconfig.json` → `0 errors and 0 warnings` (4543 files).
- `pnpm test -- --run` → `Test Files  24 passed (24)` / `Tests  276 passed (276)` (9 new UAC/UVC tests + 267 prior tests all green).
- `pnpm exec vite build` → succeeded (`✓ built in 8.56s`; 44-entry PWA precache, no CSS parse errors from the new `.identity-uac` block, no JSON-import errors from the new fixture).
- Locked OKLCH quartet grep verification — all four values present verbatim:
  - `oklch(42% 0.12 350)` → `src/app.css:256`
  - `oklch(95% 0.035 350)` → `src/app.css:257`
  - `oklch(80% 0.10 350)` → `src/app.css:261`
  - `oklch(24% 0.05 350)` → `src/app.css:262`

## Known Stubs

- **`src/routes/uac-uvc/+page.svelte` placeholder `<div aria-hidden="true"></div>`** — replaces the `<UacUvcCalculator />` slot until plan 42-02 delivers the component. TODO comment in-place (`TODO(plan 42-02)`). This is intentional per plan 42-01 `<action>` and allows the route to render with the correct identity header while keeping the 42-01 / 42-02 split clean. Not a deviation — explicitly planned.

## User Setup Required

None — no external service configuration, no environment variables, no new dependencies.

## Next Phase Readiness

- **42-02 (UI plan):** Unblocked. `uacUvcState`, `calculateUacUvc`, the route shell, identity CSS tokens, and the AboutSheet entry are all in place. The 42-02 executor needs only to (a) add `import UacUvcCalculator from '$lib/uac-uvc/UacUvcCalculator.svelte';`, (b) replace the `<div aria-hidden="true"></div>` placeholder with `<UacUvcCalculator />`, (c) build `UacUvcCalculator.svelte` + `UacUvcCalculator.test.ts`.
- **42-03 (E2E plan):** Unblocked. Navigating to `/uac-uvc` now resolves and renders a stable header; E2E specs can write against the `UAC/UVC Catheter Depth` h1 without waiting for Phase 42-02.

## Self-Check

Verified all created files exist and all task commit hashes are present in the local git log.

**Files:**
- FOUND: `src/lib/uac-uvc/types.ts`
- FOUND: `src/lib/uac-uvc/uac-uvc-config.json`
- FOUND: `src/lib/uac-uvc/uac-uvc-config.ts`
- FOUND: `src/lib/uac-uvc/uac-uvc-config.test.ts`
- FOUND: `src/lib/uac-uvc/calculations.ts`
- FOUND: `src/lib/uac-uvc/calculations.test.ts`
- FOUND: `src/lib/uac-uvc/uac-uvc-parity.fixtures.json`
- FOUND: `src/lib/uac-uvc/state.svelte.ts`
- FOUND: `src/routes/uac-uvc/+page.svelte`

**Commits:**
- FOUND: `a63619b` (Task 1)
- FOUND: `9fa009b` (Task 2)
- FOUND: `d9d7633` (Task 3)

## Self-Check: PASSED

---
*Phase: 42-uac-uvc-calculator*
*Completed: 2026-04-24*
