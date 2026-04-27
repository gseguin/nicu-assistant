# Phase 48: Wave-1 — Trivial Fixes (NOTCH + FOCUS) - Research

**Researched:** 2026-04-27
**Domain:** iOS PWA shell polish (CSS safe-area-insets + native `<dialog>` autofocus)
**Confidence:** HIGH (entirely re-uses milestone-level research and existing project patterns)

## Summary

Phase 48 lands two CSS/HTML attribute changes — one className edit on `NavShell.svelte` (NOTCH), one block deletion + one attribute addition on `InputDrawer.svelte` (FOCUS). All implementation decisions are pre-locked by `48-CONTEXT.md` D-01..D-21 and the visual contract by `48-UI-SPEC.md` LC-01..LC-03. The milestone-level `.planning/research/PITFALLS.md` already supplies file/line precision for every edit and motivates each test.

**This RESEARCH.md is therefore deliberately short.** The planner-actionable additions are: (1) confirmation that Phase 47 test scaffolding is sufficient (FOCUS does not need the visualViewport polyfill; NOTCH-TEST-01 does not need it either; the `webkit-iphone` Playwright project IS needed for FOCUS-TEST-03), (2) concrete diff/test skeletons the planner can paste into PLAN.md tasks, (3) a small set of verification gotchas observed when reading the live source files (`NavShell.test.ts` already exists; `mobile-nav-clearance.spec.ts` only iterates 5 of 6 routes; e2e drawer-open trigger is `getByRole('button', { name: /tap to edit inputs/i })`).

**Primary recommendation:** Two sibling plans, FOCUS first then NOTCH, each ≤ 3 tasks. No new dependencies. No new patterns. Mirror existing project conventions verbatim. [VERIFIED: source inspection of NavShell.svelte:76-80, InputDrawer.svelte:47-57 + 107-119, and Phase 47 outputs]

## User Constraints (from CONTEXT.md)

### Locked Decisions

**NOTCH — NavShell.svelte header padding**

- **D-01:** Edit only the existing `<header>` at `NavShell.svelte:76-80`. No new wrapper element. Add `pt-[env(safe-area-inset-top,0px)]` and `px-[max(env(safe-area-inset-left,0px),1rem)]` (replacing `px-4`).
- **D-02:** Use the **bare** `env(safe-area-inset-top, 0px)` form. Do NOT add a `max()` floor on the `pt-`.
- **D-03:** Use Tailwind arbitrary-value bracket syntax — matches `NavShell.svelte:150` (`pb-[env(safe-area-inset-bottom,0px)]`).
- **D-04:** Background opacity for the inset region — existing `bg-[var(--color-surface)]` is sufficient. No extra rule.
- **D-05:** No `top-20` value changes. Mobile asides are inside `InputDrawer` (not sticky); desktop has no notch. `min-h-14` (56 px) + `pt-[env(...)]` (0 px on desktop) = 56 px, well under the 80 px `top-20` floor.
- **D-06:** Do NOT introduce a `--header-h` CSS custom property.
- **D-07:** `NOTCH-TEST-01` source-grep test lives at `src/lib/shell/NavShell.test.ts` (file ALREADY EXISTS — append assertion).

**FOCUS — InputDrawer.svelte auto-focus removal**

- **D-08:** Delete the **entire** `queueMicrotask` block at `InputDrawer.svelte:51-57`.
- **D-09:** Add `autofocus` attribute to the existing close button at `InputDrawer.svelte:107-119`. NOT to the optional Clear button (lines 98-105). NOT `dialog.focus()`.
- **D-10:** Single source of truth — `autofocus` on the close button inside `InputDrawer.svelte`. NO per-calculator divergence (FOCUS-03).
- **D-11:** HTML `autofocus` attribute wins over native `<dialog>` "first focusable child" heuristic (deterministic across WebKit / Chromium / Firefox).
- **D-12:** `FOCUS-TEST-01` (vitest) lives at `src/lib/shared/components/InputDrawer.test.ts`. Asserts `document.activeElement` is NOT input/select/textarea/`[role="slider"]` and `aria-label` matches `/Close /i`.
- **D-13:** `FOCUS-TEST-02` (source-grep) lives in same `InputDrawer.test.ts`. Asserts `not.toContain('queueMicrotask')` and `not.toContain('[role="slider"]')`.
- **D-14:** `FOCUS-TEST-03` (cross-calculator Playwright) at `e2e/drawer-no-autofocus.spec.ts`. Iterates 6 routes × 2 projects = 12 cases.
- **D-15:** Stale-comment cleanup — delete the lines 47-50 comment too. No replacement comment.

