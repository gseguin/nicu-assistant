# Phase 28: GIR A11y, E2E & Ship — Research

**Researched:** 2026-04-09
**Domain:** Playwright E2E + axe-core a11y sweeps, Vitest component tests, OKLCH contrast tuning, version bump + docs
**Confidence:** HIGH (all patterns exist verbatim in repo — verified from source)

## Summary

Phase 28 is the ship gate for v1.8 GIR. Phase 27 already landed `GirCalculator.svelte`, `GlucoseTitrationGrid.svelte`, `/gir/+page.svelte`, the `.identity-gir` OKLCH block, and the registry entry. Existing `*.test.ts` files for GirCalculator and GlucoseTitrationGrid exist but only cover a minimal subset of what TEST-02 requires — they must be **extended**, not created. No e2e or a11y specs for GIR exist yet.

The e2e + a11y patterns are mature and exact copies of `morphine-wean-a11y.spec.ts` / `morphine-wean.spec.ts` / `fortification-a11y.spec.ts` apply directly — the planner can literally fork those files. NumericInput already hardcodes `inputmode="decimal"` (verified), so TEST-06 is an assertion, not a code change.

**Two latent bugs** surfaced during research that Phase 28 MUST fix (not optional):
1. `CalculatorId` type in `src/lib/shared/types.ts` only contains `'morphine-wean' | 'formula'` — missing `'gir'`. This will become a TS error the moment `aboutContent` adds a GIR entry (DOC-01).
2. `NavShell.svelte` line 11-13: `activeCalculatorId` is a ternary on `/formula` vs fallback to `'morphine-wean'` — on `/gir`, the AboutSheet currently renders **morphine-wean content**. Must add a `/gir → 'gir'` branch.

**Primary recommendation:** Fork `morphine-wean-a11y.spec.ts` → `gir-a11y.spec.ts` (6 variants), fork `morphine-wean.spec.ts` → `gir.spec.ts` (happy path + inputmode assertion), extend existing `GirCalculator.test.ts` / `GlucoseTitrationGrid.test.ts` with the coverage gaps, fix the two latent bugs, bump version, add AboutSheet entry.

## User Constraints

No CONTEXT.md exists for Phase 28 — no locked decisions beyond ROADMAP success criteria and REQUIREMENTS.md (TEST-02, TEST-04, TEST-05, TEST-06, DOC-01, DOC-02, DOC-03). All freedoms below are Claude's discretion within those requirements.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-02 | Component tests cover empty-state, valid-input flow, bucket selection, full keyboard nav (↑/↓/Home/End/Space/Enter), Δ-glyph rendering | Existing `GirCalculator.test.ts` has empty-state + advisory; `GlucoseTitrationGrid.test.ts` has ArrowDown/Home/End/click + glyphs. **Gaps:** ArrowUp, ArrowLeft, ArrowRight, Space, Enter, valid-input flow propagation from GirCalculator, bucket-selection-updates-target-hero in GirCalculator parent test |
| TEST-04 | `gir.spec.ts` happy-path on mobile + desktop viewports | Fork `e2e/morphine-wean.spec.ts`. `playwright.config.ts` currently has only `chromium` project — must add `'Mobile Chrome'` (Pixel 5) project OR use per-test `page.setViewportSize` |
| TEST-05 | `gir-a11y.spec.ts` axe sweeps: light + dark + focus-visible + advisory + selected-bucket; update overall sweep count | Morphine (6 variants) + Fortification (4 variants) = 10 existing sweeps + 6 new GIR = 16/16. Exact theme-toggle pattern: `.no-transition` class + `document.documentElement.classList.add('dark')` + `waitForTimeout(250)` |
| TEST-06 | All 3 NumericInput fields carry `inputmode="decimal"` — Playwright assertion | `NumericInput.svelte:135` hardcodes `inputmode="decimal"` — already green. Add Playwright assertion for regression safety |
| DOC-01 | AboutSheet: add GIR entry citing `GIR-Wean-Calculator.xlsx` + MDCalc OR Hawkes PMC7286731; note institutional titration | `aboutContent` is `Record<CalculatorId, AboutContent>` in `src/lib/shared/about-content.ts`. Must extend `CalculatorId` type first |
| DOC-02 | `package.json` → `1.8.0`; About dialog reflects via existing Vite define | `about-content.ts:12` reads `__APP_VERSION__` from Vite define — already wired. Just bump `package.json` `"version": "1.7.0"` → `"1.8.0"` |
| DOC-03 | `.planning/PROJECT.md` Validated list updated with v1.8 entries | Validated list lives under `## Current Milestone` — follow v1.7 block format (✓ line per requirement) |

