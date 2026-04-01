# Project Research Summary

**Project:** NICU Assistant — Unified Clinical PWA
**Domain:** Multi-calculator clinical PWA (SvelteKit 2 + Svelte 5 + Tailwind CSS 4)
**Researched:** 2026-03-31
**Confidence:** HIGH

## Executive Summary

NICU Assistant is a unified point-of-care PWA that merges two standalone clinical calculators (pert-calculator and formula-calculator) into a single installable application. The stack is already decided and locked — SvelteKit 2, Svelte 5 runes, Tailwind CSS 4, and `@vite-pwa/sveltekit` are inherited from both source apps and are not re-evaluated. The architecture is a two-layer shell-and-calculator model: a root layout that owns PWA bootstrap, the shared disclaimer gate, theme injection, and responsive navigation, with each calculator living at its own SvelteKit route (`/pert`, `/formula`). A static TypeScript registry (`CALCULATOR_REGISTRY`) is the only interface between the shell and the calculators — the shell knows about calculators via this manifest and nothing else. The single new runtime dependency is `@lucide/svelte` (the official Svelte 5-native icon package); no component library or theme library is added.

The recommended build approach is strictly bottom-up and follows the architectural dependency chain: design system tokens first, then shared UI components (merging and reconciling the divergent implementations from both source apps), then the shell and registry, then each calculator ported into the unified structure, and finally PWA configuration. The order is not negotiable — the theme system must exist before any component can be styled, and the shared component library must be settled before the calculators are ported. The largest risk in this project is component divergence: both apps have `SelectPicker`, `DisclaimerModal`, and theme systems that evolved independently and are architecturally incompatible. Merging them carelessly produces silent runtime breakage (wrong prop shapes, stale scroll locks, theme blind spots on the formula tab).

The key clinical risks are: stale cached data served after a silent service worker takeover (a dietitian acts on a corrected formula that the cached app has not received), and the well-documented pattern of clinical calculator apps silently accepting invalid inputs. Both are preventable — stale-data risk via `registerType: 'prompt'` with a visible update banner, and invalid-input risk by preserving all existing validation logic unchanged during the port and adding explicit edge-case tests. The app is a static SPA with no backend and no patient data — HIPAA surface area is zero, and authentication, telemetry, and push notifications are explicitly out of scope.

---

## Key Findings

### Recommended Stack

The core stack is inherited and non-negotiable. Only one new runtime dependency is added: `@lucide/svelte` (the official Svelte 5-native icon package, distinct from `lucide-svelte` which targets Svelte 3/4). Theme management, dark mode, and shared components are all implemented in-house — no third-party libraries are added for these concerns. Vite is pinned to `^7.x` to match the more conservative of the two existing constraints; the upgrade to `^8.x` is a separate post-migration step.

**Core technologies:**
- **SvelteKit ^2.55.0:** Application framework — locked by both source apps
- **Svelte 5 (runes) ^5.55.0:** Component model — `$state`, `$derived`, `$effect` used throughout; `.svelte.ts` extension required for rune singletons
- **TypeScript ^5.9.3:** Type safety — pure `.ts` files for all business logic, no Svelte imports
- **Tailwind CSS ^4.2.2:** Styling via `@tailwindcss/vite`; `@custom-variant dark` for class-based dark mode (replaces `darkMode: 'class'` from v3)
- **@vite-pwa/sveltekit ^1.1.0:** Service worker, precache manifest, offline support — `registerType: 'prompt'` required (not `'autoUpdate'`)
- **@sveltejs/adapter-static ^3.0.10:** SPA output with `200.html` fallback; `prerender = true; ssr = false` in root layout
- **@lucide/svelte ^0.577.0:** Navigation icons — the Svelte 5-native package (NOT `lucide-svelte`)
- **pnpm ^10.33.0:** Package manager

### Expected Features

