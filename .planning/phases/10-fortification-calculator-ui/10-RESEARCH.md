# Phase 10: Fortification Calculator UI - Research

**Researched:** 2026-04-07
**Domain:** Svelte 5 component build, mirror of morphine pattern
**Confidence:** HIGH (all references verified by direct file read)

## Summary

Phase 10 is a "look-and-mirror" phase. Every required pattern already exists in `src/lib/morphine/` and `src/lib/shared/components/`. No new dependencies, no new abstractions. The only material design risk — disabling individual options in `SelectPicker` for the UI-03 packets case — is **not supported** by the current `SelectPicker.svelte` and the `SelectOption` type. CONTEXT.md explicitly authorizes the inline-message fallback, so this is NOT a blocker; the planner should simply pick the fallback path.

**Primary recommendation:** Mirror `MorphineWeanCalculator.svelte` / `state.svelte.ts` / `MorphineWeanCalculator.test.ts` file-for-file. Use the inline-message + auto-reset fallback for UI-03. Reuse the existing grouped-option capability of `SelectPicker` (via `option.group`).

## User Constraints (from CONTEXT.md)

### Locked Decisions
- New `src/lib/fortification/state.svelte.ts` (sessionStorage singleton, mirror morphine)
- New `src/lib/fortification/FortificationCalculator.svelte`
- New `src/lib/fortification/FortificationCalculator.test.ts`
- Update `src/routes/formula/+page.svelte` to render `<FortificationCalculator />`
- Update `src/lib/shell/registry.ts` Formula entry; update `src/lib/shared/about-content.ts` Formula entry
- Defaults: BM / 180 mL / `neocate-infant` / 24 / `teaspoons`
- Layout: hero "Amount to Add" card + verification card (Yield / Exact / Suggested)
- kcal/oz: SelectPicker with flat list of 5 string options
- Live recalc, no debounce, no magnification
- All colors via OKLCH `var(--color-*)` tokens; both themes
- Reuse only `NumericInput` + `SelectPicker`; no new primitives
- Packets-disable UX preferred; inline-message fallback authorized
- Don't touch `src/lib/formula/` (Phase 11) or `NavShell.test.ts` tsc errors

### Claude's Discretion
- Whether to inherit the recalculation pulse animation from morphine (optional)

### Deferred Ideas (OUT OF SCOPE)
- Per-brand allowed kcal/oz constraints
- Recipe sharing / printing / export
- Saving recently-used formulas as favorites
- Pre-existing tsc errors in `NavShell.test.ts`

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | 5 inputs visible | NumericInput (volume) + 4× SelectPicker (base, formula grouped, kcal, unit) |
| UI-02 | 4 outputs live | `$derived` over `calculateFortification()`; mirrors morphine `$derived` schedule |
| UI-03 | Packets-only-for-HMF UX | SelectPicker has no disabled-option support → inline message + auto-reset (CONTEXT-authorized fallback) |
| UI-04 | Reuse shared components only | NumericInput + SelectPicker confirmed sufficient |
| UI-05 | Light + dark via OKLCH tokens | All morphine classes use `var(--color-*)`; copy verbatim |

## 1. Morphine Pattern Reference

### `src/lib/morphine/state.svelte.ts` (file shape to mirror)

Key elements:
- Constant `SESSION_KEY = 'nicu_morphine_state'` → use `'nicu_fortification_state'`.
- `defaultState()` factory pulls from `morphine-config.json` defaults; for fortification, hard-code defaults from CONTEXT (BM / 180 / `neocate-infant` / 24 / `teaspoons`).
- Module-level `let _state = $state<...>(defaultState())`.
- Exported singleton object `morphineState` with: `get current()`, `init()` (reads sessionStorage in onMount only), `persist()` (writes to sessionStorage), `reset()` (resets and removes key).
- All sessionStorage calls wrapped in try/catch and silenced (private browsing safety).

Mirror as `fortificationState` with `FortificationStateData`:
```ts
interface FortificationStateData {
  base: BaseType;          // 'breast-milk'
  volumeMl: number | null; // 180
  formulaId: string;       // 'neocate-infant'
  targetKcalOz: TargetKcalOz; // 24
  unit: UnitType;          // 'teaspoons'
}
```

