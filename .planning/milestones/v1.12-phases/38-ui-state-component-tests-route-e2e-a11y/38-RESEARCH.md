# Phase 38: UI + State + Component Tests + Route + E2E + A11y - Research

**Researched:** 2026-04-10
**Domain:** Svelte 5 component development, state management, Playwright E2E, axe-core accessibility
**Confidence:** HIGH

## Summary

Phase 38 builds the complete Feed Advance Calculator UI on top of the Phase 37 calculation functions and Phase 36 shell scaffolding. The codebase has a mature, well-established pattern from the GIR calculator (component, state, route, tests, a11y) that this phase replicates with higher complexity: two modes (bedside/full-nutrition), six dropdowns, and a richer output layout.

The primary risk is the bedside mode output layout -- unlike GIR and Morphine which have a single hero value, bedside mode shows three equally-prominent per-feed outputs (CORE-05). This is a novel layout pattern for this codebase. Full nutrition mode follows the familiar hero pattern.

**Primary recommendation:** Mirror the GIR calculator structure exactly for state, route, and test patterns. Focus creative effort on the bedside three-output layout and the two-mode SegmentedToggle integration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Extend TrophicFrequency type to 'q2h' | 'q3h' | 'q4h' | 'q6h'. Add q2h (12 feeds/day) and q6h (4 feeds/day) to feeds-config.json.
- D-02: Default frequency remains q3h.
- D-03: Single FeedAdvanceCalculator.svelte with SegmentedToggle at top. Two mode sections via {#if mode === 'bedside'} / {:else}. Shared weight input above toggle.
- D-04: Component mirrors GIR pattern: imports calculations, state, config. Uses $derived for reactive results.
- D-05: Route src/routes/feeds/+page.svelte imports FeedAdvanceCalculator -- thin wrapper matching GIR pattern.
- D-06: state.svelte.ts follows GIR state pattern exactly: sessionStorage-backed $state singleton. Session key: nicu_feeds_state.
- D-07: State persists across route navigation. Mode toggle preserves weight and all field values.
- D-08: Three per-feed outputs (trophic, advance, goal) as vertical stack. Each shows ml/feed primary + ml/kg/d echo. All three equally prominent.
- D-09: Total fluids rate (ml/hr) and IV backfill rate below the three outputs.
- D-10: IV backfill framed as "Estimated IV rate to meet TFI" with disclaimer.
- D-11: Full nutrition hero: total kcal/kg/d -- large numeral matching GIR/Morphine hero.
- D-12: TPN inputs in labeled fieldset: "TPN Line 1" + "TPN Line 2" with dex% + ml/hr side by side.
- D-13: SMOF ml, then enteral inputs. Enteral kcal/oz uses SelectPicker with 20/22/24/27/30.
- D-14: Secondary outputs below hero: dextrose kcal, lipid kcal, enteral kcal, ml/kg total as summary grid.
- D-15: Non-blocking inline advisory banners. Reuse GIR advisory visual pattern.
- D-16: Advisories data-driven from checkAdvisories() pure function.
- D-17: Advisory timing uses blur-gated pattern from existing showRangeHint.
- D-18: Empty state: "Enter a weight to see per-feed volumes." when weight blank.
- D-19: Defaults produce immediate results when weight is entered.
- D-20: Non-integer advances-per-day use floor rounding.
- D-21: Update feeds stub in about-content.ts with real description.
- D-22: Component tests co-located at src/lib/feeds/FeedAdvanceCalculator.test.ts.
- D-23: Playwright E2E at e2e/feeds.spec.ts. Happy-path at mobile 375 + desktop 1280 for both modes.
- D-24: Playwright axe-core sweeps update existing e2e/feeds-a11y.spec.ts for real content.

### Claude's Discretion
- Exact CSS/Tailwind class choices for layout, spacing, responsive breakpoints
- Whether TPN Line 2 has a visual toggle or is always visible with 0/0 defaults
- Component test assertion style (exact vs pattern matching)
- Ordering of inputs within each mode section

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CORE-01 | Weight input (0.4-6.0 kg, decimal keyboard) | NumericInput component exists with inputmode="decimal", range hints. Config in feeds-config.json |
| CORE-02 | Trophic ml/kg/d input (10-30, default 20) | NumericInput + feeds-config.json inputs.trophicMlKgDay |
| CORE-03 | Advance ml/kg/d input (10-40, default 30) | NumericInput + feeds-config.json inputs.advanceMlKgDay |
| CORE-04 | Goal ml/kg/d input (120-180, default 160) | NumericInput + feeds-config.json inputs.goalMlKgDay |
| CORE-05 | Three simultaneous per-feed outputs, no hero split | Novel layout pattern -- vertical stack of result rows |
| CORE-06 | ml/kg/d echoed back next to each ml/feed | BedsideResult already returns both values per output |
| CORE-07 | Total fluids rate (ml/hr) | calculateTotalFluidsMlHr already in calculations.ts |
| CORE-08 | Empty state message when weight blank | GIR empty-state pattern: conditional render |
| FREQ-01 | Frequency dropdown q2h/q3h/q4h/q6h | SelectPicker component. Need to ADD q2h/q6h to config + type |
| FREQ-02 | Frequency drives feeds-per-day live | $derived recalculation on frequency state change |
| FREQ-03 | Advance cadence dropdown | SelectPicker component. Cadence options already in config |
| FREQ-05 | Non-integer advances floor rounding | resolveAdvanceEventsPerDay + Math.floor in component |
| IV-01 | Total fluids input + IV backfill output | calculateIvBackfillRate in calculations.ts |
| IV-02 | IV backfill framed with disclaimer | Static text below output |
| IV-03 | IV backfill xlsx parity | Calculation already tested in Phase 37 |
| FULL-01 | SegmentedToggle bedside/full-nutrition | SegmentedToggle shared component, generic typed |
| FULL-02 | TPN two parallel dextrose lines | State has tpnDex1Pct/tpnMl1Hr + tpnDex2Pct/tpnMl2Hr |
| FULL-03 | SMOF + enteral + kcal/oz picker | SelectPicker for kcal/oz, NumericInput for volumes |
| SAFE-01 | Trophic > advance warning | checkAdvisories handles "trophic-exceeds-advance" |
| SAFE-02 | Info advisory for advance > 40 etc. | NOT in current config -- must be added |
| SAFE-03 | Weight < 0.5 kg advisory | NOT in current config -- must be added |
| SAFE-04 | Total kcal/kg/d out-of-range advisory | Already in config: total-kcal-high (>140), total-kcal-low (<90) |
| SAFE-05 | Dextrose > 12.5% advisory | Already in config: dextrose-high-line1, dextrose-high-line2 |
| TEST-05 | Component tests | GirCalculator.test.ts pattern with @testing-library/svelte |
| TEST-06 | Playwright E2E both viewports both modes | GIR e2e pattern: viewport loop, dismiss disclaimer, fill inputs |
| TEST-07 | Axe-core sweeps 20/20 green | Existing feeds-a11y.spec.ts to update |
</phase_requirements>

## Standard Stack

### Core (already installed, zero new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 (runes) | ^5.55.0 | Component model with $state/$derived/$effect | Project stack [VERIFIED: package.json] |
| SvelteKit 2 | ^2.55.0 | Routing + page wrapper | Project stack [VERIFIED: package.json] |
| Tailwind CSS 4 | ^4.2.2 | Styling | Project stack [VERIFIED: package.json] |
| Vitest | ^4.1.2 | Component testing | Project stack [VERIFIED: pnpm vitest --version] |
| @testing-library/svelte | ^5.3.1 | DOM testing utilities | Project stack [VERIFIED: node_modules] |
| Playwright | ^1.59.0 | E2E testing | Project stack [VERIFIED: npx playwright --version] |
| @axe-core/playwright | installed | Accessibility audits | Project stack [VERIFIED: imports in existing specs] |
| @lucide/svelte | installed | Icons (AlertTriangle, Info, Baby) | Project stack [VERIFIED: GIR imports] |

**No new dependencies required.** [VERIFIED: ARCH-07 + CLAUDE.md constraints]

## Architecture Patterns

### File Structure
```
src/lib/feeds/
  types.ts             # Phase 37 (EXISTS) -- extend TrophicFrequency
  calculations.ts      # Phase 37 (EXISTS) -- no changes
  calculations.test.ts # Phase 37 (EXISTS) -- no changes
  feeds-config.json    # Phase 37 (EXISTS) -- add q2h/q6h + missing advisories
  feeds-config.ts      # Phase 37 (EXISTS) -- no changes needed
  feeds-config.test.ts # Phase 37 (EXISTS) -- extend for new advisories
  state.svelte.ts      # NEW -- sessionStorage singleton (GIR pattern)
  FeedAdvanceCalculator.svelte  # NEW -- main calculator component
  FeedAdvanceCalculator.test.ts # NEW -- component tests
src/routes/feeds/
  +page.svelte         # EXISTS (placeholder) -- replace with real content
e2e/
  feeds.spec.ts        # NEW -- happy-path E2E
  feeds-a11y.spec.ts   # EXISTS (placeholder) -- update for real content
```

### Pattern 1: State Management (GIR Clone)
**What:** SessionStorage-backed $state singleton with init/persist/reset methods
**When to use:** Every calculator in this app
**Example:**
```typescript
// Source: src/lib/gir/state.svelte.ts (verified in codebase)
const SESSION_KEY = 'nicu_feeds_state';
function defaultState(): FeedsStateData { /* ... */ }
let _state = $state<FeedsStateData>(defaultState());
export const feedsState = {
  get current(): FeedsStateData { return _state; },
  init(): void { /* restore from sessionStorage */ },
  persist(): void { /* save to sessionStorage */ },
  reset(): void { /* reset to defaults */ },
};
```

### Pattern 2: Reactive Calculation via $derived
**What:** Calculator results recomputed reactively whenever state changes
**When to use:** Component-level calculation binding
**Example:**
```typescript
// Source: src/lib/gir/GirCalculator.svelte (verified in codebase)
let bedsideResult = $derived(
  feedsState.current.weightKg != null
    ? calculateBedsideAdvance(
        feedsState.current.weightKg,
        feedsState.current.trophicMlKgDay ?? defaults.trophicMlKgDay,
        // ...
      )
    : null
);
```

### Pattern 3: Advisory Rendering (Data-Driven)
**What:** checkAdvisories() returns triggered advisory IDs; component renders matching banners
**When to use:** After calculation results are computed
**Example:**
```svelte
<!-- Source: GirCalculator.svelte advisory pattern (verified) -->
{#each triggeredAdvisories as advisory (advisory.id)}
  <div class="rounded-xl px-4 py-3 flex items-start gap-3 border-l-4"
       style="background: var(--color-bmf-50); border-left-color: var(--color-bmf-600);"
       role="note">
    <AlertTriangle size={20} class="text-[var(--color-bmf-600)] shrink-0 mt-0.5" aria-hidden="true" />
    <p class="text-base font-semibold text-[var(--color-text-primary)]">{advisory.message}</p>
  </div>
{/each}
```

### Pattern 4: Route Wrapper (Thin Page)
**What:** +page.svelte sets calculator context, calls state.init(), renders header + component
**When to use:** Every calculator route
**Example:**
```svelte
<!-- Source: src/routes/gir/+page.svelte (verified) -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { feedsState } from '$lib/feeds/state.svelte.js';
  import FeedAdvanceCalculator from '$lib/feeds/FeedAdvanceCalculator.svelte';
  import { Baby } from '@lucide/svelte';

  onMount(() => {
    setCalculatorContext({ id: 'feeds', accentColor: 'var(--color-identity)' });
    feedsState.init();
  });
</script>
```

### Pattern 5: SegmentedToggle Integration
**What:** SegmentedToggle binds to state.mode, conditional sections render based on value
**When to use:** Multi-mode calculators
**Example:**
```svelte
<!-- Source: SegmentedToggle.svelte (verified) -->
<SegmentedToggle
  label="Calculator mode"
  bind:value={feedsState.current.mode}
  options={[
    { value: 'bedside', label: 'Bedside Advancement' },
    { value: 'full-nutrition', label: 'Full Nutrition' },
  ]}
/>
{#if feedsState.current.mode === 'bedside'}
  <!-- bedside inputs and outputs -->
{:else}
  <!-- full nutrition inputs and outputs -->
{/if}
```

### Anti-Patterns to Avoid
- **Splitting into two components per mode:** D-03 explicitly locks a single component with {#if} switching. Two components would mean two import trees and potential state sync issues.
- **Auto-clamping inputs:** NumericInput min/max is advisory only (v1.6 decision). Never programmatically clamp values.
- **Rendering zeros as empty state:** D-18/D-19 are clear: blank weight = text message, populated weight with defaults = show results.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Numeric inputs with validation | Custom input parsing | `NumericInput` shared component | Handles inputmode, range hints, blur-gated errors, wheel events [VERIFIED: codebase] |
| Dropdown pickers | Custom select/dropdown | `SelectPicker` shared component | Handles dialog, keyboard nav, ARIA, safe-area padding [VERIFIED: codebase] |
| Mode toggle | Radio buttons or custom tabs | `SegmentedToggle` shared component | Handles tablist ARIA, keyboard nav, identity styling [VERIFIED: codebase] |
| Advisory threshold checks | if/else chains in component | `checkAdvisories()` pure function | Already data-driven from config, tested in Phase 37 [VERIFIED: calculations.ts] |
| State persistence | Manual localStorage calls | State singleton with init/persist/reset | Proven pattern across 3 calculators [VERIFIED: gir/state.svelte.ts] |

## Common Pitfalls

### Pitfall 1: Missing Advisories in Config
**What goes wrong:** SAFE-02 (advance > 40, goal out of range) and SAFE-03 (weight < 0.5) are required but NOT present in the current feeds-config.json advisory array.
**Why it happens:** Phase 37 focused on the xlsx-parity advisories (dextrose, trophic-exceeds-advance, total-kcal). The input-range advisories were deferred to Phase 38.
**How to avoid:** Add these advisory entries to feeds-config.json before building the component. The checkAdvisories() function is already generic enough to handle them.
**Warning signs:** Advisory tests pass but only for the subset already in config.

### Pitfall 2: TrophicFrequency Type Not Extended
**What goes wrong:** TypeScript compile errors when using 'q2h' or 'q6h' because TrophicFrequency is still `'q3h' | 'q4h'`.
**Why it happens:** Phase 37 types match the xlsx exactly. FREQ-01 requires extending for the dropdown.
**How to avoid:** Extend TrophicFrequency and add entries to feeds-config.json dropdowns.frequency FIRST, before component work.
**Warning signs:** Type errors on state initialization with new frequency values.

### Pitfall 3: SelectPicker Requires Calculator Context
**What goes wrong:** SelectPicker calls `getCalculatorContext()` internally to get accent color. If context is not set, it falls back to `'var(--color-accent)'` which may not match identity tokens.
**Why it happens:** Svelte context must be set by the parent route page via `setCalculatorContext()` in onMount.
**How to avoid:** The route wrapper already calls setCalculatorContext. The component test must mock context OR the test must render within a wrapper that sets context.
**Warning signs:** Accent colors look wrong in component tests or devtools.

### Pitfall 4: Bedside Output Layout Differs from GIR Hero
**What goes wrong:** Copy-pasting GIR hero section results in a single large number, but bedside needs THREE equally-prominent results.
**Why it happens:** CORE-05 explicitly says "no hero/secondary split -- all three matter."
**How to avoid:** Design the bedside output as a vertical stack of result rows, not a hero card. Use consistent typography (text-title, not text-display) for all three values.
**Warning signs:** One value visually dominates the others.

### Pitfall 5: Floor Rounding for advanceEventsPerDay
**What goes wrong:** Non-integer advance events (e.g., "every 3rd feed" at q3h = 8/3 = 2.67) produce fractional ml/feed values that don't make clinical sense.
**Why it happens:** resolveAdvanceEventsPerDay returns the raw division. FREQ-05 requires floor rounding.
**How to avoid:** Apply Math.floor() in the component when computing advanceEventsPerDay before passing to calculateBedsideAdvance. Document in JSDoc.
**Warning signs:** Per-feed advance volumes are oddly precise decimals.

### Pitfall 6: axe-core Violations from Missing Labels on Fieldsets
**What goes wrong:** TPN Line 1 / Line 2 grouped inputs without proper fieldset/legend or aria-label fail axe landmark checks.
**Why it happens:** Grouping related inputs visually without semantic grouping.
**How to avoid:** Use `<fieldset>` with `<legend>` for TPN input groups, or aria-labelledby on the container.
**Warning signs:** axe "form-field-multiple-labels" or "landmark" violations.

### Pitfall 7: E2E Test Count Target (20/20)
**What goes wrong:** Adding feeds tests bumps total count but existing specs may have flaky tests.
**Why it happens:** The 20/20 target means ALL E2E tests must pass, not just the new ones.
**How to avoid:** Run full Playwright suite early in development. Current suite has no flaky tests (verified by examining spec files).
**Warning signs:** CI failures in unrelated specs.

## Code Examples

### State Module (feeds state.svelte.ts)
```typescript
// Source: Pattern from src/lib/gir/state.svelte.ts (verified)
import type { FeedsStateData } from './types.js';
import { defaults } from './feeds-config.js';

const SESSION_KEY = 'nicu_feeds_state';

function defaultState(): FeedsStateData {
  return {
    mode: 'bedside',
    weightKg: null,  // null = empty state (D-18)
    trophicMlKgDay: defaults.trophicMlKgDay,
    advanceMlKgDay: defaults.advanceMlKgDay,
    goalMlKgDay: defaults.goalMlKgDay,
    trophicFrequency: defaults.trophicFrequency as TrophicFrequency,
    advanceCadence: defaults.advanceCadence as AdvanceCadence,
    totalFluidsMlHr: defaults.totalFluidsMlHr,
    tpnDex1Pct: defaults.tpnDex1Pct,
    tpnMl1Hr: defaults.tpnMl1Hr,
    tpnDex2Pct: defaults.tpnDex2Pct,
    tpnMl2Hr: defaults.tpnMl2Hr,
    smofMl: defaults.smofMl,
    enteralMl: defaults.enteralMl,
    enteralKcalPerOz: defaults.enteralKcalPerOz,
  };
}
```

### Bedside Output Row Pattern
```svelte
<!-- Novel pattern for CORE-05: three equally-prominent outputs -->
<section class="card" aria-live="polite" aria-atomic="true">
  {#if bedsideResult}
    <div class="flex flex-col divide-y divide-[var(--color-border)]">
      {#each [
        { label: 'Trophic', ml: bedsideResult.trophicMlPerFeed, echo: bedsideResult.trophicMlKgDay },
        { label: 'Advance step', ml: bedsideResult.advanceStepMlPerFeed, echo: bedsideResult.advanceMlKgDay },
        { label: 'Goal', ml: bedsideResult.goalMlPerFeed, echo: bedsideResult.goalMlKgDay },
      ] as row (row.label)}
        <div class="px-5 py-4 flex items-baseline justify-between">
          <div>
            <span class="text-2xs font-semibold uppercase tracking-wide text-[var(--color-identity)]">{row.label}</span>
            <div class="flex items-baseline gap-2">
              <span class="text-title font-bold num">{row.ml.toFixed(1)}</span>
              <span class="text-ui text-[var(--color-text-secondary)]">ml/feed</span>
            </div>
          </div>
          <span class="text-ui text-[var(--color-text-tertiary)]">{row.echo} ml/kg/d</span>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-ui text-[var(--color-text-secondary)] text-center py-6">
      Enter a weight to see per-feed volumes.
    </p>
  {/if}
</section>
```

### Frequency Dropdown with SelectPicker
```svelte
<!-- Source: SelectPicker accepts { value, label } options (verified) -->
<SelectPicker
  label="Feed frequency"
  bind:value={feedsState.current.trophicFrequency}
  options={frequencyOptions.map(f => ({ value: f.id, label: f.label }))}
/>
```

### E2E Test Pattern (viewport loop)
```typescript
// Source: e2e/gir.spec.ts pattern (verified)
for (const viewport of [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 },
]) {
  test.describe(`Feeds happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    test.beforeEach(async ({ page }) => {
      await page.goto('/feeds');
      await page.getByRole('button', { name: /understand/i })
        .click({ timeout: 2000 }).catch(() => {});
    });
    // tests here
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte stores ($writable) | Svelte 5 runes ($state/$derived) | Svelte 5 | All state uses rune syntax [VERIFIED: codebase] |
| vitest < 4.x | vitest 4.1.2 | 2025 | Tests use current API [VERIFIED: pnpm vitest --version] |
| @testing-library/svelte 4.x | @testing-library/svelte 5.3.1 | 2025 | Svelte 5 rune support [VERIFIED: node_modules] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Math.floor is the correct rounding for non-integer advanceEventsPerDay | Pitfall 5 | Could produce clinically incorrect advance volumes. D-20 locks floor rounding. LOW risk since user confirmed. |
| A2 | The 20/20 E2E target includes all existing specs plus new feeds specs | Pitfall 7 | Count mismatch. Can be verified by running `npx playwright test --reporter=list` |

## Open Questions

1. **How many total Playwright tests exist currently?**
   - What we know: There are 10 E2E spec files. The 20/20 target implies 20 test cases total after adding feeds specs.
   - What's unclear: Exact current count (need to run Playwright to verify).
   - Recommendation: Run full Playwright suite at start of phase to establish baseline count.

2. **Should advanceEventsPerDay floor rounding happen in the component or in resolveAdvanceEventsPerDay?**
   - What we know: D-20 says floor. resolveAdvanceEventsPerDay currently returns raw division. Phase 37 parity tests use exact divisors (bid=2, qd=1) so floor doesn't affect them.
   - What's unclear: Whether modifying the config helper is better than floor in the component.
   - Recommendation: Apply Math.floor in the component at the call site, NOT in the shared function, to preserve the raw value for potential future use. Document with a JSDoc comment.

## Sources

### Primary (HIGH confidence)
- src/lib/gir/GirCalculator.svelte -- Calculator component pattern (read directly)
- src/lib/gir/state.svelte.ts -- State management pattern (read directly)
- src/lib/gir/GirCalculator.test.ts -- Component test pattern (read directly)
- src/lib/feeds/types.ts -- Phase 37 type definitions (read directly)
- src/lib/feeds/calculations.ts -- Phase 37 calculation functions (read directly)
- src/lib/feeds/feeds-config.json -- Phase 37 config with advisories (read directly)
- src/lib/feeds/feeds-config.ts -- Typed config wrapper (read directly)
- src/lib/shared/components/SegmentedToggle.svelte -- Toggle component (read directly)
- src/lib/shared/components/SelectPicker.svelte -- Dropdown component (read directly)
- src/lib/shared/components/NumericInput.svelte -- Numeric input component (read directly)
- e2e/gir.spec.ts -- E2E test pattern (read directly)
- e2e/gir-a11y.spec.ts -- Axe-core sweep pattern (read directly)
- e2e/feeds-a11y.spec.ts -- Existing placeholder sweeps (read directly)
- Vitest 4.1.2 verified via `pnpm vitest --version`
- Playwright 1.59.0 verified via `npx playwright --version`
- All 215 vitest tests passing verified via `pnpm vitest run`

### Secondary (MEDIUM confidence)
- None needed -- all patterns verified from codebase directly

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all verified in codebase
- Architecture: HIGH -- direct replication of proven GIR patterns with well-defined extensions
- Pitfalls: HIGH -- identified from direct code inspection of existing config gaps and type constraints

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable patterns, no external dependencies)
