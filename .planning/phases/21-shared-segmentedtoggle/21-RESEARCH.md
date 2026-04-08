# Phase 21: Shared SegmentedToggle - Research

**Researched:** 2026-04-07
**Domain:** Svelte 5 component extraction + ARIA tablist pattern
**Confidence:** HIGH

## Summary

Phase 21 is a pure 1:1 extraction of an already-shipped, already-keyboard-accessible tablist from `MorphineWeanCalculator.svelte` (lines 187-209 markup + 8-12, 105-148 script) into a generic, reusable `SegmentedToggle` component in `src/lib/shared/components/`. Both consumer sites already exist; both bind cleanly via the SelectPicker string-bridge mirror pattern. Zero new dependencies, no design decisions to make, no API research required — the active styling already uses `var(--color-identity)` which cascades correctly through the existing v1.5 identity wrapper.

**Primary recommendation:** Lift the existing markup and `handleModeTabKeydown`/`activateMode` handlers verbatim into a new generic component parameterized over `<T extends string>`. Keep `role="tablist"`/`role="tab"` (matches Morphine's current ARIA exactly = TOG-06 zero-risk). Drop `aria-controls` from the generic component (no panel id available, see Pitfall 1). Use `bind:value` matching SelectPicker's prop shape so Formula's existing `baseStr` mirror swaps `<SelectPicker>` for `<SegmentedToggle>` with no other changes.

## Project Constraints (from CLAUDE.md)

- Tech stack locked: SvelteKit 2 + Svelte 5 runes + Tailwind CSS 4 + TS — no new deps. [VERIFIED: CLAUDE.md]
- Touch targets ≥48px, WCAG 2.1 AA contrast — toggle segments must keep `py-3` minimum. [VERIFIED: CLAUDE.md]
- Test colocation: `*.test.ts` next to source, NOT in `__tests__/`. [VERIFIED: MEMORY.md]
- Mobile-first PWA — segmented toggle must work one-handed. [VERIFIED: MEMORY.md]
- All edits go through GSD workflow. [VERIFIED: CLAUDE.md]

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOG-01 | New `SegmentedToggle` in `src/lib/shared/components/` with SelectPicker-consistent API | Component API section below; SelectPicker.svelte:7-21 prop shape mirrored |
| TOG-02 | Active segment uses `var(--color-identity)` | MorphineWeanCalculator.svelte:202 already does this; cascades from `.identity-*` route wrapper (v1.5) |
| TOG-03 | ←/→/Home/End keyboard nav, ARIA matches Morphine tablist | `handleModeTabKeydown` lift verbatim from MorphineWeanCalculator.svelte:115-148 |
| TOG-04 | Morphine consumes it, inline tablist code removed | Extract MorphineWeanCalculator.svelte:8-12, 105-148, 187-209 |
| TOG-05 | Formula uses it for Base instead of SelectPicker | FortificationCalculator.svelte:153 swap; `baseStr` mirror unchanged |
| TOG-06 | Pre-existing morphine + fortification tests still pass | Markup/handlers are 1:1 lift; ARIA semantics unchanged |
| A11Y-03 | Component tests cover keyboard nav | Mirror SelectPicker.test.ts T-05/T-06 patterns for ←/→/Home/End |

## Standard Stack

No new dependencies. All required libraries are already in the inherited stack:

| Library | Version | Purpose | Already installed |
|---------|---------|---------|-------------------|
| svelte | ^5.55.0 | Component model, runes (`$bindable`, `$props`, `$derived`) | yes [VERIFIED: CLAUDE.md] |
| @testing-library/svelte | (in repo) | Component test rendering | yes [VERIFIED: SelectPicker.test.ts:2] |
| vitest | ^4.1.2 | Test runner | yes [VERIFIED: CLAUDE.md] |

**Installation:** none required.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/shared/
├── components/
│   ├── SegmentedToggle.svelte         # NEW
│   ├── SegmentedToggle.test.ts        # NEW (colocated per MEMORY.md)
│   ├── SelectPicker.svelte            # unchanged
│   ├── NumericInput.svelte            # unchanged
│   └── ...
└── index.ts                            # add export line
```

### Component API (exact TypeScript signature)

```typescript
// src/lib/shared/components/SegmentedToggle.svelte
<script lang="ts" generics="T extends string">
  interface SegmentedOption {
    value: T;
    label: string;
  }

  let {
    label,
    value = $bindable(),
    options,
    ariaLabel,
    class: className = '',
  }: {
    label: string;
    value: T;
    options: SegmentedOption[];
    ariaLabel?: string;
    class?: string;
  } = $props();

  const uid = crypto.randomUUID();

  function activate(next: T) {
    value = next;
  }

  function handleKeydown(event: KeyboardEvent, current: T) {
    const idx = options.findIndex((o) => o.value === current);
    if (idx === -1) return;
    let nextIdx = idx;
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        nextIdx = (idx + 1) % options.length;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        nextIdx = (idx - 1 + options.length) % options.length;
        break;
      case 'Home':
        event.preventDefault();
        nextIdx = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIdx = options.length - 1;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        activate(current);
        return;
      default:
        return;
    }
    const nextValue = options[nextIdx].value;
    activate(nextValue);
    document.getElementById(`${uid}-tab-${nextValue}`)?.focus();
  }
