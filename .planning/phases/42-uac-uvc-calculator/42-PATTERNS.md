# Phase 42: UAC/UVC Calculator — Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 17 (13 new + 4 modified)
**Analogs found:** 17/17 (every new file has an exact 1:1 analog in `src/lib/gir/`; every modified file has a shipped reference rule-pair)

**Ground rule for every executor:** mirror the GIR calculator shape. Where GIR has three inputs and glucose buckets, UAC/UVC has one input and no buckets — drop those branches, keep everything else (state singleton layout, sessionStorage try/catch, hero `aria-live` + `{#key pulseKey}`, empty-state copy, typed config wrapper, parity-test closeEnough helper, viewport-loop E2E, 4-sweep axe pattern). Do NOT invent new patterns when a GIR one exists.

---

## File Classification

### New files (13)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/lib/uac-uvc/UacUvcCalculator.svelte` | component | reactive-derive (request-response) | `src/lib/gir/GirCalculator.svelte` | exact (drop advisories + titration grid) |
| `src/lib/uac-uvc/UacUvcCalculator.test.ts` | test | component-render | `src/lib/gir/GirCalculator.test.ts` | exact |
| `src/lib/uac-uvc/calculations.ts` | utility (pure) | transform | `src/lib/gir/calculations.ts` | exact (single closed-form pair vs. 4 functions) |
| `src/lib/uac-uvc/calculations.test.ts` | test | data-driven parity | `src/lib/gir/calculations.test.ts` | exact (multi-fixture loop vs. single-fixture) |
| `src/lib/uac-uvc/uac-uvc-config.json` | config (clinical data) | static | `src/lib/gir/gir-config.json` | exact (drop `glucoseBuckets` block) |
| `src/lib/uac-uvc/uac-uvc-config.ts` | config wrapper | static | `src/lib/gir/gir-config.ts` | exact (drop bucket exports) |
| `src/lib/uac-uvc/uac-uvc-config.test.ts` | test | shape | `src/lib/gir/gir-config.test.ts` | exact (drop bucket assertions) |
| `src/lib/uac-uvc/uac-uvc-parity.fixtures.json` | test fixture | static | `src/lib/gir/gir-parity.fixtures.json` | role-match (shape adapts from single-case to array of 5) |
| `src/lib/uac-uvc/state.svelte.ts` | store (singleton) | event-driven (sessionStorage) | `src/lib/gir/state.svelte.ts` | exact |
| `src/lib/uac-uvc/types.ts` | types | static | `src/lib/gir/types.ts` | exact (drop `GlucoseBucket` + `GirTitrationRow`) |
| `src/routes/uac-uvc/+page.svelte` | route shell | request-response | `src/routes/gir/+page.svelte` | exact |
| `e2e/uac-uvc.spec.ts` | test (E2E) | user-flow | `e2e/gir.spec.ts` + `e2e/favorites-nav.spec.ts` | exact + splice |
| `e2e/uac-uvc-a11y.spec.ts` | test (axe) | audit | `e2e/gir-a11y.spec.ts` | exact (2–3 sweeps vs. 6) |

### Modified files (4)

| Modified File | Role | Change | Reference Pattern |
|---------------|------|--------|-------------------|
| `src/lib/shared/types.ts` | types | Extend `CalculatorId` union literal | Existing union at line 7 |
| `src/lib/shell/registry.ts` | config | Extend `identityClass` union + append entry | Existing 4 entries at lines 14–47 |
| `src/lib/shared/about-content.ts` | content | Add `'uac-uvc'` key to `Record<CalculatorId, AboutContent>` | Existing `gir` entry at lines 37–48 |
| `src/app.css` | tokens | Append `.identity-uac` light + dark rule pair | Existing `.identity-feeds` at lines 246–254 |

---

## Pattern Assignments

### `src/lib/uac-uvc/state.svelte.ts` (store, sessionStorage-backed singleton)

**Analog:** `src/lib/gir/state.svelte.ts` (whole file copied, types swapped)
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/state.svelte.ts`

**Imports + SESSION_KEY + defaultState (lines 1–19):**
```ts
// src/lib/gir/state.svelte.ts
import type { GirStateData } from './types.js';
import config from './gir-config.json';

const SESSION_KEY = 'nicu_gir_state';

function defaultState(): GirStateData {
  return {
    weightKg: config.defaults.weightKg,
    dextrosePct: config.defaults.dextrosePct,
    mlPerKgPerDay: config.defaults.mlPerKgPerDay,
    selectedBucketId: null
  };
}
```

**Class + init/persist/reset (lines 21–55):**
```ts
class GirState {
  current = $state<GirStateData>(defaultState());

  /** Call from onMount only — reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GirStateData>;
        this.current = { ...defaultState(), ...parsed };
      }
    } catch {
      // Silent: invalid JSON or private browsing mode
    }
  }

  /** Persist current state to sessionStorage */
  persist(): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.current));
    } catch {
      // Silent: private browsing mode or storage quota exceeded
    }
  }

  /** Reset state to defaults and clear sessionStorage */
  reset(): void {
    this.current = defaultState();
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Silent: private browsing mode
    }
  }
}

export const girState = new GirState();
```

**Mirror for Phase 42 (exact diff from analog):**
- Rename `GirStateData` → `UacUvcStateData` import
- `SESSION_KEY = 'nicu_uac_uvc_state'` (per CONTEXT D-09)
- `defaultState()` returns **only** `{ weightKg: config.defaults.weightKg }` (drop dextrosePct, mlPerKgPerDay, selectedBucketId)
- `class UacUvcState { current = $state<UacUvcStateData>(defaultState()); ... }`
- `export const uacUvcState = new UacUvcState();`
- Keep all three `try/catch` blocks **verbatim** — silent failure is a shipped pattern (RESEARCH.md Pitfall #6 relies on this).

---

### `src/lib/uac-uvc/types.ts` (types)

**Analog:** `src/lib/gir/types.ts`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/types.ts`

