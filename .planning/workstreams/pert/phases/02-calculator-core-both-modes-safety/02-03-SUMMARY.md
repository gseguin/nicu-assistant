---
phase: 2
plan: 3
workstream: pert
milestone: v1.15
subsystem: pert/inputs
tags: [svelte5, runes, segmented-toggle, select-picker, string-bridge, persist-effect]
status: complete
duration_minutes: 7
completed: 2026-04-24
requirements:
  - PERT-ORAL-01
  - PERT-ORAL-02
  - PERT-ORAL-03
  - PERT-ORAL-04
  - PERT-ORAL-05
  - PERT-TUBE-01
  - PERT-TUBE-02
  - PERT-TUBE-03
  - PERT-TUBE-04
  - PERT-TUBE-05
  - PERT-MODE-01
  - PERT-MODE-02
  - PERT-MODE-03
  - PERT-SAFE-02
  - PERT-SAFE-03
dependency_graph:
  requires:
    - src/lib/pert/state.svelte.ts (Phase-1-frozen)
    - src/lib/pert/config.ts (Phase-1-frozen)
    - src/lib/pert/types.ts (Phase-1-frozen)
    - src/lib/pert/pert-config.json (Phase-1-frozen + 02-01 em-dash audit)
    - src/lib/shared/components/SegmentedToggle.svelte (frozen contract)
    - src/lib/shared/components/RangedNumericInput.svelte (frozen contract)
    - src/lib/shared/components/NumericInput.svelte (frozen contract)
    - src/lib/shared/components/SelectPicker.svelte (frozen contract)
  provides:
    - "src/lib/pert/PertInputs.svelte: inputs-only Svelte component composed inside the desktop sticky aside + mobile InputDrawer (Plan 02-04 will mount)"
  affects:
    - "Plan 02-04 (PertCalculator body + +page.svelte wiring): consumes <PertInputs /> from two slots"
tech_stack:
  added: []
  patterns:
    - "string-bridge proxy: $state<string> + read-direction $effect (state -> string) + write-direction $effect (string -> state) for SelectPicker bind:value over (string | null) and (number | null) state slots"
    - "defensive persist $effect duplicate (mirrors FeedAdvanceInputs.svelte:35-38) so inputs work standalone in the mobile drawer"
    - "$derived strength options (re-runs when medicationId changes) with en-US locale formatting via toLocaleString"
key_files:
  created:
    - src/lib/pert/PertInputs.svelte
  modified: []
decisions:
  - "Used string-bridge $state proxies (NOT `as string` casts) for medicationId / strengthValue / formulaId SelectPicker bindings; mirrors FeedAdvanceInputs.svelte:55-74 and respects Svelte 5 writable-lvalue requirement"
  - "D-11 strength reset implemented as a 4th $effect that tracks lastMedId; on medicationId change, sets pertState.current.strengthValue = null which propagates through the strengthStr read-effect to clear the SelectPicker"
  - "Em-dashes scrubbed from comments to satisfy the plan's unconditional grep '—' = 0 acceptance gate (DESIGN.md em-dash ban applies to user-rendered strings; plan's grep is comment-blind, so comment em-dashes were converted to ASCII semicolons / colons / periods)"
metrics:
  duration_seconds: 420
  task_count: 1
  file_count: 1
  lines_added: 248
---

# Phase 2 Plan 3: PertInputs Component Summary

