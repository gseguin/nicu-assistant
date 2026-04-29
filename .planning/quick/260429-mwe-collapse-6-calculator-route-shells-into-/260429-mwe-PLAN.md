---
phase: 260429-mwe
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/shell/calculator-module.ts
  - src/lib/shell/CalculatorPage.svelte
  - src/lib/shell/CalculatorPage.test.ts
  - src/lib/pert/calculator.ts
  - src/lib/feeds/calculator.ts
  - src/lib/gir/calculator.ts
  - src/lib/morphine/calculator.ts
  - src/lib/fortification/calculator.ts
  - src/lib/uac-uvc/calculator.ts
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
  - src/lib/shared/context.ts
autonomous: true
requirements:
  - QUICK-260429-mwe
must_haves:
  truths:
    - "Each route +page.svelte is a 5-7 LOC shell that imports its module and renders <CalculatorPage module={...} />"
    - "<CalculatorPage> renders header (icon + title + optional subtitle), InputsRecap, two-column grid (Calculator + sticky Inputs aside), and mobile InputDrawer for any module"
    - "Each slice exports a typed CalculatorModule<TState> from src/lib/{slice}/calculator.ts"
    - "CALCULATOR_REGISTRY collects modules as readonly CalculatorEntry[] (metadata-only narrowing) in the same order as before"
    - "All --color-accent drift in route headers (morphine-wean, formula) is replaced by var(--color-identity) via the shell"
    - "CalculatorContext / getCalculatorContext / setCalculatorContext are completely deleted from src/"
    - "SelectPicker uses var(--color-identity) directly for its 3 inline color styles (no context dependency)"
    - "pnpm exec vitest run stays green at ~489 (481 existing + ~8 new CalculatorPage tests)"
    - "pnpm exec svelte-check returns 0 errors, 0 warnings"
    - "src/lib/shell/__tests__/registry.test.ts passes unchanged (registry order, ids, hrefs, identityClasses preserved)"
  artifacts:
    - path: "src/lib/shell/calculator-module.ts"
      provides: "CalculatorEntry (metadata view) and CalculatorModule<TState> (full module) interfaces"
      contains: "export interface CalculatorEntry"
    - path: "src/lib/shell/CalculatorPage.svelte"
      provides: "Generic calculator page shell driven by a CalculatorModule"
      contains: "module: mod"
    - path: "src/lib/shell/CalculatorPage.test.ts"
      provides: "Layout coverage against synthetic CalculatorModule (~8 tests)"
      contains: "describe('CalculatorPage'"
    - path: "src/lib/pert/calculator.ts"
      provides: "pertModule: CalculatorModule<PertStateData>"
      contains: "export const pertModule"
    - path: "src/lib/feeds/calculator.ts"
      provides: "feedsModule: CalculatorModule<FeedsStateData>"
      contains: "export const feedsModule"
    - path: "src/lib/gir/calculator.ts"
      provides: "girModule: CalculatorModule<GirStateData>"
      contains: "export const girModule"
    - path: "src/lib/morphine/calculator.ts"
      provides: "morphineModule: CalculatorModule<MorphineStateData>"
      contains: "export const morphineModule"
    - path: "src/lib/fortification/calculator.ts"
      provides: "fortificationModule: CalculatorModule<FortificationStateData>"
      contains: "export const fortificationModule"
    - path: "src/lib/uac-uvc/calculator.ts"
      provides: "uacUvcModule: CalculatorModule<UacUvcStateData>"
      contains: "export const uacUvcModule"
    - path: "src/lib/shell/registry.ts"
      provides: "CALCULATOR_REGISTRY (readonly CalculatorEntry[]) imported from each slice's module"
      contains: "import { feedsModule }"
    - path: "src/routes/pert/+page.svelte"
      provides: "PERT route shell"
      max_lines: 10
    - path: "src/routes/feeds/+page.svelte"
      provides: "Feeds route shell"
      max_lines: 10
    - path: "src/routes/gir/+page.svelte"
      provides: "GIR route shell"
      max_lines: 10
    - path: "src/routes/morphine-wean/+page.svelte"
      provides: "Morphine route shell"
      max_lines: 10
    - path: "src/routes/uac-uvc/+page.svelte"
      provides: "UAC/UVC route shell"
      max_lines: 10
    - path: "src/routes/formula/+page.svelte"
      provides: "Formula route shell"
      max_lines: 10
  key_links:
    - from: "src/routes/{slice}/+page.svelte"
      to: "src/lib/shell/CalculatorPage.svelte"
      via: "<CalculatorPage module={sliceModule} />"
      pattern: "CalculatorPage module="
    - from: "src/lib/shell/registry.ts"
      to: "src/lib/{slice}/calculator.ts"
      via: "import {sliceModule} from '$lib/{slice}/calculator.js'"
      pattern: "from '\\$lib/(feeds|fortification|gir|morphine|pert|uac-uvc)/calculator"
    - from: "src/lib/shared/components/SelectPicker.svelte"
      to: "var(--color-identity)"
      via: "hardcoded inline style replacing accentColor from context"
      pattern: "color: var\\(--color-identity\\)"
---

<objective>
Final commit (5 of 5) of the architectural deepening initiative. Collapse the
6 near-identical calculator route shells (~600 LOC) into 5-line `+page.svelte`
shells driven by a single `<CalculatorPage>` component. Each slice owns a
typed `CalculatorModule<TState>` definition that bundles its label/icon/state/
components/recap-derivation. The registry narrows to `readonly CalculatorEntry[]`
for nav and routing.