</script>
```

**Why this shape:**
- `bind:value` matches SelectPicker.svelte:9 (`value = $bindable()`) — Formula's `baseStr` mirror works unchanged.
- Generic `<T extends string>` keeps Morphine's `WeanMode` union type-safe at the call site without `as` casts.
- `options: { value, label }[]` matches `SelectOption` shape (minus `group`, which is N/A for 2-option toggles). Reusing `SelectOption` directly would also work but `group` would be ignored — a dedicated `SegmentedOption` type is more honest.
- `ariaLabel` optional (Morphine uses `aria-label="Weaning mode"` on the tablist container; Formula will use `aria-label="Base"`).
- `class` passthrough mirrors SelectPicker.svelte:14.
- `crypto.randomUUID()` for tab IDs matches SelectPicker.svelte:26.

### Markup (lift from MorphineWeanCalculator.svelte:188-209)

```svelte
<div
  class="flex p-1 bg-[var(--color-surface-alt)] rounded-2xl shadow-inner border border-[var(--color-border)] {className}"
  role="tablist"
  aria-label={ariaLabel ?? label}
>
  {#each options as option (option.value)}
    {@const active = value === option.value}
    <button
      type="button"
      role="tab"
      aria-selected={active}
      id="{uid}-tab-{option.value}"
      tabindex={active ? 0 : -1}
      class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-ui outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-identity)] {active ? 'bg-[var(--color-surface-card)] text-[var(--color-identity)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-identity)] hover:bg-[var(--color-surface)]'}"
      onclick={() => activate(option.value)}
      onkeydown={(e) => handleKeydown(e, option.value)}
    >
      <span>{option.label}</span>
    </button>
  {/each}
