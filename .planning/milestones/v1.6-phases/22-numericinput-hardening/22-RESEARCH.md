# Phase 22: NumericInput Hardening — Research

**Researched:** 2026-04-07
**Domain:** Svelte 5 shared form component — advisory validation UX
**Confidence:** HIGH (everything is in-repo; no external library work)

## Summary

Phase 22 is NOT "add min/max to NumericInput." Those props, the wheel-increment clamping, the `rangeError` derivation, the red-border wiring, and the inline error paragraph already exist in `src/lib/shared/components/NumericInput.svelte` (lines 19–150). The real work is three behavioral/surface changes plus a config migration:

1. **Add a range hint** rendered under the input whenever `min` and/or `max` are supplied AND no error is active.
2. **Change the range-error behavior**: (a) rewrite the message to the exact literal `"Outside expected range — verify"`; (b) gate it on a new `hasBlurred` state so it only surfaces after first blur; (c) keep the existing auto-clear when value returns to range (HARD-04 is already handled by `$derived` reactivity).
3. **Move all inline clinical min/max/step literals** out of `MorphineWeanCalculator.svelte` and `FortificationCalculator.svelte` into their respective JSON config files, sourced via the existing config import pattern.

There are no new dependencies, no new files beyond possibly extending `types.ts`, and the existing shared component is the only consumer surface. Risk is concentrated in two existing tests and one ARIA semantics decision.

**Primary recommendation:** Single-commit plan with a single wave. Edit `NumericInput.svelte` (+ its test file), extend both config JSONs, extend both module `types.ts`, update two calculator call-site sections, done.

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for Phase 22. All direction comes from REQUIREMENTS.md HARD-01..06, ROADMAP.md Phase 22 block, and the reframing in the spawn prompt (which should be treated as pre-confirmed user intent for planning purposes).

### Effective locked decisions (from requirements + prompt)

- NumericInput stays the single shared component — no sibling variant.
- No auto-clamp, ever. The user's typed value is sacred. `[VERIFIED: REQUIREMENTS.md line 20, "value is NOT auto-clamped"]`
- Message copy is exact: `"Outside expected range — verify"`. `[VERIFIED: REQUIREMENTS.md line 20]`
- Hint + error use the existing `text-xs` typography family already in the component (line 145). `[VERIFIED: REQUIREMENTS.md line 19, "using existing text-tertiary typography"]`
- Clinical ranges live in existing JSON config files, not new files. `[VERIFIED: REQUIREMENTS.md line 22]`
- WCAG 2.1 AA for hint and error copy is a Phase 24 gate, but must already hold in Phase 22. `[VERIFIED: REQUIREMENTS.md line 34, A11Y-02]`

### Claude's Discretion

- Exact hint string format (`0.1–200 kg` vs `Range: 0.1–200` vs other) — resolved below.
- `aria-invalid` semantics while value is out-of-range but not yet blurred — resolved below.
- TS interface location and name for the input range block — resolved below.
- JSON shape for the new `inputs` section — resolved below.

### Deferred / OUT OF SCOPE

- Result feedback `aria-live` and entrance motion (Phase 23, FEED-01..03).
- axe-core sweep of new states (Phase 24, A11Y-01..02).
- Any change to auto-clamp behavior — explicitly rejected by REQUIREMENTS.md line 48.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HARD-01 | NumericInput accepts optional `min`/`max` | **Already done.** Lines 19–20, 29–30 of NumericInput.svelte. No-op. |
| HARD-02 | Render range hint under field when min/max supplied | New `rangeHint` derived + new `<p>` markup block below the input. Details §"NumericInput.svelte edits." |
| HARD-03 | Blur-gated advisory "Outside expected range — verify" | New `hasBlurred` state + rewritten `rangeError` derived + literal copy change. §"NumericInput.svelte edits." |
| HARD-04 | Message clears on return to range without another blur | Already handled by `$derived` reactivity once `value` passes the guard — no extra work. |
| HARD-05 | All Morphine + Formula NumericInputs source ranges from JSON config | Extend `morphine-config.json` + `fortification-config.json` with new `inputs` section; thread through `state.svelte.ts` or import directly in the Svelte components. §"Config schema." |
| HARD-06 | Tests: hint render, blur outside shows msg, return-to-range clears, no auto-clamp | Extend `NumericInput.test.ts`. §"Test plan." |

## Project Constraints (from CLAUDE.md)

- Must match inherited stack: Svelte 5 runes, Tailwind 4, Vitest.
- Co-locate tests with source (MEMORY.md): `NumericInput.test.ts` lives next to `NumericInput.svelte`. ✓ already true.
- WCAG 2.1 AA, 48px touch targets (unchanged — input already complies).
- `text-tertiary` / `text-secondary` tokens already exist in `app.css`; do not hand-roll color literals.
- No additional UI component libraries. Everything stays in `$lib`.
- GSD workflow — edits must be planned through `/gsd-plan-phase`.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `morphineState` and `fortificationState` sessionStorage payloads are value-only, no range metadata is persisted. Verified by reading `morphine/state.svelte.ts` import line and `fortification/state.svelte.ts` usage in `FortificationCalculator.svelte`. | None. |
| Live service config | None — no external services. PWA only. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | None — Vite HMR picks up JSON config edits automatically; no compiled artifact caches the old shape. | None. |

