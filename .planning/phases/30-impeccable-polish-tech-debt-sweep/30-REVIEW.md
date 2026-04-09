---
phase: 30-impeccable-polish-tech-debt-sweep
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - e2e/formula.spec.ts
  - e2e/gir.spec.ts
  - e2e/morphine-wean.spec.ts
  - e2e/navigation.spec.ts
  - package.json
  - src/app.css
  - src/app.d.ts
  - src/lib/gir/GirCalculator.svelte
  - src/lib/gir/gir-config.json
  - src/lib/morphine/MorphineWeanCalculator.svelte
  - src/lib/shared/components/SegmentedToggle.svelte
  - src/lib/shared/components/SegmentedToggleHarness.svelte
  - src/virtual-pwa.d.ts
  - tsconfig.json
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 30: Code Review Report

**Reviewed:** 2026-04-09
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Reviewed the Phase 30 polish-sweep file set: three e2e specs, the nav e2e, package manifest, global CSS, GIR + Morphine calculators, SegmentedToggle + harness, and TS ambient declarations. No critical correctness or security issues. Code quality is generally high and consistent with project conventions (Svelte 5 runes, OKLCH tokens, bind:value patterns). A few correctness concerns worth addressing around non-null assertions that rely on `$derived` evaluation order, a selector coupled to a CSS variable name, and a subtle state leak in the magnification effect.

## Warnings

### WR-01: Non-null assertions on `$derived` values depend on ordering assumption

**File:** `src/lib/gir/GirCalculator.svelte:20-22`
**Issue:** `pulseKey` uses `currentGir!.toFixed(1)` and `initialRate!.toFixed(1)` inside a ternary guarded by `result`. This works today because `currentGir`/`initialRate` are derived from the same `result`, but it is a fragile non-null assertion: any future refactor that changes their derivation sources can silently crash at runtime rather than be caught at compile time.
**Fix:** Derive directly from `result` in the same expression:
```ts
let pulseKey = $derived(
  result ? `${result.currentGirMgKgMin.toFixed(1)}-${result.initialRateMlHr.toFixed(1)}` : ''
);
```
Same pattern applies to lines 133 and 142 where `currentGir!`/`initialRate!` are used inside an `{#if result}` block — those are safe but would be more robust as `result.currentGirMgKgMin`.

### WR-02: Morphine test selector couples to CSS-variable class name

**File:** `e2e/morphine-wean.spec.ts:27,49`
**Issue:** `page.locator('.bg-\\[var\\(--color-identity-hero\\)\\]')` selects the summary card by its Tailwind arbitrary-value class string. Any rename of `--color-identity-hero` or migration away from arbitrary values (a real possibility given the "polish / tech debt" phase) silently breaks the test with a confusing "element not found" rather than a targeted failure. The card already has `aria-live="polite" aria-atomic="true"` — prefer a stable hook.
**Fix:** Add `data-testid="morphine-summary"` to the summary `<div>` at `MorphineWeanCalculator.svelte:195` and use `page.getByTestId('morphine-summary')` in the spec.

### WR-03: `triggerMagnification` closure variable is dead / leaked

**File:** `src/lib/morphine/MorphineWeanCalculator.svelte:30,94,104`
**Issue:** `triggerMagnification` is declared, assigned, and cleared in the teardown, but it is never read anywhere (no external caller, no exported API). The comment says "Expose magnification trigger for mode-switch re-initialization" but the MutationObserver already handles mode-switch re-initialization on line 97-98. This is dead code that obscures intent and slightly confuses the cleanup contract.
**Fix:** Remove the declaration, assignment, and teardown clearing of `triggerMagnification`. The `MutationObserver` subtree watch already covers the mode-switch case.

## Info

### IN-01: `activeStepIndex` state is written but never read in the template

**File:** `src/lib/morphine/MorphineWeanCalculator.svelte:19,76-79`
**Issue:** `activeStepIndex` is tracked via `$state` and updated during scroll, but no template binding or derived uses it. It is effectively dead reactive state that triggers re-renders on every scroll frame (Svelte will schedule reactive updates even with no consumers).
**Fix:** Remove `activeStepIndex` and the associated `bestIdx`/comparison block, or wire it to an actual visual effect (e.g., aria-current on the nearest step).

### IN-02: `SegmentedToggle` uses `crypto.randomUUID()` at module evaluation without fallback

**File:** `src/lib/shared/components/SegmentedToggle.svelte:21`
**Issue:** `crypto.randomUUID()` is available in all modern browsers and is fine for a PWA, but this PWA targets mobile Safari where `crypto.randomUUID` requires iOS 15.4+. Graceful fallback would future-proof against any non-secure context usage (e.g., older dev-time http preview).
**Fix:** `const uid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);` — or use Svelte's own `$props.id()` if/when adopted.

### IN-03: `deltaHero` not exhaustive-checked on kind discriminant

**File:** `src/lib/gir/GirCalculator.svelte:196-222`
**Issue:** The `{#if hero.kind === 'stop'}{:else if hero.kind === 'no-change'}{:else}` chain implicitly treats any non-stop/no-change as `'delta'`. If a fourth case is ever added to `DeltaHero`, the template silently mis-renders instead of failing at type-check.
**Fix:** Add an exhaustive check helper or use `{#if hero.kind === 'delta'}` explicitly and emit nothing in an `{:else}` for safety.

### IN-04: e2e specs use `.catch(() => {})` to swallow understand-button absence

**File:** `e2e/formula.spec.ts:6-9`, `e2e/gir.spec.ts:16-19`, `e2e/morphine-wean.spec.ts:6-9`, `e2e/navigation.spec.ts:6-9`
**Issue:** Pattern is repeated in four files. Swallowing errors is acceptable here (button may legitimately not exist in subsequent runs after localStorage dismissal) but duplicating the helper makes future updates error-prone.
**Fix:** Extract to `e2e/_helpers.ts` as `dismissDisclaimer(page)` and import.

### IN-05: `gir-config.json` has `severe-neuro` bucket with label that re-uses clinical language from config

**File:** `src/lib/gir/gir-config.json:13`
**Issue:** Not a bug — but the recent commit `5dc06ca` deferred the "severe-neuro clinical copy question" to NOTES.md. Flagging here only as a reminder that this line is the one referenced by the deferred question.
**Fix:** No action required in this phase; tracked in NOTES.md.

---

_Reviewed: 2026-04-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
