# Phase 20: Identity A11y Verification — Research

**Researched:** 2026-04-07
**Domain:** WCAG 2.1 AA contrast verification via axe-core Playwright sweep
**Confidence:** HIGH

## Summary

Phase 19 wired `--color-identity` / `--color-identity-hero` to result hero cards, eyebrow labels, and focus-visible outlines (IDENT-02/03/04). Phase 20's job is to *prove* those surfaces hit WCAG 2.1 AA in both themes, both tabs, via the existing axe-core sweeps — and tune OKLCH lightness if anything fails. IDENT-05 (nav active indicator) and IDENT-01/06/07 are still pending in Phase 19 scope and are OUT OF SCOPE for Phase 20.

The existing `e2e/morphine-wean-a11y.spec.ts` and `e2e/fortification-a11y.spec.ts` already run `withTags(['wcag2a', 'wcag2aa'])` in both light and dark modes — the `color-contrast` rule is part of `wcag2aa` and is therefore already enabled. Both specs already use `no-transition` + 250ms settle for dark mode. **The hypothesis in the prompt is CORRECT:** Phase 20 largely reduces to running the sweeps, fixing any failures by tuning the four new OKLCH values in `src/app.css` (lines 177, 178, 187, 188, and the dark Morphine hero at 183), and adding targeted steps that force the identity surfaces to render before axe analyzes.

**Primary recommendation:** Extend the four existing a11y tests (light/dark × 2 files) with pre-analyze steps that (a) surface the result hero, (b) focus an input to render the identity focus ring, then run axe unchanged. If any violation surfaces, tune the failing token by ±3% L at a time (direction depends on theme) without touching `--color-accent*` shared tokens.

## User Constraints (from prompt)

### Locked Decisions
- No rule suppression. No `disableRules(['color-contrast'])`, no `axe-skip` attributes.
- Fix failures by tuning OKLCH values, not by swapping hue or abandoning identity.
- Do not touch `--color-accent*` shared tokens (v1.4 locked them for existing passes).
- Reuse existing axe sweep pattern — do not invent a new harness.

### Claude's Discretion
- Whether to add a third "identity surfaces visible" test per file (separate test) vs. expanding the existing "results visible" test.
- Exact step sequence to force focus ring + hero visible before axe runs.
- Whether to add a sanity assertion for focus ring presence (non-blocking extra).

### Deferred Ideas (OUT OF SCOPE)
- IDENT-05 nav active indicator (Phase 19 still pending, separate plan).
- IDENT-01 `--color-identity` token formal definition (covered by Phase 19 wrapper classes already).
- IDENT-06/07 scope guards (BMF amber purity, shell chrome neutrality) — not a Phase 20 concern.
- Any new axe rules beyond `color-contrast`.
- Cross-browser axe runs (Playwright config is chromium-only — stay there).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| A11Y-01 | Every `--color-identity` surface passes axe-core color-contrast, light + dark, both tabs | Existing sweeps cover light/dark for both routes; missing coverage is "identity surfaces rendered at analyze time" — addressed in Test Additions below |
| A11Y-02 | New teal passes 4.5:1 for text/icon, 3:1 for non-text UI (focus rings) vs adjacent surfaces, both themes | Tuning Playbook below maps each surface to target ratio + adjacent bg |

## Current A11y Sweep Shape (verified from source)

### `e2e/morphine-wean-a11y.spec.ts`
| Test | Theme | Identity surface rendered? | Line refs |
|------|-------|----------------------------|----------|
| "no axe violations in light mode" | light (forced) | NO — no inputs filled, no focus, idle state only | L18–29 |
| "no axe violations in dark mode" | dark (forced, `no-transition` + 250ms) | NO — idle state only | L31–45 |
| "no axe violations with schedule visible" | **default (light)** — does not force theme | YES hero, NO focus ring | L47–59 |

