# Phase 12: Shared SelectPicker Rewrite — Research

**Researched:** 2026-04-07
**Domain:** Svelte 5 component rewrite, native `<dialog>` modal, a11y, Tailwind 4 tokens
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md / STATE.md decisions)

### Locked Decisions
- `.impeccable.md` is the design contract authority for all polish work
- Replace bits-ui-based SelectPicker with a custom `<dialog>`-based modal picker
- Drop `bits-ui` from package.json **if no other consumer remains**
- SelectPicker rewrite (Phase 12) lands first — later phases depend on it
- Tech stack is locked: Svelte 5 runes, Tailwind CSS 4, no new runtime deps

### Claude's Discretion
- Exact file-by-file layout of the new picker (single file vs. split)
- Whether to include the optional `searchable` prop in v1 of the rewrite
- Animation/transition choices (bounded by `prefers-reduced-motion`)
- Backdrop color treatment (must be OKLCH-token driven)

### Deferred Ideas (OUT OF SCOPE)
- Replacing bits-ui `Dialog` (used by `AboutSheet`, `DisclaimerModal`) — future phase
- New SelectPicker consumers beyond Fortification — Morphine Wean adoption is **Phase 14** (MORPH-02), not here
- Adding a popover/portal library
- Any visual sweep on Fortification layout beyond what the picker itself controls
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PICK-01 | Custom `<dialog>` modal replaces bits-ui `Select` everywhere SelectPicker renders | Pert-calc reference pattern + single-file `src/lib/shared/components/SelectPicker.svelte` rewrite |
| PICK-02 | Keyboard nav (Arrow/Home/End/Enter/Esc), trigger refocus on close | Native `<dialog>` `close` event + manual roving tabindex on `role="option"` buttons (port from pert-calc) |
| PICK-03 | Grouped options (formulas by manufacturer) render correctly | Derive group list from `options[].group`, render `role="group"` with sticky heading |
| PICK-04 | Focus-visible + selected state use `.impeccable.md` OKLCH tokens, no hardcoded colors | Existing `var(--color-*)` tokens in `src/app.css` — see Tokens section |
| PICK-05 | Mobile: fills width, ≥48 px targets, `env(safe-area-inset-bottom)` honored | Global `button { min-h:48px }` rule already present; add safe-area padding to dialog inner container |
| PICK-06 | `bits-ui` removed if no other consumer remains | **BLOCKED** — `AboutSheet` + `DisclaimerModal` still import `Dialog` from `bits-ui`. See "bits-ui removal verification" section |
</phase_requirements>

## Summary

The current `SelectPicker.svelte` is a thin wrapper around `bits-ui` `Select.Root/Trigger/Portal/Content/Viewport/Group/GroupHeading/Item`. It supports grouping via `options[].group` and uses a Svelte context (`getCalculatorContext`) for an accent color override. The **only** consumer in the codebase is `FortificationCalculator.svelte` (4 instances: Base, Formula grouped, Target Calorie, Unit). MorphineWeanCalculator does **not** use SelectPicker today — that's deferred to Phase 14 / MORPH-02.

The pert-calculator project (sibling repo, same author) already has a mature `<dialog>`-based picker that is the spiritual reference: native `HTMLDialogElement.showModal()`, manual roving tabindex, Arrow/Home/End/Esc handling, backdrop-click dismiss, optional search, focus restoration via the `close` event. We will port its structure — not its files — and adapt to this project's token vocabulary and test contract.

**Critical constraint:** PICK-06 (remove `bits-ui`) **cannot be satisfied in Phase 12** because `bits-ui` is also used by `AboutSheet.svelte` (`Dialog`) and `DisclaimerModal.svelte` (`Dialog`). The planner must either (a) descope PICK-06 to a "verify no other SelectPicker consumers" check and leave `bits-ui` in package.json, or (b) expand Phase 12 scope to also port those two dialogs to native `<dialog>`. Recommendation: **option (a)** — keep the phase focused on the picker and mark PICK-06 as "deferred until Dialog is also ported". Flag this to the user in the discuss step if it wasn't already.

**Primary recommendation:** Single-file rewrite of `src/lib/shared/components/SelectPicker.svelte` that preserves the exact existing public prop surface (`label`, `value` bindable, `options`, `placeholder`, `class`), preserves the test contract (`role="button"` trigger, `aria-labelledby` → visible label span, `data-select-trigger` attribute, option label appearing in trigger text), and adds the `<dialog>`-based modal body. Atomic swap — the file is replaced in-place, FortificationCalculator requires zero changes, tests continue to pass.

## Standard Stack

### Core (already installed — no additions)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | ^5.54.0 | Component + runes | Locked [VERIFIED: package.json] |
| SvelteKit | ^2.55.0 | Framework | Locked [VERIFIED: package.json] |
| Tailwind CSS | ^4.2.2 | Styling | Locked [VERIFIED: package.json] |
| `@lucide/svelte` | ^1.7.0 | `ChevronDown` / `Check` icons | Already imported by current SelectPicker [VERIFIED: SelectPicker.svelte line 3] |