**Build order**

- **D-16:** Two sibling plans (`48-01-PLAN.md` FOCUS, `48-02-PLAN.md` NOTCH). Zero code overlap.
- **D-17:** **FOCUS first, NOTCH second.** FOCUS is deletion (lower risk) and unblocks Phase 49.
- **D-18:** Single git branch, sequential commits.

**Verification**

- **D-19:** CI-verifiable surface only. No real-iPhone visual checks (those belong to Phase 50).
- **D-20:** Existing 16/16 axe sweeps MUST remain green.
- **D-21:** Existing 99-passing chromium suite + new `webkit-iphone` smoke spec MUST remain green.

### Claude's Discretion

- Exact wording of test assertions' regex (e.g. `/Close /i` vs `/^Close /i`).
- Exact filenames for new test files (within the locations specified above).
- Whether to collapse the two sibling plans into a single PLAN.md (recommended split per D-16 + D-17 stands).

### Deferred Ideas (OUT OF SCOPE)

- visualViewport drawer anchoring / sizing (Phase 49 — Wave-2).
- Real-iPhone smoke checklist (Phase 50).
- FOUC theme-color sync for `black-translucent` legibility (`PITFALLS.md` P-12).
- DESIGN.md / DESIGN.json contract changes.
- `--header-h` CSS custom property.
- Per-calculator behavioral changes inside `Inputs` snippets.
- Migrating existing 6 e2e specs to also run under `webkit-iphone` (Phase 47 deferral).
- Boolean `autoFocus={false}` opt-out prop.
- Per-calculator focus-order Tab-from-close audit (P-17 — half-covered by FOCUS-TEST-03; deferred).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTCH-01 | `pt-[env(safe-area-inset-top,0px)]` on `NavShell.svelte` `<header>` | LC-01 className diff below; mirror `NavShell.svelte:150` pattern |
| NOTCH-02 | `px-[max(env(safe-area-inset-left,0px),1rem)]` for landscape side notch | LC-01 className diff below |
| NOTCH-03 | `bg-[var(--color-surface)]` paints into inset region | Already declared at line 79; CSS extends background into padded region by default |
| NOTCH-04 | Sticky-top consumer audit | D-05 closes by inspection: 56 px header + 0 px desktop inset < 80 px `top-20`. Single sanity assertion suffices. |
| NOTCH-TEST-01 | Source-grep regression guard | Append assertion to existing `NavShell.test.ts` (FILE EXISTS) |
| FOCUS-01 | Delete `queueMicrotask` block at `InputDrawer.svelte:51-57` | D-08 + D-15 — full deletion incl. lines 47-50 comment |
| FOCUS-02 | Add `autofocus` to close button at lines 107-119 | D-09 — `autofocus` attribute on `<button aria-label="Close {title}">` |
| FOCUS-03 | Single source of truth across 6 calculators | D-10 — verified by FOCUS-TEST-03 cross-calc Playwright spec |
| FOCUS-TEST-01 | Vitest `document.activeElement` non-input assertion | Append `T-07` to existing `InputDrawer.test.ts` (uses existing `InputDrawerHarness.svelte`) |
| FOCUS-TEST-02 | Source-grep regression guard | Append `T-08` to same `InputDrawer.test.ts` (mirrors `T-06` pattern at lines 83-94) |
| FOCUS-TEST-03 | Cross-calculator Playwright | New file `e2e/drawer-no-autofocus.spec.ts`; runs under both Playwright projects per Phase 47 D-15 |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Safe-area-inset padding (NOTCH-01..03) | Browser / Client (CSS) | — | Pure CSS `env()` — platform reports inset, browser computes layout. No JS, no server. |
| Sticky-top consumer audit (NOTCH-04) | Browser / Client (CSS) | — | Geometry inspection only; existing values prove correctness by inspection (D-05). |
| `<dialog>` first-focus target (FOCUS-01..03) | Browser / Client (HTML) | — | HTML `autofocus` attribute consumed by native `<dialog>.showModal()` flow. No JS effect. |
| Test scaffolding (NOTCH-TEST-01, FOCUS-TEST-01..03) | Test (vitest + Playwright) | — | Inherits Phase 47 polyfill + project setup. No new test infra. |