### `e2e/fortification-a11y.spec.ts`
| Test | Theme | Identity surface rendered? | Line refs |
|------|-------|----------------------------|----------|
| "no axe violations in light mode" | light (forced) | PARTIAL — default inputs produce a hero but it's not awaited | L18–29 |
| "no axe violations in dark mode" | dark (forced, `no-transition` + 250ms) | PARTIAL — same, no await | L31–45 |
| "no axe violations with results visible" | **light (forced)** | YES hero awaited, NO focus ring | L47–62 |

**Common scaffolding:** Both files use `AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()` and assert `violations).toEqual([])`. `color-contrast` is enabled transitively via `wcag2aa`.

## Gap Analysis

What the existing sweeps do NOT currently cover — and that Phase 20 must add:

1. **Dark mode + identity surface rendered together.** Both "results/schedule visible" tests run in *light* mode only. The dark hero (new `oklch(32% 0.10 220)` for Morphine, `oklch(30% 0.08 195)` for Formula) has never been axe-analyzed with actual hero content on screen.
2. **Focus ring rendered during analyze.** No test focuses an input before calling axe. The new `--color-identity` focus outline on NumericInput / SelectPicker is currently *dormant* during every sweep — axe literally cannot see it.
3. **Eyebrow label contrast on hero background.** The eyebrow spans (`text-[var(--color-identity)]` on `bg-[var(--color-identity-hero)]`) are the tightest pair — they need `--color-identity` vs `--color-identity-hero` to clear 4.5:1, which is *different* from identity-vs-surface-card. Covered incidentally when the hero is visible, but only in light Formula today.
4. **Morphine Formula dark hero specifically.** The new `oklch(32% 0.10 220)` token has zero axe coverage today (Morphine schedule test is light-only).

## Minimal Phase 20 Strategy — CONFIRMED

The hypothesis in the prompt is correct. Phase 20 reduces to:

1. **Run** the existing sweeps in CI and locally to establish baseline.
2. **Extend** the "results visible" tests so each file has *both* a light and a dark variant that render the hero AND focus an input before analyzing.
3. **Tune** any failing OKLCH by ±3% L (playbook below) until clean. Only the five identity token values in `src/app.css` are in play; no other files change unless a spec change is needed.
4. **No rule suppression. No exceptions.**

Optional: add a trivial `toBeVisible` assertion on the focus ring presence (via checking `:focus-visible` element exists) so the test actively proves the identity surface was on-screen for axe. Not strictly required since axe will silently skip invisible elements and we want to catch "we thought we were testing but weren't."

## Surface → Contrast Target Map (Tuning Playbook)

Ratios computed per WCAG 2.1: normal text ≥ 4.5:1, large text (≥18.66px bold or ≥24px) ≥ 3:1, non-text UI (focus rings, borders, icons conveying info) ≥ 3:1.

### Light theme

| Surface | Role | Adjacent BG | Target | Current OKLCH | Tuning direction if fail |
|---------|------|------------|--------|---------------|---------------------------|
| `--color-identity` (formula) `oklch(49% 0.11 195)` | eyebrow text, focus ring | `--color-surface-card` `oklch(100% 0 0)` | 4.5:1 (text) / 3:1 (ring) | L=49 | ↓ L by 3% steps (darker = more contrast on white) |
| `--color-identity` (formula) | eyebrow text ON hero | `--color-identity-hero` `oklch(92% 0.05 195)` | 4.5:1 | L=49 vs L=92 (Δ43) | ↓ L on identity OR ↑ L on hero (prefer identity ↓ to protect ring contrast on card) |
| `--color-identity-hero` (formula) `oklch(92% 0.05 195)` | hero bg holding `--color-text-primary` `oklch(18% 0.012 230)` | text primary | 4.5:1 | L=92 vs L=18 (Δ74) | ↑ L by 2% (lighter hero = more contrast with dark text) |
| `--color-identity` (morphine) = `--color-accent` `oklch(49% 0.17 220)` | eyebrow, focus ring | `--color-surface-card` white | 4.5:1/3:1 | already validated v1.4 | no change — locked token |