PertInputs.svelte landed: SegmentedToggle (Oral / Tube-Feed) + Weight + per-mode {#if} blocks + Medication + Strength inputs, with three string-bridge $state proxies for SelectPicker bindings and a D-11 strength-reset $effect, all wired to the Phase-1-frozen pertState singleton.

## What Was Built

**`src/lib/pert/PertInputs.svelte`** (NEW, 248 lines, 0 svelte-check errors).

Top-down structure (mirrors `src/lib/feeds/FeedAdvanceInputs.svelte`):

1. Header comment block documenting the decisions implemented (D-06 / D-07 / D-08 / D-11 / D-13 / D-14 / D-17) and the non-import-from-./calculations contract.
2. Script body:
   - Imports: pertState, config (inputs/medications/formulas/getStrengthsForMedication), types (PertMode, SelectOption), all four shared input components.
   - Defensive persist $effect (`JSON.stringify(pertState.current); pertState.persist();`) — mirrors FeedAdvanceInputs:35-38.
   - `modeOptions` const (Oral / Tube-Feed) for the SegmentedToggle (D-06).
   - `medicationOptions` / `formulaOptions` arrays mapped from config.
   - `strengthOptions` $derived from `getStrengthsForMedication(medicationId)` with `toLocaleString('en-US')` formatting → `"12,000 units"`.
   - **Three string-bridge proxies** (medicationIdStr / strengthStr / formulaIdStr): each is a `$state<string>` plus a read-direction $effect (state → string, mapping null → '') plus a write-direction $effect (string → state, mapping '' → null). No `as string` casts (banned by Svelte 5 writable-lvalue requirement).
   - **D-11 strength-reset $effect** at the bottom: tracks `lastMedId` in a $state slot; on medicationId change, sets strengthValue to null (which then propagates through the strengthStr read-effect to clear the SelectPicker visually).
3. Markup:
   - `<div class="space-y-6">` wrapper.
   - **Shared card 1** (`card flex flex-col gap-4 px-5 py-5`): SegmentedToggle (label "Calculator mode", aria "PERT mode") + RangedNumericInput (Weight, kg, with slider).
   - **Mode-conditional card** (Oral): NumericInput (Fat per meal, g) + NumericInput (Lipase per gram of fat, units/g) — D-15 + D-17.
   - **Mode-conditional card** (Tube-Feed): SelectPicker (Formula, searchable, 17 options) + NumericInput (Volume per day, mL, step 10) + NumericInput (Lipase per gram of fat, units/g) — D-13 + D-16 + D-17.
   - **Shared card 2** (`card flex flex-col gap-3 px-5 py-5`): SelectPicker (Medication, 5 options) + SelectPicker (Strength, filtered, placeholder switches based on medication selection).

**Imports list (verbatim):**

| Symbol | Source | Purpose |
|--------|--------|---------|
| `pertState` | `./state.svelte.js` | singleton state |
| `inputs, medications, formulas, getStrengthsForMedication` | `./config.js` | ranges + dropdowns + accessor |
| `PertMode` | `./types.js` | toggle option typing |
| `SelectOption` | `$lib/shared/types.js` | dropdown option typing |
| `SegmentedToggle` | `$lib/shared/components/SegmentedToggle.svelte` | mode toggle |
| `RangedNumericInput` | `$lib/shared/components/RangedNumericInput.svelte` | weight |
| `NumericInput` | `$lib/shared/components/NumericInput.svelte` | fat / volume / lipase rate |
| `SelectPicker` | `$lib/shared/components/SelectPicker.svelte` | medication / strength / formula |

Zero imports from `./calculations` per CONTEXT D-01 (pure inputs surface).

## Mode-Toggle Wiring (D-06 + D-07)

The SegmentedToggle is `bind:value={pertState.current.mode}` — bidirectional binding directly on the singleton state slot. Track styling owned by the shared component (`bg-[var(--color-surface-alt)]` recessed track, `text-[var(--color-identity)]` active pill). Persistence is handled by the defensive `$effect(() => { JSON.stringify(pertState.current); pertState.persist(); })` block that reads every state field on every change (D-07). Persist storms (RESEARCH §Pitfall 1) are mitigated because pertState.persist() is `localStorage.setItem` keyed once-per-tick by Svelte's effect batching.

## Strength Reset Effect (D-11)

```ts
let lastMedId = $state<string | null>(pertState.current.medicationId);
$effect(() => {
  const cur = pertState.current.medicationId;
  if (cur !== lastMedId) {
    lastMedId = cur;
    pertState.current.strengthValue = null;
  }
});
```

This runs AFTER the medicationId change is committed (the $effect reads the new value), and sets strengthValue to null. The strengthStr read-direction $effect then sees the null and clears the local string proxy, which then drives the SelectPicker placeholder back to `"Select strength"` (or `"Choose medication first"` once medicationId is null again). The reset also forces the placeholder gate on the Strength SelectPicker which conditionally swaps its placeholder string based on whether a medication is currently selected.

The strengths array is recomputed via `$derived` from `getStrengthsForMedication(medicationId)`, so the dropdown options also refresh on the same render.

## Verification Results

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| `pnpm svelte-check` | 0 errors / 0 warnings | 0 errors / 0 warnings | PASS |
| `pnpm test:run` | 361/361 (Phase-1 baseline preserved) | 361 passed (361) | PASS |
| `pnpm test:run src/lib/pert/` | 17/17 (state.test + config.test) | 17 passed (17) | PASS |
| `grep -c "from './calculations" PertInputs.svelte` | 0 (pure inputs) | 0 | PASS |
| `grep "—" PertInputs.svelte` | empty | 0 matches | PASS |
| `grep -c "Lipase per gram of fat" PertInputs.svelte` | 2 (oral + tube-feed labels) | 2 | PASS |
| `grep -c "import SegmentedToggle" PertInputs.svelte` | 1 | 1 | PASS |
| `grep -c "import RangedNumericInput" PertInputs.svelte` | 1 | 1 | PASS |
| `grep -c "import NumericInput" PertInputs.svelte` | 1 | 1 | PASS |
| `grep -c "import SelectPicker" PertInputs.svelte` | 1 | 1 | PASS |
| `grep -c 'import { pertState }' PertInputs.svelte` | 1 | 1 | PASS |
| `grep -c 'suffix="mL"' PertInputs.svelte` | 1 (D-13 volume input) | 1 | PASS |
| `grep -c "step={inputs.volumePerDayMl.step}" PertInputs.svelte` | 1 | 1 | PASS |
| `grep -c "searchable={true}" PertInputs.svelte` | 1 (formula picker) | 1 | PASS |
| `grep -c "value: 'oral', label: 'Oral'" PertInputs.svelte` | 1 | 1 | PASS |
| `grep -c "value: 'tube-feed', label: 'Tube-Feed'" PertInputs.svelte` | 1 | 1 | PASS |
| `grep -c "toLocaleString('en-US')" PertInputs.svelte` | 1 (strength formatting) | 1 | PASS |
| `grep -E 'class="(text-xs\|text-sm)"' PertInputs.svelte` | no matches | 0 matches | PASS |
| File min_lines | 130 | 248 | PASS |

**Acceptance-gate over-specification (not a deviation):** The plan said `grep -c "pertState.current.strengthValue = null"` should return 1, expecting only the D-11 reset. Actual returns 2 — the second occurrence is inside the strengthStr write-direction proxy (`if (pertState.current.strengthValue !== null) { pertState.current.strengthValue = null; }`), which is a structural requirement of the string-bridge pattern (when the SelectPicker writes the empty string, we must clear the underlying state). Both writes are correct and necessary; the D-11 contract (medication change clears strengthValue) is satisfied by the lastMedId tracker; the proxy clear is a separate concern (empty string → null state). Documented for the verifier.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Acceptance Gate Drift] Em-dashes in comments**