Side cleanups landed in the same commit:
- Delete `CalculatorContext` (dead surface — only `accentColor` was read, and
  that's now `var(--color-identity)` hardcoded in SelectPicker).
- Fix `--color-accent` drift in `morphine-wean` and `formula` route headers —
  the shell uses `var(--color-identity)` consistently for all 6 calculators.
- Drop the `getCalculatorContext` mock from SelectPicker.test.ts.

Purpose: Removes the last per-route duplication. Adding a 7th calculator now
means writing one `calculator.ts` + one 5-line route file. Type-safety holds:
each slice's recap function is fully typed against its slice's state shape;
the registry preserves type-safety for metadata; the shell takes
`CalculatorModule<unknown>` (honest, contained erasure — never inspects state).

Output:
- 10 new files (calculator-module.ts, CalculatorPage.svelte + .test.ts, 6× slice/calculator.ts)
- 9 edits (registry.ts, 6× +page.svelte, SelectPicker.svelte, SelectPicker.test.ts, shared/types.ts)
- 1 deletion (shared/context.ts)
- ~20 files in the commit
- ~600 LOC of route duplication → ~30-40 LOC across 6 thin route files
- vitest count: 481 → ~489 (8 new CalculatorPage tests)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md

<!-- Existing types & components the executor must extend or import -->
@src/lib/shell/calculator-store.svelte.ts
@src/lib/shell/registry.ts
@src/lib/shared/types.ts
@src/lib/shared/context.ts
@src/lib/shared/components/InputsRecap.svelte
@src/lib/shared/components/InputDrawer.svelte
@src/lib/shared/components/SelectPicker.svelte
@src/lib/shared/components/SelectPicker.test.ts
@src/lib/shell/__tests__/registry.test.ts

<!-- The 6 routes being collapsed (read each one — copy `title`, `subtitle`,
     `inputsLabel` strings VERBATIM into the slice modules; clinical copy is locked) -->
@src/routes/pert/+page.svelte
@src/routes/feeds/+page.svelte
@src/routes/gir/+page.svelte
@src/routes/morphine-wean/+page.svelte
@src/routes/uac-uvc/+page.svelte
@src/routes/formula/+page.svelte

<interfaces>
<!-- Existing exports the executor will import -->

From src/lib/shell/calculator-store.svelte.ts:
```typescript
export class CalculatorStore<T> {
  current: T;
  lastEdited: LastEdited;
  init(): void;
  persist(): void;
  reset(): void;
}
```

From src/lib/shared/components/InputsRecap.svelte:
```typescript
export type RecapItem = {
  label: string;
  value: string | null;
  unit?: string;
  fullRow?: boolean;
};
// Props: { items: RecapItem[]; onOpen: () => void; expanded?: boolean;
//          ariaControls?: string; lastEditedAt?: number | null }
```

From src/lib/shared/components/InputDrawer.svelte:
```typescript
// Props: { title?: string; expanded?: boolean (bindable); onClear?: () => void;
//          children: Snippet }
// Used as: <InputDrawer title={...} bind:expanded={...} onClear={...}>
//            {#snippet children()}<Inputs />{/snippet}
//          </InputDrawer>
```

State singleton exports per slice:
```typescript
// src/lib/pert/state.svelte.ts
export const pertState: CalculatorStore<PertStateData>;
// src/lib/feeds/state.svelte.ts
export const feedsState: CalculatorStore<FeedsStateData>;
// src/lib/gir/state.svelte.ts
export const girState: CalculatorStore<GirStateData>;
// src/lib/morphine/state.svelte.ts
export const morphineState: CalculatorStore<MorphineStateData>;
// src/lib/uac-uvc/state.svelte.ts
export const uacUvcState: CalculatorStore<UacUvcStateData>;
// src/lib/fortification/state.svelte.ts
// IMPORTANT: FortificationStateData is exported from state.svelte.ts itself,
// NOT from types.ts. Import accordingly.
export const fortificationState: CalculatorStore<FortificationStateData>;
export interface FortificationStateData { ... }
```

State data type imports per slice:
```typescript
import type { PertStateData } from '$lib/pert/types.js';
import type { FeedsStateData } from '$lib/feeds/types.js';
import type { GirStateData } from '$lib/gir/types.js';
import type { MorphineStateData } from '$lib/morphine/types.js';
import type { UacUvcStateData } from '$lib/uac-uvc/types.js';
import type { FortificationStateData } from '$lib/fortification/state.svelte.js'; // NB: from state.svelte.js, not types.js
```

Lucide icon imports (one per slice — match the existing route exactly):
```typescript
import { Pill } from '@lucide/svelte';      // pert
import { Baby } from '@lucide/svelte';      // feeds
import { Droplet } from '@lucide/svelte';   // gir
import { Syringe } from '@lucide/svelte';   // morphine
import { Ruler } from '@lucide/svelte';     // uac-uvc
import { Milk } from '@lucide/svelte';      // fortification (formula route)
```

PERT-specific recap dependencies:
```typescript
import { getFormulaById } from '$lib/pert/config.js';
// Used in PERT recap to resolve tubeFeed.formulaId -> formula name
```

Fortification-specific recap dependencies:
```typescript
import { getFormulaById } from '$lib/fortification/fortification-config.js';
// NB: function name is the same but module path is different from PERT's
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Collapse 6 route shells into &lt;CalculatorPage&gt; + per-slice CalculatorModule, delete CalculatorContext</name>
  <files>
    src/lib/shell/calculator-module.ts (new),
    src/lib/shell/CalculatorPage.svelte (new),
    src/lib/shell/CalculatorPage.test.ts (new),
    src/lib/pert/calculator.ts (new),
    src/lib/feeds/calculator.ts (new),
    src/lib/gir/calculator.ts (new),
    src/lib/morphine/calculator.ts (new),
    src/lib/fortification/calculator.ts (new),
    src/lib/uac-uvc/calculator.ts (new),
    src/lib/shell/registry.ts (rewrite),
    src/routes/pert/+page.svelte (rewrite),
    src/routes/feeds/+page.svelte (rewrite),
    src/routes/gir/+page.svelte (rewrite),
    src/routes/morphine-wean/+page.svelte (rewrite),
    src/routes/uac-uvc/+page.svelte (rewrite),
    src/routes/formula/+page.svelte (rewrite),
    src/lib/shared/components/SelectPicker.svelte (edit),
    src/lib/shared/components/SelectPicker.test.ts (edit),
    src/lib/shared/types.ts (edit),
    src/lib/shared/context.ts (delete)
  </files>

  <action>
This task is one structural change executed as 8 internal steps. Run the
verification gate at the end of each step where indicated — DO NOT skip
mid-step gates; they catch wave-2 regressions early when the surface is small.

────────────────────────────────────────────────────────────────────────────
STEP 1 — Add the new shell files (no consumers yet)
────────────────────────────────────────────────────────────────────────────

1.1. Create `src/lib/shell/calculator-module.ts` with the LOCKED design from
the brief (TYPE-ONLY file, no runtime code):

```ts
import type { Component } from 'svelte';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { CalculatorStore } from './calculator-store.svelte.js';

// Metadata-only view. What the registry, nav, and routing care about.
// No generic — fully typed, used as `readonly CalculatorEntry[]`.
// THIS REPLACES the existing CalculatorEntry interface in registry.ts.
export interface CalculatorEntry {
  id: string;
  label: string;
  href: string;
  icon: Component;
  description: string;
  identityClass: `identity-${string}`;
}

// Full module — what a route hands to <CalculatorPage>.
// Generic in state shape; never collected into a heterogeneous array.
// Each slice exports one of these from `src/lib/{slice}/calculator.ts`.
export interface CalculatorModule<TState> extends CalculatorEntry {
  title: string;            // e.g. "Pediatric EPI PERT Calculator"
  subtitle?: string;        // e.g. "Capsule dosing · oral & tube-feed modes"
  inputsLabel: string;      // e.g. "PERT inputs" — drawer title + aria-label
  state: CalculatorStore<TState>;
  Calculator: Component;
  Inputs: Component;
  getRecapItems: (state: TState) => RecapItem[];
}
```

NB: `identityClass` is typed as `\`identity-${string}\`` (template literal type).
The existing registry uses a hardcoded union of 6 strings — the template
literal is a deliberate widening so future calculators don't require a
type edit in two places. The 6 existing literal strings still satisfy this
type.

1.2. Create `src/lib/shell/CalculatorPage.svelte`. The complete component:

```svelte
<!--
  src/lib/shell/CalculatorPage.svelte

  Generic calculator route shell. Replaces the ~95–122 LOC of duplicated
  layout that previously lived in each src/routes/{slice}/+page.svelte.
  Driven by a CalculatorModule that bundles a slice's metadata, state,
  components, and recap-derivation function.

  Local state owned here:
  - drawerExpanded — was per-route before; mobile InputsRecap toggles it
  - recapItems — derived by calling module.getRecapItems(module.state.current)

  `module` is a Svelte reserved word, so we alias the prop to `mod`.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { CalculatorModule } from './calculator-module.js';
  import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
  import InputsRecap from '$lib/shared/components/InputsRecap.svelte';

  let { module: mod }: { module: CalculatorModule<unknown> } = $props();

  let drawerExpanded = $state(false);
  const recapItems = $derived(mod.getRecapItems(mod.state.current));

  // Defensive init: CalculatorStore's constructor already eagerly inits, but
  // each existing route also called state.init() in onMount. init() is
  // idempotent — calling it twice is safe — so we preserve the defensive
  // call to match existing behavior 1:1.
  onMount(() => {
    mod.state.init();
  });

  const Icon = $derived(mod.icon);
  const Calculator = $derived(mod.Calculator);
  const Inputs = $derived(mod.Inputs);
</script>

<svelte:head>
  <title>{mod.label} | NICU Assistant</title>
</svelte:head>

<div class={mod.identityClass}>
  <div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
    <header class="flex items-center gap-3">
      <Icon size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
      <div class="flex flex-col">
        <h1 class="text-title font-bold text-[var(--color-text-primary)]">
          {mod.title}
        </h1>
        {#if mod.subtitle}
          <span class="text-ui text-[var(--color-text-secondary)]">
            {mod.subtitle}
          </span>
        {/if}
      </div>
    </header>

    <div class="mt-4">
      <InputsRecap
        items={recapItems}
        onOpen={() => (drawerExpanded = true)}
        expanded={drawerExpanded}
        lastEditedAt={mod.state.lastEdited.current}
      />
    </div>

    <div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="min-w-0">
        <Calculator />
      </div>

      <aside class="hidden md:block" aria-label={mod.inputsLabel}>
        <div class="sticky top-20">
          <Inputs />
        </div>
      </aside>
    </div>
  </div>
</div>

<InputDrawer
  title={mod.inputsLabel}
  bind:expanded={drawerExpanded}
  onClear={() => mod.state.reset()}
>
  {#snippet children()}
    <Inputs />
  {/snippet}
</InputDrawer>
```

NOTES on the dynamic-component pattern:
- We assign `mod.icon`, `mod.Calculator`, `mod.Inputs` to local `$derived`
  PascalCase identifiers (`Icon`, `Calculator`, `Inputs`) so the Svelte
  template can render them as `<Icon />`, `<Calculator />`, `<Inputs />`.
  Direct `<mod.Calculator />` syntax does work in Svelte 5 but the local
  alias is what the existing routes use indirectly (named imports) and
  reads more cleanly.
- `mod.subtitle` is conditional via `{#if mod.subtitle}` — Morphine and
  Formula routes have NO subtitle in their existing headers (header has
  just `<h1>`, no `<span>`). The shell preserves that by not rendering
  the span when subtitle is absent.

1.3. Create `src/lib/shell/CalculatorPage.test.ts`. ~8 tests against a
synthetic minimal CalculatorModule. Use `@testing-library/svelte` for render
+ `vitest` for assertions. Co-located file (test colocation memory). Pattern:

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { Pill } from '@lucide/svelte';
import CalculatorPage from './CalculatorPage.svelte';
import type { CalculatorModule } from './calculator-module.js';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';

// Synthetic state + module. We use minimal placeholder Svelte components
// (compiled at test time via test-utility files) for Calculator and Inputs.
// The `state` is a hand-rolled stub matching the CalculatorStore shape —
// avoids dragging in any slice's real localStorage-backed singleton.

// Place a tiny .svelte test-stub component inline if Svelte/Vite supports
// .svelte string templates in tests; otherwise create
// src/lib/shell/__test_helpers/StubComponent.svelte and import it. Mirror
// what existing component tests do (look at registry.test.ts neighborhood).

// Tests to write:
//   T-CP-01 renders the identity wrapper class from module.identityClass
//   T-CP-02 renders module.title as <h1> text and module.subtitle as <span>
//   T-CP-03 omits subtitle <span> when module.subtitle is undefined
//   T-CP-04 renders InputsRecap with items returned by module.getRecapItems
//   T-CP-05 mounts module.Calculator and module.Inputs (assert by data-testid
//           or visible text the stub components emit)
//   T-CP-06 renders the sticky desktop aside with aria-label = module.inputsLabel
//   T-CP-07 tapping InputsRecap (mobile button) sets drawer expanded=true
//   T-CP-08 InputDrawer's onClear invokes module.state.reset
//   T-CP-09 (BONUS) calls module.state.init() on mount (defensive call)
//   T-CP-10 (BONUS) recap derivation reacts when module.state.current changes
//
// Aim for 8 passing tests total. T-CP-09/10 are bonus and may be folded
// into existing tests if they're trivial — total count target: 8 new tests.
```

If a Svelte stub component file is needed, create
`src/lib/shell/__test_helpers/StubComponent.svelte`:
```svelte
<script lang="ts">
  let { label = 'Stub' }: { label?: string } = $props();
</script>
<div data-testid={`stub-${label}`}>{label}</div>
```

Do NOT create stub files unless the .svelte-string-template approach
doesn't work — keep the test surface minimal.

VERIFICATION GATE 1.A:
```
pnpm exec vitest run src/lib/shell/CalculatorPage.test.ts
```
Expected: ~8 tests passing. If a test fails, fix the test or the
component before continuing.

VERIFICATION GATE 1.B:
```
pnpm exec svelte-check
```
Expected: 0 errors, 0 warnings. CalculatorPage.svelte and
calculator-module.ts must be type-clean before any consumer wires in.

────────────────────────────────────────────────────────────────────────────
STEP 2 — Add 6 slice/calculator.ts files (move recap logic from routes)
────────────────────────────────────────────────────────────────────────────

For each slice, create `src/lib/{slice}/calculator.ts`. The pattern is:

```ts
// src/lib/{slice}/calculator.ts
import { {Icon} } from '@lucide/svelte';
import type { CalculatorModule } from '$lib/shell/calculator-module.js';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { {Slice}StateData } from './types.js'; // or state.svelte.js for fortification
import { {slice}State } from './state.svelte.js';
import {Calculator} from './{Calculator}.svelte';
import {Inputs} from './{Inputs}.svelte';

function getRecapItems(state: {Slice}StateData): RecapItem[] {
  // MOVE the existing recapItems derivation body from src/routes/{slice}/+page.svelte
  // verbatim. The current routes use $derived.by(() => { ... }) — extract the
  // function-body return value into this pure function. Replace `state.current`
  // references with the parameter `state` (since the function receives the
  // already-unwrapped current state).
  // ...
}

export const {slice}Module: CalculatorModule<{Slice}StateData> = {
  id: '{id}',
  label: '{label}',
  href: '/{href}',
  icon: {Icon},
  description: '{description}',
  identityClass: '{identityClass}',
  title: '{title}',
  subtitle: '{subtitle-or-omit}',
  inputsLabel: '{inputsLabel}',
  state: {slice}State,
  Calculator: {Calculator},
  Inputs: {Inputs},
  getRecapItems
};
```

Per-slice values (COPY VERBATIM — clinical copy is locked):

────────── PERT (src/lib/pert/calculator.ts) ──────────
- icon: Pill (from @lucide/svelte)
- type: PertStateData (from './types.js')
- state: pertState (from './state.svelte.js')
- Calculator: PertCalculator (from './PertCalculator.svelte')
- Inputs: PertInputs (from './PertInputs.svelte')
- Registry metadata (verbatim from current registry.ts):
  - id: 'pert'
  - label: 'PERT'
  - href: '/pert'
  - description: 'Pediatric EPI PERT calculator'
  - identityClass: 'identity-pert'
- Header copy (verbatim from src/routes/pert/+page.svelte):
  - title: 'Pediatric EPI PERT Calculator'
  - subtitle: 'Capsule dosing · oral & tube-feed modes'
  - inputsLabel: 'PERT inputs'
- getRecapItems: MOVE the conditional logic from src/routes/pert/+page.svelte
  lines 28–68. Branches on state.mode === 'oral' vs tube-feed; tube-feed
  needs `getFormulaById` from '$lib/pert/config.js'. The function takes
  `state: PertStateData` and returns RecapItem[]. The existing route uses
  `pertState.current.X` everywhere — replace with `state.X`.

────────── Feeds (src/lib/feeds/calculator.ts) ──────────
- icon: Baby
- type: FeedsStateData (from './types.js')
- state: feedsState (from './state.svelte.js')
- Calculator: FeedAdvanceCalculator (from './FeedAdvanceCalculator.svelte')
- Inputs: FeedAdvanceInputs (from './FeedAdvanceInputs.svelte')
- Registry metadata:
  - id: 'feeds'
  - label: 'Feeds'
  - href: '/feeds'
  - description: 'Feed advance calculator'
  - identityClass: 'identity-feeds'
- Header copy (verbatim from src/routes/feeds/+page.svelte):
  - title: 'Feed Advance Calculator'
  - subtitle: 'bedside volumes + nutrition totals'
  - inputsLabel: 'Feeds inputs'
- getRecapItems: MOVE lines 25–36 from src/routes/feeds/+page.svelte
  (linear, no conditional). Returns 2 items: Weight (fullRow) + Mode.

────────── GIR (src/lib/gir/calculator.ts) ──────────
- icon: Droplet
- type: GirStateData (from './types.js')
- state: girState (from './state.svelte.js')
- Calculator: GirCalculator (from './GirCalculator.svelte')
- Inputs: GirInputs (from './GirInputs.svelte')
- Registry metadata:
  - id: 'gir'
  - label: 'GIR'
  - href: '/gir'
  - description: 'Glucose infusion rate calculator'
  - identityClass: 'identity-gir'
- Header copy (verbatim from src/routes/gir/+page.svelte):
  - title: 'Glucose Infusion Rate'
  - subtitle: 'mg/kg/min · titration helper'
  - inputsLabel: 'GIR inputs'
- getRecapItems: MOVE lines 22–42 from src/routes/gir/+page.svelte (linear,
  3 items: Weight fullRow + Dextrose + Fluid rate).

────────── Morphine (src/lib/morphine/calculator.ts) ──────────
- icon: Syringe
- type: MorphineStateData (from './types.js')
- state: morphineState (from './state.svelte.js')
- Calculator: MorphineWeanCalculator (from './MorphineWeanCalculator.svelte')
- Inputs: MorphineWeanInputs (from './MorphineWeanInputs.svelte')
- Registry metadata:
  - id: 'morphine-wean'
  - label: 'Morphine'
  - href: '/morphine-wean'
  - description: 'Morphine weaning schedule calculator'
  - identityClass: 'identity-morphine'
- Header copy (verbatim from src/routes/morphine-wean/+page.svelte):
  - title: 'Morphine Wean'
  - subtitle: OMIT (the existing route has NO subtitle span — just <h1>).
    Do not invent one. The shell's `{#if mod.subtitle}` skips rendering.
  - inputsLabel: 'Morphine inputs'
- getRecapItems: MOVE lines 24–40 from src/routes/morphine-wean/+page.svelte
  (linear, 3 items: Weight fullRow + Max dose + Step).

────────── UAC/UVC (src/lib/uac-uvc/calculator.ts) ──────────
- icon: Ruler
- type: UacUvcStateData (from './types.js')
- state: uacUvcState (from './state.svelte.js')
- Calculator: UacUvcCalculator (from './UacUvcCalculator.svelte')
- Inputs: UacUvcInputs (from './UacUvcInputs.svelte')
- Registry metadata:
  - id: 'uac-uvc'
  - label: 'UAC/UVC'
  - href: '/uac-uvc'
  - description: 'UAC/UVC umbilical catheter depth calculator'
  - identityClass: 'identity-uac'
- Header copy (verbatim from src/routes/uac-uvc/+page.svelte):
  - title: 'UAC/UVC Catheter Depth'
  - subtitle: 'cm · weight-based formula'
  - inputsLabel: 'UAC/UVC inputs'
- getRecapItems: MOVE lines 24–31 from src/routes/uac-uvc/+page.svelte
  (single Weight fullRow item — pattern consistency only).

────────── Fortification / Formula (src/lib/fortification/calculator.ts) ──────────
- icon: Milk
- type: FortificationStateData
  ⚠ IMPORT FROM './state.svelte.js', NOT './types.js'. The type lives on
  the state file in this slice (one of the only inconsistencies; the brief
  flagged this).
- state: fortificationState (from './state.svelte.js')
- Calculator: FortificationCalculator (from './FortificationCalculator.svelte')
- Inputs: FortificationInputs (from './FortificationInputs.svelte')
- Registry metadata (note id stays 'formula' even though the slice/module
  is 'fortification' — route is /formula):
  - id: 'formula'
  - label: 'Formula'
  - href: '/formula'
  - description: 'Infant formula fortification calculator'
  - identityClass: 'identity-formula'
- Header copy (verbatim from src/routes/formula/+page.svelte):
  - title: 'Formula Recipe'
  - subtitle: OMIT (the existing route has NO subtitle — just <h1>).
  - inputsLabel: 'Formula inputs'
- getRecapItems: MOVE lines 25–38 from src/routes/formula/+page.svelte.
  Imports `getFormulaById` from '$lib/fortification/fortification-config.js'
  (NOT 'config.js' — the file path differs from PERT). Returns 4 items:
  Formula, Base, Volume, Target.

VERIFICATION GATE 2.A:
```
pnpm exec svelte-check
```
Expected: 0 errors, 0 warnings. The new slice/calculator.ts files must be
type-clean before the registry imports them. Fix any type mismatches now —
common ones: forgetting the FortificationStateData import path quirk, or
mistyping a recap item.

────────────────────────────────────────────────────────────────────────────
STEP 3 — Rewrite src/lib/shell/registry.ts
────────────────────────────────────────────────────────────────────────────

Replace the entire file with the import-based form (LOCKED design):

```ts
// src/lib/shell/registry.ts
// Registry exposes only the CalculatorEntry view of each module.
// Per-route renders pull the full CalculatorModule<TState> directly from
// src/lib/{slice}/calculator.ts; the registry is for nav, routing, and
// favorites only.

import type { CalculatorEntry } from './calculator-module.js';
import { feedsModule } from '$lib/feeds/calculator.js';
import { fortificationModule } from '$lib/fortification/calculator.js';
import { girModule } from '$lib/gir/calculator.js';
import { morphineModule } from '$lib/morphine/calculator.js';
import { pertModule } from '$lib/pert/calculator.js';
import { uacUvcModule } from '$lib/uac-uvc/calculator.js';

// Same alphabetical-by-id order as before — D-19 invariant guarded by
// src/lib/shell/__tests__/registry.test.ts.
export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  feedsModule,
  fortificationModule,
  girModule,
  morphineModule,
  pertModule,
  uacUvcModule
];

// Re-export CalculatorEntry from its new home so existing import paths keep working.
export type { CalculatorEntry } from './calculator-module.js';
```

The structural-subtype relationship `CalculatorModule<T> extends CalculatorEntry`
makes assignment to `readonly CalculatorEntry[]` automatic and type-safe.

VERIFICATION GATE 3.A:
```
pnpm exec vitest run src/lib/shell/__tests__/registry.test.ts
```
Expected: All tests pass UNCHANGED. Order, ids, labels, hrefs,
identityClasses must all be preserved — that test is the regression
sentinel for the registry contract. If anything fails here, you've
typo'd a metadata field in one of the slice modules.

VERIFICATION GATE 3.B:
```
pnpm exec svelte-check
```
Expected: 0 errors, 0 warnings.

────────────────────────────────────────────────────────────────────────────
STEP 4 — Rewrite all 6 +page.svelte files (5–7 LOC each)
────────────────────────────────────────────────────────────────────────────

Each route becomes the pattern:

```svelte
<script lang="ts">
  import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
  import { {slice}Module } from '$lib/{slice}/calculator.js';
</script>

<CalculatorPage module={ {slice}Module } />
```

Per-route exact replacements (full file contents):

src/routes/pert/+page.svelte:
```svelte
<script lang="ts">
  import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
  import { pertModule } from '$lib/pert/calculator.js';
</script>

<CalculatorPage module={pertModule} />
```

src/routes/feeds/+page.svelte:
```svelte
<script lang="ts">
  import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
  import { feedsModule } from '$lib/feeds/calculator.js';
</script>

<CalculatorPage module={feedsModule} />
```

src/routes/gir/+page.svelte:
```svelte
<script lang="ts">
  import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
  import { girModule } from '$lib/gir/calculator.js';
</script>

<CalculatorPage module={girModule} />
```

src/routes/morphine-wean/+page.svelte:
```svelte
<script lang="ts">
  import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
  import { morphineModule } from '$lib/morphine/calculator.js';
</script>

<CalculatorPage module={morphineModule} />
```

src/routes/uac-uvc/+page.svelte:
```svelte
<script lang="ts">
  import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
  import { uacUvcModule } from '$lib/uac-uvc/calculator.js';
</script>

<CalculatorPage module={uacUvcModule} />
```

src/routes/formula/+page.svelte:
```svelte
<script lang="ts">
  import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
  import { fortificationModule } from '$lib/fortification/calculator.js';
</script>

<CalculatorPage module={fortificationModule} />
```

VERIFICATION GATE 4.A:
```
pnpm exec svelte-check
```
Expected: 0 errors, 0 warnings.

VERIFICATION GATE 4.B:
```
pnpm exec vitest run --reporter=basic
```
Expected: 481 + ~8 = ~489 tests passing. The slice component tests
(PertCalculator.test.ts, FortificationInputs.test.ts, etc.) don't import
from +page.svelte so they're unaffected. CalculatorPage.test.ts adds the
new tests. Registry test still passes from Step 3.

────────────────────────────────────────────────────────────────────────────
STEP 5 — Edit SelectPicker.svelte + SelectPicker.test.ts (drop context dep)
────────────────────────────────────────────────────────────────────────────

5.1. Edit `src/lib/shared/components/SelectPicker.svelte`:

a) Delete line 4: `import { getCalculatorContext } from '../context.js';`
b) Delete lines 24–25:
   ```
   const ctx = getCalculatorContext();
   const accentColor = ctx.accentColor;
   ```