### To Remove (conditional)
| Library | Version | Action | Blocking |
|---------|---------|--------|----------|
| `bits-ui` | ^2.16.5 | Remove from dependencies if no consumer | **BLOCKED** — still used by `AboutSheet.svelte` and `DisclaimerModal.svelte` [VERIFIED: grep `bits-ui` in src/] |

**Do not add:** No new runtime dependencies. No popover libs. No portal helpers. No `svelte-themes`. Native `<dialog>` is sufficient [CITED: MDN HTMLDialogElement].

## Current Implementation Analysis

### Public API (must be preserved)

```ts
{
  label: string;
  value: string;           // $bindable
  options: SelectOption[]; // { value, label, group? }
  placeholder?: string;    // default 'Select...'
  class?: string;
}
```

### What current SelectPicker does (bits-ui based)
1. **Renders a label span** with `id={labelId}` and class using `var(--color-text-secondary)`
2. **Renders `Select.Trigger`** — bits-ui emits this as a `<button role="combobox">` with `data-select-trigger` attribute and `aria-labelledby={labelId}` [VERIFIED: `node_modules/bits-ui/dist/bits/select/select.svelte.js` line 457, `getBitsAttr("trigger")`]
3. **`Select.Portal`** mounts content to `document.body` to escape stacking contexts
4. **`Select.Content` + `Select.Viewport`** — scroll container with `preventScroll={true}` (scroll lock on body)
5. **Grouping** — derives unique groups from `options[].group`, renders `Select.Group` + sticky `Select.GroupHeading` styled with `accentColor` from Svelte context
6. **`Select.Item`** — each option, with `data-highlighted` and `data-selected` attribute hooks
7. **Calculator accent color** — reads `getCalculatorContext().accentColor` for group header color and selected check icon

### Consumer coupling (only consumer: `FortificationCalculator.svelte`)
- 4 SelectPicker instances: Base, Formula (grouped by manufacturer), Target Calorie, Unit
- Binds to local `$state` string mirrors (the "string-bridge pattern") — not to state directly
- Does NOT use `class` prop
- Does NOT use `placeholder` prop (every picker has a default value)
- Uses grouping only on the Formula picker

### Test contract (from `FortificationCalculator.test.ts`)

| Assertion | Dependency |
|-----------|-----------|
| `screen.getByRole('button', { name: label })` | Trigger must be a `<button>` whose accessible name equals `label`. Achieved today via `aria-labelledby` pointing at a sibling `<span id={labelId}>{label}</span>`. |
| `screen.getByLabelText('Unit')` | Same mechanism — `aria-labelledby` association |
| `document.querySelectorAll('[data-select-trigger]')` returns 4 | Trigger element must have `data-select-trigger` attribute (today supplied by bits-ui internally). **The rewrite must emit this attribute explicitly.** |
| `unitTrigger.textContent ?? '' ... toContain('Packets')` | Trigger must render the selected option's label as visible text |
| `queryByText(/^Packets$/)` returns null when not in options | Options must not be in the DOM until the dialog is opened (or must match on exact text). Native `<dialog>` that is not `.showModal()`'d does not render content to the accessibility tree, but the nodes still exist in the DOM. **This test will still pass** because `queryByText(/^Packets$/)` looks for an element whose text node is exactly "Packets" — today it passes because bits-ui `Select.Portal` unmounts content when closed. **Risk:** the new picker keeps option buttons in the DOM even when the dialog is closed. Mitigation: render options inside a `{#if open}` block OR use `<dialog>`'s native behavior (content exists in DOM but is hidden). **Decision:** wrap option list in `{#if open}` to preserve the current closed-state DOM contract. Confirm with a test run. |

### Known behavior gaps that the rewrite should not reintroduce
- Current bits-ui version has no native grouping role semantics surfaced cleanly — the rewrite can emit `role="group"` + `aria-labelledby` on group containers
- Bits-ui `preventScroll` prevents background scroll; native `<dialog>.showModal()` also prevents scroll on the `<body>` via the top-layer + inert semantics [CITED: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal]

## Pert-Calculator Reference Pattern

**Source:** `/mnt/data/src/pert-calculator/src/lib/components/SelectPicker.svelte` [VERIFIED: read]

### What's good (port it)
1. **`dialog.showModal()` on open** — gives free focus trap, free Esc-to-close, free backdrop, top-layer stacking
2. **`close` event listener** restores focus to `triggerBtn` and resets `open`/`focusedIndex`/`searchQuery` — clean symmetric lifecycle
3. **`handleDialogClick(e) { if (e.target === dialog) closePicker() }`** — backdrop click dismisses (works because the backdrop receives clicks as `dialog` itself, children clicks bubble to inner container)
4. **Roving tabindex:** `tabindex={index === focusedIndex ? 0 : -1}` on option buttons, with Arrow keys updating `focusedIndex` and calling `.focus()` imperatively via `data-index` query
5. **Home/End handlers** — jumps to first/last option
6. **`role="listbox"` on container, `role="option"` + `aria-selected` on each item**
7. **`aria-labelledby="{listboxId}-label"`** — same pattern as current nicu SelectPicker's test contract expects