**Must have (table stakes):**
- Responsive navigation — bottom tab bar on mobile, top bar on desktop; 48px touch targets, always-labeled tabs (icon + text)
- Single shared medical disclaimer — accepted once, persisted in `localStorage`, version-keyed `nicu_assistant:disclaimer:v1`
- Full offline operation — cache-first service worker; all clinical data is JSON-embedded at build time so offline is the natural state
- PWA installability — `display: standalone` manifest, deferred install prompt triggered after first successful calculation (not on first load)
- Dark and light theme toggle — `prefers-color-scheme` default, manual override, `localStorage` persistence; blocking inline script in `app.html` prevents FOUC
- Input validation with physiologic range enforcement — inline errors, block calculation on invalid/empty inputs, never silently treat empty as zero
- Real-time output synchronization — preserved via Svelte 5 `$derived` runes (already in both source apps, must not regress)
- Shared design system — unified Tailwind `@theme` tokens, Plus Jakarta Sans, 48px touch targets, Clinical Blue + BMF Amber palettes
- WCAG 2.1 AA accessibility — ARIA live regions for results, focus management, visible focus rings
- Service worker update notification — non-intrusive banner when new version is available, never auto-reload during active use

**Should have (competitive differentiators):**
- Plugin-like calculator registry — adding calculator N requires only appending to `CALCULATOR_REGISTRY` and creating a route directory
- Calculator context preservation on tab switch — conditional rendering (`display: none`) rather than unmounting, avoids re-entry errors
- Network status indicator — visible offline pill in nav bar, visible only when actually offline
- About / version info sheet — app version, formula references, disclaimer text; existing in both source apps, needs unification
- Contextual install prompt after first successful calculation — higher conversion than first-load prompt

**Defer to v2+:**
- Search and discovery UI — add only at 7+ calculators
- Favorites / recently used lists — add at 5+ calculators
- Native app builds (Capacitor / TWA)
- Per-calculator onboarding or tutorials
- Analytics, telemetry, or crash reporting

### Architecture Approach

The architecture is a strict two-layer model. The shell layer (root layout) owns everything that applies to all calculators: PWA bootstrap, the disclaimer gate, theme injection, and the responsive navigation shell. The calculator layer is a set of independent route pages (`/pert`, `/formula`) where each calculator manages its own ephemeral `$state` — no calculator state is lifted to the shell or shared with sibling calculators. The shell knows calculators only through the static `CALCULATOR_REGISTRY` manifest; calculators know nothing about the shell. Three `.svelte.ts` module singletons handle the only cross-cutting concerns: `theme.ts` (current theme), `disclaimer.ts` (acknowledgment state), and `about-sheet.ts` (event bus for the about sheet). All business logic lives in pure `.ts` files with no Svelte imports.

**Major components:**
1. **Root `+layout.svelte`** — PWA init, disclaimer gate, theme injection, renders `NavShell`; imports `CALCULATOR_REGISTRY` (read-only)
2. **`NavShell.svelte`** — Responsive navigation driven by `CALCULATOR_REGISTRY`; bottom bar mobile / top bar desktop via Tailwind breakpoints; active tab derived from `$page.url.pathname`
3. **`CALCULATOR_REGISTRY` (`registry.ts`)** — Static `readonly` array of `CalculatorEntry` objects; the only interface between shell and calculators
4. **`DisclaimerModal.svelte`** — Native `<dialog showModal()>` gate; non-dismissable until acknowledged; unified key `nicu_assistant:disclaimer:v1`
5. **`theme.ts` singleton** — `$state` getter/setter wrapper; reads/writes `localStorage` and `data-theme` attribute on `<html>`
6. **`DosingCalculator.svelte` + `dosing.ts`** — PERT calculator UI and pure business logic (no Svelte imports)
7. **`FormulaCalculator.svelte` + `formula.ts`** — Formula calculator UI and pure business logic (no Svelte imports)
8. **Shared components (`$lib/shared/components/`)** — `SelectPicker`, `NumericInput`, `ResultsDisplay`, `AboutSheet`; zero calculator-specific imports

### Critical Pitfalls

1. **Incompatible `SelectPicker` implementations** — PERT uses native `<dialog>` with keyboard nav; formula uses a `fixed` overlay div with body scroll mutation and different prop shape (`id` vs `value`, grouped options). Resolution: use PERT's `<dialog>` as the base, extend for `group` and `placeholder` props, migrate formula data from `id` to `value`, remove the `document.body.style.overflow` mutation entirely. Write tests for grouped rendering and keyboard nav before replacing either source usage.