c) Replace inline `style="color: {accentColor}"` (3 occurrences) with
   `style="color: var(--color-identity)"`. The 3 sites are around lines
   286, 305, 327 — all inside the picker dialog (group heading + 2
   selected-checkmark Check icons).

5.2. Edit `src/lib/shared/components/SelectPicker.test.ts`:

a) Delete the `vi.mock` block (lines 5–7):
   ```
   vi.mock('../context.js', () => ({
     getCalculatorContext: () => ({ accentColor: 'oklch(49% 0.17 220)' })
   }));
   ```
b) The `vi` import on line 1 may now be unused; if so, drop `vi` from
   the destructure (`import { describe, it, expect } from 'vitest';`).
   svelte-check will flag if it remains unused.

VERIFICATION GATE 5.A:
```
pnpm exec vitest run src/lib/shared/components/SelectPicker.test.ts
```
Expected: All 18 SelectPicker tests pass. The mock removal must not
regress them — they don't actually depend on the accentColor value.

────────────────────────────────────────────────────────────────────────────
STEP 6 — Delete src/lib/shared/context.ts
────────────────────────────────────────────────────────────────────────────

```bash
rm src/lib/shared/context.ts
```

(Use `git rm src/lib/shared/context.ts` if the executor prefers an
already-staged deletion; otherwise plain `rm` and let the final
`git add` capture the deletion.)

