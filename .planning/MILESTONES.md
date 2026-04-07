# Milestones

## v1.3 Fortification Calculator Refactor (Shipped: 2026-04-07)

**Phases completed:** 3 phases (9, 10, 11) + 1 inserted/reverted (10.1), 5 plans

**Key accomplishments:**

- Unified Fortification calculator matching the recipe-calculator.xlsx Calculator tab exactly, replacing legacy Modified Formula + BMF modes
- 30 infant formulas (Abbott, Mead Johnson, Nestlé, Nutricia) embedded as clinician-editable JSON config with displacement_factor, calorie_concentration, grams_per_scoop
- Spreadsheet-parity unit tests verifying the documented Neocate case to 13 decimals, plus per-unit and per-special-case coverage (BM+Tsp HMF shortcut, Packets HMF protocol)
- Packets unit hidden from picker for non-HMF formulas with auto-reset on formula switch
- WCAG 2.1 AA axe-core a11y audit for fortification calculator in light + dark modes
- Carryover wins: SelectPicker label association via aria-labelledby (a11y improvement across all calculators), legacy Modified Formula + BMF code fully removed
- Phase 10.1 (all-units display refactor) explored and reverted via clean git revert after customer feedback preferred the unit selector matching the spreadsheet

---

## v1.2 UI Polish (Shipped: 2026-04-03)

**Phases completed:** 4 phases, 14 plans, 27 tasks

**Key accomplishments:**

- SvelteKit 2.55 + Vite 8 + Tailwind CSS 4 scaffold with adapter-static SPA output and TypeScript strict mode
- OKLCH Clinical Blue + BMF Amber token scales with FOUC-safe dark mode via inline script and @custom-variant dark
- Responsive nav shell with theme singleton, calculator registry, and skeleton placeholder routes at /pert and /formula
- bits-ui installed, shared types/context/disclaimer singleton created as foundation for Plans 02-04 parallel component work
- Unified SelectPicker with bits-ui Select primitives supporting grouped and flat option rendering, scroll lock, and keyboard navigation
- 1. [Rule 3 - Blocking] Fixed Svelte 5 test environment resolution
- AboutSheet side sheet with per-calculator content, plus integration tests for disclaimer singleton and NumericInput validation
- PERT dosing logic (7 files) and formula recipe logic (3 files) ported with adapted imports, plus sessionStorage-backed state singletons for both calculators
- Reason:
- Three formula calculator components (mode switcher, modified mode, BMF mode) ported with dark mode tokens, Phase 2 shared components, 40+ brand picker with manufacturer grouping, and dispensing measures
- 17 unit tests covering all PERT and formula pure calculation functions with real clinical config data, zero mocks
- SvelteKitPWA with Workbox precaching (28 assets), web app manifest, placeholder icons, and pwa.svelte.ts reactive update singleton
- Non-blocking UpdateBanner.svelte with idle-detection auto-reload wired through +layout.svelte SW registration lifecycle

---

## v1.1 Morphine Wean Calculator (Shipped: 2026-04-02)

**Phases completed:** 6 phases, 18 plans, 35 tasks

**Key accomplishments:**

- SvelteKit 2.55 + Vite 8 + Tailwind CSS 4 scaffold with adapter-static SPA output and TypeScript strict mode
- OKLCH Clinical Blue + BMF Amber token scales with FOUC-safe dark mode via inline script and @custom-variant dark
- Responsive nav shell with theme singleton, calculator registry, and skeleton placeholder routes at /pert and /formula
- bits-ui installed, shared types/context/disclaimer singleton created as foundation for Plans 02-04 parallel component work
- Unified SelectPicker with bits-ui Select primitives supporting grouped and flat option rendering, scroll lock, and keyboard navigation
- 1. [Rule 3 - Blocking] Fixed Svelte 5 test environment resolution
- AboutSheet side sheet with per-calculator content, plus integration tests for disclaimer singleton and NumericInput validation
- PERT dosing logic (7 files) and formula recipe logic (3 files) ported with adapted imports, plus sessionStorage-backed state singletons for both calculators
- Reason:
- Three formula calculator components (mode switcher, modified mode, BMF mode) ported with dark mode tokens, Phase 2 shared components, 40+ brand picker with manufacturer grouping, and dispensing measures
- 17 unit tests covering all PERT and formula pure calculation functions with real clinical config data, zero mocks
- SvelteKitPWA with Workbox precaching (28 assets), web app manifest, placeholder icons, and pwa.svelte.ts reactive update singleton
- Non-blocking UpdateBanner.svelte with idle-detection auto-reload wired through +layout.svelte SW registration lifecycle
- Linear and compounding morphine wean calculations with TDD, config-driven defaults, and complete PERT removal from registry/nav/routes
- Morphine wean calculator with three NumericInput fields, Linear/Compounding mode tabs, and mobile-optimized 10-step stacked card schedule
- 38 total tests passing: 20 spreadsheet parity tests verifying row-by-row clinical accuracy plus 6 component tests for MorphineWeanCalculator UI behavior
- Playwright axe-core e2e tests validating WCAG 2.1 AA compliance for morphine wean calculator in light mode, dark mode, and with schedule visible

---
