# Phase 3: Calculators - Research

**Researched:** 2026-03-31
**Domain:** SvelteKit 5 runes — porting two standalone calculators (PERT dosing, infant formula recipe) into a unified app with shared components, sessionStorage state, and dark mode token migration.
**Confidence:** HIGH — based on direct inspection of all source files from both reference apps and all shared components already built in Phase 2.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Copy business logic files (dosing.ts, medications.ts, clinical-config.ts/json, formula.ts, formula-config.ts/json) with import path adaptations only. No logic changes — these are proven correct.
- **D-02:** Port UI components (DosingCalculator, FormulaCalculator, etc.) and refactor to use Phase 2 shared components (SelectPicker, NumericInput, ResultsDisplay) in a single pass. Don't copy-then-refactor — do it in one step.
- **D-03:** Business logic lives in `src/lib/pert/` and `src/lib/formula/` respectively. UI components live in calculator-specific route directories or co-located component files.
- **D-04:** Module-level `$state` (Svelte 5 runes) with sessionStorage backup for each calculator. State survives tab switches and page refreshes. Clears on tab close (safe for clinical use — no stale inputs between sessions).
- **D-05:** Each calculator gets its own state module (e.g., `src/lib/pert/state.svelte.ts`, `src/lib/formula/state.svelte.ts`). States are fully isolated — no cross-contamination.
- **D-06:** Pattern matches `theme.svelte.ts` from Phase 1 — singleton module with `$state` runes, init/persist functions.
- **D-07:** Replace hardcoded OKLCH color literals in formula components with semantic CSS custom property tokens (bg-surface, text-primary, border-border, etc.) during the port — not as a separate pass.
- **D-08:** All ported components must render correctly in both dark and light themes. No hardcoded `oklch(...)`, `bg-white`, `text-slate-*`, or `bg-clinical-*` literals.

### Claude's Discretion

- File organization within src/lib/pert/ and src/lib/formula/
- How to split the large DosingCalculator.svelte (~900 lines) — keep as one file or extract sub-components
- Tube-feed specific files organization
- Test file placement and coverage scope
- Whether to create a shared calculation utilities module or keep calculator logic fully separate

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERT-01 | Meal mode: fat grams + lipase rate + brand/strength inputs produce capsule count | `calculateCapsules()` in dosing.ts is a pure function ready to port; SelectPicker handles brand/strength dropdowns; NumericInput handles fat grams |
| PERT-02 | Tube-feed mode with independent state from meal mode | DosingCalculator already has dual $state objects (mealState + tubeFeedState); tube-feed data in `tube-feed/clinical-data.ts` — different strength sets from meal mode |
| PERT-03 | Tab switching between meal and tube-feed preserves both states | Both states must be in sessionStorage-backed module; switching tabs unmounts route component so state must survive via sessionStorage |
| PERT-04 | All FDA medication brands and strengths from clinical-config.json | 5 brands confirmed in JSON: Creon, Zenpep, Pancreaze, Pertzye, Viokace with full strength arrays. Tube-feed variant has additional strengths (Pancreaze 2600, 37000; Pertzye 4000, 24000) |
| PERT-05 | Feature parity with standalone pert-calculator app | Full port of DosingCalculator.svelte logic; includes: mode tabs, keyboard nav (ArrowLeft/Right/Home/End), fat grams scroll wheel, result animation key bump, validation messages from clinical-config.json |
| FORM-01 | Modified formula mode: brand + target kcal/oz + volume produce water mL and powder grams | `calculateRecipe()` in formula.ts is proven; ported BrandSelector uses SelectPicker with manufacturer grouping; NumericInput handles kcalOz and volumeMl |
| FORM-02 | BMF mode: brand + target kcal/oz + volume + baseline EBM produce EBM mL and powder grams | `calculateBMF()` in formula.ts handles this; BMFCalculator has an extra baselineKcalOz NumericInput; guard: kcalOz must be > baselineKcalOz or no result shown |
| FORM-03 | Dispensing measures (scoops, packets, tbsp, tsp) displayed when available | FormulaResult type has scoops/packets/tbsp/tsp as number \| null; ResultsDisplay must handle multi-row display for these measures |
| FORM-04 | All 40+ formula brands from formula-config.json with manufacturer grouping | BRANDS array from formula-config.ts; SelectOption.group field drives manufacturer groups in SelectPicker |
| FORM-05 | Feature parity with standalone formula-calculator app | Full port of FormulaCalculator + ModifiedFormulaCalculator + BreastMilkFortifierCalculator + BrandSelector; dark mode token migration required |
| CC-01 | Calculator state preserved when switching between PERT and formula via nav | sessionStorage-backed state modules; SvelteKit route navigation unmounts components — state MUST live outside components |
| CC-02 | Each calculator's state isolated — no cross-contamination | Separate state modules, separate sessionStorage keys: `nicu_pert_state` and `nicu_formula_state` |
| CC-03 | Input validation on all numeric fields (prevent empty/invalid submissions) | PERT: `validateFatGrams()` already exists; Formula: `validateRecipeInputs()` and `validateBMFInputs()` already exist; NumericInput handles null + clamp on blur |
</phase_requirements>

---

## Summary