**Nothing found in any category — this is a code + JSON edit, no runtime migration.**

## Standard Stack

All inherited — nothing to install.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | ^5.55.0 | Runes (`$state`, `$derived`, `$props`, `$bindable`) | Already the component model in NumericInput.svelte |
| Vitest | ^4.1.2 | Unit/component test runner | Existing `NumericInput.test.ts` uses it |
| @testing-library/svelte | (dev dep) | DOM queries + fireEvent | Existing test file uses `render`, `screen`, `fireEvent` |

**No installs. No version bumps.** `[VERIFIED: package.json via inherited stack doc in CLAUDE.md]`

## Architecture Patterns

### Project structure impact (additive only)

```
src/lib/
├── shared/components/
│   ├── NumericInput.svelte       # EDIT — add hasBlurred, rangeHint, rewrite rangeError, add hint markup
│   └── NumericInput.test.ts      # EDIT — update 2 existing tests, add ~6 new tests
├── morphine/
│   ├── morphine-config.json      # EDIT — add "inputs" block
│   ├── types.ts                  # EDIT — export NumericInputRange interface
│   └── MorphineWeanCalculator.svelte  # EDIT — import config.inputs, replace literal min/max/step
└── fortification/
    ├── fortification-config.json # EDIT — add "inputs" block
    ├── fortification-config.ts   # EDIT — export getInputRanges() helper (optional — see below)
    ├── types.ts                  # EDIT — export NumericInputRange interface
    └── FortificationCalculator.svelte # EDIT — import inputs, replace literal min/max/step
```

### Pattern: "Blur-gated advisory, reactive clear"

**What:** Track whether the user has ever blurred the field. Suppress the range error until that flag trips. After it trips, the `$derived` naturally clears and re-asserts the error as the value moves in and out of range.

**Why this pattern fits:** Svelte 5 `$derived` already re-evaluates on any reactive read. The only reason the current code shows the error on keystroke is that it has no "has the user committed yet?" gate. Adding one boolean satisfies HARD-03 and HARD-04 simultaneously with zero extra reactivity.

**Code shape:**
```svelte
let hasBlurred = $state(false);

let rangeError = $derived.by(() => {
  if (error) return '';
  if (value === null) return '';
  if (!hasBlurred) return '';         // NEW — suppress until first blur
  if (min !== undefined && value < min) return 'Outside expected range — verify';
  if (max !== undefined && value > max) return 'Outside expected range — verify';
  return '';
});

let rangeHint = $derived.by(() => {
  if (displayError) return '';        // hint hides when error shows
  const hasMin = min !== undefined && min !== null;
  const hasMax = max !== undefined && max !== null;
  if (!hasMin && !hasMax) return '';
  // see "Range hint formatting" decision below
  if (hasMin && hasMax) return `${formatBound(min)}–${formatBound(max)}${suffix ? ' ' + suffix : ''}`;
  if (hasMin) return `≥ ${formatBound(min)}${suffix ? ' ' + suffix : ''}`;
  return `≤ ${formatBound(max)}${suffix ? ' ' + suffix : ''}`;
});

function handleBlur(_e: FocusEvent) {
  isFocused = false;
  hasBlurred = true;   // NEW
}
```

`formatBound` can just be the identity (numbers are already well-formed) OR strip trailing zeros. Recommend identity for simplicity unless the 0.001 max-dose case renders unpleasantly.

### Anti-patterns to avoid

- **Do not** set `hasBlurred = true` inside `handleInput`. That would show the error on the first keystroke after mount in the edge case where a parent loads a persisted out-of-range value into the field without ever blurring. The correct behavior per HARD-03 is "blur is the commit signal" — keystrokes never trip it.
- **Do not** reset `hasBlurred` on every render. It must be `let hasBlurred = $state(false)` at the top level of `<script>` so it initializes once per component instance.
- **Do not** pass the literal `0` as a default for `min` (current code does: `min = 0`). A default of `0` means "a hint will always render even when the consumer didn't opt in." Change both defaults to `undefined` and make the props truly optional (`min?: number`). The wheel-increment code at line 86-90 must then fall back when undefined (see Pitfalls §1).
- **Do not** add an `onchange` or `$effect`-based blur-flag toggle. A plain boolean set inside `handleBlur` is correct and re-renders via the derived graph on its own.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced validation | Custom setTimeout wrapper | Let `$derived` re-evaluate synchronously | With `hasBlurred` gating, there's no visual flicker — no debounce needed. |
| A separate RangeHint component | `<RangeHint min max suffix />` | Inline `<p>` in NumericInput | Single-use, 3 lines of markup, factoring it out is pure overhead. |
| Zod/Yup schema for clinical ranges | Runtime validator | JSON config + TS interface | Ranges are static; structural typing + TS compile-time check covers everything. |
| A "validation state" enum | `'idle' \| 'dirty' \| 'error'` | Single `hasBlurred` boolean | We have exactly two states. Overengineering. |