This file is now dead — Step 5 was its only consumer and Step 4 already
removed the route imports.

────────────────────────────────────────────────────────────────────────────
STEP 7 — Edit src/lib/shared/types.ts (drop CalculatorContext)
────────────────────────────────────────────────────────────────────────────

Delete the `CalculatorContext` interface (lines 9–12 of the current file):

```ts
export interface CalculatorContext {
  id: CalculatorId;
  accentColor: string;
}
```

Keep ALL other exports — `SelectOption`, `CalculatorId`, `NumericInputRange`
all stay (CalculatorId is used by the favorites store).

────────────────────────────────────────────────────────────────────────────
STEP 8 — Run all verification gates
────────────────────────────────────────────────────────────────────────────

8.1. Full test suite:
```
pnpm exec vitest run
```
Expected: ~489 passing (481 + ~8 new). Zero failures.

8.2. Type-check:
```
pnpm exec svelte-check
```
Expected: 0 errors, 0 warnings.

8.3. CalculatorContext deletion is total:
```
grep -rn "getCalculatorContext\|setCalculatorContext\|CalculatorContext" src/
```
Expected: zero matches.

8.4. Color-accent drift cleaned up in routes:
```
grep -rn "color-accent" src/routes/
```
Expected: zero matches. (color-accent stays in app.css, NavShell.svelte,
AboutSheet.svelte, DisclaimerBanner.svelte — those are non-route surfaces
and out of scope.)

