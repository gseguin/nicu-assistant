# NICU Assistant

## What This Is

A PWA that unifies the PERT dosing calculator and the infant formula recipe calculator into a single clinical tool for NICU staff. It reuses the business logic and UI components from the existing standalone apps (`pert-calculator/` and `formula-calculator/`) with a shared component library, responsive navigation, and a plugin-like architecture that makes adding new calculators straightforward.

## Core Value

Clinicians can switch between NICU calculation tools instantly from a single app without losing context, using the same trusted interfaces they already know.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Responsive navigation: bottom tab bar on mobile, top nav bar on desktop
- [ ] PERT dosing calculator (meal + tube-feed modes) ported from pert-calculator
- [ ] Formula recipe calculator (modified + BMF modes) ported from formula-calculator
- [ ] Shared component library: SelectPicker, NumericInput, DisclaimerModal, AboutSheet, ResultsDisplay
- [ ] Single shared medical disclaimer shown on first load (covers all calculators)
- [ ] Dark/light theme toggle (both modes supported)
- [ ] PWA: offline-capable with service worker, installable, standalone display
- [ ] Plugin-like calculator registration — adding a new calculator requires minimal boilerplate
- [ ] Design system unification: shared color tokens, typography, spacing across calculators
- [ ] Accessible: WCAG 2.1 AA, keyboard nav, screen reader support, 48px touch targets

### Out of Scope

- Native app builds (Capacitor/iOS/Android) — deferred, PWA-only for now
- User accounts or authentication — anonymous clinical tool
- Backend/API — all data embedded at build time, no server calls
- Analytics or telemetry — clinical privacy concerns
- New calculators beyond PERT and formula — architecture supports it but v1 ships with two

## Context

**Existing codebases:**
- `pert-calculator/`: SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4, @vite-pwa/sveltekit, adapter-static. Dark-mode-first. Clinical Blue palette. System font stack. Components: DosingCalculator, SelectPicker, DisclaimerModal, AboutSheet. Business logic in `dosing.ts` + `medications.ts` + `clinical-config.json`.
- `formula-calculator/`: Same stack. Light-mode-only. Clinical Blue + BMF Amber dual palette. Plus Jakarta Sans (Google Fonts). Components: FormulaCalculator, ModifiedFormulaCalculator, BreastMilkFortifierCalculator, BrandSelector, SelectPicker, NumericInput, ResultsDisplay, DisclaimerModal, AboutSheet. Business logic in `formula.ts` + `formula-config.ts` + `formula-config.json`.

**Shared patterns across both apps:**
- Svelte 5 runes ($state, $derived, $effect) for reactivity
- Pure calculation functions (no side effects) in separate .ts files
- JSON-embedded clinical data loaded at build time
- Native HTML `<dialog>` elements for modals/pickers
- Tailwind CSS 4 with @theme custom properties for design tokens
- Accessibility: ARIA roles, live regions, focus management, keyboard nav

**Key differences to reconcile:**
- Color palettes: PERT uses Clinical Blue only; Formula uses Clinical Blue + BMF Amber
- Theme: PERT supports dark/light; Formula is light-only. Unified app will support both.
- Typography: PERT uses system fonts; Formula loads Plus Jakarta Sans. Unified app will use Plus Jakarta Sans.
- Component overlap: SelectPicker and DisclaimerModal exist in both — need to merge into shared versions

**Users:** NICU clinicians (dietitians, nurses, GI physicians) at point of care. Mobile-first, one-handed use at bedside. Also used on desktop workstations.

## Constraints

- **Tech stack**: SvelteKit 2 + Svelte 5 + Tailwind CSS 4 + Vite + pnpm — must match existing apps
- **No native**: PWA only, no Capacitor for v1
- **Offline-first**: All clinical data embedded at build time, service worker for caching
- **Accessibility**: WCAG 2.1 AA minimum, 48px touch targets, always-visible nav labels
- **Code reuse**: Port business logic from existing apps, don't rewrite calculation functions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Responsive nav (bottom mobile / top desktop) | Research shows this is the standard PWA pattern; bottom bar is in thumb zone for one-handed bedside use | -- Pending |
| Both dark and light theme | PERT users expect dark mode; NICU environment benefits from light mode option | -- Pending |
| Single shared disclaimer | Reduces friction vs per-calculator disclaimers; one acceptance covers all tools | -- Pending |
| Plus Jakarta Sans as shared typeface | Formula calculator already loads it; more polished than system fonts for clinical tool | -- Pending |
| Plugin-like calculator architecture | Makes it easy to add future calculators (e.g., fluid balance, growth charts) without touching nav or shell code | -- Pending |
| Delegate to Impeccable skill for UI design | All visual/aesthetic decisions (look & feel, color application, typography, layout) use the Impeccable skill; implementation follows its guidance | -- Pending |

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
*Last updated: 2026-03-31 after initialization*