**Template (lines 1–14 of analog — the parts Phase 42 keeps):**
```ts
import type { NumericInputRange } from '$lib/shared/types.js';

export interface GirStateData {
  weightKg: number | null;
  dextrosePct: number | null;
  mlPerKgPerDay: number | null;
  selectedBucketId: string | null;
}

export interface GirInputRanges {
  weightKg: NumericInputRange;
  dextrosePct: NumericInputRange;
  mlPerKgPerDay: NumericInputRange;
}
```

**Mirror for Phase 42:**
```ts
import type { NumericInputRange } from '$lib/shared/types.js';

export interface UacUvcStateData {
  weightKg: number | null;
}

export interface UacUvcInputRanges {
  weightKg: NumericInputRange;
}

export interface UacUvcResult {
  uacCm: number;
  uvcCm: number;
}
```
- Drop `GlucoseBucket` and `GirTitrationRow` entirely (lines 16–37 of analog).
- Replace `GirResult` (with `titration` array) with flat `UacUvcResult { uacCm, uvcCm }`.

---

### `src/lib/uac-uvc/uac-uvc-config.json` (clinical config)

**Analog:** `src/lib/gir/gir-config.json`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/gir-config.json`

**Pattern (lines 1–11 of analog — the parts Phase 42 keeps):**
```json
{
  "defaults": {
    "weightKg": 3.93,
    ...
  },
  "inputs": {
    "weightKg": { "min": 0.3, "max": 10, "step": 0.1 },
    ...
  }
}
```

**Mirror for Phase 42:**
```json
{
  "defaults": {
    "weightKg": 2.5
  },
  "inputs": {
    "weightKg": { "min": 0.3, "max": 10, "step": 0.1 }
  }
}
```
- Default `2.5` is xlsx B2/B6 (CONTEXT D-09).
- Drop `glucoseBuckets` array entirely (lines 12–29 of analog).

---

### `src/lib/uac-uvc/uac-uvc-config.ts` (typed wrapper)

**Analog:** `src/lib/gir/gir-config.ts`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/gir-config.ts`

**Template (entire file of analog — Phase 42 simplifies):**
```ts
import type { GirInputRanges, GlucoseBucket } from './types.js';
import config from './gir-config.json';

export const defaults = config.defaults as {
  weightKg: number;
  dextrosePct: number;
  mlPerKgPerDay: number;
};
export const inputs: GirInputRanges = config.inputs as GirInputRanges;
export const glucoseBuckets: GlucoseBucket[] = config.glucoseBuckets as GlucoseBucket[];

export function getBucketById(id: string): GlucoseBucket | undefined {
  return glucoseBuckets.find((b) => b.id === id);
}
```

**Mirror for Phase 42:**
```ts
import type { UacUvcInputRanges } from './types.js';
import config from './uac-uvc-config.json';

export const defaults = config.defaults as {
  weightKg: number;
};
export const inputs: UacUvcInputRanges = config.inputs as UacUvcInputRanges;
```
- Drop `glucoseBuckets` export and `getBucketById` helper — no bucket concept.

---

### `src/lib/uac-uvc/calculations.ts` (pure transform)

**Analog:** `src/lib/gir/calculations.ts`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/calculations.ts`

**JSDoc rationale-block pattern (analog lines 3–19):**
```ts
/**
 * Current GIR (mg/kg/min).
 *
 * Formula: dextrosePct * mlPerKgPerDay * (10/60) / 24
 *          = dextrosePct * mlPerKgPerDay / 144
 *
 * Derivation:
 *   ...
 *
 * Verified against MDCalc + Hawkes J Perinatol (PMC7286731).
 * Uses exact 10/60 — never the spreadsheet's truncated constant.
 * Parity tests allow 1% epsilon to reconcile against spreadsheet truncation.
 */
export function calculateCurrentGir(
  weightKg: number,
  dextrosePct: number,
  mlPerKgPerDay: number
): number {
  ...
}
```

**Aggregator null-guard pattern (analog lines 70–81):**
```ts
export function calculateGir(
  state: { weightKg: number | null; dextrosePct: number | null; mlPerKgPerDay: number | null },
  buckets: GlucoseBucket[]
): GirResult | null {
  const { weightKg, dextrosePct, mlPerKgPerDay } = state;
  if (weightKg == null || dextrosePct == null || mlPerKgPerDay == null) return null;
  return {
    currentGirMgKgMin: calculateCurrentGir(weightKg, dextrosePct, mlPerKgPerDay),
    initialRateMlHr: calculateInitialRateMlHr(weightKg, mlPerKgPerDay),
    titration: calculateTitrationRows(weightKg, dextrosePct, mlPerKgPerDay, buckets)
  };
}
```

**Mirror for Phase 42 — three exports:**
```ts
import type { UacUvcResult } from './types.js';

/**
 * UAC (umbilical arterial catheter) insertion depth (cm).
 *
 * Formula: weightKg * 3 + 9    (xlsx uac-uvc-calculator.xlsx cell B3)
 *
 * Rule-of-thumb estimate attributed to Shukla/Dunn weight-based derivation.
 * Final placement MUST be confirmed by imaging per institutional protocol.
 * Exact under IEEE-754 for the input domain (0.3–10 kg); parity epsilon
 * exists for consistency with GIR/feeds/morphine, not because of drift.
 */
export function calculateUacDepth(weightKg: number): number {
  return weightKg * 3 + 9;
}

/**
 * UVC (umbilical venous catheter) insertion depth (cm) = UAC / 2.
 * xlsx cell B7 = (B6*3+9)/2.
 */
export function calculateUvcDepth(weightKg: number): number {
  return (weightKg * 3 + 9) / 2;
}

