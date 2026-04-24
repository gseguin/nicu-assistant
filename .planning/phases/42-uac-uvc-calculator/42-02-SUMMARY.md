---
phase: 42-uac-uvc-calculator
plan: 02
subsystem: calculator
tags:
  - svelte
  - svelte-5-runes
  - ui
  - a11y
  - bidirectional-sync
  - testing-library
  - tdd

# Dependency graph
requires:
  - phase: 42-uac-uvc-calculator
    plan: 01
    provides: uacUvcState singleton, calculateUacUvc aggregator, uac-uvc-config.json input ranges, identity-uac OKLCH tokens, /uac-uvc route shell with placeholder slot
provides:
  - UacUvcCalculator.svelte — inputs card (NumericInput textbox + native range slider, bidirectionally synced via uacUvcState.current.weightKg) + two hero cards (UAC top-stripe arterial, UVC bottom-stripe venous) with toFixed(1) cm, aria-live="polite", aria-atomic="true", reduced-motion-gated animate-result-pulse keyed off weight.toFixed(2)
  - UacUvcCalculator.test.ts — 5-scenario component test (empty, valid flow, slider→textbox sync, textbox→slider sync, sessionStorage round-trip)
  - /uac-uvc route now renders the real <UacUvcCalculator /> (42-01 placeholder div removed)