8.5. Route LOC compression check:
```
wc -l src/routes/{pert,feeds,gir,morphine-wean,uac-uvc,formula}/+page.svelte
```
Expected: total ~30–40 LOC across all 6 files. Each file should be
between 5 and 7 LOC.

8.6. New CalculatorPage test count:
```
pnpm exec vitest run src/lib/shell/CalculatorPage.test.ts --reporter=basic
```
Expected: 8 tests passing.

8.7. Registry contract still holds:
```
pnpm exec vitest run src/lib/shell/__tests__/registry.test.ts
```
Expected: All 11 tests passing without modification.

────────────────────────────────────────────────────────────────────────────
COMMIT 1 — Code commit (after all gates pass)
────────────────────────────────────────────────────────────────────────────

Stage by name (do NOT use `git add -A` — there's a stray amp/ untracked
directory and a vite.config.ts modification listed in git status that are
NOT part of this task):

```bash
git add \
  src/lib/shell/calculator-module.ts \
  src/lib/shell/CalculatorPage.svelte \
  src/lib/shell/CalculatorPage.test.ts \
  src/lib/shell/registry.ts \
  src/lib/pert/calculator.ts \
  src/lib/feeds/calculator.ts \
  src/lib/gir/calculator.ts \
  src/lib/morphine/calculator.ts \
  src/lib/fortification/calculator.ts \
  src/lib/uac-uvc/calculator.ts \
  src/routes/pert/+page.svelte \
  src/routes/feeds/+page.svelte \
  src/routes/gir/+page.svelte \
  src/routes/morphine-wean/+page.svelte \
  src/routes/uac-uvc/+page.svelte \
  src/routes/formula/+page.svelte \
  src/lib/shared/components/SelectPicker.svelte \
  src/lib/shared/components/SelectPicker.test.ts \
  src/lib/shared/types.ts
git rm src/lib/shared/context.ts  # if not already removed via git rm earlier
```