### Dark theme

| Surface | Role | Adjacent BG | Target | Current OKLCH | Tuning direction if fail |
|---------|------|------------|--------|---------------|---------------------------|
| `--color-identity` (formula) `oklch(82% 0.09 195)` | eyebrow, focus ring | `--color-surface-card` `oklch(23% 0.014 236)` | 4.5:1/3:1 | L=82 vs L=23 (Δ59) | ↑ L by 3% (lighter = more contrast on dark) |
| `--color-identity` (formula) | eyebrow text ON hero | `--color-identity-hero` `oklch(30% 0.08 195)` | 4.5:1 | L=82 vs L=30 (Δ52) | ↑ L on identity (preferred) OR ↓ L on hero |
| `--color-identity-hero` (formula) `oklch(30% 0.08 195)` | hero bg holding `--color-text-primary` `oklch(93% 0.006 230)` | text primary | 4.5:1 | L=30 vs L=93 (Δ63) | ↓ L by 2% (darker hero = more contrast with light text) |
| `--color-identity-hero` (morphine) `oklch(32% 0.10 220)` | hero bg holding text primary `oklch(93%)` | text primary | 4.5:1 | L=32 vs L=93 (Δ61) | ↓ L by 2% if fail (also verify against `--color-text-secondary` if used in eyebrow) |
| `--color-identity` (morphine) = `--color-accent` `oklch(82% 0.12 220)` | eyebrow, focus ring | card | 4.5:1/3:1 | already validated v1.4 | no change |

**Tuning rule:** Change ONLY L (keep C and H fixed) in ±3% steps, re-run spec, repeat until clean. Never exceed L<15% or L>97% (readability floor/ceiling). If two adjacent-surface targets conflict (e.g., identity needs darker for card contrast but lighter for hero-text contrast), bump chroma by 0.01 instead — higher chroma slightly boosts perceived contrast in teal range.

**Escape hatches to NOT use:** `axe.disableRules(['color-contrast'])`, `.axe-skip` markers, `role="presentation"`, swapping to `--color-accent` and quietly abandoning the teal identity. All forbidden per prompt.

## Test Additions (Exact Changes)

Both a11y specs need the "results visible" test duplicated for dark mode and extended to render a focus ring. Concrete per-file changes:

### `e2e/morphine-wean-a11y.spec.ts` — add ONE new test
```ts
test('morphine wean page has no axe violations with schedule visible in dark mode', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.classList.add('no-transition');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(250);

  await page.getByLabel('Dosing weight').fill('3.1');
  await page.getByLabel('Max morphine dose').fill('0.04');
  await page.getByLabel('Decrease per step').fill('10');
  await expect(page.getByText(/Step 1 — Starting dose/)).toBeVisible();

  // Render the identity focus ring so axe can see it
  await page.getByLabel('Dosing weight').focus();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
```
Also add `await page.getByLabel('Dosing weight').focus();` to the existing light "schedule visible" test (L47).

### `e2e/fortification-a11y.spec.ts` — add ONE new test
```ts
test('fortification page has no axe violations with results visible in dark mode', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.classList.add('no-transition');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(250);

  await expect(page.getByText('Amount to Add')).toBeVisible();

  // Focus the first numeric input to render the identity focus ring
  await page.getByRole('spinbutton').first().focus();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
```
Also add `await page.getByRole('spinbutton').first().focus();` (or equivalent) to the existing light "results visible" test (L47).

**Net new tests:** +2 (one per file). **Modified tests:** +2 (add focus step to existing "visible" tests). **Total a11y test count goes from 6 → 8.**

