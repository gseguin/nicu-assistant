# Phase 15 / Plan 01 — Summary

**Plan:** Shell & Navigation Polish
**Status:** ✅ COMPLETE
**Date:** 2026-04-07

## What was built

Single markup-only edit to `src/lib/shell/NavShell.svelte`:

### SHELL-01 — Title bar
- `<header>` gained `min-h-14` (56 px), giving bedside thumb room while staying above the 48 px WCAG floor.
- App name span: added `tracking-tight` for cleaner brand typography.
- Desktop calculator tab anchors: added `rounded-t-lg` + `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]` — keyboard users now see a crisp accent ring.

### SHELL-02 — Bottom tab bar (mobile)
- `min-h-[48px]` → `min-h-14` (calmer row rhythm).
- Added `transition-colors` for a calm active-state handoff.
- Added `focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]` — keyboard focus is now visible inside the thumb zone.
- Active state: `text-[var(--color-accent)] font-semibold` (weight bump + accent).
- Inactive state: `text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]` (hover affordance for pointer devices).

### SHELL-03 — Theme toggle + About sheet invocation
The `icon-btn` class in `app.css` already provides hover + focus-visible (accent box-shadow). No changes needed to the icon-button markup. AboutSheet internals remain untouched — full bits-ui Dialog port is deferred per the v1.3 decision.

## Test results

| Suite | Result |
|-------|--------|
| `pnpm test:run -- src/lib/shell/` | 117/117 ✅ (ran full suite) |
| `pnpm build` | ✅ |

All NavShell source-grep assertions still pass:
- `sticky top-0`, `z-10`, `NICU Assist`, `fixed bottom-0`, `hidden md:flex` — preserved
- Header section contains `About this calculator` and `theme.toggle`
- Bottom nav section does NOT contain `About this calculator` or `theme.toggle`
- Bottom nav contains `flex-1`

## Guards

- `git diff --stat src/` → `NavShell.svelte` only (8+/6-)
- No hardcoded colors; OKLCH tokens only
- AboutSheet.svelte + DisclaimerModal.svelte untouched (bits-ui port deferred)
- No new imports

## Requirements coverage

| ID | Status | Evidence |
|----|--------|----------|
| SHELL-01 | ✅ | Title bar `min-h-14`, app name `tracking-tight`, desktop tab anchors have visible focus outline |
| SHELL-02 | ✅ | Bottom tab bar has refined active (weight+accent), hover, and focus-visible states via OKLCH tokens |
| SHELL-03 | ✅ | Theme toggle + Info button icon-buttons already have focus-visible via `icon-btn` base class; AboutSheet invocation cohesive |

## Deviations

None. `icon-btn` already supplied the visible focus state for the icon buttons, so no additional classes were needed there.
