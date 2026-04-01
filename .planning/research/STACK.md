# Technology Stack

**Project:** NICU Assistant — Unified Clinical PWA
**Researched:** 2026-03-31
**Stack focus:** Unification-specific patterns. Core stack (SvelteKit 2, Svelte 5, Tailwind 4, Vite, adapter-static, @vite-pwa/sveltekit, Vitest, Playwright) is inherited from both existing apps and is not re-litigated here.

---

## Inherited Stack (already decided)

These are locked in by both existing apps — no alternatives evaluated.

| Technology | Version | Purpose |
|------------|---------|---------|
| SvelteKit | ^2.55.0 | Application framework |
| Svelte (runes) | ^5.55.0 | Component model |
| TypeScript | ^5.9.3 | Type safety |
| Vite | ^7.x – ^8.x | Build tool (see note below) |
| Tailwind CSS | ^4.2.2 | Styling via `@tailwindcss/vite` plugin |
| @vite-pwa/sveltekit | ^1.1.0 | Service worker, manifest, offline caching |
| @sveltejs/adapter-static | ^3.0.10 | SPA output, `200.html` fallback |
| Vitest | ^4.1.2 | Unit and component testing |
| Playwright | ^1.58.2 | E2E and PWA tests |
| pnpm | ^10.33.0 | Package manager |

**Vite version note:** pert-calculator pins Vite ^7.3.1; formula-calculator uses ^8.0.3. Use ^7.x in the unified app to match the more conservative existing constraint. Upgrade to 8 in a dedicated step after both calculators are migrated.

---

## New Dependencies for Unification

These are the additions required to build the shell, navigation, theming, and plugin architecture.

### Navigation Icons

**Use `@lucide/svelte` ^0.577.0 (not `lucide-svelte`).**

Rationale: `lucide-svelte` targets Svelte 3/4 and maintains a legacy compatibility shim for Svelte 5. `@lucide/svelte` is the official Svelte 5-native package from the Lucide authors, uses `$props()` rune syntax natively, and has no compatibility layer overhead. formula-calculator already imports `lucide-svelte` at ^1.0.1 — this is the correct modern package name for Svelte 4 compatibility but it re-exports from `@lucide/svelte` internally. For a new greenfield project on Svelte 5, use the canonical Svelte 5 package directly.

Confidence: HIGH — verified from lucide.dev official docs and npm package pages.

```bash
pnpm add @lucide/svelte
```

Icons needed for navigation: `FlaskConical` (PERT), `Milk` (Formula), `Settings` or `Info` (future).

### Theme Management

**Do NOT use `svelte-themes` (^2.0.10) or any other theme library.**

Rationale: `svelte-themes` adds a dependency boundary for something trivially implementable with 20 lines in `app.html` + a `.svelte.ts` store. The project uses `adapter-static`, making the cookie-based SSR approach irrelevant — there is no server-side handler. The inline script in `app.html` is the canonical solution for static SPAs. Keeping this in-house means zero third-party dependency for a core shell concern.

Confidence: HIGH — documented pattern from Tailwind CSS v4 official docs and SvelteKit static adapter constraints.

**Implementation pattern:**

1. In `src/app.html`, add an inline `<script>` in `<head>` that reads `localStorage.theme` (or falls back to `prefers-color-scheme`) and immediately adds/removes the `dark` class on `<html>`.
2. In `src/app.css`, configure Tailwind's dark variant with `@custom-variant dark (&:where(.dark, .dark *))`.
3. A `.svelte.ts` module exports a reactive `theme` rune (`$state`) and a toggle function that mutates `localStorage` and `document.documentElement.classList` in sync.
4. Mount the toggle button in the shell's top/bottom nav.

This satisfies FOUC prevention (inline script runs before first paint), localStorage persistence, system-preference detection on first visit, and Tailwind CSS 4's class-based dark mode.

### No Additional UI Component Libraries

**Do not add Flowbite Svelte, shadcn-svelte, daisyUI, or any similar library.**

Rationale: Both existing apps deliberately avoided component libraries because clinical UIs need full control over contrast, spacing, and interaction semantics. The shared component library is `src/lib/components/` within this app — a straight merge of the deduplicated components from both existing apps. This is the same approach both apps already use, and it avoids any dependency that could introduce contrast or layout regressions in a WCAG-critical context.

Confidence: HIGH — consistent with explicit decisions documented in both apps' CLAUDE.md files and PROJECT.md.

---

## Shared Component Library Pattern