### `src/lib/morphine/MorphineWeanCalculator.svelte` (structure to mirror)

Sections in order:
1. `<script lang="ts">`: imports (calc fn, state singleton, NumericInput, types).
2. Magnification setup — **OMIT** entirely for fortification (no scroll mag per CONTEXT).
3. `$derived.by(() => ...)` returning the result, with null/zero guards. Pattern:
   ```ts
   let result = $derived.by(() => {
     const { base, volumeMl, formulaId, targetKcalOz, unit } = fortificationState.current;
     if (volumeMl === null || volumeMl <= 0) return null;
     const formula = getFormulaById(formulaId);
     if (!formula) return null;
     return calculateFortification({ formula, base, volumeMl, targetKcalOz, unit });
   });
   ```
4. `$effect(() => { JSON.stringify(fortificationState.current); fortificationState.persist(); })` — exact pattern, JSON.stringify forces deep tracking.
5. Auto-reset effect for UI-03: `$effect` watching `formulaId` — if not `similac-hmf` and `unit === 'packets'`, set `unit = 'teaspoons'`.
6. `hasValues` derived for Clear button visibility.
7. Template: inputs `<section class="card flex flex-col gap-4">`, outputs in result cards with `aria-live="polite" aria-atomic="true"`.
8. Tailwind tokens: `bg-[var(--color-surface-card)]`, `text-[var(--color-text-primary)]`, `border-[var(--color-border)]`, `text-[var(--color-accent)]`, `bg-[var(--color-accent-light)]`. Use the exact same token vocabulary — no new tokens.
9. The hero number uses `class="num text-xl font-bold text-[var(--color-text-primary)]"` (the `num` class supplies tabular numerals — already global).
10. Empty state: `rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-8 text-center` placeholder.

### `src/lib/morphine/MorphineWeanCalculator.test.ts` (test pattern to mirror)

- Framework: `vitest` + `@testing-library/svelte` (`render`, `screen`, `fireEvent`).
- **Critical pattern:** Module-mock the state singleton because `$state` runes are hard to drive from tests:
  ```ts
  const mockState = { base: 'breast-milk', volumeMl: 180, formulaId: 'neocate-infant', targetKcalOz: 24, unit: 'teaspoons' };
  vi.mock('$lib/fortification/state.svelte.js', () => ({
    fortificationState: {
      get current() { return mockState; },
      init: vi.fn(), persist: vi.fn(),
      reset: vi.fn(() => { /* reset mockState */ }),
    },
  }));
  ```
- Tests assert via `getByLabelText`, `getByRole('spinbutton')`, `getByText(/Amount to Add/)`, etc.
- `beforeEach` resets `mockState` to defaults.
- Test colocation: `FortificationCalculator.test.ts` lives next to `FortificationCalculator.svelte` per project convention (per MEMORY.md `feedback_test_colocation`).

## 2. SelectPicker Capabilities Audit

File: `src/lib/shared/components/SelectPicker.svelte`. Built on `bits-ui` `Select.*`.

| Capability | Supported? | Evidence / Workaround |
|------------|------------|------------------------|
| Grouped options | **YES** | Lines 22–25 derive groups from `option.group`; lines 62–90 render `Select.Group` + `Select.GroupHeading` per group. Group order = first-seen order in the `options` array. |
| Flat options | YES | Lines 91–110 render flat list when no group present. |
| String values only | YES | `value` typed as `string`; `bind:value` returns string. **Implication:** kcal/oz (numeric union `22|24|26|28|30`) and `volumeMl` enum-likes must be stored as strings in the bound surface and parsed on read, OR stored as strings in state and cast at the calc-call boundary. Recommended: keep state typed as `TargetKcalOz` numeric, use a small `selectedKcalStr` derived bind helper, OR widen the state field to `string` and `Number()`-cast at the call site. The planner should pick one approach and document it in PLAN. |
| Disabled individual options | **NO** | `Select.Item` is rendered with no `disabled` prop and `SelectOption` (in `src/lib/shared/types.ts`) has only `{ value, label, group? }`. There is no plumbing to pass a per-option `disabled` flag through to bits-ui. |
| Per-option styling for "unavailable" | NO | Same reason. |

