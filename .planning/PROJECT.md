# NICU Assistant

## What This Is

A PWA that unifies clinical calculators into a single tool for NICU staff. Currently includes an infant formula recipe calculator and a morphine weaning schedule calculator. Built with a shared component library, responsive navigation, and a plugin-like architecture that makes adding new calculators straightforward.

## Core Value

Clinicians can switch between NICU calculation tools instantly from a single app without losing context, using the same trusted interfaces they already know.

## Requirements

### Validated

- ✓ Responsive navigation: bottom tab bar on mobile, top nav bar on desktop — v1.0
- ✓ Formula recipe calculator (modified + BMF modes) — v1.0
- ✓ Shared component library: SelectPicker, NumericInput, DisclaimerModal, AboutSheet, ResultsDisplay — v1.0
- ✓ Single shared medical disclaimer shown on first load — v1.0
- ✓ Dark/light theme toggle — v1.0
- ✓ PWA: offline-capable with service worker, installable, standalone display — v1.0
- ✓ Plugin-like calculator registration — v1.0
- ✓ Design system unification: shared color tokens, typography, spacing — v1.0
- ✓ Accessible: WCAG 2.1 AA, keyboard nav, screen reader support, 48px touch targets — v1.0
- ✓ Morphine wean calculator with linear and compounding modes — v1.1
- ✓ PERT calculator replaced by morphine wean calculator — v1.1
- ✓ Clinical data stored in JSON config for maintainability — v1.1
- ✓ Unit tests with spreadsheet parity validation — v1.1
- ✓ Automated a11y auditing via axe-core — v1.1

## Current Milestone: v1.2 UI Polish

**Goal:** Polish the navigation layout so calculator tab buttons use the full width on mobile, by relocating info and theme switcher buttons to the app title bar.

**Target features:**
- Move info (about) button and theme toggle from bottom tab bar to top title/header bar
- Calculator tab buttons expand to fill full width of bottom nav on mobile
- Relocated buttons work correctly in both mobile and desktop layouts
- Visual polish pass on nav shell

### Active

(None — defined in REQUIREMENTS.md)

### Out of Scope

- Native app builds (Capacitor/iOS/Android) — deferred, PWA-only
- User accounts or authentication — anonymous clinical tool
- Backend/API — all data embedded at build time, no server calls
- Analytics or telemetry — clinical privacy concerns
- PERT dosing calculator — replaced by morphine wean calculator in v1.1

## Context

**Shipped v1.1** with ~589 LOC in morphine calculator module, 137 total tests passing.
Tech stack: SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 4 + Vite 8 + pnpm.

**Current calculators:**
- Morphine Wean: linear/compounding modes, config-driven defaults from `morphine-config.json`
- Formula: modified/BMF modes, 40+ brands with manufacturer grouping

**Architecture:**
- Calculator registry in `src/lib/shell/registry.ts` — add new calculators with one entry + one route
- Shared components in `src/lib/shared/components/` — NumericInput, SelectPicker, ResultsDisplay, DisclaimerModal, AboutSheet
- State singletons per calculator: `$state` rune + sessionStorage backup
- PWA with Workbox precaching and non-blocking update banner

**Users:** NICU clinicians (dietitians, nurses, GI physicians) at point of care. Primarily mobile, one-handed bedside use. Also desktop workstations.

**Known issues:**
- Dark mode color-contrast violations in some areas (pre-existing theme issue, deferred)

## Constraints

- **Tech stack**: SvelteKit 2 + Svelte 5 + Tailwind CSS 4 + Vite 8 + pnpm
- **No native**: PWA only, no Capacitor
- **Offline-first**: All clinical data embedded at build time, service worker for caching
- **Accessibility**: WCAG 2.1 AA minimum, 48px touch targets, always-visible nav labels
- **Clinical data in JSON**: Store calculation parameters in .json files for easier maintainability

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Responsive nav (bottom mobile / top desktop) | Standard PWA pattern; thumb zone for bedside use | ✓ Good |
| Both dark and light theme | NICU environment needs both | ✓ Good |
| Single shared disclaimer | One acceptance covers all tools | ✓ Good |
| Plus Jakarta Sans typeface | Polished, already in formula-calculator | ✓ Good |
| Plugin-like calculator architecture | Easy to add/swap calculators | ✓ Good — proved by PERT→morphine swap |
| bits-ui for headless components | Accessible primitives for Svelte 5 | ✓ Good |
| JSON config for clinical data | Easier maintainability/updates | ✓ Good — D-08 from v1.1 |
| Co-located test files | Svelte community standard, `.test.ts` next to source | ✓ Good |
| Syringe icon for morphine wean | Lucide @lucide/svelte, clear clinical association | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after milestone v1.2 start*