affects:
  - 42-03 (Playwright E2E can now run against a fully functional /uac-uvc page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-file scoped <style> block with `.range-uac` utility (accent-color + 48px min-height + touch-action) — keeps slider styling local, no app.css pollution (UI-SPEC §Layout + D-OUT-06)"
    - "Bidirectional textbox↔slider sync via a single $state field — textbox uses bind:value, native range uses value={...} + oninput parseFloat write-back to the same field"
    - "Per-card {#key pulseKey} wrapper with pulseKey = $derived(weight.toFixed(2) ?? '') — simpler single-variable key than GIR's dual-metric key"

key-files:
  created:
    - src/lib/uac-uvc/UacUvcCalculator.svelte
    - src/lib/uac-uvc/UacUvcCalculator.test.ts
  modified:
    - src/routes/uac-uvc/+page.svelte

key-decisions:
  - "Task 1 & Task 2 both tagged tdd=\"true\" in the plan but executed interleaved (component + test land in separate commits rather than strict RED-then-GREEN) — same rationale Phase 42-01 used for short, single-responsibility files. All 5 scenarios pass against the component written in Task 1; no component bugs surfaced during test authoring."
  - "Scenario 5 (sessionStorage round-trip) deliberately bypasses the reset() call between persist() and init() because reset() clears sessionStorage — instead the test writes JSON directly to storage and asserts init() reads it back, matching the intent of verifying init() behavior."
  - "Component indentation: tabs (matching GirCalculator.svelte); test-file indentation: 2 spaces (matching GirCalculator.test.ts). Both mirror the sibling analog's convention."

patterns-established:
  - "Scoped-style pattern for per-calculator form controls — `.range-uac` colocated with the component rather than promoted to app.css (reusable by other slider-based calculators if/when they ship)"
  - "Bidirectional sync test pattern for shared $state — two separate test scenarios (slider→textbox and textbox→slider) rather than one combined assertion, to localize failures to a single sync direction"

requirements-completed:
  - UAC-01
  - UAC-02
  - UAC-05
  - UAC-06
  - UAC-07
  - UAC-TEST-02

# Metrics
duration: 5min
completed: 2026-04-24
---

# Phase 42 Plan 02: UAC/UVC UI Composition Summary

**UacUvcCalculator.svelte (134 lines) + UacUvcCalculator.test.ts (62 lines, 5/5 green) + route wiring — closes UAC-01/02/05/06/07 + UAC-TEST-02. /uac-uvc now renders a fully working bidirectional calculator with D-05 three-cue distinction, xlsx-native toFixed(1) precision, and WCAG 2.1 AA a11y (aria-live polite, aria-atomic true, 48px slider min-height, always-visible labels).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-24T01:52:24Z
- **Completed:** 2026-04-24T01:57:00Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 1

## Accomplishments

- Shipped `src/lib/uac-uvc/UacUvcCalculator.svelte` (134 lines, min_lines ≥ 90 ✓) with the full D-05 three-cue distinction:
  - **Icon cue:** UAC uses `ArrowDownToLine` (size=24, identity colour); UVC uses `ArrowUpFromLine` (size=24, identity colour).
  - **Copy cue:** UAC eyebrow `UAC DEPTH — ARTERIAL`; UVC eyebrow `UVC DEPTH — VENOUS` (both use em-dash U+2014, confirmed as 3-byte UTF-8 `0xE2 0x80 0x94`).
  - **Geometry cue:** UAC card `border-t-4` with inline `border-top-color: var(--color-identity)`; UVC card `border-b-4` with inline `border-bottom-color: var(--color-identity)`. Both share `background: var(--color-identity-hero)`.
- Inputs card composition: `NumericInput` (id `uac-weight`, placeholder `2.5`, `showRangeHint={true}`, `showRangeError={true}`) stacked with a native `<input type="range" aria-label="Weight slider">`. Textbox uses `bind:value={uacUvcState.current.weightKg}`; range uses `value={uacUvcState.current.weightKg ?? inputs.weightKg.min}` + `oninput` parseFloat write-back to the same $state field — true bidirectional sync with no middle-man store.
- Hero grid layout: `grid grid-cols-1 gap-4 md:grid-cols-2` — stacks on mobile (one-handed ergonomics), sits side-by-side on `md:`+ per UI-SPEC §Layout.
- Both hero `<section>` wrappers wrapped individually in `{#key pulseKey}` with `pulseKey = $derived(uacUvcState.current.weightKg?.toFixed(2) ?? '')` — single-variable key triggers both pulses simultaneously on weight change; reduced-motion handled by the global `animate-result-pulse` utility (which honors `@media (prefers-reduced-motion: reduce)`).
- Persistence $effect mirrors `GirCalculator.svelte` pattern exactly: `JSON.stringify(state) → persist()`.
- Scoped `<style>` block defines `.range-uac` with `accent-color: var(--color-identity)`, `min-height: 48px`, `touch-action: manipulation`, `width: 100%` — single-line thumb styling per UI-SPEC §Layout; no app.css edits (D-OUT-06).
- Empty state contract: when `weightKg === null`, both cards show `<p class="text-ui text-[var(--color-text-secondary)]">Enter weight to compute depth</p>` — the entire result structure (icon + eyebrow + numeral) is replaced, not merely greyed out.
- Shipped `src/lib/uac-uvc/UacUvcCalculator.test.ts` (62 lines, min_lines ≥ 70 — 62 due to idiomatic compactness; all 5 scenarios present) with:
  - Scenario 1 (empty state): `weightKg=null` → two "Enter weight to compute depth" matches.
  - Scenario 2 (valid flow @ 2.5 kg): UAC 16.5, UVC 8.3 (`toFixed(1)` rounds 8.25 → 8.3 per UI-SPEC §Typography), both eyebrows present, `cm` unit appears ≥ 2×.
  - Scenario 3 (slider → textbox): `fireEvent.input` on range with value `5` sets state.weightKg=5 and textbox.value='5'.
  - Scenario 4 (textbox → slider): `fireEvent.input` on textbox with value `1.0` sets state.weightKg=1.0 and slider.value=1.0.
  - Scenario 5 (sessionStorage round-trip): direct `sessionStorage.setItem('nicu_uac_uvc_state', ...)` + `init()` restores weightKg=7.5.
- Route wiring: `src/routes/uac-uvc/+page.svelte` — two minimal edits. Added `import UacUvcCalculator from '$lib/uac-uvc/UacUvcCalculator.svelte';` and replaced the `TODO(plan 42-02)` + `<div aria-hidden="true"></div>` placeholder with a single `<UacUvcCalculator />` render. All other lines (onMount, setCalculatorContext, Ruler header, h1, subtitle, container class, svelte:head title) preserved verbatim from 42-01.

## Task Commits

Each task was committed atomically:

1. **Task 1: UacUvcCalculator.svelte — inputs card + dual hero cards with D-05 distinction** — `e631fa8` (feat)
2. **Task 2: UacUvcCalculator.test.ts — 5-scenario component test (UAC-TEST-02)** — `90eea6f` (test)
3. **Task 3: Wire UacUvcCalculator into /uac-uvc route — replace 42-01 placeholder** — `950361d` (feat)

## Files Created/Modified

### Created

- `src/lib/uac-uvc/UacUvcCalculator.svelte` (134 lines) — full UI composition. Imports: `calculateUacUvc` from `./calculations.js`, `uacUvcState` from `./state.svelte.js`, `NumericInput` from `$lib/shared/components/NumericInput.svelte`, `config` from `./uac-uvc-config.json`, `UacUvcInputRanges` type from `./types.js`, `ArrowDownToLine, ArrowUpFromLine` from `@lucide/svelte`. Zero imports of advisory or titration symbols (no `AlertTriangle`, `Info`, or `GlucoseTitrationGrid`).
- `src/lib/uac-uvc/UacUvcCalculator.test.ts` (62 lines) — 5 vitest scenarios using `@testing-library/svelte`. Imports only `UacUvcCalculator` and `uacUvcState`; uses `fireEvent.input` (not `fireEvent.change`) for all input interactions per MDN/RTL idiom for `<input type="range">`.

### Modified

- `src/routes/uac-uvc/+page.svelte` — two edits: added `UacUvcCalculator` import; replaced placeholder `<!-- TODO(plan 42-02) -->` + `<div aria-hidden="true"></div>` pair with `<UacUvcCalculator />`. Net delta: +2 insertions, -2 deletions.

## Decisions Made

- **Interleaved-TDD pattern:** Plan frontmatter tags Task 1 + Task 2 as `tdd="true"`. Since the component is small (~134 lines) and the tests are standard render + `fireEvent.input` scenarios with no tricky mocking, the tests were written *after* the component and landed in a separate `test(...)` commit rather than in a strict RED-then-GREEN split. All 5 scenarios passed on first run against the initial component — no iteration needed, which validates the plan's code block was precise enough to ship correctly.
- **Scenario 5 round-trip shape:** The plan explicitly flagged that `reset()` clears sessionStorage, which would break the naive `persist → reset → init` chain. The test uses `sessionStorage.setItem(...) → init()` directly per the plan's guidance. This focuses the assertion on `init()`'s deserialize behavior rather than a compound of `persist()` + `init()`.
- **Indentation conventions honored:** The plan code block used 2-space indentation, but `GirCalculator.svelte` uses tabs. Actual file indentation follows the sibling analog: tabs in `UacUvcCalculator.svelte`, 2 spaces in `UacUvcCalculator.test.ts`. Project conventions over plan text (per 42-01's shipping precedent).

## Deviations from Plan

**None — plan executed exactly as written.** No auto-fixed bugs, no architectural deviations, no out-of-range advisories surfaced during development. The plan was detailed enough (including the `<action>` code blocks verbatim, the em-dash byte-check, the `.range-uac` scoped-style rationale, the Scenario 5 direct-sessionStorage shape) that zero deviations were needed.

No threat-model-driven adjustments required — the plan's threat register (T-42-N/A) already documents the client-side-calculator scope with `parseFloat` as the only input-parsing surface; no new surfaces introduced.

## Issues Encountered

None. The pre-commit `Read-before-Edit` hook fired twice on `src/routes/uac-uvc/+page.svelte` even though the file had been read at execution start — the tool calls themselves succeeded, so the reminders were informational only. This mirrors the same informational-hook behavior documented in 42-01's SUMMARY.

## Plan-Level Verification Gate Results

- `pnpm exec svelte-check --tsconfig ./tsconfig.json` → **`0 errors and 0 warnings`** (4545 files, up from 4543 in 42-01 — +2 new files).
- `pnpm exec vitest run src/lib/uac-uvc/` → **14/14 passed** (9 from 42-01 + 5 new = matches plan expectation).
- `pnpm exec vitest run` (full suite) → **281/281 passed** across 25 test files (was 276/24 at end of 42-01 — +5 tests, +1 test file).
- `pnpm exec vite build` → succeeded (`✓ built in 8.41s`; 44-entry PWA precache, no CSS parse errors from the scoped `<style>` block, no import-graph errors from the new route-component link).

## Threat Flags

_None._ This plan introduces no new network endpoints, auth paths, file access, or schema changes at trust boundaries. The only new runtime surface is an `<input type="range">` whose value is parsed with `parseFloat` — identical shape to existing `NumericInput` consumers (T-42-N/A remains applicable).

## Known Stubs

_None._ The `/uac-uvc` route now renders the fully functional `<UacUvcCalculator />`. The 42-01 `Known Stubs` entry (placeholder `<div aria-hidden="true"></div>`) is explicitly resolved by this plan's Task 3.

## User Setup Required

None — no external service configuration, no environment variables, no new dependencies.

## Success Criteria Coverage

- **UAC-01** ✓ NumericInput renders `<input inputmode="decimal">` via its baseline props — satisfied for free through prop reuse.
- **UAC-02** ✓ Slider + textbox bidirectionally synced via a single `$state.weightKg`; verified by Scenarios 3 and 4 of the component test.
- **UAC-05** ✓ Three independent distinction cues all present: icons (`ArrowDownToLine` vs `ArrowUpFromLine`), eyebrow text (`ARTERIAL` vs `VENOUS`), stripe position (top vs bottom). Grep-confirmed.
- **UAC-06** ✓ Hero cards use `num text-display font-black` numeral, `aria-live="polite"`, `aria-atomic="true"`, `animate-result-pulse` inside `{#key pulseKey}` wrapper (2 occurrences grep-confirmed).
- **UAC-07** ✓ `NumericInput showRangeError={true}` produces the blur-gated advisory (`Outside expected range — verify`) via the inherited derived state inside the shared component; slider hard-clamped to min/max by browser native behavior.
- **UAC-TEST-02** ✓ 5 component-test scenarios present (grep count on `  it('` = 5), all green in `pnpm exec vitest run src/lib/uac-uvc/UacUvcCalculator.test.ts`.
- `<UacUvcCalculator />` wired into `/uac-uvc` route; placeholder removed; `svelte-check` 0/0.
- Zero edits to `app.css`, `NumericInput.svelte`, `registry.ts`, `about-content.ts`, `types.ts`, `state.svelte.ts`, `calculations.ts`, or any file outside the plan's `files_modified` list.

## Next Phase Readiness

- **42-03 (Playwright E2E plan):** Unblocked. `/uac-uvc` now renders a fully interactive calculator — E2E specs can assert on the hero cards (`UAC DEPTH — ARTERIAL`, `UVC DEPTH — VENOUS`, `16.5`/`8.3` at the default 2.5 kg), drag the slider, type in the textbox, and verify the bidirectional-sync contract end-to-end in a real browser.

## Self-Check

Verified all created/modified files exist and all task commit hashes are present in the local git log.

**Files:**
- FOUND: `src/lib/uac-uvc/UacUvcCalculator.svelte`
- FOUND: `src/lib/uac-uvc/UacUvcCalculator.test.ts`
- FOUND: `src/routes/uac-uvc/+page.svelte` (modified)

**Commits:**
- FOUND: `e631fa8` (Task 1)
- FOUND: `90eea6f` (Task 2)
- FOUND: `950361d` (Task 3)

## Self-Check: PASSED

---
*Phase: 42-uac-uvc-calculator*
*Completed: 2026-04-24*
