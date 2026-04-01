---
phase: 04-pwa-offline
verified: 2026-03-31T02:45:00Z
status: gaps_found
score: 5/9 must-haves verified
re_verification: false
gaps:
  - truth: "pnpm build completes without errors and the generated build/sw.js precache manifest lists client/** assets"
    status: failed
    reason: "workbox-window is declared in package.json devDependencies but the symlink in node_modules/ is missing and pnpm-lock.yaml has zero workbox-window entries — pnpm install was never re-run after pnpm add. Rolldown cannot resolve 'workbox-window' from virtual:pwa-register, causing exit code 1."
    artifacts:
      - path: "package.json"
        issue: "workbox-window ^7.4.0 declared in devDependencies but not reflected in pnpm-lock.yaml importers section"
      - path: "pnpm-lock.yaml"
        issue: "workbox-window completely absent from lockfile — pnpm install was not run after pnpm add -D workbox-window"
      - path: "node_modules/"
        issue: "No node_modules/workbox-window symlink exists; node_modules/.pnpm/workbox-window@7.4.0 is present in the content-addressed store but unreachable"
    missing:
      - "Run pnpm install (or pnpm add -D workbox-window) from the project root to create the node_modules symlink and update pnpm-lock.yaml"
  - truth: "After first load with network online, setting DevTools to Offline still serves the app (both calculators work)"
    status: failed
    reason: "Depends on build succeeding and producing build/sw.js. Build currently fails, so no installable SW is available in the build/ output directory."
    artifacts:
      - path: "build/sw.js"
        issue: "File does not exist — build fails before adapter-static copies .svelte-kit/output/client/sw.js to build/"
      - path: "build/manifest.webmanifest"
        issue: "File does not exist — same root cause"
    missing:
      - "Fix workbox-window dependency (see gap 1), then re-run pnpm build to produce build/sw.js and build/manifest.webmanifest"
human_verification:
  - test: "Install to home screen on iOS Safari"
    expected: "NICU Assist appears as a standalone app with the apple-touch-icon"
    why_human: "Requires physical device or simulator with iOS Safari; can't be tested with grep"
  - test: "Offline calculator use after first load"
    expected: "Both PERT and formula calculators are fully functional with network disabled"
    why_human: "Requires browser DevTools offline mode and live app testing"
  - test: "Update banner appears when a new SW is waiting"
    expected: "Banner shows 'A newer version is available.' above the bottom nav with an 'Update now' button"
    why_human: "Requires two deployed builds and a running browser to trigger onNeedRefresh"
  - test: "Idle auto-reload: app reloads silently when no inputs are filled and update is waiting"
    expected: "With empty inputs and a waiting SW, the page reloads without user interaction"
    why_human: "Requires two deployed builds and live browser session with empty calculator state"
  - test: "Auto-reload is suppressed when any numeric input is filled"
    expected: "With fatGramsRaw or targetKcalOzRaw non-empty, banner shows but app does not auto-reload"
    why_human: "Requires two deployed builds and live session with active calculator input"
---

# Phase 4: PWA Offline Verification Report

