# Phase 49: Wave-2 — visualViewport Drawer Anchoring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 49-wave-2-visualviewport-drawer-anchoring
**Areas discussed:** Singleton design, InputDrawer wiring strategy, Layout init site, Test colocation + mock reuse, Plan split & build order
**Mode:** `--auto` — Claude picked recommended defaults from PITFALLS.md HIGH-confidence research, ARCHITECTURE.md §3 singleton sketch, and verbatim REQUIREMENTS.md acceptance criteria. No interactive AskUserQuestion turns.

---

## Singleton design — visualViewport.svelte.ts

| Option | Description | Selected |
|--------|-------------|----------|
| **Class-based singleton with `$state` runes** | Mirror `theme.svelte.ts` / `favorites.svelte.ts` patterns; one `vv` instance exported; `init()` idempotent; ~40 LOC | ✓ |
| Module-scope `let` + reactive functions | Looser pattern; less ceremony but inconsistent with five existing singletons | |
| Svelte 5 store via `writable`-equivalent | Pre-Svelte-5 idiom; doesn't match modern runes-first style of the codebase | |

**Selected:** Class-based singleton mirroring `favorites.svelte.ts`.
**Notes:** PITFALLS.md P-18 + REQUIREMENTS DRAWER-01 + ARCHITECTURE.md §3 all converge on this approach. The five existing `.svelte.ts` singletons in `src/lib/shared/` set the convention; new singleton mirrors verbatim.

---

## Listener strategy — events to subscribe to

| Option | Description | Selected |
|--------|-------------|----------|
| `vv.resize` only + `pageshow` + `visibilitychange` | Phase 42.1 D-16 forbids scroll listeners; bfcache rebind needed for iOS app suspension | ✓ |
| `vv.resize` + `vv.scroll` (canonical visualViewport pattern) | DRAWER-02 + PITFALLS.md P-08 explicitly forbid `vv.scroll` (scroll-jank reintroduction risk) | |
| `vv.resize` only (no bfcache) | Loses iOS app-suspension recovery — drawer renders mispositioned on resume from background; PITFALLS.md P-04 blocker | |

**Selected:** `vv.resize` + `window.pageshow` (with `event.persisted === true` branch) + `document.visibilitychange`.
**Notes:** Three-listener combo is the minimum surface that satisfies DRAWER-02 (resize) + DRAWER-03 (bfcache + visibility) + DRAWER-09 (no scroll-driven coupling). DRAWER-TEST-01 includes a source-grep regression assertion that no `vv.scroll` listener is ever attached.

---

## Keyboard-open detection threshold

| Option | Description | Selected |
|--------|-------------|----------|
| **`window.innerHeight - vv.height > 100`** | Filters URL-bar collapse (~50–80 px) and Safari toolbar transitions; admits OSK (~290 px portrait) | ✓ |
| `window.innerHeight - vv.height > 50` | Risks false positive when Safari URL bar collapses on scroll | |
| `window.innerHeight - vv.height > 200` | Risks false negative for landscape OSK (~150–200 px) | |
| `vv.height < window.innerHeight * 0.85` | Proportional; works for landscape but harder to reason about | |

**Selected:** `> 100 px` per DRAWER-09 verbatim acceptance criterion.
**Notes:** Real-device tuning happens in Phase 50 SMOKE-07. If 100 px proves wrong on the iPhone 14 Pro+ smoke pass, adjust there as a 1-line change. PITFALLS.md P-05 + DRAWER-09 both cite this threshold.

---

## InputDrawer wiring — CSS variable vs prop plumbing

| Option | Description | Selected |
|--------|-------------|----------|
| **Singleton import + inline style with CSS variables on `.input-drawer-sheet`** | Single source of truth in `InputDrawer.svelte`; zero per-calculator changes; `var(--ivv-bottom, 0px)` fallback preserves keyboard-down behavior | ✓ |
| Per-calculator prop plumbing | Six call sites (`MorphineWeanCalculator`, `FortificationCalculator`, `GirCalculator`, `FeedAdvanceCalculator`, `UacUvcCalculator`, `PertCalculator`) all need updating; violates DRAWER-05 | |
| Global CSS variables on `<body>` via `document.body.style.setProperty(...)` | Side-effecty; pollutes global scope; harder to test in isolation | |

**Selected:** Singleton import + inline style with CSS variables on the inner sheet `<div>`.
**Notes:** ARCHITECTURE.md §2 Fix 2 + REQUIREMENTS DRAWER-05 + DRAWER-08 mandate this approach. The CSS variable consumption with `var(..., fallback)` form preserves keyboard-down behavior verbatim because the fallbacks (`80dvh`, `env(safe-area-inset-bottom, 0px)`) are identical to the current rules.

---

## Inner sheet vs outer dialog — what to transform

| Option | Description | Selected |
|--------|-------------|----------|
| **Inline `style` binding on the inner `.input-drawer-sheet` `<div>`** | Preserves outer `<dialog>` top-layer rendering + SelectPicker-inside-drawer; PITFALLS.md P-15 explicit | ✓ |
| Inline style on the outer `<dialog>` element | Inherits transform to nested SelectPicker dialog, visually drifts the picker; PITFALLS.md P-15 known WebKit regression | |

**Selected:** Inner sheet div per DRAWER-08.
**Notes:** This is the single most-cited pitfall in the research (P-15). The outer `<dialog>` stays at `100dvh` / `width: 100vw` (lines 142-148) — the invisible flex container; only the visible `.input-drawer-sheet` changes size.

---

## Layout init — where to call `vv.init()`

