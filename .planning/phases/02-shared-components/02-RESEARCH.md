# Phase 2: Shared Components - Research

**Researched:** 2026-03-31
**Domain:** Svelte 5 component authoring — headless accessible primitives (bits-ui), native `<dialog>`, ARIA patterns, dark/light theming with OKLCH tokens
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use bits-ui as the base for SelectPicker. It provides headless, accessible select/combobox primitives for Svelte 5. We style it with Tailwind using our design tokens.
- **D-02:** SelectPicker supports optional option grouping via a `groups` prop. Flat list by default (PERT use case), grouped by manufacturer when groups are provided (formula use case). Same component for both.
- **D-03:** Claude drafts a combined medical disclaimer covering both PERT dosing and formula calculations. Based on both existing apps' disclaimer text.
- **D-04:** Ship with the draft text — no blocking clinical review gate. Revise later if stakeholder feedback requires changes.
- **D-05:** New localStorage key: `nicu_assistant_disclaimer_v1`. Does not inherit acceptance from either standalone app.
- **D-06:** Use Svelte context for calculator-specific config (accent color, calculator identity). Calculator pages set context; shared components read it. Reduces prop drilling.
- **D-07:** Shared components are clinical-specific — built for clinical use (decimal keyboard, units display, large result typography). Not a generic component library. Both calculators use them directly, no wrapper layers.
- **D-08:** Vitest for unit and component tests. Playwright for e2e tests including a11y via axe-core. Same pattern as both existing apps.

### Claude's Discretion

- bits-ui component selection (which primitives to use for SelectPicker, Dialog, etc.)
- AboutSheet content structure (unified vs per-calculator via calculatorId prop)
- Exact disclaimer text wording
- Component file organization within `src/lib/shared/`
- Whether to add a `/dev` demo route for visual component testing

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SC-01 | Unified SelectPicker using native `<dialog>`, keyboard arrow-key navigation, optional option groups | bits-ui Select primitives; PERT reference implementation as keyboard nav base; formula reference for group rendering pattern |
| SC-02 | Shared DisclaimerModal with single acceptance persisted in localStorage (`nicu_assistant_disclaimer_v1`) | bits-ui Dialog primitives with `escapeKeydownBehavior="ignore"` and `interactOutsideBehavior="ignore"`; PERT DisclaimerModal as reference for native dialog approach |
| SC-03 | Shared NumericInput with decimal keyboard, wheel scroll support, min/max validation | Formula NumericInput reference implementation is fully reusable; Svelte action pattern for non-passive wheel events preserved |
| SC-04 | Shared ResultsDisplay with large clinical-grade typography and aria-live announcements | Formula ResultsDisplay reference; `aria-live="polite" aria-atomic="true"` pattern documented; needs token migration from hardcoded colors |
| SC-05 | Shared AboutSheet with per-calculator content via calculatorId prop | PERT AboutSheet uses native `<dialog>` (correct base); formula AboutSheet uses overlay div (migrate away); calculatorId prop selects content block |
| SC-06 | Focus management and ARIA roles/states across all shared components | bits-ui handles focus trapping and ARIA roles automatically; `onOpenAutoFocus` / `onCloseAutoFocus` hooks for custom focus restore |

</phase_requirements>

---

## Summary

Phase 2 builds five shared components (`SelectPicker`, `DisclaimerModal`, `NumericInput`, `ResultsDisplay`, `AboutSheet`) that live in `src/lib/shared/components/` and are consumed by both calculator routes in Phase 3. Three of the five components have high-fidelity reference implementations across the two existing apps; the merge strategy is well-understood from the Phase 1 pitfalls research.

The most consequential decision is the use of **bits-ui 2.16.5** (current stable, Svelte 5 native via `peerDependency: svelte >= 5.33.0`) for SelectPicker and DisclaimerModal. bits-ui provides headless, accessible primitives that handle keyboard navigation, focus trapping, scroll lock, and ARIA roles without bespoke code. The SelectPicker will use `Select.Root` with `Select.Group`/`Select.GroupHeading` for optional manufacturer grouping, styled entirely with Tailwind tokens. DisclaimerModal will use `Dialog.Root` with `escapeKeydownBehavior="ignore"` and `interactOutsideBehavior="ignore"` to prevent dismissal without explicit acknowledgment.