If the executor created any test helpers (e.g.
`src/lib/shell/__test_helpers/StubComponent.svelte`), stage those too.

Commit with the LITERAL message from the brief (heredoc to preserve
formatting):

```bash
git commit -m "$(cat <<'EOF'
refactor(shell): collapse 6 route shells into <CalculatorPage> + CalculatorModule

~600 LOC of route duplication → ~30 LOC across 6 thin route files.
Each slice now owns a typed CalculatorModule<TState> in calculator.ts;
the registry narrows to a CalculatorEntry view for nav/routing.

Side cleanups:
- Delete CalculatorContext (dead surface — only accentColor was read,
  and that's now hardcoded var(--color-identity) in SelectPicker)
- Fix --color-accent drift in morphine-wean and formula route headers;
  shell uses var(--color-identity) consistently
- Hardcode SelectPicker checkmark color to var(--color-identity);
  drop the context mock from its test

Completes the architecture deepening initiative:
- Commit 1 (45d86cf): CalculatorStore<T> generic class
- Commits 2-4: state-singleton collapse (6 slices, 451 → 176 LOC)
- Commit 5 (this): route shell collapse
EOF
)"
```

Verify commit landed and diff scope matches expectation:
```bash
git log -1 --stat
git diff --name-only HEAD~1 HEAD | wc -l   # ~20 files
```