2. **Theme system divergence causes formula tab to ignore dark mode** — Formula hardcodes OKLCH literals in component classes; PERT uses a CSS custom property token system. After porting, the formula tab will stay light in dark mode until every hardcoded color is mapped to the unified token set. Resolution: complete the design token migration (mapping formula palette onto unified `@theme` tokens) before testing any formula component in dark mode.

3. **FOUC on dark mode load** — `localStorage` theme preference is invisible to the prerendered HTML; JS runs after first paint, causing a light-to-dark flash for dark-mode users in a dim clinical environment. Resolution: blocking inline `<script>` in `app.html` reads `localStorage` and sets `document.documentElement.dataset.theme` before any CSS renders. Must be in `app.html`, not in any Svelte component.

4. **Stale clinical data served from PWA cache after deployment** — The default `autoUpdate` service worker strategy silently keeps old data on installed PWAs until all tabs are closed. On a shared NICU iPad, this may never happen during a shift. Resolution: use `registerType: 'prompt'` with a prominent in-app update banner, or `skipWaiting: true` + `clientsClaim: true` for immediate takeover with forced reload.

5. **`SelectPicker` scroll lock leaks across routes** — Formula's overlay-based picker sets `document.body.style.overflow = 'hidden'` which may not clean up if the user navigates away while the picker is open, locking scroll on the destination route. Resolution: fully eliminated by adopting the native `<dialog>` approach (pitfall 1 resolution).

---

## Implications for Roadmap

Based on the architectural dependency chain documented in ARCHITECTURE.md (Build Order Implications, section 10), the roadmap should follow this sequence strictly. Each phase is a prerequisite for the next.

### Phase 1: Project Scaffold and Design System

**Rationale:** Nothing can be styled or built until the unified token system exists. This is the foundation layer. The theme divergence between source apps (FOUC, formula dark-mode blindness) must be resolved before any component work begins.
**Delivers:** New SvelteKit project with unified `app.css` (`@theme` tokens, Clinical Blue + BMF Amber palettes, Plus Jakarta Sans self-hosted via `@fontsource`), inline FOUC-prevention script in `app.html`, `theme.ts` singleton, `disclaimer.ts` singleton, `adapter-static` + `ssr = false` config.
**Addresses:** Shared design system (table stakes), dark/light theme toggle (table stakes)
**Avoids:** Pitfall 5 (theme divergence), Pitfall 6 (FOUC), Pitfall 12 (font flicker)

### Phase 2: Shared Component Library

**Rationale:** Both calculators consume shared components. Porting either calculator before the shared library is settled will produce rework. The `SelectPicker` reconciliation is the hardest component problem in this project and must be solved in isolation before either calculator is migrated.
**Delivers:** Unified `SelectPicker` (PERT `<dialog>` base + formula group/placeholder extensions), `NumericInput`, `ResultsDisplay`, `DisclaimerModal` (native `<dialog>`, unified key `nicu_assistant:disclaimer:v1`), `AboutSheet`, `polyfills.ts`. Tests for grouped rendering, keyboard nav, and validation edge cases.
**Addresses:** Input validation (table stakes), WCAG accessibility (table stakes)
**Avoids:** Pitfall 1 (SelectPicker incompatibility), Pitfall 2 (DisclaimerModal regression), Pitfall 11 (scroll lock leak), Pitfall 13 (NumericInput missing from PERT), Pitfall 14 (validation gaps)

### Phase 3: Shell, Registry, and Navigation

**Rationale:** The shell wraps the calculators. It must exist — with the registry, `NavShell`, and root layout wired up — before calculator routes can be added and tested end-to-end.
**Delivers:** `CALCULATOR_REGISTRY` (static manifest for PERT and formula), `NavShell.svelte` (bottom bar mobile / top bar desktop, derived active state from `$page.url.pathname`), root `+layout.svelte` (disclaimer gate, theme init, NavShell render), root `+page.svelte` redirect, `about-sheet.ts` event bus. iOS safe-area insets (`env(safe-area-inset-bottom)`, `viewport-fit=cover`). Namespaced `localStorage` key convention (`nicu_assistant:{scope}:{key}`).
**Addresses:** Responsive navigation (table stakes), plugin registry (differentiator), calculator context preservation (differentiator)
**Avoids:** Pitfall 7 (nav state not URL-derived), Pitfall 8 (iOS Safari bottom nav clip), Pitfall 9 (localStorage key collisions), Pitfall 15 (no escape from broken state in standalone mode)