**Use SvelteKit's built-in `$lib` alias. No separate package, no monorepo.**

Rationale: The unified app is a single SvelteKit application, not a monorepo with published packages. `$lib` (maps to `src/lib/`) is the standard SvelteKit mechanism for shared modules and is exactly what both existing apps already use for their components. A monorepo or published workspace package would add Turborepo/changesets complexity for zero benefit — there is only one consumer.

Confidence: HIGH — directly documented in SvelteKit official docs (`svelte.dev/docs/kit/$lib`).

**Directory structure for shared components:**

```
src/lib/
  components/            # shared UI primitives (merged from both apps)
    SelectPicker.svelte
    NumericInput.svelte
    DisclaimerModal.svelte
    AboutSheet.svelte
    ResultsDisplay.svelte
  calculators/           # calculator-specific components
    pert/
      DosingCalculator.svelte
      dosing.ts
      medications.ts
      clinical-config.json
    formula/
      FormulaCalculator.svelte
      ModifiedFormulaCalculator.svelte
      BreastMilkFortifierCalculator.svelte
      BrandSelector.svelte
      formula.ts
      formula-config.ts
      formula-config.json
  registry.ts            # calculator registration manifest
  theme.svelte.ts        # reactive theme state
  navigation.ts          # nav item types and config
```

---

## Plugin-Like Calculator Registration

**Use a TypeScript manifest array + Svelte 5 `Component` type. No dynamic imports, no runtime registry.**

Rationale: The "plugin-like" requirement does not need runtime module loading. The goal is that adding calculator #3 requires touching only one file (`registry.ts`) and adding a route. SvelteKit's file-based routing already provides the route isolation; the registry provides the navigation manifest.

Confidence: HIGH — Svelte 5 `Component` type is documented in `svelte.dev/docs/svelte/typescript`. The pattern is native TypeScript + SvelteKit idioms, no experimental APIs.

**`src/lib/registry.ts` pattern:**

```typescript
import type { Component } from 'svelte';

export interface CalculatorMeta {
  id: string;              // used as route segment: /calculators/[id]
  label: string;           // nav label
  icon: Component;         // lucide-svelte icon component
  description: string;     // screen reader hint / tooltip
}

// Adding calculator N = append one entry here + create src/routes/calculators/[id]/
export const calculators: CalculatorMeta[] = [
  {
    id: 'pert',
    label: 'PERT',
    icon: FlaskConical,         // imported from @lucide/svelte
    description: 'PERT enzyme dosing calculator',
  },
  {
    id: 'formula',
    label: 'Formula',
    icon: Milk,
    description: 'Infant formula recipe calculator',
  },
];
```

The shell nav reads `calculators` to render tab items. Each calculator lives at `src/routes/calculators/[id]/+page.svelte`. The layout at `src/routes/calculators/+layout.svelte` renders the shell nav. This means the app shell never imports calculator components directly — it only knows about `CalculatorMeta`.

---

## Responsive Navigation

**CSS-only approach: `fixed bottom-0` on mobile, `sticky top-0` on desktop, Tailwind breakpoints for switching.**

Rationale: No JavaScript needed to determine layout. Tailwind's `md:` breakpoint (768px) is the switch point. The nav is a single Svelte component that renders differently at different widths — it does not conditionally mount two components, which would cause layout shift.

Confidence: HIGH for the CSS pattern; MEDIUM for the exact breakpoint (768px is standard but can be adjusted based on tested bedside device widths).

**Key implementation requirements:**

- `viewport-fit=cover` in the `<meta name="viewport">` tag (already standard for PWA installability on iOS).
- Bottom nav uses `pb-[env(safe-area-inset-bottom,0px)]` to clear the iOS home indicator.
- Touch targets: minimum 48px height for each tab item (WCAG 2.1 AA + clinical constraint).
- Always-visible labels: icon + text label, never icon-only (clinical trust requires labels).
- Active tab: distinct color, not just opacity change (color-blind accessible).

**Pattern:**

```html
<!-- AppNav.svelte: one component, two visual states -->
<nav class="
  fixed bottom-0 left-0 right-0 flex
  pb-[env(safe-area-inset-bottom,0px)]
  md:sticky md:top-0 md:bottom-auto md:pb-0
  border-t md:border-t-0 md:border-b
  bg-surface
">
  <!-- tab items -->
</nav>
```

---

## Tailwind CSS 4 Dark Mode Configuration