**Phase Goal:** The app installs to the home screen, operates fully offline, and notifies clinicians when a new version with updated clinical data is available
**Verified:** 2026-03-31T02:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After first load with network online, setting DevTools to Offline still serves the app (both calculators work) | FAILED | build/sw.js does not exist — build fails before adapter-static can copy .svelte-kit/output/client/sw.js to build/ |
| 2 | The manifest.webmanifest file is served and contains name 'NICU Assistant', standalone display, three icon sizes | PARTIAL | manifest exists in .svelte-kit/output/client/manifest.webmanifest (correct content: name='NICU Assistant', display='standalone', 4 icon entries) but NOT in build/ because the build fails |
| 3 | Three PWA icon files exist at static/pwa-192x192.png, static/pwa-512x512.png, static/apple-touch-icon.png | VERIFIED | All three files exist and are non-empty (9748B, 34355B, 9096B respectively) |
| 4 | pnpm build completes without errors and the generated build/sw.js precache manifest lists client/** assets | FAILED | Build exits with code 1: "Rolldown failed to resolve import 'workbox-window' from '/@vite-plugin-pwa/virtual:pwa-register'" — workbox-window is in package.json but absent from pnpm-lock.yaml and has no node_modules/ symlink |
| 5 | When a new service worker is waiting, the update banner appears above the mobile tab bar without blocking the calculator | CANNOT VERIFY (build fails) | UpdateBanner.svelte source is correct and wired, but app cannot be built/deployed for runtime verification |
| 6 | When the app is idle (no inputs filled) and a new SW is detected, it reloads automatically without showing the banner | CANNOT VERIFY (build fails) | $derived isIdle + $effect auto-reload logic exists in +layout.svelte (lines 17-29), logic is substantively correct |
| 7 | When the user has active inputs and an update is available, the banner shows 'A newer version is available' with an 'Update now' button | VERIFIED (source) | UpdateBanner.svelte: {#if pwa.needsRefresh} renders span "A newer version is available." and button "Update now" onclick={() => pwa.applyUpdate()} |
| 8 | Clicking 'Update now' activates the waiting SW and reloads the page | VERIFIED (source) | pwa.applyUpdate() calls _updateSW(true) where _updateSW is the registerSW return value; wiring is correct |
| 9 | The app does not silently reload during an active calculation session | VERIFIED (source) | isIdle is $derived from four raw input fields; $effect only calls pwa.applyUpdate() when isIdle is true AND pwa.needsRefresh is true |

**Score:** 5/9 truths verified (3 source-only, 2 unverifiable until build is fixed, 2 blocked by build failure)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | SvelteKitPWA plugin with Workbox precaching and manifest | VERIFIED | SvelteKitPWA present; registerType:'prompt'; globPatterns:['client/**/*....']; manifest with name:'NICU Assistant', display:'standalone', 4 icons; no skipWaiting or clientsClaim |
| `svelte.config.js` | Disabled built-in SvelteKit SW registration | VERIFIED | serviceWorker: { register: false } present at line 18-20 |
| `src/lib/shared/pwa.svelte.ts` | Reactive update state singleton exporting `pwa` | VERIFIED | Exports pwa with needsRefresh getter, setUpdateAvailable, applyUpdate, dismiss — all implemented, not stubs |
| `static/pwa-192x192.png` | 192x192 PWA icon | VERIFIED | Exists, 9748 bytes |
| `static/pwa-512x512.png` | 512x512 PWA icon | VERIFIED | Exists, 34355 bytes |
| `static/apple-touch-icon.png` | 180x180 Apple touch icon | VERIFIED | Exists, 9096 bytes |
| `src/lib/shell/UpdateBanner.svelte` | Non-blocking update notification banner | VERIFIED | {#if pwa.needsRefresh}; role="status"; aria-live="polite"; min-h-[48px] touch target; positioned above mobile tab bar with safe-area-inset |
| `src/routes/+layout.svelte` | SW registration with onNeedRefresh + idle-detection auto-reload | VERIFIED | virtual:pwa-info imported; registerSW in onMount with onNeedRefresh callback; $derived isIdle from 4 state fields; $effect auto-reload; UpdateBanner mounted |
| `build/sw.js` | Generated service worker with precache manifest | FAILED | Does not exist in build/; exists in .svelte-kit/output/client/ from prior partial build but adapter-static never ran |
| `build/manifest.webmanifest` | Generated web app manifest | FAILED | Does not exist in build/ |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| vite.config.ts SvelteKitPWA | .svelte-kit/output/client/sw.js | pnpm build (partial) | PARTIAL | sw.js generated in svelte-kit output during a prior build run (27 precache entries, 376 KiB); not in build/ because build fails at client bundle step due to workbox-window missing from node_modules |
| svelte.config.js | SvelteKitPWA registration (no conflict) | serviceWorker.register: false | VERIFIED | serviceWorker: { register: false } prevents SvelteKit's own SW from conflicting with Workbox |
| +layout.svelte onMount | pwa.setUpdateAvailable | registerSW onNeedRefresh callback | VERIFIED | Line 43-45: onNeedRefresh() { pwa.setUpdateAvailable(updateSW) } |
| UpdateBanner.svelte | pwa.applyUpdate() | onclick handler | VERIFIED | Line 23: onclick={() => pwa.applyUpdate()} |
| +layout.svelte $effect | pwa.applyUpdate() auto-reload | isIdle derived from pertState + formulaState | VERIFIED | Lines 25-29: $effect checks pwa.needsRefresh && isIdle before calling pwa.applyUpdate() |
| virtual:pwa-register | workbox-window module | node_modules symlink | FAILED | workbox-window in package.json and pnpm store but no node_modules/workbox-window symlink and absent from pnpm-lock.yaml |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| UpdateBanner.svelte | pwa.needsRefresh | pwa.svelte.ts $state(false), set by setUpdateAvailable | Yes — set when onNeedRefresh fires from real SW lifecycle | FLOWING (source verified; runtime depends on SW registration which depends on build fix) |
| +layout.svelte isIdle | isIdle $derived | pertState.current.meal.fatGramsRaw, tubeFeed.fatGramsRaw, formulaState.current.modified.targetKcalOzRaw, bmf.targetKcalOzRaw | Yes — reads from reactive singletons populated by user input | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| pnpm build exits 0 | pnpm build 2>&1 | Exit code 1: "Rolldown failed to resolve import 'workbox-window'" | FAIL |
| sw.js exists after build | ls build/sw.js | file not found | FAIL |
| manifest exists after build | ls build/manifest.webmanifest | file not found | FAIL |
| pwa singleton exports correct API | grep in pwa.svelte.ts | needsRefresh, setUpdateAvailable, applyUpdate, dismiss all present | PASS |
| registerType is 'prompt' (no skipWaiting) | grep vite.config.ts | registerType: 'prompt'; no skipWaiting or clientsClaim | PASS |
| serviceWorker.register: false | grep svelte.config.js | serviceWorker: { register: false } confirmed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PWA-01 | 04-01-PLAN.md | Service worker with precaching of all app assets via Workbox | PARTIAL | SvelteKitPWA configured with globPatterns and 27-entry precache in .svelte-kit/output; build fails so sw.js not in build/ |
| PWA-02 | 04-01-PLAN.md | Web app manifest with icons (192px, 512px, 180px apple-touch), standalone display, portrait orientation | PARTIAL | manifest correct in .svelte-kit/output/client/; icons in static/; build fails so manifest not in build/ |
| PWA-03 | 04-02-PLAN.md | Active update prompt when new service worker detected (clinical safety: prevent stale formulas) | PARTIAL | UpdateBanner.svelte and layout SW registration wiring are complete and correct; runtime behavior unverifiable until build is fixed |
| PWA-04 | 04-01-PLAN.md | App works fully offline after first load | BLOCKED | Depends on PWA-01 (sw.js in build/); blocked by build failure |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| package.json | devDependencies | workbox-window declared but not installed (missing from pnpm-lock.yaml and node_modules/) | Blocker | Build fails with exit code 1; PWA-01, PWA-02, PWA-04 cannot be delivered |
| src/app.html | 28-30 | apple-mobile-web-app-capable and apple-mobile-web-app-title duplicated in +layout.svelte svelte:head | Warning | Browsers will see duplicate meta tags; functional but not clean. apple-mobile-web-app-status-bar-style is in app.html only — asymmetric duplication |

### Human Verification Required

#### 1. Home Screen Install (iOS)

**Test:** On an iOS device, open the app in Safari, tap Share > Add to Home Screen
**Expected:** NICU Assist appears as a standalone app with the placeholder icon; tapping it opens in standalone mode (no browser chrome)
**Why human:** Requires physical iOS device or simulator; can't be tested programmatically

#### 2. Offline Operation After First Load

**Test:** Load the app with network online, let it install the SW, then enable DevTools > Network > Offline; navigate between PERT and formula calculators
**Expected:** Both calculators remain fully operational; no network error screens
**Why human:** Requires a running app with registered SW and DevTools network throttling

#### 3. Update Banner Trigger

**Test:** Deploy a new build while keeping a tab open on the old version; wait for SW update detection
**Expected:** "A newer version is available." banner appears above the mobile tab bar with "Update now" button; tapping it reloads to the new version
**Why human:** Requires two distinct deployments and a live browser session

#### 4. Idle Auto-Reload Behavior

**Test:** Open app with all inputs empty, trigger a SW update
**Expected:** Page reloads automatically without showing the banner
**Why human:** Requires two deployments and precise timing

#### 5. Active-Session Protection

**Test:** Fill in a fatGramsRaw or targetKcalOzRaw value, then trigger a SW update
**Expected:** Banner appears but page does NOT auto-reload while input is non-empty
**Why human:** Requires two deployments and a live browser session with active input

### Gaps Summary

**Root cause: one missing `pnpm install` step**

The phase has one blocking gap: `workbox-window` is correctly declared in `package.json` (devDependencies) and exists in the pnpm content-addressed store at `node_modules/.pnpm/workbox-window@7.4.0/`, but the `node_modules/workbox-window` symlink was never created and `pnpm-lock.yaml` has zero workbox-window entries. This means `pnpm add -D workbox-window` updated `package.json` in-memory but `pnpm install` was never run (or the lockfile/symlink write was not persisted).

The consequence is that `pnpm build` fails with exit code 1 at the client bundle step when Rolldown tries to resolve `workbox-window` from `virtual:pwa-register`. This prevents `build/sw.js` and `build/manifest.webmanifest` from being written to the output directory.

**What IS correct:** All source artifacts are substantive and correctly implemented — `vite.config.ts`, `svelte.config.js`, `pwa.svelte.ts`, `UpdateBanner.svelte`, `+layout.svelte`, `app.html`, `app.d.ts`, and the three icon files. All key links between these files are wired correctly. The PWA configuration itself (registerType:'prompt', precache glob pattern, manifest content) is correct. The SW was generated in `.svelte-kit/output/client/sw.js` during the SSR build phase before the client build errored; it contains 27 precache entries. The fix required is a single shell command: `pnpm install` (or `pnpm add -D workbox-window` run correctly) from the project root.

**Secondary warning (non-blocking):** `apple-mobile-web-app-capable` and `apple-mobile-web-app-title` are duplicated between `src/app.html` and the `<svelte:head>` block in `+layout.svelte`. This is benign but asymmetric (`apple-mobile-web-app-status-bar-style` is only in `app.html`). The duplication in the layout is unnecessary since `app.html` already sets these.

---

_Verified: 2026-03-31T02:45:00Z_
_Verifier: Claude (gsd-verifier)_
