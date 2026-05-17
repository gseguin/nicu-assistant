# Phase 48: Wave-1 — Trivial Fixes (NOTCH + FOCUS) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 48-wave-1-trivial-fixes-notch-focus
**Mode:** `--auto` (Claude picked recommended defaults; no interactive AskUserQuestion calls)
**Areas discussed:** NOTCH header padding, FOCUS auto-focus removal, Build order

---

## NOTCH — Header padding strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Bare `env(safe-area-inset-top, 0px)` | Tailwind arbitrary-value `pt-[env(safe-area-inset-top,0px)]` with no floor — `0` is correct fallback in Safari browser-tab mode | ✓ |
| `max(env(safe-area-inset-top,0px), 16px)` floor | Adds a hardcoded 16px minimum so chrome looks "padded" even in non-PWA contexts | |
| New wrapper element above `<header>` | Introduce a `<div>` between `<body>` and `<header>` carrying the inset, leaving `<header>` untouched | |
| `--header-h` CSS custom property | Compute live header height in JS, expose via custom property, consume in routes' `top-20` asides | |

**Auto-selected:** Bare `env(safe-area-inset-top, 0px)`
**Reason:** PITFALLS.md P-10 documents that `max()` floor breaks the Phase 42.1 "hero fills viewport on mount" contract silently in browser-tab mode. New wrapper adds DOM noise for zero benefit (the existing `<header>` already paints `bg-[var(--color-surface)]` which extends into the `padding-top` region by default). `--header-h` was rejected because no consumer needs to read the live header height — `top-20` (80 px) already clears `min-h-14` (56 px) + 47 px Dynamic Island.

---

## NOTCH — Side-inset (landscape) strategy

| Option | Description | Selected |
|--------|-------------|----------|
| `px-[max(env(safe-area-inset-left,0px),1rem)]` (mirrors right) | Replace existing `px-4` with a max-of-inset-or-1rem to preserve the 1rem gutter when inset is 0 (browser-tab) | ✓ |
| Keep `px-4`, add only `pt-[env(...)]` | Ship NOTCH-01 + NOTCH-03 only; defer NOTCH-02 (landscape) to Phase 49 | |
| Separate `pl-[env(...)]` and `pr-[env(...)]` declarations | Two utility classes instead of one shorthand | |

**Auto-selected:** `px-[max(env(safe-area-inset-left,0px),1rem)]`
**Reason:** PITFALLS.md P-11 mandates landscape coverage; ROADMAP.md Success Criterion #2 calls out landscape rotation explicitly. The `max()` form preserves the existing `1rem` gutter exactly when the inset is 0. Splitting into separate `pl-` / `pr-` rules adds one Tailwind class for no additional capability.

---

## FOCUS — Replacement focus target after deletion

| Option | Description | Selected |
|--------|-------------|----------|
| `autofocus` attribute on header close button | Declarative HTML; native `<dialog>.showModal()` autofocus behavior wins; VoiceOver announces "Close inputs, button" | ✓ |
| `dialog.focus()` imperatively in the effect | Programmatic focus on the dialog itself; VoiceOver announces "Inputs, dialog" | |
| Rely on browser default autofocus heuristic | No explicit focus management; let `<dialog>.showModal()` pick "first focusable child" | |
| Narrow the existing selector to "non-text first focusable" | Keep the `queueMicrotask` block but exclude text-summoning controls | |

**Auto-selected:** `autofocus` attribute on close button
**Reason:** PITFALLS.md P-13 explicitly rejects "narrow the selector" — the latent bug returns for SegmentedToggle-first calculators (Feeds). PITFALLS.md P-14 explicitly rejects "browser default" — Chrome/Edge desktop and Safari diverge. `dialog.focus()` works but is imperative + dialog-level (announces "Inputs, dialog" — less informative than "Close inputs, button"). `autofocus` is declarative, deterministic, and gives VoiceOver the most useful announcement.

---

## FOCUS — Which button gets `autofocus`

| Option | Description | Selected |
|--------|-------------|----------|
| Header close button (always present) | `<button aria-label="Close inputs">` at `InputDrawer.svelte:107-119` | ✓ |
| Header Clear button (when present) | `<button aria-label="Clear inputs">` at `InputDrawer.svelte:98-105` (conditional `{#if onClear}`) | |
| Both — Clear if present, else close | Conditional `autofocus` on whichever exists | |