export function calculateUacUvc(
  state: { weightKg: number | null }
): UacUvcResult | null {
  if (state.weightKg == null) return null;
  return {
    uacCm: calculateUacDepth(state.weightKg),
    uvcCm: calculateUvcDepth(state.weightKg)
  };
}
```
- JSDoc cites xlsx cells directly (mirrors GIR citing MDCalc/Hawkes).
- Aggregator returns `null` on null input; no throw (matches GIR's trust-inputs contract).
- `void weightKg;` trick NOT needed — Phase 42 uses the param.

---

### `src/lib/uac-uvc/calculations.test.ts` (parity test)

**Analog:** `src/lib/gir/calculations.test.ts`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/calculations.test.ts`

**Epsilon helper (analog lines 11–22) — copy verbatim:**
```ts
const EPSILON = 0.01; // 1% — reconciles exact 10/60 constant vs spreadsheet truncation
const ABS_FLOOR = 0.15; // absolute ml/hr floor for delta comparisons near zero;
// truncated spreadsheet constants cascade into delta subtraction,
// so we accept either 1% relative OR <0.15 ml/hr absolute
// (clinically insignificant on an infusion pump).

function closeEnough(actual: number, expected: number): boolean {
  const absDiff = Math.abs(actual - expected);
  if (absDiff <= ABS_FLOOR) return true;
  if (expected === 0) return absDiff < EPSILON;
  return Math.abs(absDiff / expected) <= EPSILON;
}
```

**Fixture-driven assertion pattern (analog lines 37–48):**
```ts
describe('GIR calculations — spreadsheet parity', () => {
  const { weightKg, dextrosePct, mlPerKgPerDay } = fixtures.input;

  it('calculateCurrentGir matches spreadsheet within 1%', () => {
    const actual = calculateCurrentGir(weightKg, dextrosePct, mlPerKgPerDay);
    expect(closeEnough(actual, fixtures.expected.currentGirMgKgMin)).toBe(true);
  });
  ...
});
```

**Aggregator null-handling pattern (analog lines 56–84):**
```ts
describe('calculateGir aggregator', () => {
  it('returns null if weightKg is null', () => {
    expect(
      calculateGir({ weightKg: null, dextrosePct: 12.5, mlPerKgPerDay: 65 }, glucoseBuckets)
    ).toBeNull();
  });
  ...
  it('returns full GirResult when all inputs present', () => {
    const result = calculateGir(
      { weightKg: 3.93, dextrosePct: 12.5, mlPerKgPerDay: 65 },
      glucoseBuckets
    );
    expect(result).not.toBeNull();
    ...
  });
});
```

**Mirror for Phase 42 (shape change: single-case → array of 5):**
- Adjust `ABS_FLOOR` to `0.01` (cm — per CONTEXT D-13 "1% relative OR 0.01 cm absolute").
- Loop over `fixtures.cases` (see fixture shape below) instead of a single `fixtures.input` / `fixtures.expected`:
  ```ts
  for (const c of fixtures.cases) {
    it(`parity @ ${c.input.weightKg} kg`, () => {
      expect(closeEnough(calculateUacDepth(c.input.weightKg), c.expected.uacCm)).toBe(true);
      expect(closeEnough(calculateUvcDepth(c.input.weightKg), c.expected.uvcCm)).toBe(true);
    });
  }
  ```
- Aggregator null test: just `calculateUacUvc({ weightKg: null })` → `null`; full result when `weightKg = 2.5` → `{ uacCm: 16.5, uvcCm: 8.25 }`.

---

### `src/lib/uac-uvc/uac-uvc-parity.fixtures.json` (test fixture)

**Analog:** `src/lib/gir/gir-parity.fixtures.json`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/gir-parity.fixtures.json`

**Analog shape (lines 1–9 — single-case `{ input, expected }`):**
```json
{
  "input": { "weightKg": 3.93, "dextrosePct": 12.5, "mlPerKgPerDay": 65 },
  "expected": {
    "currentGirMgKgMin": 5.653645833,
    "initialRateMlHr": 10.64375,
    ...
  }
}
```

**Mirror for Phase 42 (array of 5 cases per CONTEXT D-13):**
```json
{
  "cases": [
    { "input": { "weightKg": 0.3 },  "expected": { "uacCm": 9.90,  "uvcCm": 4.95  } },
    { "input": { "weightKg": 1.0 },  "expected": { "uacCm": 12.00, "uvcCm": 6.00  } },
    { "input": { "weightKg": 2.5 },  "expected": { "uacCm": 16.50, "uvcCm": 8.25  } },
    { "input": { "weightKg": 5.0 },  "expected": { "uacCm": 24.00, "uvcCm": 12.00 } },
    { "input": { "weightKg": 10.0 }, "expected": { "uacCm": 39.00, "uvcCm": 19.50 } }
  ]
}
```
- Values re-derived from xlsx B3/B7 formulas: UAC = `w*3+9`, UVC = UAC/2. Planner should re-verify against `uac-uvc-calculator.xlsx` in the repo root before committing (per CONTEXT canonical refs).

---

### `src/lib/uac-uvc/uac-uvc-config.test.ts` (shape test)

**Analog:** `src/lib/gir/gir-config.test.ts`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/gir-config.test.ts`

**Shape-assertion pattern (analog lines 4–15):**
```ts
describe('gir-config shape', () => {
  it('defaults match spreadsheet reference example', () => {
    expect(defaults.weightKg).toBe(3.93);
    expect(defaults.dextrosePct).toBe(12.5);
    expect(defaults.mlPerKgPerDay).toBe(65);
  });

  it('inputs define advisory ranges for all three fields', () => {
    expect(inputs.weightKg).toEqual({ min: 0.3, max: 10, step: 0.1 });
    ...
  });
});
```

**Mirror for Phase 42:**
```ts
import { describe, it, expect } from 'vitest';
import { defaults, inputs } from './uac-uvc-config.js';

describe('uac-uvc-config shape', () => {
  it('defaults match xlsx B2/B6 reference example', () => {
    expect(defaults.weightKg).toBe(2.5);
  });

  it('inputs define advisory range for weightKg', () => {
    expect(inputs.weightKg).toEqual({ min: 0.3, max: 10, step: 0.1 });
  });
});
```
- Drop bucket assertions (analog lines 17–35).