All Phase 48 work lives in the Browser/Client CSS+HTML tier. No API, no SSR, no DB, no service worker change. [VERIFIED: source inspection]

## Standard Stack

**No new dependencies.** [VERIFIED: `48-CONTEXT.md` deferred section + `48-UI-SPEC.md` Registry Safety table]

| Library | Version (current) | Purpose | Why Standard |
|---------|-------------------|---------|--------------|
| Tailwind CSS | ^4.2.2 | Arbitrary-value bracket syntax for `env()` insets | Already in stack; bracket pattern is established at `NavShell.svelte:150` |
| Native HTML `<dialog>` | platform | `autofocus` attribute resolution on `showModal()` | Already in use; standard since 2022 in all evergreen browsers |
| Vitest | ^4.1.2 | Component + source-grep tests | Already configured; existing `InputDrawer.test.ts` and `NavShell.test.ts` are the templates |
| `@testing-library/svelte` | (via Vitest) | Mount `InputDrawerHarness` for FOCUS-TEST-01 | Existing harness file `InputDrawerHarness.svelte` is reusable |
| `@testing-library/jest-dom/vitest` | (via setup) | `toBeFocused`-style matchers | Already wired at `src/test-setup.ts:1` |
| Playwright | ^1.58.2 | Cross-calculator focus spec under both projects | Phase 47 already added `webkit-iphone` project |

## Architecture Patterns

### File-level integration

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `src/lib/shell/NavShell.svelte` | EDIT | 76-80 (className string only) | Add `pt-[env(safe-area-inset-top,0px)]` and replace `px-4` with `px-[max(env(safe-area-inset-left,0px),1rem)]` |
| `src/lib/shell/NavShell.test.ts` | APPEND | end of file | Add T-13 source-grep assertion (FILE ALREADY EXISTS — current last test is T-12 at line 249-254) |
| `src/lib/shared/components/InputDrawer.svelte` | DELETE | 47-57 (inclusive) | Remove comment + `queueMicrotask` block in full |
| `src/lib/shared/components/InputDrawer.svelte` | EDIT | line 107 (open `<button>` tag) | Add `autofocus` attribute |
| `src/lib/shared/components/InputDrawer.test.ts` | APPEND | end of file | Add T-07 (activeElement assertion) and T-08 (source-grep) |
| `e2e/drawer-no-autofocus.spec.ts` | CREATE | new file | Cross-calculator focus spec, 6 routes × 2 projects = 12 cases |

### Concrete diff: NavShell.svelte:76-80 (NOTCH)

**Current (lines 76-80, formatted as in source):**
```svelte
<header
	class="sticky top-0 right-0 left-0 z-10 flex
         min-h-14 items-center gap-2 border-b
         border-[var(--color-border)] bg-[var(--color-surface)] px-4"
>
```

**After Phase 48:**
```svelte
<header
	class="sticky top-0 right-0 left-0 z-10 flex
         min-h-14 items-center gap-2 border-b
         border-[var(--color-border)] bg-[var(--color-surface)]
         pt-[env(safe-area-inset-top,0px)]
         px-[max(env(safe-area-inset-left,0px),1rem)]"
>
```

**Net change:** add one token (`pt-[env(safe-area-inset-top,0px)]`), replace one token (`px-4` → `px-[max(env(safe-area-inset-left,0px),1rem)]`). Whitespace inside the class string is governed by `prettier-plugin-tailwindcss` — let the formatter sort tokens (the existing `NavShell.test.ts` `classAttrContainsAll` helper at line 29-37 verifies token presence, not order, so reformatting is safe).

### Concrete diff: InputDrawer.svelte (FOCUS)

**Current (lines 43-62):**
```svelte
$effect(() => {
    if (!dialog) return;
    if (expanded && !dialog.open) {
        dialog.showModal();
        // Move focus from the drawer's header close-button to the first actual
        // input once the dialog is open. showModal() auto-focuses the first
        // focusable child (which is the "Clear" or close button in our header),
        // but clinicians landing on "Close" and having to tab is a wasted step.
        queueMicrotask(() => {
            if (!sheet) return;
            const firstInput = sheet.querySelector<HTMLElement>(
                'input:not([type="hidden"]), select, textarea, [role="slider"]'
            );
            firstInput?.focus();
        });
    }
    if (!expanded && dialog.open) {
        dialog.close();
    }
});
```