────────────────────────────────────────────────────────────────────────────
COMMIT 2 — SUMMARY commit (separate, MANDATORY)
────────────────────────────────────────────────────────────────────────────

Write SUMMARY.md inside the worktree dir
`.planning/quick/260429-mwe-collapse-6-calculator-route-shells-into-/SUMMARY.md`
following the standard quick-task SUMMARY template:
- What was done (route shell collapse, side cleanups)
- Files changed (counts + key files)
- Verification results (vitest count, svelte-check, grep gates)
- Architecture deepening recap (commits 1–5 of 5)

Then commit:
```bash
git add .planning/quick/260429-mwe-collapse-6-calculator-route-shells-into-/SUMMARY.md
git commit -m "docs(260429-mwe): summary of route shell collapse"
```

DO NOT leave SUMMARY.md uncommitted — the brief flags this as critical.

────────────────────────────────────────────────────────────────────────────
SCOPE BOUNDARIES — DO NOT TOUCH
────────────────────────────────────────────────────────────────────────────
- src/lib/{slice}/state.svelte.ts (already migrated, locked from commits 2–4)
- src/lib/shell/calculator-store.svelte.ts (locked)
- The 6 calculator + inputs Svelte components themselves (only their imports
  change via slice/calculator.ts)
- CalculatorId type in src/lib/shared/types.ts (still used by favorites)
- src/routes/+layout.svelte (registry consumption unchanged)
- DESIGN.md, ROADMAP.md, ADR docs
- vite.config.ts (currently modified in working tree — NOT this task)
- amp/ untracked directory (NOT this task)
- Playwright e2e suite (out of scope — vitest + svelte-check is sufficient
  gating for this commit per the brief)
  </action>

  <verify>
    <automated>pnpm exec vitest run && pnpm exec svelte-check && [ "$(grep -rn 'getCalculatorContext\|setCalculatorContext\|CalculatorContext' src/ | wc -l)" = "0" ] && [ "$(grep -rn 'color-accent' src/routes/ | wc -l)" = "0" ]</automated>
  </verify>

  <done>