Phase 3 ports two fully functional standalone calculators (PERT dosing and infant formula recipe) into the unified nicu-assistant app. The heavy lifting — business logic, clinical data, validation rules — already exists and is proven correct in the reference apps. The phase work is primarily: (1) copying business logic files with import path adaptations, (2) porting UI components while simultaneously refactoring to use Phase 2 shared components and dark mode tokens, and (3) implementing sessionStorage-backed state modules so calculator state survives cross-calculator navigation.

The reference app source code has been fully read. All business logic is in pure `.ts` files with no Svelte coupling, making the port low-risk. The formula calculator UI has hardcoded OKLCH literals throughout (light-only app) — every formula component needs token migration. The PERT DosingCalculator is ~900 lines and handles meal + tube-feed modes with full keyboard navigation; splitting it into sub-components is at Claude's discretion but is not required for correctness. The shared components (SelectPicker, NumericInput, ResultsDisplay) built in Phase 2 are already compatible with what both calculators need — no API mismatches.

The single highest-risk item is the **BrandSelector component**: the formula app's `BrandSelector.svelte` passes `options` with `{ id, label, group }` shape (using `id` as key), but the Phase 2 `SelectPicker` expects `SelectOption = { value, label, group? }` (using `value` as key). The ported BrandSelector must map `b.id → value` when constructing SelectOption objects. This is a one-line fix but must not be missed.

**Primary recommendation:** Work in this sequence — (1) copy business logic files, (2) write state.svelte.ts modules for both calculators, (3) port PERT calculator UI + token migration, (4) port formula calculator UI + token migration, (5) wire up both route pages, (6) add tests for business logic. Each step is independently verifiable.

---

## Standard Stack

### Core (already installed — confirmed in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | ^2.55.0 | Routing and build framework | Project constraint; Phase 1/2 complete |
| Svelte (runes) | ^5.55.0 | `$state`, `$derived`, `$effect` | Project constraint; all Phase 2 code uses runes |
| TypeScript | ^5.9.3 | Type safety for clinical logic | Project constraint |
| Tailwind CSS | ^4.2.2 | Utility styling with custom token classes | Project constraint; semantic tokens already defined |
| bits-ui | installed (Phase 2) | SelectPicker uses Select.Root, Select.Trigger, etc. | Already in use |
| @lucide/svelte | installed (Phase 2) | Icons used in both calculator UIs | Already in use — `Baby`, `Milk`, `AlertCircle`, `Info`, `Check`, `ChevronDown` |
| Vitest | ^4.1.2 | Unit tests for business logic | Project constraint; already configured |

### No New Dependencies Required

Both calculators and all their business logic work with the existing stack. The formula app used `lucide-svelte` (Svelte 3/4 package) for `Baby`, `Milk`, `AlertCircle`, `Info` icons — the unified app uses `@lucide/svelte` (Svelte 5 package) which is already installed. No icon substitutions needed; the same icon names are available.

The formula app used `svelte/transition` (`fade`, `slide`) — these are built into Svelte 5 and available without additional packages.

---

## Architecture Patterns

### Confirmed Directory Layout for Phase 3

```
src/
├── lib/
│   ├── shared/                         # Phase 2 — do not modify
│   │   ├── components/
│   │   │   ├── SelectPicker.svelte     # bits-ui Select; supports groups via SelectOption.group
│   │   │   ├── NumericInput.svelte     # type="number", inputmode="decimal", clamps on blur
│   │   │   └── ResultsDisplay.svelte   # primary+secondary result cards; accentVariant prop
│   │   ├── context.ts                  # setCalculatorContext / getCalculatorContext (Symbol key)
│   │   ├── types.ts                    # SelectOption, CalculatorId, CalculatorContext
│   │   └── theme.svelte.ts             # Pattern reference for state modules
│   ├── pert/                           # NEW — Phase 3
│   │   ├── dosing.ts                   # COPY from pert-calculator (import path adapt only)
│   │   ├── medications.ts              # COPY from pert-calculator (import path adapt only)
│   │   ├── clinical-config.ts          # COPY from pert-calculator (import path adapt only)
│   │   ├── clinical-config.json        # COPY verbatim
│   │   ├── tube-feed/
│   │   │   ├── clinical-data.ts        # COPY from pert-calculator/src/lib/tube-feed/
│   │   │   ├── medications.ts          # COPY from pert-calculator/src/lib/tube-feed/
│   │   │   └── examples.ts             # COPY from pert-calculator/src/lib/tube-feed/
│   │   └── state.svelte.ts             # NEW — sessionStorage-backed $state singleton
│   └── formula/                        # NEW — Phase 3
│       ├── formula.ts                  # COPY from formula-calculator (import path adapt only)
│       ├── formula-config.ts           # COPY from formula-calculator (import path adapt only)
│       ├── formula-config.json         # COPY verbatim
│       └── state.svelte.ts             # NEW — sessionStorage-backed $state singleton
├── routes/
│   ├── pert/
│   │   └── +page.svelte                # REPLACE skeleton; mount DosingCalculator, set context
│   └── formula/
│       └── +page.svelte                # REPLACE skeleton; mount FormulaCalculator, set context
```

The DosingCalculator.svelte and FormulaCalculator.svelte sub-components are at Claude's discretion for placement — either co-located in `src/lib/pert/` and `src/lib/formula/`, or within their route directories.

### Pattern 1: sessionStorage-Backed State Singleton (D-04 / D-06)