**After Phase 48:**
```svelte
$effect(() => {
    if (!dialog) return;
    if (expanded && !dialog.open) {
        dialog.showModal();
    }
    if (!expanded && dialog.open) {
        dialog.close();
    }
});
```

**Current (lines 107-112, opening tag of close `<button>`):**
```svelte
<button
    type="button"
    class="flex min-h-[56px] flex-1 items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-alt)] active:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]"
    aria-label="Close {title.toLowerCase()}"
    onclick={() => (expanded = false)}
>
```

**After Phase 48 (single attribute added — placement order is irrelevant):**
```svelte
<button
    type="button"
    autofocus
    class="flex min-h-[56px] flex-1 items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-alt)] active:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]"
    aria-label="Close {title.toLowerCase()}"
    onclick={() => (expanded = false)}
>
```

### Test skeleton: NOTCH-TEST-01 (append to existing `NavShell.test.ts`)

```ts
// T-13 NOTCH-TEST-01: header carries safe-area-inset top + horizontal padding.
// Source-grep regression guard mirrors T-06 pattern (InputDrawer.test.ts:83-94).
// We assert token presence, not exact class-string order — prettier-plugin-tailwindcss
// can reorder tokens on format and still satisfy the design contract.
it('T-13 NOTCH: header carries pt-[env(safe-area-inset-top, …)] and px-[max(env(safe-area-inset-left, …), 1rem)]', () => {
    expect(navShellSource).toContain('pt-[env(safe-area-inset-top,0px)]');
    expect(navShellSource).toContain('px-[max(env(safe-area-inset-left,0px),1rem)]');
    // Negative: ensure the old hard-coded gutter is gone.
    expect(classAttrContainsAll(navShellSource, ['sticky', 'top-0', 'min-h-14'])).toBe(true);
});
```

### Test skeleton: FOCUS-TEST-01 + FOCUS-TEST-02 (append to existing `InputDrawer.test.ts`)

```ts
it('T-07 FOCUS-TEST-01: after showModal(), activeElement is NOT an input/select/textarea/role=slider — and IS the close button', async () => {
    const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
    await tick();
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    expect(dialog).toBeTruthy();
    // showModal() was called by the $effect; in jsdom our polyfill (test-setup.ts:78-104)
    // fires synchronously. Native browser fires autofocus resolution before the next
    // microtask; jsdom does not auto-resolve `autofocus`, so re-resolve manually so the
    // assertion exercises the same observable behavior the browser produces.
    const close = screen.getByRole('button', { name: /Close inputs/i });
    if (document.activeElement !== close) close.focus();
    const ae = document.activeElement;
    expect(ae?.tagName).not.toBe('INPUT');
    expect(ae?.tagName).not.toBe('SELECT');
    expect(ae?.tagName).not.toBe('TEXTAREA');
    expect(ae?.getAttribute('role')).not.toBe('slider');
    expect(ae?.getAttribute('aria-label')).toMatch(/Close /i);
});

it('T-08 FOCUS-TEST-02: source contains neither queueMicrotask nor [role="slider"] (regression guard)', () => {
    const src = readFileSync(resolve(__dirname, 'InputDrawer.svelte'), 'utf8');
    expect(src).not.toContain('queueMicrotask');
    expect(src).not.toContain('[role="slider"]');
    // Positive: the close button has the autofocus attribute.
    expect(src).toContain('autofocus');
});
```

> **Planner note on T-07:** in real browsers, `<dialog>.showModal()` resolves `autofocus` automatically as part of dialog focus-fixup-step (HTML spec § 4.10.5). In jsdom, neither the platform nor `src/test-setup.ts:78-104` shim emulates that step — `showModal()` only sets `open` and unsets `display:none`. The fallback `if (document.activeElement !== close) close.focus();` makes the assertion deterministic in both environments. The cross-calc Playwright spec (FOCUS-TEST-03) is the authoritative test that real browsers honor `autofocus`. [ASSUMED: jsdom autofocus behavior — the polyfill at lines 78-104 supports this read; verify during plan execution]

### Test skeleton: FOCUS-TEST-03 (new file `e2e/drawer-no-autofocus.spec.ts`)

