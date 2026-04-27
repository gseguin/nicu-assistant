# Phase 47: Wave-0 — Test Scaffolding - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Mode:** `--auto` (Claude picked recommended defaults; no interactive questions)

<domain>
## Phase Boundary

**Goal:** Make vitest and Playwright able to exercise visualViewport-aware code BEFORE any feature code lands. Without this, Phase 49's drawer-anchoring tests fail at import time and Phase 48's focus assertions give green-by-accident on chromium-only CI.

**In scope (3 requirements — TEST-01..03):**
- `window.visualViewport` polyfill in `src/test-setup.ts` mirroring the existing `ResizeObserver` / `matchMedia` / `HTMLDialogElement` patterns (with the same setup-time self-test pattern at lines 122–149 of the existing `src/test-setup.ts`).
- Reusable test helper `dispatchVisualViewportResize(height, offsetTop)` exported from `src/lib/test/visual-viewport-mock.ts` so component / unit tests can synthesize keyboard-up / keyboard-down state deterministically.
- New `webkit-iphone` Playwright project added to `playwright.config.ts` (using `devices['iPhone 14 Pro']`). Existing `chromium` project preserved unchanged. CI runs both projects.

**Out of scope:**
- Any feature code (auto-focus removal, notch padding, visualViewport singleton — Phases 48 + 49).
- Real-iPhone smoke checklist (Phase 50).
- Migration of existing Playwright specs to also run under `webkit-iphone` — only a single smoke spec is required to prove the project is wired up.

</domain>

<decisions>
## Implementation Decisions

### Polyfill location and pattern
- **D-01:** Polyfill lives in the existing `src/test-setup.ts` (NOT a separate file) — mirrors the existing `ResizeObserver`, `matchMedia`, `Element.animate`, `Element.scrollIntoView`, and `HTMLDialogElement` polyfills already in that file. Single file = single discovery surface for future maintainers.
- **D-02:** Polyfill is gated on `typeof window !== 'undefined' && typeof window.visualViewport === 'undefined'` — same defensive pattern as the existing matchMedia / HTMLDialogElement gates.
- **D-03:** Setup-time self-test mirrors the `HTMLDialogElement` self-test at lines 122–149 — creates a probe, dispatches a synthetic resize, asserts properties update and listeners fire, throws loudly on regression. The self-test catches "polyfill regressed and is silently broken" failure modes.

### visualViewport polyfill shape
- **D-04:** Polyfill exposes the minimum surface used by the singleton + drawer code: `{ width, height, offsetTop, offsetLeft, scale, addEventListener, removeEventListener, dispatchEvent }`. Backed by an `EventTarget` so `dispatchEvent(new Event('resize'))` actually fires registered listeners.
- **D-05:** Initial values default to `{ width: window.innerWidth, height: window.innerHeight, offsetTop: 0, offsetLeft: 0, scale: 1 }` — matches the no-keyboard / no-zoom baseline that real iOS reports before any user interaction.
- **D-06:** Polyfill does NOT attempt to track real viewport changes inside jsdom. Tests drive state changes exclusively via `dispatchVisualViewportResize(...)` (D-09). Keeps the polyfill deterministic and avoids accidental coupling to jsdom internals.

### Test helper shape and location
- **D-07:** Helper file lives at `src/lib/test/visual-viewport-mock.ts` (new directory `src/lib/test/`) — explicit "this is a test-only helper" location, distinct from the runtime `src/lib/shared/` and from `src/test-setup.ts` (which runs once at suite startup, not per-test).
- **D-08:** Exports a single function `dispatchVisualViewportResize(height: number, offsetTop?: number, width?: number)` — sets the polyfill's properties synchronously and dispatches a `resize` event. Defaults match real iOS Safari behavior (offsetTop = 0 means keyboard down, offsetTop > 0 means keyboard pushed content up).
- **D-09:** Helper also exports `simulateKeyboardOpen()` and `simulateKeyboardDown()` convenience wrappers (sets height to `window.innerHeight - 290` and `window.innerHeight` respectively) — the 290 px figure is iOS portrait keyboard height (PITFALLS.md DRAWER-09 keyboard-open heuristic). Convenience wrappers keep test code readable without forcing every test to remember the magic number.
- **D-10:** Helper also exports `simulateBfcacheRestore()` — dispatches `pageshow` with `persisted: true`. Phase 49's DRAWER-03 will need this to verify the singleton's bfcache rebind logic. Including it in Wave-0 means Phase 49 can immediately test instead of expanding the helper later.

