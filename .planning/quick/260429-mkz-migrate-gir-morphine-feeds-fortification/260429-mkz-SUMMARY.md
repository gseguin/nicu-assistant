---
phase: 260429-mkz-migrate-gir-morphine-feeds-fortification
plan: 01
subsystem: state-singleton-collapse
tags: [refactor, state, calculator-store, slice-migration]
dependency_graph:
  requires:
    - calculator-store.svelte.ts (already on main)
    - uac-uvc/state.svelte.ts migration (commit 2 of 5, on main as template)
  provides:
    - CalculatorStore<T> instantiations for gir, morphine, feeds, fortification slices
  affects:
    - src/lib/gir/state.svelte.ts
    - src/lib/morphine/state.svelte.ts
    - src/lib/feeds/state.svelte.ts
    - src/lib/fortification/state.svelte.ts
tech_stack:
  added: []
  patterns:
    - slice-thin CalculatorStore<T> instantiation (replaces hand-written singleton class)
key_files:
  created: []
  modified:
    - src/lib/gir/state.svelte.ts
    - src/lib/morphine/state.svelte.ts
    - src/lib/feeds/state.svelte.ts
    - src/lib/fortification/state.svelte.ts
decisions:
  - Used default shallow merge (no merge fn passed) — all four slices have flat data shapes
  - Preserved each defaultState() as a named function (not inlined) for clarity and reference passing
  - Kept FortificationStateData interface inline-exported in fortification/state.svelte.ts (other code may import it)
metrics:
  duration_minutes: 2
  completed_date: 2026-04-29
  net_loc_delta: -187
  tasks_completed: 1
  files_modified: 4
---

# Phase 260429-mkz Plan 01: Migrate gir / morphine / feeds / fortification to CalculatorStore<T> Summary

Replaced four hand-written localStorage state singleton classes with thin `CalculatorStore<T>` instantiations, mirroring the UAC/UVC pilot. 303 LOC of duplicated init/persist/reset/storage-key plumbing collapsed to ~80 LOC across the four files. Public APIs (`current`, `init`, `persist`, `reset`, `lastEdited`) preserved verbatim; no consumer required edits.

## What Was Done

**Per-file mechanical recipe** (applied identically to gir, morphine, feeds, fortification):

1. Dropped module-level `STORAGE_KEY` / `TS_KEY` constants (CalculatorStore derives `_ts` automatically).
2. Removed `import { LastEdited } from '$lib/shared/lastEdited.svelte.js'` — CalculatorStore owns its own LastEdited instance.
3. Added `import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js'`.
4. Preserved each slice's `defaultState()` factory verbatim (body, return type, config import dependencies).
5. Deleted the entire `class {Slice}State { ... }` definition.
6. Replaced the export with a single `new CalculatorStore<T>({ storageKey, defaults: defaultState })` call.
7. Updated each file header comment to match the UAC/UVC reference style (slice-thin instantiation; public surface unchanged).

**Slice-specific deltas preserved:**

- **gir**: storage key `nicu_gir_state`; defaults read from `gir-config.json` (3 fields) + literal `selectedBucketId: null`.
- **morphine**: storage key `nicu_morphine_state`; defaults read from `morphine-config.json` (3 fields).
- **feeds**: storage key `nicu_feeds_state`; named import `{ defaults }` from `./feeds-config.js` preserved; all inline literals retained (`mode: 'bedside'`, `trophicFrequency: 'q3h'`, `advanceCadence: 'bid'`, `totalFluidsMlHr: null`, plus 11 config-derived fields).
- **fortification**: storage key `nicu_fortification_state`; `export interface FortificationStateData` kept inline in this file (external consumers may import it); all 5 inline literal defaults preserved.

## Verification

Three gates, all green:

| Gate                                                               | Result                                              |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| `pnpm exec vitest run src/lib/{gir,morphine,feeds,fortification}/` | 194/194 passing across 19 test files (~12.85s)      |
| `pnpm exec vitest run` (full suite)                                | 481/481 passing across 46 test files — no regression |
| `pnpm exec svelte-check`                                           | 0 errors, 0 warnings, 4595 files                    |

Sanity checks (all clean):

- `git diff --name-only HEAD~1 HEAD` — exactly 4 files (the four targets).
- `grep -nE "'nicu_(gir|morphine|feeds|fortification)_state'"` — exactly 4 lines, one per file (storage keys verbatim).
- `grep "^class.*State"` in the four migrated files — none remaining.
- `grep "LastEdited"` in the four migrated files — none remaining.
- `git diff --name-only HEAD~1 HEAD -- src/lib/morphine/test-mock-state.svelte.ts src/lib/fortification/test-mock-state.svelte.ts src/lib/fortification/state.svelte.test.ts` — empty (out-of-scope helpers untouched as required).
- `git diff --diff-filter=D HEAD~1 HEAD` — no file deletions.

## Code Footprint

| File                                          | Before (LOC) | After (LOC) | Delta    |
| --------------------------------------------- | ------------ | ----------- | -------- |
| `src/lib/gir/state.svelte.ts`                 | 72           | 23          | -49      |
| `src/lib/morphine/state.svelte.ts`            | 71           | 22          | -49      |
| `src/lib/feeds/state.svelte.ts`               | 85           | 36          | -49      |
| `src/lib/fortification/state.svelte.ts`       | 79           | 32          | -47      |
| **Total**                                     | **307**      | **113**     | **-194** |

Commit metadata reports `+39 / -226` (= -187 net) — counts only changed lines, not full file lengths.

## Deviations from Plan

None — plan executed exactly as written. The mechanical recipe applied identically across all four slices with no surprises; UAC/UVC template fit each slice cleanly.

## Decisions Made

1. **No `merge` option passed** — all four slices have flat data shapes (no nested sub-objects), so the default shallow `{ ...defaults, ...parsed }` merge in CalculatorStore is correct. PERT (commit 4 in this deepening) is the only slice that needs a custom merge (for nested `oral`/`tubeFeed` sub-objects).
2. **`defaultState()` kept as a named function** — could have been inlined as an arrow fn into the options literal, but keeping it named matches the UAC/UVC template, makes intent clearer, and lets it be referenced by name (passed by reference into `defaults:`).
3. **`FortificationStateData` interface stays in `state.svelte.ts`** — flagged in plan as an export-from-this-file other code may import; relocating it to `types.ts` was explicitly forbidden and would have broken consumers.

## Commits

- `d10ffc4` — `refactor(slices): migrate 4 state singletons to CalculatorStore<T>` (code, 4 files)
- (this SUMMARY commit hash appended below after creation)

## Self-Check: PASSED

- src/lib/gir/state.svelte.ts — FOUND, 23 LOC, instantiates `CalculatorStore<GirStateData>` with `'nicu_gir_state'`.
- src/lib/morphine/state.svelte.ts — FOUND, 22 LOC, instantiates `CalculatorStore<MorphineStateData>` with `'nicu_morphine_state'`.
- src/lib/feeds/state.svelte.ts — FOUND, 36 LOC, instantiates `CalculatorStore<FeedsStateData>` with `'nicu_feeds_state'`.
- src/lib/fortification/state.svelte.ts — FOUND, 32 LOC, instantiates `CalculatorStore<FortificationStateData>` with `'nicu_fortification_state'`.
- Code commit `d10ffc4` — FOUND in `git log`.
- Vitest gates — 194/194 targeted, 481/481 full suite (no regression).
- svelte-check — 0 errors, 0 warnings.
