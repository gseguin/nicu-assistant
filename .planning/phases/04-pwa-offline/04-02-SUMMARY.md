---
phase: 04-pwa-offline
plan: 02
subsystem: pwa
tags: [service-worker, pwa, svelte5, update-banner, idle-detection, workbox]

# Dependency graph
requires:
  - phase: 04-01
    provides: pwa.svelte.ts singleton, vite-plugin-pwa config, app.d.ts type references
provides:
  - UpdateBanner.svelte component for non-blocking SW update notification
  - +layout.svelte SW registration with onNeedRefresh lifecycle wiring
  - Idle-detection auto-reload combining pertState and formulaState
  - Apple PWA meta tags and manifest injection via virtual:pwa-info
affects: []

# Tech tracking
tech-stack:
  added: [workbox-window]
  patterns: [idle-detection auto-reload, virtual:pwa-register dynamic import, $derived+$effect SW lifecycle]

key-files:
  created: [src/lib/shell/UpdateBanner.svelte]
  modified: [src/routes/+layout.svelte, package.json]

key-decisions:
  - "Installed workbox-window as explicit dev dependency (required by virtual:pwa-register at build time)"
  - "Idle detection uses only primary numeric inputs (fatGramsRaw, targetKcalOzRaw) not brand/strength defaults"

patterns-established:
  - "SW registration via dynamic import in onMount to avoid SSG/SSR issues with virtual modules"
  - "$derived idle check + $effect auto-reload pattern for safe SW updates during clinical use"

requirements-completed: [PWA-03]

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 4 Plan 2: Update Banner & SW Registration Summary

**Non-blocking UpdateBanner.svelte with idle-detection auto-reload wired through +layout.svelte SW registration lifecycle**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T08:28:44Z
- **Completed:** 2026-04-01T08:30:50Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created UpdateBanner.svelte with ARIA live region, 48px touch target, positioned above mobile tab bar
- Wired +layout.svelte with full SW lifecycle: virtual:pwa-info manifest injection, virtual:pwa-register dynamic import, onNeedRefresh callback
- Implemented idle-detection auto-reload combining pertState and formulaState numeric inputs (D-02: never silently reload during active calculation)
- Added Apple PWA meta tags (apple-mobile-web-app-capable, apple-touch-icon)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create UpdateBanner.svelte** - `61c29c9` (feat)
2. **Task 2: Wire +layout.svelte with SW registration and idle-detection auto-reload** - `28e9a51` (feat)

## Files Created/Modified
- `src/lib/shell/UpdateBanner.svelte` - Non-blocking update notification banner, conditional on pwa.needsRefresh
- `src/routes/+layout.svelte` - SW registration, idle detection, auto-reload, manifest injection, UpdateBanner mount
- `package.json` - Added workbox-window dev dependency

## Decisions Made
- Installed workbox-window explicitly as it is required by virtual:pwa-register but was not pulled in as a transitive dependency
- Idle detection checks only primary numeric driving inputs (fatGramsRaw for PERT, targetKcalOzRaw for formula) since brand/strength defaults are always populated

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing workbox-window dependency**
- **Found during:** Task 2 (build verification)
- **Issue:** virtual:pwa-register resolves to workbox-window at build time, but it was not installed
- **Fix:** Ran `pnpm add -D workbox-window`
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** `pnpm build` exits 0
- **Committed in:** 28e9a51 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for build to succeed. No scope creep.

## Issues Encountered
None beyond the workbox-window dependency issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PWA update lifecycle is fully wired: SW registration, update detection, idle auto-reload, manual update via banner
- Ready for any remaining PWA plans (e.g., offline testing, icon generation)

---
*Phase: 04-pwa-offline*
*Completed: 2026-04-01*