The existing `theme.svelte.ts` is the reference pattern. PERT and formula each get their own singleton state module.

```typescript
// src/lib/pert/state.svelte.ts
// .svelte.ts extension required — Svelte compiler only processes $state in .svelte and .svelte.ts

const SESSION_KEY = 'nicu_pert_state';

type PertMode = 'meal' | 'tube-feed';

interface PertState {
  activeMode: PertMode;
  meal: {
    fatGramsRaw: string;
    lipaseRateStr: string;
    selectedBrand: string;
    selectedStrengthStr: string;
  };
  tubeFeed: {
    fatGramsRaw: string;
    lipaseRateStr: string;
    selectedBrand: string;
    selectedStrengthStr: string;
  };
}

function defaultState(): PertState { ... }

let _state = $state<PertState>(defaultState());

export const pertState = {
  get current(): PertState { return _state; },
  init(): void {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) _state = { ...defaultState(), ...JSON.parse(raw) };
    } catch { /* ignore parse errors */ }
  },
  persist(): void {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(_state)); } catch {}
  },
  reset(): void {
    _state = defaultState();
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }
};
```

**Critical implementation note:** `init()` must be called in the route page's `onMount`, not at module load time. SessionStorage is not available during SSR (even though this app uses `ssr: false` / `adapter-static`, calling browser APIs at module load time is a footgun to avoid). Persist via a `$effect` in the calculator component that writes on state change.

### Pattern 2: Import Path Adaptation for Business Logic (D-01)

All business logic files use `$lib` SvelteKit alias for internal imports. The only change required when copying them is updating the alias paths from the source app's `$lib` to the unified app's `$lib/pert/` or `$lib/formula/` subdirectory.

```typescript
// SOURCE (pert-calculator):
import { CLINICAL_CONFIG, type FormulaDefinition } from '$lib/clinical-config';

// UNIFIED APP (after copy to src/lib/pert/dosing.ts):
import { CLINICAL_CONFIG, type FormulaDefinition } from '$lib/pert/clinical-config';
```

The `dosing.ts` references `$lib/clinical-config`. After copying to `src/lib/pert/dosing.ts`, change to `$lib/pert/clinical-config`. That is the complete change — no logic edits.

Similarly for tube-feed files:
```typescript
// SOURCE:
import { LIPASE_RATES } from '$lib/medications';
import { TUBE_FEED_MEDICATIONS } from '$lib/tube-feed/clinical-data';

// UNIFIED APP (src/lib/pert/tube-feed/medications.ts):
import { LIPASE_RATES } from '$lib/pert/medications';
import { TUBE_FEED_MEDICATIONS } from '$lib/pert/tube-feed/clinical-data';
```

### Pattern 3: Route Page Sets Calculator Context (D-06 from Phase 2)

Each route page must call `setCalculatorContext()` in `onMount` so that shared components (SelectPicker, ResultsDisplay) receive the correct accent color.

```typescript
// src/routes/pert/+page.svelte
import { onMount } from 'svelte';
import { setCalculatorContext } from '$lib/shared/context.js';

onMount(() => {
  setCalculatorContext({
    id: 'pert',
    accentColor: 'var(--color-accent)'   // clinical blue
  });
  pertState.init();   // load sessionStorage
});
```

```typescript
// src/routes/formula/+page.svelte
onMount(() => {
  setCalculatorContext({
    id: 'formula',
    accentColor: 'var(--color-accent)'   // clinical blue for modified mode
    // BMF mode uses accentVariant="bmf" directly on ResultsDisplay
  });
  formulaState.init();
});
```

### Pattern 4: Dark Mode Token Migration (D-07 / D-08)

The formula calculator components use hardcoded class names throughout. The complete migration map:

| Old (formula app) | New (unified app) |
|---|---|
| `bg-clinical-50`, `bg-clinical-100`, `bg-clinical-600` | `bg-[var(--color-surface-alt)]`, `bg-[var(--color-surface)]`, `bg-[var(--color-accent)]` |
| `bg-white`, `bg-slate-50` | `bg-[var(--color-surface-card)]`, `bg-[var(--color-surface)]` |
| `text-slate-900`, `text-slate-800` | `text-[var(--color-text-primary)]` |
| `text-slate-600`, `text-slate-500` | `text-[var(--color-text-secondary)]` |
| `text-clinical-600`, `text-clinical-700` | `text-[var(--color-accent)]` |
| `border-clinical-100`, `border-slate-100` | `border-[var(--color-border)]` |
| `bg-bmf-50`, `bg-bmf-600` | `bg-[var(--color-surface-alt)]` (container), `bg-[var(--color-bmf-600)]` (result card — already in @theme) |
| `text-bmf-800` | `text-[var(--color-bmf-800)]` |
| `border-bmf-200` | `border-[var(--color-bmf-200)]` |
| `focus-visible:ring-clinical-500/50` | `focus-visible:ring-[var(--color-accent-light)]` |

**Key rule:** `var(--color-bmf-*)` variables ARE defined in `app.css @theme` and can be used directly. All other hardcoded palette references must become semantic tokens.

### Pattern 5: ResultsDisplay Adapter for Formula

The Phase 2 `ResultsDisplay` component has this signature:
```typescript
{
  primaryValue: string;
  primaryUnit: string;
  primaryLabel: string;
  secondaryValue?: string;
  secondaryUnit?: string;
  secondaryLabel?: string;
  isVisible?: boolean;
  accentVariant?: 'clinical' | 'bmf';
}
```

