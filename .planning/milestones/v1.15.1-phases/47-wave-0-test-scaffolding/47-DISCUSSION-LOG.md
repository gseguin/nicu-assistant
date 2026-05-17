# Phase 47: Wave-0 — Test Scaffolding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 47-wave-0-test-scaffolding
**Mode:** `--auto` (Claude picked recommended defaults from research; no interactive AskUserQuestion calls)
**Areas discussed:** Polyfill location, visualViewport polyfill shape, Test helper API, Playwright project naming, Self-test pattern, Phase scope guardrails

---

## Polyfill location

| Option | Description | Selected |
|--------|-------------|----------|
| Add to existing `src/test-setup.ts` | Mirrors the existing `ResizeObserver` / `matchMedia` / `Element.animate` / `HTMLDialogElement` polyfills | ✓ |
| New `src/test-setup-visual-viewport.ts` file | Isolates the new polyfill in its own module |  |
| Inline in each test file | Co-locate with the tests that use it |  |

**Auto-selected (recommended):** Existing `src/test-setup.ts`. Rationale: single discovery surface for future maintainers; matches the existing shim pattern; loads at vitest startup so all tests get it; self-test runs once, not per-test.

---

## visualViewport polyfill shape

| Option | Description | Selected |
|--------|-------------|----------|
| Object literal with EventTarget delegate | Plain object backed by an internal EventTarget for `addEventListener`/`dispatchEvent` | ✓ |
| Class extending EventTarget | `class VisualViewportPolyfill extends EventTarget {}` |  |
| `Object.setPrototypeOf` on a plain object | Hybrid that satisfies `instanceof EventTarget` checks |  |

**Auto-selected (recommended):** Object literal with EventTarget delegate. Rationale: lowest-impact API; satisfies the `lib.dom.d.ts` `VisualViewport` interface that already ships with TypeScript 6; supports the singleton's `addEventListener('resize', ...)` access pattern; defensive against TS strict mode. Executor may upgrade to `extends EventTarget` if cleaner — left to discretion.

---

## Test helper API

| Option | Description | Selected |
|--------|-------------|----------|
| Single `dispatch...` function | One low-level helper; tests call it with raw numbers |  |
| Low-level `dispatch...` + named convenience wrappers | `dispatchVisualViewportResize` plus `simulateKeyboardOpen` / `simulateKeyboardDown` / `simulateBfcacheRestore` | ✓ |
| Class-based test fixture | `new VisualViewportFixture()` with chained methods |  |

**Auto-selected (recommended):** Low-level dispatch + named convenience wrappers. Rationale: Phase 49 tests will read more clearly with `simulateKeyboardOpen()` than with `dispatchVisualViewportResize(window.innerHeight - 290)`; the 290 px portrait keyboard heuristic stays in one place; bfcache helper is needed for DRAWER-03 and is tiny to add now.

---

## Playwright project naming

| Option | Description | Selected |
|--------|-------------|----------|
| `webkit-iphone` | Engine + form factor literal; future-proof for `webkit-ipad` | ✓ |
| `mobile-safari` | Branded — what users see |  |
| `ios` | Generic — covers any iOS form factor |  |

**Auto-selected (recommended):** `webkit-iphone`. Rationale: matches the existing `chromium` project naming convention (engine, not vendor); future-proofs for adding iPad later; Playwright's underlying browser is "webkit" and it's unambiguous for engineers.

---

## Self-test pattern

| Option | Description | Selected |
|--------|-------------|----------|
| `console.warn` on regression | Logs to stderr; suite continues |  |
| `console.error` + `throw` | Mirrors the existing `HTMLDialogElement` pattern (lines 122–149) | ✓ |
| Skip self-test entirely | Trust the polyfill; rely on per-test failure to surface regressions |  |

**Auto-selected (recommended):** `console.error` + `throw`. Rationale: a silently-regressed polyfill that returns `undefined` from `dispatchVisualViewportResize` would let Phase 49 tests pass without exercising the runtime — the EXACT scenario that motivated the entire Wave-0 phase. The throw at startup is the only mechanism that prevents green-by-accident CI.

---

## Phase scope guardrails (no scope creep)

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate all 7 existing Playwright specs to run under both projects in Phase 47 | Maximum coverage immediately |  |
| Just add the new project + a single smoke spec; let existing specs stay chromium-only for now | Wave-0 unblocks Phases 48 + 49 with minimum surface | ✓ |
| Skip the smoke spec; let Phase 48's first webkit spec serve as the wiring proof | Even more minimal |  |

**Auto-selected (recommended):** New project + single smoke spec. Rationale: Phase 47's job is to UNBLOCK Phases 48 + 49, not to do their work. A smoke spec proves the project is wired correctly without expanding Phase 47's surface. Migrating existing specs is a deferred follow-up captured in CONTEXT.md `<deferred>`.

---

## Claude's Discretion

- **Exact TypeScript shape of the EventTarget-backed polyfill** (object literal vs class extends) — left to executor based on what compiles cleanest under TS 6 strict.
- **Smoke spec wording** — `expect(typeof window.visualViewport).toBe('object')` is the floor; planner / executor may add 1–2 sanity assertions if convenient.
- **Whether the helper module exports a default object or named functions** — left to executor; both are idiomatic in this codebase.
- **Naming of the smoke spec file** — suggested `e2e/webkit-smoke.spec.ts` but executor may pick a different conventional name.

## Deferred Ideas

- Migrate existing Playwright specs (`favorites-nav`, `feeds`, `gir`, `pert`, `formula`, `uac-uvc`, `desktop-full-nav*`) to also run under `webkit-iphone` — out of Phase 47 scope.
- `simulateOrientationChange()` helper — Phase 49 may add if needed.
- Real-device coverage via Playwright cloud (BrowserStack / SauceLabs) — Phase 50's real-iPhone smoke checklist is v1.15.1's answer; cloud devices are a future-milestone tech-debt item.
- VirtualKeyboard API shim — iOS doesn't implement it; not adding to the polyfill.