### Phase 4: PERT Calculator Port

**Rationale:** Port the simpler calculator first to validate the shared component library and directory structure under real conditions before tackling formula's more complex multi-mode UI.
**Delivers:** `src/lib/calculators/pert/` directory (`DosingCalculator.svelte`, `dosing.ts`, `medications.ts`, `clinical-config.*`), `/pert/+page.svelte` route. PERT inputs migrated to `NumericInput`. Existing `dosing.test.ts` passing against ported logic. `resolveOptionLabel` decoupled from `SelectPicker` (moved to `$lib/utils/options.ts`).
**Addresses:** Real-time output sync (table stakes), input validation (table stakes)
**Avoids:** Pitfall 10 (broken import aliases), Pitfall 14 (validation regressions)

### Phase 5: Formula Calculator Port

**Rationale:** Formula is the more complex calculator (three modes: standard, modified, BMF; brand selector with grouping; amber accent colors). Port after PERT confirms the shared infrastructure is solid.
**Delivers:** `src/lib/calculators/formula/` directory (all components and logic), `/formula/+page.svelte` route. Formula components migrated from hardcoded OKLCH literals to unified token classes. BMF Amber palette verified in both light and dark modes. Existing `formula.test.ts` passing against ported logic.
**Addresses:** Shared design system (table stakes — verified by dark mode working on formula tab)
**Avoids:** Pitfall 5 (theme divergence visible on formula tab)

### Phase 6: PWA Infrastructure and Offline Validation

**Rationale:** PWA configuration depends on finalized route structure (all routes must exist before the precache manifest can be verified). This is last because a broken precache manifest would need re-running with every route change.
**Delivers:** `vite.config.ts` with `@vite-pwa/sveltekit` configured (`registerType: 'prompt'`, `globPatterns` with `client/` prefix, Workbox cache config), `manifest.json` (correct `display: standalone`, icon set, `start_url`), visible in-app update banner component, network status indicator, contextual install prompt (deferred `beforeinstallprompt` after first calculation). End-to-end offline tests (every route loads in DevTools Offline mode). Stale-update test (deploy a change, verify installed PWA shows update banner within expected window).
**Addresses:** Full offline operation (table stakes), PWA installability (table stakes), service worker update notification (table stakes), network status indicator (differentiator)
**Avoids:** Pitfall 3 (stale clinical data), Pitfall 4 (missing `client/` prefix in precache manifest)

### Phase Ordering Rationale

- Phases 1-3 are pure prerequisites with no user-visible calculator functionality: they establish the complete foundation before any calculator code is touched.
- Phases 4-5 are parallel in principle but sequenced to catch shared-library issues on the simpler calculator first.
- Phase 6 is explicitly last because the precache manifest must enumerate all final routes.
- The formula dark-mode token migration (Pitfall 5) is baked into Phase 5, not deferred — deferring it would ship a broken dark mode experience.
- Calculator context preservation (conditional rendering rather than unmounting) must be confirmed in Phase 3 shell work before calculators are routed; it affects the `+layout.svelte` structure.

### Research Flags

Phases with well-documented patterns (skip `research-phase`):
- **Phase 1:** Tailwind CSS 4 `@custom-variant` dark mode and `@theme` tokens are fully documented in official docs. FOUC-prevention inline script is a standard static-SPA pattern.
- **Phase 3:** SvelteKit routing, `$page.url.pathname` active-tab derivation, and `adapter-static` SPA fallback are all standard SvelteKit patterns.
- **Phase 4:** PERT business logic is ported unchanged from a working implementation. No new algorithms.