- **Found during:** Task 1 verification (`grep -c "—" returned 5`).
- **Issue:** The plan's acceptance gate was `grep "—" returns no matches` — unconditional, comment-blind. The DESIGN.md em-dash ban (line 312) only forbids em-dashes in user-rendered strings / aria-label / screen-reader copy, but the plan's grep gate doesn't distinguish comments from rendered strings. My initial draft used em-dashes as parenthetical separators in 5 comment lines.
- **Fix:** Replaced each em-dash with an ASCII semicolon, colon, or period as appropriate (no semantic loss in comments). Rendered strings were always em-dash-free.
- **Files modified:** `src/lib/pert/PertInputs.svelte` (5 comment lines).
- **Commit:** included in the same task commit (no test/code changes; comments only).

### Architectural Changes

None. No Rule 4 deviations. The plan's interfaces, file structure, and string-bridge pattern were followed verbatim.

### Authentication Gates

None.

## Stub / Threat Surface Audit

**Stubs:** None. Every input is wired to a real state slot; SelectPicker options are real config arrays; strength reset is real reactive code.

**Threat flags:** None new. The plan's threat model entries (T-02-07 stale strength → mitigated by D-11; T-02-08 PII → accepted; T-02-09 out-of-range → mitigated by NumericInput's blur-gated showRangeError default; T-02-10 label-key drift → mitigated by D-17 lock + verbatim string in 2 places) are honored verbatim.

## Self-Check: PASSED

- File `src/lib/pert/PertInputs.svelte`: FOUND (248 lines).
- Commit hash: see git log after commit.
