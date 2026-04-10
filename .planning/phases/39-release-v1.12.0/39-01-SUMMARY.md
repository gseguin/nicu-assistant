---
phase: 39-release-v1.12.0
plan: 01
subsystem: release
tags: [version-bump, favicon, documentation, gates]
dependency_graph:
  requires: [38-01, 38-02]
  provides: [v1.12.0-release]
  affects: [package.json, PROJECT.md, static-assets]
tech_stack:
  added: []
  patterns: [imagemagick-svg-to-png, clinical-favicon-design]
key_files:
  created:
    - static/favicon.svg
  modified:
    - package.json
    - .planning/PROJECT.md
    - static/favicon.png
    - static/apple-touch-icon.png
    - static/pwa-192x192.png
    - static/pwa-512x512.png
    - e2e/navigation.spec.ts
    - src/app.css
decisions:
  - "Medical cross (plus sign) on clinical blue rounded-square as favicon design"
  - "GIR identity color darkened to oklch(42%) and hero lightened to oklch(96%) for 4.5:1 contrast"
metrics:
  duration: 8m
  completed: 2026-04-10
  tasks: 3
  files: 8
---

# Phase 39 Plan 01: Release v1.12.0 Summary

Version bump to 1.12.0, PROJECT.md updated with all v1.12 entries across Phases 36-39, clinical favicon generated at all standard sizes, GIR identity contrast fixed, all quality gates green.

## Task Results

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Version bump + PROJECT.md update | ec50793 | package.json, .planning/PROJECT.md |
| 2 | Generate app favicon at all sizes | a9d2fa2 | static/favicon.svg, static/favicon.png, static/apple-touch-icon.png, static/pwa-192x192.png, static/pwa-512x512.png |
| 3 | Final gates verification | 4b278e4 | e2e/navigation.spec.ts, src/app.css |

## What Was Done

### Task 1: Version bump + PROJECT.md update
- Bumped `package.json` version from 1.11.0 to 1.12.0
- Added 5 new v1.12 entries to PROJECT.md Validated list (one per phase group: Phase 36 scaffolding + identity hue, Phase 37 calculations, Phase 38 UI, Phase 39 release)
- Updated Current State to reflect v1.12.0 shipped with four clinical calculators
- Updated Context section with Feed Advance as fourth calculator entry
- Updated Current Milestone section to show shipped status

### Task 2: Generate app favicon at all standard sizes
- Created `static/favicon.svg`: white medical cross (plus sign) on clinical blue (#2563eb) rounded-square background
- Generated PNGs via ImageMagick at all required sizes: 32x32 (favicon.png), 180x180 (apple-touch-icon.png), 192x192 (pwa-192x192.png), 512x512 (pwa-512x512.png)
- All PNGs verified as correct dimensions and visually distinct (not blank/white)
- No changes to app.html or vite.config.ts needed (existing references correct)

### Task 3: Final gates verification
- svelte-check: 0 errors, 0 warnings across 4533 files
- vitest: 228/228 tests passed across 20 test files
- Playwright: 63 passed, 3 skipped (PWA service worker tests needing production build)
- pnpm build: succeeded

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed navigation tab count test**
- **Found during:** Task 3 (Playwright gate)
- **Issue:** `e2e/navigation.spec.ts` expected 3 nav tabs but Feed Advance added a 4th
- **Fix:** Updated `toHaveCount(3)` to `toHaveCount(4)` and added `Feeds` tab assertion
- **Files modified:** e2e/navigation.spec.ts
- **Commit:** 4b278e4

**2. [Rule 1 - Bug] Fixed GIR identity hero contrast below 4.5:1**
- **Found during:** Task 3 (Playwright axe-core gate)
- **Issue:** GIR identity color `oklch(46% 0.12 145)` on hero background `oklch(94% 0.045 145)` achieved only 3.09:1 contrast ratio; `--color-text-secondary` on same background was 4.14:1. Pre-existing issue surfaced by full-suite parallel test execution.
- **Fix:** Darkened identity to `oklch(42% 0.12 145)` and lightened hero to `oklch(96% 0.03 145)` for 4.5:1+ contrast
- **Files modified:** src/app.css
- **Commit:** 4b278e4

## Gate Results

| Gate | Result | Detail |
|------|--------|--------|
| svelte-check | PASS | 0 errors, 0 warnings, 4533 files |
| vitest | PASS | 228/228 tests, 20 files |
| Playwright | PASS | 63 passed, 3 skipped |
| pnpm build | PASS | Clean build to static output |

## Self-Check: PASSED

All 9 files verified present. All 3 commit hashes verified in git log.