Phases likely needing extra care during planning (not external research, but careful implementation planning):
- **Phase 2:** The `SelectPicker` reconciliation has no single authoritative reference — it requires auditing both source implementations side-by-side before writing the unified version. Budget significant time for the audit and tests.
- **Phase 5:** Formula's token migration requires a systematic audit of every hardcoded color value in every formula component. A checklist of components and their OKLCH literals should be generated at the start of this phase.
- **Phase 6:** The stale-update test requires an actual deployment cycle to verify (not just `pnpm preview`). Needs a test environment or a staging deploy.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Inherited from both source apps; one new dependency (`@lucide/svelte`) verified from official lucide.dev docs. Vite version pinning is a deliberate conservative choice. |
| Features | HIGH for table stakes; MEDIUM for differentiators | Table stakes validated against clinical calculator safety literature (PMC4433091) and reference apps (MDCalc, NicuApp). Differentiators validated against PWA UX research and existing app CLAUDE.md decisions. |
| Architecture | HIGH | Derived from direct inspection of both source codebases plus official SvelteKit docs. Build order and component boundaries are authoritative. |
| Pitfalls | HIGH for Critical (1-6); MEDIUM for Moderate (7-11); LOW for Minor (12-15) | Critical pitfalls are directly observable in the source code diffs. Moderate pitfalls are well-documented iOS/PWA behaviors. Minor pitfalls are quality issues with low severity. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact breakpoint for nav layout switch:** 768px (`md:`) is the standard recommendation, but actual bedside device widths (iPads in NICU mounts, specific Android tablets) may warrant adjustment. Validate during Phase 3 on real or representative hardware.
- **Calculator context preservation implementation detail:** Conditional rendering with `display: none` vs. SvelteKit snapshot API are both viable. The `display: none` approach is simpler but keeps both calculator component trees in memory simultaneously. Confirm the chosen approach during Phase 3 planning.
- **Stale-update strategy choice:** `registerType: 'prompt'` (user-triggered reload) vs. `skipWaiting: true` + forced `location.reload()` (immediate takeover). Both are documented; the right choice depends on clinical stakeholder input about acceptable disruption during active use. Flag for decision before Phase 6.
- **Disclaimer text scope:** The unified disclaimer must cover both PERT (weight-based enzyme dosing) and formula (recipe volume calculations) in a single statement. This requires clinical stakeholder review before Phase 2 ships.

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `/mnt/data/src/pert-calculator/src/` and `/mnt/data/src/formula-calculator/src/` — component architectures, prop shapes, localStorage keys, existing patterns
- Tailwind CSS v4 dark mode docs: https://tailwindcss.com/docs/dark-mode — `@custom-variant` approach
- `@lucide/svelte` official guide: https://lucide.dev/guide/packages/lucide-svelte — Svelte 5-native package
- Svelte 5 `Component` type and `.svelte.ts` rune files: https://svelte.dev/docs/svelte/typescript
- SvelteKit `$lib` alias, routing, state management: https://svelte.dev/docs/kit/$lib
- `@vite-pwa/sveltekit` precache `client/` prefix requirement: https://vite-pwa-org.netlify.app/frameworks/sveltekit
- `@vite-pwa/sveltekit` prompt-for-update guide: https://vite-pwa-org.netlify.app/guide/prompt-for-update

### Secondary (MEDIUM confidence)
- Global state in Svelte 5 getter/setter pattern: https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/
- Clinical calculator input validation research (PMC4433091): https://pmc.ncbi.nlm.nih.gov/articles/PMC4433091/ — 91% lack validation, 59% allow calculation with missing values
- iOS safe-area insets for PWA: https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08
- Bottom navigation UX research: https://www.smashingmagazine.com/2019/08/bottom-navigation-pattern-mobile-web-pages/ — labeled tabs 75% higher engagement
- iOS 100vh bottom nav overlap: https://dev-tips.com/css/overlapping-bottom-navigation-bar-despite-100vh-in-ios-safari

### Tertiary (LOW confidence)
- Specific bedside device viewport widths — not researched; validate on real hardware during Phase 3
- Clinical stakeholder acceptance of forced-reload vs. prompt-based SW update strategy — requires stakeholder input, not researchable from technical sources

---
*Research completed: 2026-03-31*
*Ready for roadmap: yes*
