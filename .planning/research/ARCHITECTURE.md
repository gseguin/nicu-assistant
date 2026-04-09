# Architecture Research — v1.8 GIR Calculator

## Integration Checklist

### New files
- `src/lib/gir/types.ts` — `GirStateData`, `GirInputRanges`, `GlucoseBucket`, `GirTitrationRow`, `GirResult`
- `src/lib/gir/gir-config.json` — defaults, `inputs` ranges, `glucoseBuckets[]`
- `src/lib/gir/gir-config.ts` — typed wrapper exposing `inputs`, `glucoseBuckets`, `getDefaults()`
- `src/lib/gir/gir-config.test.ts` — shape + range sanity
- `src/lib/gir/calculations.ts` — pure calc functions
- `src/lib/gir/calculations.test.ts` — spreadsheet-parity vs `GIR-Wean-Calculator.xlsx`
- `src/lib/gir/state.svelte.ts` — rune singleton + sessionStorage (key `nicu_gir_state`)
- `src/lib/gir/GirCalculator.svelte` — inputs + hero + grid composition
- `src/lib/gir/GirCalculator.test.ts` — component smoke
- `src/lib/gir/GlucoseTitrationGrid.svelte` — dedicated radiogroup subcomponent
- `src/routes/gir/+page.svelte` — header + `<GirCalculator />`, `identity-gir` wrapper, `onMount → girState.init()`
- `tests/e2e/gir.spec.ts` — E2E flow
- `tests/e2e/gir-a11y.spec.ts` — light + dark axe sweeps + focus-ring + advisory variants

### Modified files
- `src/lib/shell/registry.ts` — extend `identityClass` union to include `'identity-gir'`; append GIR registry entry
- `src/app.css` — add `.identity-gir { ... }` light + dark blocks with literal OKLCH values
- `package.json` — version bump to `1.8.0`
- `.planning/PROJECT.md` — validated requirements list at milestone completion

No modifications needed to: `NumericInput`, `SegmentedToggle`, `SelectPicker`, `ResultsDisplay`, `AboutSheet`, `DisclaimerModal`, layout, theme code.

---

## State Singleton Shape (`gir/state.svelte.ts`)

Mirror `morphine/state.svelte.ts` exactly — same `_state = $state()` + `init/persist/reset` API.

```ts
export interface GlucoseBucket {
  id: string;             // 'severe-neuro' | 'lt40' | '40-50' | '50-60' | '60-70' | 'gt70'
  label: string;          // "<40", "40–50", etc.
  srLabel: string;        // "less than 40 mg/dL"
  targetGirDelta: number; // mg/kg/min change applied to currentGir
}

export interface GirStateData {
  weightKg: number | null;
  dextrosePct: number | null;     // e.g. 10 for D10W
  mlPerKgPerDay: number | null;
  selectedBucketId: string | null; // null = no titration row chosen yet
}
```

**Keystroke recomputation:** use `$derived` **inside the component**, not in the state module. State module holds raw inputs only; component calls `calculateGir(state.current)` inside `let result = $derived(...)`. Matches Morphine's pattern. Runes in module scope would require a class wrapper, which is not the established pattern.

---

## Config Structure (`gir-config.json`)

```jsonc
{
  "defaults": {
    "weightKg": 3.1,
    "dextrosePct": 10,
    "mlPerKgPerDay": 80
  },
  "inputs": {
    "weightKg":      { "min": 0.3,  "max": 10,  "step": 0.1 },
    "dextrosePct":   { "min": 2.5,  "max": 25,  "step": 0.5 },
    "mlPerKgPerDay": { "min": 40,   "max": 200, "step": 5   }
  },
  "glucoseBuckets": [
    { "id": "severe-neuro", "label": "Severe neuro sx", "srLabel": "severe neurological symptoms", "targetGirDelta": 1.5 },
    { "id": "lt40",         "label": "<40",             "srLabel": "less than 40",                  "targetGirDelta": 1.0 },
    { "id": "40-50",        "label": "40–50",           "srLabel": "40 to 50",                      "targetGirDelta": 0.5 },
    { "id": "50-60",        "label": "50–60",           "srLabel": "50 to 60",                      "targetGirDelta": -0.5 },
    { "id": "60-70",        "label": "60–70",           "srLabel": "60 to 70",                      "targetGirDelta": -1.0 },
    { "id": "gt70",         "label": ">70",             "srLabel": "greater than 70",               "targetGirDelta": -1.5 }
  ]
}
```

**Decision: data-driven buckets.** Rationale:
1. Consistency with v1.6 — clinical ranges moved out of magic numbers into config.
2. Clinician-editable — stated v1.3 principle.
3. Spreadsheet parity — JSON is a 1:1 mirror of the CALC tab.
4. Minor cost: `gir-config.test.ts` guards shape (matches `fortification-config.test.ts`).

---

## Calc Module Signature (`gir/calculations.ts`)

**Export three narrow pure functions + one aggregator.**

