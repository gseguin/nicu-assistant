## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: none

---

<!-- GSD:project-start source:PROJECT.md -->

## Project

**NICU Assistant**

A PWA that unifies the PERT dosing calculator and the infant formula recipe calculator into a single clinical tool for NICU staff. It reuses the business logic and UI components from the existing standalone apps (`pert-calculator/` and `formula-calculator/`) with a shared component library, responsive navigation, and a plugin-like architecture that makes adding new calculators straightforward.

**Core Value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context, using the same trusted interfaces they already know.

### Constraints

- **Tech stack**: SvelteKit 2 + Svelte 5 + Tailwind CSS 4 + Vite + pnpm — must match existing apps
- **No native**: PWA only, no Capacitor for v1
- **Offline-first**: All clinical data embedded at build time, service worker for caching
- **Accessibility**: WCAG 2.1 AA minimum, 48px touch targets, always-visible nav labels
- **Code reuse**: Port business logic from existing apps, don't rewrite calculation functions
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Inherited Stack (already decided)

| Technology               | Version     | Purpose                                   |
| ------------------------ | ----------- | ----------------------------------------- |
| SvelteKit                | ^2.55.0     | Application framework                     |
| Svelte (runes)           | ^5.55.0     | Component model                           |
| TypeScript               | ^5.9.3      | Type safety                               |
| Vite                     | ^7.x – ^8.x | Build tool (see note below)               |
| Tailwind CSS             | ^4.2.2      | Styling via `@tailwindcss/vite` plugin    |
| @vite-pwa/sveltekit      | ^1.1.0      | Service worker, manifest, offline caching |
| @sveltejs/adapter-static | ^3.0.10     | SPA output, `200.html` fallback           |
| Vitest                   | ^4.1.2      | Unit and component testing                |
| Playwright               | ^1.58.2     | E2E and PWA tests                         |
| pnpm                     | ^10.33.0    | Package manager                           |

## New Dependencies for Unification

### Navigation Icons

### Theme Management

### No Additional UI Component Libraries

## Shared Component Library Pattern

## Plugin-Like Calculator Registration

## Responsive Navigation

- `viewport-fit=cover` in the `<meta name="viewport">` tag (already standard for PWA installability on iOS).
- Bottom nav uses `pb-[env(safe-area-inset-bottom,0px)]` to clear the iOS home indicator.
- Touch targets: minimum 48px height for each tab item (WCAG 2.1 AA + clinical constraint).
- Always-visible labels: icon + text label, never icon-only (clinical trust requires labels).
- Active tab: distinct color, not just opacity change (color-blind accessible).

## Tailwind CSS 4 Dark Mode Configuration

## Full Dependency Additions

# Runtime additions to existing stack

# No other new runtime dependencies needed

# svelte-themes: NOT added (inline script approach)

# flowbite/shadcn/daisyUI: NOT added (custom components)

# turborepo/nx: NOT added (single-app $lib approach)

## Alternatives Considered

| Category            | Recommended                  | Alternative                             | Why Not                                                                                                                                                                     |
| ------------------- | ---------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Icons               | `@lucide/svelte`             | `lucide-svelte`                         | `lucide-svelte` is the Svelte 3/4 package; `@lucide/svelte` is the official Svelte 5 package. Both exist on npm; use the right one.                                         |
| Icons               | `@lucide/svelte`             | `heroicons` (manual SVG)                | Already in formula-calculator's package.json as lucide-svelte; consistency is more valuable than switching.                                                                 |
| Theme               | Inline script + `.svelte.ts` | `svelte-themes` ^2.0.10                 | Adds a dependency for ~20 lines of code. No server-side capability needed (adapter-static). In-house is more auditable for clinical tool.                                   |
| Theme               | Inline script + `.svelte.ts` | Cookie-based SSR                        | Requires a server — adapter-static SPA has no server. Overcomplicated.                                                                                                      |
| Shared components   | `$lib` within single app     | pnpm workspace monorepo                 | Monorepo adds Turborepo, changesets, workspace protocols, dual build steps. Single consumer = no monorepo benefit.                                                          |
| Shared components   | `$lib` within single app     | Published npm package                   | Publishing to npm (public or private) is excessive for one app.                                                                                                             |
| Component library   | Custom (merge existing)      | shadcn-svelte                           | shadcn/ui brings opinionated Radix-style components that fight clinical design. More dependencies, more surface area, less contrast control.                                |
| Calculator registry | TypeScript manifest array    | Dynamic imports (`import()`)            | Dynamic imports add code splitting complexity with no user-visible benefit; both calculators are small and always-needed. Manifest array is simpler and fully type-checked. |
| Nav layout          | CSS-only dual layout         | Two separate nav components, JS-toggled | Two mounted components waste memory and can cause layout shift during hydration. Single CSS-responsive component is simpler.                                                |

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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.

<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

## Design Context

### Users

NICU clinicians (dietitians, nurses, GI physicians) at point of care — the primary audience. Usage is quick, focused, and often one-handed on a mobile device in a busy clinical environment. Parents/caregivers managing medically complex infants at home are a secondary audience. Both need to get an accurate calculation result in seconds, then act on it. High-stakes, interruption-prone. A wrong value has real consequences.

### Brand Personality

**Precise. Calm. Trustworthy.**

The app should feel like a warm but precise clinical tool — not a cold instrument, not a soft consumer product. It earns trust through visual restraint, typographic precision, and zero noise. Authoritative without being cold. Professional but human. Quietly confident.

### Emotional Goals

- **Clinical confidence**: The output must feel authoritative. Users must trust the number without second-guessing.
- **Calm & focused**: No visual anxiety. A quiet UI that reduces cognitive load in high-pressure moments.
- **Certainty**: Zero doubt about what the result means or what to do next.

### Aesthetic Direction

- **Visual tone**: Warm clinical — slightly warmer neutrals than a pure hospital aesthetic, softer radius, approachable without being playful.
- **Color**: OKLCH color system. Clinical Blue (hue ~220) as precision accent. BMF Amber (hue ~60) for formula fortifier mode. Slate neutrals carry structure. Red reserved strictly for errors/warnings.
- **Typography**: Plus Jakarta Sans — professional, distinctive, highly legible. Large bold numerals for result values; everything else recedes. Tabular numerics for clinical outputs.
- **Theme**: Both light and dark mode, both feel intentional. Light is primary for bright NICU environments.
- **Anti-references**: NOT consumer health, NOT legacy EHR, NOT SaaS dashboards, NOT marketing pages, NOT baby/parenting apps, NOT invisible minimal.

### Design Principles

1. **The result is the interface.** The calculation output is the only thing that matters.
2. **Earn trust through restraint.** Remove decoration, reduce color, let precision speak.
3. **Mobile-first, one-hand-friendly.** 48px touch targets, safe-area padding, decimal keyboard.
4. **Warm restraint.** Slightly warmer than clinical, slightly cooler than consumer. No decoration without function.
5. **Accessibility is non-negotiable.** WCAG 2.1 AA contrast, visible focus states, ARIA labels, keyboard nav.
6. **Dark and light must both feel intentional.** Each mode designed for itself.

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
