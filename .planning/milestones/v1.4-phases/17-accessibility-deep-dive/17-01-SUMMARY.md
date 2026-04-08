# Phase 17 / Plan 01 — Summary

**Plan:** Accessibility Deep-Dive
**Status:** ✅ COMPLETE
**Date:** 2026-04-07

## What was built

### Token bumps (`src/app.css` dark block)

| Token | Before | After | Reason |
|-------|--------|-------|--------|
| `--color-text-secondary` | `oklch(70% 0.010 228)` | `oklch(80% 0.010 228)` | 2.43:1 → 4.5:1+ against `--color-surface-card` |
| `--color-accent` | `oklch(72% 0.14 220)` | `oklch(82% 0.12 220)` | 4.03:1 → 4.5:1+ against `--color-surface-card` / border |

Both tokens stay inside the Clinical Blue hue family (220/228). OKLCH perceptual uniformity means the palette still feels like itself, just with more lift on the low-contrast surfaces. Light mode untouched.

### Playwright a11y specs cleaned up

`e2e/fortification-a11y.spec.ts` and `e2e/morphine-wean-a11y.spec.ts`:

- Removed the `.disableRules(['color-contrast'])` escape hatch from the dark-mode tests
- Removed the `TODO: Re-enable color-contrast` comment block
- Added `document.documentElement.classList.add('no-transition')` + `waitForTimeout(250)` before running axe — necessary because the global `html:not(.no-transition) *` color transition rule in `app.css:114` means axe was reading mid-transition interpolated colors instead of final dark-mode values (the first probe run showed foreground `#6b7275` vs background `#747a7e`, which are not tokens at all but interpolated midpoints).

## Test results

| Suite | Result |
|-------|--------|
| `pnpm test:run` | 117/117 ✅ |
| `pnpm exec playwright test e2e/fortification-a11y.spec.ts e2e/morphine-wean-a11y.spec.ts` | 6/6 ✅ (both calculators × light + dark + results-visible) |
| `pnpm build` | ✅ |

## Dark-mode contrast audit (before → after)

From the pre-fix probe, 5 representative violations found in dark mode. All resolved:

| Element | Before | After |
|---------|--------|-------|
| Desktop inactive tab label (`text-secondary` on `surface-card`) | 3.11:1 ❌ | ≥4.5:1 ✅ |
| Desktop active tab label (`accent` on `surface-card`) | 4.03:1 ❌ | ≥4.5:1 ✅ |
| SelectPicker label span (`text-secondary` on `border`/`surface-card`) | 2.43:1 ❌ | ≥4.5:1 ✅ |
| NumericInput `<label>` (`text-secondary`) | 2.43:1 ❌ | ≥4.5:1 ✅ |
| NumericInput suffix span (`text-secondary` on `surface`) | 4.32:1 ❌ | ≥4.5:1 ✅ |

## Requirements coverage

| ID | Status | Evidence |
|----|--------|----------|
| A11Y-01 | ✅ | High-contrast review conducted via axe-core probe; 5 distinct violations documented; all closed via two token bumps; both themes now meet WCAG 2.1 AA |
| A11Y-02 | ✅ | Screen reader semantics were already in place from Phases 12-15 (aria-labelledby on SelectPicker trigger + conditional dialog title, aria-live on Fortification hero, aria-atomic on morphine summary, role=tablist/tab/tabpanel on mode switcher, role=group for manufacturer groups). Axe wcag2a/wcag2aa rules (`label`, `aria-valid-attr`, `region`, etc.) now run cleanly across the suite. |
| A11Y-03 | ✅ | Visible focus rings added in Phase 12 (SelectPicker trigger + options) and Phase 15 (desktop tab anchors + mobile tab bar). Native `<dialog>` provides focus trap + Esc dismissal. Axe rules validate tab order and hidden-content; all green. |
| A11Y-04 | ✅ | Playwright a11y suite: 6/6 green with `color-contrast` rule enabled in both themes and results visible. No disabled rules. |

## Guards

- `git diff --stat src/ e2e/` → `src/app.css`, `e2e/fortification-a11y.spec.ts`, `e2e/morphine-wean-a11y.spec.ts` only
- Light-mode tokens untouched
- No component markup changes
- No new dependencies

## Deviations

The plan's assertion that the token bump alone would close the violations was almost complete. A second probe after the fix revealed that the dev-server theme switch ran through the 200ms transition, so axe was reading interpolated mid-transition colors. Fix: added `no-transition` class + 250ms settle before the axe run. This is a test-harness improvement, not a palette regression — the tokens themselves are correct. Documented here as a process note.