## Standard Stack

### Already Installed (verified `package.json`)
| Library | Version | Purpose |
|---------|---------|---------|
| `@playwright/test` | ^1.59.0 | E2E framework |
| `@axe-core/playwright` | ^4.11.1 | Axe sweeps via `AxeBuilder` |
| `vitest` | ^4.1.2 | Component test runner |
| `@testing-library/svelte` | ^5.3.1 | Component render + query |
| `@testing-library/jest-dom` | ^6.9.1 | Matchers (imported via setup) |
| `jsdom` | ^29.0.1 | DOM env for Vitest |

**No new dependencies required.**

## Architecture Patterns

### Pattern 1: Axe Sweep Spec File (fork from `morphine-wean-a11y.spec.ts`)

**File:** `e2e/gir-a11y.spec.ts` (new)

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('GIR Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gir');
    await page.getByRole('heading', { name: 'Glucose Infusion Rate' }).waitFor({ state: 'visible' });
    await page
      .getByRole('button', { name: /understand|acknowledge/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  // Variant 1: light mode baseline
  test('gir page has no axe violations in light mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  // Variant 2: dark mode baseline
  test('gir page has no axe violations in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(250);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  // Variant 3: focus-ring visible (identity OKLCH ring on input)
  test('gir page has no axe violations with focus ring visible (light)', async ({ page }) => {
    await page.getByLabel('Weight').focus();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  // Variant 4: advisory message (Dextrose >12.5% amber advisory)
  test('gir dextrose advisory has no axe violations (light)', async ({ page }) => {
    await page.getByLabel('Weight').fill('3.1');
    await page.getByLabel('Dextrose').fill('15');
    await page.getByLabel('Fluid order').fill('80');
    await expect(page.getByText(/requires central venous access/)).toBeVisible();
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  // Variant 5: selected bucket (identity-hero on selected row)
  test('gir selected bucket has no axe violations (light)', async ({ page }) => {
    await page.getByLabel('Weight').fill('3.1');
    await page.getByLabel('Dextrose').fill('12.5');
    await page.getByLabel('Fluid order').fill('80');
    await page.getByRole('radio').nth(3).click(); // e.g., 50-60 bucket
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  // Variant 6: selected bucket in dark mode (hero hero + dark identity contrast)
  test('gir selected bucket has no axe violations (dark)', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(250);
    await page.getByLabel('Weight').fill('3.1');
    await page.getByLabel('Dextrose').fill('12.5');
    await page.getByLabel('Fluid order').fill('80');
    await page.getByRole('radio').nth(3).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

Total: **6 new GIR sweeps**. Combined project total: morphine-wean (6) + fortification (4) + gir (6) = **16/16 sweeps**. Update PROJECT.md sweep count note from "12/12" to "16/16".

### Pattern 2: Happy-Path E2E with Mobile + Desktop Viewports

**File:** `e2e/gir.spec.ts` (new)

Since `playwright.config.ts` currently defines only the `chromium` (Desktop Chrome) project, two options exist:

**Option A (RECOMMENDED):** Add a second Playwright project for mobile and tag tests. Minimal, matches Playwright idiom.

Extend `playwright.config.ts`:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile', use: { ...devices['Pixel 5'] } },
],
```
Then run all existing specs against both. **Risk:** doubles existing sweep runtime and may surface pre-existing mobile-only issues in morphine/fortification sweeps that are out of scope for this phase.

**Option B (SCOPED):** Keep project list unchanged; use `test.use({ viewport })` inside `gir.spec.ts` describe blocks to run the same test twice at 375×667 (mobile) and 1280×800 (desktop). Isolates scope to GIR.

```typescript
import { test, expect } from '@playwright/test';

for (const viewport of [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 },
]) {
  test.describe(`GIR happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/gir');
      await page.getByRole('button', { name: /understand/i }).click({ timeout: 2000 }).catch(() => {});
    });

    test('enter inputs → current hero updates → select bucket → target hero updates', async ({ page }) => {
      await page.getByLabel('Weight').fill('3.1');
      await page.getByLabel('Dextrose').fill('12.5');
      await page.getByLabel('Fluid order').fill('80');

      // Current GIR hero populated
      await expect(page.getByText('CURRENT GIR')).toBeVisible();
      await expect(page.getByText('mg/kg/min').first()).toBeVisible();

      // Titration grid rendered (no default selection)
      const radios = page.getByRole('radio');
      await expect(radios).toHaveCount(viewport.name === 'mobile' ? 6 : 12); // mobile hides desktop grid via sm:hidden; desktop hides mobile
      // NOTE: verify this count in Wave 0 — GlucoseTitrationGrid renders both layouts with .sm:hidden / .hidden.sm:grid

      // Select a bucket
      await radios.first().click();

      // Target hero populated
      await expect(page.getByText('TARGET GIR')).toBeVisible();
    });

    test('empty-state hero renders when inputs null', async ({ page }) => {
      // State initializes with defaults per Phase 26 — test needs to clear
      await page.getByLabel('Weight').fill('');
      await expect(page.getByText(/Enter weight, dextrose %, and fluid rate/)).toBeVisible();
    });

    test('all three NumericInputs have inputmode="decimal"', async ({ page }) => {
      await expect(page.getByLabel('Weight')).toHaveAttribute('inputmode', 'decimal');
      await expect(page.getByLabel('Dextrose')).toHaveAttribute('inputmode', 'decimal');
      await expect(page.getByLabel('Fluid order')).toHaveAttribute('inputmode', 'decimal');
    });
  });
}
```

**Recommendation:** **Option B** — it's self-contained, doesn't re-run unrelated sweeps on mobile, and ROADMAP success criterion #2 says "on both mobile and desktop viewports" not "on both projects". Planner may revisit if Option A is preferred.

**Note on radio count:** Tailwind's `sm:hidden` / `hidden sm:grid` switches at `640px`. Mobile viewport 375px renders **only** the mobile layout (6 radios); desktop 1280px renders only the desktop layout (6 radios). The existing Vitest test `'renders 6 radio rows (mobile + desktop render both)'` counts 12 because jsdom has no real viewport — CSS `sm:hidden` doesn't hide in jsdom. **In Playwright the count is 6 at either breakpoint.** Verify in Wave 0.

### Pattern 3: Extended Component Tests (extend existing files)

**`src/lib/gir/GlucoseTitrationGrid.test.ts` — add:**

```typescript
it('ArrowUp moves selection backward (wraps to end from first)', async () => {
  const onselect = vi.fn();
  render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
  const radios = screen.getAllByRole('radio');
  await fireEvent.keyDown(radios[0], { key: 'ArrowUp' });
  expect(onselect).toHaveBeenCalledWith('gt70'); // wraps
});

it('ArrowRight advances selection (same as ArrowDown)', async () => {
  const onselect = vi.fn();
  render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
  await fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'ArrowRight' });
  expect(onselect).toHaveBeenCalledWith('lt40');
});

it('ArrowLeft moves selection backward (same as ArrowUp)', async () => {
  const onselect = vi.fn();
  render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: 'lt40', onselect });
  const radios = screen.getAllByRole('radio');
  const selected = radios.find((r) => r.getAttribute('aria-checked') === 'true')!;
  await fireEvent.keyDown(selected, { key: 'ArrowLeft' });
  expect(onselect).toHaveBeenCalledWith('severe-neuro');
});

it('Space selects the focused row without moving', async () => {
  const onselect = vi.fn();
  render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
  await fireEvent.keyDown(screen.getAllByRole('radio')[2], { key: ' ' });
  expect(onselect).toHaveBeenCalledWith('40-50');
});

it('Enter selects the focused row without moving', async () => {
  const onselect = vi.fn();
  render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
  await fireEvent.keyDown(screen.getAllByRole('radio')[2], { key: 'Enter' });
  expect(onselect).toHaveBeenCalledWith('40-50');
});
```

Note: current grid uses `handleKeydown` with `e.preventDefault()` on `' '` / `'Enter'` and calls `onselect(rows[idx].bucketId)` — it does NOT `selectRow(idx)`, so cursor stays put. Tests must reflect this (Space/Enter re-selects current `idx`, not moves).

**`src/lib/gir/GirCalculator.test.ts` — add:**

```typescript
it('valid inputs render non-null Current GIR and Initial rate numbers', () => {
  girState.current.weightKg = 3.1;
  girState.current.dextrosePct = 12.5;
  girState.current.mlPerKgPerDay = 80;
  render(GirCalculator);
  // Display value is first-matching num with mg/kg/min neighbor
  expect(screen.getByText('mg/kg/min')).toBeTruthy();
  // Pulse key exists when result derivable
});

it('selecting a bucket updates target-guidance hero', async () => {
  girState.current.weightKg = 3.1;
  girState.current.dextrosePct = 12.5;
  girState.current.mlPerKgPerDay = 80;
  render(GirCalculator);
  const radios = screen.getAllByRole('radio');
  await fireEvent.click(radios[2]); // 40-50 bucket in the mobile+desktop DOM
  expect(screen.getByText('TARGET GIR')).toBeTruthy();
});

it('GIR >12 advisory surfaces when computed GIR is high', () => {
  girState.current.weightKg = 1;
  girState.current.dextrosePct = 20;
  girState.current.mlPerKgPerDay = 150;
  render(GirCalculator);
  expect(screen.getByText(/GIR >12.*hyperinsulinism/)).toBeTruthy();
});

it('GIR <4 advisory surfaces when computed GIR is low', () => {
  girState.current.weightKg = 3.1;
  girState.current.dextrosePct = 5;
  girState.current.mlPerKgPerDay = 40;
  render(GirCalculator);
  expect(screen.getByText(/Below basal glucose utilization/)).toBeTruthy();
});
```

### Pattern 4: Version Bump + AboutSheet Wiring

**`package.json`:** single line change
```diff
-  "version": "1.7.0",
+  "version": "1.8.0",
```

`__APP_VERSION__` is already Vite-defined and read by `about-content.ts:12`. No other code changes for DOC-02.

**`src/lib/shared/types.ts`** — extend `CalculatorId`:
```diff
-export type CalculatorId = 'morphine-wean' | 'formula';
+export type CalculatorId = 'morphine-wean' | 'formula' | 'gir';
```

**`src/lib/shared/about-content.ts`** — add entry:
```typescript
gir: {
  title: 'Glucose Infusion Rate',
  version: appVersion,
  description:
    'Calculates Current GIR (mg/kg/min) and Initial infusion rate (ml/hr) from Weight, Dextrose %, and Fluid order, with a 6-bucket glucose-driven titration helper (Target GIR / Target rate / Δ rate).',
  notes: [
    'Formula: Current GIR = (Dex% × rate ml/hr × 10) / (Weight × 60); Initial rate = (Weight × ml/kg/day) / 24.',
    'Source spreadsheet: GIR-Wean-Calculator.xlsx (CALC tab). Formula validated against MDCalc and Hawkes et al., J Perinatol 2020 (PMC7286731).',
    'The 6-bucket titration adjustment values are an institutional protocol — verify against your unit\'s own protocol before acting.',
    'Dextrose >12.5% requires central venous access. GIR >12 mg/kg/min warrants hyperinsulinism workup.',
  ],
},
```

**`src/lib/shell/NavShell.svelte`** — fix `activeCalculatorId`:
```diff
-  const activeCalculatorId = $derived<CalculatorId>(
-    page.url.pathname.startsWith('/formula') ? 'formula' : 'morphine-wean'
-  );
+  const activeCalculatorId = $derived<CalculatorId>(
+    page.url.pathname.startsWith('/formula') ? 'formula'
+    : page.url.pathname.startsWith('/gir') ? 'gir'
+    : 'morphine-wean'
+  );
```

**`src/routes/gir/+page.svelte`** — note: currently passes `id: 'gir'` to `setCalculatorContext` but `CalculatorContext.id` is typed `CalculatorId` which excludes `'gir'`. Fixing the type above resolves this silently.

### Pattern 5: OKLCH Tuning (contingency — only if axe flags)

Current `.identity-gir` light hero (`src/app.css:199`): `oklch(94% 0.045 145)` background vs likely `var(--color-text-primary)` foreground. The v1.5 Phase 20 fix tuned Morphine light hero from `--color-accent-light` (~92% chroma 0.07) to literal `oklch(95% 0.04 220)` to clear 4.5:1.

**Pre-emptive tuning ladder** if Variant 5 (selected bucket) fails contrast:
1. Bump lightness: `oklch(94% … 145)` → `oklch(95% 0.04 145)` (match Morphine pattern exactly).
2. If still failing: reduce chroma further `oklch(96% 0.035 145)`.
3. Dark hero (`oklch(30% 0.09 145)`) may need `oklch(32% 0.08 145)` (match Morphine dark tune).

The key insight from Phase 20: **greens at hue 145 can trip color-contrast faster than blues at 220** because human luminance perception peaks near green — the same L% reads brighter. Expect to tune.

**Tune location:** `src/app.css` lines 199-202 (light) and 213-217 (dark). NEVER touch `--color-accent*` or shell chrome tokens.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Axe sweep setup | Custom a11y harness | `AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze()` | Exact pattern in 2 existing a11y specs |
| Theme toggle in Playwright | Click actual theme button | `page.evaluate(() => document.documentElement.classList.add('dark'))` + `.no-transition` + `waitForTimeout(250)` | Avoids axe reading mid-transition colors (v1.4 lesson) |
| Motion disable for axe | Custom CSS injection | `await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })` | Exact pattern from `morphine-wean-a11y.spec.ts:98-101` |
| Viewport switching | Two spec files | Single spec with `for (const viewport of [...])` + `test.use({ viewport })` | DRY, one file, one result report |
| Keyboard event simulation | `userEvent.keyboard` | `fireEvent.keyDown(element, { key: 'ArrowDown' })` | Existing `GlucoseTitrationGrid.test.ts` already uses `fireEvent` — be consistent |
| Disclaimer dismissal | Custom helper | `page.getByRole('button', { name: /understand/i }).click({ timeout: 2000 }).catch(() => {})` | Exact pattern in all 4 existing e2e specs |

## Common Pitfalls

### Pitfall 1: Playwright radio count differs from Vitest
**What goes wrong:** Vitest test counts 12 radios (both mobile + desktop DOMs); Playwright at 375px counts 6.
**Why:** jsdom does not apply viewport-based CSS (`sm:hidden`) so both layouts render; a real browser respects media queries.
**How to avoid:** In Playwright, assert 6 radios at mobile (375) AND 6 at desktop (1280) — both layouts cannot be visible simultaneously at any real breakpoint.
**Warning sign:** A test passes in Vitest but fails in Playwright with "expected 12, got 6".

### Pitfall 2: Axe mid-transition color reads
**What goes wrong:** Dark-mode sweep intermittently fails contrast because axe reads the DOM during CSS transition interpolation.
**Why:** Theme toggle triggers `transition: background-color 200ms` and axe runs before it settles.
**How to avoid:** Add `no-transition` class via `page.evaluate` BEFORE toggling dark, then `waitForTimeout(250)` before `AxeBuilder(...).analyze()`. For advisory sweeps, also inject `page.addStyleTag` to kill all transitions on elements added post-theme-toggle.
**Warning sign:** Sweep flakes only in CI, passes locally.

### Pitfall 3: Green hue contrast trap (Phase 20 repeat)
**What goes wrong:** `.identity-gir` hue 145 may fail WCAG 4.5:1 against `--color-text-primary` even though it "looks fine" and the chroma is conservative.
**Why:** Luminance perception peaks at green; an `L*` that's safe at hue 220 may be too bright at 145.
**How to avoid:** Run the axe sweeps early, expect to tune `oklch(94% 0.045 145)` → `oklch(95% 0.04 145)` or `oklch(96% 0.035 145)`. Match Morphine's Phase 20 ladder (L bump first, then chroma drop).
**Warning sign:** Variants 5 (selected bucket light) or 6 (selected bucket dark) surface `color-contrast` in axe results.

### Pitfall 4: AboutSheet renders wrong content on /gir (latent bug)
**What goes wrong:** Clicking "About" on `/gir` today shows **Morphine Wean** content.
**Why:** `NavShell.svelte:11-13` `activeCalculatorId` ternary only checks `/formula` vs fallback.
**How to avoid:** Fix during DOC-01 task (must fix anyway for new AboutSheet entry to render).
**Warning sign:** Phase 27 verification likely missed this because the AboutSheet entry didn't exist yet.

### Pitfall 5: `CalculatorId` type doesn't include `'gir'`
**What goes wrong:** Adding `gir:` entry to `aboutContent: Record<CalculatorId, AboutContent>` compiles fine (object literal with extra key), but the type never expands to allow `AboutSheet calculatorId="gir"`. `NavShell` currently passes `'morphine-wean'` so there's no compile error today — but the Phase 28 fix to NavShell will trigger one.
**How to avoid:** Extend the type in `src/lib/shared/types.ts` FIRST (one-line diff), then everything else compiles.
**Warning sign:** `svelte-check` error on `NavShell.svelte` after updating the ternary.

### Pitfall 6: `pnpm run dev` auto-start race on first e2e run
**What goes wrong:** First `pnpm test:e2e` run flakes because webServer boots slow.
**Why:** `playwright.config.ts` uses `reuseExistingServer: !process.env.CI` — local dev usually has a running server; CI boots fresh.
**How to avoid:** Run `pnpm build && pnpm preview` once before committing; or rely on existing CI behavior (retries: 2).
**Note:** Not blocking — existing pattern works.

## Code Examples

### Testing `inputmode="decimal"` in Playwright
```typescript
// Source: NumericInput.svelte:135 (verified)
await expect(page.getByLabel('Weight')).toHaveAttribute('inputmode', 'decimal');
await expect(page.getByLabel('Dextrose')).toHaveAttribute('inputmode', 'decimal');
await expect(page.getByLabel('Fluid order')).toHaveAttribute('inputmode', 'decimal');
```

### Theme toggle with transition-safety
```typescript
// Source: e2e/morphine-wean-a11y.spec.ts:34-40 (verified)
await page.evaluate(() => {
  document.documentElement.classList.add('no-transition');
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-theme', 'dark');
});
await page.waitForTimeout(250);
```

### Kill all transitions for advisory/dynamic-render sweeps
```typescript
// Source: e2e/morphine-wean-a11y.spec.ts:98-102 (verified)
await page.addStyleTag({
  content: '*, *::before, *::after { transition: none !important; animation: none !important; }'
});
await page.waitForTimeout(250);
```

### Fork an a11y sweep to a new route
```typescript
// Source: e2e/morphine-wean-a11y.spec.ts (entire file is the template)
test.describe('GIR Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gir');
    await page.getByRole('heading', { name: 'Glucose Infusion Rate' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /understand|acknowledge/i }).click({ timeout: 2000 }).catch(() => {});
  });
  // ... variants ...
});
```

## Runtime State Inventory

Phase 28 is a test-addition + docs-bump phase. No rename, no data migration, no OS state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `nicu_gir_state` sessionStorage key already exists (Phase 26) — no migration | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | `__APP_VERSION__` Vite define already wired to `package.json#version` — auto-updates on rebuild | Rebuild (any `pnpm build` or `pnpm dev` restart) |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | All tests | ✓ (assumed) | 10.33.0 | — |
| Playwright browsers | e2e | verify in Wave 0 | — | `pnpm exec playwright install chromium` |
| vitest | component tests | ✓ | 4.1.2 | — |
| @axe-core/playwright | a11y sweeps | ✓ | 4.11.1 | — |

**Missing dependencies with no fallback:** None identified.
**Wave 0 verification:** Run `pnpm exec playwright install --dry-run` to confirm chromium is present; if not, run `pnpm exec playwright install chromium`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Component framework | Vitest 4.1.2 + @testing-library/svelte 5.3.1 |
| E2E framework | Playwright 1.59 + @axe-core/playwright 4.11.1 |
| Config files | `vitest.config.ts` (existing), `playwright.config.ts` (existing — `testDir: './e2e'`) |
| Quick run command | `pnpm vitest run src/lib/gir/` |
| Full unit suite | `pnpm test:run` |
| Full e2e suite | `pnpm exec playwright test` |
| Single e2e file | `pnpm exec playwright test e2e/gir-a11y.spec.ts` |
| Phase gate | `pnpm test:run && pnpm exec playwright test` — both green |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-02 | GirCalculator empty / valid / bucket / advisory | unit | `pnpm vitest run src/lib/gir/GirCalculator.test.ts` | ✅ (extend) |
| TEST-02 | GlucoseTitrationGrid full keyboard + glyph | unit | `pnpm vitest run src/lib/gir/GlucoseTitrationGrid.test.ts` | ✅ (extend) |
| TEST-04 | Happy-path mobile + desktop | e2e | `pnpm exec playwright test e2e/gir.spec.ts` | ❌ Wave 0 |
| TEST-05 | Axe sweeps (6 variants) | e2e | `pnpm exec playwright test e2e/gir-a11y.spec.ts` | ❌ Wave 0 |
| TEST-06 | inputmode="decimal" assertion | e2e | (lives in `gir.spec.ts`) | ❌ Wave 0 |
| DOC-01 | AboutSheet GIR entry renders | manual (visual) | — | n/a (code only) |
| DOC-02 | `package.json` = 1.8.0, About shows v1.8.0 | manual (visual) + `node -p "require('./package.json').version"` | — | n/a |
| DOC-03 | PROJECT.md Validated list updated | manual (diff review) | — | n/a |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/lib/gir/` (sub-second for component tests)
- **Per wave merge:** `pnpm test:run && pnpm exec playwright test e2e/gir.spec.ts e2e/gir-a11y.spec.ts`
- **Phase gate:** Full unit suite green + full e2e suite green (all 16 axe sweeps + all happy-path variants) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `e2e/gir.spec.ts` — happy path + inputmode assertion (TEST-04, TEST-06)
- [ ] `e2e/gir-a11y.spec.ts` — 6 axe sweep variants (TEST-05)
- [ ] Extended tests in `src/lib/gir/GirCalculator.test.ts` and `GlucoseTitrationGrid.test.ts` (TEST-02)
- [ ] Verify `pnpm exec playwright install chromium` is present
- [ ] (Defer tuning) Run sweeps once to see if `.identity-gir` passes contrast before adding tuning task

## Project Constraints (from CLAUDE.md)

- **Stack is locked:** SvelteKit 2 + Svelte 5 runes + Tailwind 4 + Vitest 4 + Playwright 1.58+ + pnpm. No new runtime deps.
- **Tests co-located with source** (per MEMORY.md `feedback_test_colocation.md`) — `*.test.ts` lives beside `*.svelte`, NOT in `__tests__/`. Already followed in `src/lib/gir/`.
- **WCAG 2.1 AA minimum**, 48px touch targets, always-visible nav labels.
- **GSD workflow enforcement:** all edits must come through a GSD command.
- **Mobile-first PWA** — e2e must cover mobile viewport.
- **Phase 20 lesson locked in PROJECT.md:** identity hero contrast tuned with **literal OKLCH** values (never var chains) — follow the same pattern for `.identity-gir` tuning if needed.
- **No new props on shared components for v1.8** (ARCH-06) — AboutSheet, NumericInput, etc. must not be modified in signature.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `__tests__/` dirs | Co-located `*.test.ts` | Pre-v1.0 | Already followed in GIR module |
| `lucide-svelte` (Svelte 3/4) | `@lucide/svelte` (Svelte 5) | v1.0 | Already followed — `Droplet` imported from `@lucide/svelte` |
| `inputmode="numeric"` | `inputmode="decimal"` for decimal fields | v1.0 | Already hardcoded in `NumericInput.svelte` |
| `--color-accent-light` as identity hero | Literal `oklch(...)` per identity | v1.5 Phase 20 | `.identity-gir` already follows this pattern; may need tuning |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `.identity-gir` OKLCH values at hue 145 may fail WCAG AA and need tuning [ASSUMED based on Phase 20 precedent, green-hue luminance physics] | Common Pitfalls #3, OKLCH tuning contingency | LOW — axe sweeps will reveal truth; tuning is one-line if needed; if already passing, tuning task is no-op |
| A2 | Playwright renders only 6 radios at any real viewport (not 12) because `sm:hidden` applies [ASSUMED — not verified in browser, only reasoned from Tailwind media queries] | Pattern 2 code example, Pitfall #1 | MEDIUM — if wrong, e2e assertion needs `.toHaveCount(12)`. Wave 0 should verify by running once |
| A3 | `pnpm test:e2e` script doesn't exist — recommend direct `pnpm exec playwright test` [ASSUMED — verified by reading package.json scripts: no `test:e2e` script, only `test` (vitest)] | Validation Architecture | LOW — documented as direct invocation |
| A4 | Hawkes et al. PMC7286731 is a valid neonatal GIR reference [CITED: REQUIREMENTS.md and ROADMAP.md both name it] | Pattern 4 AboutSheet entry | LOW — explicitly named in requirements |
| A5 | Current e2e sweep count is 10 (morphine 6 + fortification 4); new total 16 [VERIFIED: counted via `wc -l` + reading spec files directly] | Pattern 1 | none |

**Mitigation:** A2 (radio count) should be the FIRST thing Wave 0 verifies — run `pnpm exec playwright test --headed e2e/gir.spec.ts` once with a `console.log` to see actual radio count at both viewports.

## Open Questions (RESOLVED)

1. **Should playwright.config.ts add a mobile project or should `gir.spec.ts` use per-test `test.use({ viewport })`?**
   - What we know: existing config has only `chromium`. Other specs don't run mobile.
   - What's unclear: Whether the team wants mobile coverage extended to all specs (project-level) or scoped to GIR (file-level).
   - RESOLVED: **Option B (file-level `test.use({ viewport })`)** — keeps Phase 28 scope tight. Revisit project-level in a future phase if mobile parity for all specs becomes a requirement.

2. **Should the 6 axe variants include a mobile-viewport sweep?**
   - What we know: morphine/fortification a11y sweeps do not run at mobile viewport.
   - What's unclear: Whether GIR should pioneer mobile axe coverage.
   - RESOLVED: **No — desktop-only sweeps.** Match existing pattern. GIR's responsive stack-vs-table means mobile is a different DOM, but that's covered by Vitest tests. If axe reveals a mobile-only issue later, add Variant 7 then.

3. **Does PROJECT.md Validated list need one line per requirement or one line per milestone feature?**
   - What we know: v1.7 has 4 lines, v1.6 has 9 lines — not strict per-requirement.
   - What's unclear: The grouping convention.
   - RESOLVED: **Match v1.6 density (~8-12 bullet lines summarizing the milestone)**, not all 34 requirement IDs.

## Sources

### Primary (HIGH confidence — all verified by reading repo source)
- `src/lib/shared/components/NumericInput.svelte:135` — `inputmode="decimal"` hardcoded
- `src/lib/gir/GirCalculator.svelte` — structure of empty state, advisories, titration wiring
- `src/lib/gir/GlucoseTitrationGrid.svelte` — keyboard handler, radio semantics, dual-DOM layout
- `e2e/morphine-wean-a11y.spec.ts` — axe sweep template (6 variants)
- `e2e/fortification-a11y.spec.ts` — axe sweep template (4 variants)
- `e2e/morphine-wean.spec.ts` — happy-path e2e template
- `playwright.config.ts` — single chromium project, `testDir: './e2e'`
- `src/app.css:199-217` — `.identity-gir` OKLCH block (light + dark)
- `src/lib/shared/about-content.ts` — `aboutContent: Record<CalculatorId, AboutContent>` shape
- `src/lib/shared/types.ts:7` — `CalculatorId = 'morphine-wean' | 'formula'` (missing `'gir'`)
- `src/lib/shell/NavShell.svelte:11-13` — `activeCalculatorId` bug (no `/gir` branch)
- `src/lib/shell/registry.ts` — GIR entry already present with `identity-gir`
- `.planning/milestones/v1.5-ROADMAP.md:31` — Phase 20 OKLCH tune precedent
- `.planning/REQUIREMENTS.md` — TEST-02/04/05/06, DOC-01/02/03 exact copy

### Secondary (MEDIUM confidence)
- MDCalc GIR calculator and Hawkes et al. J Perinatol PMC7286731 — [CITED from REQUIREMENTS.md, not fetched]

### Tertiary (LOW confidence)
- Assumption that hue-145 green tends to trip WCAG contrast faster than hue-220 blue — [ASSUMED from color science; will be empirically validated by axe sweep]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libs present in package.json, versions verified
- Architecture patterns: HIGH — all templates are copy-paste from existing passing specs
- Pitfalls: HIGH for pitfalls 4, 5 (directly verified bugs); MEDIUM for 1, 3 (reasoned); HIGH for 2 (documented in existing specs)
- Latent bugs: HIGH — both confirmed by direct source read (`types.ts:7`, `NavShell.svelte:11-13`)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable repo patterns; Playwright/Vitest unlikely to break minor)