### Playwright project naming and config
- **D-11:** New project named `webkit-iphone` (NOT `mobile-safari` or `ios`). Naming matches the engine + form factor literally, parallel to `chromium`. Future-proof if `webkit-ipad` is ever added.
- **D-12:** Uses `devices['iPhone 14 Pro']` from `@playwright/test` — the device descriptor with viewport, userAgent, deviceScaleFactor, hasTouch, and isMobile baked in. Matches the milestone's stated primary verification surface (iPhone 14 Pro+ Dynamic Island).
- **D-13:** New project does NOT replace or modify the existing `chromium` project. Both run in CI. CI parallelism keeps wall-clock cost flat. Existing 99-passing chromium suite must remain unchanged.
- **D-14:** A new minimal smoke spec is added (e.g. `e2e/webkit-smoke.spec.ts`) under the `webkit-iphone` project that asserts `window.visualViewport` is defined inside `page.evaluate()` — proves the new project is wired correctly. Phase 49 will add the substantive Playwright assertions.
- **D-15:** No `testIgnore` / `testMatch` filtering between projects — both projects run all e2e specs by default. If a spec is webkit-incompatible, the spec uses `test.skip(({ browserName }) => browserName === 'webkit', 'reason')` inline. Phase 47 itself does NOT need to migrate any existing specs; if any of the existing 7 specs (`favorites-nav`, `feeds`, `gir`, `pert`, `formula`, `uac-uvc`, `desktop-full-nav*`) breaks on webkit at the repository level, that's captured as a deferred follow-up.

### Verification within the phase
- **D-16:** Phase 47 success criteria are deliberately narrow: (a) self-test passes at vitest startup, (b) helper functions are deterministic and importable, (c) `pnpm exec playwright test --list` shows two projects, (d) the smoke spec passes. NO behavioral assertions about drawer / notch / focus — those belong to Phase 48 + 49.
- **D-17:** Existing 439+ vitest tests must still pass. Polyfill MUST be additive (gated on `typeof === 'undefined'`) — never replaces a real visualViewport if one exists.
- **D-18:** Existing 99-passing chromium Playwright suite must still pass. Adding a new project must not change any existing project's behavior.

### Claude's Discretion
- **`--auto` mode:** All decisions above were picked from the recommended defaults in the research. The user invoked with `--auto`, signaling trust in the synthesized approach. Anything below the level of "what file does the polyfill live in" (e.g. exact TypeScript type of the EventTarget subclass, exact wording of the smoke spec assertion) is left to the planner / executor.
- **Helper API surface:** Started with a minimal set (`dispatchVisualViewportResize`, `simulateKeyboardOpen`, `simulateKeyboardDown`, `simulateBfcacheRestore`). Phase 49 may need to extend (e.g. `simulateOrientationChange`); planner can append without re-discussing.
- **Smoke spec content:** A single `expect(typeof window.visualViewport).toBe('object')` assertion is sufficient to prove wiring. Planner may add 1–2 more sanity assertions if convenient.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone-level
- `.planning/PROJECT.md` — project context, design principles, constraints (especially v1.13 D-12 deferral that this milestone closes)
- `.planning/REQUIREMENTS.md` — TEST-01..03 acceptance criteria (verbatim requirements)
- `.planning/ROADMAP.md` — Phase 47 goal + success criteria + dependency on this phase from 48 + 49

### Research (HIGH-confidence)
- `.planning/research/SUMMARY.md` — synthesis with build-order rationale, anti-features, gaps
- `.planning/research/STACK.md` — zero-new-deps decision; Playwright WebKit limitations (cannot emulate iOS keyboard or notch — closes the "but why real-iPhone smoke?" question authoritatively)
- `.planning/research/ARCHITECTURE.md` — file/line-precise integration matrix; the new singleton location at `src/lib/shared/visualViewport.svelte.ts` is read here even though it's a Phase 49 artifact (helps Phase 47 design a polyfill that exactly fits the singleton's API surface)
- `.planning/research/PITFALLS.md` — P-18 (jsdom no visualViewport) + P-19 (Playwright chromium-only) + P-04 (bfcache rebind needs `pageshow.persisted`); all three are the direct motivation for this phase

### Existing project patterns to mirror
- `src/test-setup.ts` lines 1–149 — existing polyfill patterns. **Mirror the `HTMLDialogElement` self-test at lines 122–149 verbatim — same probe-then-throw shape.** This is the most important reference; the new polyfill should look like a sibling of the existing ones, not a one-off.
- `playwright.config.ts` — existing single-project pattern; new project sits alongside, not replacing.
- `src/lib/shared/theme.svelte.ts` (referenced by future Phase 49) — singleton pattern that the visualViewport singleton will mirror (idempotent `init()`, `browser`-guarded, `$state` runes). Phase 47 doesn't write the singleton, but the polyfill must support its expected access pattern.