| Option | Description | Selected |
|--------|-------------|----------|
| **`+layout.svelte:onMount` after `favorites.init()` line 55** | Mirrors the four existing singleton init sites; `onMount` is browser-only (SSG-safe) | ✓ |
| Inside `InputDrawer.svelte`'s `$effect` | Race condition: drawer mounts → effect runs → singleton initializes → first resize event fires before drawer's first paint | |
| `+layout.ts` load function | `load` runs server-side during prerender; would need additional browser guards | |

**Selected:** `+layout.svelte:onMount` after `favorites.init()` per DRAWER-04.
**Notes:** Matches the four existing singletons (`theme`, `disclaimer`, `favorites`, `pwa`). Sequential ordering in `onMount` doesn't matter — singletons are independent — but matching import order keeps the block readable.

---

## Test colocation + mock helper reuse

| Option | Description | Selected |
|--------|-------------|----------|
| **Co-located: `visualViewport.test.ts` next to singleton; extend existing `InputDrawer.test.ts`; consume Phase 47 mock helpers** | Project convention per `feedback_test_colocation.md`; reuses Phase 47's `dispatchVisualViewportResize`, `simulateKeyboardOpen`, etc. | ✓ |
| `__tests__/` directory | Violates user's `feedback_test_colocation.md` memory + Svelte standard | |
| Single combined test file for both singleton + drawer wiring | Couples two independent test surfaces; harder to debug regressions | |

**Selected:** Co-located test files; reuse Phase 47 mock helpers verbatim.
**Notes:** `src/lib/shared/favorites.test.ts` already mirrors the co-located singleton test pattern. Phase 47 D-08..D-10 wrote `dispatchVisualViewportResize(...)`, `simulateKeyboardOpen()`, `simulateKeyboardDown()`, `simulateBfcacheRestore()`, `_resetVisualViewportMock()` — Phase 49 just imports them.

---

## Plan split — three sequential plans vs single plan

| Option | Description | Selected |
|--------|-------------|----------|
| **Three sequential plans (49-01 singleton, 49-02 drawer wiring, 49-03 Playwright + axe)** | Singleton can land + verify before any drawer touches it; smallest atomic step pattern; matches Phase 48's two-plan precedent | ✓ |
| Two plans (49-01 singleton + drawer wiring, 49-02 Playwright + axe) | Larger first commit; planner may prefer if cadence demands | |
| Single combined plan | Phase 48's two-plan split set the precedent for atomic decomposition; combining all of Phase 49 violates the project's atomic-commit cadence | |

**Selected:** Three sequential plans (49-01 → 49-02 → 49-03).
**Notes:** Plan boundaries align with successfully-passing-test boundaries. 49-01 produces a green singleton unit test before any drawer changes land; 49-02 lands the wiring + component test; 49-03 lands the Playwright e2e + axe regression gate. Planner may collapse to two plans if better matches cadence — success criteria are independent.

---

## Verification scope — what CI proves vs what real-iPhone proves

| Option | Description | Selected |
|--------|-------------|----------|
| **CI proves wiring + state + structural correctness; Phase 50 SMOKE-04..07 prove visual bedside correctness on real iPhone 14 Pro+** | PITFALLS.md P-19 + P-20: Playwright cannot show iOS soft keyboard; chromium has no `visualViewport.resize` on input focus | ✓ |
| Attempt to verify visual keyboard behavior in Playwright via simulated `vv.resize` | DRAWER-TEST-03 already does the synthetic dispatch; documented as a CI proxy, NOT a real keyboard test — Phase 50 closes the gap | |

**Selected:** CI = wiring/structural; Phase 50 = visual/bedside.
**Notes:** This is explicit in PITFALLS.md, REQUIREMENTS DRAWER-TEST-03 + SMOKE-04..07, and the v1.15.1 milestone goal (close v1.13 D-12 deferral by elevating real-iPhone smoke to primary verification surface). DRAWER-TEST-03's spec file header documents the synthetic-dispatch limitation.

---

## Claude's Discretion

The following decisions were left to Claude under `--auto` mode:

- Exact spec file name for the Playwright e2e (`e2e/drawer-visual-viewport.spec.ts` chosen — mirrors Phase 48's `e2e/drawer-no-autofocus.spec.ts` naming pattern).
- Exact T-XX numbering for the new InputDrawer.test.ts cases (likely T-09 / T-10 — Phase 48 already added T-07 + source-grep T-08).
- Exact wording of test assertion messages.
- Whether to add `requestAnimationFrame` coalescing to `update()` (decided against — YAGNI for resize-only listener).
- Whether to expose `width` / `scale` runes (decided against — YAGNI; Phase 49 ships minimum surface).
- Whether to add `destroy()` / lifecycle teardown (decided against — no consumer needs it; mirrors the four existing singletons that have no destroy).
- Plan-collapse decision (three plans recommended; planner may collapse to two if cadence demands).

## Deferred Ideas

(See CONTEXT.md `<deferred>` section for full list.)

- `requestAnimationFrame` coalescing for `update()` — capture as future-perf todo.
- `vv.width` and `vv.scale` runes — add when a future phase needs them.
- `destroy()` / lifecycle teardown — add when an HMR-sensitive listener requires it.
- Bottom-nav translation when drawer is open + keyboard up — architecturally unnecessary today.
- Per-calculator focus-on-first-tap ergonomics — out of v1.15.1 scope.
- iPad split-keyboard / floating-keyboard handling — `md:hidden` rules iPad out by design.
- FOUC theme-color sync (PITFALLS.md P-12 / SMOKE-09) — Phase 50 will surface; v1.15.2 if needed.
- Tuning the 100 px keyboard-open threshold — Phase 50 SMOKE-07 is the tuning surface.
- Migrate existing 6 chromium-only e2e specs to also run under `webkit-iphone` — Phase 47 follow-up todo, not a Phase 49 blocker.
- Performance instrumentation for the singleton — if Phase 50 shows it runs hot on real device.