**Use `@custom-variant` class strategy. Define all color tokens as dual-value CSS custom properties inside `@theme`.**

Rationale: Tailwind CSS 4 removes `darkMode: 'class'` from config. The equivalent in CSS-first config is `@custom-variant dark (&:where(.dark, .dark *))`. This is the documented v4 approach from `tailwindcss.com/docs/dark-mode`. Defining colors as `@theme` CSS custom properties means each token has one dark and one light value, keeping theming co-located with the token definition rather than scattered across components.

Confidence: HIGH — verified from official Tailwind CSS v4 documentation.

**`src/app.css` pattern:**

```css
@import "tailwindcss";

/* Override dark variant to use .dark class on <html> */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Shared Clinical Blue palette — both modes */
  --color-primary:        oklch(52% 0.18 243);   /* light */
  --color-primary-dark:   oklch(68% 0.16 243);   /* dark mode accent */

  /* Surface tokens — switch per mode in @layer base */
  --color-surface:        oklch(100% 0 0);
  --color-surface-alt:    oklch(97% 0 0);
  --color-on-surface:     oklch(15% 0 0);

  /* BMF Amber — formula calculator only, but registered globally */
  --color-amber:          oklch(72% 0.14 70);

  /* Typography */
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
}

@layer base {
  .dark {
    --color-surface:     oklch(15% 0.01 243);
    --color-surface-alt: oklch(20% 0.01 243);
    --color-on-surface:  oklch(93% 0 0);
  }
}
```

This lets every component use `bg-surface`, `text-on-surface`, etc., and the dark mode switch happens in one place.

---

## Full Dependency Additions

```bash
# Runtime additions to existing stack
pnpm add @lucide/svelte

# No other new runtime dependencies needed
# svelte-themes: NOT added (inline script approach)
# flowbite/shadcn/daisyUI: NOT added (custom components)
# turborepo/nx: NOT added (single-app $lib approach)
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Icons | `@lucide/svelte` | `lucide-svelte` | `lucide-svelte` is the Svelte 3/4 package; `@lucide/svelte` is the official Svelte 5 package. Both exist on npm; use the right one. |
| Icons | `@lucide/svelte` | `heroicons` (manual SVG) | Already in formula-calculator's package.json as lucide-svelte; consistency is more valuable than switching. |
| Theme | Inline script + `.svelte.ts` | `svelte-themes` ^2.0.10 | Adds a dependency for ~20 lines of code. No server-side capability needed (adapter-static). In-house is more auditable for clinical tool. |
| Theme | Inline script + `.svelte.ts` | Cookie-based SSR | Requires a server — adapter-static SPA has no server. Overcomplicated. |
| Shared components | `$lib` within single app | pnpm workspace monorepo | Monorepo adds Turborepo, changesets, workspace protocols, dual build steps. Single consumer = no monorepo benefit. |
| Shared components | `$lib` within single app | Published npm package | Publishing to npm (public or private) is excessive for one app. |
| Component library | Custom (merge existing) | shadcn-svelte | shadcn/ui brings opinionated Radix-style components that fight clinical design. More dependencies, more surface area, less contrast control. |
| Calculator registry | TypeScript manifest array | Dynamic imports (`import()`) | Dynamic imports add code splitting complexity with no user-visible benefit; both calculators are small and always-needed. Manifest array is simpler and fully type-checked. |
| Nav layout | CSS-only dual layout | Two separate nav components, JS-toggled | Two mounted components waste memory and can cause layout shift during hydration. Single CSS-responsive component is simpler. |

---

## Sources

- Tailwind CSS v4 dark mode docs: https://tailwindcss.com/docs/dark-mode
- `@lucide/svelte` official guide: https://lucide.dev/guide/packages/lucide-svelte
- Svelte 5 `Component` type: https://svelte.dev/docs/svelte/typescript
- SvelteKit `$lib` alias: https://svelte.dev/docs/kit/$lib
- Svelte 5 global state patterns: https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/
- `@vite-pwa/sveltekit` v1.1.0 releases: https://github.com/vite-pwa/sveltekit/releases
- Safe area insets for iOS PWA: https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08
- CSS env() MDN reference: https://developer.mozilla.org/en-US/docs/Web/CSS/env
- svelte-themes (considered but rejected): https://github.com/beynar/svelte-themes
- SvelteKit adapter-static dark mode FOUC: https://dev.to/willkre/persistent-theme-switch-dark-mode-with-svelte-sveltekit-tailwind-1b9g
