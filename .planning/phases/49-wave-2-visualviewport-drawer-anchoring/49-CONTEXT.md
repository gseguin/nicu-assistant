# Phase 49: Wave-2 — visualViewport Drawer Anchoring - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Mode:** `--auto` (Claude picked recommended defaults from PITFALLS.md HIGH-confidence research, ARCHITECTURE.md singleton sketch, and verbatim REQUIREMENTS.md acceptance criteria; no interactive questions)

<domain>
## Phase Boundary

**Goal:** On iOS in standalone PWA mode, the input-drawer sheet anchors to the **visible** viewport — above the soft keyboard when one is present, above the bottom nav otherwise — sized to fit the available space without being obscured by, or floating over, the iOS keyboard. On every other surface (Android Chrome, desktop Chrome/Safari/Firefox) the drawer behaves unchanged. This phase ships the runtime feature that consumes the Phase 47 test scaffolding and benefits from the Phase 48 auto-focus removal (which made "drawer position when keyboard is up" observable as a deliberate clinician tap rather than every drawer-open spuriously summoning the keyboard).

**In scope (16 requirements — DRAWER-01..12 + DRAWER-TEST-01..04):**

**Singleton (NEW file, src/lib/shared/visualViewport.svelte.ts, ~40 lines):**
- DRAWER-01: New module-scope `$state` singleton exposing `{ offsetTop, height, keyboardOpen }`; idempotent `init()`; `browser`-guarded for SSG safety. Mirrors `theme.svelte.ts` / `favorites.svelte.ts` / `disclaimer.svelte.ts` / `pwa.svelte.ts` pattern (already five singletons in `src/lib/shared/`).
- DRAWER-02: Subscribe to `visualViewport.resize` ONLY (NOT `visualViewport.scroll` — Phase 42.1 D-16 explicitly removed scroll-driven transforms; PITFALLS.md P-08 documents the reintroduction risk). Re-read `vv.width/height/offsetTop` on every event with NO caching to survive iOS 26 `visualViewport.height` post-dismiss regression (Apple Developer Forums #800125).
- DRAWER-03: Bind `pageshow` (with `event.persisted === true` branch) AND `visibilitychange` listeners so bfcache-restored sessions synchronously re-read `visualViewport` properties — drawer renders correctly on resume from background without requiring a user gesture (PITFALLS.md P-04 blocker).
- DRAWER-04: `init()` called from `src/routes/+layout.svelte:onMount` after `pwa.init()` line 55 — alongside the existing four singletons (no SSG hazard because `onMount` only runs in browser).

**InputDrawer.svelte wiring (existing file edits):**
- DRAWER-05: `.input-drawer-sheet` exposes `--ivv-bottom` and `--ivv-max-height` CSS custom properties driven by the singleton via inline `style` binding; NO per-calculator prop plumbing across the six call sites (single source of truth in `InputDrawer.svelte`).
- DRAWER-06: Sheet `max-height` becomes `calc(var(--ivv-max-height, 80dvh))` so when the keyboard is up the sheet shrinks to fit `visualViewport.height − 16px` (eyebrow + first input remain visible at minimum keyboard-up height).
- DRAWER-07: Sheet `padding-bottom` becomes `max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))` so when the keyboard is up the sheet's bottom edge sits flush above the keyboard top with ≥ 8 px clearance; when the keyboard is down the existing safe-area-inset-bottom clearance is preserved (PITFALLS.md P-07 double-offset trap).
- DRAWER-08: `transform`/`max-height` modifications apply ONLY to the inner `.input-drawer-sheet`, NEVER to the outer `<dialog>` element — preserves top-layer positioning rules, `<dialog>` accessibility semantics, and the existing SelectPicker dialog-inside-drawer (PITFALLS.md P-15: WebKit dialog-in-dialog regression history).
- DRAWER-09: Hardware-keyboard-paired iPhones do NOT trigger the keyboard-open branch — `keyboardOpen` heuristic uses `window.innerHeight − vv.height > 100` to filter URL-bar collapse (~50–80 px) and admit only the OSK (~290 px portrait); Bluetooth keyboards leave `vv.height` unchanged so no false positive (PITFALLS.md P-05).
- DRAWER-10: `prefers-reduced-motion: reduce` honored — when set, sheet sizing/positioning snaps without transition; when unset, transition uses an existing scoped CSS rule (no new global transitions). Consistent with v1.6 / Phase 42.1 reduced-motion contract.
- DRAWER-11: Existing `md:hidden` rule on the drawer is preserved (drawer never appears on tablet/desktop breakpoints) — iPad split-keyboard cases (PITFALLS.md P-06) are out of scope by architectural design.
- DRAWER-12: Existing `<dialog>` `showModal()` + top-layer + Esc-to-close + focus-trap + focus-restore behaviors are preserved verbatim — no replacement with `position: fixed` or other anti-pattern.

**Tests:**
- DRAWER-TEST-01: Vitest unit test on the singleton at `src/lib/shared/visualViewport.test.ts` — reuses `dispatchVisualViewportResize(...)` / `simulateKeyboardOpen()` / `simulateKeyboardDown()` / `simulateBfcacheRestore()` from `src/lib/test/visual-viewport-mock.ts` (Phase 47 D-08..D-10 helpers). Asserts `$state` runes update on `resize`, listeners rebind on `pageshow.persisted === true`, NO `visualViewport.scroll` listener attached (source-grep regression).
- DRAWER-TEST-02: Vitest component test on `InputDrawer.svelte` (extends existing `src/lib/shared/components/InputDrawer.test.ts`) asserts `style="--ivv-bottom: …px; --ivv-max-height: …px"` is applied to `.input-drawer-sheet` and updates when the mock visualViewport dispatches a resize.
- DRAWER-TEST-03: Playwright spec under the new `webkit-iphone` project (Phase 47 D-15: both projects run all e2e specs by default) at `e2e/drawer-visual-viewport.spec.ts` synthesizes `visualViewport.resize` via `page.evaluate(...)` and asserts the computed `padding-bottom` and `max-height` of `.input-drawer-sheet` match the keyboard-up branch.
- DRAWER-TEST-04: Existing 16/16 axe sweeps (light + dark across all 6 calculators) re-run with the new drawer behavior — no contrast or landmark regressions from the visualViewport-aware layout.

**Out of scope:**
- Real-iPhone smoke checklist (Phase 50 — closes v1.13 D-12 deferral). Phase 49 ships only the CI-verifiable surface; visual notch/keyboard verification on a real iPhone 14 Pro+ in standalone PWA mode is Phase 50's obligation.
- FOUC theme-color sync for `black-translucent` legibility (PITFALLS.md P-12 / SMOKE-09). Either accepted as system default or mitigated as a smoke-only fix in Phase 50.
- Bottom-nav translation. When `<InputDrawer>` is `expanded`, `dialog.showModal()` puts the dialog in the **top layer** — by spec it renders above `position: fixed` content including the bottom nav (`NavShell.svelte:148–174`). Translating the nav would be wasted work.
- Per-calculator prop plumbing. Singleton + CSS variable = zero per-calculator changes across the six `<InputDrawer>` call sites (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT).
- DESIGN.md / DESIGN.json contract changes. visualViewport sizing is structural; no Identity-Inside, Amber-as-Semantic, OKLCH-Only, or any other named rule is altered.
- iPad-specific keyboard handling (split / floating / Smart Keyboard). DRAWER-11 preserves `md:hidden` so the drawer never renders at iPad breakpoints in the first place.
- Dock-magnification-style scroll transforms. DRAWER-02 explicitly forbids `visualViewport.scroll` listeners — listening to `resize` only is non-negotiable per PITFALLS.md P-08.

</domain>

<decisions>
## Implementation Decisions

### Singleton design — visualViewport.svelte.ts

- **D-01:** New file at `src/lib/shared/visualViewport.svelte.ts`. Class-based singleton mirroring `favorites.svelte.ts` / `theme.svelte.ts` patterns (verified: `src/lib/shared/` already contains five `.svelte.ts` singletons — `theme`, `disclaimer`, `favorites`, `pwa`, `lastEdited`). Export a single `vv` instance via `export const vv = new VisualViewportStore();`. ~40 LOC target per ARCHITECTURE.md §3.
- **D-02:** Three `$state` runes: `offsetTop = $state(0)`, `height = $state(0)`, `keyboardOpen = $state(false)`. Plus a private `#initialized` boolean to make `init()` idempotent. Initial values are `0` / `0` / `false` so SSG snapshots and the older-iOS-no-visualViewport fallback both render correctly (the `.input-drawer-sheet` falls through to `80dvh` / `env(safe-area-inset-bottom, 0px)` when the variables are unset).
- **D-03:** `init()` is the public API; calling it twice is a no-op (`if (this.#initialized) return;`). `browser`-guard from `$app/environment` aborts before touching `window` so SvelteKit's adapter-static prerender pass doesn't crash. If `window.visualViewport` is `undefined` (older iOS, unsupported runtime), `init()` falls through after the guard — leaves runes at defaults; `.input-drawer-sheet` falls back to existing `80dvh` / `safe-area-inset-bottom` behavior.
- **D-04:** Listener registration: `vv.addEventListener('resize', update)` ONLY. NO `vv.addEventListener('scroll', update)` — DRAWER-02 + PITFALLS.md P-08 explicit rejection. Plus `window.addEventListener('pageshow', onPageshow)` and `document.addEventListener('visibilitychange', onVisibilityChange)` for the bfcache + foreground-return cases (DRAWER-03 / PITFALLS.md P-04). All listeners pass `{ passive: true }` to avoid scroll-jank coupling.
- **D-05:** `update()` is the single shared callback bound to `resize`, `pageshow.persisted`, and `visibilitychange` (when document.visibilityState === 'visible'). It re-reads `vv.offsetTop`, `vv.height`, computes `keyboardOpen = window.innerHeight - vv.height > 100`, and writes all three runes synchronously. NO caching of prior values — DRAWER-02 explicitly requires re-read on every event to survive the iOS 26 post-dismiss regression. `update()` is called once at the end of `init()` to seed the initial values.
- **D-06:** No teardown / `destroy()` API in v1. The singleton lives for the document lifetime — same as `theme.svelte.ts` / `favorites.svelte.ts` (neither has a `destroy()`). HMR replaces the module wholesale during dev; production has no teardown contract because the listeners never need to detach. If a future phase needs lifecycle teardown, add it then.
- **D-07:** Keyboard-open threshold = **100 px** (DRAWER-09 verbatim). Filters URL-bar collapse (~50–80 px on Safari) and admits only OSK (~290 px portrait). Hardware Bluetooth keyboards leave `vv.height` unchanged → `window.innerHeight - vv.height ≈ 0` → `keyboardOpen` stays `false`. Real-device tuning happens in Phase 50 SMOKE-07; if 100 px proves wrong on the iPhone 14 Pro+ smoke pass, adjust there as a 1-line change.

### InputDrawer wiring — CSS variables, not props

- **D-08:** Import `vv` singleton at the top of `InputDrawer.svelte` (`import { vv } from '$lib/shared/visualViewport.svelte.js'`). Compute a `$derived` style string and bind it inline on the `.input-drawer-sheet` div (line 91-94, currently `bind:this={sheet}`). NO per-calculator prop plumbing — DRAWER-05 single-source-of-truth requirement. Six existing `<InputDrawer>` call sites stay unchanged: `MorphineWeanCalculator.svelte`, `FortificationCalculator.svelte`, `GirCalculator.svelte`, `FeedAdvanceCalculator.svelte`, `UacUvcCalculator.svelte`, `PertCalculator.svelte`.
- **D-09:** `$derived` computation:
  ```ts
  const ivvStyle = $derived(
    vv.keyboardOpen
      ? `--ivv-bottom: ${window.innerHeight - vv.offsetTop - vv.height}px; --ivv-max-height: ${vv.height - 16}px;`
      : ''
  );
  ```
  When `keyboardOpen` is `false` the empty string leaves the CSS variables unset; the `var(..., default)` fallbacks in the `<style>` block kick in (`80dvh` for max-height, `env(safe-area-inset-bottom, 0px)` for padding-bottom — preserves existing keyboard-down behavior verbatim). When `keyboardOpen` is `true`, the inline style sets both variables; the `<style>` rules consume them.
- **D-10:** CSS rule changes in the existing `<style>` block of `InputDrawer.svelte`:
  - Line 157 `max-height: 80dvh;` → `max-height: calc(var(--ivv-max-height, 80dvh));` (DRAWER-06)
  - Line 161 `padding-bottom: env(safe-area-inset-bottom, 0px);` → `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px));` (DRAWER-07)
  - The fallback values (`80dvh`, `env(safe-area-inset-bottom, 0px)`) are intentionally identical to the current rules so no behavior changes when the variables are unset (older iOS, jsdom, prerender, drawer collapsed).
- **D-11:** The `style` binding goes on the `.input-drawer-sheet` `<div>` at line 91-94, NOT on the outer `<dialog>` at line 83. DRAWER-08 + PITFALLS.md P-15 are explicit: transform/max-height modifications apply ONLY to the inner sheet. The outer dialog stays at `100dvh` / `width: 100vw` (lines 142-148) — the invisible flex container that holds the sheet at `flex-end`. SelectPicker's nested `<dialog>` opens in its own top-layer slot, unaffected by the sheet's CSS variables.
- **D-12:** `prefers-reduced-motion: reduce` (DRAWER-10): the existing `@media (prefers-reduced-motion: no-preference)` rule at lines 168-175 ALREADY guards the slide-up animation. No new global transition is introduced — the variable changes propagate via CSS recomputation, which respects the existing reduced-motion contract. No additional code needed; verify in plan via a vitest assertion that `.input-drawer-sheet` has no `transition` property declared in the always-on rule (lines 155-164).

### Layout init — alongside the existing four singletons

- **D-13:** Edit `src/routes/+layout.svelte` lines 11-14 (the singleton imports) to add `import { vv } from '$lib/shared/visualViewport.svelte.js';`. Edit lines 52-55 (the `onMount` block) to call `vv.init();` after `favorites.init();` line 55. Sequential ordering doesn't matter — singletons are independent — but matching the import order keeps the `onMount` block readable.
- **D-14:** Do NOT call `vv.init()` from `InputDrawer.svelte`'s `$effect`. The singleton MUST be alive the moment any consumer mounts; calling `init()` from inside a component effect creates a race (drawer mounts → effect runs → singleton initializes → first resize event arrives → drawer is already past first paint). Layout-level init is the only correct surface, mirroring the four existing singletons.
- **D-15:** No `+layout.ts`/`+layout.server.ts` change. The singleton is purely client-side; SSG/SSR have no awareness. The `browser` guard in `init()` is the single SSG hazard mitigation.

### Tests — colocation + mock helper reuse

- **D-16:** DRAWER-TEST-01 lives at `src/lib/shared/visualViewport.test.ts` (co-located with the singleton, follows project convention — verified: `src/lib/shared/favorites.test.ts` already mirrors this pattern). Tests import the singleton AND the mock helpers from `$lib/test/visual-viewport-mock.js`:
  ```ts
  import { vv } from './visualViewport.svelte.js';
  import {
    dispatchVisualViewportResize,
    simulateKeyboardOpen,
    simulateKeyboardDown,
    simulateBfcacheRestore,
    _resetVisualViewportMock
  } from '$lib/test/visual-viewport-mock.js';
  ```
  Phase 47 D-08..D-10 already wrote and tested all four helpers — Phase 49 just consumes them.
- **D-17:** DRAWER-TEST-01 assertions (covering DRAWER-01..04 + DRAWER-09):
  ```ts
  // 1. Idempotent init (DRAWER-01)
  vv.init(); vv.init();  // no error, listeners registered once

  // 2. State updates on resize (DRAWER-02)
  simulateKeyboardOpen();
  expect(vv.keyboardOpen).toBe(true);
  expect(vv.height).toBeLessThan(window.innerHeight);

  // 3. State updates on keyboard-down (DRAWER-02 — re-read, no cache)
  simulateKeyboardDown();
  expect(vv.keyboardOpen).toBe(false);
  expect(vv.height).toBe(window.innerHeight);

  // 4. bfcache rebind (DRAWER-03)
  simulateKeyboardOpen();  // sets state
  simulateBfcacheRestore();  // pageshow.persisted=true should re-read
  // After restore, state should reflect current vv (which is post-resize)
  expect(vv.height).toBeLessThan(window.innerHeight);

  // 5. Hardware-keyboard guard (DRAWER-09)
  dispatchVisualViewportResize(window.innerHeight, 0);  // height unchanged → no OSK
  expect(vv.keyboardOpen).toBe(false);

  // 6. Source-grep: no scroll listener (DRAWER-02 / P-08)
  const source = readFileSync('src/lib/shared/visualViewport.svelte.ts', 'utf8');
  expect(source).not.toMatch(/visualViewport\.addEventListener\(['"]scroll/);
  ```
- **D-18:** DRAWER-TEST-02 extends `src/lib/shared/components/InputDrawer.test.ts` (existing file post-Phase-48). New test mounts the drawer, calls `simulateKeyboardOpen()`, asserts the rendered `.input-drawer-sheet` has `style` containing `--ivv-bottom:` and `--ivv-max-height:` substrings; then `simulateKeyboardDown()` and asserts the style attribute is empty / variables unset. Uses `@testing-library/svelte` (already imported) and the established T-XX numbering (likely T-09 / T-10 — Phase 48 already added T-07 + source-grep T-08).
- **D-19:** DRAWER-TEST-03 lives at `e2e/drawer-visual-viewport.spec.ts`. Runs under both `chromium` and `webkit-iphone` projects (Phase 47 D-15 default — spec-level skip not needed; chromium with synthetic dispatch still proves the wiring even though chromium has no soft keyboard). Spec opens any one calculator (Morphine — first in registry), opens the drawer via the InputsRecap tap, then `page.evaluate(...)` to:
  ```ts
  Object.defineProperty(window.visualViewport, 'height', { value: 400, configurable: true });
  Object.defineProperty(window.visualViewport, 'offsetTop', { value: 0, configurable: true });
  window.visualViewport.dispatchEvent(new Event('resize'));
  ```
  Then asserts via `page.locator('.input-drawer-sheet').evaluate(el => getComputedStyle(el).maxHeight)` that max-height is approximately `(400 - 16)px`. Single calculator is sufficient — DRAWER-05 single-source-of-truth means cross-calculator divergence is structurally impossible (CSS variable on a single component).
- **D-20:** DRAWER-TEST-04 = re-running the EXISTING 16/16 axe sweep matrix (light + dark × six calculators + drawer + dialog states + extended axe rules). NO new axe sweeps are added. The visualViewport-aware sheet introduces no new color tokens, no new ARIA, no new DOM landmarks — just CSS variable consumption on an existing element. Verification = `pnpm test:e2e` post-change with the existing axe specs. Documented in plan as a regression-only check, not a new artifact.

### Build order — singleton first, then drawer wiring, then tests

- **D-21:** Single phase, three sibling plans recommended:
  - `49-01-PLAN.md` — visualViewport singleton (DRAWER-01..04 + DRAWER-09 + DRAWER-TEST-01) + layout init (DRAWER-04). Self-contained: produces a working singleton with a green unit test before any drawer changes land. If this plan slips, no drawer behavior is broken — the variables stay unset, sheet falls back to existing `80dvh` / `safe-area-inset-bottom`.
  - `49-02-PLAN.md` — InputDrawer wiring (DRAWER-05..08 + DRAWER-10..12 + DRAWER-TEST-02). Depends on 49-01 (singleton must exist). Lands the inline style binding + CSS variable consumers + component test.
  - `49-03-PLAN.md` — Playwright spec (DRAWER-TEST-03) + axe re-run gate (DRAWER-TEST-04). Depends on 49-02 (the wiring must be live for the e2e spec to observe it). Lands last; the green Playwright + axe pass is the final gate before phase verify.
  Planner may collapse 49-02 + 49-03 into a single plan if they prefer — the success criteria are independent enough to verify either way. Three plans is the recommended default per the project's atomic-plan convention.
- **D-22:** Single git branch — three plans land on the same Phase 49 branch with sequential commits per plan. Each plan = 2-4 atomic commits with co-located tests committed alongside the source change. Plan boundaries align with successfully-passing-test boundaries (singleton green before drawer touches it; drawer green before Playwright verifies it).
- **D-23:** Recommended order: **49-01 → 49-02 → 49-03**, sequential. They are not parallel-safe (49-02 imports the singleton; 49-03 observes the drawer). The smallest atomic step that unlocks the next plan is the singleton landing first.

### Verification within the phase

- **D-24:** Phase 49 success criteria are deliberately CI-verifiable in the abstract (vitest passes, Playwright `chromium` + `webkit-iphone` both pass, axe sweeps remain 16/16) but the **actual** drawer-above-keyboard behavior CANNOT be visually proved in CI — Playwright WebKit on Linux does NOT emulate the iOS soft keyboard (`visualViewport.resize` events do NOT fire automatically; we synthesize them in DRAWER-TEST-03). PITFALLS.md P-19 + P-20 document this gap explicitly. Phase 50 SMOKE-04..07 close the visual gap on a real iPhone 14 Pro+.
- **D-25:** The 99-passing chromium Playwright suite + the 12-test cross-calculator focus spec from Phase 48 + the new DRAWER-TEST-03 (running on both projects) MUST remain green. No existing spec is modified — DRAWER-TEST-03 is purely additive. The InputDrawer style change is non-visible at all chromium e2e viewports because chromium reports `vv.height === window.innerHeight` (no soft keyboard simulated), so `keyboardOpen` stays `false` and the inline style stays empty — the existing 6 calculator specs land on the unchanged keyboard-down code path.
- **D-26:** `<dialog>` `showModal()` + Esc-to-close + focus-trap + focus-restore behaviors are preserved verbatim (DRAWER-12). The ONLY changes are: (a) adding a singleton import, (b) adding an inline `style` binding on the `.input-drawer-sheet` div, (c) modifying two `max-height` and `padding-bottom` rules in the `<style>` block to consume CSS variables. None of these touch the `<dialog>` element's attributes, the `dialog.showModal()` / `dialog.close()` calls in the `$effect`, the close-button `autofocus` (Phase 48 D-09), or the SelectPicker-inside-drawer pattern.
- **D-27:** `prefers-reduced-motion` (DRAWER-10): no NEW transitions are introduced. The existing `@media (prefers-reduced-motion: no-preference)` rule at `InputDrawer.svelte:168-175` already gates the slide-up animation. CSS variable changes propagate via the browser's normal recomputation pipeline — no `transition: max-height` or `transition: padding-bottom` is added (they would re-introduce the very scroll-driven coupling DRAWER-02 forbids). When the keyboard appears, the sheet snaps to its new max-height without animation; this is the correct behavior because the keyboard appearance is itself an iOS-controlled animation we cannot synchronize with.

### Claude's Discretion

- **`--auto` mode:** All decisions above were picked from the recommended defaults in PITFALLS.md HIGH-confidence research (P-01, P-03, P-04, P-05, P-08, P-15, P-18, P-20, P-22), the verbatim REQUIREMENTS.md acceptance criteria (DRAWER-01..12 + DRAWER-TEST-01..04), the ARCHITECTURE.md §3 singleton sketch, and the inherited Phase 47 + Phase 48 CONTEXT.md test-scaffolding + auto-focus-removal conventions. The user invoked with `--auto`, signaling trust in the synthesized approach. Anything below the level of "what variable lives on what element" (e.g. exact wording of test assertion messages, exact rAF coalescing pattern if needed for performance, exact spec name for the Playwright file) is left to the planner / executor.
- **Plan split:** Three sequential plans (`49-01-PLAN.md` singleton + layout init, `49-02-PLAN.md` InputDrawer wiring, `49-03-PLAN.md` Playwright spec + axe regression) is the recommended split per D-21..D-23. Planner may collapse to two plans (`49-01-PLAN.md` singleton+wiring, `49-02-PLAN.md` Playwright+axe) if that better matches the project's atomic-commit cadence; success criteria remain independent.
- **Test colocation:** All new test files are co-located with their source per the user's `feedback_test_colocation.md` memory: `visualViewport.test.ts` next to `visualViewport.svelte.ts`, `InputDrawer.test.ts` extension next to `InputDrawer.svelte`. The Playwright spec lives in `e2e/` (existing convention). Mock helpers stay in `src/lib/test/` per Phase 47 D-08 (framework-neutral helpers).
- **Singleton API surface:** Three runes (`offsetTop`, `height`, `keyboardOpen`) is the minimum useful set per DRAWER-01. Could expose `width` and `scale` for future use, but YAGNI — adding them here pollutes the API for no current consumer. Phase 49 ships the minimum surface; future phases extend if needed.
- **Threshold tuning:** 100 px (DRAWER-09) is the documented heuristic; if Phase 50 SMOKE-07 reveals real-device tuning is needed, adjust there as a 1-line change. Not worth bikeshedding before real-iPhone data.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone-level
- `.planning/PROJECT.md` — project context, design principles, v1.15.1 milestone goal (drawer mispositioning under iOS keyboard as one of three named bugs); D-12 deferral closure obligation
- `.planning/REQUIREMENTS.md` — DRAWER-01..12 + DRAWER-TEST-01..04 verbatim acceptance criteria (16 requirements); §SMOKE-04..07 lists Phase 50 closure obligations for DRAWER-06/07/02/03/09
- `.planning/ROADMAP.md` — Phase 49 goal + 5 success criteria + dependency on Phase 47 + Phase 48

### Research (HIGH-confidence)
- `.planning/research/PITFALLS.md` — **MUST READ.** P-03 (`100dvh`+`flex-end` insufficient — visualViewport-driven sizing required), P-04 (bfcache rebind blocker — `pageshow.persisted` + `visibilitychange`), P-05 (hardware-keyboard guard via `innerHeight - vv.height > 100`), P-07 (double-offset trap — `max(env(...), var(--ivv-bottom))`), P-08 (NO `vv.scroll` listener), P-15 (transform inner sheet, NEVER outer dialog — preserves SelectPicker-inside-drawer), P-16 (rubber-band overscroll — clamp `max(0, -offsetTop)` if needed), P-18 (jsdom polyfill — already in place from Phase 47), P-19 (Playwright chromium-only — `webkit-iphone` already added in Phase 47), P-20 (axe cannot detect drawer-hidden-by-keyboard — synthetic dispatch), P-22 (`80dvh` incompatible with visualViewport — `calc(var(--ivv-max-height, 80dvh))`). All eleven directly motivate the decisions above.
- `.planning/research/ARCHITECTURE.md` — **MUST READ.** §2 Fix 2 integration matrix has the exact CSS variable wiring strategy (`--ivv-bottom`, `--ivv-max-height`); §3 has the ~40-line singleton sketch this phase implements; §4 build-order rationale (Fix 2 lands after Fix 1 — Phase 48 already shipped); §5 test-surface table maps each test to its file location.
- `.planning/research/SUMMARY.md` — synthesis with build-order rationale (Wave-2 = the largest surface; needs Phase 48 auto-focus removal already in place)
- `.planning/research/STACK.md` — confirms SvelteKit 2 + Svelte 5 runes + adapter-static SPA constraints; `browser` guard from `$app/environment` is the SSG-safe pattern
- `.planning/research/FEATURES.md` — drawer feature matrix; six calculator routes that consume `<InputDrawer>`

### Existing project patterns to mirror
- `src/lib/shared/theme.svelte.ts` — class-based singleton with `init()` idempotency pattern (this phase mirrors verbatim)
- `src/lib/shared/favorites.svelte.ts` — class-based singleton with `$state` runes + `init()` + persistence (this phase mirrors the rune-state pattern; no persistence needed)
- `src/lib/shared/disclaimer.svelte.ts` — minimal singleton example, ~30 LOC
- `src/lib/shared/pwa.svelte.ts` — singleton with browser guard for SSG safety
- `src/lib/shared/lastEdited.svelte.ts` — recent singleton example
- `src/routes/+layout.svelte` lines 11-14 (imports), lines 52-55 (`onMount` `init()` calls) — the integration site for DRAWER-04
- `src/lib/shared/components/InputDrawer.svelte` lines 90-94 (sheet div with `bind:this={sheet}`) — the inline-style binding site; lines 155-164 (`.input-drawer-sheet` `<style>` rules) — the CSS variable consumption site; line 132-148 (the outer dialog rules — must NOT change per DRAWER-08)
- `src/test-setup.ts` lines 122-149 — visualViewport polyfill self-test pattern (Phase 47 D-04..D-07 — already in place)
- `src/lib/test/visual-viewport-mock.ts` — framework-neutral mock helpers `dispatchVisualViewportResize(...)`, `simulateKeyboardOpen()`, `simulateKeyboardDown()`, `simulateBfcacheRestore()`, `_resetVisualViewportMock()` (Phase 47 D-08..D-10 — already in place)
- `src/lib/shared/components/InputDrawer.test.ts` — existing component-test file (post-Phase-48); DRAWER-TEST-02 extends it with new T-XX cases. Already imports `@testing-library/svelte` matchers and the polyfill.
- `src/lib/shared/favorites.test.ts` — co-located singleton test pattern that DRAWER-TEST-01 mirrors
- `playwright.config.ts` (post-Phase-47) — two projects (`chromium` + `webkit-iphone`); DRAWER-TEST-03 inherits both by default per Phase 47 D-15
- `e2e/mobile-nav-clearance.spec.ts:23-24` — iPhone-SE 375x667 / iPhone-14-Pro-Max 414x896 viewport constants if DRAWER-TEST-03 needs them

### Phase 47 + Phase 48 inheritance
- `.planning/phases/47-wave-0-test-scaffolding/47-CONTEXT.md` — D-04..D-15 establish the visualViewport polyfill + helper + `webkit-iphone` Playwright project. Phase 49's DRAWER-TEST-01 + DRAWER-TEST-02 + DRAWER-TEST-03 all consume these scaffolds.
- `.planning/phases/48-wave-1-trivial-fixes-notch-focus/48-CONTEXT.md` — D-08..D-15 establish auto-focus removal + close-button `autofocus`. Phase 49 depends on Phase 48 because: (a) `keyboardOpen` is now observable as a deliberate clinician tap rather than every drawer-open spuriously summoning the keyboard; (b) DRAWER-12 explicitly requires the post-Phase-48 close-button autofocus + focus-trap + focus-restore behavior to be preserved verbatim.

### iOS / web platform spec references
- MDN — `Window.visualViewport` API: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport (HIGH confidence; iOS Safari ≥ 13)
- MDN — `VisualViewport.resize` event: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport/resize_event (HIGH confidence)
- WHATWG HTML spec — `<dialog>` `showModal()` and top-layer: https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element (HIGH confidence)
- Apple Developer Forums #800125 — iOS 26 `visualViewport.height` post-dismiss regression: https://developer.apple.com/forums/thread/800125 (MEDIUM confidence; recent, post-cutoff — D-05 re-read-on-every-event mitigation)
- WICG visual-viewport repo, Issue #79 (Safari 15 keyboard not firing resize): https://github.com/WICG/visual-viewport/issues/79 (HIGH confidence)
- MDN — `pageshow` event with `event.persisted`: https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event (HIGH confidence; bfcache rebind pattern)
- MDN — `visibilitychange` event: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event (HIGH confidence)
- MDN — `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion (HIGH confidence; existing project pattern)
- MDN — CSS `var()` with fallback: https://developer.mozilla.org/en-US/docs/Web/CSS/var (HIGH confidence; D-10 fallback strategy)
- Bramus — Prevent content from being hidden underneath the Virtual Keyboard: https://www.bram.us/2021/09/13/prevent-items-from-being-hidden-underneath-the-virtual-keyboard-by-means-of-the-virtualkeyboard-api/ (MEDIUM confidence)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Five existing `.svelte.ts` singletons** in `src/lib/shared/` (`theme`, `disclaimer`, `favorites`, `pwa`, `lastEdited`) — the new `visualViewport.svelte.ts` mirrors these exactly. Class-based, exported instance, `init()` idempotency, browser guard, no destroy. No new design judgment required.
- **`src/test-setup.ts` visualViewport polyfill** (Phase 47 D-04..D-07) — defines `window.visualViewport` with `addEventListener` / `removeEventListener` / `dispatchEvent` map-backed stubs and a self-test pattern. Phase 49's singleton + tests run against this polyfill in jsdom; no test-setup changes needed.
- **`src/lib/test/visual-viewport-mock.ts`** (Phase 47 D-08..D-10) — `dispatchVisualViewportResize(...)`, `simulateKeyboardOpen()`, `simulateKeyboardDown()`, `simulateBfcacheRestore()`, `_resetVisualViewportMock()`. Phase 49's DRAWER-TEST-01 + DRAWER-TEST-02 consume these directly; no new mock code is written.
- **`playwright.config.ts`** (post-Phase-47) — `chromium` + `webkit-iphone` projects. DRAWER-TEST-03 inherits both by default; no config change needed.
- **`InputDrawer.svelte` `.input-drawer-sheet` `<style>` block** (lines 155-164) — already isolates sheet sizing from the outer dialog. The `max-height` (line 157-158) and `padding-bottom` (line 161) rules are exactly the two lines that change to consume CSS variables.
- **`<dialog>` element + `showModal()` + `autofocus` on close button** (Phase 48 D-09) — Phase 49 preserves this verbatim. No focus-management change.
- **`@testing-library/svelte` + `@testing-library/jest-dom/vitest` matchers** — already imported via `src/test-setup.ts`. DRAWER-TEST-02 uses `toHaveStyle`, `toHaveAttribute` directly.

### Established Patterns
- **Class-based singleton with `$state` runes** — `theme.svelte.ts`, `favorites.svelte.ts` are the closest analogs. New singleton mirrors verbatim.
- **`init()` idempotency** — `if (this.#initialized) return;` is the pattern in `theme.svelte.ts` line 16, `favorites.svelte.ts`, `disclaimer.svelte.ts`. Phase 49 mirrors.
- **`browser` guard from `$app/environment`** — used in `pwa.svelte.ts`, `theme.svelte.ts`. SvelteKit's adapter-static prerender pass evaluates `+layout.svelte` at build time; the `onMount` callback only runs in the browser, but defense-in-depth `if (!browser) return` inside `init()` is the project convention.
- **`onMount` initialization site** — `+layout.svelte:52-55` already calls `theme.init()` / `disclaimer.init()` / `favorites.init()` (line 14 imports `pwa`, but `pwa.init()` is invoked elsewhere — verify during plan). Phase 49 adds `vv.init()` in this block.
- **Co-located test files** — `theme.svelte.ts` + `theme.svelte.test.ts` (TBD if exists), `favorites.svelte.ts` + `favorites.test.ts` (verified). DRAWER-TEST-01 lives at `src/lib/shared/visualViewport.test.ts`.
- **Inline style binding for CSS variables** — Svelte 5 syntax `style="--var: {value}px"` on the target element. The `$derived` rune produces the string; the binding is reactive by default. No `:global` rules needed.
- **`var(--name, fallback)` two-arg form for graceful degradation** — `pb-[env(safe-area-inset-bottom,0px)]` already uses this shape (Tailwind arbitrary-value bracket syntax). The CSS rule `max-height: calc(var(--ivv-max-height, 80dvh))` follows the identical pattern.
- **Source-grep regression tests** — used at `InputDrawer.test.ts` (Phase 48 D-13), Phase 47's polyfill self-test. DRAWER-TEST-01's "no scroll listener" assertion mirrors this.
- **Cross-route Playwright specs** — `e2e/mobile-nav-clearance.spec.ts`, `e2e/drawer-no-autofocus.spec.ts` (Phase 48 D-14) iterate routes; DRAWER-TEST-03 doesn't need iteration (single calculator suffices because DRAWER-05 single-source-of-truth).

### Integration Points
- **`+layout.svelte`** — single edit site for DRAWER-04 (one import + one `init()` call).
- **`InputDrawer.svelte`** — three edit sites: (a) singleton import at the top of `<script>`, (b) `$derived ivvStyle` computation, (c) inline `style={ivvStyle}` binding on the `.input-drawer-sheet` div, (d) two CSS rule changes in `<style>` block (`max-height`, `padding-bottom`). All within ~20 LOC of additions.
- **All 6 calculator routes** (`pert/+page.svelte`, `morphine-wean/+page.svelte`, `formula/+page.svelte`, `gir/+page.svelte`, `feeds/+page.svelte`, `uac-uvc/+page.svelte`) — render `<InputDrawer>` via the calculator components. NO per-route edits needed (DRAWER-05 single-source-of-truth in `InputDrawer.svelte`). DRAWER-TEST-03 verifies on a single route — cross-calculator divergence is structurally impossible.
- **Phase 47 dependency** — Phase 49 singleton unit test (DRAWER-TEST-01) consumes `src/test-setup.ts` visualViewport polyfill (Phase 47 D-04..D-07) + `src/lib/test/visual-viewport-mock.ts` helpers (Phase 47 D-08..D-10) + `playwright.config.ts` `webkit-iphone` project (Phase 47 D-12..D-15).
- **Phase 48 dependency** — Phase 49 DRAWER-12 explicitly preserves Phase 48's auto-focus removal + close-button `autofocus`. Without Phase 48, every drawer-open would spuriously summon the keyboard, making `keyboardOpen` indistinguishable from "user just opened the drawer" — Phase 49's behavior would be unobservable (PITFALLS.md SUMMARY §Build Order).
- **Phase 50 dependency** — Phase 50's SMOKE-04..07 verify what Phase 49 ships on a real iPhone 14 Pro+. Phase 49 only ships CI-verifiable surface; visual keyboard verification is impossible in CI by construction (PITFALLS.md P-19 + P-20).
- **Phase 51 dependency** — Phase 51 (Release v1.15.1) bumps `package.json` 1.15.0 → 1.15.1 and archives v1.15.1. REL-04's clinical gate requires Phase 49's tests green.

</code_context>

<specifics>
## Specific Ideas

- **Mirror `favorites.svelte.ts` line-for-line for the singleton skeleton.** It's the closest analog: class-based, `$state` runes, idempotent `init()`, `browser` guard, no destroy. The differences (no persistence, three runes instead of one) are obvious local edits. Reviewers should not have to context-switch between two patterns.
- **The `$derived ivvStyle` MUST short-circuit on `keyboardOpen === false`.** Returning an empty string when the keyboard is down lets the existing CSS fallbacks (`80dvh`, `env(safe-area-inset-bottom, 0px)`) apply — preserves keyboard-down behavior verbatim. Returning a fully-computed style string with `--ivv-bottom: 0px` would override the safe-area-inset-bottom fallback (since `max(env(...), 0px) === env(...)` is fine, but `max(env(...), -1px)` would not be — defense in depth).
- **DRAWER-08 + P-15 are non-negotiable: the inline `style` binding goes on the `<div class="input-drawer-sheet">`, NEVER on the outer `<dialog>`.** This is the single most-cited pitfall in the research. Putting the transform on the dialog inherits to the SelectPicker's nested dialog and visually drifts it. Reviewers + plan-checker should grep for `style` on `<dialog` in the diff and reject if found.
- **DRAWER-02 + P-08 are non-negotiable: NO `vv.addEventListener('scroll', ...)`.** A regression source-grep test (DRAWER-TEST-01 final assertion) catches re-introduction. Phase 42.1 D-16 explicitly removed scroll-driven transforms; reintroducing risks the same iOS scroll-jank.
- **Threshold = 100 px is the tested pre-real-device value.** PITFALLS.md P-05 and DRAWER-09 both cite this. Phase 50 SMOKE-07 will tune if needed; do NOT bikeshed before real-device data. If the threshold proves wrong, it's a 1-line change in `update()`.
- **No `requestAnimationFrame` coalescing in v1.** Visual viewport `resize` events fire at most a few times per keyboard appearance/dismissal — well below the 60 fps frame budget. Adding rAF coalescing is YAGNI for the resize-only listener; it would matter for `vv.scroll` (which DRAWER-02 forbids) but not for `vv.resize`.
- **No teardown / `destroy()` API.** Singleton lives for the document lifetime — same as the four existing singletons. Adding teardown contracts now is YAGNI; if a future test needs to reset listeners, the test-only `_resetVisualViewportMock()` already exists in Phase 47 D-13.
- **DRAWER-TEST-03's synthetic dispatch is a CI proxy, NOT a real keyboard test.** Phase 50 SMOKE-04..07 are the authoritative verification. Document this explicitly in the spec file header so future maintainers don't think the green CI run proves bedside iPhone correctness.

</specifics>

<deferred>
## Deferred Ideas

- **`requestAnimationFrame` coalescing for `update()`.** YAGNI for resize-only listener; would matter only if `vv.scroll` were added (forbidden by DRAWER-02). Capture as a future-perf todo if profiling on a real iPhone shows event handling takes > 1 frame.
- **`vv.width` and `vv.scale` runes.** Not needed for DRAWER-01..12; YAGNI. Add if a future phase needs them (e.g., zoom-aware UI).
- **`destroy()` / lifecycle teardown.** No consumer needs it. If a future phase introduces an HMR-sensitive listener, add the teardown contract then.
- **Bottom-nav translation when drawer is open + keyboard is up.** Architecturally unnecessary — `<dialog>.showModal()` puts the drawer in top-layer above the bottom nav. ARCHITECTURE.md §Fix 2 explicitly rules this out as a future enhancement; capture as a deferred idea if a future iOS regression breaks top-layer rendering.
- **Per-calculator focus-on-first-tap ergonomics.** Phase 48's auto-focus removal + close-button `autofocus` is the v1.15.1 contract. Future calculators (or v1.15.2) could opt into focus-on-first-tap-of-input via a per-calculator hook, but Phase 49 doesn't add that surface.
- **iPad split-keyboard / floating-keyboard handling.** DRAWER-11 preserves `md:hidden`, ruling iPad out by design. PITFALLS.md P-06 captured this; if future product direction enables drawer on iPad, a separate phase is needed.
- **FOUC theme-color sync for `black-translucent` legibility (PITFALLS.md P-12 / SMOKE-09).** Phase 50 will surface whether mitigation is needed; if so, v1.15.2 or Phase 49 follow-up. Out of Phase 49 scope per the v1.15.1 milestone goal split.
- **Tuning the 100 px keyboard-open threshold.** Phase 50 SMOKE-07 is the tuning surface. If a real iPhone 14 Pro+ in standalone PWA shows the threshold needs adjustment, fix there as a 1-line change.
- **Migrate the existing 6 chromium-only e2e specs to also run under `webkit-iphone`.** Phase 47 D-15 + Phase 48 deferred this. DRAWER-TEST-03 runs under both projects by default, but `e2e/uac-uvc.spec.ts`, `e2e/feeds.spec.ts`, etc. effectively run chromium-only patterns. Capture as a Phase 47 follow-up todo (NOT a Phase 49 blocker).
- **Performance instrumentation for the singleton.** If Phase 50 reveals `update()` runs hot on a real device, add a perf-mark + Web Vitals reporting. Not in Phase 49 scope.

</deferred>

---

*Phase: 49-wave-2-visualviewport-drawer-anchoring*
*Context gathered: 2026-04-27*