**UI-03 decision:** Disabled-option path is not feasible without modifying `SelectPicker` and `SelectOption`, which CONTEXT scope-protects ("no new primitives", "consume only, do not modify"). **Use the inline-message fallback** authorized in CONTEXT:

1. Render the Unit `SelectPicker` with all 5 options always present.
2. Add an `$effect` that auto-resets `unit` to `'teaspoons'` whenever `formulaId !== 'similac-hmf' && unit === 'packets'`.
3. Render an inline note below the unit picker (only when the user just had packets selected on a non-HMF formula) — e.g. show a `text-xs text-[var(--color-text-secondary)]` line: "Packets is only available for Similac HMF — switched to Teaspoons." A transient `$state` flag set inside the auto-reset effect controls visibility; clear on next interaction or after a render tick.
4. The result card never shows zero for this case because the auto-reset prevents it.

This satisfies UI-03's "rather than silently showing 0" requirement.

## 3. Existing Formula Calculator — Grouping Reference

File: `src/lib/formula/FormulaCalculator.svelte`. **It does not group brands itself** — it only delegates to `ModifiedFormulaCalculator` and `BreastMilkFortifierCalculator` via tabs. The actual grouped picker (if any) is inside those subcomponents and is **not needed as a reference** — `SelectPicker` already supports grouping natively via the `group` field on each `SelectOption` (verified above). The planner just needs to map fortification config rows to:

```ts
const formulaOptions: SelectOption[] = getFortificationFormulas()
  .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name))
  .map((f) => ({ value: f.id, label: f.name, group: f.manufacturer }));
```

This produces 4 groups (Abbott, Mead Johnson, Nestlé, Nutricia) in alphabetical order with brands sorted within. Verified `fortification-config.json` row shape (`id`, `name`, `manufacturer`, `displacement_factor`, `calorie_concentration`, `grams_per_scoop`) matches `FortificationFormula` type and `manufacturer` is a plain string (Nestlé encoded as `Nestl\u00e9` JSON escape — renders correctly).

## 4. Registry Update Needed

File: `src/lib/shell/registry.ts`. The Formula entry shape:
```ts
{ id: 'formula', label: 'Formula', href: '/formula', icon: Milk, description: 'Infant formula recipe calculator' }
```

Phase 10 update — only the `description` field meaningfully changes (and arguably `label`). Suggested:
- `label`: keep `'Formula'` (short, fits nav). Optionally `'Fortification'`. Planner picks; CONTEXT does not lock.
- `description`: "Infant formula fortification calculator" (used by screen readers).

`id`, `href`, `icon` (Milk) all remain. No new entries; no removal.

## 5. About Sheet Update Needed

File: `src/lib/shared/about-content.ts`. The `formula` key currently reads:
- `title`: "Infant Formula Calculator"
- `description`: mentions "powder (grams and scoops) and water (mL) quantities"
- `notes`: 3 bullets referencing "modified formula and human milk fortifier (BMF) modes" and displacement factors

Phase 10 must replace these with copy that describes the unified fortification calculator: 5 inputs (base, volume, formula, target kcal/oz, unit), 4 outputs (Amount to Add, Yield, Exact kcal/oz, Suggested Starting Volume), 30 formulas across 4 manufacturers, 5 unit options including HMF-only Packets. Keep the same 3-bullet `notes` shape; keep `title` either "Infant Formula Calculator" or update to "Fortification Calculator" (planner picks). The `aboutContent: Record<CalculatorId, AboutContent>` shape and `CalculatorId` union (`'morphine-wean' | 'formula'`) do NOT change.

## 6. Current /formula Route

File: `src/routes/formula/+page.svelte`. Today it:
1. Imports `formulaState` from `$lib/formula/state.svelte.js` and `FormulaCalculator` from `$lib/formula/FormulaCalculator.svelte`.
2. Calls `setCalculatorContext({ id: 'formula', accentColor: 'var(--color-accent)' })` in `onMount`.
3. Calls `formulaState.init()` in `onMount`.
4. Renders `<svelte:head><title>Formula Recipe | NICU Assistant</title>`.
5. Renders a header with `<Milk size={28}>` icon + `<h1>Formula Recipe</h1>` and `<FormulaCalculator />`.

