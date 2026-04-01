# Architecture Patterns

**Domain:** Multi-calculator clinical PWA (SvelteKit 2 + Svelte 5 runes + Tailwind CSS 4)
**Researched:** 2026-03-31
**Overall confidence:** HIGH — based on direct inspection of both existing codebases plus official SvelteKit docs

---

## Recommended Architecture

```
SHELL LAYER (root layout)
  ├── PWA bootstrap (SW registration, polyfills)
  ├── Disclaimer gate (single shared, persisted in localStorage)
  ├── Theme provider (dark/light token injection via data-theme)
  ├── Responsive nav shell (bottom tab bar / top nav bar)
  └── CALCULATOR LAYER (route-per-calculator)
        ├── /pert          → PERT DosingCalculator + business logic
        └── /formula       → Formula FormulaCalculator + business logic
```

The shell and the calculators are strict layers. The shell knows about calculators only through a static registry. Calculators know nothing about the shell — they receive context via Svelte `getContext` for theme and the about/disclaimer signals only.

---

## Component Boundaries

| Component | Location | Responsibility | Communicates With |
|-----------|----------|---------------|-------------------|
| `+layout.svelte` (root) | `src/routes/` | PWA init, disclaimer gate, theme injection, nav shell render | Nav registry (read-only import), disclaimer state module |
| `+layout.ts` (root) | `src/routes/` | `prerender = true; ssr = false` — identical to both existing apps | Build system only |
| `NavShell.svelte` | `src/lib/shell/` | Responsive navigation: bottom bar on mobile, top bar on desktop. Driven by `CALCULATOR_REGISTRY`. | Root layout (renders inside it); links to SvelteKit routes |
| `DisclaimerModal.svelte` | `src/lib/shared/components/` | Modal gate shown before app is usable. Non-dismissable until acknowledged. | Root layout only (via `onAcknowledge` prop) |
| `AboutSheet.svelte` | `src/lib/shared/components/` | Slide-up reference sheet with app version and clinical credits. | Root layout (open/close state); each calculator page triggers open via `about-sheet.ts` event bus |
| `SelectPicker.svelte` | `src/lib/shared/components/` | Accessible bottom-sheet option picker (native `<dialog>`). Used by both calculators. | Parent component via `bind:value` |
| `NumericInput.svelte` | `src/lib/shared/components/` | Validated numeric text input with label, error slot. Used by formula calculator. | Parent component via `bind:value`, `error` prop |
| `ResultsDisplay.svelte` | `src/lib/shared/components/` | Consistent result card layout (label + value). Used by formula calculator results. | Parent component via props |
| `CALCULATOR_REGISTRY` | `src/lib/shell/registry.ts` | Static array of `CalculatorEntry` objects. Defines id, label, icon, href, color accent for nav. | Root layout, NavShell (import only — no runtime writes) |
| `DosingCalculator.svelte` | `src/lib/calculators/pert/` | Full PERT dosing UI (meal + tube-feed modes). Self-contained. | Shared components (SelectPicker); business logic in `dosing.ts` |
| `dosing.ts` + `medications.ts` | `src/lib/calculators/pert/` | Pure PERT calculation functions and FDA medication data. No Svelte imports. | DosingCalculator only |
| `FormulaCalculator.svelte` | `src/lib/calculators/formula/` | Container for formula mode tabs. Renders sub-calculators. | Shared components; business logic in `formula.ts` |
| `ModifiedFormulaCalculator.svelte` | `src/lib/calculators/formula/` | Modified formula mode UI. | Shared components; formula.ts |
| `BreastMilkFortifierCalculator.svelte` | `src/lib/calculators/formula/` | BMF mode UI. | Shared components; formula.ts |
| `BrandSelector.svelte` | `src/lib/calculators/formula/` | Formula-specific brand picker with manufacturer grouping. | SelectPicker (shared); formula-config.ts |
| `formula.ts` + `formula-config.ts` | `src/lib/calculators/formula/` | Pure formula calculations and brand config validation. No Svelte imports. | Formula calculators only |
| `theme.ts` | `src/lib/shared/` | Writable `$state` singleton: current theme (`'light' \| 'dark'`). Reads/writes `localStorage`. Applies `data-theme` to `<html>`. | Root layout (init), theme toggle button |
| `disclaimer.ts` | `src/lib/shared/` | Writable `$state` singleton: `acknowledged: boolean`. Reads/writes `localStorage`. Key: `nicu_assistant_disclaimer_v1`. | Root layout only |
| `about-sheet.ts` | `src/lib/shared/` | Thin event-bus (identical pattern to existing pert-calculator). Lets calculator pages request AboutSheet open without prop-drilling through the nav shell. | Root layout (register handler), calculator pages (request open) |