### Why `no-transition` + 250ms still applies
Confirmed in `src/app.css` L114–116: `html:not(.no-transition) * { transition: bg/color/border 200ms ease-out; }`. Axe reads computed styles — without `.no-transition` it would sample mid-interpolation colors that don't reflect the final design. The 250ms settle guarantees the transition would have completed even if it ran. Both specs already do this correctly for idle dark tests; the new "visible + dark" tests copy the same pattern verbatim.

## Files To Modify / Add

| File | Change | Reason |
|------|--------|--------|
| `e2e/morphine-wean-a11y.spec.ts` | Add 1 test (dark + schedule + focus); add `.focus()` to existing light schedule test | Covers dark hero + dark identity focus ring |
| `e2e/fortification-a11y.spec.ts` | Add 1 test (dark + hero + focus); add `.focus()` to existing light results test | Covers dark Formula teal hero + focus ring |
| `src/app.css` L177–189 | ONLY IF a test fails — tune L by ±3% per playbook | Contrast tuning |
| `.planning/REQUIREMENTS.md` L28–29, L63–64 | Flip A11Y-01, A11Y-02 to `[x]` and Complete | Close out |

**Files NOT to touch:** `playwright.config.ts`, `src/lib/shared/context.ts`, `NumericInput.svelte`, `SelectPicker.svelte`, `MorphineWeanCalculator.svelte`, `FortificationCalculator.svelte`, any `--color-accent*` token. The whole point of Phase 20 is to validate Phase 19's wiring is correct — not change it.

## Running The Sweep

No `test:e2e` npm script exists. Run directly:
```bash
pnpm exec playwright test e2e/morphine-wean-a11y.spec.ts e2e/fortification-a11y.spec.ts
```
Or just the a11y subset:
```bash
pnpm exec playwright test --grep @a11y    # if tagged — currently not; use filename form
```
Playwright auto-starts the dev server per `playwright.config.ts` L22–26 (port 5173, reuseExistingServer).

## Common Pitfalls

### Pitfall 1: Axe silently passes because surface isn't rendered
**What goes wrong:** Focus ring never appears on screen, axe reports 0 violations, we merge a broken identity token.
**Prevention:** Explicit `.focus()` step before `analyze()`. Assert focused element is visible. Don't rely on idle state.

### Pitfall 2: Tuning cascades into v1.4 wins
**What goes wrong:** Touching `--color-accent` or `--color-text-secondary` to "help" contrast regresses Phase 17 fixes.
**Prevention:** Only edit the five identity-specific lines in `src/app.css` (L177, 178, 183, 187, 188). Never `--color-accent*`, never text tokens.

### Pitfall 3: Light hero passes but dark hero fails silently
**What goes wrong:** Existing "results visible" tests are light-only. Dark hero never gets analyzed with content on screen.
**Prevention:** Explicit new dark-theme "visible" test per file (required, see Test Additions).

### Pitfall 4: `color-contrast` rule skips transparent/gradient backgrounds
**What goes wrong:** Axe refuses to evaluate contrast when the computed background contains alpha or multiple stacked layers, reports no violation, you don't know.
**Prevention:** The identity-hero tokens are solid OKLCH — no alpha. Verify no intermediate element inserts a semi-transparent layer between text and hero bg. If axe reports `incomplete` rather than `violations`, treat incomplete as a finding.

### Pitfall 5: Theme transition interpolation
**What goes wrong:** Already covered by `no-transition` class — but if you forget it in a new test, axe reads mid-transition teal that doesn't match final design.
**Prevention:** Every new dark-mode test MUST add `no-transition` class AND `waitForTimeout(250)`. Copy verbatim from existing tests.

## Validation Architecture

`workflow.nyquist_validation` is **false** in `.planning/config.json` (per Phase 19 research L402) — full Nyquist section skipped. Phase 20 is itself the validation gate for Phase 19's wiring, and uses the existing axe-core infrastructure.

| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 + @axe-core/playwright 4.11.1 |
| Config | `playwright.config.ts` (chromium-only, auto-starts dev server) |
| Quick run | `pnpm exec playwright test e2e/morphine-wean-a11y.spec.ts e2e/fortification-a11y.spec.ts` |
| Full suite | `pnpm exec playwright test` + `pnpm exec vitest run` |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getByLabel('Dosing weight')` is the correct selector to trigger NumericInput focus-visible outline | Test Additions | Low — verified against existing test L50 |
| A2 | `getByRole('spinbutton').first()` reaches a NumericInput on the fortification page | Test Additions | Low — NumericInput renders `type="number"` which gets `role=spinbutton`; if wrong, swap to `getByLabel` |
| A3 | Phase 19 OKLCH values will pass on first run without tuning | Surface Map | Medium — mirrored from already-passing blue lightness; prompt explicitly budgets for tuning cycles |
| A4 | Axe `color-contrast` rule evaluates `:focus-visible` state outlines | Strategy | Medium — axe evaluates computed styles at analyze time; if element is focused, ring is computed. Verified behavior in @axe-core/playwright 4.x |
| A5 | No currently-green test regresses from adding `.focus()` step | Test Additions | Low — focus state adds a visual, doesn't remove anything; worst case a new violation surfaces and we fix it (which IS the point) |

## Open Questions

1. **RESOLVED: Do existing sweeps already run `color-contrast` in both themes both tabs?** Yes — both files run light+dark, both use `wcag2aa` which includes `color-contrast`. But "results/schedule visible" variants are light-only; dark-visible is the gap.

2. **RESOLVED: Is the minimal strategy (run + tune OKLCH + assert focus ring) correct?** Yes — hypothesis confirmed. The only additions are two new dark-theme "visible" tests and a `.focus()` call in the existing light visible tests.

3. **RESOLVED: What's the tuning playbook?** See "Surface → Contrast Target Map". ±3% L steps, never touch `--color-accent*`, never exceed L∈[15%,97%], bump chroma 0.01 if L targets conflict.

4. **RESOLVED: Does `no-transition` + 250ms still apply?** Yes — confirmed in `src/app.css` L114. Every new dark-mode test must replicate it.

5. **RESOLVED: Exact file list?** Two e2e spec files (required edits), `src/app.css` (conditional edits), `REQUIREMENTS.md` (status flip). That's it.

## Sources

### Primary (HIGH confidence)
- `e2e/morphine-wean-a11y.spec.ts` L1–61 — current sweep shape
- `e2e/fortification-a11y.spec.ts` L1–63 — current sweep shape
- `src/app.css` L114–116, L167–190 — transition + identity token values
- `.planning/phases/19-tab-identity-token/19-02-SUMMARY.md` — exactly which surfaces were wired
- `.planning/phases/19-tab-identity-token/19-RESEARCH.md` L135–154, L452–459 — original contrast target analysis and assumed OKLCH values
- `package.json` L24 — `@axe-core/playwright` 4.11.1 confirmed
- `playwright.config.ts` — chromium-only, auto-starts dev server

### Secondary (MEDIUM confidence)
- WCAG 2.1 AA contrast requirements (4.5:1 text, 3:1 non-text UI) — canonical

## Project Constraints (from CLAUDE.md)

- WCAG 2.1 AA minimum — non-negotiable
- Tech stack locked: SvelteKit 2 + Svelte 5 + Tailwind 4 + pnpm
- No new runtime dependencies unless justified (none needed for Phase 20)
- Always-visible focus indicators (color-blind accessible — reinforces need for focus-ring contrast test)
- GSD workflow enforced — all edits via phase execution

## Metadata

**Confidence breakdown:**
- Sweep shape analysis: HIGH — read directly from source
- Gap analysis: HIGH — derived from source inspection
- Tuning playbook: HIGH — follows v1.4 validated pattern from Phase 17
- OKLCH starting values passing on first run: MEDIUM — Phase 19 explicitly deferred verification here
- Test additions: HIGH — minimal delta over existing verified pattern

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable domain)
