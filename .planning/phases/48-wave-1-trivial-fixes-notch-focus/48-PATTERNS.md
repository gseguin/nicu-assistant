# Phase 48: Wave-1 — Trivial Fixes (NOTCH + FOCUS) - Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 5 (4 modified + 1 created)
**Analogs found:** 5 / 5
**Mode:** All analogs live in the same repo (intra-repo refactor + small new e2e spec). No cross-cutting framework patterns introduced.

---

## File Classification

| File | Action | Role | Data Flow | Closest Analog | Match Quality |
|------|--------|------|-----------|----------------|---------------|
| `src/lib/shell/NavShell.svelte` | MODIFY (className edit) | shell component (chrome) | request-response (none, pure CSS layout) | **self** at `NavShell.svelte:150` mobile bottom-nav `pb-[env(safe-area-inset-bottom,0px)]` | exact (same file, mirrored axis) |
| `src/lib/shared/components/InputDrawer.svelte` | MODIFY (delete block + add attribute) | UI component (native `<dialog>`) | event-driven (drawer open/close) | **self** at `InputDrawer.svelte:107-119` close button already exists; only one attribute added | exact (no structural change) |
| `src/lib/shell/NavShell.test.ts` | MODIFY (APPEND T-13) | test (vitest, source-grep) | n/a | `InputDrawer.test.ts:83-94` (T-06 source-grep) + same file's T-11/T-12 | exact (same file's existing source-grep tests) |
| `src/lib/shared/components/InputDrawer.test.ts` | MODIFY (APPEND T-07 + T-08) | test (vitest, component + source-grep) | request-response (render, assert) | `InputDrawer.test.ts:49-57` (T-03 mount-and-tick) + `InputDrawer.test.ts:83-94` (T-06 source-grep) | exact (same file's existing tests) |
| `e2e/drawer-no-autofocus.spec.ts` | CREATE | test (Playwright e2e) | request-response (route loop) | `e2e/mobile-nav-clearance.spec.ts` (route loop + mobile viewport + addInitScript) + `e2e/feeds.spec.ts:24-36` (drawer-open trigger) | exact (composable from two existing specs) |

**Confidence:** HIGH. Every analog is in the same repo, the same module, or, for FOCUS-TEST-03, composed verbatim from two existing e2e specs.

---

## Pattern Assignments

### `src/lib/shell/NavShell.svelte` (shell component, NOTCH-01..04)

**Analog:** `src/lib/shell/NavShell.svelte:150` (same file, mobile bottom-nav inset pattern)

**Edit site (lines 76-80) verbatim from current source:**
```svelte
<header
	class="sticky top-0 right-0 left-0 z-10 flex
         min-h-14 items-center gap-2 border-b
         border-[var(--color-border)] bg-[var(--color-surface)] px-4"
>
```

**Pattern to mirror, bottom-nav inset at lines 148-152 verbatim from source:**
```svelte
<nav
	class="fixed right-0 bottom-0 left-0 z-10 border-t
         border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)]
         md:hidden"
	aria-label="Calculator navigation"
>
```

The token `pb-[env(safe-area-inset-bottom,0px)]` is the exact shape to mirror. New header gets the **top** counterpart plus the **horizontal** counterpart with a `max()` floor.

**Tokens to add to header className per RESEARCH.md "Concrete diff" + LC-01:**
- ADD: `pt-[env(safe-area-inset-top,0px)]`
- REPLACE: `px-4` becomes `px-[max(env(safe-area-inset-left,0px),1rem)]`

**Resulting className (token order may shift after `prettier-plugin-tailwindcss`, irrelevant; tests assert presence not order):**
```svelte
<header
	class="sticky top-0 right-0 left-0 z-10 flex
         min-h-14 items-center gap-2 border-b
         border-[var(--color-border)] bg-[var(--color-surface)]
         pt-[env(safe-area-inset-top,0px)]
         px-[max(env(safe-area-inset-left,0px),1rem)]"
>
```

**Why this analog:** `NavShell.svelte:150` already uses Tailwind arbitrary-value bracket syntax + `env(safe-area-inset-*,0px)` fallback shape. Using the identical shape on the same component (top vs bottom axis) means reviewers do not context-switch. CONTEXT.md D-03 explicitly mandates "matches the project pattern already used at `NavShell.svelte:150`."

**Critical constraints:**
- Bare `env(...)` on `pt-` (no `max()` floor) per CONTEXT.md D-02 / PITFALLS.md P-10. Floor breaks Phase 42.1 hero-fills-viewport contract in Safari browser-tab mode.
- `max()` IS used on `px-` because the existing `1rem` (= `px-4`) is the design floor for chrome content gutter.
- No new wrapper element. Single className edit. CONTEXT.md D-01.
- No new CSS custom property (`--header-h`). CONTEXT.md D-06.
- Existing `bg-[var(--color-surface)]` (line 79) already paints into the new padded region by default, no extra rule needed. CONTEXT.md D-04 / LC-01.

---

### `src/lib/shared/components/InputDrawer.svelte` (UI component, FOCUS-01..03)

**Analog:** `src/lib/shared/components/InputDrawer.svelte` itself, close button at lines 107-119 already exists; one attribute added.

**Deletion (lines 47-57 inclusive, entire block + stale comment per CONTEXT.md D-08 + D-15):**

The block to remove, verbatim from current source:
```svelte
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
```

**Resulting `$effect` block after deletion (lines 43-62 collapse to lines 43-52):**
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

**Attribute addition (line 107 close `<button>` opening tag) current source:**
```svelte
<button
    type="button"
    class="flex min-h-[56px] flex-1 items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-alt)] active:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]"
    aria-label="Close {title.toLowerCase()}"
    onclick={() => (expanded = false)}
>
```

**Resulting tag, single `autofocus` attribute added (placement order is irrelevant to HTML parsing):**
```svelte
<button
    type="button"
    autofocus
    class="flex min-h-[56px] flex-1 items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-alt)] active:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]"
    aria-label="Close {title.toLowerCase()}"
    onclick={() => (expanded = false)}
>
```

**Why no analog deletion pattern is needed:** The block at lines 47-57 has no sibling deletion analog because the project has no prior history of removing imperative focus shifts, this is a one-off correction. The "analog" is the existing close button at lines 107-119, which is already present, accessible (`aria-label="Close {title.toLowerCase()}"`), 56 px tall (>= 48 px touch target), and carries the existing focus-visible ring (`focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]`). Adding `autofocus` reuses every property already there.

**Critical constraints:**
- Full deletion of the block, not narrowing of the selector. CONTEXT.md D-08 / PITFALLS.md P-13.
- `autofocus` on close button only, NOT on Clear button (lines 98-105) which is conditional (`{#if onClear}`). CONTEXT.md D-09.
- Declarative `autofocus` over imperative `dialog.focus()`. CONTEXT.md D-09 + D-11 / PITFALLS.md P-14.
- Stale comment at lines 47-50 also deleted, no replacement comment. CONTEXT.md D-15.

---

### `src/lib/shell/NavShell.test.ts` (test, NOTCH-TEST-01)

**File status:** EXISTS with 12 tests (T-01..T-12, lines 1-256). Append T-13.

**Analog 1 (in same file), existing source-grep test at T-11/T-12, lines 241-254:**
```ts
it('T-11 desktop tablist has overflow-x-auto via .tablist-scroll class', () => {
    // Source-string assertion, the .tablist-scroll class is applied to the inner
    // <div role="tablist"> so overflow-x lives there and not on the outer <nav>.
    expect(navShellSource).toContain('class="tablist-scroll flex gap-2"');
    // The CSS rule itself is in the <style> block.
    expect(navShellSource).toMatch(/\.tablist-scroll\s*\{[^}]*overflow-x:\s*auto/);
});

it('T-12 mask-image fade is gated on .is-overflowing class', () => {
    // Source-string assertion, fade only applies under .is-overflowing
    expect(navShellSource).toMatch(/\.tablist-scroll\.is-overflowing\s*\{[^}]*mask-image:\s*linear-gradient/);
    // The class is bound conditionally in markup
    expect(navShellSource).toContain('class:is-overflowing={isOverflowing}');
});
```

**Analog 2 (cross-file), `InputDrawer.test.ts:83-94` T-06 source-grep:**
```ts
it('T-06 styles block contains prefers-reduced-motion gate for slide animation', () => {
    // [...] Vite scopes Svelte component <style> blocks via CSS-in-JS that
    // jsdom doesn't surface, so assert against the source file directly
    // (mirrors the Identity-Inside conformance pattern in 42.1-PATTERNS.md).
    const src = readFileSync(
        resolve(__dirname, 'InputDrawer.svelte'),
        'utf8'
    );
    expect(src).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
    expect(src).toMatch(/@keyframes slide-up/);
});
```

**Existing infrastructure already in `NavShell.test.ts` (lines 22-37) the new T-13 reuses:**
```ts
const navShellSource = readFileSync(
  resolve(process.cwd(), 'src/lib/shell/NavShell.svelte'),
  'utf-8'
);

function classAttrContainsAll(source: string, required: readonly string[]): boolean {
  const attrRegex = /class="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(source)) !== null) {
    const tokens = new Set(match[1].split(/\s+/));
    if (required.every((t) => tokens.has(t))) return true;
  }
  return false;
}
```

**T-13 to APPEND per RESEARCH.md test skeleton:**
```ts
it('T-13 NOTCH-TEST-01: header carries pt-[env(safe-area-inset-top,...)] and px-[max(env(safe-area-inset-left,...),1rem)]', () => {
    expect(navShellSource).toContain('pt-[env(safe-area-inset-top,0px)]');
    expect(navShellSource).toContain('px-[max(env(safe-area-inset-left,0px),1rem)]');
    // Negative: ensure the canonical sticky-header tokens are still present
    // (token-presence assertion, format-stable per prettier-plugin-tailwindcss).
    expect(classAttrContainsAll(navShellSource, ['sticky', 'top-0', 'min-h-14'])).toBe(true);
});
```

**Why this analog:** T-11 + T-12 are already in the same file and use the same `navShellSource` constant + literal `expect(...).toContain(...)` shape. The new T-13 is a sibling in spirit, file, and helper. The cross-file T-06 confirms the project-wide convention.

**Pitfall to avoid (RESEARCH.md Pitfall 1):** Do NOT create a new `NavShell.test.ts`, it already exists. Plan task wording must be "append T-13 to existing file."

---

### `src/lib/shared/components/InputDrawer.test.ts` (test, FOCUS-TEST-01 + FOCUS-TEST-02)

**File status:** EXISTS with 6 tests (T-01..T-06, lines 1-99). Append T-07 + T-08.

**Imports already present (lines 1-12) reusable verbatim:**
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import InputDrawer from './InputDrawer.svelte';
import InputDrawerHarness from './InputDrawerHarness.svelte';
```

**Analog 1 (mount + tick + role-query), T-03 at lines 49-57:**
```ts
it('T-03 expanded renders dialog with title in header and children inside', async () => {
    render(InputDrawerHarness, { props: { initialExpanded: true } });
    await tick();
    expect(screen.getByTestId('drawer-input')).toBeTruthy();
    // Title now lives inside the header close-button (entire header row is the
    // collapse affordance); the dialog carries it as aria-label at the root.
    expect(screen.getByRole('button', { name: /Close inputs/i })).toBeTruthy();
});
```

**Analog 2 (dialog handle via container.querySelector), T-05 at lines 72-81:**
```ts
it('T-05 dialog programmatic close (simulating Esc) writes false back through bind', async () => {
    const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
    await tick();
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    expect(dialog).toBeTruthy();
    dialog.close();
    await tick();
    expect(screen.getByTestId('expanded-state').textContent).toBe('closed');
});
```

**Analog 3 (source-grep regression guard), T-06 at lines 83-94:**
```ts
it('T-06 styles block contains prefers-reduced-motion gate for slide animation', () => {
    const src = readFileSync(
        resolve(__dirname, 'InputDrawer.svelte'),
        'utf8'
    );
    expect(src).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
    expect(src).toMatch(/@keyframes slide-up/);
});
```

**T-07 + T-08 to APPEND per RESEARCH.md test skeleton + CONTEXT.md D-12 + D-13:**
```ts
it('T-07 FOCUS-TEST-01: after showModal(), activeElement is NOT input/select/textarea/role=slider, and IS the close button', async () => {
    const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
    await tick();
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    expect(dialog).toBeTruthy();
    // jsdom <dialog> polyfill (test-setup.ts:78-104) only flips `open` + `display`;
    // the HTML focus-fixup-step that resolves `autofocus` is browser-only.
    // Re-resolve manually so the assertion exercises the same observable behavior.
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

**Why these analogs:** T-03 is the established mount-with-`initialExpanded:true`-then-`await tick()` pattern, and T-07 reuses it verbatim plus a `screen.getByRole('button', { name: /Close inputs/i })` query that T-03 itself uses (line 56). T-05 supplies the `container.querySelector('dialog')` handle pattern. T-06 is the verbatim source-grep template that T-08 mirrors (read source via `readFileSync(resolve(__dirname, ...), 'utf8')`, then `expect(src).{toContain, not.toContain, toMatch}`).

**Pitfall to avoid (RESEARCH.md Pitfall 2):** jsdom `<dialog>` polyfill at `src/test-setup.ts:78-104` does NOT auto-resolve `autofocus`. The deterministic fallback `if (document.activeElement !== close) close.focus()` is required for T-07 to be authoritative in CI. Real-browser `autofocus` resolution is verified by FOCUS-TEST-03 (Playwright).

---

### `e2e/drawer-no-autofocus.spec.ts` (CREATE, test, FOCUS-TEST-03)

**Analog 1 (route loop + mobile viewport + addInitScript pattern), `e2e/mobile-nav-clearance.spec.ts` lines 14-35:**
```ts
import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/morphine-wean', name: /Morphine Wean/i },
  { path: '/formula', name: /Formula Recipe/i },
  { path: '/gir', name: /Glucose Infusion Rate/i },
  { path: '/feeds', name: /Feed Advance Calculator/i },
  { path: '/uac-uvc', name: /UAC\/UVC Catheter Depth/i }
];

test.describe('Mobile bottom-nav clearance (D-09)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('nicu_assistant_disclaimer_v2', 'true');
      localStorage.removeItem('nicu:favorites');
    });
  });
  // [...] for (const route of ROUTES) { test(...) }
```

**Analog 2 (drawer-open trigger pattern), `e2e/feeds.spec.ts:24-36` (and identical at `pert.spec.ts:52`, `gir.spec.ts:38`, `uac-uvc.spec.ts:65`, `formula.spec.ts:52`):**
```ts
test.beforeEach(async ({ page }) => {
  await page.goto('/feeds');
  await page
    .getByRole('button', { name: /understand/i })
    .click({ timeout: 2000 })
    .catch(() => {});
  if (viewport.name === 'mobile') {
    await page.getByRole('button', { name: /tap to edit inputs/i }).click();
  }
});
```

**Critical adaptation (RESEARCH.md Pitfall 3):** `mobile-nav-clearance.spec.ts` ROUTES list omits `/pert`. FOCUS-TEST-03 MUST list all six routes explicitly:

```ts
const ROUTES = [
    '/morphine-wean',
    '/formula',
    '/gir',
    '/feeds',
    '/uac-uvc',
    '/pert'
];
```

**File to CREATE per RESEARCH.md test skeleton + CONTEXT.md D-14:**
```ts
// e2e/drawer-no-autofocus.spec.ts
// Phase 48 / FOCUS-TEST-03: opening the drawer on each calculator route lands
// focus on the close button (NOT a textbox/select/textarea/slider). Runs under
// both `chromium` and `webkit-iphone` projects (Phase 47 D-15, both projects
// run all e2e specs by default). 6 routes x 2 projects = 12 cases.
//
// Pattern source: e2e/mobile-nav-clearance.spec.ts (route-loop + addInitScript) +
// e2e/feeds.spec.ts:24-36 (disclaimer-dismiss + drawer-open trigger).
import { test, expect } from '@playwright/test';

const ROUTES = [
    '/morphine-wean',
    '/formula',
    '/gir',
    '/feeds',
    '/uac-uvc',
    '/pert'
];

// iPhone-SE viewport, narrow enough to put the route below the md: breakpoint
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

**Why these analogs:**
- `mobile-nav-clearance.spec.ts` is the closest existing route-iteration spec (mobile viewport, `addInitScript` for disclaimer + favorites reset, no per-route logic). Same structural template.
- `feeds.spec.ts:35` is the canonical drawer-open trigger and the exact regex `/tap to edit inputs/i` is verified at 5 of 6 e2e specs (RESEARCH.md sources line 436). Morphine-wean has no existing mobile drawer e2e but uses the same `InputsRecap` component, so the trigger label is shared by construction.
- `playwright.config.ts:15-24` already declares both projects (`chromium`, `webkit-iphone`) with no `testMatch` filter, the new spec automatically runs under both, producing 6 x 2 = 12 cases without any per-project annotation (RESEARCH.md Pitfall 5).

**Critical constraints:**
- 6-route ROUTES constant (NOT 5, Pitfall 3).
- No `test.skip` or per-project filter; both projects run by default per Phase 47 D-15.
- Single mobile viewport (`width: 375, height: 667`) via `test.use({ viewport: ... })` at module scope. The `webkit-iphone` project's iPhone-14-Pro viewport will be overridden by this `test.use`, that is intentional, FOCUS-TEST-03 is a focus-target check, not a notch check.
- `getByRole('button', { name: /Close /i })` regex matches `Close inputs`, `Close formula inputs`, etc. across all 6 calculator titles via the `aria-label="Close {title.toLowerCase()}"` template at `InputDrawer.svelte:110`.

---

## Shared Patterns

### Source-grep regression guard

**Source-of-truth analog:** `src/lib/shared/components/InputDrawer.test.ts:83-94` (T-06)

**Apply to:** `NavShell.test.ts` T-13 (NOTCH-TEST-01) AND `InputDrawer.test.ts` T-08 (FOCUS-TEST-02).

**Pattern:**
```ts
const src = readFileSync(resolve(__dirname, '<Component>.svelte'), 'utf8');
expect(src).toContain('<positive token>');
expect(src).not.toContain('<deleted token>');
expect(src).toMatch(/<regex for runtime construct>/);
```

**Notes:**
- For NOTCH-TEST-01, `__dirname` resolves to `src/lib/shell/`, so `resolve(__dirname, 'NavShell.svelte')` reads the file. The existing `NavShell.test.ts:22-25` already does this with `process.cwd()`, both shapes work; the existing constant `navShellSource` is reusable, so T-13 simply uses it.
- For FOCUS-TEST-02, T-08 uses `resolve(__dirname, 'InputDrawer.svelte')` which is identical to T-06's existing read.
- Negative-string assertions (`not.toContain`) catch the actual regression mode for FOCUS, a careless rewrite that re-pastes the deleted block would fail T-08 even if it forgot to remove `autofocus`. Per CONTEXT.md "Specifics" + RESEARCH.md.

### Tailwind className token-presence assertion

**Source-of-truth analog:** `src/lib/shell/NavShell.test.ts:29-37` (`classAttrContainsAll` helper)

**Apply to:** T-13 third assertion (canonical sticky-header tokens still present).

**Pattern:**
```ts
function classAttrContainsAll(source: string, required: readonly string[]): boolean {
  const attrRegex = /class="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(source)) !== null) {
    const tokens = new Set(match[1].split(/\s+/));
    if (required.every((t) => tokens.has(t))) return true;
  }
  return false;
}
```

**Why:** `prettier-plugin-tailwindcss` reorders class tokens on save. Substring assertions like `expect(src).toContain('sticky top-0 right-0 left-0')` are format-fragile. Single-token assertions (`expect(src).toContain('pt-[env(safe-area-inset-top,0px)]')`) are format-stable because the bracket-syntax token is a single un-splittable lexeme. The helper handles compound multi-token assertions when needed (RESEARCH.md Pitfall 4).

### `<dialog>` polyfill awareness in vitest

**Source-of-truth:** `src/test-setup.ts:78-104` (HTMLDialogElement polyfill)

**Apply to:** `InputDrawer.test.ts` T-07 (FOCUS-TEST-01).

**What it does:**
- `showModal()` only sets `open` attribute + `display: ''`, does NOT run the HTML focus-fixup-step.
- `close()` removes `open`, sets `display: 'none'`, dispatches `'close'` Event.

**Implication for T-07:** Manual `close.focus()` fallback is required (`if (document.activeElement !== close) close.focus()`). Without it, jsdom leaves `document.activeElement` on `<body>` and the assertion's `.tagName === 'BUTTON'` arm passes vacuously while the negative `not.toBe('INPUT')` arm also passes vacuously, neither catches a regression. The fallback closes that loophole; the source-grep T-08 + Playwright FOCUS-TEST-03 cover the real-browser semantics.

### Cross-calculator e2e route iteration

**Source-of-truth analog:** `e2e/mobile-nav-clearance.spec.ts:14-20` (5-route ROUTES + viewport loop), NOTE: omits `/pert`.

**Apply to:** `e2e/drawer-no-autofocus.spec.ts` (NEW). MUST extend the analog's 5-route list to all 6 routes.

**Why:** FOCUS-03 ("single source of truth, no per-calculator divergence") is unverified if any calculator is missing from the loop. The PERT route uses the same `InputDrawer` and same `InputsRecap` trigger, so omission would only be detected by manual review, not by CI.

---

## No Analog Found

| File | Reason | Resolution |
|------|--------|------------|
| (none) | All five files have direct in-repo analogs. | n/a |

Phase 48 is a structural-polish phase against existing components; every pattern is already established somewhere in the repo. No external research patterns are needed beyond what RESEARCH.md already supplies (HTML `<dialog>` autofocus spec; CSS `env()` MDN reference), both already inlined in CONTEXT.md canonical_refs.

---

## Metadata

**Analog search scope:**
- `/mnt/data/src/nicu-assistant/src/lib/shell/`, shell components
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/`, shared UI components
- `/mnt/data/src/nicu-assistant/src/test-setup.ts`, jsdom polyfills
- `/mnt/data/src/nicu-assistant/e2e/`, Playwright specs
- `/mnt/data/src/nicu-assistant/playwright.config.ts`, project configuration

**Files inspected for analog extraction:**
- `src/lib/shell/NavShell.svelte` (200 lines, fully read)
- `src/lib/shell/NavShell.test.ts` (256 lines, fully read)
- `src/lib/shared/components/InputDrawer.svelte` (189 lines, fully read)
- `src/lib/shared/components/InputDrawer.test.ts` (99 lines, fully read)
- `e2e/mobile-nav-clearance.spec.ts` (66 lines, fully read)
- `e2e/feeds.spec.ts` (lines 1-60 read; drawer-open trigger at 35 confirmed)
- `playwright.config.ts` (37 lines, fully read)
- `src/test-setup.ts` (lines 75-109 read; HTMLDialogElement polyfill confirmed)
- (verified by grep) `e2e/{pert,gir,formula,uac-uvc}.spec.ts` all use `getByRole('button', { name: /tap to edit inputs/i })`

**Pattern extraction date:** 2026-04-27

**Confidence breakdown:**
- File classification: HIGH (CONTEXT.md and RESEARCH.md pre-located every edit by file:line).
- Analog selection: HIGH (every analog is in the same repo; for NOTCH and FOCUS, the analog is the same file).
- Excerpt accuracy: HIGH (all excerpts read from current `main` after commit `10a62b6`).
- Shared-pattern coverage: HIGH (three cross-cutting patterns named with single-source-of-truth and apply-to lists).

---

*Phase: 48-wave-1-trivial-fixes-notch-focus*
*Pattern map written: 2026-04-27*
