---
phase: 260429-mkz-migrate-gir-morphine-feeds-fortification
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/gir/state.svelte.ts
  - src/lib/morphine/state.svelte.ts
  - src/lib/feeds/state.svelte.ts
  - src/lib/fortification/state.svelte.ts
autonomous: true
requirements:
  - state-singleton-collapse-commit-3
---

<objective>
Migrate four hand-written state singleton classes (gir, morphine, feeds, fortification) to thin
`CalculatorStore<T>` instantiations. Commit 3 of 5 in the state-singleton-collapse deepening.

All four slices use the same shallow `{ ...defaults, ...parsed }` merge — no nested sub-objects,
no custom merge function — so the migration is mechanical and identical across the four files.
The UAC/UVC pilot (commit 2, on main as `src/lib/uac-uvc/state.svelte.ts`) is the exact template.

Purpose: Reduce ~303 LOC of duplicated localStorage plumbing across four slices to ~80 LOC of
thin instantiations. Public APIs (`current`, `init`, `persist`, `reset`, `lastEdited`) are
preserved verbatim; consumers stay untouched.

Output: Four migrated `state.svelte.ts` files, full test suite still at 481 passing,
`svelte-check` clean.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@src/lib/shell/calculator-store.svelte.ts
@src/lib/uac-uvc/state.svelte.ts
@src/lib/gir/state.svelte.ts
@src/lib/morphine/state.svelte.ts
@src/lib/feeds/state.svelte.ts
@src/lib/fortification/state.svelte.ts

<interfaces>
<!-- The CalculatorStore<T> contract — already on main, do not modify. -->
<!-- Constructor calls .init() eagerly, so consumers see restored state on first read. -->

From src/lib/shell/calculator-store.svelte.ts:
```ts
export interface CalculatorStoreOptions<T> {
  storageKey: string;
  defaults: () => T;
  /** Optional custom merge for nested sub-objects. Default: shallow `{ ...defaults, ...parsed }`. */
  merge?: (defaults: T, parsed: Partial<T>) => T;
}

export class CalculatorStore<T> {
  current: T;                  // $state-backed; reactive
  lastEdited: LastEdited;      // owns its own LastEdited(`${storageKey}_ts`)
  init(): void;                // SSR-safe, idempotent, called eagerly in ctor
  persist(): void;             // setItem + lastEdited.stamp()
  reset(): void;               // defaults() + removeItem + lastEdited.clear()
}
```

<!-- Reference shape — already merged on main, exact template for all four migrations. -->

src/lib/uac-uvc/state.svelte.ts (full file, 21 LOC):
```ts
import type { UacUvcStateData } from './types.js';
import config from './uac-uvc-config.json';
import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';

function defaultState(): UacUvcStateData {
  return {
    weightKg: config.defaults.weightKg
  };
}

export const uacUvcState = new CalculatorStore<UacUvcStateData>({
  storageKey: 'nicu_uac_uvc_state',
  defaults: defaultState
});
```
</interfaces>

<storage_keys_to_preserve>
<!-- Verbatim — clinicians have these in their browser storage; renaming = data loss. -->
- gir          → 'nicu_gir_state'           (CalculatorStore derives 'nicu_gir_state_ts')
- morphine     → 'nicu_morphine_state'      (CalculatorStore derives 'nicu_morphine_state_ts')
- feeds        → 'nicu_feeds_state'         (CalculatorStore derives 'nicu_feeds_state_ts')
- fortification→ 'nicu_fortification_state' (CalculatorStore derives 'nicu_fortification_state_ts')
</storage_keys_to_preserve>