---

## Directory Layout

```
src/
├── app.css                        # @import tailwindcss + @theme tokens (shared palette, typography)
├── app.html
├── app.d.ts
├── routes/
│   ├── +layout.svelte             # Shell: PWA init, disclaimer gate, theme, NavShell
│   ├── +layout.ts                 # prerender=true, ssr=false
│   ├── +page.svelte               # Redirect → /pert (or splash, then redirect)
│   ├── pert/
│   │   └── +page.svelte           # Mounts DosingCalculator
│   └── formula/
│       └── +page.svelte           # Mounts FormulaCalculator
└── lib/
    ├── shared/
    │   ├── components/
    │   │   ├── DisclaimerModal.svelte
    │   │   ├── AboutSheet.svelte
    │   │   ├── SelectPicker.svelte
    │   │   ├── NumericInput.svelte
    │   │   └── ResultsDisplay.svelte
    │   ├── theme.ts               # $state singleton — theme
    │   ├── disclaimer.ts          # $state singleton — disclaimer acknowledged
    │   ├── about-sheet.ts         # Event bus — open/close AboutSheet
    │   └── polyfills.ts           # dialog polyfill loader (from pert-calculator)
    ├── shell/
    │   ├── NavShell.svelte        # Responsive nav: bottom bar mobile / top bar desktop
    │   └── registry.ts            # CALCULATOR_REGISTRY constant (no runtime writes)
    └── calculators/
        ├── pert/
        │   ├── DosingCalculator.svelte
        │   ├── dosing.ts
        │   ├── medications.ts
        │   ├── clinical-config.ts
        │   └── clinical-config.json
        └── formula/
            ├── FormulaCalculator.svelte
            ├── ModifiedFormulaCalculator.svelte
            ├── BreastMilkFortifierCalculator.svelte
            ├── BrandSelector.svelte
            ├── formula.ts
            ├── formula-config.ts
            └── formula-config.json
```

---

## Plugin-Like Calculator Registration System

### Pattern: Static Registry + Filesystem Routes

"Plugin-like" in this context means: adding a new calculator requires touching exactly two things — the registry file and a new route directory. No changes to the shell, layout, or any existing calculator.

```typescript
// src/lib/shell/registry.ts

export interface CalculatorEntry {
  /** Stable identifier — must match the route path segment */
  id: string;
  /** Display label shown in nav bar */
  label: string;
  /** Path as SvelteKit href (e.g. '/pert') */
  href: string;
  /** Lucide icon name or inline SVG path for nav tab icon */
  icon: string;
  /** Optional: calculator-specific accent color override (CSS custom property value).
   *  If omitted, inherits the default clinical-blue accent.
   *  Used for BMF amber accent on the formula calculator tab. */
  accentColor?: string;
}

export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  {
    id: 'pert',
    label: 'PERT',
    href: '/pert',
    icon: 'pill',
  },
  {
    id: 'formula',
    label: 'Formula',
    href: '/formula',
    icon: 'flask-conical',
  }
] as const;
```

The `NavShell` iterates this array to render tabs. The root layout imports `CALCULATOR_REGISTRY` once. To add a third calculator:
1. Add an entry to `CALCULATOR_REGISTRY`.
2. Create `src/routes/new-calc/+page.svelte` that mounts the calculator component.
3. Add calculator source under `src/lib/calculators/new-calc/`.

### Why not a dynamic plugin system with runtime registration?

The app is adapter-static with `prerender = true`. There is no runtime server. Dynamic plugin registration (lazy-loaded manifests, registry stores written at runtime) would add complexity with no benefit in a static SPA with a known, finite set of tools. The static registry is the correct tradeoff.

---

## Data Flow