### What to improve / adapt
1. **Token names** differ:
   - pert-calc uses `text-secondary`, `border-border-subtle`, `text-placeholder`, `bg-surface-alt`, `text-tertiary`, `text-accent` as **Tailwind utility classes**
   - nicu-assistant uses `var(--color-text-secondary)`, `var(--color-border)`, `var(--color-text-tertiary)`, `var(--color-accent)`, `var(--color-surface-alt)` **via bracket syntax** `text-[var(--color-text-secondary)]`
   - There is **no `--color-border-subtle`** in nicu-assistant — fall back to `--color-border`
   - There is **no `--color-placeholder`** — use `--color-text-tertiary` instead
2. **Hardcoded backdrop color** in pert-calc (`rgba(15, 23, 42, 0.65)`) — replace with an OKLCH-token backdrop. Since `::backdrop` cannot read CSS variables from the host in all engines reliably, inject via a root-level CSS var or hardcode a dark-translucent OKLCH value that works for both themes. **Recommendation:** define `--color-scrim: oklch(16% 0.012 240 / 0.65)` in `app.css` `:root`/`.dark`, and reference as `::backdrop { background: var(--color-scrim); }`. ::backdrop variables are inherited from the originating element in modern Chromium/Firefox/Safari 15.4+ [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop].
3. **`searchable` prop** — pert-calc has it; nicu has no consumer that needs it today (all current pickers have ≤24 options, most ≤5). **Recommendation for v1:** omit `searchable` entirely. YAGNI. Re-add when a consumer needs it.
4. **`detail` field on options** — pert-calc supports `{ value, label, detail }`; nicu's `SelectOption` type is `{ value, label, group? }`. **Do not add `detail`** — not needed by current consumers.
5. **No group support** in pert-calc — nicu MUST support grouping (PICK-03). Add a grouped branch in the template modeled on the current bits-ui branch.
6. **Calculator accent context** — pert-calc has no accent context. nicu's current SelectPicker reads `getCalculatorContext().accentColor` for group headings and check icons. **Decision:** preserve this behavior — keep the context read, keep inline `style="color: {accentColor}"` on group headings and the selected check. Alternatively drop it if `.impeccable.md` says headings should always use `--color-text-tertiary` — but the existing behavior is tested indirectly by visual parity, so keep it unless the planner confirms with the user.

## Replacement Strategy

### File changes (atomic, single wave)

| File | Change | Rationale |
|------|--------|-----------|
| `src/lib/shared/components/SelectPicker.svelte` | **Rewrite in place** — same filename, same public props, new internals | Atomic swap; FortificationCalculator needs zero edits |
| `src/lib/shared/components/SelectPicker.test.ts` | **Create** — new unit tests covering open/close, keyboard nav, grouping, selection, focus restoration, DOM-closed state | No tests exist today for SelectPicker directly; the component deserves isolated coverage now that it's hand-rolled |
| `src/app.css` | **Add** `--color-scrim` token in light + dark `:root`/`.dark` blocks | Token-driven backdrop |
| `src/lib/fortification/FortificationCalculator.svelte` | **No change** (desired) — verify by running `pnpm test` after rewrite | Proof of atomic drop-in |
| `src/lib/fortification/FortificationCalculator.test.ts` | **No change** (desired); if DOM-closed-state assertion fails, add `{#if open}` guard to new SelectPicker and re-run | Tests are the contract |
| `package.json` | **No change** — leave `bits-ui` because `Dialog` is still used. Document in RESEARCH/PLAN that PICK-06 is partially satisfied | See "bits-ui removal verification" |

### New public API (unchanged from current)

```ts
{
  label: string;
  value: string;           // $bindable
  options: { value: string; label: string; group?: string }[];
  placeholder?: string;
  class?: string;
}
```

**No new props.** No `searchable`, no `ariaLabel`, no `detail`. Deliberately narrow. Expand later if needed.

### Internal structure (sketch, not final code)

```
<div class={className}>
  <div class="flex flex-col gap-1.5">
    <span id={labelId} class="...text-[var(--color-text-secondary)]">{label}</span>

    <button
      bind:this={triggerBtn}
      type="button"
      data-select-trigger                   ← required by tests
      aria-labelledby={labelId}              ← required by tests
      aria-haspopup="dialog"
      aria-expanded={open}
      class="...min-h-12 ...border-[var(--color-border)] hover:border-[var(--color-accent)]..."
      onclick={openPicker}
    >
      <span>{selectedLabel ?? placeholder}</span>
      <ChevronDown aria-hidden="true" />
    </button>
  </div>

  <dialog
    bind:this={dialog}
    class="picker-dialog ... rounded-2xl bg-[var(--color-surface-card)] ..."
    onclick={handleDialogClick}
  >
    {#if open}
      <div class="flex flex-col" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
        <header class="border-b border-[var(--color-border)] px-5 py-4">
          <span id="{listboxId}-heading" class="text-sm font-semibold text-[var(--color-text-primary)]">{label}</span>
        </header>

        <div
          bind:this={listboxEl}
          id={listboxId}
          role="listbox"
          aria-labelledby="{listboxId}-heading"
          tabindex="-1"
          class="max-h-[70svh] overflow-y-auto px-2 py-2"
          onkeydown={handleListboxKeydown}
        >
          {#if hasGroups}
            {#each groups as group}
              <div role="group" aria-labelledby="{listboxId}-g-{slug(group)}">
                <div id="{listboxId}-g-{slug(group)}" class="sticky top-0 bg-[var(--color-surface-card)] px-4 py-2 text-2xs font-bold uppercase tracking-[0.18em]" style="color: {accentColor}">
                  {group}
                </div>
                {#each options.filter(o => o.group === group) as option, localIdx (option.value)}
                  <OptionButton ... />
                {/each}
              </div>
            {/each}
          {:else}
            {#each options as option, idx (option.value)}
              <OptionButton ... />
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </dialog>
</div>

<style>
  .picker-dialog {
    margin: auto;
    width: min(32rem, 100vw);
    max-width: 32rem;
    border: 0;
    padding: 0;
  }
  .picker-dialog::backdrop {
    background: var(--color-scrim);
  }
  @media (max-width: 640px) {
    .picker-dialog {
      /* Mobile: fill width, dock near bottom for one-handed reach */
      margin: auto auto 0 auto;
      width: 100vw;
      max-width: 100vw;
      border-radius: 1rem 1rem 0 0;
    }
  }
</style>
```