**Auto-selected:** Header close button
**Reason:** Clear is conditional (not present on every calculator); single source of truth requires the same target on every drawer-open. Close button is rendered AFTER Clear in DOM order, but explicit `autofocus` wins over the native first-focusable heuristic.

---

## FOCUS — Test coverage shape

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest activeElement + source-grep + cross-calc Playwright | Three test layers: behavioral (vitest), structural (source-grep), end-to-end (Playwright across 6 calculators) | ✓ |
| Vitest activeElement only | Single behavioral assertion in `InputDrawer.test.ts` | |
| Cross-calc Playwright only | Single end-to-end spec covering all 6 routes | |
| All three but in a single mega-spec | Combine into one Playwright spec asserting both DOM state and source content | |

**Auto-selected:** Three test layers (matching FOCUS-TEST-01 + FOCUS-TEST-02 + FOCUS-TEST-03 verbatim)
**Reason:** REQUIREMENTS.md mandates all three. Three layers catch three different regression modes: vitest catches "the effect did/didn't run," source-grep catches "someone re-pasted the deleted block," Playwright catches "per-calculator divergence." Skipping any one leaves a gap.

---

## Build order — single plan vs two sibling plans

| Option | Description | Selected |
|--------|-------------|----------|
| Two sibling plans, FOCUS first | `48-01-PLAN.md` FOCUS, `48-02-PLAN.md` NOTCH; sequential commits on a single branch | ✓ |
| Single combined plan | One `48-01-PLAN.md` covering both NOTCH and FOCUS together | |
| Two parallel worktrees | Spawn parallel executors via `/gsd-new-workspace`; merge separately | |
| NOTCH first, FOCUS second | Reverse order — NOTCH unblocks visual verification but doesn't unblock Phase 49 | |

**Auto-selected:** Two sibling plans, FOCUS first
**Reason:** PITFALLS.md and Phase 49 dependency chain make FOCUS-first preferable — Phase 49's drawer-anchoring tests need the auto-focus confound removed first. Two sibling plans is the right granularity per the v1.15.1 milestone decision (STATE.md): "Wave-1 NOTCH + FOCUS combined into a single phase because they touch different files." Two plans inside one phase preserves the touch-different-files benefit while keeping each plan self-contained. Parallel worktrees are over-engineered for two ~10-LOC changes.

---

## Claude's Discretion

- **`--auto` mode:** All decisions above were picked from the recommended defaults in PITFALLS.md HIGH-confidence research, REQUIREMENTS.md verbatim acceptance criteria, ROADMAP.md success criteria, and the Phase 47 CONTEXT.md test-scaffolding conventions. The user invoked with `--auto`, signaling trust in the synthesized approach. Anything below the level of "what attribute lives on what element" is left to the planner / executor.
- **Test file naming:** Co-located per the user's `feedback_test_colocation.md` memory — `NavShell.test.ts` next to `NavShell.svelte`, `InputDrawer.test.ts` already exists (extended). Cross-calculator Playwright spec at `e2e/drawer-no-autofocus.spec.ts` (existing convention).
- **Comment cleanup:** The lines 47-50 comment in `InputDrawer.svelte` describing the original auto-focus intent is deleted along with the code block (becomes false otherwise). No replacement comment is written — the new control flow is self-explanatory.
- **Plan split exact filenames:** Recommendation is `48-01-PLAN.md` (FOCUS) + `48-02-PLAN.md` (NOTCH); planner may collapse to one plan if they prefer. Either is acceptable.

## Deferred Ideas

- `--header-h` CSS custom property (PITFALLS.md P-09 suggestion) — rejected for Phase 48 because no consumer needs it. Re-introduce in a future phase if a sticky element needs the live header height.
- Migrate existing 6 e2e specs to also run under `webkit-iphone` — Phase 47 D-15 deferral inherited; Phase 48 only adds the new `drawer-no-autofocus.spec.ts` spec under both projects.
- FOUC theme-color sync for `black-translucent` legibility (PITFALLS.md P-12) — Phase 50's SMOKE-09 will surface whether mitigation is needed; out of Phase 48 scope.
- Per-calculator Tab-order audit (PITFALLS.md P-17 — "Tab from close button lands on first focusable input") — partial coverage in FOCUS-TEST-03; full audit deferred unless a calculator's first-focus is non-focusable.
- Inline help text "Close inputs" → "Done" UX polish — out of NOTCH/FOCUS scope.
- Animated focus indicator on the close button — existing `focus-visible:outline-*` declarations already cover this.