### Disclaimer Gate Flow

```
App load
  → root layout onMount
  → reads localStorage key "nicu_assistant_disclaimer_v1"
  → disclaimer.ts sets acknowledged = true/false
  → if false: renders DisclaimerModal (blocks all content)
  → user clicks "Understood"
  → disclaimer.ts sets acknowledged = true, writes localStorage
  → DisclaimerModal unmounts, app becomes interactive
```

The disclaimer key is unified: one key covers all calculators. Neither pert-calculator's `'disclaimer_acknowledged'` nor formula-calculator's `'formula_calculator_disclaimer_accepted_v1'` key is reused — both are renamed on migration to avoid inheriting stale acceptances from the old standalone apps.

### Theme Flow

```
App load
  → root layout onMount
  → theme.ts reads localStorage key "nicu_assistant_theme"
  → if unset: detect prefers-color-scheme
  → applies data-theme="light"|"dark" to <html>
  → Tailwind CSS 4 @theme tokens respond to [data-theme="dark"] selector
  → User toggles theme button
  → theme.ts updates $state + localStorage + data-theme attribute
```

The `data-theme` attribute approach (rather than CSS `prefers-color-scheme` media query alone) is required because the user can override the system preference. Both existing apps use CSS custom property tokens; the unified app extends this pattern.

### Calculator State Flow (per-calculator, isolated)

```
User navigates to /pert
  → +page.svelte mounts DosingCalculator.svelte
  → DosingCalculator manages its own $state (fatGrams, lipaseRate, medication, mode)
  → $derived computes result
  → No state escapes to shell or other calculators
  → User navigates to /formula
  → SvelteKit replaces the route component
  → PERT $state is garbage-collected
  → FormulaCalculator mounts with its own fresh $state
```

Calculator state is ephemeral: it lives only for the duration of the route visit. This is intentional for a clinical tool — each calculation is independent. Persistent state (disclaimer, theme) is handled by the shared singletons in `src/lib/shared/`.

### About Sheet Flow (event bus, identical to existing pert-calculator pattern)

```
Root layout registers openAbout handler in about-sheet.ts
Calculator page header button calls requestOpenAbout()
about-sheet.ts invokes the registered handler
Root layout sets aboutOpen = true → renders AboutSheet
```

This avoids prop-drilling the open handler through the nav shell into every calculator. The same module-level event bus pattern already exists in `pert-calculator/src/lib/about-sheet.ts` and can be copied directly.

---

## Patterns to Follow

### Pattern 1: Svelte 5 Runes for Shared Singleton State

For client-only (no SSR) state that must persist across navigation, use a `$state` object exported from a `.svelte.ts` module:

```typescript
// src/lib/shared/theme.ts
let _theme = $state<'light' | 'dark'>('light');

export const theme = {
  get current() { return _theme; },
  set(value: 'light' | 'dark') {
    _theme = value;
    localStorage.setItem('nicu_assistant_theme', value);
    document.documentElement.setAttribute('data-theme', value);
  },
  init() {
    const stored = localStorage.getItem('nicu_assistant_theme');
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    theme.set((stored as 'light' | 'dark') ?? preferred);
  }
};
```

The getter/setter wrapper is required because directly exporting a `let x = $state(...)` variable freezes the value at import time. The object wrapper preserves reactivity. This follows the pattern recommended by the Svelte core team (mainmatter.com, 2025).

The `.svelte.ts` file extension is required for runes in non-component files — the Svelte compiler only processes rune syntax in `.svelte` and `.svelte.ts` files.

### Pattern 2: Pure Calculation Functions, Zero Side Effects

Both existing apps already follow this correctly: business logic lives in plain `.ts` files (`dosing.ts`, `formula.ts`) with no Svelte imports, no `$state`, no `$effect`. These files can be unit-tested with Vitest in isolation. This pattern must be maintained in the unified app.

```typescript
// Pure — no side effects, fully testable
export function calculateCapsules(fatGrams: number, lipaseRate: number, strength: number): number
```

### Pattern 3: Native `<dialog>` for All Modals and Pickers

Both apps use native `<dialog>` elements with `showModal()` / `close()`. This eliminates third-party modal library dependencies, provides native backdrop and focus-trap behavior, and is directly compatible with the existing dialog polyfill (`polyfills.ts`). Continue this pattern for DisclaimerModal and SelectPicker in the shared library.