### Keyboard handling (port from pert-calc, simplified — no search branch)
- **ArrowDown**: `focusedIndex = min(focusedIndex+1, options.length-1)`, call `focusOption()`
- **ArrowUp**: `focusedIndex = max(focusedIndex-1, 0)`, call `focusOption()`
- **Home**: `focusedIndex = 0`
- **End**: `focusedIndex = options.length-1`
- **Enter / Space** (on focused option button): native click fires → `select(option.value)`
- **Escape**: native `<dialog>` closes on Esc — the `close` event listener restores focus
- **Typeahead**: NOT in v1 (YAGNI). Optional follow-up.

### Focus model
- `openPicker()` → set `open = true`, compute `focusedIndex` from current `value` (fallback `0`), `dialog.showModal()`, `await tick()`, `focusOption(focusedIndex)`
- `dialog` `close` event → `open = false`, `focusedIndex = -1`, `triggerBtn?.focus()`
- Clicking an option calls `select(v)` → sets `value`, calls `dialog.close()` → `close` event handles focus restoration
- Clicking the backdrop (`e.target === dialog`) calls `dialog.close()`

### Grouping semantics (PICK-03)
- Groups derived from `[...new Set(options.map(o => o.group).filter(Boolean))]`
- Preserve original ordering (which is how the current bits-ui branch does it)
- Each group wrapped in a `role="group"` with `aria-labelledby` pointing at the sticky heading
- `focusedIndex` is the **flat** index across all options (not per-group) — the `filteredOptions = options` flat array is the source of truth for keyboard nav, but the rendered order must match flat order. Simplest: render groups by iterating `options` once and emitting a sticky heading whenever `option.group !== prevGroup`. This keeps keyboard order == DOM order == flat `options` order and avoids index mapping bugs.

## Test Migration Strategy

### Existing tests that touch SelectPicker (via FortificationCalculator)

`src/lib/fortification/FortificationCalculator.test.ts` — MUST CONTINUE TO PASS UNCHANGED:

| Test | Assertion | New picker must... |
|------|-----------|--------------------|
| UI-01 | `getByRole('button', { name: 'Base' })`, etc. for 4 labels | Keep `<button>` + `aria-labelledby` → `<span>{label}</span>` association |
| UI-03 (non-HMF) | `screen.queryByText(/^Packets$/)` is null when closed | **Wrap option list in `{#if open}`** so closed state has no "Packets" text node in DOM |
| UI-03 (HMF) | `unitTrigger.textContent.toContain('Packets')` | Trigger's visible text must show selected label |
| UI-03 (transition) | `within(hero).getByText('Teaspoons')` | Reactivity on `value` prop via `$bindable` |
| UI-04 | `document.querySelectorAll('[data-select-trigger]').length === 4` | Trigger `<button>` must have `data-select-trigger` attribute |
| UI-05 | innerHTML contains `var(--color-` and `text-[var(--color-text-(primary\|secondary\|tertiary))]` | Use token classes, not hardcoded colors |

### New tests for `SelectPicker.test.ts` (create this file)

Colocated per project convention [VERIFIED: memory/MEMORY.md — test colocation]. Use `@testing-library/svelte` + `vitest` (already present).

Recommended coverage:
1. Renders label, trigger, placeholder when value is empty
2. Trigger click opens dialog (`dialog.open === true`), first option receives focus
3. ArrowDown / ArrowUp move `aria-selected` focus across options
4. Home / End jump to first / last
5. Enter on focused option sets `value` and closes dialog
6. Escape closes dialog and restores focus to trigger (`expect(document.activeElement).toBe(triggerBtn)`)
7. Backdrop click closes dialog
8. Grouped options render a `role="group"` per group with correct headings
9. Selected state: the option matching `value` has `aria-selected="true"` and the check icon
10. Closed-state DOM contract: after render without opening, `queryByRole('option')` is null (guarantees the FortificationCalculator UI-03 contract)
11. Trigger has `data-select-trigger` attribute