The formula calculator displays: `g_powder` as primary, `mL_water` / `mL_ebm` as secondary, plus optional dispensing measures (scoops, packets, tbsp, tsp). Since ResultsDisplay only supports primary + secondary, the dispensing measures need a separate display section below the ResultsDisplay card, or ResultsDisplay needs a slot/extension. Recommendation: add a third card below ResultsDisplay for dispensing measures — rendered conditionally when `scoops`, `packets`, `tbsp`, or `tsp` are non-null. Do NOT modify the shared ResultsDisplay component API — render a separate inline block in the formula component.

The original formula app has this pattern in its ResultsDisplay:

```svelte
<!-- Source formula app ResultsDisplay.svelte -->
<ResultsDisplay
  waterMl={recipe.mL_water}
  powderG={recipe.g_powder}
  mode="modified"
/>
```

But the Phase 2 ResultsDisplay uses `primaryValue/primaryUnit/primaryLabel` props, not `waterMl/powderG/mode`. The formula port must adapt to the new API:

```svelte
<!-- Ported to Phase 2 ResultsDisplay API -->
<ResultsDisplay
  primaryValue={String(recipe.g_powder)}
  primaryUnit="g"
  primaryLabel="Required Powder"
  secondaryValue={String(recipe.mL_water)}
  secondaryUnit="mL"
  secondaryLabel="Water"
  accentVariant="clinical"
/>
```

For BMF mode, `secondaryLabel` becomes "Breast Milk" and `secondaryValue` uses `recipe.mL_ebm`.

### Pattern 6: BrandSelector — Key Field Mapping

The source formula app's `BrandSelector.svelte` builds options as `{ id, label, group }`. The Phase 2 `SelectPicker` requires `SelectOption = { value, label, group? }`. The ported BrandSelector must remap:

```typescript
// SOURCE (formula app BrandSelector — uses id as key):
const options = BRANDS.map(b => ({
  id: b.id,
  label: b.brand,
  group: b.manufacturer
}));

// UNIFIED APP BrandSelector — must use value instead of id:
const options: SelectOption[] = BRANDS.map(b => ({
  value: b.id,      // SelectPicker.value field — must be "value", not "id"
  label: b.brand,
  group: b.manufacturer
}));
```

This mapping is critical. Getting it wrong means the SelectPicker never reports a selected value, silently producing `undefined` brand lookups and `null` recipes.

### Anti-Patterns to Avoid

- **Calling sessionStorage in module-level code:** `init()` must be called in `onMount`, not at module load. SSR context (even with adapter-static) does not have `sessionStorage`.
- **Storing raw HTML elements in state modules:** Only serializable data (strings, numbers, booleans) should go into sessionStorage-backed state. DOM refs stay as component-level `$state`.
- **Modifying shared components to accommodate calculator-specific needs:** If ResultsDisplay needs extension, add content in the calculator component — do not change the shared component API.
- **Keeping formula app's `import { Baby, Milk } from 'lucide-svelte'`:** The unified app uses `@lucide/svelte`, not `lucide-svelte`. Same icon names, different package. All lucide imports in ported components must change to `from '@lucide/svelte'`.
- **Using `bg-clinical-600` as a Tailwind class:** In the unified app, `bg-clinical-600` works as a Tailwind utility but it is a static color that does NOT respect dark mode. Use `bg-[var(--color-accent)]` instead so the dark mode token swap applies.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Brand selection with manufacturer groups | Custom grouped dropdown | Phase 2 `SelectPicker` with `SelectOption.group` | Already implemented with bits-ui keyboard nav, focus trap, dark mode tokens |
| Fat grams / kcal numeric input | Raw `<input type="number">` | Phase 2 `NumericInput` | Has wheel scroll, clamp-on-blur, error display, `inputmode="decimal"`, WCAG-compliant |
| Results display with pulse animation | Custom result card | Phase 2 `ResultsDisplay` | Has `aria-live`, pulse animation on value change, dark mode tokens, `accentVariant` for BMF |
| Capsule count calculation | Reimplementing formula | `calculateCapsules()` from `dosing.ts` | Proven against clinical spreadsheet; formula-driven from config |
| Recipe water/powder calculation | Reimplementing formula | `calculateRecipe()` from `formula.ts` | Verified against Recipe Calculator.xlsx.ods; algebraic derivation documented |
| BMF calculation | Reimplementing formula | `calculateBMF()` from `formula.ts` | Separate derivation; displacement factor + calorie balance equations |
| Input validation | Ad hoc guard clauses | `validateFatGrams()`, `validateRecipeInputs()`, `validateBMFInputs()` | Returns typed error strings with clinical wording from config |
| sessionStorage persistence | Ad hoc per-component localStorage | State singleton pattern from `theme.svelte.ts` | Consistent init/persist/reset lifecycle; isolates storage keys |

---

## Common Pitfalls

### Pitfall 1: BrandSelector `id` vs `value` Field Key Mismatch