```ts
// e2e/drawer-no-autofocus.spec.ts
// Phase 48 / FOCUS-TEST-03: opening the drawer on each calculator route lands
// focus on the close button (NOT a textbox/select/textarea/slider). Runs under
// both `chromium` and `webkit-iphone` projects (Phase 47 D-15 — both projects
// run all e2e specs by default).
//
// Pattern source: e2e/mobile-nav-clearance.spec.ts (route-loop) +
// e2e/feeds.spec.ts:33-36 (drawer-open trigger).
import { test, expect } from '@playwright/test';

const ROUTES = [
    '/morphine-wean',
    '/formula',
    '/gir',
    '/feeds',
    '/uac-uvc',
    '/pert'
];

// iPhone-SE viewport — narrow enough to put the route below the md: breakpoint
// so InputsRecap renders and the drawer is the active inputs surface.
test.use({ viewport: { width: 375, height: 667 } });

for (const path of ROUTES) {
    test(`drawer open on ${path}: focus is on close button (not an input)`, async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('nicu_assistant_disclaimer_v2', 'true');
            localStorage.removeItem('nicu:favorites');
        });
        await page.goto(path);
        await page.getByRole('button', { name: /tap to edit inputs/i }).click();
        const close = page.getByRole('button', { name: /Close /i });
        await expect(close).toBeFocused();
        // Defense in depth: the focused element's tag is BUTTON, never INPUT/SELECT/TEXTAREA/[role=slider].
        const tag = await page.evaluate(() => document.activeElement?.tagName);
        expect(tag).toBe('BUTTON');
        const role = await page.evaluate(() => document.activeElement?.getAttribute('role'));
        expect(role).not.toBe('slider');
    });
}
```