<defaultState_factories_to_preserve_verbatim>
<!-- Each slice's defaultState() body is slice-specific. Copy the body of the existing -->
<!-- defaultState() function in each file UNCHANGED into the new file. Notable specifics: -->
- gir:           reads weightKg, dextrosePct, mlPerKgPerDay from config + literal `selectedBucketId: null`
- morphine:      reads weightKg, maxDoseMgKgDose, decreasePct from config (3 fields)
- feeds:         imports `defaults` from './feeds-config.js' (NOT default config import); includes inline literals `mode: 'bedside'`, `trophicFrequency: 'q3h'`, `advanceCadence: 'bid'`, `totalFluidsMlHr: null` — preserve all of them
- fortification: pure inline literals (no config import); also note `FortificationStateData` interface is currently EXPORTED from this file — the export must be preserved
</defaultState_factories_to_preserve_verbatim>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migrate gir / morphine / feeds / fortification to CalculatorStore&lt;T&gt;</name>
  <files>
    src/lib/gir/state.svelte.ts
    src/lib/morphine/state.svelte.ts
    src/lib/feeds/state.svelte.ts
    src/lib/fortification/state.svelte.ts
  </files>
  <action>
Apply the **same mechanical recipe** to each of the four files, mirroring `src/lib/uac-uvc/state.svelte.ts`:

**Per-file recipe (apply identically to gir, morphine, feeds, fortification):**

1. **Drop** the `STORAGE_KEY` and `TS_KEY` module constants. CalculatorStore derives the `_ts` key automatically from `storageKey`.
2. **Drop** the `import { LastEdited } from '$lib/shared/lastEdited.svelte.js'` — CalculatorStore owns its own `LastEdited` instance.
3. **Add** `import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';`
4. **Preserve verbatim** the slice's existing `defaultState()` function (body, return type, config imports it depends on). Do NOT inline it; keep it as a named function so it can be passed by reference.
5. **Delete** the entire `class {Slice}State { ... }` definition (constructor, `init`, `persist`, `reset`).
6. **Replace** the final `export const {slice}State = new {Slice}State();` line with:
   ```ts
   export const {slice}State = new CalculatorStore<{Slice}StateData>({
     storageKey: '<exact existing STORAGE_KEY value>',
     defaults: defaultState
   });
   ```
7. **Update the file header comment** to match the UAC/UVC reference style (slice-thin instantiation; public surface unchanged; consumers untouched).

**Slice-specific notes (read carefully — these are the only deltas between slices):**

- **gir**: type is `GirStateData` from `./types.js`; `import config from './gir-config.json'` stays (used by `defaultState`). Storage key: `'nicu_gir_state'`.
- **morphine**: type is `MorphineStateData` from `./types.js`; `import config from './morphine-config.json'` stays. Storage key: `'nicu_morphine_state'`. **Do NOT touch `src/lib/morphine/test-mock-state.svelte.ts`** — it is a test helper and out of scope.
- **feeds**: type is `FeedsStateData` from `./types.js`; `import { defaults } from './feeds-config.js'` (named import, not default — preserve as-is) stays. Storage key: `'nicu_feeds_state'`. Preserve all inline literal defaults (`mode: 'bedside'`, `trophicFrequency: 'q3h'`, `advanceCadence: 'bid'`, `totalFluidsMlHr: null`) inside `defaultState()`.
- **fortification**: imports `BaseType, UnitType, TargetKcalOz` from `./types.js`. The `FortificationStateData` interface is currently **exported from this file** — keep `export interface FortificationStateData { ... }` exactly where it is (other code may import it). Storage key: `'nicu_fortification_state'`. **Do NOT touch `src/lib/fortification/test-mock-state.svelte.ts` or `src/lib/fortification/state.svelte.test.ts`** — both must stay green untouched.

**Hard constraints (do NOT do any of the following):**
- Do NOT modify `src/lib/shell/calculator-store.svelte.ts`.
- Do NOT modify any consumer (calculator components, inputs, route `+page.svelte` files, test files, mock-state helpers).
- Do NOT migrate PERT — its nested `oral`/`tubeFeed` sub-objects need a custom merge fn; that is commit 4.
- Do NOT rename any exported symbol (`girState`, `morphineState`, `feedsState`, `fortificationState`).
- Do NOT change any storage key string.
- Do NOT pass a `merge` option — all four slices use the default shallow merge.

**Sanity check before verifying:**
- Each migrated file should be ~20 LOC (header comment + imports + `defaultState()` factory + single `new CalculatorStore<T>({...})` export).
- `git diff --name-only HEAD` should list EXACTLY the four files above.
  </action>
  <verify>
    <automated>cd /mnt/data/src/nicu-assistant && pnpm exec vitest run src/lib/gir/ src/lib/morphine/ src/lib/feeds/ src/lib/fortification/ && pnpm exec vitest run && pnpm exec svelte-check</automated>
  </verify>
  <done>