**What goes wrong:** BrandSelector passes `id` field to SelectPicker which expects `value`. SelectPicker's `bind:value` never matches any option; `selectedLabel` shows placeholder forever; `onchange` callback never fires with a real brand.
**Why it happens:** Formula app built its own SelectPicker with `{ id, label, group }` shape. Phase 2 SelectPicker standardizes on `{ value, label, group? }`.
**How to avoid:** Map `b.id → value` (not `b.id → id`) in BrandSelector option construction. Test by selecting any brand — the trigger button should display the brand name, not "Select Brand...".
**Warning signs:** Brand picker shows "Select Brand..." after clicking an option. Calculate button never activates. Browser console shows `selectedBrand = undefined`.

### Pitfall 2: SessionStorage Called at Module Load Time

**What goes wrong:** `sessionStorage.getItem(...)` in the module body (outside a function) throws `ReferenceError: sessionStorage is not defined` during the build's prerendering step.
**Why it happens:** `adapter-static` with `prerender = true` runs the module in a Node.js context during build where `sessionStorage` doesn't exist. The `ssr: false` in `+layout.ts` prevents SSR at runtime but not during prerender.
**How to avoid:** All browser API calls (`sessionStorage`, `localStorage`, `window`, `document`) must be inside `onMount` callbacks or inside functions called from `onMount`. The `init()` function in the state module must only be called from a component's `onMount`.
**Warning signs:** `pnpm build` fails with `ReferenceError: sessionStorage is not defined`. Or the state module shows an empty value even when sessionStorage has data.

### Pitfall 3: Tube-Feed Strengths Diverge from Meal Strengths

**What goes wrong:** Using `MEDICATIONS` (meal) strength data for tube-feed mode. The tube-feed clinical data has additional and different strengths for Pancreaze and Pertzye.
**Root cause:** Tube-feed dosing comes from a different clinical source than meal dosing. The standalone PERT app already handles this with separate `TUBE_FEED_MEDICATIONS` from `tube-feed/clinical-data.ts`.
**How to avoid:** The `getTubeFeedStrengthsForBrand()` function in `tube-feed/medications.ts` must be used for tube-feed mode, not `getStrengthsForBrand()` from `medications.ts`. The DosingCalculator's `getStrengths(mode, brand)` helper function already branches on mode — preserve this pattern exactly.

Tube-feed differences (confirmed from source):
- Pancreaze: adds 2600, 37000 (meal only has 4200, 10500, 16800, 21000)
- Pertzye: adds 4000, 24000 (meal only has 8000, 16000)

### Pitfall 4: Formula Transitions Use `lucide-svelte` Instead of `@lucide/svelte`

**What goes wrong:** Ported components compile but icons render as empty elements or throw import errors.
**Why it happens:** Formula app was built on Svelte 3/4 and uses `lucide-svelte`. The unified app uses `@lucide/svelte` (official Svelte 5 package). Both are on npm; same icon names; different packages.
**How to avoid:** Find and replace all `from 'lucide-svelte'` → `from '@lucide/svelte'` during the port.

Icons used in formula components:
- `ModifiedFormulaCalculator.svelte`: `AlertCircle`
- `BreastMilkFortifierCalculator.svelte`: `Info`, `AlertCircle`
- `FormulaCalculator.svelte`: `Baby`, `Milk`

### Pitfall 5: $derived.by() Returning a Destructured Object

**What goes wrong:** Svelte 5 `$derived.by()` returning `{ recipe, calcError }` may not preserve fine-grained reactivity as expected when destructured at the call site.
**Root cause:** The formula components use `const { recipe, calcError } = $derived.by(() => ...)`. In Svelte 5, `$derived` returns a value and the object properties are accessed from that snapshot — destructuring at declaration time is fine, but re-destructuring inside `$effect` or template code needs care.
**How to avoid:** Keep the `$derived.by()` pattern from the source exactly as-is during the port. It already works in the reference app. Do not simplify to two separate `$derived` declarations unless testing confirms correctness.

### Pitfall 6: DosingCalculator References `BUILD_FLAGS` and `getCalculatorFeatureVisibility`

**What goes wrong:** The source `DosingCalculator.svelte` imports from `$lib/build-flags` which does not exist in the unified app:
```typescript
import { BUILD_FLAGS, getCalculatorFeatureVisibility } from '$lib/build-flags';
```
This controls a "branded footer" feature (a promotional footer visible only in web builds). The unified app does not have this feature flag system.
**How to avoid:** Remove the `BUILD_FLAGS` import entirely. Remove `footerVisible` and `footerHidden` state variables. Remove any template block that conditionally renders a branded footer. This is safe — the footer is a non-clinical promotional element, not part of the calculator logic.

### Pitfall 7: Formula BMF Mode — `kcalOz <= baselineKcalOz` Guard Is Silent (Not an Error)

**What goes wrong:** When target kcal/oz is equal to or less than baseline, the BMF calculator shows neither a result nor an error — the source component intentionally returns `{ recipe: null, calcError: null }` and renders an informational banner instead. If this guard is removed or simplified during porting, the UI either shows no feedback or calls `calculateBMF()` which will throw.
**How to avoid:** Preserve the three-branch template structure in `BreastMilkFortifierCalculator.svelte`:
1. `{#if calcError}` — red error card
2. `{:else if recipe}` — ResultsDisplay
3. `{:else if kcalOz !== null && baselineKcalOz !== null && kcalOz <= baselineKcalOz}` — amber informational banner
4. `{:else}` — placeholder card (not yet calculated)

### Pitfall 8: PERT `resultKey` Bump for Animation Requires Careful $effect