- All 8 verification gates in Step 8 pass (vitest ~489, svelte-check 0/0, grep gates clean, route LOC ~30–40, registry test unchanged, CalculatorPage tests = 8)
- Two commits exist on main:
  1. `refactor(shell): collapse 6 route shells into <CalculatorPage> + CalculatorModule` (~20 files, message verbatim from brief)
  2. `docs(260429-mwe): summary of route shell collapse` (SUMMARY.md only)
- `git diff --name-only HEAD~2 HEAD~1` shows the 20-file code commit shape: 10 new (calculator-module.ts, CalculatorPage.svelte, CalculatorPage.test.ts, 6× slice/calculator.ts, optional StubComponent helper), 1 deleted (shared/context.ts), 9 edited (registry.ts, 6× +page.svelte, SelectPicker.svelte/test.ts, shared/types.ts)
- `git status` is clean (or shows only the pre-existing unrelated changes: vite.config.ts modification + amp/ untracked dir)
- Architecture deepening initiative complete: 5 commits, ~600 LOC of duplication eliminated across the route tier
  </done>
</task>

</tasks>

<verification>
Phase-level checks (re-run after the code commit, before the SUMMARY commit):

1. `pnpm exec vitest run` — ~489 passing (481 + ~8 CalculatorPage)
2. `pnpm exec svelte-check` — 0 errors, 0 warnings
3. `grep -rn "getCalculatorContext\|setCalculatorContext\|CalculatorContext" src/` — zero matches
4. `grep -rn "color-accent" src/routes/` — zero matches
5. `wc -l src/routes/{pert,feeds,gir,morphine-wean,uac-uvc,formula}/+page.svelte` — ~30–40 LOC total
6. `pnpm exec vitest run src/lib/shell/__tests__/registry.test.ts` — 11/11 passing unchanged
7. `pnpm exec vitest run src/lib/shell/CalculatorPage.test.ts` — 8 new tests passing
8. `git diff --name-only HEAD~1 HEAD` (after code commit) — ~20 files in the expected shape
</verification>

<success_criteria>
- 6 route shells reduced from ~600 LOC to ~30–40 LOC total
- Per-route layout/wiring duplication is gone — single source of truth in `<CalculatorPage>`
- Each slice owns a typed `CalculatorModule<TState>` in `src/lib/{slice}/calculator.ts`
- Registry continues to expose `readonly CalculatorEntry[]` (metadata-only) in identical order, with all existing field values preserved (asserted by registry.test.ts)
- `CalculatorContext` and its module file are completely deleted
- `--color-accent` drift removed from route headers (morphine-wean, formula now use `var(--color-identity)` via the shell)
- SelectPicker no longer depends on calculator context — uses `var(--color-identity)` directly for its 3 inline color styles
- Test count: 481 → ~489 (8 new CalculatorPage tests). Zero regressions
- `pnpm exec svelte-check` returns 0/0
- Two commits land on main: the code commit (with the literal message from the brief) and a separate SUMMARY commit
- Architecture deepening initiative (commits 1–5) is complete
</success_criteria>

<output>
After completion, create `.planning/quick/260429-mwe-collapse-6-calculator-route-shells-into-/SUMMARY.md` and commit it as the second commit (message: `docs(260429-mwe): summary of route shell collapse`). Do NOT leave SUMMARY uncommitted.
</output>
