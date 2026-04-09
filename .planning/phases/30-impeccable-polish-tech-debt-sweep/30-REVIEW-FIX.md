---
phase: 30-impeccable-polish-tech-debt-sweep
fixed_at: 2026-04-09T00:00:00Z
review_path: .planning/phases/30-impeccable-polish-tech-debt-sweep/30-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 30: Code Review Fix Report

**Fixed at:** 2026-04-09
**Source review:** .planning/phases/30-impeccable-polish-tech-debt-sweep/30-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (all Warnings; no Critical findings)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: Non-null assertions on `$derived` values depend on ordering assumption

**Files modified:** `src/lib/gir/GirCalculator.svelte`
**Commit:** 67b10bd
**Applied fix:** Replaced `currentGir!`/`initialRate!` non-null assertions with direct reads from `result.currentGirMgKgMin` / `result.initialRateMlHr` in `pulseKey` (line 20-22) and in the template (lines 133, 142). The `result`-guarded access is now type-safe without fragile assertions.

### WR-02: Morphine test selector couples to CSS-variable class name

**Files modified:** `src/lib/morphine/MorphineWeanCalculator.svelte`, `e2e/morphine-wean.spec.ts`
**Commit:** 623ad3c
**Applied fix:** Added `data-testid="morphine-summary"` to the summary `<div>` and switched both e2e spec locators (`page.locator('.bg-\\[var\\(--color-identity-hero\\)\\]')`) to `page.getByTestId('morphine-summary')`.

### WR-03: `triggerMagnification` closure variable is dead / leaked

**Files modified:** `src/lib/morphine/MorphineWeanCalculator.svelte`
**Commit:** 623ad3c (bundled with WR-02 — both changes touched the same file and were atomically committed together)
**Applied fix:** Removed the `triggerMagnification` declaration, assignment after the initial pass, and the teardown `triggerMagnification = null`. The `MutationObserver` subtree watch already handles mode-switch re-initialization.

## Skipped Issues

None.

---

_Fixed: 2026-04-09_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