---

### `src/lib/uac-uvc/UacUvcCalculator.svelte` (component, hero composition)

**Analog:** `src/lib/gir/GirCalculator.svelte`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/GirCalculator.svelte`

**Script block pattern (analog lines 1–40):**
```svelte
<script lang="ts">
  import { calculateGir } from './calculations.js';
  import { girState } from './state.svelte.js';
  import GlucoseTitrationGrid from './GlucoseTitrationGrid.svelte';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import config from './gir-config.json';
  import type { GirInputRanges, GlucoseBucket } from './types.js';
  import { AlertTriangle, Info } from '@lucide/svelte';

  const inputs = config.inputs as GirInputRanges;
  ...

  let result = $derived(calculateGir(girState.current, buckets));
  ...

  let pulseKey = $derived(
    result ? `${result.currentGirMgKgMin.toFixed(1)}-${result.initialRateMlHr.toFixed(1)}` : ''
  );
  ...

  // Persist on change
  $effect(() => {
    JSON.stringify(girState.current);
    girState.persist();
  });
</script>
```

**Inputs card pattern (analog lines 43–99) — keep `.card flex flex-col gap-4` wrapper + `NumericInput` with `showRangeHint={true} showRangeError={true}`:**
```svelte
<section class="card flex flex-col gap-4">
  <NumericInput
    bind:value={girState.current.weightKg}
    label="Weight"
    suffix="kg"
    min={inputs.weightKg.min}
    max={inputs.weightKg.max}
    step={inputs.weightKg.step}
    placeholder="3.1"
    id="gir-weight"
    showRangeHint={true}
    showRangeError={true}
  />
  ...