### Pattern 4: Responsive Nav via Tailwind Breakpoint Classes

The bottom-mobile / top-desktop pattern uses a single `NavShell` component with Tailwind responsive classes:

```svelte
<!-- Bottom bar: visible only on mobile -->
<nav class="fixed bottom-0 left-0 right-0 flex md:hidden ...">
  {#each CALCULATOR_REGISTRY as calc}
    <a href={calc.href} ...>{calc.label}</a>
  {/each}
</nav>

<!-- Top bar: visible only on tablet/desktop -->
<nav class="hidden md:flex fixed top-0 left-0 right-0 ...">
  {#each CALCULATOR_REGISTRY as calc}
    <a href={calc.href} ...>{calc.label}</a>
  {/each}
</nav>
```

The active tab is determined by comparing `calc.href` against SvelteKit's `$page.url.pathname`.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Per-Calculator Disclaimer Storage Keys

**What:** Reusing each existing app's disclaimer localStorage key (`'disclaimer_acknowledged'`, `'formula_calculator_disclaimer_accepted_v1'`).
**Why bad:** Users who previously used the standalone apps would skip the disclaimer on first launch of the unified app. The unified app is a new clinical tool with its own version history and should collect its own acceptance.
**Instead:** Use a single key `'nicu_assistant_disclaimer_v1'`. Bump the version suffix if disclaimer text changes.

### Anti-Pattern 2: Lifting Calculator State to Shell

**What:** Storing fatGrams, brandId, or any calculator-specific inputs in a module-level shared store accessible to the nav shell or root layout.
**Why bad:** Adds accidental complexity, creates coupling between calculators, and has no clinical value (each calculation is independent).
**Instead:** Calculator components own their own `$state`. State is ephemeral per navigation. If restore-on-back-navigation is ever needed, use SvelteKit snapshots.

### Anti-Pattern 3: Route Groups as Pseudo-Modules

**What:** Using SvelteKit route groups `(calculators)` as a way to "encapsulate" calculator layout logic.
**Why bad:** For this app, all calculators share the same shell layout (disclaimer, nav, theme). A route group would add a second layout file with no extra isolation benefit, creating two layout files to maintain.
**Instead:** One root layout wraps everything. Calculators are simple pages under `/pert` and `/formula`. Route groups would only be justified if a future calculator needed a fundamentally different shell (e.g., a full-screen immersive view without the tab bar).

### Anti-Pattern 4: Monorepo with `@sveltejs/package`

**What:** Splitting shared components into a separate `packages/ui` workspace package.
**Why bad:** This project is a single SvelteKit app, not multiple apps sharing a library. Package-based monorepo adds build tooling overhead (`svelte-package`, workspace symlinks, separate tsconfig) with no benefit when there is only one consumer.
**Instead:** Shared components live in `src/lib/shared/` as a structural convention, not a separate package. This is the correct SvelteKit idiom for shared code within one app.

### Anti-Pattern 5: Importing Calculator Components Across Calculators

**What:** Formula calculator importing a component from `$lib/calculators/pert/`.
**Why bad:** Breaks the calculator boundary. Calculators are independent units that happen to share the same shell; they must not depend on each other.
**Instead:** Any component needed by two calculators is promoted to `$lib/shared/components/`. Calculator-specific components stay in their own subtree.

---

## Theming Architecture

The unified app must support dark and light modes (PERT was dark-mode-first; formula was light-only). The two apps use different token naming conventions that must be unified.

### Recommended: CSS Custom Property Tokens + `data-theme` Attribute

