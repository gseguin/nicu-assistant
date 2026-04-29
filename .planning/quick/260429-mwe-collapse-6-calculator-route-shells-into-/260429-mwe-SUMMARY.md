---
phase: 260429-mwe
plan: 01
subsystem: shell
tags:
  - refactor
  - architecture
  - route-collapse
  - context-cleanup
dependency_graph:
  requires:
    - CalculatorStore<T> (commit 45d86cf, locked)
    - Per-slice state singletons (commits 2–4, locked)
  provides:
    - CalculatorEntry (metadata view) and CalculatorModule<TState> (full module)
    - <CalculatorPage> generic route shell
    - 6 typed slice modules: pertModule, feedsModule, girModule, morphineModule, fortificationModule, uacUvcModule
  affects:
    - Registry consumption (still readonly CalculatorEntry[], identical order)
    - SelectPicker accent color (now hardcoded var(--color-identity))
tech_stack:
  added: []
  patterns:
    - Plugin module pattern: each slice exports a typed CalculatorModule<TState> from {slice}/calculator.ts
    - Structural-subtype narrowing (CalculatorModule<T> extends CalculatorEntry) for safe registry assignment
    - Generic component prop with `any` erasure for invariant generic types (CalculatorStore's merge callback is invariant in T)
key_files:
  created:
    - src/lib/shell/calculator-module.ts
    - src/lib/shell/CalculatorPage.svelte
    - src/lib/shell/CalculatorPage.test.ts
    - src/lib/shell/__test_helpers/StubComponent.svelte
    - src/lib/pert/calculator.ts
    - src/lib/feeds/calculator.ts
    - src/lib/gir/calculator.ts
    - src/lib/morphine/calculator.ts
    - src/lib/fortification/calculator.ts
    - src/lib/uac-uvc/calculator.ts
  modified:
    - src/lib/shell/registry.ts
    - src/routes/pert/+page.svelte
    - src/routes/feeds/+page.svelte
    - src/routes/gir/+page.svelte
    - src/routes/morphine-wean/+page.svelte
    - src/routes/uac-uvc/+page.svelte
    - src/routes/formula/+page.svelte
    - src/lib/shared/components/SelectPicker.svelte
    - src/lib/shared/components/SelectPicker.test.ts
    - src/lib/shared/types.ts
  deleted:
    - src/lib/shared/context.ts
decisions:
  - CalculatorPage prop typed as CalculatorModule<any> (not <unknown>) — CalculatorStore is invariant in T due to the merge callback signature; <unknown> would reject every typed consumer
  - StubComponent.svelte test helper kept (under __test_helpers/) — string-template stubs aren't supported by the test setup; one shared stub is cleaner than per-test inline components
  - Registry re-exports CalculatorEntry from calculator-module.js to preserve existing import paths (`from '$lib/shell/registry'`)
metrics:
  duration_minutes: ~10
  completed_date: 2026-04-29
  files_changed: 21
  insertions: 687
  deletions: 679
---

# Phase 260429-mwe Plan 01: Route Shell Collapse Summary

**One-liner:** Collapsed 6 near-identical calculator route shells (~600 LOC) into 5–6 LOC `+page.svelte` shells driven by a generic `<CalculatorPage>` component, with each slice owning a typed `CalculatorModule<TState>` definition.

## What Was Done

This is the final commit (5 of 5) of the architectural deepening initiative. The previous 4 commits collapsed the per-slice state singletons onto a generic `CalculatorStore<T>`. This commit collapses the per-route shell duplication on the route tier.

### Structural Changes

1. **Two new types in `src/lib/shell/calculator-module.ts`:**
   - `CalculatorEntry` — metadata-only view (id, label, href, icon, description, identityClass) used by the registry, navigation, and routing.
   - `CalculatorModule<TState>` — full module that bundles metadata + state singleton + Calculator/Inputs components + recap derivation. Each slice exports one.
   - `CalculatorModule<T> extends CalculatorEntry` — structural subtype keeps registry assignment automatic and type-safe.

2. **Generic shell component `<CalculatorPage>`:**
   - Single source of truth for the calculator route layout (header + InputsRecap + 2-column grid + sticky aside + mobile InputDrawer).
   - Renders dynamic Calculator/Inputs/Icon via `$derived` aliases (Svelte 5 idiom).
   - Conditional subtitle via `{#if mod.subtitle}` — Morphine and Formula routes have no subtitle.
   - Defensive `state.init()` on mount preserves pre-existing per-route behavior 1:1.

3. **6 slice modules in `src/lib/{slice}/calculator.ts`:**
   - PERT (mode-conditional recap with oral/tube-feed branches), Feeds, GIR, Morphine, UAC/UVC, Fortification.
   - All clinical copy (titles, subtitles, inputsLabel) moved verbatim from the previous routes.
   - Recap derivation extracted from each `+page.svelte`'s `$derived.by` block into a pure `(state) => RecapItem[]` function.

4. **Route shells reduced to 5–6 LOC each:**
   - 36 LOC total across 6 routes (was ~600 LOC).
   - Each is exactly: `<script>` import + `<CalculatorPage module={...} />`.

5. **Registry rewritten to import slice modules:**
   - Same alphabetical-by-id order (D-19 invariant): feeds, formula, gir, morphine-wean, pert, uac-uvc.
   - Re-exports `CalculatorEntry` from its new home for path-stable consumers.

### Side Cleanups

- **Deleted `src/lib/shared/context.ts`** — `getCalculatorContext` and `setCalculatorContext` are completely gone from src/. Only `accentColor` was ever read, and it's now `var(--color-identity)` directly.
- **Removed `CalculatorContext` interface** from `src/lib/shared/types.ts`. `CalculatorId` stays (used by favorites).
- **Hardcoded `var(--color-identity)`** in 3 inline color sites in `SelectPicker.svelte` (group heading + 2 selected-checkmark Check icons).
- **Dropped `vi.mock('../context.js', ...)`** from `SelectPicker.test.ts`; removed unused `vi` from the vitest import.
- **Fixed `--color-accent` drift** in morphine-wean and formula route headers — both now use `var(--color-identity)` consistently via the shell.

## Files Changed

21 files in the code commit:
- 10 created (calculator-module.ts, CalculatorPage.svelte + .test.ts, StubComponent.svelte test helper, 6× slice/calculator.ts)
- 10 modified (registry.ts, 6× +page.svelte, SelectPicker.svelte/test.ts, shared/types.ts)
- 1 deleted (shared/context.ts)

## Verification Results

| Gate | Result |
| --- | --- |
| `pnpm exec vitest run` | **489 passed** (47 test files; baseline 481 + 8 new CalculatorPage tests) |
| `pnpm exec svelte-check` | **0 errors, 0 warnings** across 4604 files |
| `grep -rn 'getCalculatorContext\|setCalculatorContext\|CalculatorContext' src/` | **0 matches** (deletion total) |
| `grep -rn 'color-accent' src/routes/` | **0 matches** (drift fixed) |
| Route LOC: `wc -l src/routes/*/+page.svelte` | **36 total** across 6 files (6 LOC each) |
| `pnpm exec vitest run src/lib/shell/__tests__/registry.test.ts` | **12/12 passing unchanged** |
| `pnpm exec vitest run src/lib/shell/CalculatorPage.test.ts` | **8/8 passing** (new tests) |
| `git diff --name-only HEAD~1 HEAD \| wc -l` | **21 files** |

## Key Decisions Made

1. **`CalculatorModule<any>` not `<unknown>` for the shell prop.** CalculatorStore is invariant in T (its merge callback puts T in both input and output positions). A `<unknown>` annotation rejected every typed slice module on first svelte-check pass. The shell never inspects state — it round-trips it through `getRecapItems` and store methods — so `any` is the honest, contained erasure. Documented in the prop annotation.

2. **One shared `StubComponent.svelte` test helper** under `src/lib/shell/__test_helpers/`. The plan flagged this as optional ("only if string-template stubs don't work"). Tested string-template fallbacks — Svelte 5 `mount` requires a real component, so a tiny shared file (10 LOC) is the cleaner path.

3. **Registry re-exports `CalculatorEntry`** from its new home (`./calculator-module.js`). Preserves existing `import { ..., type CalculatorEntry } from '$lib/shell/registry'` paths so callers (favorites, NavShell) need no edits.

## Architecture Deepening Recap (Commits 1–5)

| Commit | Hash | Change | LOC delta |
| --- | --- | --- | --- |
| 1 | 45d86cf | Generic `CalculatorStore<T>` class introduced | +85 |
| 2–4 | (state singletons) | 6 slice singletons collapsed onto `CalculatorStore<T>` | 451 → 176 (−275) |
| 5 | 0ec8f98 | Route shells collapsed onto `<CalculatorPage>` + `CalculatorModule<T>` | ~600 → ~36 (−564) |

Net effect: adding a 7th calculator now requires writing one `calculator.ts` module file and one 5-line `+page.svelte` route. No more per-route layout duplication, no more per-slice state-singleton boilerplate, no more `CalculatorContext` setup ceremony. Type-safety holds at every level: each slice's recap is fully typed against its slice's state shape; the registry preserves type-safety for metadata; the shell takes a generic module and contains the type erasure.

## Deviations from Plan

**1. [Rule 3 - Blocking issue] CalculatorPage prop type widened from `<unknown>` to `<any>`**

- **Found during:** Step 1 verification gate 1.B (`svelte-check`)
- **Issue:** The plan specified `CalculatorModule<unknown>` as the shell prop type. `svelte-check` reported 8 errors per consumer because `CalculatorStore<T>`'s `merge?: (defaults: T, parsed: Partial<T>) => T` makes the type invariant in T — `CalculatorStore<StubState>` (and likewise every real slice store) is not assignable to `CalculatorStore<unknown>`.
- **Fix:** Widened the CalculatorPage prop annotation to `CalculatorModule<any>` with a documentation comment explaining the invariance and why erasure is safe at this seam.
- **Files modified:** src/lib/shell/CalculatorPage.svelte
- **Commit:** 0ec8f98

No other deviations. Plan executed as written across all 8 steps; verification gates all passed.

## Self-Check: PASSED

- src/lib/shell/calculator-module.ts: FOUND
- src/lib/shell/CalculatorPage.svelte: FOUND
- src/lib/shell/CalculatorPage.test.ts: FOUND
- src/lib/shell/__test_helpers/StubComponent.svelte: FOUND
- src/lib/pert/calculator.ts: FOUND
- src/lib/feeds/calculator.ts: FOUND
- src/lib/gir/calculator.ts: FOUND
- src/lib/morphine/calculator.ts: FOUND
- src/lib/fortification/calculator.ts: FOUND
- src/lib/uac-uvc/calculator.ts: FOUND
- src/lib/shared/context.ts: DELETED (intentional)
- Code commit 0ec8f98: FOUND on HEAD~0 (after this summary commit lands, HEAD~1)
- vitest: 489 passing
- svelte-check: 0 errors, 0 warnings
- All grep gates clean