```ts
export function calculateCurrentGir(weightKg: number, dextrosePct: number, mlPerKgPerDay: number): number;
export function calculateInitialRateMlHr(weightKg: number, mlPerKgPerDay: number): number;
export function calculateTitrationRows(
  weightKg: number,
  dextrosePct: number,
  mlPerKgPerDay: number,
  buckets: GlucoseBucket[]
): GirTitrationRow[];

// Aggregator the component consumes via $derived
export function calculateGir(state: GirStateData, buckets: GlucoseBucket[]): GirResult | null;
```

**Rationale:**
- Morphine / Fortification both expose narrow mode functions — one per spreadsheet formula column.
- Spreadsheet parity tests want per-column assertions — narrow functions keep tests targeted.
- Aggregator returns `null` if any input is `null` — single source for the component's `$derived`, keeps `GirCalculator.svelte` clean.

**Constants:** use exact `10/60` and `1/144` (not spreadsheet's `0.167` / `0.0069`). Parity tests use ~1% epsilon, documented.

---

## Interactive Titration Row Highlighting — Svelte 5 pattern

**Pattern: `$state` bucket id + CSS identity-token class toggle + `role="radiogroup"` semantics.**

Key points:
1. **`role="radiogroup"`, not `tablist`** — tabs imply switching panels; the grid is single-selection driving one advisory surface. `aria-checked` on each row.
2. **Roving tabindex**: exactly one focusable row (selected, or first if none). Copy from `SegmentedToggle.svelte`.
3. **Identity-token highlight** — selected row uses `--color-identity-hero`, not just opacity (color-blind AA, v1.5 rule).
4. **Arrow keys move selection + focus** (WAI-ARIA radiogroup pattern). `Home`/`End` jump. `Space`/`Enter` affirm (single-select, no toggle-off).
5. **Selected advisory panel**: `aria-live="polite"` + `aria-atomic="true"` + `{#key selectedId}` to re-trigger `.animate-result-pulse` (v1.6 shared class).
6. **No shared component extraction** — calculator-specific for now, lives in `src/lib/gir/`. Extract to shared if v1.9 needs similar.

---

## Suggested Phase Split (3 phases)

### Phase A — Foundation: calc + config + state (headless)
Goal: Spreadsheet parity locked before any pixels.
- `types.ts`, `gir-config.json`, `gir-config.ts`, `gir-config.test.ts`
- `calculations.ts` + `calculations.test.ts` (per-column parity vs xlsx, ~1% epsilon)
- `state.svelte.ts`
- Gate: Vitest green, parity covers 6 buckets × all columns, zero UI coupling.

### Phase B — UI + identity + registration
Goal: GIR usable end-to-end from nav shell.
- `GlucoseTitrationGrid.svelte` (radiogroup, keyboard nav)
- `GirCalculator.svelte` (inputs + hero + grid, `$derived` aggregator)
- `src/routes/gir/+page.svelte`
- `shell/registry.ts` entry + `identityClass` union
- `app.css` `.identity-gir` light + dark (provisional OKLCH)
- Gate: manual flow works both themes on mobile + desktop, component test green.

### Phase C — A11y + E2E + version bump
Goal: Clinical-grade ship.
- Playwright `gir.spec.ts` + `gir-a11y.spec.ts` (light + dark + focus + advisory variants)
- Tune identity OKLCH to clear axe (v1.5 Morphine precedent)
- `package.json` → 1.8.0, PROJECT.md validated list update
- Gate: all axe sweeps green, parity suite green, manual regression of existing calcs.

**Coupling:**
- Phase A has zero component/route dependencies — fully testable headlessly.
- Phase B consumes Phase A exports; provisional identity values OK.
- Phase C is verification + tuning; no new production code except possibly literal OKLCH values.

---

## Shared Component Reuse / New Props

All existing shared components fit **with zero modifications**:

| Component | GIR usage | Fits as-is? |
|---|---|---|
| `NumericInput` | Weight, Dextrose %, ml/kg/day | **Yes** — v1.6 `showRangeHint` + v1.7 `showRangeError` sufficient. Advisory-only (no clamp) is v1.6 contract. |
| `SegmentedToggle` | **Not used** for buckets | Tablist semantics + 2–3 options is wrong fit for a 6-row clinical grid with per-row data. Use dedicated radiogroup grid. |
| `SelectPicker` | Not needed | GIR has no enum selection beyond buckets. |
| `ResultsDisplay` | Current GIR + initial rate hero | **Yes** — review API during Phase B; if two-value hero doesn't fit, inline a hero div using `--color-identity-hero`. |
| `.animate-result-pulse` | Hero + selected bucket advisory | **Yes**, already in `src/app.css` (v1.6). |
| `identityClass` pattern | New `'identity-gir'` literal | Additive union extension, not a new prop. |

**Only net-new extension in the whole milestone**: the registry's `identityClass` union gains one literal.

---

## Sources
- `.planning/PROJECT.md` (v1.5 identity, v1.6 NumericInput, v1.7 showRangeError)
- `src/lib/shell/registry.ts`
- `src/lib/morphine/state.svelte.ts`, `calculations.ts`, `morphine-config.json`, `types.ts`
- `src/lib/fortification/fortification-config.ts`
- `src/routes/morphine-wean/+page.svelte`
- `src/lib/shared/components/NumericInput.svelte`
- `src/lib/shared/components/SegmentedToggle.svelte`
- `src/app.css` lines 188–207