</div>
```

This is a near-verbatim copy of MorphineWeanCalculator.svelte:189-209 with three deltas:
1. `{mode}-tab` ID becomes `{uid}-tab-{option.value}` (avoids collisions if two toggles render on the same page).
2. `aria-controls="{mode}-panel"` is **dropped** (see Pitfall 1).
3. Container `aria-label` is parameterized.

### Anti-Patterns to Avoid

- **Don't reintroduce `aria-controls`** as a required prop. Morphine's current `{mode}-panel` ID points at nothing (the schedule isn't wrapped in `id="linear-panel"`). It's a dangling reference today and removing it on extraction is a fix, not a regression.
- **Don't switch to `role="group"`/`aria-pressed`.** Both are valid (WAI-ARIA toggle button group), but the goal is a 1:1 lift to keep TOG-06 risk-free. ARIA semantic change = a test surprise waiting to happen.
- **Don't add a second mounted dropdown fallback.** This is a 2-segment visible toggle, period.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Roving tabindex | Custom focus tracker | `tabindex={active ? 0 : -1}` (already in lift source) | Standard WAI-ARIA tablist pattern, already proven in Morphine |
| Unique tab IDs | Counter / module-level state | `crypto.randomUUID()` per instance | Matches SelectPicker.svelte:26; safe across multiple instances |
| Generic component types | `unknown`/`any`/runtime checks | Svelte 5 `<script lang="ts" generics="T extends string">` | First-class Svelte 5 feature [CITED: svelte.dev/docs/svelte/typescript] |

## Runtime State Inventory

Not applicable — Phase 21 is an extract-and-rewire refactor with no datastores, no service config, no OS state, no env vars, and no installed-package surface. Build artifacts auto-rebuild via Vite. Verified by reading both consumer files: only in-memory `$state` rune values are involved.

## Common Pitfalls

### Pitfall 1: Dangling `aria-controls` panel ID
**What goes wrong:** Morphine's existing tablist sets `aria-controls="{mode}-panel"` but no element in the DOM has `id="linear-panel"` or `id="compounding-panel"`. Lifting this prop into the generic component without supplying a real ID would propagate a (currently latent) accessibility bug.
**Why it happens:** The original component intended to wire panels but the schedule list doesn't carry the ID.
**How to avoid:** Drop `aria-controls` from `SegmentedToggle`. WAI-ARIA permits a `role="tab"` without `aria-controls` when the relationship is implicit/not represented as an `id` target. If a future consumer needs panel wiring, add an optional `panelIdFor?: (value: T) => string` prop later.
**Warning signs:** Axe sweep in Phase 24 would flag a real `aria-controls` mismatch eventually.

### Pitfall 2: Layout shift when Formula's Base swaps from SelectPicker → SegmentedToggle
**What goes wrong:** SelectPicker is a single 48px-tall trigger; SegmentedToggle is a 56px-tall (`p-1` + `py-3`) two-segment row. The inputs card grows by ~8px and shifts everything below.
**Why it happens:** Different component heights.
**How to avoid:** Acceptable visual change — the toggle is more discoverable for a 2-option choice and matches the v1.6 critique recommendation. No mitigation needed; flag for the Phase 24 axe + visual sweep.
**Warning signs:** Mobile screenshots will look slightly different; this is intentional.

### Pitfall 3: Don't break the searchable Formula picker
**What goes wrong:** A careless edit to FortificationCalculator.svelte could affect the formula `SelectPicker` (line 166-171, `searchable`).
**How to avoid:** Only change line 153 (Base SelectPicker → SegmentedToggle). Leave `baseOptions`, `baseStr` mirror, and all other SelectPicker instances untouched. Don't remove `import SelectPicker` — it's still used for Formula/kcal/Unit pickers.
**Warning signs:** Formula picker stops opening, search box missing.

### Pitfall 4: Roving tabindex broken by re-render
**What goes wrong:** After `activate(next)`, the new active button needs `tabindex=0` AND focus moves to it. If focus moves before Svelte updates `tabindex`, the button is briefly `tabindex=-1` and focus may bounce.
**How to avoid:** The lift code calls `document.getElementById(...).focus()` synchronously after `activate()`. Svelte 5 updates tabindex synchronously on `$bindable` write within the same task, so this works. Confirmed in current Morphine implementation — has been shipping since v1.1.
**Warning signs:** Test T-03/T-04 keyboard tests start flaking.

### Pitfall 5: `crypto.randomUUID()` in JSDOM tests
**What goes wrong:** Some JSDOM versions don't expose `crypto.randomUUID`.
**How to avoid:** SelectPicker already uses it (line 26) and its test suite passes — confirms the test environment supports it. No action needed.

## Code Examples

### Morphine consumer site (after extract)

```svelte
<!-- src/lib/morphine/MorphineWeanCalculator.svelte (replace lines 187-209) -->
<script lang="ts">
  import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';
  import type { WeanMode } from '$lib/morphine/types.js';

  const MODE_OPTIONS: { value: WeanMode; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'compounding', label: 'Compounding' },
  ];

  // Replace activateMode wrapper — keep the rAF re-magnification trigger
  function onModeChange() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => triggerMagnification?.());
    });
  }
