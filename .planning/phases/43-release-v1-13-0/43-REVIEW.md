---
phase: 43-release-v1-13-0
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - package.json
  - src/app.css
  - e2e/uac-uvc.spec.ts
  - e2e/morphine-wean-a11y.spec.ts
  - e2e/feeds-a11y.spec.ts
  - e2e/gir-a11y.spec.ts
  - e2e/feeds.spec.ts
  - e2e/gir.spec.ts
  - e2e/morphine-wean.spec.ts
  - e2e/formula.spec.ts
findings:
  critical: 0
  warning: 0
  info: 4
  total: 4
status: clean
---

# Phase 43: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 10
**Status:** clean (no critical/warning issues; 4 informational notes)

## Summary

The diff is exactly what the phase advertises: a `1.12.5 → 1.13.0` version bump, a single OKLCH light-mode color-token tweak (`--color-text-tertiary` L=50% → L=47%), and 8 Playwright spec updates that propagate two upstream contract changes into the e2e suite:

1. `RangedNumericInput` mounts BOTH a textbox (`<label for="...">`) and a `bits-ui` Slider Thumb whose `aria-label` is `${label} slider`. A bare `page.getByLabel('Weight')` is a substring match → matches the textbox AND the slider thumb → strict-mode violation. The fix adds `{ exact: true }` to every collision-prone label across all 8 specs.
2. The `Open inputs drawer` aria-label was retired when the `InputsRecap` button took over as the drawer trigger (the recap's composed aria-label ends with `Tap to edit inputs.`). Specs now target the new label via `getByRole('button', { name: /tap to edit inputs/i })`.

I verified there are no `disableRules()` calls in the axe specs, no `.skip` markers, no `test.fixme`, and no test deletions. The fixes are semantically grounded (real DOM duplication, real label collisions) rather than papering over symptoms.

The `text-tertiary` token change is a real WCAG contrast fix (verified with the prompt's stated baseline against `--color-surface-alt` — the GIR severe-neuro card tint). All 46 call sites of the token render text on lighter surfaces in light mode; darkening them strictly improves contrast and cannot regress any of the existing surfaces (`surface`, `surface-alt`, `surface-card`). Dark-mode token (line 102) is untouched.

### What I checked

| Concern | Result |
|---|---|
| `disableRules()` introduced anywhere in axe specs | No |
| `.skip` / `test.fixme` introduced | No |
| Test bodies deleted or assertions weakened | No — every spec preserves its prior assertions; only locators changed |
| `exact: true` applied consistently across siblings | Yes — Weight / Dosing weight / Max morphine dose / Decrease per step / Dextrose / Fluid order all use the same pattern |
| Old "Open inputs drawer" label is fully retired in source | Yes (`grep` returns 0 hits) |
| New "Tap to edit inputs" label exists in source | Yes — `src/lib/shared/components/InputsRecap.svelte:83` |
| Side-effect surface of the `--color-text-tertiary` change | 46 call sites; all render on lighter surfaces in light mode → darker token only improves contrast everywhere it's used |
| Dark-mode `--color-text-tertiary` (L=62%) untouched | Confirmed |
| Cross-file: every `<aside aria-label="X inputs">` actually exists in routes | Confirmed for Formula, GIR, UAC/UVC, Feeds, Morphine |

## Info

### IN-01: Desktop Formula spec relies on Playwright's default viewport rather than declaring one

**File:** `e2e/formula.spec.ts:7-35`
**Issue:** The `Formula Calculator (desktop)` describe block does NOT call `test.use({ viewport })` — it implicitly relies on Playwright's default (currently 1280x720, which is `>= md`). The desktop scoping `aside[aria-label="Formula inputs"]` and the `visible=true` selector both depend on this being a desktop viewport. If the project's `playwright.config.ts` ever sets a smaller default (or a `--project=mobile` profile is added), this test will silently start asserting against the wrong DOM (the aside has `hidden md:block`, so it would be invisible at < md). The mobile describe block correctly declares its viewport.

**Fix:** Make the desktop viewport explicit:
```ts
test.describe('Formula Calculator (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  // ...
});
```
This matches the convention used in `feeds.spec.ts`, `gir.spec.ts`, and `uac-uvc.spec.ts`.

### IN-02: a11y specs target inputs at page-level rather than scoping to the active container

**File:** `e2e/morphine-wean-a11y.spec.ts:49-58, 75-83, 94, 118`, `e2e/gir-a11y.spec.ts:46-51, 67-69, 89-91, 117-119`, `e2e/feeds-a11y.spec.ts:26, 42, 57, 76, 86, 90, 104`
**Issue:** These specs use `page.getByLabel('Weight', { exact: true })` directly — not scoped to `aside[aria-label="… inputs"]`. This works today because `InputDrawer.svelte` renders its children inside `{#if expanded}` (collapsed drawer = no input duplicates in the DOM). But if the drawer is ever changed to render eagerly (e.g. for warm-up transitions, drawer-prefetch, or content measurement), these specs will hit the same strict-mode collision the happy-path specs already had to fix. The happy-path specs (`feeds.spec.ts`, `gir.spec.ts`, `uac-uvc.spec.ts`) defensively scope via `getInputsScope(...)`; the a11y specs do not.

**Fix:** Apply the same `getInputsScope` pattern (or scope to `aside[aria-label="… inputs"]` since a11y specs run at the default desktop viewport). Optional for this release; flagging because it's a latent fragility the same RangedNumericInput contract change exposed in the happy-path specs.

### IN-03: `getByText(/ml/i).locator('visible=true').first()` is loose

**File:** `e2e/formula.spec.ts:33`
**Issue:** The recipe-output assertion `page.getByText(/ml/i).locator('visible=true').first()` matches any text containing the substring "ml" (case-insensitive). On the formula page that includes `mL` (volume suffix), recipe ml outputs, and any future copy with "html"/"ml"/etc. The `visible=true` and `.first()` filters reduce — but don't eliminate — the risk of matching the wrong element on a future copy change. This is more of a semantic-rigor note than a bug; the test passes today.

**Fix:** Tighten the assertion to a structural locator. Examples:
```ts
// Option A: anchor on a number+unit pattern
await expect(page.getByText(/^\d+(\.\d+)?\s*ml$/i).locator('visible=true').first()).toBeVisible();

// Option B: scope to the recipe card by its accessible role/label
const recipe = page.getByRole('region', { name: /recipe/i });
await expect(recipe.getByText(/ml/i).first()).toBeVisible();
```

### IN-04: No regression test pins the `--color-text-tertiary` contrast ratio

**File:** `src/app.css:75`
**Issue:** The L=50% → L=47% tweak is a measured WCAG fix (against `--color-surface-alt` on the GIR severe-neuro card), but no test asserts the resulting contrast ratio. The existing axe specs (`gir-a11y.spec.ts`, `morphine-wean-a11y.spec.ts`, `feeds-a11y.spec.ts`) only run axe against rendered routes; they will catch a frank failure but won't pin THIS specific surface↔text pair if the severe-neuro card variant isn't on screen during the existing scenarios. A future rebalance of `--color-surface-alt` lightness, or a revert of this token, can silently regress without breaking any test.

**Fix:** Optional — add an a11y scenario that explicitly renders the severe-neuro card and runs axe (or a unit test that computes the contrast ratio between `--color-text-tertiary` and `--color-surface-alt` from the parsed CSS token values). Out of scope for a release phase; recording as a follow-up.

---

## Verification Notes (positive findings)

These are NOT issues — recording them so a future reviewer doesn't have to re-derive the analysis:

- **`exact: true` is the semantically correct fix, not a workaround.** `RangedNumericInput.svelte:99-145` mounts a `Slider.Thumb` with `aria-label={effectiveSliderAriaLabel}` where `effectiveSliderAriaLabel = ${label} slider`. Playwright's `getByLabel` uses substring matching by default, so `getByLabel('Weight')` matches both the textbox label AND the thumb's `aria-label="Weight slider"`. `exact: true` is the right disambiguator and exactly matches the contract change.
- **The `Tap to edit inputs.` aria-label is composed inside `InputsRecap.svelte:78-84`** as `"<item list>. Tap to edit inputs."` — the regex `/tap to edit inputs/i` reliably matches it on every calculator page, regardless of which RecapItems are populated.
- **The desktop `aside[aria-label="X inputs"]` scope is real on every route.** Verified `aria-label` strings match across `src/routes/{formula,gir,uac-uvc,feeds,morphine-wean}/+page.svelte` and the test files.
- **`InputDrawer.svelte:88` (`{#if expanded}`)** prevents drawer-content duplication when collapsed — this is why the a11y specs work today even though they don't scope to a container.
- **Dark-mode `text-tertiary` token (L=62%) is intentionally untouched.** The light-mode change cannot affect dark-mode contrast.
- **All 46 call sites of `text-[var(--color-text-tertiary)]`** render on `--color-surface`, `--color-surface-card`, or `--color-surface-alt` — three lighter surfaces in light mode. Going darker (47% from 50%) only improves contrast; it cannot regress any existing pair.

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