</section>
```

**Hero-card composition pattern (analog lines 101–144) — THE CORE PATTERN Phase 42 duplicates twice:**
```svelte
{#key pulseKey}
  <section
    class="card animate-result-pulse px-5 py-5"
    style="background: var(--color-identity-hero);"
    aria-live="polite"
    aria-atomic="true"
  >
    {#if result}
      <div class="flex flex-col gap-3">
        <div>
          <div
            class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
          >
            CURRENT GIR
          </div>
          <div class="flex items-baseline gap-2">
            <span class="num text-display font-black text-[var(--color-text-primary)]"
              >{result.currentGirMgKgMin.toFixed(1)}</span
            >
            <span class="text-ui text-[var(--color-text-secondary)]">mg/kg/min</span>
          </div>
        </div>
        ...
      </div>
    {:else}
      <p class="text-ui text-[var(--color-text-secondary)]">
        Enter weight, dextrose %, and fluid rate to compute GIR
      </p>
    {/if}
  </section>
{/key}
```

**Mirror for Phase 42 — apply once per card (UAC + UVC), with D-05 three-cue distinction:**

Script diff from analog:
- Drop `GlucoseTitrationGrid`, `AlertTriangle`, `Info` imports.
- Add `import { ArrowDownToLine, ArrowUpFromLine } from '@lucide/svelte';`
- Drop `showDex...`, `showGir...` advisory flags and `handleSelectBucket`.
- `let result = $derived(calculateUacUvc(uacUvcState.current));`
- `let pulseKey = $derived(uacUvcState.current.weightKg?.toFixed(2) ?? '');` (per UI-SPEC §Interaction Contract — single-variable key, not dual-metric).
- Keep the `$effect(() => { JSON.stringify(uacUvcState.current); uacUvcState.persist(); });` block **verbatim** (rename only).

Inputs card diff from analog:
- ONE `NumericInput` (Weight, `id="uac-weight"`, placeholder `"2.5"`).
- Then inline `<input type="range">` per UI-SPEC §Layout "Slider inline markup":
  ```svelte
  <input
    type="range"
    min={inputs.weightKg.min}
    max={inputs.weightKg.max}
    step={inputs.weightKg.step}
    value={uacUvcState.current.weightKg ?? inputs.weightKg.min}
    oninput={(e) =>
      (uacUvcState.current.weightKg = parseFloat((e.currentTarget as HTMLInputElement).value))}
    aria-label="Weight slider"
    class="range-uac mt-2 w-full"
  />
  ```

Hero grid diff from analog: replace the single hero + titration grid with `grid grid-cols-1 md:grid-cols-2 gap-4` containing TWO heros. The analog's hero `<section>` (lines 101–144) is the template applied twice — keep `.card .animate-result-pulse .px-5 .py-5`, `aria-live="polite"`, `aria-atomic="true"`, empty-state `<p>`, `{#key pulseKey}...{/key}` wrapper — but swap:
- Eyebrow div text: `UAC DEPTH — ARTERIAL` / `UVC DEPTH — VENOUS` (em-dash U+2014 per UI-SPEC §Copywriting).
- Add `<ArrowDownToLine size={24} class="text-[var(--color-identity)]" aria-hidden="true" />` / `<ArrowUpFromLine ...>` at the start of the icon+eyebrow row (UI-SPEC §Asset & Icon Inventory).
- Value span: `{result.uacCm.toFixed(1)}` / `{result.uvcCm.toFixed(1)}` — 1 decimal locked in UI-SPEC §Typography.
- Unit span: `cm`.
- Add `border-t-4` on UAC `<section>` + inline `style="background: var(--color-identity-hero); border-top-color: var(--color-identity);"`; add `border-b-4` on UVC `<section>` + inline `style="background: var(--color-identity-hero); border-bottom-color: var(--color-identity);"` (per UI-SPEC §Color accent #4 + §Layout "Stripe rendering").
- Empty state copy (both cards, identical): `"Enter weight to compute depth"` (UI-SPEC §Copywriting).

Scoped `<style>` block at end of component (UI-SPEC §Layout "slider inline markup"):
```svelte
<style>
  .range-uac {
    accent-color: var(--color-identity);
    min-height: 48px;
    touch-action: manipulation;
    width: 100%;
  }
</style>
```

Drop entirely: the dextrose advisory block (analog lines 70–85), the two `showGirHigh/LowAdvisory` cards (lines 147–170), the titration section with `<GlucoseTitrationGrid>` (lines 173–185).

---

### `src/lib/uac-uvc/UacUvcCalculator.test.ts` (component test)

**Analog:** `src/lib/gir/GirCalculator.test.ts`
**Source path:** `/mnt/data/src/nicu-assistant/src/lib/gir/GirCalculator.test.ts`

**Setup + reset pattern (analog lines 1–14):**
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GirCalculator from './GirCalculator.svelte';
import { girState } from './state.svelte.js';

describe('GirCalculator', () => {
  beforeEach(() => {
    girState.reset();
  });

  it('renders without crashing', () => {
    render(GirCalculator);
    expect(screen.getByText('CURRENT GIR')).toBeTruthy();
  });
```

**Empty-state assertion pattern (analog lines 22–28):**
```ts
it('shows empty-state hero when any input null', () => {
  girState.current.weightKg = null;
  ...
  render(GirCalculator);
  expect(screen.getByText(/Enter weight, dextrose %, and fluid rate/)).toBeTruthy();
});
```

**State-drives-hero assertion pattern (analog lines 41–47):**
```ts
it('valid inputs render non-null Current GIR and Initial rate numbers', () => {
  girState.current.weightKg = 3.1;
  girState.current.dextrosePct = 12.5;
  girState.current.mlPerKgPerDay = 80;
  render(GirCalculator);
  expect(screen.getAllByText('mg/kg/min').length).toBeGreaterThan(0);
});
```

**Mirror for Phase 42 — five scenarios per CONTEXT D-14:**
1. Empty state: `uacUvcState.current.weightKg = null` → `screen.getByText(/Enter weight to compute depth/)` appears twice (UAC + UVC cards).
2. Valid input flow: `uacUvcState.current.weightKg = 2.5` → render → `screen.getByText('16.5')` + `screen.getByText('8.3')` both truthy; `screen.getAllByText('cm').length >= 2`.
3. Bidirectional sync via range input: after render, locate `screen.getByLabelText('Weight slider')`, `await fireEvent.input(slider, { target: { value: '5' } })`, then assert `uacUvcState.current.weightKg === 5` and the textbox now reads `5` (via `getByLabelText('Weight').value`).
4. Textbox → slider: fill `getByLabelText('Weight')` with `1.0`, fire input, assert slider's `value` attribute reflects `1.0`.
5. sessionStorage persistence: set `uacUvcState.current.weightKg = 7.5`, call `uacUvcState.persist()`, then `uacUvcState.reset()` to clear in-memory, then `uacUvcState.init()` — expect `.weightKg === 7.5`.
6. (Optional 6th — UAC-ARCH-05 validation per CONTEXT D-11): test NavShell `activeCalculatorId` derivation resolves `/uac-uvc` → `'uac-uvc'`. This is already covered by `CALCULATOR_REGISTRY.find(...)` — a simple unit test against the registry suffices; no NavShell render needed.

Keep `beforeEach(() => uacUvcState.reset())` **verbatim** (analog line 7) — the reset-before-each pattern is the isolation primitive.

---

### `src/routes/uac-uvc/+page.svelte` (route shell)

**Analog:** `src/routes/gir/+page.svelte`
**Source path:** `/mnt/data/src/nicu-assistant/src/routes/gir/+page.svelte`

**Whole file of analog (32 lines — Phase 42 duplicates and swaps tokens):**
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { girState } from '$lib/gir/state.svelte.js';
  import GirCalculator from '$lib/gir/GirCalculator.svelte';
  import { Droplet } from '@lucide/svelte';

  onMount(() => {
    setCalculatorContext({
      id: 'gir',
      accentColor: 'var(--color-identity)'
    });
    girState.init();
  });
</script>

<svelte:head>
  <title>GIR | NICU Assistant</title>
</svelte:head>

<div class="identity-gir mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl">
  <header class="flex items-center gap-3">
    <Droplet size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
    <div class="flex flex-col">
      <h1 class="text-title font-bold text-[var(--color-text-primary)]">Glucose Infusion Rate</h1>
      <span class="text-ui text-[var(--color-text-secondary)]">mg/kg/min · titration helper</span>
    </div>
  </header>

  <GirCalculator />
</div>
```

**Mirror for Phase 42 — eight string swaps, zero structure changes:**
- `girState` → `uacUvcState`; import from `$lib/uac-uvc/state.svelte.js`.
- `GirCalculator` → `UacUvcCalculator`; import from `$lib/uac-uvc/UacUvcCalculator.svelte`.
- `Droplet` → `Ruler` (UI-SPEC §Asset & Icon Inventory).
- `setCalculatorContext.id`: `'gir'` → `'uac-uvc'`.
- `<title>`: `GIR | NICU Assistant` → `UAC/UVC | NICU Assistant` (UI-SPEC §Copywriting).
- Container class: `identity-gir` → `identity-uac`. **Keep `mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl` verbatim** (locked by CONTEXT D-10).
- `<h1>` text: `Glucose Infusion Rate` → `UAC/UVC Catheter Depth`.
- Subtitle text: `mg/kg/min · titration helper` → `cm · weight-based formula` (middle-dot U+00B7 — UI-SPEC §Copywriting).

---

### `e2e/uac-uvc.spec.ts` (E2E — happy path + favorites round-trip)

**Analogs:** `e2e/gir.spec.ts` (viewport loop + `inputmode` regression) + `e2e/favorites-nav.spec.ts` (localStorage addInitScript reset + hamburger flow)

**Viewport-loop pattern (gir.spec.ts lines 7–20):**
```ts
for (const viewport of [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 }
]) {
  test.describe(`GIR happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/gir');
      await page
        .getByRole('button', { name: /understand/i })
        .click({ timeout: 2000 })
        .catch(() => {});
    });
    ...
```

**`inputmode="decimal"` regression pattern (gir.spec.ts lines 61–65):**
```ts
test('all three NumericInputs have inputmode="decimal"', async ({ page }) => {
  await expect(page.getByLabel('Weight')).toHaveAttribute('inputmode', 'decimal');
  ...
});
```

**localStorage-reset pattern for favorites flow (favorites-nav.spec.ts lines 29–42):**
```ts
test.beforeEach(async ({ page }) => {
  // D-11: pre-clear both keys for order-independence.
  // This script runs on EVERY navigation (including reload) for this page.
  await page.addInitScript(() => {
    localStorage.removeItem('nicu:favorites');
    localStorage.removeItem('nicu:disclaimer-accepted');
  });
  await page.goto('/morphine-wean');
  await page
    .getByRole('button', { name: /understand/i })
    .click({ timeout: 2000 })
    .catch(() => {});
});
```

**"Star in hamburger" flow pattern (favorites-nav.spec.ts lines 44–67):**
```ts
test('FAV-TEST-03-1: un-favorite Feeds → bar shows 3 tabs', async ({ page }) => {
  await page.getByRole('button', { name: 'Open calculator menu' }).click();
  await page.getByRole('dialog').waitFor({ state: 'visible' });

  await page.getByRole('button', { name: /remove feeds from favorites/i }).click();

  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });

  const nav = isDesktop
    ? page.locator('nav[aria-label="Calculator navigation"]').first()
    : page.locator('nav[aria-label="Calculator navigation"]').last();
  await expect(nav.getByRole('tab')).toHaveCount(3);
  ...
});
```

**"Set specific favorites via addInitScript before reload" pattern (favorites-nav.spec.ts lines 72–82):**
```ts
await page.addInitScript(() => {
  localStorage.setItem(
    'nicu:favorites',
    JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'gir'] })
  );
});
await page.reload();
await page
  .getByRole('button', { name: /understand/i })
  .click({ timeout: 2000 })
  .catch(() => {});
