# Phase 13 / Plan 01 — Summary

**Plan:** Fortification visual polish
**Status:** ✅ COMPLETE
**Date:** 2026-04-07

## What was built

Single markup-only edit to `src/lib/fortification/FortificationCalculator.svelte` covering all three FORT requirements:

### FORT-01 — Mobile row pairing
Wrapped Target Calorie + Unit SelectPickers in `<div class="grid grid-cols-2 gap-4">` (mobile-up, no breakpoint reversal). Base / Starting Volume / Formula remain stacked above.

### FORT-02 — Hero restyle
Restyled the "Amount to Add" hero to adopt morphine wean result theming:
- Surface: `bg-[var(--color-accent-light)]` (brand clinical-blue tint)
- Eyebrow: `text-2xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]`
- Dominant numeric: `text-5xl font-bold num text-[var(--color-text-primary)]` in its own `<span>` — regex `/^\s*2\s*$/` still matches
- Unit label: separate `<span>` with `text-lg font-semibold text-[var(--color-text-secondary)]` — `within(hero).getByText('Teaspoons')` still resolves
- Baseline-aligned `flex items-baseline gap-2`
- Preserved: outer `<section>`, `aria-live="polite" aria-atomic="true"`, literal "Amount to Add" text

### FORT-03 — Spacing / typography sweep
- Eyebrow parity: both hero and Verification card eyebrows now use `text-2xs font-semibold uppercase tracking-wide`
- Verification `<dl>` rhythm: `mt-2 gap-2` → `mt-3 gap-3` (calmer)
- Verification `dt` weight: added `font-medium` (parity with morphine)
- Verification `dd` values (`183.5 mL`, `23.5 kcal/oz`, `180 (6.1 oz)`) byte-identical

## Test results

| Suite | Result |
|-------|--------|
| `pnpm test:run -- src/lib/fortification/FortificationCalculator.test.ts` | 117/117 ✅ (ran full suite — all green) |
| `pnpm build` | ✅ PWA v1.2.0, 32 precache entries |

All 8 FortificationCalculator tests (UI-01, UI-02 default, UI-02 recalc, UI-03 hidden, UI-03 available, UI-03 transition, UI-04, UI-05) pass unchanged. Spreadsheet-parity tests still green.

## Guards

- `git diff src/lib/fortification/{calculations.ts,fortification-config.json,state.svelte.ts,types.ts}` → empty (no logic edits)
- `git diff --stat src/` → only `FortificationCalculator.svelte` (45 lines, 26+/19-)
- No hardcoded colors; all `var(--color-*)` tokens
- No new imports, no new dependencies

## Requirements coverage

| ID | Status | Evidence |
|----|--------|----------|
| FORT-01 | ✅ | `grid grid-cols-2 gap-4` wraps Target Calorie + Unit in Inputs card |
| FORT-02 | ✅ | Hero uses `bg-[var(--color-accent-light)]` + `text-5xl font-bold num` + separate unit span, mirroring morphine summary card visual language |
| FORT-03 | ✅ | Eyebrows unified on `text-2xs`; Verification rhythm calmed to `gap-3`; dt weight bumped |

## Deviations

None. Plan executed as written.
