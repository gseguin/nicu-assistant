# Milestones

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