**What goes wrong:** The DosingCalculator uses a `resultKey` counter to force a re-mount of the result display (triggering CSS animation on new results). This pattern uses a `$effect` that checks `capsulesNeeded !== prevCapsules`. Wrapping this in an `$effect` inside the state module rather than the component will not work — `$effect` only runs in component context.
**How to avoid:** The `resultKey` / `prevCapsules` state belongs in the component (local `$state`), not in the sessionStorage-backed state module. The persisted state module stores inputs only; animation and interaction state stays component-local.

---

## Code Examples

### State Module Pattern (follow exactly from theme.svelte.ts)

```typescript
// src/lib/pert/state.svelte.ts
const SESSION_KEY = 'nicu_pert_state';

interface PertModeState {
  fatGramsRaw: string;
  lipaseRateStr: string;
  selectedBrand: string;
  selectedStrengthStr: string;
}

interface PertState {
  activeMode: 'meal' | 'tube-feed';
  meal: PertModeState;
  tubeFeed: PertModeState;
}

function defaultPertState(): PertState {
  return {
    activeMode: 'meal',
    meal: { fatGramsRaw: '', lipaseRateStr: '1000', selectedBrand: 'Creon', selectedStrengthStr: '6000' },
    tubeFeed: { fatGramsRaw: '', lipaseRateStr: '1000', selectedBrand: 'Creon', selectedStrengthStr: '6000' }
  };
}

let _pertState = $state<PertState>(defaultPertState());

export const pertState = {
  get current() { return _pertState; },
  init() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PertState>;
        _pertState = { ...defaultPertState(), ...parsed };
      }
    } catch { /* parse error or no sessionStorage */ }
  },
  persist() {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(_pertState)); } catch {}
  }
};
```

### Route Page Wiring Pattern

```svelte
<!-- src/routes/pert/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { pertState } from '$lib/pert/state.svelte.js';
  import DosingCalculator from '$lib/pert/DosingCalculator.svelte';

  onMount(() => {
    setCalculatorContext({ id: 'pert', accentColor: 'var(--color-accent)' });
    pertState.init();
  });
</script>

<svelte:head>
  <title>PERT Dosing | NICU Assistant</title>
</svelte:head>

<DosingCalculator />
```

### SessionStorage Persist via $effect in Component

```svelte
<!-- Inside DosingCalculator.svelte — persist on every state change -->
<script lang="ts">
  import { pertState } from '$lib/pert/state.svelte.js';

  // Persist whenever any input changes
  $effect(() => {
    // Access reactive properties to register dependencies
    pertState.current.activeMode;
    pertState.current.meal;
    pertState.current.tubeFeed;
    pertState.persist();
  });
</script>
```

### Dispensing Measures Block (formula components)

```svelte
<!-- Below ResultsDisplay in ModifiedFormulaCalculator -->
{#if recipe && (recipe.scoops !== null || recipe.packets !== null || recipe.tbsp !== null || recipe.tsp !== null)}
  <div class="px-5 py-4 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border)] space-y-2">
    <span class="text-2xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Dispensing</span>
    {#if recipe.scoops !== null}
      <p class="text-sm font-medium text-[var(--color-text-primary)]">{recipe.scoops} scoops</p>
    {/if}
    {#if recipe.packets !== null}
      <p class="text-sm font-medium text-[var(--color-text-primary)]">{recipe.packets} packets</p>
    {/if}
    {#if recipe.tbsp !== null}
      <p class="text-sm font-medium text-[var(--color-text-primary)]">{recipe.tbsp} tbsp</p>
    {/if}
    {#if recipe.tsp !== null}
      <p class="text-sm font-medium text-[var(--color-text-primary)]">{recipe.tsp} tsp</p>
    {/if}
  </div>
{/if}
```

---

## Source Analysis: What Each File Needs

### PERT Business Logic (D-01 — copy with path adaptations)

| Source File | Target Path | Changes Required |
|-------------|-------------|-----------------|
| `pert-calculator/src/lib/dosing.ts` | `src/lib/pert/dosing.ts` | `$lib/clinical-config` → `$lib/pert/clinical-config` |
| `pert-calculator/src/lib/medications.ts` | `src/lib/pert/medications.ts` | `$lib/clinical-config` → `$lib/pert/clinical-config` |
| `pert-calculator/src/lib/clinical-config.ts` | `src/lib/pert/clinical-config.ts` | `$lib/clinical-config.json` → `$lib/pert/clinical-config.json` |
| `pert-calculator/src/lib/clinical-config.json` | `src/lib/pert/clinical-config.json` | None — copy verbatim |
| `pert-calculator/src/lib/tube-feed/clinical-data.ts` | `src/lib/pert/tube-feed/clinical-data.ts` | `$lib/clinical-config` → `$lib/pert/clinical-config` |
| `pert-calculator/src/lib/tube-feed/medications.ts` | `src/lib/pert/tube-feed/medications.ts` | `$lib/medications` → `$lib/pert/medications`; `$lib/tube-feed/clinical-data` → `$lib/pert/tube-feed/clinical-data` |
| `pert-calculator/src/lib/tube-feed/examples.ts` | `src/lib/pert/tube-feed/examples.ts` | None — no imports |

### Formula Business Logic (D-01 — copy with path adaptations)