**Replacement diff for Phase 10:**
- Replace `import FormulaCalculator from '$lib/formula/FormulaCalculator.svelte'` with `import FortificationCalculator from '$lib/fortification/FortificationCalculator.svelte'`.
- Replace `import { formulaState } from '$lib/formula/state.svelte.js'` with `import { fortificationState } from '$lib/fortification/state.svelte.js'`.
- Replace `formulaState.init()` with `fortificationState.init()`.
- Replace `<FormulaCalculator />` with `<FortificationCalculator />`.
- Keep `setCalculatorContext({ id: 'formula', accentColor: 'var(--color-accent)' })` unchanged — `CalculatorId` still has `'formula'`.
- Keep `<svelte:head>`, container classes (`max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4`), header markup, and `<Milk>` icon. Optionally change `<h1>Formula Recipe</h1>` to `<h1>Fortification</h1>` — discretionary.
- **Do not delete** the legacy `$lib/formula/state.svelte.js` import target; the file still exists until Phase 11. The route just stops importing from it.

## 7. Phase 10 File Layout (LOCKED from CONTEXT)

```
src/lib/fortification/
  types.ts                          (existing — Phase 9, untouched)
  fortification-config.json         (existing — Phase 9, untouched)
  fortification-config.ts           (existing — Phase 9, untouched)
  fortification-config.test.ts      (existing — Phase 9, untouched)
  calculations.ts                   (existing — Phase 9, untouched)
  calculations.test.ts              (existing — Phase 9, untouched)
  state.svelte.ts                   (NEW)
  FortificationCalculator.svelte    (NEW)
  FortificationCalculator.test.ts   (NEW — colocated)

src/routes/formula/+page.svelte     (UPDATE — swap import + component)
src/lib/shell/registry.ts           (UPDATE — Formula entry description)
src/lib/shared/about-content.ts     (UPDATE — formula entry copy)
```

## 8. Open Questions (RESOLVED)

1. **Does SelectPicker support grouped options?** RESOLVED — YES, via `option.group` field. Verified in source.
2. **Does SelectPicker support disabled individual options?** RESOLVED — NO. Use CONTEXT-authorized inline-message + auto-reset fallback. Not a blocker.
3. **Where does the morphine state pattern live and how is it shaped?** RESOLVED — `src/lib/morphine/state.svelte.ts`, documented in §1.
4. **How are morphine component tests structured around `$state` runes?** RESOLVED — module-mock the singleton with a plain object exposing `get current()`. Pattern documented in §1.
5. **Calculator registry shape and update target?** RESOLVED — `CalculatorEntry` interface in `registry.ts`, only `description` (and optionally `label`) changes. Documented §4.
6. **About sheet shape and update target?** RESOLVED — `aboutContent['formula']`. Shape is `{ title, version, description, notes }`. Documented §5.
7. **Current /formula route contents and replacement diff?** RESOLVED — documented §6.
8. **fortification-config.json shape verification?** RESOLVED — matches `FortificationFormula` type, `manufacturer` is a plain string field on every row.
9. **TargetKcalOz handling in SelectPicker (string vs number)?** RESOLVED — SelectPicker is string-only. Planner should either store kcal/oz as `string` in state and `Number()` at call site, or keep numeric in state and use a derived string adapter. Either is fine; pick one in PLAN.
10. **Existing formula calc grouping reference?** RESOLVED — not actually used; SelectPicker's native grouping is sufficient. Documented §3.

## Sources

### Primary (HIGH confidence — direct file read)
- `src/lib/morphine/state.svelte.ts`, `MorphineWeanCalculator.svelte`, `MorphineWeanCalculator.test.ts`, `types.ts`
- `src/lib/shared/components/SelectPicker.svelte`, `NumericInput.svelte`, `src/lib/shared/types.ts`
- `src/lib/shell/registry.ts`, `src/lib/shared/about-content.ts`
- `src/routes/formula/+page.svelte`
- `src/lib/fortification/types.ts`, `calculations.ts`, `fortification-config.ts`, `fortification-config.json`
- `.planning/phases/10-fortification-calculator-ui/10-CONTEXT.md`, `.planning/REQUIREMENTS.md`

## RESEARCH COMPLETE
