---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [tailwindcss, oklch, dark-mode, design-tokens, fouc-prevention, google-fonts]

requires:
  - phase: 01-01
    provides: "SvelteKit scaffold with Tailwind CSS 4 and Vite build"
provides:
  - "OKLCH Clinical Blue (50-900) and BMF Amber (50-900) color scales as Tailwind utilities"
  - "Class-based dark mode via @custom-variant dark for Tailwind CSS 4"
  - "FOUC-prevention inline script reading nicu_assistant_theme from localStorage"
  - "Semantic surface tokens for light and dark themes"
  - "Plus Jakarta Sans font loaded via Google Fonts"
  - "48px minimum touch targets for interactive elements"
  - ".card, .num, .icon-btn component utility classes"
affects: [01-03, 02-shared-components, 03-calculators]

tech-stack:
  added: [google-fonts-plus-jakarta-sans]
  patterns: [oklch-color-tokens, custom-variant-dark-mode, fouc-prevention-inline-script, semantic-surface-tokens]

key-files:
  created: [src/app.css]
  modified: [src/app.html, src/routes/+layout.svelte]

key-decisions:
  - "Used @custom-variant dark with .dark class selector for Tailwind CSS 4 dark mode"
  - "FOUC prevention uses localStorage key nicu_assistant_theme with system preference fallback"
  - "Semantic tokens use CSS custom properties overridden in .dark scope for theme switching"

patterns-established:
  - "OKLCH color system: all colors defined in OKLCH color space for perceptual uniformity"
  - "Semantic tokens: bg-surface, text-primary etc. resolve to theme-aware custom properties"
  - "FOUC script pattern: inline script in head before stylesheets reads localStorage and sets .dark class"

requirements-completed: [DS-01, DS-02, DS-03, DS-04, DS-05]

duration: 3min
completed: 2026-03-31
---

# Phase 1 Plan 2: Design System Tokens and FOUC Prevention Summary

**OKLCH Clinical Blue + BMF Amber token scales with FOUC-safe dark mode via inline script and @custom-variant dark**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T02:42:35Z
- **Completed:** 2026-04-01T02:45:38Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- FOUC-prevention inline script in app.html reads nicu_assistant_theme from localStorage and applies .dark class before first paint
- Full OKLCH color token system with Clinical Blue (50-900), BMF Amber (50-900), and semantic surface tokens for light/dark
- @custom-variant dark defined for Tailwind CSS 4 class-based dark mode
- Plus Jakarta Sans loaded via Google Fonts with preconnect
- 48px minimum touch targets, .card/.num/.icon-btn component utilities

## Task Commits

Each task was committed atomically:

1. **Task 1: Write app.html with FOUC prevention and font loading** - `ac12d11` (feat)
2. **Task 2: Write unified design token system in app.css** - `e46297f` (feat)

## Files Created/Modified
- `src/app.html` - FOUC-prevention inline script, Google Fonts preload, viewport-fit=cover
- `src/app.css` - Full OKLCH color token system, semantic tokens, dark mode, touch targets, component utilities
- `src/routes/+layout.svelte` - Added app.css import (required for CSS to load)

## Decisions Made
- Used @custom-variant dark with .dark class selector — this is the Tailwind CSS 4 replacement for the removed darkMode config
- FOUC prevention reads localStorage key `nicu_assistant_theme` and falls back to system preference via matchMedia
- Semantic tokens defined as CSS custom properties in :root (light) and .dark (dark) scopes, referenced in @theme block

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added app.css import to +layout.svelte**
- **Found during:** Task 2 (design token system)
- **Issue:** SvelteKit with @tailwindcss/vite plugin requires app.css to be imported in the layout; without it none of the CSS would load
- **Fix:** Added `import '../app.css'` to +layout.svelte script block
- **Files modified:** src/routes/+layout.svelte
- **Verification:** pnpm build succeeds, CSS output includes design tokens
- **Committed in:** e46297f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for CSS to load at all. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all tokens are fully defined with production-ready OKLCH values.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Design tokens and FOUC prevention are in place for NavShell (01-03) to use
- Tailwind utilities like bg-clinical-600, text-bmf-400, dark:bg-surface are now available
- .card component class ready for calculator route placeholders

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 01-foundation*
*Completed: 2026-03-31*