### iOS / web platform spec references
- MDN — `VisualViewport`: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport (authoritative for property names, event types, default values)
- Apple Developer Forums #800125 (iOS 26 visualViewport regression): https://developer.apple.com/forums/thread/800125 (motivates D-06 — polyfill must NOT cache or lazily compute; tests must drive state explicitly)
- Playwright Emulation docs: https://playwright.dev/docs/emulation (confirms `devices['iPhone 14 Pro']` exists and what it sets)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/test-setup.ts` polyfill harness** — already loaded by `vite.config.ts` test config (verified — referenced from research). New polyfill plugs into the same load order. No vitest config changes needed.
- **`HTMLDialogElement` self-test pattern** (`src/test-setup.ts` lines 122–149) — the gold standard for "polyfill that fails loudly on regression." Mirror it: probe, mutate, assert, throw on mismatch.
- **`@testing-library/jest-dom/vitest` matcher set** — already imported. New tests of the polyfill itself can use `toBe` / `toEqual` / `toHaveBeenCalled` etc. without further setup.
- **Playwright `devices` import** — `playwright.config.ts:1` already does `import { defineConfig, devices } from '@playwright/test'`. New project just adds another entry to the `projects` array using `...devices['iPhone 14 Pro']`.

### Established Patterns
- **Polyfill placement:** all jsdom shims sit in `src/test-setup.ts`, gated on `typeof === 'undefined'`. Never overwrites real implementations. Visual-viewport polyfill follows the same pattern.
- **Self-test pattern:** the dialog polyfill ends with a probe-then-throw self-test. Same approach for visualViewport.
- **Module-scope test helpers:** there are currently no test helpers in `src/lib/test/`; this phase introduces the directory. Convention is plain TypeScript modules (no test framework imports — helpers should be runnable from any test).
- **Playwright project structure:** single project today. New project added to the `projects` array; no `globalSetup` / `globalTeardown` changes needed because the existing config has none.

### Integration Points
- **`vite.config.ts`** loads `src/test-setup.ts` via vitest's `setupFiles` (existing — no change needed; verify during planning).
- **`playwright.config.ts`** — direct edit to add the second project entry.
- **Phase 48 + Phase 49 dependency:** Phase 48's FOCUS-TEST-01 (`document.activeElement` ≠ input) doesn't strictly need the visualViewport polyfill, but it does need the `webkit-iphone` Playwright project for FOCUS-TEST-03 (cross-calculator focus-order spec). Phase 49 needs both. So Phase 47 lands BEFORE both, as planned.
- **`src/lib/test/visual-viewport-mock.ts`** is a new file — no existing usages to migrate. Phase 49 will be the first consumer.

</code_context>

<specifics>
## Specific Ideas

- **The polyfill self-test must throw, not warn.** "Console warning" is invisible in CI. The `HTMLDialogElement` polyfill at lines 138–149 of `src/test-setup.ts` shows the pattern: `console.error(...); throw err;` — both for visibility AND to fail the suite at startup if the polyfill is silently broken. This is the ONLY way to catch "polyfill regressed and tests give green-by-accident" — which is the whole point of having Wave-0.
- **The smoke spec wording matters less than the project being wired up.** A two-line spec that does `await page.goto('/')` then asserts `window.visualViewport` exists is enough. Don't gold-plate.
- **Helper naming should self-document the test-time intent**: `simulateKeyboardOpen()` reads better than `dispatchVisualViewportResize(window.innerHeight - 290)`. Phase 49 tests will be more readable for the next developer.
- **Defensive against TS strict mode:** the polyfill must satisfy `lib.dom.d.ts` `VisualViewport` interface. The interface includes `EventTarget` inheritance, so the polyfill should `extends EventTarget` (or use `Object.setPrototypeOf` on a plain object). Either works; the executor picks based on what's least intrusive.

</specifics>

<deferred>
## Deferred Ideas

- **Migrate existing Playwright specs to run under `webkit-iphone` too.** Out of Phase 47 scope (D-15). If chromium specs break under webkit at repo level, capture as a Phase 47-follow-up todo, not a phase blocker.
- **`simulateOrientationChange()` helper** — Phase 49 may need it for landscape-rotation testing. Keep on the helper roadmap; if Phase 49 needs it, the planner can append without re-discussion.
- **Real-device coverage via Playwright cloud (BrowserStack / SauceLabs)** — would partially close the CI gap, but it's a substantial setup. Phase 50's real-iPhone smoke checklist is the v1.15.1 answer; cloud devices are a future-milestone tech-debt item.
- **VirtualKeyboard API shim** — iOS doesn't implement it (PITFALLS.md FEATURES.md anti-feature list); not adding to the polyfill in Phase 47. If a future milestone wants it as a progressive enhancement, the polyfill can be extended then.

</deferred>

---

*Phase: 47-wave-0-test-scaffolding*
*Context gathered: 2026-04-27*