</script>

<SegmentedToggle
  label="Weaning mode"
  ariaLabel="Weaning mode"
  bind:value={morphineState.current.activeMode}
  options={MODE_OPTIONS}
/>
```

**Wrinkle:** The current `activateMode` does TWO things — sets state AND triggers magnification re-pass. With `bind:value`, the state mutation happens in the child. To preserve the magnification trigger, use a Svelte 5 `$effect` watching `morphineState.current.activeMode`:

```typescript
$effect(() => {
  morphineState.current.activeMode; // track
  requestAnimationFrame(() => {
    requestAnimationFrame(() => triggerMagnification?.());
  });
});
```

The MutationObserver at line 94-95 already handles DOM-driven re-triggering, so this `$effect` may even be redundant — verify during execution.

Lines to delete from MorphineWeanCalculator.svelte after the lift:
- Line 8: `MODE_ORDER` (replaced by `MODE_OPTIONS`)
- Lines 9-12: `MODE_CONFIG` (folded into `MODE_OPTIONS`)
- Lines 105-113: `activateMode` (replaced by `bind:value` + `$effect`)
- Lines 115-148: `handleModeTabKeydown` (lives in SegmentedToggle now)
- Lines 188-209: tablist markup (replaced by `<SegmentedToggle>`)

### Formula consumer site (one-line swap)

```svelte
<!-- src/lib/fortification/FortificationCalculator.svelte:153 -->
<!-- BEFORE -->
<SelectPicker label="Base" bind:value={baseStr} options={baseOptions} />

<!-- AFTER -->
<SegmentedToggle label="Base" bind:value={baseStr} options={baseOptions} />
```

**Verified:** `baseStr` is a `$state<string>` (line 16), `baseOptions` already has `{ value, label }` shape (lines 68-71). No other changes needed. The string-bridge `$effect` blocks (lines 33-40, 59-65) continue to work because `bind:value` writes a string back. The `import SelectPicker` line stays (still used for Formula/kcal/Unit). Add `import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';`.

### Identity color cascade verification

`var(--color-identity)` is set on the route-level `.identity-morphine` / `.identity-formula` wrapper (v1.5). Both consumer components render inside their respective routes, so the toggle's `text-[var(--color-identity)]` and `focus-visible:ring-[var(--color-identity)]` cascade automatically — Clinical Blue in Morphine, Teal in Formula. **No prop wiring needed.** [VERIFIED: MorphineWeanCalculator.svelte:202 already uses these tokens and renders Clinical Blue today.]

## State Integration

Both consumer state shapes confirmed:

| Consumer | Binding target | Type | Compatible with `bind:value`? |
|----------|---------------|------|-------------------------------|
| Morphine | `morphineState.current.activeMode` | `WeanMode` (`'linear' \| 'compounding'`) | Yes — direct bind, generic `T = WeanMode` [VERIFIED: MorphineWeanCalculator.svelte:106] |
| Formula | `baseStr` mirror | `string` | Yes — direct bind, generic `T = string` [VERIFIED: FortificationCalculator.svelte:16, 153] |