**Key insight:** Every piece of machinery this phase needs already exists in the component. The phase is a surface tweak + config migration, not a feature build.

## Resolved Open Questions

### RESOLVED: Range hint format — recommend `0.1–200 kg` (suffix inline)

**Recommendation:** `0.1–200 kg` (en dash `–`, trailing suffix).

**Rationale:**
- The field's suffix overlay (line 132-139) is **absolutely positioned inside the input** and serves a different purpose: showing the unit of the entered value. When the field is empty, the suffix is still visible, so "duplicating" it in the hint is fine — they're in different visual registers (one inside the input box, one below it).
- `Range: 0.1–200` requires the user to re-associate the unit from memory. Clinical UI principle #1 from CLAUDE.md Design Context: "The result is the interface. Zero doubt about what the result means." A range without units violates that.
- The en dash `–` (not hyphen `-`) is the typographic convention for numeric ranges. The codebase already uses it elsewhere (ROADMAP.md line 267 shows "0.5-10" with a hyphen, but that's plain text; in rendered UI we should go with the en dash). Plus Jakarta Sans renders en dash cleanly.
- Suffixes longer than 3 characters (e.g. `mg/kg/dose`) will make the hint wide. That's acceptable; the hint wraps naturally and is below the input, so it doesn't fight the suffix overlay.

**Format function:**
```ts
// inside NumericInput.svelte
function formatRangeHint(min: number | undefined, max: number | undefined, suffix: string): string {
  const unit = suffix ? ` ${suffix}` : '';
  if (min !== undefined && max !== undefined) return `${min}–${max}${unit}`;
  if (min !== undefined) return `≥ ${min}${unit}`;
  if (max !== undefined) return `≤ ${max}${unit}`;
  return '';
}
```

### RESOLVED: Hint color token — use `text-tertiary`, confirmed AA

**Recommendation:** `text-[var(--color-text-tertiary)]`, matching the existing empty-state copy on line 239 of MorphineWeanCalculator.svelte and line 205 of FortificationCalculator.svelte.

**Contrast verification (from `src/app.css`):**
- Light mode: `--color-text-tertiary: oklch(50% 0.008 225)` on card surface → confirmed ≥ 4.5:1 by existing v1.4 audit.
- Dark mode: `--color-text-tertiary: oklch(62% 0.008 228)` — the comment at line 96 explicitly states "WCAG fix: was 55%, now 4.5:1+ on surface". `[VERIFIED: src/app.css line 96 inline comment — v1.4 audit tuned this token for AA.]`

Both modes pass. Use tertiary. Phase 24 axe sweep will re-confirm.

### RESOLVED: `aria-invalid` semantics with `hasBlurred` gate

**Current:** `aria-invalid={!!displayError}` (line 127). With the gate, a value can be out-of-range but `aria-invalid="false"` until blur.

**Recommendation:** Keep the existing binding as-is: `aria-invalid={!!displayError}`. Because `rangeError` is now gated on `hasBlurred`, `displayError` will also be empty before blur, so `aria-invalid` will be `"false"` pre-blur and `"true"` post-blur. This is the **correct** WAI-ARIA semantic: `aria-invalid="true"` means "this field has been validated and failed." A field that has never been committed has not been validated, so `"false"` is semantically accurate. `[CITED: WAI-ARIA 1.2 §aria-invalid — "Indicates the entered value does not conform… after validation"]`

Do not add `aria-invalid="true"` at mount time for persisted out-of-range values; that would create a false alarm on first paint. The blur gate is the right commit signal.

### RESOLVED: Config schema — new top-level `inputs` key

**Morphine (`src/lib/morphine/morphine-config.json`):** add a new top-level `inputs` key alongside the existing `defaults`, `stepCount`, `modes` keys. Do NOT nest under `defaults` — `defaults` holds the initial values the user sees on first load, and keeping ranges in a sibling is cleaner separation of concerns.

```json
{
  "defaults": {
    "weightKg": 3.1,
    "maxDoseMgKgDose": 0.04,
    "decreasePct": 10
  },
  "inputs": {
    "weightKg":        { "min": 0.1,   "max": 200, "step": 0.1   },
    "maxDoseMgKgDose": { "min": 0.001, "max": 1,   "step": 0.001 },
    "decreasePct":     { "min": 1,     "max": 50,  "step": 1     }
  },
  "stepCount": 10,
  "modes": { "linear": {...}, "compounding": {...} }
}
```

Values copied verbatim from `MorphineWeanCalculator.svelte` lines 157-179 (no clinical change — this is a pure lift).

**Fortification (`src/lib/fortification/fortification-config.json`):** the current file is a flat `{ formulas: [...] }`. Extend it to `{ formulas: [...], inputs: {...} }`:

```json
{
  "formulas": [ ... unchanged ... ],
  "inputs": {
    "volumeMl": { "min": 1, "max": 1000, "step": 1 }
  }
}
```

Only one NumericInput exists in FortificationCalculator.svelte (line 156-165, `volumeMl`). The other fields are SelectPickers, so no other range entries are needed.

### RESOLVED: TypeScript interface shape and location

**Shared type in `src/lib/shared/types.ts`** (already exists per the `SelectOption` import at FortificationCalculator.svelte line 12). Add:

```ts
export interface NumericInputRange {
  min: number;
  max: number;
  step: number;
}
```

Then, per-module config types in `src/lib/morphine/types.ts`:

```ts
import type { NumericInputRange } from '$lib/shared/types.js';

export interface MorphineInputRanges {
  weightKg: NumericInputRange;
  maxDoseMgKgDose: NumericInputRange;
  decreasePct: NumericInputRange;
}
```

And in `src/lib/fortification/types.ts`:

```ts
import type { NumericInputRange } from '$lib/shared/types.js';

export interface FortificationInputRanges {
  volumeMl: NumericInputRange;
}
```

**Config loader access pattern:** The morphine side already imports the JSON directly (`import config from './morphine-config.json'` in `state.svelte.ts` and `calculations.ts`). The fortification side has a dedicated wrapper (`fortification-config.ts`) that re-exports helpers. Match each side's existing convention:

- **Morphine**: import the JSON directly at the top of `MorphineWeanCalculator.svelte` and destructure `const { inputs } = config`. Consistent with existing practice in that module.
- **Fortification**: add an exported const `inputs` (or a `getInputRanges()` function) in `fortification-config.ts`, then import it alongside `getFormulaById` / `getFortificationFormulas` in `FortificationCalculator.svelte`. Consistent with the existing wrapper pattern.

## NumericInput.svelte — Exact Edit Diff

Referencing current line numbers from the read above (1-based, matching the file as it exists today).

### Edit 1 — Props (lines 13-33)

Change `min = 0` and `max = 1000` defaults to `undefined` so the hint only renders when the consumer opts in, AND the optional prop types become `min?: number` / `max?: number`.

```ts
let {
  value = $bindable(),
  label = '',
  placeholder = '',
  suffix = '',
  error = '',
  min,                    // CHANGED: no default
  max,                    // CHANGED: no default
  step = 0.1,
  id = `numeric-input-${++idCounter}`
} = $props<{
  value: number | null;
  label?: string;
  placeholder?: string;
  suffix?: string;
  error?: string;
  min?: number;           // CHANGED: truly optional
  max?: number;           // CHANGED: truly optional
  step?: number;
  id?: string;
}>();
```

### Edit 2 — New `hasBlurred` state (after line 35, `isFocused`)

```ts
let isFocused = $state(false);
let hasBlurred = $state(false);   // NEW
```

### Edit 3 — Rewrite `rangeError` (lines 37-44)

```ts
let rangeError = $derived.by(() => {
  if (error) return '';
  if (value === null) return '';
  if (!hasBlurred) return '';
  const belowMin = min !== undefined && value < min;
  const aboveMax = max !== undefined && value > max;
  if (belowMin || aboveMax) return 'Outside expected range — verify';
  return '';
});
```

### Edit 4 — New `rangeHint` derived (after line 46, `displayError`)

```ts
let displayError = $derived(error || rangeError);

let rangeHint = $derived.by(() => {
  if (displayError) return '';
  if (min === undefined && max === undefined) return '';
  const unit = suffix ? ` ${suffix}` : '';
  if (min !== undefined && max !== undefined) return `${min}–${max}${unit}`;
  if (min !== undefined) return `≥ ${min}${unit}`;
  return `≤ ${max}${unit}`;
});
```

### Edit 5 — Flip `hasBlurred` in `handleBlur` (line 72-74)

```ts
function handleBlur(_e: FocusEvent) {
  isFocused = false;
  hasBlurred = true;   // NEW
}
```

### Edit 6 — Fix wheel-increment guards (line 86-91)

The existing wheel handler assumes `min`/`max` are numbers. With optional props, guard both branches:

```ts
const direction = e.deltaY > 0 ? -1 : 1;
const lowerBound = min ?? Number.NEGATIVE_INFINITY;
const upperBound = max ?? Number.POSITIVE_INFINITY;
const current = value ?? (direction > 0 ? lowerBound - step : upperBound + step);
const next = parseFloat((current + direction * step).toFixed(1));
if (next >= lowerBound && next <= upperBound) {
  value = next;
}
```

Note: if both `min` and `max` are undefined AND value is null, `current` becomes `-Infinity + step` or `+Infinity + step`, which is still ±Infinity, and `next` is NaN. Guard with `if (!Number.isFinite(next)) return;` before the bounds check. This preserves existing behavior when ranges ARE supplied (the overwhelmingly common case) and degrades gracefully when they aren't.

### Edit 7 — Input element `min`/`max` attributes (lines 123-124)

HTML `min`/`max` attributes must be omitted (not set to `undefined`) when the prop is absent. Svelte handles `{undefined}` correctly for spread attributes but inline attribute binding may render `min=""`. Use conditional spreading:

```svelte
<input
  {id}
  use:setupWheel
  type="number"
  inputmode="decimal"
  value={value === null ? '' : value}
  oninput={handleInput}
  onfocus={() => (isFocused = true)}
  onblur={handleBlur}
  onkeydown={handleKeydown}
  {placeholder}
  min={min ?? undefined}
  max={max ?? undefined}
  {step}
  ...
/>
```

Svelte 5 treats `undefined` attribute values as "omit the attribute," so `min={min ?? undefined}` is safe.

### Edit 8 — Range hint markup (after the closing `</div>` of `.relative.group`, before the error `{#if}`)

```svelte
  </div>

  {#if rangeHint}
    <p class="text-xs text-[var(--color-text-tertiary)] ml-1">
      {rangeHint}
    </p>
  {/if}

  {#if displayError}
    <p
      id="{id}-error"
      class="text-xs text-[var(--color-error)] ml-1"
      transition:slide={{ duration: PREFERS_REDUCED_MOTION ? 0 : 150 }}
    >
      {displayError}
    </p>
  {/if}
</div>
```

The hint and the error are mutually exclusive (`rangeHint` returns empty string when `displayError` is set), so only one paragraph ever renders. This satisfies the spawn prompt's "suppressed when displayError is showing" requirement without needing `{:else}`.

**Note:** The hint does not need the `slide` transition. It's either present from the start or not present at all for a given field. The error paragraph keeps its existing slide (unchanged).

## Consumer Refactor — Before/After

### Morphine, `weightKg` input (lines 153-162)

**Before:**
```svelte
<NumericInput
  bind:value={morphineState.current.weightKg}
  label="Dosing weight"
  suffix="kg"
  min={0.1}
  max={200}
  step={0.1}
  placeholder="3.1"
  id="morphine-weight"
/>
```

**After** — add at top of script:
```ts
import config from '$lib/morphine/morphine-config.json';
const { inputs } = config;
```

Then the markup:
```svelte
<NumericInput
  bind:value={morphineState.current.weightKg}
  label="Dosing weight"
  suffix="kg"
  min={inputs.weightKg.min}
  max={inputs.weightKg.max}
  step={inputs.weightKg.step}
  placeholder="3.1"
  id="morphine-weight"
/>
```

Apply the same shape to `maxDoseMgKgDose` and `decreasePct`.

### Fortification, `volumeMl` input (lines 156-165)

**Before:**
```svelte
<NumericInput
  bind:value={fortificationState.current.volumeMl}
  label="Starting Volume (mL)"
  suffix="mL"
  min={1}
  max={1000}
  step={1}
  placeholder="180"
  id="fortification-volume"
/>
```

**After** — in `fortification-config.ts`, add:
```ts
import type { FortificationInputRanges } from './types.js';
export const inputs: FortificationInputRanges = config.inputs;
```

And in the Svelte file, extend the existing import:
```ts
import {
  getFormulaById,
  getFortificationFormulas,
  inputs,
} from '$lib/fortification/fortification-config.js';
```

Then:
```svelte
<NumericInput
  bind:value={fortificationState.current.volumeMl}
  label="Starting Volume (mL)"
  suffix="mL"
  min={inputs.volumeMl.min}
  max={inputs.volumeMl.max}
  step={inputs.volumeMl.step}
  placeholder="180"
  id="fortification-volume"
/>
```

## Test Plan (NumericInput.test.ts)

### Existing tests to UPDATE (copy change)

**T-01 (update, line 38-47):** `shows inline error when value exceeds max` — currently asserts `'Maximum is 100'` on initial render. Must change to:
1. Also pass a blur event (`await fireEvent.blur(input)`) because the gate now requires blur.
2. Assert on `'Outside expected range — verify'` instead of `'Maximum is 100'`.

**T-02 (update, line 49-58):** `shows inline error when value is below min` — same two changes.

### NEW tests to ADD

Mirror the existing style: `render(NumericInput, { props: {...} })`, use `screen.getByLabelText`, `fireEvent.blur`, `fireEvent.input`.

**T-03:** `renders range hint when both min and max supplied`
- Props: `{ value: null, label: 'Weight', min: 0.1, max: 200, suffix: 'kg' }`
- Assert: `screen.getByText('0.1–200 kg')` exists.
- Assert: no error paragraph, `aria-invalid === 'false'`.

**T-04:** `renders range hint with suffix when only max supplied`
- Props: `{ value: null, label: 'Volume', max: 1000, suffix: 'mL' }`
- Assert: `screen.getByText('≤ 1000 mL')` exists.

**T-05:** `renders range hint without suffix when suffix is empty`
- Props: `{ value: null, label: 'Count', min: 1, max: 10 }`
- Assert: `screen.getByText('1–10')` exists.

**T-06:** `does not render range hint when min and max are both undefined`
- Props: `{ value: 5, label: 'Weight' }`
- Assert: query for any element with `text-[var(--color-text-tertiary)]` that matches range-hint pattern → none. Simpler: assert the component's rendered DOM text does not contain `'–'` or `'≥'` or `'≤'`.

**T-07:** `hides range hint when external error is active`
- Props: `{ value: 5, label: 'Weight', min: 0.1, max: 200, suffix: 'kg', error: 'Required' }`
- Assert: `screen.queryByText('0.1–200 kg')` is null.
- Assert: `screen.getByText('Required')` exists.

**T-08:** `does not show range error before first blur, even when value is out of range`
- Props: `{ value: 500, label: 'Weight', min: 0.1, max: 200 }`
- Assert immediately after render: `screen.queryByText('Outside expected range — verify')` is null.
- Assert: `aria-invalid === 'false'`.
- Assert: range hint IS still visible (`screen.getByText('0.1–200')`).

**T-09:** `shows "Outside expected range — verify" after blur when value exceeds max`
- Props: `{ value: 500, label: 'Weight', min: 0.1, max: 200 }`
- `await fireEvent.blur(input)`
- Assert: `screen.getByText('Outside expected range — verify')` exists.
- Assert: `aria-invalid === 'true'`.
- Assert: range hint is now hidden (`screen.queryByText('0.1–200')` is null).

**T-10:** `shows "Outside expected range — verify" after blur when value is below min`
- Props: `{ value: -5, label: 'Weight', min: 0.1, max: 200 }`
- Blur, then assert the literal copy.

**T-11:** `clears range error when value returns to range on next input, without requiring another blur`
- Start: `{ value: 500, label: 'Weight', min: 0.1, max: 200 }`, then blur → error visible.
- `await fireEvent.input(input, { target: { value: '50' } })`.
- Assert: `screen.queryByText('Outside expected range — verify')` is null.
- Assert: `aria-invalid === 'false'`.
- Assert: range hint reappears.

**T-12:** `no auto-clamp — value stays exactly as user entered, even out of range`
- Props: `{ value: 9999, label: 'Weight', min: 0.1, max: 200 }`
- Blur.
- Assert: `input.value === '9999'` (not `'200'`).

**T-13:** `does not flip hasBlurred on keystroke — typing an invalid value then away still requires blur`
- Start: `{ value: null, label: 'Weight', min: 0.1, max: 200 }`.
- `await fireEvent.input(input, { target: { value: '9999' } })`.
- Assert: no error yet (`queryByText('Outside expected range — verify')` null).
- Then blur.
- Assert: error appears.

All thirteen assertions are deterministic and run in-process under Vitest with `@testing-library/svelte`. No browser, no Playwright.

## Common Pitfalls

### Pitfall 1: Wheel-increment breaks when ranges move to optional

**What goes wrong:** The wheel handler at line 86-90 uses `min - step` and `max + step` as initial values when `value` is null. If `min`/`max` are now undefined, these become `NaN`, and the `next >= min && next <= max` comparison fails silently — scrolling an empty input does nothing.

**How to avoid:** Use `Number.NEGATIVE_INFINITY` / `Number.POSITIVE_INFINITY` fallbacks AND guard the final `next` with `Number.isFinite`. Covered in Edit 6 above.

**Warning sign:** Manual QA: focus the weight field when empty, scroll wheel — should increment to `0.1` (min). If it does nothing, the wheel fallback is broken.

### Pitfall 2: Existing tests break from message-copy change

**What goes wrong:** `NumericInput.test.ts` lines 46 and 57 assert on `'Maximum is 100'` / `'Minimum is 0'`. When Edit 3 ships, these assertions fail.

**How to avoid:** T-01 and T-02 in the test plan above explicitly update these. Also, `src/lib/shared/__tests__/shared-components.test.ts` was grep-checked — it only asserts `aria-invalid` for the `error` prop (not the range error), so it is NOT impacted. `[VERIFIED: grep of 'Minimum is|Maximum is' limited to NumericInput.test.ts only]`

**Warning sign:** `pnpm test` fails with "expected 'Maximum is 100' to exist" immediately after Edit 3.

### Pitfall 3: `hasBlurred` resets on prop change

**What goes wrong:** If `hasBlurred` were declared as plain `let hasBlurred = false` (not `$state`), Svelte 5 would still track it, but any reactive re-run of the script block would reset it. The correct pattern is `let hasBlurred = $state(false)` — runes-backed state persists across re-renders.

**How to avoid:** Always use `$state(false)`. Enforced by Edit 2 above.

**Warning sign:** Test T-11 fails (after typing back to range, the error is cleared but then reappears on next prop update — implies `hasBlurred` got reset).

### Pitfall 4: JSON import type widening

**What goes wrong:** TypeScript infers `morphine-config.json` as a wide type (e.g., `{ inputs: { weightKg: { min: number, max: number, step: number }, ... } }`). That's fine at the call site, but if `FortificationInputRanges` is declared narrowly and the JSON has an extra key, assignment narrows OK but missing keys produce a compile error only if `resolveJsonModule` + `strict` are on. Both should be on (verified via inherited stack).

**How to avoid:** Export a typed const from the loader: `export const inputs: MorphineInputRanges = config.inputs;`. Compile error surfaces any drift.

**Warning sign:** `tsc --noEmit` fails after config edit — check the interface matches the JSON keys exactly.

### Pitfall 5: `min={undefined}` rendering as `min=""` on the `<input>`

**What goes wrong:** Some frameworks render `attribute={undefined}` as `attribute=""`, which for `<input type="number">` means "min is empty string" — browser ignores it, so no real bug, but it pollutes the DOM.

**How to avoid:** Svelte 5 specifically omits `undefined` attributes. Verified in the Svelte 5 docs: attributes bound to `undefined` are not rendered. `[CITED: svelte.dev/docs/svelte/basic-markup — "An attribute with a value of undefined or null is not rendered"]` Use `min={min ?? undefined}` in Edit 7.

**Warning sign:** Inspecting the DOM shows `<input min="" max="">` — means the omission failed and you need an explicit conditional.

### Pitfall 6: Dark mode contrast regression on hint

Already mitigated. Both `--color-text-tertiary` values in app.css were explicitly tuned in v1.4 for 4.5:1 on card surfaces (comments at lines 95-96). No action needed, but Phase 24 axe will re-verify.

## Code Examples

### Svelte 5 `$state` + `$derived` gate pattern

```svelte
<script lang="ts">
  // Commit-gated validation: suppress error until user signals completion.
  let value = $state<number | null>(null);
  let hasBlurred = $state(false);

  let error = $derived.by(() => {
    if (!hasBlurred) return '';          // gate
    if (value !== null && value > 200) return 'Outside expected range — verify';
    return '';
  });
</script>

<input
  type="number"
  bind:value
  onblur={() => (hasBlurred = true)}
/>
{#if error}<p>{error}</p>{/if}
```
Source: adapted from NumericInput.svelte current structure. `[VERIFIED: in-repo pattern, no external library]`

### JSON config import (morphine side)

```ts
// src/lib/morphine/calculations.ts — already exists
import config from './morphine-config.json';
const stepCount = config.stepCount;
```
Phase 22 adds the same pattern inside `MorphineWeanCalculator.svelte`:
```ts
import config from '$lib/morphine/morphine-config.json';
const { inputs } = config;
```
`[VERIFIED: src/lib/morphine/calculations.ts line 2 — existing import pattern]`

## Environment Availability

Not applicable — pure code/config change. No external tools, services, runtimes, or CLI utilities beyond the already-running Vite dev server and Vitest. Skip.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 + @testing-library/svelte |
| Config file | `vite.config.ts` (vitest inline config) |
| Quick run command | `pnpm test -- NumericInput` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HARD-01 | Props accepted | unit | (covered by any test that passes min/max) | ✅ |
| HARD-02 | Hint renders under field | component | `pnpm test -- NumericInput` (T-03..T-07) | ✅ (extend) |
| HARD-03 | Blur-gated advisory with exact copy | component | `pnpm test -- NumericInput` (T-01,T-02,T-08..T-10,T-13) | ✅ (extend) |
| HARD-04 | Clears on return to range | component | `pnpm test -- NumericInput` (T-11) | ✅ (extend) |
| HARD-05 | Config-sourced ranges in consumers | integration | `pnpm test -- MorphineWeanCalculator` + existing morphine/fortification test suites pass unchanged | ✅ |
| HARD-06 | Test coverage for all above | component | `pnpm test` full suite green | ✅ (extend) |

### Sampling Rate
- **Per task commit:** `pnpm test -- NumericInput` (subsecond)
- **Per wave merge:** `pnpm test` (full Vitest suite)
- **Phase gate:** Full suite green + `pnpm run build` succeeds (TS type-check on JSON config shape) before `/gsd-verify-work`

### Wave 0 Gaps
None — all test infrastructure exists. `NumericInput.test.ts` is already present and uses the exact patterns new tests will follow.

## Security Domain

**ASVS applicability:** V5 Input Validation is the only category in scope. All validation is client-side advisory — there is no server, no persistence beyond `sessionStorage` of raw numbers, no injection surface. The "Outside expected range — verify" message is a constant literal, not user-controlled, so there is no XSS concern on the hint/error paragraphs. Value is bound via Svelte text interpolation (`{displayError}`, `{rangeHint}`) which auto-escapes.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Type=number + parseFloat + advisory range check (existing pattern, unchanged semantics) |
| V6 Cryptography | no | — |

No threat model changes from the current state.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Svelte 5 omits `undefined` attribute values from rendered DOM | Pitfall 5 / Edit 7 | Low — if it doesn't, `<input min="">` is still harmless; tests will not detect it but manual DOM inspection would. |
| A2 | The two existing `grep`-matched test assertions are the only places in the repo asserting old copy | Pitfall 2 | Low — I grep'd the full `src/lib` tree; results confirmed only `NumericInput.test.ts` matches. |
| A3 | Existing v1.4 tertiary-token tuning holds on card surfaces for the hint paragraph context (same surface as MorphineWeanCalculator's empty state) | RESOLVED: hint color | Low — same surface token, same class; Phase 24 axe will re-confirm. |
| A4 | `resolveJsonModule` + `strict: true` are enabled in `tsconfig.json` | Pitfall 4 | Medium — if strict is off, a config schema drift could ship silently. Planner should have Task 0 verify `tsconfig.json`. |

**A4 is the only one the planner should actively verify** before starting the phase. Read `tsconfig.json` as a sanity check.

## Open Questions

None remaining. All 8 numbered questions from the spawn prompt are resolved inline above with `RESOLVED:` prefixes.

## Files to Modify / Create

**Modify (6):**
1. `src/lib/shared/components/NumericInput.svelte` — Edits 1-8 above.
2. `src/lib/shared/components/NumericInput.test.ts` — Update T-01, T-02; add T-03 through T-13.
3. `src/lib/morphine/morphine-config.json` — Add `inputs` top-level block.
4. `src/lib/morphine/types.ts` — Export `MorphineInputRanges` interface.
5. `src/lib/morphine/MorphineWeanCalculator.svelte` — Import config, replace 3 literal triples with `inputs.*` references.
6. `src/lib/fortification/fortification-config.json` — Add `inputs` top-level block.
7. `src/lib/fortification/fortification-config.ts` — Export typed `inputs` const.
8. `src/lib/fortification/types.ts` — Export `FortificationInputRanges` interface.
9. `src/lib/fortification/FortificationCalculator.svelte` — Import `inputs` from loader, replace 1 literal triple.

**Modify (shared types):**
10. `src/lib/shared/types.ts` — Add `NumericInputRange` interface (if not already present; worth a quick grep before the edit).

**Create (0):** No new files. Everything fits into existing modules.

**Total:** 10 file edits, 0 new files.

## Sources

### Primary (HIGH confidence)
- `src/lib/shared/components/NumericInput.svelte` — current state of all target lines, read in full
- `src/lib/shared/components/NumericInput.test.ts` — existing test patterns, 69 lines
- `src/lib/morphine/MorphineWeanCalculator.svelte` — all 3 NumericInput call sites, lines 153-182
- `src/lib/fortification/FortificationCalculator.svelte` — 1 NumericInput call site, lines 156-165
- `src/lib/morphine/morphine-config.json` — current flat structure, confirmed
- `src/lib/fortification/fortification-config.json` — current flat structure, confirmed
- `src/lib/fortification/fortification-config.ts` — loader wrapper pattern, confirmed
- `src/lib/morphine/types.ts`, `src/lib/fortification/types.ts` — TS module shapes
- `src/app.css` lines 74-75, 95-96 — text-tertiary token values with v1.4 A11Y comments
- `.planning/REQUIREMENTS.md` HARD-01..06 — authoritative requirement copy
- `.planning/ROADMAP.md` Phase 22 section — success criteria
- `CLAUDE.md` — inherited stack, design principles, brand tone

### Secondary (MEDIUM confidence)
- WAI-ARIA 1.2 specification for `aria-invalid` semantics — cited inline, standard interpretation

### Tertiary (LOW confidence)
- None. Every behavioral claim in this document is sourced from the in-repo code or from the phase requirements.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all inherited.
- Architecture (blur-gate pattern): HIGH — straightforward Svelte 5 `$state` + `$derived`, directly observable in the current component's structure.
- Config schema: HIGH — read both JSON files in full; schema decisions are additive and non-breaking.
- Test plan: HIGH — mirrors existing test file conventions exactly.
- Pitfalls: HIGH — both breaking points (existing tests, wheel handler) were verified by reading the exact lines they cite.

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable surface — no external library churn can invalidate this)