- All four files migrated to `new CalculatorStore<T>({...})` instantiation pattern.
- `pnpm exec vitest run src/lib/{gir,morphine,feeds,fortification}/` — all green.
- `pnpm exec vitest run` — full suite at 481 passing (no regression from baseline).
- `pnpm exec svelte-check` — 0 errors, 0 warnings.
- `git diff --name-only HEAD` shows EXACTLY:
    ```
    src/lib/feeds/state.svelte.ts
    src/lib/fortification/state.svelte.ts
    src/lib/gir/state.svelte.ts
    src/lib/morphine/state.svelte.ts
    ```
- Storage keys verifiable in each migrated file: grep -E "nicu_(gir|morphine|feeds|fortification)_state'" src/lib/{gir,morphine,feeds,fortification}/state.svelte.ts returns exactly 4 lines, one per file.
- No remaining `class {Slice}State` definitions: `grep -rn "^class.*State" src/lib/{gir,morphine,feeds,fortification}/state.svelte.ts` returns nothing.
- No remaining direct `LastEdited` imports in the four migrated files: `grep -n "LastEdited" src/lib/{gir,morphine,feeds,fortification}/state.svelte.ts` returns nothing.
- `src/lib/morphine/test-mock-state.svelte.ts`, `src/lib/fortification/test-mock-state.svelte.ts`, and `src/lib/fortification/state.svelte.test.ts` unchanged: `git diff --name-only HEAD -- src/lib/morphine/test-mock-state.svelte.ts src/lib/fortification/test-mock-state.svelte.ts src/lib/fortification/state.svelte.test.ts` returns nothing.
  </done>
</task>

</tasks>

<verification>
Run all three (these are the executor's gates — do not skip any):

```bash
pnpm exec vitest run src/lib/gir/ src/lib/morphine/ src/lib/feeds/ src/lib/fortification/
pnpm exec vitest run
pnpm exec svelte-check
```

Then verify the diff scope:

```bash
git diff --name-only HEAD
# Must show EXACTLY four lines (alphabetical from git):
#   src/lib/feeds/state.svelte.ts
#   src/lib/fortification/state.svelte.ts
#   src/lib/gir/state.svelte.ts
#   src/lib/morphine/state.svelte.ts
```

Then verify storage keys preserved:

```bash
grep -nE "'nicu_(gir|morphine|feeds|fortification)_state'" \
  src/lib/gir/state.svelte.ts \
  src/lib/morphine/state.svelte.ts \
  src/lib/feeds/state.svelte.ts \
  src/lib/fortification/state.svelte.ts
# Must return exactly 4 lines, one per file.
```
</verification>

<success_criteria>
- Four files migrated to `CalculatorStore<T>` instantiation with `storageKey` + `defaults` only (no custom merge fn).
- Public exports (`girState`, `morphineState`, `feedsState`, `fortificationState`) intact and instances of `CalculatorStore`.
- Storage keys (`nicu_gir_state`, `nicu_morphine_state`, `nicu_feeds_state`, `nicu_fortification_state`) preserved verbatim.
- `pnpm exec vitest run` — 481 passing (no regression).
- `pnpm exec svelte-check` — 0 errors, 0 warnings.
- `git diff --name-only HEAD` shows exactly the four target files — no consumers touched, no test files touched, no mock-state helpers touched.
- Net code reduction: ~303 LOC → ~80 LOC across the four files.
</success_criteria>

<commit_message>
```
refactor(slices): migrate 4 state singletons to CalculatorStore<T>

gir / morphine / feeds / fortification — all four use the default
shallow merge (no nested sub-objects), so the migration is mechanical.
~303 LOC → ~80 LOC across the four files. Public APIs preserved;
consumers untouched. PERT (commit 4) follows with the custom merge
for nested oral / tubeFeed sub-objects.
```
</commit_message>

<output>
After completion, summary lives in the quick-task directory:
`.planning/quick/260429-mkz-migrate-gir-morphine-feeds-fortification/260429-mkz-SUMMARY.md`
</output>
