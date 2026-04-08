# Phase 12 / Plan 01 — Summary

**Plan:** Atomic native `<dialog>`-based SelectPicker rewrite
**Status:** ✅ COMPLETE
**Date:** 2026-04-07

## What was built

### `src/lib/shared/components/SelectPicker.svelte` (rewrite)
- Removed `import { Select } from 'bits-ui'`.
- Replaced bits-ui `Select.Root/Trigger/Content/...` with a hand-rolled Svelte 5 component built on native `<dialog>.showModal()`.
- Public API is byte-identical (`label`, `value` via `$bindable`, `options`, `placeholder`, `class`) — `FortificationCalculator.svelte` required zero edits.
- Preserves DOM contract required by `FortificationCalculator.test.ts`: `data-select-trigger`, `aria-labelledby` on trigger, selected label in trigger textContent, `{#if open}`-guarded option list (no option text nodes while closed).
- **BLOCKER fix (option a):** the `<dialog>` labels itself via a distinct `dialogTitleId = ${labelId}-title` only when `open`, so `screen.getByLabelText('Unit')` resolves to exactly one element (the trigger) while the picker is closed — no collision with the dialog in jsdom.
- Keyboard: Arrow/Home/End navigate options (via listbox `onkeydown`); Enter / Space / click select; Esc is handled natively by `<dialog>` → `onclose` handler refocuses the trigger.
- Grouped rendering: when any option has `.group`, emits `role="group" aria-labelledby={headingId}` containers with sticky headings, in source order (keyboard index matches flat order).
- Mobile: bottom-sheet layout at `max-width: 640px`, `env(safe-area-inset-bottom, 0px)` respected, `min-h-12` (48px) touch targets throughout.
- Backdrop: `::backdrop { background: var(--color-scrim) }` — token-driven.
- Zero hardcoded color literals.

### `src/app.css`
- Added `--color-scrim: oklch(18% 0.012 230 / 0.55)` to `:root`.
- Added `--color-scrim: oklch(8% 0.012 240 / 0.70)` to `.dark, [data-theme="dark"]`.

### `src/test-setup.ts`
- Added jsdom `HTMLDialogElement` polyfill: `showModal`, `show`, `close` all implemented; `close()` synchronously dispatches a `close` Event so `dialog.addEventListener('close', …)` listeners fire in jsdom.
- **BLOCKER fix (option b):** polyfill defaults closed dialogs to `style.display = 'none'`; `showModal`/`show` unset it; `close` re-applies it. Defense-in-depth against any future regression in the component.
- `MutationObserver` on `document.body` catches dynamically mounted `<dialog>`s and applies the hidden-by-default state.
- Setup-time self-test throws if any invariant fails (default-hidden → showModal unhides → close listener fires synchronously → close re-hides).

### `src/lib/shared/components/SelectPicker.test.ts` (new)
- 11 colocated Vitest tests covering: placeholder rendering, trigger attributes, closed-state DOM absence, click-to-open, ArrowDown / Home / End keyboard nav, click-to-select + focus restore, grouped role=group + accessible-name querying (W3 fix: asserts both group names), `aria-selected`, selected label in trigger textContent, and **T-11 BLOCKER regression guard** asserting `queryAllByLabelText('Fruit').length === 1` while closed.

## Test results

| Suite | Result |
|-------|--------|
| `pnpm test:run -- src/lib/shared/components/SelectPicker.test.ts` | 11/11 ✅ |
| `pnpm test:run` (full) | 117/117 ✅ (106 prior + 11 new) |
| `pnpm test:run -- src/lib/fortification/FortificationCalculator.test.ts` | 8/8 ✅ (unchanged) |
| `pnpm svelte-check` | No new errors (5 pre-existing errors in unrelated files: `MorphineWeanCalculator.svelte:110`, `NavShell.svelte:2`, `+layout.svelte`, `+page.svelte` — none touch Phase 12 files) |
| `pnpm build` | ✅ PWA v1.2.0, 32 precache entries, done |

## Guards

- `git diff --quiet src/lib/fortification/FortificationCalculator.svelte` → **OK** (untouched)
- `git diff --quiet package.json` → **OK** (untouched, per PICK-06 rescope)
- `grep -rn "import.*Select.*from 'bits-ui'" src/` → **0 matches** (PICK-06 rescope satisfied)
- `grep -rn "from 'bits-ui'" src/` → exactly 2 lines, both `Dialog` imports in `AboutSheet.svelte` and `DisclaimerModal.svelte` (deferred)

## Requirements coverage

| ID | Status | Evidence |
|----|--------|----------|
| PICK-01 | ✅ | SelectPicker renders `<dialog>` via `.showModal()` — no bits-ui Select. `grep -L "from 'bits-ui'"` passes on the component. |
| PICK-02 | ✅ | T-05 (ArrowDown), T-06 (Home/End), T-07 (click-to-close + trigger refocus). Esc handled natively by `<dialog>`. |
| PICK-03 | ✅ | T-08 asserts `queryAllByRole('group').length === 2` plus both group names (`Greek`, `Numbers`). Fortification Formula picker (grouped by manufacturer) continues to render correctly per full-suite pass. |
| PICK-04 | ✅ | Component uses only `var(--color-*)` tokens; `grep -E "#[0-9a-fA-F]{3,6}|rgb\(|rgba\("` returns nothing. `--color-scrim` added for backdrop. |
| PICK-05 | ✅ | `min-h-12` on trigger and every option button, `env(safe-area-inset-bottom, 0px)` on the dialog inner container, mobile bottom-sheet layout at `≤640px`. |
| PICK-06 | ✅ (rescoped) | No `bits-ui` `Select` imports anywhere in `src/`. Full `bits-ui` removal deferred per locked decision — `AboutSheet` and `DisclaimerModal` still use `bits-ui` `Dialog`. `package.json` untouched. |

## Deviations

None. Plan executed exactly as written.