| Source File | Target Path | Changes Required |
|-------------|-------------|-----------------|
| `formula-calculator/src/lib/formula.ts` | `src/lib/formula/formula.ts` | `$lib/formula-config` → `$lib/formula/formula-config` |
| `formula-calculator/src/lib/formula-config.ts` | `src/lib/formula/formula-config.ts` | `$lib/formula-config.json` → `$lib/formula/formula-config.json` |
| `formula-calculator/src/lib/formula-config.json` | `src/lib/formula/formula-config.json` | None — copy verbatim |

### PERT UI (D-02 — port + refactor in one pass)

| Source File | What Changes |
|-------------|-------------|
| `DosingCalculator.svelte` (~900 lines) | Remove `BUILD_FLAGS` import and branded footer feature. Replace `import SelectPicker from '$lib/components/SelectPicker.svelte'` with `import SelectPicker from '$lib/shared/components/SelectPicker.svelte'`. Update all `$lib/` imports to `$lib/pert/`. Apply dark mode token migration. Import `pertState` from `state.svelte.ts` instead of inline `$state`. |

### Formula UI (D-02 — port + refactor in one pass)

| Source File | What Changes |
|-------------|-------------|
| `FormulaCalculator.svelte` | Change `lucide-svelte` → `@lucide/svelte`. Token migration for tab bar colors. Import `formulaState`. |
| `ModifiedFormulaCalculator.svelte` | Change `lucide-svelte` → `@lucide/svelte`. Replace `import BrandSelector from './BrandSelector.svelte'`, `NumericInput`, `ResultsDisplay` with shared component paths. Adapt `ResultsDisplay` props to Phase 2 API. Add dispensing measures block. Token migration. |
| `BreastMilkFortifierCalculator.svelte` | Same as above, plus `accentVariant="bmf"` on ResultsDisplay. Token migration for bmf-50, bmf-800 etc. |
| `BrandSelector.svelte` (new) | New file in `src/lib/formula/`. Use Phase 2 `SelectPicker`. Map `b.id → value` (not `b.id → id`). Import `$lib/formula/formula-config`. |

---

## State Preservation Architecture

### Why sessionStorage (not localStorage)

- **sessionStorage:** Clears on tab close. New browser tab = fresh inputs. Safe for clinical use — no stale inputs from yesterday's session contaminate today's calculation.
- **localStorage:** Persists indefinitely. Rejected for clinical safety: a nurse could open the app the next day and see yesterday's patient values pre-filled.
- Both are scoped per origin (same security model).

### State Lifecycle

```
User navigates to /pert
  → +page.svelte onMount
  → setCalculatorContext({ id: 'pert', ... })
  → pertState.init()       ← reads sessionStorage
  → DosingCalculator mounts, reads pertState.current
  → User types fat grams
  → $effect in DosingCalculator calls pertState.persist()
  → User taps Formula tab
  → SvelteKit navigates to /formula (DosingCalculator unmounts)
  → pertState.$state survives in memory (module singleton)
  → User taps PERT tab
  → +page.svelte onMount runs again
  → pertState.init() re-reads sessionStorage (same values)
  → DosingCalculator mounts with preserved inputs
```

**Important:** Because these are module-level `$state` singletons, the state survives in memory for same-tab navigation even without sessionStorage. SessionStorage is the backup for page refresh only.

---

## Environment Availability

Step 2.6: SKIPPED — this phase contains only code/config changes. No external dependencies beyond the existing project stack. All required packages (bits-ui, @lucide/svelte, Vitest) are already installed from Phase 2. No new package installations required.

---

## Open Questions

1. **DosingCalculator.svelte size (~900 lines) — split or keep?**
   - What we know: The standalone app keeps it as one file. It handles two modes (meal + tube-feed) with parallel state, tab keyboard navigation, and result animation.
   - What's unclear: Whether the planner should prescribe a split (e.g., MealCalculator.svelte + TubeFeedCalculator.svelte + a shared CalculatorPanel.svelte) or leave it as one file.
   - Recommendation: Keep as one file for the initial port (simpler, less opportunity for import errors), with an optional follow-up task to extract sub-components. Splitting is at Claude's discretion (locked in D-02).

2. **ResultsDisplay for dispensing measures**
   - What we know: The Phase 2 ResultsDisplay supports exactly two values (primary + secondary). Formula produces up to 6 values (mL_water, g_powder, scoops, packets, tbsp, tsp).
   - What's unclear: Whether a new `DispensingBlock.svelte` shared component is warranted, or inline conditional rendering in each formula sub-calculator is sufficient.
   - Recommendation: Inline conditional rendering in each formula component for now. Promote to a shared component only if both formula sub-calculators duplicate identical markup (they will — BM and Modified both need it).

3. **PERT `resultKey` animation — sessionStorage persistence?**
   - What we know: `resultKey` is an incrementing counter used to force CSS re-animation on result change. `prevCapsules` tracks the last displayed value.
   - What's unclear: Should `resultKey` and `prevCapsules` be stored in the state module or kept as component-local state?
   - Recommendation: Keep them as component-local `$state`. They are animation artifacts, not clinical data. No user benefit from persisting them.

---

## Project Constraints (from CLAUDE.md)

The following directives from `./CLAUDE.md` are actionable and must be respected during implementation:

| Constraint | Implication for Phase 3 |
|-----------|------------------------|
| Package manager: `npm` (as per CLAUDE.md project configuration) | Use `npm install` for any additions (none expected in Phase 3) |
| Tech stack: SvelteKit 2 + Svelte 5 + Tailwind CSS 4 — must match existing apps | No framework changes; all Svelte 5 rune patterns ($state, $derived, $effect) |
| Code reuse: Port business logic from existing apps, don't rewrite calculation functions | D-01 is binding — dosing.ts and formula.ts are copied verbatim (import path changes only) |
| No hardcoded colors: Semantic CSS custom property tokens only (D-07, D-08) | Every formula component class string must be audited for `oklch(...)`, `bg-white`, `bg-slate-*`, `text-slate-*`, `bg-clinical-*` |
| WCAG 2.1 AA minimum, 48px touch targets | NumericInput and SelectPicker from Phase 2 already comply; calculator tab bars must maintain 48px min-height |
| `$app/state` instead of `$app/stores` for page state (Phase 1 decision) | Route pages use `$app/state` if page URL is needed (only for navigation — not needed in calculator pages) |
| Test files in `src/lib/**/__tests__/` | Business logic tests at `src/lib/pert/__tests__/` and `src/lib/formula/__tests__/` |
| Vitest resolve.conditions browser for jsdom compatibility | Already configured in vite.config.ts — no change needed |

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `/mnt/data/src/pert-calculator/src/lib/dosing.ts` — complete source of PERT capsule calculation logic
- Direct inspection of `/mnt/data/src/pert-calculator/src/lib/medications.ts` — PERT medication brands data
- Direct inspection of `/mnt/data/src/pert-calculator/src/lib/clinical-config.ts` and `.json` — types, config loader, 5 FDA brands
- Direct inspection of `/mnt/data/src/pert-calculator/src/lib/components/DosingCalculator.svelte` — UI structure, state pattern, keyboard nav
- Direct inspection of `/mnt/data/src/pert-calculator/src/lib/tube-feed/` — `clinical-data.ts`, `medications.ts`, `examples.ts`
- Direct inspection of `/mnt/data/src/formula-calculator/src/lib/formula.ts` — complete recipe and BMF calculation logic
- Direct inspection of `/mnt/data/src/formula-calculator/src/lib/formula-config.ts` — BrandConfig type, parser, convenience functions
- Direct inspection of `/mnt/data/src/formula-calculator/src/lib/components/FormulaCalculator.svelte` — mode switcher structure
- Direct inspection of `/mnt/data/src/formula-calculator/src/lib/components/ModifiedFormulaCalculator.svelte` — full modified formula UI
- Direct inspection of `/mnt/data/src/formula-calculator/src/lib/components/BreastMilkFortifierCalculator.svelte` — BMF UI with guard conditions
- Direct inspection of `/mnt/data/src/formula-calculator/src/lib/components/BrandSelector.svelte` — grouped brand dropdown
- Direct inspection of `/mnt/data/src/nicu-assistant/src/lib/shared/components/SelectPicker.svelte` — bits-ui Select, SelectOption shape
- Direct inspection of `/mnt/data/src/nicu-assistant/src/lib/shared/components/NumericInput.svelte` — wheel, clamp, error display
- Direct inspection of `/mnt/data/src/nicu-assistant/src/lib/shared/components/ResultsDisplay.svelte` — props API, accentVariant, aria-live
- Direct inspection of `/mnt/data/src/nicu-assistant/src/lib/shared/context.ts` — setCalculatorContext / getCalculatorContext
- Direct inspection of `/mnt/data/src/nicu-assistant/src/lib/shared/types.ts` — SelectOption, CalculatorId, CalculatorContext
- Direct inspection of `/mnt/data/src/nicu-assistant/src/lib/shared/theme.svelte.ts` — reference singleton pattern for state modules
- Direct inspection of `/mnt/data/src/nicu-assistant/src/app.css` — confirmed token names, dark/light token values, bmf palette availability
- Direct inspection of `/mnt/data/src/nicu-assistant/.planning/research/ARCHITECTURE.md` — component boundaries, directory layout
- Direct inspection of `/mnt/data/src/nicu-assistant/.planning/research/PITFALLS.md` — known merge pitfalls, token migration mapping

### Secondary (MEDIUM confidence)

- `.planning/phases/03-calculators/03-CONTEXT.md` — user decisions D-01 through D-08, canonical refs
- `.planning/REQUIREMENTS.md` — PERT-01..05, FORM-01..05, CC-01..03 requirement definitions
- `.planning/STATE.md` — confirmed Phase 2 complete; confirmed sessionStorage key namespace `nicu_pert_state`, `nicu_formula_state`

---

## Metadata

**Confidence breakdown:**
- Business logic port: HIGH — source files fully read; all import paths mapped; no logic changes
- UI component port: HIGH — source components fully read; shared component APIs confirmed; prop mapping documented
- State module pattern: HIGH — `theme.svelte.ts` reference exists; pattern well-understood from Svelte 5 docs and Phase 1/2 work
- Dark mode token migration: HIGH — both source and target token names confirmed; complete mapping table provided
- sessionStorage behavior: HIGH — standard web API; lifecycle matches documented architecture

**Research date:** 2026-03-31
**Valid until:** Indefinite for business logic (proven, stable). Re-verify if Phase 2 shared component APIs change before Phase 3 execution.