**jsdom caveat:** jsdom does not fully implement `HTMLDialogElement.showModal()` across all versions. Verify `jsdom ^29` support before writing tests [VERIFIED needed: run `pnpm test -- --run` on a stub]. Fallback: polyfill `dialog.showModal` in `vitest.setup.ts` with a minimal shim that sets `open = true`. This is a known jsdom limitation [CITED: https://github.com/jsdom/jsdom/issues/3294].

**Wave 0 gap:** If jsdom lacks `showModal`, add `src/test-setup.ts` (or extend the existing setup file) with a polyfill:
```js
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); this.dispatchEvent(new Event('open')); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
}
```

## Tailwind 4 / OKLCH Tokens

**Available tokens** [VERIFIED: `src/app.css`]:

| CSS var | Use in picker |
|---------|--------------|
| `--color-surface` | Page background (not used by picker directly) |
| `--color-surface-card` | Dialog body background, trigger background |
| `--color-surface-alt` | Hover / selected option background |
| `--color-border` | Trigger border, dialog internal dividers |
| `--color-text-primary` | Trigger text, option text (unselected) |
| `--color-text-secondary` | Label text above trigger |
| `--color-text-tertiary` | Chevron icon, placeholder text |
| `--color-accent` | Hover border, focus-visible outline, selected check |
| `--color-accent-light` | (Available; optional secondary highlight) |

**Tokens that DO NOT exist** — do not reference:
- `--color-border-subtle` (pert-calc uses this; does not exist here → use `--color-border`)
- `--color-placeholder` (pert-calc uses `text-placeholder` class; does not exist → use `text-[var(--color-text-tertiary)]`)
- `--color-scrim` (does not exist yet — **add it** for the `::backdrop`)

**Usage syntax** [VERIFIED from existing codebase]:
- Bracket form: `class="text-[var(--color-text-primary)] bg-[var(--color-surface-card)] border-[var(--color-border)]"`
- Not utility form (`text-primary`) — project does not alias utilities in the same way pert-calc does

**To add to `src/app.css`:**
```css
:root {
  --color-scrim: oklch(18% 0.012 230 / 0.55);
}
.dark, [data-theme="dark"] {
  --color-scrim: oklch(8% 0.012 240 / 0.70);
}
```

## Dialog Accessibility Patterns [HIGH confidence]

Native `<dialog>.showModal()` behavior [CITED: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal]:

| Feature | Provided by `showModal()` |
|---------|---------------------------|
| Focus trap | YES — all background content is `inert`; Tab cycles only within dialog |
| Esc to close | YES — fires `cancel` then `close` event |
| Top layer stacking | YES — ignores `z-index` and parent `overflow`, `transform` |
| Backdrop pseudo-element | YES — `::backdrop` stylable |
| Background scroll lock | YES — body becomes inert/non-scrollable during modal display |
| `aria-modal="true"` | Implicit while in modal mode [CITED: https://w3c.github.io/aria/#dialog] |
| Focus restoration on close | NO — must be done manually via `close` event listener |

**What we must add on top:**
- `aria-labelledby` on `<dialog>` pointing at the visible heading id
- `role="listbox"` on the scroll container (not on `<dialog>` itself — `<dialog>` has implicit `dialog` role)
- `role="option"` + `aria-selected` on each option button
- Roving tabindex (only focused option has `tabindex=0`; the rest have `-1`)
- Manual focus restoration to trigger on `close` event
- Backdrop click dismissal (native `<dialog>` does not do this by default)

**Browser support** [CITED: https://caniuse.com/dialog]:
- `<dialog>` + `showModal()`: Chrome 37+, Firefox 98+, Safari 15.4+ — **baseline widely available** as of 2022
- `::backdrop`: same support
- PWA target (mobile Safari iOS 15.4+, Chrome Android): all supported
- `::backdrop` CSS variable inheritance from originating element: supported in modern engines [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop]

## bits-ui Removal Verification (PICK-06)

**Grep for `bits-ui` in `src/`** [VERIFIED]:
```
src/lib/shared/components/SelectPicker.svelte:2: import { Select } from 'bits-ui';       ← will be removed
src/lib/shared/components/AboutSheet.svelte:2:  import { Dialog } from 'bits-ui';        ← STILL USED
src/lib/shared/components/DisclaimerModal.svelte:2: import { Dialog } from 'bits-ui';    ← STILL USED
```

**Conclusion:** `bits-ui` **cannot be removed in Phase 12**. Two other components (`AboutSheet`, `DisclaimerModal`) use `bits-ui` `Dialog`. PICK-06 should be:

**Option A (RECOMMENDED)** — Planner re-scopes PICK-06 as:
> Verify no `bits-ui` `Select` imports remain; `bits-ui` itself stays as a dependency because `Dialog` is still consumed by `AboutSheet` and `DisclaimerModal`. Full removal deferred to a future phase that also ports those dialogs.

**Option B** — Expand Phase 12 scope to also port `AboutSheet` and `DisclaimerModal` to native `<dialog>`. This roughly doubles the phase work and is OUT of the stated phase goal ("Shared SelectPicker Rewrite"). Flag to user.

**Recommendation:** Option A. The discuss-phase / planner should surface this to the user and confirm. Document the deferral in STATE.md decisions.

**Verification task for the plan:** After the rewrite, run `grep -rn "from 'bits-ui'" src/` — should return exactly 2 matches (`AboutSheet.svelte`, `DisclaimerModal.svelte`). Add this as a verification step.

## Common Pitfalls

### Pitfall 1: jsdom does not implement `HTMLDialogElement.showModal`
**What goes wrong:** Unit tests that call `dialog.showModal()` throw or silently no-op; `dialog.open` never becomes true.
**Why:** jsdom's dialog support is partial — `showModal` is commonly unimplemented depending on version [CITED: https://github.com/jsdom/jsdom/issues/3294].
**Fix:** Polyfill in vitest setup (see Test Migration section).

### Pitfall 2: `::backdrop` styled with hardcoded color violates PICK-04
**What goes wrong:** Pert-calc references `rgba(15,23,42,0.65)` which is not an OKLCH token. UI-05 style test would fail.
**Fix:** Define `--color-scrim` in `app.css` and reference via `var(--color-scrim)` in `::backdrop`.

### Pitfall 3: Option list present in DOM when closed breaks UI-03 test
**What goes wrong:** `queryByText(/^Packets$/)` returns a node because the dialog content renders to the DOM even when closed.
**Fix:** Wrap the option list in `{#if open}` so closed state has no option text nodes.

### Pitfall 4: Global CSS rule `button { min-h: 48px }` conflicts with small buttons
**What goes wrong:** The global `button, select, input { @apply min-h-[48px]; }` rule in `src/app.css` line 121 means every option button is already 48px minimum. Good for PICK-05, but confirm the sticky group header is NOT a `<button>` (it's a `<div>`) so it doesn't get 48px.
**Fix:** Group headings are `<div>` — already handled.

### Pitfall 5: iOS Safari `<dialog>` positioning
**What goes wrong:** On iOS 15.4+ `showModal()` works but the default `margin: auto` doesn't always center on small viewports with virtual keyboard open.
**Fix:** Mobile media query overrides margin to `auto auto 0 auto` (dock to bottom) and `width: 100vw`. Safe-area via `padding-bottom: env(safe-area-inset-bottom, 0px)` on inner container [CITED: https://webkit.org/blog/7929/designing-websites-for-iphone-x/].

### Pitfall 6: Backdrop click ALSO fires on child clicks in some browsers
**What goes wrong:** `onclick={handleDialogClick}` with `event.target === dialog` works if clicks bubble correctly. On some mobile browsers the `event.target` can be the inner container. 
**Fix:** Explicitly structure the dialog as `<dialog onclick={handleDialog}> <div class="picker-dialog-inner" onclick|stopPropagation>...</div></dialog>`. Standard pattern, works everywhere.

### Pitfall 7: Focus restoration race with `close` event
**What goes wrong:** Calling `triggerBtn.focus()` inside the `close` handler before Svelte finishes updating can cause a flash of focus elsewhere.
**Fix:** `close` event fires after the dialog is already closed in the same microtask → `triggerBtn.focus()` is safe. Pert-calc does exactly this and it works.

### Pitfall 8: Calculator accent color context — what if caller isn't inside a calculator?
**What goes wrong:** `getCalculatorContext()` throws if there's no context ancestor.
**Fix:** Make the context read optional — wrap in try/catch or provide a default. Check how the current file handles it (currently it does NOT guard — it just calls `getCalculatorContext()`). Since the only consumer is inside FortificationCalculator which provides the context, this works today. Keep same behavior to avoid churn, but note the coupling.

## Code Examples

### Derive groups once for iteration (preserving order)
```ts
// Source: adapt from current SelectPicker.svelte lines 22-25
const groups = $derived(
  [...new Set(options.map(o => o.group).filter(Boolean))] as string[]
);
const hasGroups = $derived(groups.length > 0);
```

### Focus roving helper
```ts
// Source: port from pert-calculator/src/lib/components/SelectPicker.svelte lines 81-84
function focusOption(index: number) {
  const el = listboxEl?.querySelector<HTMLButtonElement>(`[data-index="${index}"]`);
  el?.focus();
}
```

### Dialog close event → focus restore
```ts
// Source: port from pert-calculator/src/lib/components/SelectPicker.svelte lines 142-155
onMount(() => {
  const handleClose = () => {
    open = false;
    focusedIndex = -1;
    triggerBtn?.focus();
  };
  dialog?.addEventListener('close', handleClose);
  return () => dialog?.removeEventListener('close', handleClose);
});
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Svelte 5 runes | whole phase | ✓ | 5.54.0 | — |
| `<dialog>` DOM API | runtime | ✓ | Chrome/FF/Safari 15.4+ | — |
| jsdom `showModal` | unit tests | ✗ (likely partial) | jsdom 29.0.1 | Polyfill in setup file |
| `@lucide/svelte` icons | trigger chevron, option check | ✓ | 1.7.0 | — |
| Vitest + @testing-library/svelte | tests | ✓ | 4.1.2 / 5.3.1 | — |

**Missing dependencies with fallback:** jsdom dialog polyfill (trivial shim, ~10 lines).
**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + @testing-library/svelte 5.3.1 |
| Config file | `vite.config.ts` (vitest configured inline — verify during Wave 0) |
| Quick run command | `pnpm test:run -- src/lib/shared/components/SelectPicker.test.ts src/lib/fortification/FortificationCalculator.test.ts` |
| Full suite command | `pnpm test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PICK-01 | Native `<dialog>` mounted, no bits-ui Select imports in SelectPicker.svelte | unit + grep | `pnpm test:run SelectPicker` + `grep "bits-ui" src/lib/shared/components/SelectPicker.svelte` | ❌ Wave 0 (new test file) |
| PICK-02 | Arrow/Home/End/Enter/Esc keyboard nav; trigger refocus on close | unit | `pnpm test:run SelectPicker -t keyboard` | ❌ Wave 0 |
| PICK-03 | Grouped options render with group role and headings | unit | `pnpm test:run SelectPicker -t grouped` | ❌ Wave 0 |
| PICK-04 | innerHTML uses `var(--color-...)` tokens, no hex/rgb | unit (regex) | `pnpm test:run SelectPicker -t tokens` + existing FortificationCalculator UI-05 | ❌ Wave 0 |
| PICK-05 | Mobile dialog fills width, option buttons ≥48px, safe-area respected | manual (Playwright devtools) + CSS inspection | Manual + `grep "env(safe-area" src/lib/shared/components/SelectPicker.svelte` | ⚠ manual visual check in dev server |
| PICK-06 | No `bits-ui` `Select` import anywhere; `bits-ui` remains only for `Dialog` | grep verification | `grep -rn "from 'bits-ui'" src/` returns exactly 2 matches, both `Dialog` | ✅ grep |

### Sampling Rate
- **Per task commit:** `pnpm test:run -- src/lib/shared/components/SelectPicker.test.ts src/lib/fortification/FortificationCalculator.test.ts`
- **Per wave merge:** `pnpm test:run` (full suite)
- **Phase gate:** Full suite green + manual mobile visual check in dev server + Playwright smoke for keyboard nav if time permits

### Wave 0 Gaps
- [ ] `src/lib/shared/components/SelectPicker.test.ts` — new file, covers PICK-01/02/03/04 behavior
- [ ] jsdom polyfill for `HTMLDialogElement.showModal`/`close` — add to existing vitest setup OR create `vitest.setup.ts` if absent (verify during Wave 0)
- [ ] `src/app.css` — add `--color-scrim` token in light and dark blocks

## Implementation Order Recommendation

**Single-wave, single-plan phase.** The rewrite is atomic and the surface area is small:

### Plan 12-01: Rewrite SelectPicker to native `<dialog>` (atomic drop-in)

**Wave 0 (prep):**
1. Add `--color-scrim` tokens to `src/app.css` (light + dark)
2. Confirm / add jsdom `HTMLDialogElement.showModal` polyfill in vitest setup
3. Create empty `src/lib/shared/components/SelectPicker.test.ts` scaffolding

**Wave 1 (rewrite):**
4. Rewrite `src/lib/shared/components/SelectPicker.svelte`:
   - Remove all `bits-ui` imports
   - Preserve public props (`label`, `value`, `options`, `placeholder`, `class`)
   - Implement `<button data-select-trigger aria-labelledby={labelId}>` + native `<dialog>`
   - Keyboard handlers, focus restoration, backdrop click, grouping, accent context read
   - Mobile safe-area padding, `{#if open}` content guard
5. Write the new `SelectPicker.test.ts` (11 tests listed above)
6. Run `pnpm test:run` — **FortificationCalculator tests must pass unchanged**. If UI-03 fails due to DOM content presence, confirm `{#if open}` is in place.

**Wave 2 (verify + cleanup):**
7. `grep -rn "from 'bits-ui'" src/` — verify only `AboutSheet.svelte` and `DisclaimerModal.svelte` match
8. Manual visual QA in `pnpm dev`: desktop + mobile viewport, light + dark themes, open each of the 4 pickers in Fortification, keyboard nav, Esc, backdrop click
9. Update STATE.md decisions: "bits-ui Dialog removal deferred — Phase 12 only replaces Select"
10. Commit

**No need for multi-plan split.** The component is self-contained, the consumer count is one, and the tests form a clean contract. Atomic swap is safer than a staged migration.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modal divs with manual focus trap + aria-modal | Native `<dialog>` + `showModal()` | Safari 15.4 (Mar 2022) made it baseline | No need for focus-trap libraries, less JS, free a11y |
| React/Svelte portal helpers | `<dialog>` top-layer rendering | Same | No portal plumbing needed |
| bits-ui / Radix-style compound components | Single-file native `<dialog>` | N/A — a size/control tradeoff | More code ownership, fewer abstractions, better token control |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getCalculatorContext()` is always available in SelectPicker's callsites (FortificationCalculator provides it) | Replacement Strategy | LOW — would throw only if used outside a calculator; no such use today |
| A2 | jsdom 29 lacks full `HTMLDialogElement.showModal` | Pitfalls / Wave 0 | LOW — if it works, polyfill is a no-op. Verify first thing in Wave 0 |
| A3 | `::backdrop` inherits CSS custom properties from the originating `<dialog>` in all target engines | Tokens | LOW — spec-compliant modern behavior; fallback is a hardcoded OKLCH literal |
| A4 | bits-ui emits `data-select-trigger` attribute that tests depend on | Current Implementation Analysis | VERIFIED via source read — confirmed A4 is factual |
| A5 | `Option A` for PICK-06 (defer full `bits-ui` removal) is acceptable to the user | bits-ui Removal | MEDIUM — user stated "remove if no other consumer remains" which matches Option A, but the discuss-phase should explicitly confirm |
| A6 | No `searchable` prop is needed in v1 (≤24 options per picker) | Replacement Strategy | LOW — can be added later without breaking the public API |
| A7 | The existing `FortificationCalculator.test.ts` UI-03 test asserting `queryByText(/^Packets$/) === null` on closed picker will require the `{#if open}` guard | Test Migration | MEDIUM — confirm behavior on first test run after rewrite |

## Open Questions

1. **Is Option A for PICK-06 acceptable?** — Defer `bits-ui` removal until `Dialog` consumers are also ported.
   - What we know: `bits-ui` is used by `AboutSheet` + `DisclaimerModal` via `Dialog` import, both out of phase scope
   - What's unclear: Whether the user wants Phase 12 to ALSO port those dialogs
   - Recommendation: Surface in discuss-phase; recommend Option A (defer)

2. **Should `getCalculatorContext()` coupling stay?** — Current SelectPicker reads calculator accent color for group headings and check icons. Is this aesthetic still desired with `.impeccable.md`, or should headings always use `--color-text-tertiary` / `--color-accent`?
   - What we know: Current tests don't check header color; visual parity with v1.3 is likely expected
   - Recommendation: Keep the context read to avoid surprise visual churn; planner can flip to tokens if `.impeccable.md` review says so

3. **Playwright e2e for keyboard nav?** — Should Phase 12 add a Playwright test that opens a real browser and exercises Arrow/Enter/Esc, or is jsdom unit coverage sufficient?
   - Recommendation: Unit coverage is sufficient for Phase 12. A real-browser keyboard sweep lands in Phase 17 (A11Y-03).

## Sources

### Primary (HIGH confidence)
- `src/lib/shared/components/SelectPicker.svelte` — current implementation, read in full
- `/mnt/data/src/pert-calculator/src/lib/components/SelectPicker.svelte` — reference pattern, read in full
- `src/lib/fortification/FortificationCalculator.svelte` — consumer, read in full
- `src/lib/fortification/FortificationCalculator.test.ts` — test contract, read in full
- `src/app.css` — token definitions, read in full
- `node_modules/bits-ui/dist/bits/select/select.svelte.js` — confirmed `data-select-trigger` attribute source
- `.planning/REQUIREMENTS.md` — PICK-01..06 definitions
- `.planning/STATE.md` — locked decisions
- `.planning/ROADMAP.md` — Phase 12 success criteria
- `.impeccable.md` — design contract
- `CLAUDE.md` — project instructions

### Secondary (MEDIUM confidence, cited)
- MDN `HTMLDialogElement.showModal` — https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
- MDN `::backdrop` — https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop
- caniuse `<dialog>` — https://caniuse.com/dialog
- jsdom dialog issue — https://github.com/jsdom/jsdom/issues/3294
- WebKit iPhone X safe-area — https://webkit.org/blog/7929/designing-websites-for-iphone-x/

### Tertiary
- None — all claims either verified in-repo or cited from authoritative sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nothing added, existing verified
- Architecture (native `<dialog>` + port from pert-calc): HIGH — reference implementation read, browser support verified
- Pitfalls: HIGH — jsdom and `::backdrop` caveats cited; `{#if open}` DOM contract derived directly from test source
- bits-ui removal status: HIGH — exhaustive grep completed, confirms PICK-06 is blocked by `Dialog` consumers

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable domain; revisit only if `bits-ui` Dialog consumers are ported sooner)

## Project Constraints (from CLAUDE.md)

- **Tech stack locked:** SvelteKit 2 + Svelte 5 runes + Tailwind 4 + Vite + pnpm — no additions
- **No new UI libraries:** Custom components only; do not add shadcn, flowbite, daisyUI
- **Svelte 5 runes:** `$state`, `$derived`, `$effect`, `$bindable`, `$props` — no legacy `$:` reactivity
- **Mobile-first PWA:** 48px touch targets, safe-area padding, one-hand reachability
- **WCAG 2.1 AA:** Visible focus, ARIA labels, keyboard nav mandatory
- **OKLCH tokens only:** No hardcoded hex/rgb colors anywhere in component or style blocks
- **Test colocation:** New `SelectPicker.test.ts` colocated next to `SelectPicker.svelte`, not in `__tests__/`
- **GSD workflow enforcement:** All file edits must go through a GSD command
- **Code reuse:** Port the pattern from pert-calculator, don't rewrite from scratch
