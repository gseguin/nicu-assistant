# Phase 16 / Plan 01 — Summary

**Plan:** Animation & Reduced Motion
**Status:** ✅ COMPLETE
**Date:** 2026-04-07

## What was built

Single targeted edit to `src/lib/shared/components/NumericInput.svelte`:
- Added `PREFERS_REDUCED_MOTION` module-load constant (matches the pattern used by morphine dock magnification)
- Changed `transition:slide={{ duration: 150 }}` → `transition:slide={{ duration: PREFERS_REDUCED_MOTION ? 0 : 150 }}`

## Motion audit — every surface accounted for

| Surface | Mechanism | Reduced-motion handling | Status |
|---------|-----------|------------------------|--------|
| NavShell focus / hover transitions | Tailwind `transition-colors` | Global rule `app.css:117` `html * { transition: none !important }` | ✅ existing |
| SelectPicker button / option hover | Tailwind `transition` utilities | Global rule `app.css:117` | ✅ existing |
| Fortification / Morphine mode switcher | Tailwind `transition-all`, `transition-colors` | Global rule `app.css:117` | ✅ existing |
| Theme-switch color/background | `app.css:114` `html:not(.no-transition) *` rule | Global rule `app.css:117` (and explicit guard at `app.css:116-118`) | ✅ existing |
| NumericInput `transition:slide` error | Svelte JS transition (NOT caught by CSS global) | `PREFERS_REDUCED_MOTION ? 0 : 150` | ✅ **fixed this phase** |
| Morphine summary-pulse (recalc affordance) | `@keyframes summary-pulse` | Component-local `@media (prefers-reduced-motion: reduce) { animation: none }` | ✅ existing |
| Morphine dock-style scroll magnification | JS scroll handler writing inline transform/box-shadow | `window.matchMedia('(prefers-reduced-motion: reduce)').matches` check inside `updateMagnification()` — clears all inline styles and bails early | ✅ existing |
| ResultsDisplay pulse-container (unused component) | `@keyframes pulse-once` | Component-local `@media (prefers-reduced-motion: reduce) { animation: none }` | ✅ existing (orthogonal — component is exported but not mounted anywhere) |
| Input focus ring `scale-[1.01]` | Tailwind utility (no transition property by itself) | Caught by global rule since it's a class-conditional state change wrapped in `transition-all` on NumericInput | ✅ existing |

## Layout-shift audit

No animation in the app animates `height`, `width`, `margin`, `padding`, flex `gap`, grid templates, or inset properties at mount. The only layout-shift-adjacent motion is the NumericInput error slide — which appears in-place at the bottom of the input wrapper and is now instant under reduced motion. No first-paint layout shift is introduced by any animation.

## Test results

| Suite | Result |
|-------|--------|
| `pnpm test:run` | 117/117 ✅ |
| `pnpm build` | ✅ PWA v1.2.0, 32 precache entries |

## Guards

- `git diff --stat src/` → `NumericInput.svelte` only
- No new dependencies
- No new animation added — the phase is a reduction/gating pass, not additive

## Requirements coverage

| ID | Status | Evidence |
|----|--------|----------|
| ANIM-01 | ✅ | Existing micro-animations are already calm (120–200ms color transitions, 150ms error slide, 180ms recalc pulse, 1.06x dock magnification). No flashy or bouncy motion anywhere. |
| ANIM-02 | ✅ | Every motion surface in the app honors `prefers-reduced-motion: reduce`, verified via the audit table above. |

## Deviations

None. The audit revealed only one outstanding gap (NumericInput slide), which is closed by this plan.