```css
/* src/app.css */
@import "tailwindcss";

@theme {
  /* Expose tokens to Tailwind utility classes */
  --color-surface:      var(--color-surface);
  --color-surface-alt:  var(--color-surface-alt);
  --color-surface-card: var(--color-surface-card);
  --color-border:       var(--color-border);
  --color-accent:       var(--color-accent);
  --color-accent-light: var(--color-accent-light);
  /* ... etc */

  /* Clinical Blue scale (from formula-calculator, extends pert-calculator) */
  --color-clinical-50 through --color-clinical-900: (oklch values);

  /* BMF Amber scale (formula-calculator only, kept for formula route) */
  --color-bmf-50 through --color-bmf-900: (oklch values);

  /* Type scale */
  --text-2xs: 0.6875rem;
  --text-ui:  0.8125rem;
  --text-title: 1.375rem;
  --text-display: 2.75rem;

  /* Font */
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}

:root {
  /* Light mode tokens (default) */
  --color-surface: #f8fafc;
  --color-accent: oklch(49% 0.17 220);  /* clinical-600 */
  /* ... */
}

[data-theme="dark"] {
  --color-surface: #0f172a;
  --color-accent: oklch(68% 0.16 243);
  /* ... */
}
```

The PERT calculator used hardcoded hex values for dark-mode tokens. The formula calculator used oklch. The unified app standardizes on oklch throughout (formula-calculator convention), as oklch guarantees perceptual consistency that hex values do not.

---

## Scalability Considerations

| Concern | At 2 calculators (v1) | At 5+ calculators |
|---------|----------------------|-------------------|
| Nav bar items | 2 tabs — trivial | 5+ tabs: consider icon-only with tooltip on mobile, or a "More" overflow menu |
| Bundle size | Both calculators are always loaded | Consider `import()` lazy-loading calculator components at route level |
| Business logic isolation | Both `.ts` files in same lib tree | No change needed — already fully isolated |
| Shared state complexity | 2 singletons (theme, disclaimer) | Stays the same — only shell-level state is shared |
| About sheet content | Unified content | May need per-calculator sections — pass calculator id to AboutSheet |

For v1 (2 calculators), all calculator components can be eagerly loaded. Lazy-loading is premature optimization here given the small bundle size. If a third calculator is significantly larger (e.g., a growth chart with chart.js dependency), import it lazily at the route level using SvelteKit's built-in route-based code splitting.

---

## Build Order Implications

The architectural layering directly maps to a build sequence where each layer depends on the one below it:

1. **Design system layer** — `app.css` (unified tokens, typography, color palette). Nothing else can be styled until this exists.

2. **Shared component library** — `src/lib/shared/components/`: SelectPicker, NumericInput, DisclaimerModal, AboutSheet, ResultsDisplay. These are prerequisites for both calculator implementations.

3. **Shared state modules** — `theme.ts`, `disclaimer.ts`, `about-sheet.ts`, `polyfills.ts`. Prerequisites for the root layout.

4. **Calculator registry** — `src/lib/shell/registry.ts` (static constant). Prerequisite for NavShell.

5. **Nav shell component** — `NavShell.svelte`. Requires registry and design tokens.

6. **Root layout** — `+layout.svelte` + `+layout.ts`. Requires all shared state modules, DisclaimerModal, AboutSheet, NavShell.

7. **Calculator business logic** — `dosing.ts` / `formula.ts` (port from existing apps, add tests). Independent of all UI.

8. **Calculator UI components** — `DosingCalculator.svelte`, `FormulaCalculator.svelte` et al. Require shared components + business logic.

9. **Route pages** — `/pert/+page.svelte`, `/formula/+page.svelte`. Require calculator components + root layout.

10. **PWA configuration** — `vite.config.ts` (`@vite-pwa/sveltekit` manifest, Workbox cache config). Requires finalized route structure.

---

## Sources

- Direct inspection of `/mnt/data/src/pert-calculator/src/` and `/mnt/data/src/formula-calculator/src/` (HIGH confidence — authoritative)
- [SvelteKit Advanced Routing — Route Groups](https://svelte.dev/docs/kit/advanced-routing) (HIGH confidence — official docs)
- [SvelteKit State Management](https://svelte.dev/docs/kit/state-management) — confirms `$state` module singletons are safe in static/SPA adapters (HIGH confidence — official docs)
- [Global State in Svelte 5 — Mainmatter, 2025](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) — getter/setter wrapper pattern for exported `$state` (MEDIUM confidence — authoritative community source, verified against official docs)
- [SvelteKit Routing Tutorial — DEV Community](https://dev.to/a1guy/sveltekit-routing-tutorial-layouts-nested-routes-multi-page-apps-4bfm) (MEDIUM confidence — corroborates official docs)