```

**Mirror for Phase 42 (`e2e/uac-uvc.spec.ts`) — four test cases per CONTEXT D-15:**

1. **Happy path at each viewport** (gir.spec.ts template): `await page.goto('/uac-uvc')`, `await page.getByLabel('Weight').fill('2.5')`, assert both hero cards visible with `await expect(page.getByText('UAC DEPTH — ARTERIAL')).toBeVisible();` and `await expect(page.getByText('16.5')).toBeVisible();` + `await expect(page.getByText('8.3')).toBeVisible();`. Also `await expect(page.getByLabel('Weight')).toHaveAttribute('inputmode', 'decimal')` (regression guard).

2. **Favorites round-trip (un-favorite Feeds, star UAC/UVC, bar becomes 4 with UAC/UVC)** — compose from favorites-nav.spec.ts lines 44–67 but target UAC/UVC: from `/` with addInitScript reset, open hamburger, tap "Remove Feeds from favorites", tap "Add UAC/UVC to favorites", Esc, assert `nav.getByRole('tab')` count is 4 AND `nav.getByRole('tab', { name: /uac\/uvc/i })` is visible.

3. **Cap-full disabled state** — from `/` with addInitScript pre-seeded `['morphine-wean', 'formula', 'gir', 'feeds']` (4-full), open hamburger, assert `await expect(page.getByText(/4 of 4 favorites — remove one to add another/)).toBeVisible()` (caption from HamburgerMenu line 80) AND `await expect(page.getByRole('button', { name: /Add UAC\/UVC to favorites \(limit reached/i })).toHaveAttribute('aria-disabled', 'true')` (line 120 of HamburgerMenu).

4. **Reload persistence** — after favoriting UAC/UVC, `await page.reload()`, dismiss disclaimer, assert UAC/UVC tab still in the nav bar. Use the localStorage-read pattern from favorites-nav.spec.ts lines 121–125 to also confirm `parsed.ids.includes('uac-uvc')`.

5. **Slider drag sync** — `await page.getByLabel('Weight slider').fill('5')` (Playwright `fill` on range input sets the value and fires input), then `await expect(page.getByLabel('Weight')).toHaveValue('5')`.

---

### `e2e/uac-uvc-a11y.spec.ts` (axe sweep)

**Analog:** `e2e/gir-a11y.spec.ts`
**Source path:** `/mnt/data/src/nicu-assistant/e2e/gir-a11y.spec.ts`

**Setup + heading-gate pattern (analog lines 4–17):**
```ts
test.describe('GIR Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gir');

    await page
      .getByRole('heading', { name: 'Glucose Infusion Rate' })
      .waitFor({ state: 'visible' });

    await page
      .getByRole('button', { name: /understand|acknowledge/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });
```

**Light-mode sweep pattern (analog lines 19–29) — copy verbatim, rename description:**
```ts
test('gir page has no axe violations in light mode', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.setAttribute('data-theme', 'light');
  });

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  expect(results.violations).toEqual([]);
});
```

**Dark-mode sweep pattern (analog lines 31–43) — copy verbatim, note the `no-transition` class + 250ms wait:**
```ts
test('gir page has no axe violations in dark mode', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.classList.add('no-transition');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(250);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  expect(results.violations).toEqual([]);
});
```

**Focus-ring sweep pattern (analog lines 45–56) — optional third sweep per UI-SPEC §Accessibility:**
```ts
test('gir page has no axe violations with focus ring visible', async ({ page }) => {
  await page.getByLabel('Weight').fill('3.1');
  ...
  await page.getByLabel('Weight').focus();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
```

**Mirror for Phase 42 — minimum 2, up to 3 sweeps per CONTEXT D-16 + UI-SPEC §Accessibility:**
- `await page.goto('/uac-uvc')`.
- Heading waitFor: `{ name: 'UAC/UVC Catheter Depth' }` (UI-SPEC §Copywriting).
- Sweep 1: light mode (copy analog verbatim).
- Sweep 2: dark mode (copy analog verbatim — keep the `no-transition` trick + 250ms wait).
- Optional Sweep 3: focus-ring variant — `await page.getByLabel('Weight').fill('2.5'); await page.getByLabel('Weight').focus();` then axe.

Do NOT add a "selected bucket" or "advisory" sweep (analog lines 58–133) — Phase 42 has no buckets or advisories.

---

## Shared Patterns

### Identity CSS token-pair template

**Source:** `src/app.css:246–254` (`.identity-feeds` — freshest analog)
**Apply to:** `src/app.css` new `.identity-uac` block

**Canonical pattern (analog, lines 246–254):**
```css
  .identity-feeds {
    --color-identity: oklch(50% 0.13 30);
    --color-identity-hero: oklch(94% 0.04 30);
  }
  .dark .identity-feeds,
  [data-theme='dark'] .identity-feeds {
    --color-identity: oklch(80% 0.1 30);
    --color-identity-hero: oklch(24% 0.05 30);
  }
```

**Phase 42 literal append (OKLCH quartet locked by UI-SPEC §Color — paste verbatim; do NOT retune):**
```css
  .identity-uac {
    --color-identity: oklch(42% 0.12 350);
    --color-identity-hero: oklch(95% 0.035 350);
  }
  .dark .identity-uac,
  [data-theme='dark'] .identity-uac {
    --color-identity: oklch(80% 0.10 350);
    --color-identity-hero: oklch(24% 0.05 350);
  }
```

Insert inside the same `@layer utilities` (or whatever container the 4 existing `.identity-*` pairs sit in — the block spans lines 215–255 of app.css as one unit). Append AFTER the `.identity-feeds` dark block (after line 254), BEFORE the closing `}` of the block (line 255). Keep the 2-space indent. Do NOT reorder existing rules.

### Registry entry literal

**Source:** `src/lib/shell/registry.ts:39–46` (feeds entry — freshest analog)
**Apply to:** `src/lib/shell/registry.ts` — append new entry + extend `identityClass` union

**Analog entry (lines 39–46) — the shape to copy:**
```ts
  {
    id: 'feeds',
    label: 'Feeds',
    href: '/feeds',
    icon: Baby,
    description: 'Feed advance calculator',
    identityClass: 'identity-feeds'
  }
```

**Analog `identityClass` union (line 11):**
```ts
  identityClass: 'identity-morphine' | 'identity-formula' | 'identity-gir' | 'identity-feeds';
```

**Phase 42 diff:**

1. Line 3 — extend icon imports:
   ```ts
   import { Syringe, Milk, Droplet, Baby, Ruler } from '@lucide/svelte';
   ```
2. Line 11 — extend union:
   ```ts
   identityClass: 'identity-morphine' | 'identity-formula' | 'identity-gir' | 'identity-feeds' | 'identity-uac';
   ```
3. After line 46 (the feeds entry), append (inside the `CALCULATOR_REGISTRY` array, before the `] as const;` at line 47):
   ```ts
   ,
   {
     id: 'uac-uvc',
     label: 'UAC/UVC',
     href: '/uac-uvc',
     icon: Ruler,
     description: 'UAC/UVC umbilical catheter depth calculator',
     identityClass: 'identity-uac'
   }
   ```
   Registry order matters (FAV-06 ordering + D-02 defaults slice) — UAC/UVC **must be position 5 (last)**.

### `CalculatorId` union extension

**Source:** `src/lib/shared/types.ts:7`
**Apply to:** same file, one-line edit.

**Analog (line 7):**
```ts
export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds';
```

**Phase 42 replacement:**
```ts
export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc';
```

**Consequence:** `about-content.ts`'s `Record<CalculatorId, AboutContent>` will error at compile time until the `'uac-uvc'` key is added. This is the compile-enforced completeness driver (CONTEXT §Code Context).

### AboutSheet record entry

**Source:** `src/lib/shared/about-content.ts:37–48` (gir entry — freshest analog with citation + clinical caveat)
**Apply to:** `src/lib/shared/about-content.ts` — add new key.

**Analog entry (lines 37–48):**
```ts
  gir: {
    title: 'Glucose Infusion Rate',
    version: appVersion,
    description:
      'Calculates Current GIR (mg/kg/min) and Initial infusion rate (ml/hr) from Weight, Dextrose %, and Fluid order, with a 6-bucket glucose-driven titration helper (Target GIR / Target rate / Δ rate).',
    notes: [
      'Formula: Current GIR = (Dex% × rate ml/hr × 10) / (Weight × 60); Initial rate = (Weight × ml/kg/day) / 24.',
      'Source spreadsheet: GIR-Wean-Calculator.xlsx (CALC tab). Formula validated against MDCalc and Hawkes et al., J Perinatol 2020 (PMC7286731).',
      "The 6-bucket titration adjustment values are an institutional protocol — verify against your unit's own protocol before acting.",
      'Dextrose >12.5% requires central venous access. GIR >12 mg/kg/min warrants hyperinsulinism workup.'
    ]
  },