The Formula side does **not** need to bind directly to `fortificationState.current.base` — it goes through the `baseStr` mirror exactly as it does today with `SelectPicker`. The mirror pattern (lines 14-65) is the locked approach per inline comment "string-bridge mirrors for SelectPicker (locked approach)".

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + @testing-library/svelte |
| Config file | `vitest.config.ts` (existing) |
| Quick run command | `npx vitest run src/lib/shared/components/SegmentedToggle.test.ts` |
| Full suite command | `npm test` (or `npx vitest run`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOG-01 | Renders label + tablist with N options | unit | `vitest run SegmentedToggle.test.ts -t "T-01"` | ❌ Wave 0 |
| TOG-02 | Active segment uses `var(--color-identity)` (class assertion — computed style is brittle in JSDOM) | unit | `... -t "T-02"` | ❌ Wave 0 |
| TOG-03 | ArrowRight/ArrowLeft/Home/End cycles focus + selection | unit | `... -t "T-03"` `"T-04"` `"T-05"` | ❌ Wave 0 |
| TOG-03 | Space/Enter activates current tab | unit | `... -t "T-06"` | ❌ Wave 0 |
| TOG-04 | Existing morphine tests still pass | unit | `vitest run src/lib/morphine` | ✅ |
| TOG-05 | Existing fortification tests still pass | unit | `vitest run src/lib/fortification` | ✅ |
| TOG-06 | Bind:value writes back to parent state | unit | `... -t "T-07"` | ❌ Wave 0 |
| A11Y-03 | Keyboard interactions covered (overlaps TOG-03) | unit | (covered above) | ❌ Wave 0 |

**Test patterns to mirror from SelectPicker.test.ts:**
- T-05 (`fireEvent.keyDown(listbox, { key: 'ArrowDown' })` + assert `data-index` on `document.activeElement`) — adapt to assert `aria-selected="true"` on active tab.
- T-06 (Home/End focus jumps) — direct lift.
- For TOG-02, assert the active button has the class fragment `text-[var(--color-identity)]` (string match on `className`) rather than computed style — JSDOM doesn't resolve CSS custom properties reliably.

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/shared/components/SegmentedToggle.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual smoke (toggle Linear/Compounding, toggle Breast milk/Formula in both themes).

### Wave 0 Gaps
- [ ] `src/lib/shared/components/SegmentedToggle.svelte` — the component itself
- [ ] `src/lib/shared/components/SegmentedToggle.test.ts` — covers TOG-01..03, A11Y-03
- [ ] No fixtures needed (no `getCalculatorContext` dependency, unlike SelectPicker which mocks it)

## Files to Modify / Create

**Create:**
1. `src/lib/shared/components/SegmentedToggle.svelte` — generic component (~80 lines)
2. `src/lib/shared/components/SegmentedToggle.test.ts` — keyboard + binding tests (~120 lines, mirrors SelectPicker.test.ts shape)

**Modify:**
3. `src/lib/shared/index.ts` — add `export { default as SegmentedToggle } from './components/SegmentedToggle.svelte';` after line 7
4. `src/lib/morphine/MorphineWeanCalculator.svelte` — delete lines 8-12 (MODE_ORDER/MODE_CONFIG), 105-148 (activateMode + handleModeTabKeydown), 188-209 (tablist markup); add SegmentedToggle import + MODE_OPTIONS const + `<SegmentedToggle>` invocation + `$effect` for magnification re-trigger
5. `src/lib/fortification/FortificationCalculator.svelte` — change line 153 from `<SelectPicker>` to `<SegmentedToggle>`; add SegmentedToggle import alongside existing SelectPicker import (do NOT remove SelectPicker import — still used at lines 166, 174, 179)

**Untouched (verify by grep after edit):**
- `src/lib/morphine/state.svelte.ts` (state shape unchanged)
- `src/lib/fortification/state.svelte.ts` (state shape unchanged)
- `src/lib/morphine/types.ts` (`WeanMode` unchanged)
- All other SelectPicker call sites
- All existing test files

## Open Questions

1. **Should `MODE_OPTIONS` move to `morphine/types.ts` as the canonical mode list?**
   - **RESOLVED:** No. Keep it inline in `MorphineWeanCalculator.svelte` as a top-of-script `const`. It's display data (label string), not a type — leaving it in the consumer keeps `types.ts` pure. Matches the Formula `baseOptions` pattern (FortificationCalculator.svelte:68-71).

2. **Does the magnification re-trigger need to survive the refactor?**
   - **RESOLVED:** Yes — it's user-visible behavior (mode switch should re-magnify the new schedule cards). Use `$effect(() => { morphineState.current.activeMode; rAF(rAF(triggerMagnification)); })`. The MutationObserver at line 94-95 may or may not catch this case; the explicit `$effect` is safer. Verify during execution that double-firing doesn't cause flicker — if it does, drop the `$effect` and rely on the MutationObserver alone.

3. **Should `SegmentedOption` reuse `SelectOption` or be its own type?**
   - **RESOLVED:** Define a dedicated `SegmentedOption<T>` inline in the component. `SelectOption` carries `group` which is meaningless for a 2–4 segment toggle. Importing it would imply grouping support that doesn't exist. A 4-line inline interface is clearer than reusing a type with ignored fields.

4. **`role="tablist"` vs `role="group"` + `aria-pressed`?**
   - **RESOLVED:** `role="tablist"` + `role="tab"`. Justification: TOG-06 requires zero behavior change for existing morphine tests, and Morphine currently uses tablist. Switching ARIA semantics on extraction is a one-line change but a high-risk one for a test suite that may assert on `getByRole('tab')`. Lift verbatim. The `role="group"`/`aria-pressed` pattern is a valid future option if we ever want toggle-button semantics (e.g., for non-mutually-exclusive multi-select), but Phase 21 is mutually exclusive 2-of-N and tablist is the right semantic.

5. **What about `aria-controls`?**
   - **RESOLVED:** Drop it. Morphine's current `aria-controls="{mode}-panel"` points at no element with that ID — it's a latent bug. The generic component has no way to know the panel ID without a new prop, and WAI-ARIA permits `role="tab"` without `aria-controls`. If a future consumer needs it, add an optional `panelIdFor?: (value: T) => string` prop.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The MutationObserver in Morphine catches mode-switch re-renders, so the magnification `$effect` is "belt and suspenders" rather than required | Open Q #2 | If wrong, magnification won't re-pass after mode switch — caught by manual smoke test |
| A2 | JSDOM in this project supports `crypto.randomUUID()` | Pitfall 5 | If wrong, tests crash on render — caught immediately, fix by adding a counter fallback |
| A3 | Svelte 5 generic component syntax `<script lang="ts" generics="T extends string">` is supported in this project's Svelte/svelte-check version | Component API | If wrong, fall back to `T = string` non-generic; Morphine call site adds `as WeanMode` cast at the bind site |

## Sources

### Primary (HIGH confidence)
- `src/lib/morphine/MorphineWeanCalculator.svelte` (lines 8-12, 105-148, 187-209) — extraction source
- `src/lib/fortification/FortificationCalculator.svelte` (lines 14-65, 68-71, 153) — Formula consumer + mirror pattern
- `src/lib/shared/components/SelectPicker.svelte` (lines 7-21, 26) — API shape to mirror
- `src/lib/shared/components/SelectPicker.test.ts` (T-05, T-06) — test pattern to mirror
- `src/lib/shared/index.ts` — export location
- `.planning/REQUIREMENTS.md` (TOG-01..06, A11Y-03) — phase scope
- `CLAUDE.md` — stack constraints, test colocation rule

### Secondary (CITED)
- Svelte 5 generic components: https://svelte.dev/docs/svelte/typescript [CITED]
- WAI-ARIA Tabs Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ [CITED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, all libs in repo
- Architecture: HIGH — 1:1 lift of shipping code
- Pitfalls: HIGH — discovered by reading both call sites end-to-end

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable internal refactor, no external dependency drift risk)