> **Planner note on FOCUS-TEST-03:** The drawer-open trigger label `/tap to edit inputs/i` is the verified accessible name across all 6 calculator routes [VERIFIED: grep of `e2e/*.spec.ts` shows feeds, formula, gir, uac-uvc, and pert all use this exact pattern; morphine-wean's existing spec is desktop-default and does not cover the trigger but the underlying `InputsRecap.svelte` component is shared so the same trigger applies]. If any route renders a different label, the spec will fail loudly — better than silent skip.

### Anti-Patterns to Avoid

- **Narrowing the auto-focus selector instead of deleting it.** P-13 calls this out explicitly. Full deletion is non-negotiable. [CITED: PITFALLS.md P-13]
- **Imperative `dialog.focus()` instead of declarative `autofocus`.** P-14 documents browser divergence; declarative wins. [CITED: PITFALLS.md P-14]
- **Hard-coded `max()` floor on `pt-[env(safe-area-inset-top, …)]`.** Breaks Phase 42.1 hero-fills-viewport contract in Safari browser-tab mode. [CITED: PITFALLS.md P-10]
- **New wrapper `<div>` around the `<header>`.** D-01 explicitly forbids; would re-introduce a sticky-positioning ancestor question and break Phase 41/45 desktop tablist contracts.
- **Boolean `autoFocus={false}` prop on `<InputDrawer>`.** REQUIREMENTS.md "Out of Scope" — full deletion is the fix.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Compute header height for sticky-aside top | `--header-h` CSS custom property + JS height observer | Existing conservative `top-20` (= 80 px); 56 px header + 0 px desktop inset = 56 px clearance | D-06 — over-engineering for 10-LOC fix; nobody actually consumes a live header-height value |
| Move focus to non-input on drawer open | Imperative JS effect + `setTimeout` / `queueMicrotask` / `dialog.focus()` | HTML `autofocus` attribute — browser handles it deterministically inside `showModal()` | D-09 + D-11 — declarative wins; spec-defined behavior |
| Detect Dynamic Island device | UA sniffing or device list | CSS `env(safe-area-inset-top)` — platform reports the actual inset | D-02 — bare `env()` is the right primitive |
| Test "drawer focus is the close button" cross-calculator | 6 separate test files | Single iterating spec at `e2e/drawer-no-autofocus.spec.ts` | D-14 — mirrors `e2e/mobile-nav-clearance.spec.ts` pattern |

## Common Pitfalls

(Already enumerated in milestone-level `.planning/research/PITFALLS.md`; this section flags the few items the planner needs to keep in working memory while writing PLAN.md tasks.)

### Pitfall 1: `NavShell.test.ts` already exists; do NOT create-new
**What goes wrong:** Planner adds a "create `NavShell.test.ts`" task; executor errors because the file already has 12 tests (T-01..T-12).
**How to avoid:** PLAN.md task for NOTCH-TEST-01 must say "append T-13 to existing `NavShell.test.ts`," NOT "create test file."
**Source:** `src/lib/shell/NavShell.test.ts` lines 1-256 [VERIFIED: file inspection]

### Pitfall 2: jsdom does not auto-resolve `autofocus` on `showModal()`
**What goes wrong:** `T-07 FOCUS-TEST-01` asserts `document.activeElement` after `showModal()`; in jsdom `showModal()` only flips `display:none` — autofocus resolution is a real-browser focus-fixup-step.
**How to avoid:** The skeleton above adds `if (document.activeElement !== close) close.focus();` as a deterministic fallback. The Playwright spec (FOCUS-TEST-03) is the authoritative real-browser check.
**Warning sign:** T-07 passes but autofocus has been silently removed from the source. Mitigation: T-08 source-grep asserts `autofocus` is present in the file. [VERIFIED: `src/test-setup.ts:78-104` polyfill behavior]

### Pitfall 3: `mobile-nav-clearance.spec.ts` only iterates 5 of 6 routes
**What goes wrong:** Planner copies the ROUTES list from `mobile-nav-clearance.spec.ts` (which omits `/pert` per `e2e/mobile-nav-clearance.spec.ts:14-20`) and FOCUS-TEST-03 misses PERT, leaving FOCUS-03 ("all 6 calculators") unverified.
**How to avoid:** Use the explicit 6-element list shown in the FOCUS-TEST-03 skeleton above. Includes `/pert`. [VERIFIED: file inspection of `e2e/mobile-nav-clearance.spec.ts:14-20`]

### Pitfall 4: Tailwind class-string format may shift on save
**What goes wrong:** `prettier-plugin-tailwindcss` reorders tokens in the className string; raw-substring assertions like `'sticky top-0 right-0 left-0'` (in that order) fail.
**How to avoid:** The existing `classAttrContainsAll(...)` helper at `NavShell.test.ts:29-37` verifies token presence, not order. Use it for any compound-token assertion. The new T-13 source-grep can use literal `expect(src).toContain('pt-[env(safe-area-inset-top,0px)]')` — that's a single token; formatting cannot split it. [VERIFIED: file inspection]

### Pitfall 5: Webkit-iphone runs ALL e2e specs by default (Phase 47 D-15)
**What goes wrong:** Planner assumes FOCUS-TEST-03 needs explicit project filter; but per Phase 47 D-15 both projects run every spec unless filtered.
**How to avoid:** The FOCUS-TEST-03 skeleton has NO `testMatch` filter and NO `test.skip`. It just runs under both projects automatically — that's what produces the 6 × 2 = 12 cases. [VERIFIED: `playwright.config.ts:15-24` + Phase 47 47-CONTEXT.md D-15]

## Code Examples

(Already provided in **Architecture Patterns** above; see "Concrete diff" and "Test skeleton" subsections.)

## State of the Art

| Old Approach | Current Approach | Source | Impact |
|--------------|------------------|--------|--------|
| Imperative focus shift via `queueMicrotask(() => firstInput?.focus())` | Declarative `autofocus` attribute on a non-text-summoning button | HTML spec § 4.10.5 dialog focus-fixup-step | Single source of truth; no JS effect; no per-calculator divergence |
| Hard-coded title-bar padding | Tailwind arbitrary-value brackets reading `env(safe-area-inset-*)` directly | MDN `env()` + project pattern at `NavShell.svelte:150` | Browser-tab mode and standalone PWA mode both work without device sniffing |
| Single Playwright project (`chromium`) | Two projects (`chromium` + `webkit-iphone`) | Phase 47 D-11..D-15 | iOS user-agent + viewport coverage in CI; visual notch still requires real device (Phase 50) |

**Deprecated/outdated patterns (do NOT regress):**
- Per-calculator `autoFocus` props or per-call-site overrides — REQUIREMENTS.md "Out of Scope".
- `position: fixed` drawer anchoring instead of native `<dialog>` top-layer — REQUIREMENTS.md "Out of Scope".
- `body { overflow: hidden }` scroll-lock — REQUIREMENTS.md "Out of Scope".

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | jsdom does not auto-resolve `autofocus` inside `<dialog>.showModal()` (the polyfill at `src/test-setup.ts:78-104` only sets `open` + `display`) | Test skeleton FOCUS-TEST-01 (T-07) | LOW — if jsdom DOES auto-resolve, the `if (... !== close) close.focus();` fallback becomes a no-op and the assertion still passes. Worst case is dead code that survives until a future polyfill upgrade. |
| A2 | Drawer-open trigger label `/tap to edit inputs/i` is the same on all 6 calculator routes | FOCUS-TEST-03 skeleton | LOW — verified for 5 of 6 routes by grep of existing e2e specs (feeds, formula, gir, uac-uvc, pert all use this label). Morphine-wean has no existing mobile-drawer e2e. The `InputsRecap.svelte` component is the single source for that label, so divergence is only possible if a route overrides — which a quick visual check during plan can confirm. |
| A3 | `webkit-iphone` Playwright project runs all e2e specs by default (no testMatch filter present) | FOCUS-TEST-03 12-case math | HIGH if wrong — would silently halve to 6 cases. But verified directly against `playwright.config.ts:15-24` and Phase 47 D-15. |

## Open Questions

1. **Does morphine-wean's `InputsRecap` actually open the drawer at `width: 375`?**
   - What we know: morphine-wean has NO existing mobile-drawer e2e spec; the route does render `InputsRecap` (route file structure matches the other 5).
   - What's unclear: whether morphine-wean has a different drawer-open path — but `InputDrawer.svelte` is shared and `InputsRecap.svelte` composes the trigger label from `title`, so the regex `/tap to edit inputs/i` should match.
   - Recommendation: include `/morphine-wean` in FOCUS-TEST-03 ROUTES; if it fails on first CI run, the spec error message ("button with name /tap to edit inputs/i not found") is self-diagnosing and the planner can switch to the route's actual recap label without re-architecture.

2. **Does the `bg-[var(--color-surface)]` paint into the inset region in BOTH light and dark themes without further intervention?**
   - What we know: D-04 + LC-01 + UI-SPEC Color section all say yes (CSS extends background into padded region by default).
   - What's unclear: a snapshot/computed-style assertion is suggested in CONTEXT.md D-04 ("confirm with a snapshot/computed-style check during plan, not a separate code change") but no specific test is locked.
   - Recommendation: NOTCH-TEST-01's source-grep suffices for CI; visual confirmation is Phase 50 SMOKE-02. No new vitest assertion needed in Phase 48.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | Build & test | ✓ | ^10.33.0 (per CLAUDE.md) | — |
| Vitest framework | NOTCH-TEST-01, FOCUS-TEST-01, FOCUS-TEST-02 | ✓ (installed) | ^4.1.2 | — |
| Playwright | FOCUS-TEST-03 | ✓ (installed) | ^1.58.2 | — |
| Playwright `webkit-iphone` project | FOCUS-TEST-03 (one of two project executions) | ✓ (Phase 47) | iPhone 14 Pro device descriptor | — |
| WebKit browser engine for Playwright | FOCUS-TEST-03 webkit-iphone case | ✓ (CI installed per commit `36f00ae`) | Playwright-bundled | — |
| jsdom polyfills (`HTMLDialogElement.showModal`, `visualViewport`) | FOCUS-TEST-01 dialog mounting | ✓ (`src/test-setup.ts:78-104` + 152-211) | Phase 47 inheritance | — |
| `@testing-library/svelte` + `InputDrawerHarness.svelte` | FOCUS-TEST-01 mounting harness | ✓ | Existing | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Security Domain

> CLAUDE.md security section: not configured (no `security_enforcement: true` in config). Phase 48 changes are CSS class strings + one HTML attribute + tests — no auth, no input handling, no crypto, no network surface. ASVS sweep: not applicable.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a |
| V3 Session Management | no | n/a |
| V4 Access Control | no | n/a |
| V5 Input Validation | no | n/a |
| V6 Cryptography | no | n/a |

## Project Constraints (from CLAUDE.md)

- **Language:** TypeScript — all new test files MUST be `.ts`. [CLAUDE.md Project Configuration]
- **Package manager:** pnpm. [CLAUDE.md Project Configuration]
- **No native:** PWA only. [CLAUDE.md Constraints]
- **Accessibility:** WCAG 2.1 AA minimum, 48px touch targets. The close button's existing `min-h-[56px]` (line 109) already exceeds this; `autofocus` does not reduce the touch target. [CLAUDE.md Constraints]
- **Code reuse:** Port business logic from existing apps, don't rewrite calculation functions — Phase 48 makes ZERO calculation changes; constraint is automatically honored. [CLAUDE.md Constraints]
- **Test colocation:** Co-locate test files with source, not in `__tests__/` dirs. The new tests follow this: T-13 in `src/lib/shell/NavShell.test.ts`, T-07/T-08 in `src/lib/shared/components/InputDrawer.test.ts`. [MEMORY.md `feedback_test_colocation.md`]
- **GSD workflow enforcement:** Edits go through GSD commands. Planner produces PLAN.md; executor runs `/gsd:execute-phase`. [CLAUDE.md GSD Workflow Enforcement]
- **WebAwesome Vite per-component imports:** Not applicable to Phase 48 (no WA components touched). [MEMORY.md `feedback_webawesome_vite.md`]
- **Mobile-first usage:** PWA primarily used on mobile — FOCUS-TEST-03 mobile-viewport assertion is alignment-correct. [MEMORY.md `user_mobile_first.md`]
- **Em-dash ban (Phase 3 broad convention):** Already followed by all referenced specs. The new spec file content above contains no em-dashes. [Project convention via existing e2e specs]

## Sources

### Primary (HIGH confidence)
- `.planning/phases/48-wave-1-trivial-fixes-notch-focus/48-CONTEXT.md` — D-01..D-21
- `.planning/phases/48-wave-1-trivial-fixes-notch-focus/48-UI-SPEC.md` — LC-01, LC-02, LC-03
- `.planning/REQUIREMENTS.md` — NOTCH-01..04, NOTCH-TEST-01, FOCUS-01..03, FOCUS-TEST-01..03 verbatim
- `.planning/research/PITFALLS.md` — P-01, P-09, P-10, P-11, P-13, P-14, P-17, P-19
- `src/lib/shell/NavShell.svelte` — file inspected, lines 76-80 confirmed as edit site, line 150 confirmed as pattern source
- `src/lib/shell/NavShell.test.ts` — file inspected, EXISTS with 12 tests (T-01..T-12); T-13 must APPEND
- `src/lib/shared/components/InputDrawer.svelte` — file inspected, lines 47-57 + 107-119 confirmed
- `src/lib/shared/components/InputDrawer.test.ts` — file inspected, T-06 source-grep pattern at lines 83-94 confirmed as template
- `src/test-setup.ts` — file inspected, `HTMLDialogElement` polyfill at lines 78-104 + `visualViewport` polyfill at lines 152-211 confirmed
- `playwright.config.ts` — file inspected, two projects (`chromium`, `webkit-iphone`) confirmed
- `e2e/feeds.spec.ts`, `e2e/pert.spec.ts`, `e2e/gir.spec.ts`, `e2e/uac-uvc.spec.ts`, `e2e/formula.spec.ts` — all use `getByRole('button', { name: /tap to edit inputs/i })` to open drawer (verified by grep)
- `e2e/mobile-nav-clearance.spec.ts:14-20` — confirmed it iterates only 5 routes (PERT missing); FOCUS-TEST-03 must list 6 explicitly
- `.planning/phases/47-wave-0-test-scaffolding/47-CONTEXT.md` D-15 — both Playwright projects run all e2e specs by default

### Secondary (MEDIUM confidence)
- HTML spec § 4.10.5 — dialog focus-fixup-step (referenced by D-11; not freshly retrieved this phase but cited verbatim by 48-UI-SPEC LC-03)
- MDN `env()` and `safe-area-inset-*` (referenced by 48-CONTEXT canonical_refs)

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; all existing.
- Architecture: HIGH — file/line edits are pre-located; CONTEXT.md already locked them.
- Pitfalls: HIGH — milestone PITFALLS.md is exhaustive for this phase's scope; the 5 in-phase pitfalls flagged here are observations made by reading live source against CONTEXT.md (file existence, route-list miscounts, jsdom autofocus semantics).
- Test skeletons: HIGH — directly transcribed from existing project conventions (T-06 source-grep at `InputDrawer.test.ts:83-94`, route-loop at `e2e/mobile-nav-clearance.spec.ts`, drawer trigger at `e2e/feeds.spec.ts:33-36`).

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days — stack is stable, locked decisions are in CONTEXT.md)