```

**Phase 42 append (before the closing `}` at line 60, after the `feeds` entry) — paste-ready per UI-SPEC §Copywriting + CONTEXT D-12:**
```ts
  'uac-uvc': {
    title: 'UAC/UVC Catheter Depth',
    version: appVersion,
    description:
      'Calculates umbilical arterial (UAC) and umbilical venous (UVC) catheter insertion depths from infant weight, using the Shukla/Dunn weight-based rule of thumb.',
    notes: [
      'Formulas: UAC depth = weight × 3 + 9 (cm); UVC depth = (weight × 3 + 9) / 2 (cm).',
      'Source: uac-uvc-calculator.xlsx (cells B3 and B7).',
      'Rule-of-thumb estimate only — final placement MUST be confirmed by imaging (chest/abdominal X-ray) per institutional protocol before use.'
    ]
  }
```
- Use quoted key `'uac-uvc'` (hyphen in identifier requires string literal).
- All em-dashes are U+2014 per UI-SPEC §Copywriting.

### sessionStorage try/catch silent-failure pattern

**Source:** `src/lib/gir/state.svelte.ts:26–34, 39–43, 49–53`
**Apply to:** new `src/lib/uac-uvc/state.svelte.ts` — three try/catch blocks verbatim.

Three separate call sites — each wraps the `sessionStorage.*` call with its own `try {...} catch { // Silent: ... }`. Never combine them; never add a user-facing error state (RESEARCH.md Pitfall #6).

### Reduced-motion pulse gate + `aria-live` atomic hero

**Source:** `src/lib/gir/GirCalculator.svelte:102–107`, `src/app.css` `.animate-result-pulse` utility
**Apply to:** both UAC and UVC hero `<section>` blocks in `UacUvcCalculator.svelte`.

```svelte
{#key pulseKey}
  <section
    class="card animate-result-pulse px-5 py-5"
    style="background: var(--color-identity-hero);"
    aria-live="polite"
    aria-atomic="true"
  >
    ...
  </section>
{/key}
```
- `.animate-result-pulse` is reduced-motion-gated in `src/app.css:180–184` (inherited — no new CSS needed).
- `aria-atomic="true"` is **mandatory** (UAC-06) — makes screen readers announce the full card each time, not a diff.

### NumericInput consumption (UAC-07 "free" via props)

**Source:** `src/lib/shared/components/NumericInput.svelte:13–37` (props) + `src/lib/gir/GirCalculator.svelte:45–56` (invocation)
**Apply to:** inputs card in `UacUvcCalculator.svelte`.

The `showRangeError={true}` prop enables the blur-gated `"Outside expected range — verify"` advisory (NumericInput.svelte:43–52). No custom error handling, no clamping. The `showRangeHint={true}` prop auto-generates the `"0.3–10 kg"` range hint below the textbox (lines 56–64). Phase 42 consumes this unchanged — both props `true`.

### Viewport-loop E2E structure

**Source:** `e2e/gir.spec.ts:7–20`, `e2e/feeds.spec.ts` (identical pattern), `e2e/favorites-nav.spec.ts:16–27`
**Apply to:** `e2e/uac-uvc.spec.ts` top-level structure.

Always wrap tests in `for (const viewport of [{ name: 'mobile', width: 375, ... }, { name: 'desktop', width: 1280, ... }])` + `test.describe(... (${viewport.name}))` + `test.use({ viewport: ... })`. Both viewports are MANDATORY baselines (CONTEXT D-15 + UI-SPEC §Responsive Behavior).

### Disclaimer auto-dismiss in every spec

**Source:** `e2e/gir.spec.ts:17–20`, `e2e/gir-a11y.spec.ts:12–16`, `e2e/favorites-nav.spec.ts:38–42`
**Apply to:** every test.beforeEach in both new Phase 42 specs.

```ts
await page
  .getByRole('button', { name: /understand/i })
  .click({ timeout: 2000 })
  .catch(() => {});
```
- The `.catch(() => {})` + 2s timeout is the project convention — never `await expect` the button (it may not appear if previously accepted + persisted to localStorage).

### Co-located Vitest tests

**Source:** Every `*.test.ts` in `src/lib/gir/` sits beside its `*.svelte` / `*.ts` counterpart.
**Apply to:** all three Phase 42 test files in `src/lib/uac-uvc/`.

Never create `src/lib/uac-uvc/__tests__/`. Project memory `feedback_test_colocation.md` is binding.

### Hamburger cap-full caption + `aria-disabled` contract (read-only in Phase 42, verified by E2E)

**Source:** `src/lib/shell/HamburgerMenu.svelte:78–82, 108–121`
**Apply to:** assertions in `e2e/uac-uvc.spec.ts` favorites cap-full test (no component edits).

```svelte
{#if favorites.isFull}
  <span class="text-2xs text-[var(--color-text-secondary)]">
    {FAVORITES_MAX} of {FAVORITES_MAX} favorites — remove one to add another.
  </span>
{/if}
```
```svelte
<button
  ...
  disabled={capBlocked}
  aria-disabled={capBlocked ? 'true' : undefined}
  onclick={...}
>
```
- Assert caption text `/4 of 4 favorites — remove one to add another/` (em-dash!).
- Assert star button `aria-disabled="true"` when UAC/UVC is non-favorite AND `favorites.isFull`.

---

## No Analog Found

None. Every new file in Phase 42 has a direct 1:1 analog in `src/lib/gir/` (the GIR calculator is the explicit reference mirror per CONTEXT canonical refs). The two risky areas flagged in RESEARCH.md Summary — the OKLCH identity quartet and the range-slider bidirectional sync — are pre-resolved in UI-SPEC §Color (paste-ready OKLCH values) and UI-SPEC §Interaction Contract / Bidirectional sync (paste-ready `<input type="range">` snippet). Executor does not need to invent anything.

---

## Metadata

**Analog search scope:**
- `/mnt/data/src/nicu-assistant/src/lib/gir/` (primary mirror — all 9 calculator files read)
- `/mnt/data/src/nicu-assistant/src/routes/gir/+page.svelte` (route shell)
- `/mnt/data/src/nicu-assistant/src/lib/shared/` (types, about-content, favorites.svelte.ts, context.ts, components/NumericInput.svelte)
- `/mnt/data/src/nicu-assistant/src/lib/shell/` (registry.ts, NavShell.svelte active-id derivation, HamburgerMenu.svelte cap UI)
- `/mnt/data/src/nicu-assistant/src/app.css` (identity CSS rule-pair pattern at lines 215–255)
- `/mnt/data/src/nicu-assistant/e2e/` (gir.spec.ts, gir-a11y.spec.ts, favorites-nav.spec.ts, feeds-a11y.spec.ts)

**Files scanned:** 17 analog source files + 4 CONTEXT/RESEARCH/UI-SPEC planning artifacts.

**Pattern extraction date:** 2026-04-23

---

## PATTERN MAPPING COMPLETE