NumericInput, ResultsDisplay, and the structural pattern for AboutSheet can be ported directly from the formula-calculator reference with token migration (replacing hardcoded OKLCH literals and Tailwind color names with semantic CSS custom property utilities from Phase 1's `app.css`). The Phase 1 design system (`--color-surface`, `--color-accent`, `--color-error`, etc.) is already built and ready to consume.

**Primary recommendation:** Install bits-ui, implement SelectPicker and DisclaimerModal using its primitives, port NumericInput/ResultsDisplay/AboutSheet from formula-calculator with token substitution, then wire DisclaimerModal into `+layout.svelte` using `disclaimer.ts` singleton.

---

## Project Constraints (from CLAUDE.md)

These directives are binding on all implementation work in this phase:

- **Package manager:** `pnpm` — use `pnpm add`, not `npm install`
- **Tech stack:** SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 4 + TypeScript — no deviations
- **No native/Capacitor:** PWA only for v1
- **Accessibility:** WCAG 2.1 AA minimum, 48px touch targets, always-visible labels
- **Code reuse:** Port existing behavior from reference apps, do not rewrite from scratch
- **No additional UI component libraries:** bits-ui is the sole exception (explicitly decided in D-01); no Flowbite, shadcn, daisyUI
- **All interactivity as Svelte 5 runes:** `$state`, `$derived`, `$effect` — no Svelte 4 stores
- **GSD workflow enforcement:** All file changes through GSD commands

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bits-ui | ^2.16.5 | Headless accessible Select and Dialog primitives | Svelte 5 native (peer: svelte >=5.33.0); handles keyboard nav, focus trapping, ARIA roles, scroll lock — verified from official docs |
| Svelte 5 runes | project-inherited ^5.54.0 | `$state`, `$derived`, `$effect` for all component reactivity | Project constraint |
| Tailwind CSS 4 | project-inherited ^4.2.2 | Utility classes with OKLCH token references from Phase 1 `app.css` | Project constraint |
| @lucide/svelte | project-inherited ^1.7.0 | Icons in AboutSheet close button and ResultsDisplay decorations | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/svelte | ^5.3.1 | Component unit tests with jsdom | Vitest component tests for NumericInput validation, DisclaimerModal localStorage behavior |
| @axe-core/playwright | ^4.11.1 | Automated WCAG 2.1 AA scanning | Playwright e2e tests — scan each component in rendered app |
| @playwright/test | ^1.59.0 | E2E browser automation | Full interaction flows; keyboard nav validation; a11y scans |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bits-ui Select | Custom native `<dialog>` select (PERT pattern) | PERT's native `<dialog>` SelectPicker is good but requires writing keyboard nav, Home/End, arrow keys, group rendering manually. bits-ui provides all of this tested against WAI-ARIA spec. Worth the dependency for this component. |
| bits-ui Dialog | Native `<dialog>` (PERT pattern) | Native `<dialog>` works well for DisclaimerModal but `escapeKeydownBehavior` and `interactOutsideBehavior` control is cleaner via bits-ui than patching `cancel`/`close` event listeners manually. Low risk either way. |
| @testing-library/svelte | vitest-browser-svelte | vitest-browser-svelte runs in real browsers but requires Playwright browser setup for unit tests — adds CI complexity. @testing-library/svelte + jsdom is sufficient for logic/prop tests; e2e Playwright covers real-browser behavior. |

**Installation:**

```bash
pnpm add bits-ui
pnpm add -D @testing-library/svelte @axe-core/playwright @playwright/test
```

**Version verification (confirmed 2026-03-31):**

```bash
npm view bits-ui version        # 2.16.5
npm view @testing-library/svelte version   # 5.3.1
npm view @axe-core/playwright version      # 4.11.1
npm view @playwright/test version          # 1.59.0
```

---

## Architecture Patterns

### Component File Organization

```
src/lib/shared/
├── theme.svelte.ts        # Phase 1 — already exists
├── disclaimer.ts          # new — $state singleton for acknowledgment
├── about-sheet.ts         # new — event bus (open/close signal)
├── polyfills.ts           # new — dialog polyfill loader (port from pert-calculator)
└── components/
    ├── SelectPicker.svelte       # new — bits-ui Select base
    ├── DisclaimerModal.svelte    # new — bits-ui Dialog base
    ├── NumericInput.svelte       # new — port from formula-calculator
    ├── ResultsDisplay.svelte     # new — port from formula-calculator
    └── AboutSheet.svelte         # new — bits-ui Dialog base, per-calculator content
```

Note: Architecture research (ARCHITECTURE.md) shows `src/lib/shared/components/` as the canonical path. The `index.ts` at `src/lib/shared/index.ts` should re-export all public components.

### Pattern 1: bits-ui Select for SelectPicker (SC-01)

**What:** `Select.Root` wraps the trigger button and portal content. `Select.Group`/`Select.GroupHeading` provide optional manufacturer grouping. Trigger button displays the selected label (derived from `value`). Options rendered inside `Select.Viewport`.

**When to use:** This is the only SelectPicker implementation. No alternative path.

**Prop API (unified, resolves the two-app divergence):**

```typescript
// The unified option shape — matches PERT's {value, label} but adds optional group
// Formula's data uses {id, label, group} — data layer converts id→value in formula-config.ts
interface SelectOption {
  value: string;   // was `id` in formula — fixed in data layer, not here
  label: string;
  group?: string;  // optional — PERT uses no groups; formula uses manufacturer groups
}
```

**Complete anatomy:**

```svelte
<!-- Source: https://bits-ui.com/docs/components/select -->
<script lang="ts">
  import { Select } from 'bits-ui';
  import { getContext } from 'svelte';

  let {
    label,
    value = $bindable(),
    options,
    placeholder = 'Select...',
    class: className = '',
  }: {
    label: string;
    value: string;
    options: SelectOption[];
    placeholder?: string;
    class?: string;
  } = $props();

  // Derive groups from options (empty array = no grouping → flat list)
  const groups = $derived([...new Set(options.map(o => o.group).filter(Boolean))] as string[]);
  const hasGroups = $derived(groups.length > 0);

  const selectedLabel = $derived(options.find(o => o.value === value)?.label ?? placeholder);

  // Calculator accent color from Svelte context (D-06)
  const accentColor = getContext<string>('accentColor') ?? 'var(--color-accent)';
</script>

<Select.Root type="single" bind:value items={options}>
  <Select.Trigger
    class="flex min-h-[2.75rem] w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-card)] px-3.5 py-2.5 text-left text-[0.9375rem] font-medium text-[var(--color-text-primary)] ..."
    aria-label="{label}: {selectedLabel}"
  >
    {selectedLabel}
  </Select.Trigger>

  <Select.Portal>
    <Select.Content
      class="rounded-2xl bg-[var(--color-surface-card)] shadow-2xl border-0 ..."
      preventScroll={true}
    >
      <Select.Viewport class="max-h-[70svh] overflow-y-auto px-2 py-2">
        {#if hasGroups}
          {#each groups as group}
            <Select.Group>
              <Select.GroupHeading class="px-4 py-2 text-2xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)] sticky top-0 bg-[var(--color-surface-card)]">
                {group}
              </Select.GroupHeading>
              {#each options.filter(o => o.group === group) as option}
                <Select.Item value={option.value} label={option.label}
                  class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm ..."
                >
                  {option.label}
                </Select.Item>
              {/each}
            </Select.Group>
          {/each}
        {:else}
          {#each options as option}
            <Select.Item value={option.value} label={option.label} ...>
              {option.label}
            </Select.Item>
          {/each}
        {/if}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

**Key bits-ui behaviors inherited automatically:**
- Arrow Up/Down keyboard navigation (WAI-ARIA Select pattern)
- Home/End to jump to first/last item
- Enter to select highlighted item
- Escape to close
- `preventScroll={true}` prevents body scroll leak (replaces formula's `document.body.style.overflow = 'hidden'` hack)
- Focus returns to trigger on close
- `aria-expanded`, `aria-haspopup`, `aria-selected` managed automatically

### Pattern 2: bits-ui Dialog for DisclaimerModal (SC-02)

**What:** `Dialog.Root` with controlled `open` state from `disclaimer.ts` singleton. `escapeKeydownBehavior="ignore"` and `interactOutsideBehavior="ignore"` prevent any dismissal except the explicit acknowledgment button. `onCloseAutoFocus` not needed (modal is non-dismissable until acknowledged; after acknowledge the whole app becomes interactive).

```svelte
<!-- Source: https://bits-ui.com/docs/components/dialog -->
<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { disclaimer } from '$lib/shared/disclaimer.js';

  // disclaimer.acknowledged is the reactive source of truth
  // This component mounts in +layout.svelte only when !disclaimer.acknowledged
</script>

<Dialog.Root open={!disclaimer.acknowledged} onOpenChange={() => {}}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm" />
    <Dialog.Content
      escapeKeydownBehavior="ignore"
      interactOutsideBehavior="ignore"
      class="disclaimer-content fixed left-1/2 bottom-0 sm:bottom-auto sm:top-1/2 -translate-x-1/2 sm:-translate-y-1/2 w-[min(32rem,calc(100vw-1rem))] rounded-2xl bg-[var(--color-surface-card)] px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 shadow-2xl"
      aria-labelledby="disclaimer-title"
      aria-describedby="disclaimer-body"
    >
      <Dialog.Title id="disclaimer-title" class="text-xl font-semibold text-[var(--color-text-primary)]">
        Clinical Disclaimer
      </Dialog.Title>
      <Dialog.Description id="disclaimer-body" class="text-base leading-6 text-[var(--color-text-secondary)]">
        <!-- disclaimer text (D-03: Claude-drafted combined PERT + formula disclaimer) -->
      </Dialog.Description>
      <!-- No Dialog.Close — replaced by explicit acknowledgment button -->
      <button
        type="button"
        onclick={() => disclaimer.acknowledge()}
        class="min-h-[3.25rem] w-full rounded-[0.625rem] bg-[var(--color-accent)] text-white font-semibold ..."
      >
        I Understand — Continue
      </button>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**`disclaimer.ts` singleton:**

```typescript
// src/lib/shared/disclaimer.ts
// Svelte 5 $state singleton — same pattern as theme.svelte.ts
const DISCLAIMER_KEY = 'nicu_assistant_disclaimer_v1';

let _acknowledged = $state(false);

export const disclaimer = {
  get acknowledged(): boolean { return _acknowledged; },
  init(): void {
    _acknowledged = localStorage.getItem(DISCLAIMER_KEY) === 'true';
  },
  acknowledge(): void {
    _acknowledged = true;
    try {
      localStorage.setItem(DISCLAIMER_KEY, 'true');
    } catch { /* private browsing */ }
  }
};
```

Note: This file must use the `.svelte.ts` extension for `$state` to compile.

### Pattern 3: NumericInput Port (SC-03)

**What:** Direct port from `formula-calculator/src/lib/components/NumericInput.svelte` with two changes: (1) token migration — replace hardcoded colors with CSS custom property utilities, (2) satisfy the 48px min-height constraint already in `app.css`'s `button, select, input { @apply min-h-[48px] }`.

**Key behaviors to preserve exactly:**
- `inputmode="decimal"` for mobile decimal keyboard
- Svelte action `setupWheel` using `{ passive: false }` — non-passive is required to `preventDefault()` scroll
- Clamp to min/max on `blur`, not on every keystroke (allows typing mid-range values)
- `parseFloat` on `input` event (not `change`) for live updating
- `null` value when field is empty (distinguishes "not entered" from `0`)
- Spinner arrows hidden via CSS (`-webkit-appearance: none`, `appearance: textfield`)
- `aria-invalid`, `aria-describedby` for error linkage

**Token mapping (formula → unified):**

| Formula hardcode | Unified token |
|-----------------|---------------|
| `bg-white` | `bg-[var(--color-surface-card)]` |
| `border-slate-200` | `border-[var(--color-border)]` |
| `focus:border-clinical-500` | `focus:border-[var(--color-accent)]` |
| `focus:ring-clinical-500/20` | `focus:ring-[var(--color-accent-light)]` |
| `text-slate-900` | `text-[var(--color-text-primary)]` |
| `text-slate-600` | `text-[var(--color-text-secondary)]` |
| `text-red-600` | `text-[var(--color-error)]` |
| `border-red-500` | `border-[var(--color-error)]` |
| `ring-red-500` | `ring-[var(--color-error)]` |

### Pattern 4: ResultsDisplay Port (SC-04)

**What:** Port from `formula-calculator/src/lib/components/ResultsDisplay.svelte` with: (1) token migration, (2) generalize props for both PERT (capsule count) and formula (waterMl/powderG) use cases, (3) preserve `aria-live="polite" aria-atomic="true"` exactly.

**Current formula props are too formula-specific:**
```typescript
// Current (formula-specific)
{ waterMl, powderG, isVisible, liquidLabel, mode }
```

**Unified API design (Claude's discretion):**
```typescript
// Unified — generic enough for PERT (one value) and formula (two values)
{
  primaryValue: string;     // formatted display value (e.g. "3" capsules, "45.2" grams)
  primaryUnit: string;      // label after the number (e.g. "capsules", "grams")
  primaryLabel: string;     // eyebrow label (e.g. "Capsule Dose", "Required Powder")
  secondaryValue?: string;  // optional second card (formula water volume)
  secondaryUnit?: string;
  secondaryLabel?: string;
  isVisible?: boolean;      // hide until inputs are valid
  accentVariant?: 'clinical' | 'bmf'; // drives card background via context or prop
}
```

**Mandatory ARIA pattern (SC-04 requirement):**
```svelte
<div
  aria-live="polite"
  aria-atomic="true"
  aria-label="Result: {primaryValue} {primaryUnit}"
>
  <!-- result card content -->
</div>
```

**Pulse animation:** Preserve the `{#key pulseTrigger}` pattern from formula — it re-runs the CSS keyframe animation on value change without an imperative `$effect` side effect.

### Pattern 5: AboutSheet with calculatorId prop (SC-05)

**What:** Unified sheet using bits-ui Dialog (slide-in panel from right on desktop, bottom sheet on mobile). Content block selected by `calculatorId` prop. Focus restores to the trigger button that opened it via `onCloseAutoFocus`.

**Why bits-ui Dialog over native `<dialog>` (Claude's discretion):**
The PERT AboutSheet uses native `<dialog>` with `showModal()` which creates a center-screen modal — not a side sheet. The formula AboutSheet uses a fixed overlay div with slide transition. bits-ui Dialog provides the correct compound structure (`Portal`, `Overlay`, `Content`) without baking in any specific position, so we can style it as a side sheet with `class` on `Dialog.Content`.

**Per-calculator content approach:**
```svelte
<script lang="ts">
  import { Dialog } from 'bits-ui';

  let { calculatorId }: { calculatorId: 'pert' | 'formula' } = $props();

  // Content blocks defined inline or in a separate about-content.ts
  const content = {
    pert: { title: 'About PERT Dosing Calculator', body: '...' },
    formula: { title: 'About Formula Calculator', body: '...' }
  };
</script>
```

### Pattern 6: Svelte Context for Accent Color (D-06)

Calculator pages set context before rendering shared components. Shared components read it with `getContext`. This avoids passing `accentColor` through every shared component as a prop.

```typescript
// In /pert/+page.svelte
import { setContext } from 'svelte';
setContext('calculatorAccent', 'var(--color-accent)');  // clinical blue

// In /formula/+page.svelte
setContext('calculatorAccent', 'var(--color-bmf-600)');  // BMF amber

// In any shared component
import { getContext } from 'svelte';
const accent = getContext<string>('calculatorAccent') ?? 'var(--color-accent)';
```

### Anti-Patterns to Avoid

- **Using formula's `document.body.style.overflow` mutation:** Eliminated by bits-ui's `preventScroll={true}` on `Select.Content`. Never use this pattern.
- **Intercepting `cancel`/`close` events on native `<dialog>` for DisclaimerModal:** bits-ui Dialog handles this via `escapeKeydownBehavior` and `interactOutsideBehavior`. No manual event patching needed.
- **Reusing either existing app's localStorage key for disclaimer:** Always use `nicu_assistant_disclaimer_v1`. The old keys (`disclaimer_acknowledged`, `formula_calculator_disclaimer_accepted_v1`) must never be read.
- **Hardcoded OKLCH colors in component class strings:** Every color must go through `var(--color-*)` custom properties. This is what makes dark mode work. If you see `oklch(...)` in a component class attribute, it's wrong.
- **Using `id` instead of `value` as the option key in SelectPicker:** The unified option shape uses `value`. Formula data must be migrated at the data layer (`formula-config.ts`), not by branching in the component.
- **Using `lucide-svelte` (Svelte 3/4 package):** The formula reference imports from `lucide-svelte`. In the unified app use `@lucide/svelte` (already installed). Update all icon imports during port.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard navigation in Select (arrow keys, Home, End, typeahead) | Custom `onkeydown` handler | bits-ui `Select.*` | bits-ui implements full WAI-ARIA Listbox pattern including typeahead; manual implementation risks missing edge cases (Home/End boundary wrap, RTL, screen reader interaction) |
| Focus trapping in modals | `tabindex` manipulation + keydown handler | bits-ui `Dialog.Content` | bits-ui uses Floating UI's focus trap which handles nested interactive elements, shadow DOM, and restoration correctly |
| Scroll lock when overlay open | `document.body.style.overflow = 'hidden'` | bits-ui `preventScroll={true}` | Formula's overflow approach leaks across SvelteKit route navigations (Pitfall 11); native solution is browser-managed |
| ARIA roles for listbox/option/combobox | Manual `role=` attributes | bits-ui auto-applies from WAI-ARIA spec | Incorrect role combinations fail axe-core; bits-ui is tested against ARIA Authoring Practices Guide |
| Backdrop + portal positioning | `fixed inset-0 z-50` div | bits-ui `Select.Portal` / `Dialog.Portal` | Portals render outside the component tree, avoiding z-index stacking context issues from parent elements |

**Key insight:** The formula-calculator's SelectPicker (overlay div approach) required 161 lines and still has a11y suppressions (`<!-- svelte-ignore a11y_click_events_have_key_events -->`). The bits-ui approach achieves the same result with fewer lines and zero ARIA violations.

---

## Common Pitfalls

### Pitfall 1: bits-ui Select uses WAI-ARIA `combobox` pattern — trigger keeps focus, items don't

**What goes wrong:** Developers expect `Select.Item` elements to receive DOM focus during keyboard navigation (like the PERT native dialog SelectPicker does). bits-ui Select follows the WAI-ARIA `combobox` pattern where the trigger button retains focus and `aria-activedescendant` tracks the highlighted item. This is correct ARIA but different from the PERT reference.

**Why it happens:** Two valid ARIA patterns exist for selects — focus moves to item (listbox pattern) vs. trigger keeps focus (combobox pattern). bits-ui uses combobox.

**How to avoid:** Do not try to manually `focus()` items inside `Select.Viewport`. Let bits-ui manage highlighting state. Screen readers receive correct feedback via `aria-activedescendant`.

**Warning signs:** If you see `option?.focus()` calls inside `Select.*` handlers, those are carry-overs from the PERT reference and must be removed.

### Pitfall 2: Token aliases in `app.css` use self-referential `var()` — classes work differently than expected

**What goes wrong:** In Phase 1's `app.css`, the `@theme` block maps semantic aliases like `--color-surface: var(--color-surface)`. This means Tailwind generates `bg-surface` as `background-color: var(--color-surface)` which resolves to the actual `:root` value. This works correctly — but developers unfamiliar with it may try to use `bg-[var(--color-surface)]` (arbitrary value syntax) inconsistently alongside `bg-surface` (token utility).

**How to avoid:** In component class attributes, use the generated utility class when one exists (e.g., `text-[var(--color-text-primary)]` if no `text-primary` alias is registered, or check if an alias exists first). When in doubt, `bg-[var(--color-surface-card)]` always works. Check `app.css` for which aliases are registered.

**Confirmed registered aliases (from Phase 1 `app.css`):** `surface`, `surface-alt`, `surface-card`, `border`, `accent`, `accent-light`, `error`, `error-light`, `text-primary`, `text-secondary`, `text-tertiary`.

### Pitfall 3: `.svelte.ts` extension is required for `$state` in non-component files

**What goes wrong:** Creating `disclaimer.ts` (not `.svelte.ts`) causes the Svelte compiler to reject `$state` syntax with a parse error.

**How to avoid:** All files using `$state`, `$derived`, or `$effect` outside `.svelte` components must use the `.svelte.ts` extension. The existing `theme.svelte.ts` is the correct pattern.

### Pitfall 4: DisclaimerModal mounted in `+layout.svelte` — `disclaimer.ts` init must happen in `onMount`

**What goes wrong:** If `disclaimer.init()` runs at module import time (top-level), it executes during SSR/prerender where `localStorage` is undefined. This crashes the static build.

**How to avoid:** Call `disclaimer.init()` inside `onMount` in `+layout.svelte`, alongside `theme.init()`. Both singletons read localStorage only after hydration.

```svelte
<!-- +layout.svelte -->
onMount(() => {
  theme.init();
  disclaimer.init();
});
```

### Pitfall 5: Formula's `NumericInput` uses `Math.random()` for default `id` — causes SSR hydration mismatch

**What goes wrong:** `id = Math.random().toString(36).substring(2, 9)` as a prop default generates a different value server-side vs. client-side, causing a hydration mismatch warning in SvelteKit (even with `ssr: false` in `+layout.ts`).

**How to avoid:** Use a deterministic id strategy. In Svelte 5, use a static counter:

```typescript
let idCounter = 0;
// In props:
let { id = `numeric-input-${++idCounter}` } = $props();
```

Or accept `id` as a required prop with no default (cleaner for a shared component library).

### Pitfall 6: bits-ui Dialog's `open` prop conflicts with conditional rendering in `+layout.svelte`

**What goes wrong:** Conditionally rendering `{#if !disclaimer.acknowledged}<DisclaimerModal />{/if}` causes bits-ui Dialog to animate in on mount with no exit animation (component is destroyed, not hidden). Alternatively, using `open={!disclaimer.acknowledged}` with the Dialog always mounted keeps the DOM node but toggles visibility — bits-ui handles transitions correctly this way.

**How to avoid:** Mount `DisclaimerModal` always in `+layout.svelte` and use `open={!disclaimer.acknowledged}` to control visibility. bits-ui Dialog applies its own enter/exit transitions. After acknowledgment, the Dialog content disappears but the wrapper remains (zero cost).

### Pitfall 7: `overscroll-contain` CSS is needed on Select option list to prevent touch scroll propagation

**What goes wrong:** On mobile, when the user scrolls the option list to the bottom, scroll propagation continues to the page behind the dialog. `preventScroll={true}` on `Select.Content` locks body scroll, but overscroll "bounce" on iOS can still briefly reveal content behind the sheet.

**How to avoid:** Add `overscroll-contain` on `Select.Viewport` (or the scrollable inner div). The formula SelectPicker already uses `overscroll-contain` on its scrollable div — this class must be preserved in the unified implementation.

---

## Code Examples

### bits-ui Select — minimal working example

```svelte
<!-- Source: https://bits-ui.com/docs/components/select -->
<script lang="ts">
  import { Select } from 'bits-ui';
  let value = $state('');
  const options = [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }];
  const selectedLabel = $derived(options.find(o => o.value === value)?.label ?? 'Select...');
</script>

<Select.Root type="single" bind:value items={options}>
  <Select.Trigger>{selectedLabel}</Select.Trigger>
  <Select.Portal>
    <Select.Content preventScroll={true}>
      <Select.Viewport>
        {#each options as opt}
          <Select.Item value={opt.value} label={opt.label}>{opt.label}</Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

### bits-ui Select — with groups

```svelte
<!-- Source: https://bits-ui.com/docs/components/select -->
<Select.Viewport>
  {#each manufacturerGroups as group}
    <Select.Group>
      <Select.GroupHeading>{group}</Select.GroupHeading>
      {#each options.filter(o => o.group === group) as opt}
        <Select.Item value={opt.value} label={opt.label}>{opt.label}</Select.Item>
      {/each}
    </Select.Group>
  {/each}
</Select.Viewport>
```

### bits-ui Dialog — non-dismissable modal

```svelte
<!-- Source: https://bits-ui.com/docs/components/dialog -->
<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      escapeKeydownBehavior="ignore"
      interactOutsideBehavior="ignore"
    >
      <Dialog.Title>Clinical Disclaimer</Dialog.Title>
      <Dialog.Description>...</Dialog.Description>
      <button onclick={handleAcknowledge}>I Understand</button>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### NumericInput — non-passive wheel event (Svelte action)

```svelte
<!-- Source: formula-calculator/src/lib/components/NumericInput.svelte (verified) -->
<script lang="ts">
  function setupWheel(node: HTMLInputElement) {
    const onWheel = (e: WheelEvent) => {
      if (!isFocused) return;
      e.preventDefault();  // requires non-passive listener
      const direction = e.deltaY > 0 ? -1 : 1;
      const current = value ?? 0;
      const next = parseFloat((current + direction * step).toFixed(1));
      if (next >= min && next <= max) value = next;
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return { destroy() { node.removeEventListener('wheel', onWheel); } };
  }
</script>
<input use:setupWheel inputmode="decimal" ... />
```

### ResultsDisplay — aria-live announcement

```svelte
<!-- Source: formula-calculator/src/lib/components/ResultsDisplay.svelte (verified) -->
<div
  aria-live="polite"
  aria-atomic="true"
  aria-label="Result: {primaryValue} {primaryUnit}"
>
  {#key pulseTrigger}
    <div class="pulse-container">
      <span class="text-display font-black num">{primaryValue}</span>
      <span>{primaryUnit}</span>
    </div>
  {/key}
</div>
```

### disclaimer.ts singleton (`.svelte.ts` required)

```typescript
// src/lib/shared/disclaimer.svelte.ts
const KEY = 'nicu_assistant_disclaimer_v1';  // D-05

let _acknowledged = $state(false);

export const disclaimer = {
  get acknowledged() { return _acknowledged; },
  init() { _acknowledged = localStorage.getItem(KEY) === 'true'; },
  acknowledge() {
    _acknowledged = true;
    try { localStorage.setItem(KEY, 'true'); } catch { /* ok */ }
  }
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.body.style.overflow = 'hidden'` for scroll lock | bits-ui `preventScroll={true}` / native `<dialog>` | bits-ui v2 | Eliminates Pitfall 11 (route-navigation leak) |
| `import { X } from 'lucide-svelte'` | `import { X } from '@lucide/svelte'` | 2024 (Svelte 5 release) | `lucide-svelte` is legacy; `@lucide/svelte` is the official Svelte 5 package |
| Svelte 4 `$: derived` reactive statements | Svelte 5 `$derived(...)` rune | Svelte 5.0 | All components must use runes; no `$:` statements |
| `<svelte:head>` Google Fonts link | `@fontsource/plus-jakarta-sans` (if self-hosting desired) | N/A | Plus Jakarta Sans is currently loaded via Google Fonts in Phase 1; no change needed for Phase 2 |

**Deprecated/outdated in reference implementations:**
- `lucide-svelte` imports in formula components — replace with `@lucide/svelte` during port
- `$props<{...}>()` generic syntax used in formula — valid in Svelte 5 but the canonical form is `$props()` with TypeScript annotation on the destructured type (both work; use whichever matches project style)
- `<!-- svelte-ignore a11y_click_events_have_key_events -->` suppressions in formula SelectPicker — these go away entirely with bits-ui

---

## Open Questions

1. **Disclaimer text wording**
   - What we know: Must cover both PERT enzyme dosing and infant formula recipe calculations in one statement. D-03 says Claude drafts it; D-04 says ship without clinical review gate.
   - What's unclear: The exact wording. Based on both existing apps' disclaimers: PERT covers clinical professional context; formula covers informational-only use.
   - Recommendation: Draft the text in this phase. Suggested: "This tool is intended for use by qualified healthcare professionals only. PERT dosing and formula recipe calculations are provided for reference and must be verified by a licensed clinician before clinical use. The authors assume no responsibility for errors or outcomes resulting from use of this tool."

2. **AboutSheet content for unified app**
   - What we know: `calculatorId` prop selects per-calculator content (Claude's discretion). PERT shows app description + clinical credits; formula shows brand counts + calculation method.
   - What's unclear: Whether to embed content in the component or import from calculator-specific config files.
   - Recommendation: Embed minimal content in `AboutSheet.svelte` keyed by `calculatorId`. Keep it simple for Phase 2; Phase 3 can enrich content when full clinical configs are available.

3. **bits-ui Select vs. native `<dialog>` for SelectPicker**
   - What we know: D-01 locks in bits-ui. But bits-ui Select uses combobox ARIA pattern (trigger retains focus); the PERT reference uses native dialog listbox (focus moves to items). Both are ARIA-valid.
   - What's unclear: Whether clinical screen reader users (VoiceOver/TalkBack) have a preference. The WAI-ARIA combobox pattern is more common in modern UI libraries and is what most AT users expect.
   - Recommendation: Proceed with bits-ui Select (combobox pattern). axe-core scan in Playwright will confirm WCAG compliance. No blocker.

4. **`/dev` demo route for visual component testing**
   - What we know: Listed as Claude's discretion.
   - Recommendation: Add a `src/routes/dev/+page.svelte` with all shared components rendered in both themes. Low cost, high debugging value. Gate with an env check (`import.meta.env.DEV`) so it doesn't appear in production builds.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tool | ✓ | v24.14.1 | — |
| pnpm | Package installation | ✓ | 10.33.0 | — |
| bits-ui | SelectPicker, DisclaimerModal, AboutSheet | ✗ (not yet installed) | — | Install: `pnpm add bits-ui` |
| @testing-library/svelte | Component unit tests | ✗ (not yet installed) | — | Install: `pnpm add -D @testing-library/svelte` |
| @playwright/test | E2E + axe-core tests | ✗ (not yet installed) | — | Install: `pnpm add -D @playwright/test` |
| @axe-core/playwright | WCAG automated scan | ✗ (not yet installed) | — | Install: `pnpm add -D @axe-core/playwright` |
| Playwright browsers | E2E test execution | ✗ (not yet installed) | — | `pnpm exec playwright install --with-deps chromium` |

**Missing dependencies with no fallback:**
- bits-ui — required for SelectPicker and DisclaimerModal (locked D-01). No fallback; must be installed in Wave 0.

**Missing dependencies with fallback:**
- Playwright / axe-core — a11y testing deferred to a test task; functional implementation can proceed without them, but the Wave that adds a11y tests must install them.

---

## Sources

### Primary (HIGH confidence)

- [bits-ui.com/docs/components/select](https://bits-ui.com/docs/components/select) — Select anatomy, props, keyboard navigation, grouping with `Select.Group`/`Select.GroupHeading`
- [bits-ui.com/docs/components/dialog](https://bits-ui.com/docs/components/dialog) — Dialog anatomy, `escapeKeydownBehavior`, `interactOutsideBehavior`, focus management hooks
- [bits-ui.com/docs/migration-guide](https://bits-ui.com/docs/migration-guide) — v1 breaking changes (Select `type` prop required, `Select.Value` removed, `Select.Portal` explicit)
- `npm view bits-ui version` → `2.16.5`, `npm view bits-ui peerDependencies` → `svelte: "^5.33.0"` — confirmed Svelte 5 compatibility
- Direct source inspection: `/mnt/data/src/pert-calculator/src/lib/components/SelectPicker.svelte` — keyboard nav reference, native `<dialog>` pattern
- Direct source inspection: `/mnt/data/src/formula-calculator/src/lib/components/NumericInput.svelte` — wheel action, validation logic, exact API
- Direct source inspection: `/mnt/data/src/formula-calculator/src/lib/components/ResultsDisplay.svelte` — aria-live pattern, pulse animation
- Direct source inspection: `/mnt/data/src/nicu-assistant/src/app.css` — Phase 1 OKLCH token system, registered semantic aliases

### Secondary (MEDIUM confidence)

- [svelte.dev/docs/svelte/testing](https://svelte.dev/docs/svelte/testing) — Official Vitest + jsdom setup recommendation; `@testing-library/svelte` endorsed path
- [playwright.dev/docs/accessibility-testing](https://playwright.dev/docs/accessibility-testing) — `@axe-core/playwright` + `AxeBuilder.withTags(['wcag21aa'])` pattern

### Tertiary (LOW confidence)

- WebSearch results for bits-ui Svelte 5 compatibility 2026 — corroborated by direct npm metadata verification

---

## Metadata

**Confidence breakdown:**

- bits-ui primitives (Select + Dialog): HIGH — directly verified from official docs + npm metadata
- SelectPicker unified prop API: HIGH — derived from source inspection of both reference implementations
- NumericInput/ResultsDisplay port: HIGH — source code directly inspected; changes are mechanical (token substitution)
- AboutSheet bits-ui approach: MEDIUM — logical inference from Dialog docs; no existing analog in reference apps
- Testing setup (Playwright + axe-core): MEDIUM — official docs verified; no Playwright config yet in project

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (bits-ui is actively developed; check for breaking changes before installing if >30 days have passed)
