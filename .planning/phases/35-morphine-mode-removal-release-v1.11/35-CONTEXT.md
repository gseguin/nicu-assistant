# Phase 35 Context: Morphine Mode Removal + Release v1.11

**Mode:** `--auto` — defaults selected by Claude, no interactive Q&A.

## Goal

Remove the linear/compounding mode toggle from the Morphine Wean calculator. The xlsx Sheet1 (`morphine-wean-calculator.xlsx`) is the single source of truth and uses only the linear formula.

## Source-of-truth audit (verified 2026-04-09)

Inspected `morphine-wean-calculator.xlsx` Sheet1 cells B15..B24:

- Step 1: `B15 = D15 * $B$4` → `weight × maxDose`
- Step N>1: `B[n] = B[n-1] - ($D$15 * $B$4 * $B$5)` → previous − (weight × maxDose × decreasePct)

Calculated values for weight=3.1, maxDose=0.04, decreasePct=0.1: every step drops by exactly 0.0124 mg = 3.1 × 0.04 × 0.1. **Fixed reduction = linear.**

`calculateLinearSchedule()` in `src/lib/morphine/calculations.ts` already implements this exactly. **No math changes required.**

## Decisions (locked)

1. **Single calculator path = linear (the xlsx formula).** Compounding is deleted entirely; not deprecated, not feature-flagged.
2. **No fallback / migration for persisted `activeMode`.** SessionStorage only; stale `activeMode` keys are silently ignored by `{ ...defaultState(), ...parsed }` once `activeMode` is removed from the type. Acceptable: mid-session users see the schedule re-render once on next visit.
3. **No UI redesign beyond toggle removal.** The `SegmentedToggle` row in `MorphineWeanCalculator.svelte` is deleted. Surrounding spacing collapses naturally; if any obvious dead space remains, tighten margins only — no layout restructuring.
4. **`SegmentedToggle` component stays.** It's still used by Formula (`FortificationCalculator.svelte`) and has its own tests. Out of scope to touch.
5. **Spreadsheet-parity tests are the contract.** Replace any legacy compounding parity assertions with row-by-row assertions for the 10 known values from xlsx Sheet1 (weight 3.1, max 0.04, dec 0.1). Reuse the existing ~1% epsilon convention.
6. **AboutSheet copy update is in scope.** Search for "linear", "compounding", "mode" in AboutSheet content for Morphine Wean and rewrite to a single-formula description.
7. **Release artifacts:** bump `package.json` to `1.11.0`; update PROJECT.md Validated list with v1.11 entries at phase completion.
8. **Quality gate (must remain green):**
   - `svelte-check` 0/0
   - `vitest` all green (with updated parity tests)
   - `pnpm build` ✓
   - Playwright E2E + 16/16 axe sweeps green

## Files to change

| File | Change |
|------|--------|
| `src/lib/morphine/types.ts` | Remove `WeanMode`; remove `activeMode` from `MorphineStateData` |
| `src/lib/morphine/morphine-config.json` | Remove `modes` block |
| `src/lib/morphine/calculations.ts` | Delete `calculateCompoundingSchedule()` |
| `src/lib/morphine/calculations.test.ts` | Delete compounding tests; replace linear tests (or extend) with xlsx Sheet1 row-by-row parity for fixture (3.1, 0.04, 0.1) |
| `src/lib/morphine/state.svelte.ts` | Drop `activeMode` from `defaultState()` |
| `src/lib/morphine/MorphineWeanCalculator.svelte` | Remove `SegmentedToggle` import + render; remove `MODE_OPTIONS`; remove branch on `activeMode`; call `calculateLinearSchedule` directly; clean derived `schedule` key |
| `src/lib/morphine/MorphineWeanCalculator.test.ts` | Remove mode-toggle tests; update remaining tests for single-mode UI |
| `src/lib/shared/components/AboutSheet.svelte` (or wherever Morphine copy lives) | Update copy if it mentions linear/compounding |
| `package.json` | `1.10.0` → `1.11.0` |
| `.planning/PROJECT.md` | Validated list update with v1.11 entries (at phase end) |

## Test plan

- **Unit:** xlsx Sheet1 row-by-row parity (10 steps) for the canonical fixture; existing edge cases (zero decrease, max decrease, negative-prevention) carried forward against `calculateLinearSchedule` only.
- **Component:** Morphine renders without toggle; schedule appears on valid input; reset clears state.
- **E2E (Playwright):** Update any morphine spec that selects the mode toggle. Confirm 16/16 axe sweeps still green (light/dark, focus, advisory, etc.).

## Out of scope

- Touching Formula or GIR calculators
- Touching `SegmentedToggle` itself
- Any new clinical data, ranges, advisories
- Visual redesign of Morphine beyond toggle removal
- New deps

## Open questions

None — `--auto` mode. Defaults above are final.

## Next

`/gsd-plan-phase 35`
