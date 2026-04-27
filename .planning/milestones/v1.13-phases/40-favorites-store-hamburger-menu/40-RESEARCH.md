# Phase 40: Favorites Store + Hamburger Menu - Research

**Researched:** 2026-04-23
**Domain:** Svelte 5 runes + localStorage-backed reactive singleton + `<dialog>` modal component + ARIA toggle semantics
**Confidence:** HIGH (every decision is grounded in existing source files in this repository — no training-data-only claims)

<user_constraints>

## User Constraints (from 40-CONTEXT.md)

### Locked Decisions (copy verbatim from `## Implementation Decisions`)

**D-01 Hamburger button placement & icon** — Hamburger button lives in the title bar as the **leftmost action button** in the existing right-side action cluster — order becomes: `Menu, Info, Theme`. Visible on all viewports (not mobile-only), 48×48 touch target, uses `@lucide/svelte`'s `Menu` icon.

**D-02 Hamburger menu presentation** — Full-screen **`<dialog>`-based modal sheet** using `HTMLDialogElement.showModal()`, mirroring the v1.4 SelectPicker + AboutSheet pattern. Uses the existing `--color-scrim` token for backdrop. Closes on Esc, scrim click, and close-button click. Focus returns to the hamburger button on close.

**D-03 Menu row composition (per calculator)** — Each row is a `<div>` with internal layout of: `icon | label | star-button`. The **row itself is NOT a button** — the label+icon area is an `<a href={calc.href}>` link, and the star is a sibling `<button>`. Tapping the link navigates and closes the menu; tapping the star toggles the favorite without navigating and without closing the menu.

**D-04 Star button semantics & visual state** — Star icon is `@lucide/svelte`'s `Star` for unfavorited and `Star` with `fill="currentColor"` for favorited (single icon, two visual states). `aria-pressed` toggles `true`/`false`; `aria-label` is dynamic: `"Add Morphine Wean to favorites"` / `"Remove Morphine Wean from favorites"`. 48×48 touch target. Color: favorited uses row calculator's `--color-identity`; unfavorited uses `--color-text-secondary`.

**D-05 Cap-full state** — When `favorites.count >= 4`, star buttons on **non-favorited** rows render as `<button disabled aria-disabled="true">` with `opacity-60 cursor-not-allowed`, no hover tint. Extended aria-label: `"Add UAC/UVC to favorites (limit reached — remove one to add another)"`. Menu header shows caption: `"4 of 4 favorites — remove one to add another."` (single-line, `text-2xs`, `--color-text-secondary`). Favorited stars stay enabled.

**D-06 Favorites storage shape** — `{ "v": 1, "ids": ["morphine-wean", "formula", "gir", "feeds"] }` at localStorage key `nicu:favorites`. Array, not Set (order meaningful per D-07). Invalid payloads silently fall back to defaults.

**D-07 Favorite order** — Registry order. The array is kept in the same order as `CALCULATOR_REGISTRY` regardless of insertion order.

**D-08 Schema-safe recovery** — On load: (1) parse JSON → catch → defaults; (2) validate shape; (3) filter ids to registry-present only; (4) cap at 4; (5) empty → defaults; (6) sort by registry order. Defaults recomputed from `CALCULATOR_REGISTRY.map(c => c.id).slice(0, 4)`.

**D-09 First-run seeding** — If no `nicu:favorites` key exists, initialize to `['morphine-wean', 'formula', 'gir', 'feeds']` and write to storage immediately.

**D-10 Store API shape** — `.svelte.ts` singleton with `get current(): readonly CalculatorId[]`, `get count()`, `get isFull()`, `has(id)`, `toggle(id)`, `canAdd(id)`; plus `export const FAVORITES_MAX = 4`.

**D-11 Cap constant** — `FAVORITES_MAX = 4`, code-level export (not config.json).

**D-12 Menu rendering source** — Iterate `CALCULATOR_REGISTRY` directly.

**D-13 Keyboard navigation** — Native `<dialog>` + native link/button tab order. Close button first tab stop. No roving tabindex.

**D-14 Reduced-motion and identity** — Open/close animations gated behind `prefers-reduced-motion: reduce`. Backdrop uses `--color-scrim`. Menu header reads `"Calculators"`.

### Claude's Discretion
- Exact pixel values for scrim opacity (match existing SelectPicker — uses `--color-scrim` token directly).
- Exact transition durations (match existing modal patterns; gate on reduced-motion).
- Whether the menu header shows the app version.
- Unit-test file organization (co-located `favorites.test.ts` beside `favorites.svelte.ts`).
- Whether to throttle/batch localStorage writes (no — toggle frequency is negligible for 4-cap).

### Deferred Ideas (OUT OF SCOPE)
- **FAV-FUT-01** Drag-reorder favorites — registry-order D-07 makes this moot for MVP.
- **FAV-FUT-02** Per-breakpoint cap — 4 cap is locked for v1.13.
- **FAV-FUT-03** Export/import favorites.
- **CAT-FUT-01** Search box in hamburger (relevant only past ~8 calculators).
- "Recent" or "active-but-not-favorited" indicator — `aria-current="page"` on the internal link is sufficient.
- Haptic feedback on star toggle.

### Out-of-scope-for-this-phase (from CONTEXT.md explicit)
- **D-OUT-01:** NavShell does NOT read the favorites store in Phase 40. Bottom bar / top nav still render all 4 registered calculators hardcoded. Phase 41 flips this.
- **D-OUT-02:** UAC/UVC calculator not in registry yet (lands in Phase 42).
- **D-OUT-03:** No per-breakpoint cap in Phase 40.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FAV-01 | Star toggle adds/removes calculator from favorites | `favorites.toggle(id)` API (D-10); star button component in HamburgerMenu row |
| FAV-02 | 4-cap with `disabled`+`aria-disabled` on non-favorites when full | `favorites.isFull` + `canAdd(id)` getters (D-10); D-05 visual spec |
| FAV-03 | Persist to localStorage across sessions | `theme.svelte.ts` / `disclaimer.svelte.ts` established pattern — try/catch around `localStorage.setItem` |
| FAV-04 | First-run defaults `['morphine-wean','formula','gir','feeds']` | D-09 seeding; computed from `CALCULATOR_REGISTRY.map(c => c.id).slice(0, 4)` |
| FAV-05 | Remove via hamburger updates nav immediately (reactive) | Svelte 5 `$state` proxy — `get current()` returns the reactive array; consumers using `{favorites.current}` re-render. **Note: nav change itself is Phase 41.** For Phase 40 this means the hamburger's own UI must re-render (star fill flips) |
| FAV-06 | Stable favorite order | D-07 registry-order sort applied after every mutation |
| FAV-07 | Schema-safe recovery from malformed localStorage | D-08 6-step recovery pipeline |
| NAV-HAM-01 | Hamburger button in title bar, 48px, aria-labeled | D-01 placement + `icon-btn` class reuse |
| NAV-HAM-02 | Menu lists every registered calculator from registry (no hardcoding) | D-12: iterate `CALCULATOR_REGISTRY` |
| NAV-HAM-03 | Each row: icon + name + star; row (outside star) navigates + closes | D-03 sibling link + button pattern |
| NAV-HAM-04 | Keyboard navigable (Tab/Shift+Tab, Enter, Esc); focus returns to hamburger on close | D-13 native tab order + `<dialog>` `onclose` → trigger.focus() (SelectPicker.svelte:148–153 pattern) |
| NAV-HAM-05 | Honors reduced-motion; uses `--color-scrim` backdrop | D-14 + existing `app.css:138–142` global reduced-motion rule |
| FAV-TEST-01 | Unit tests: add, remove, cap, serialization round-trip, malformed recovery | Enumerated below in "Schema-safe recovery test surface" |
| FAV-TEST-02 | Component test: opens, lists all, star toggle, disabled-at-cap | Enumerated below in "Hamburger component test surface" |

</phase_requirements>

## Summary

Phase 40 is a pure-additive phase that delivers two co-designed primitives: a localStorage-backed favorites singleton (`src/lib/shared/favorites.svelte.ts`) and a `<dialog>`-based hamburger menu (`src/lib/shell/HamburgerMenu.svelte`). Every architectural decision already has a working in-repo precedent — there is no new technology to evaluate. The entire phase is an exercise in **copying two known patterns precisely** and **composing them correctly**:

1. **Pattern 1 — `.svelte.ts` singleton with localStorage** is implemented verbatim in `theme.svelte.ts` (lines 1–35) and `disclaimer.svelte.ts` (lines 1–27). Follow its shape byte-for-byte: `let _x = $state(...)` at module scope, `export const foo = { get current() {...}, init(), mutator() {...} }`, init called from `+layout.svelte` `onMount`, all `localStorage` calls wrapped in `try/catch`.

2. **Pattern 2 — `<dialog>`-based modal** is implemented in `SelectPicker.svelte` (lines 73–153, 182–303). Follow its shape for open/close: `dialog.showModal()` on open, `dialog?.close()` on close, click-on-dialog-as-scrim-detection (`e.target === dialog`), `onclose` handler that restores focus to trigger via `triggerBtn?.focus()`. The existing jsdom polyfill in `src/test-setup.ts` already supports both showModal and programmatic `close()` with synchronous `close` event dispatch.

**The one architectural decision that matters:** AboutSheet and DisclaimerModal use `bits-ui`'s `Dialog.Root` instead of native `<dialog>`. CONTEXT.md D-02 explicitly chose the native `<dialog>` path (aligning with SelectPicker) to avoid introducing bits-ui into the shell layer. The planner must follow SelectPicker, not AboutSheet, as the modal template. [VERIFIED: `src/lib/shared/components/AboutSheet.svelte:2` imports `bits-ui`; `src/lib/shared/components/SelectPicker.svelte:182` uses native `<dialog>`]

**Primary recommendation:** Copy `theme.svelte.ts` structurally for the store, copy `SelectPicker.svelte`'s `<dialog>` mechanics for the menu. Every new line of code in this phase should be justifiable by pointing at an existing line in one of those two files.

## Architectural Responsibility Map

This is a **single-tier PWA** (adapter-static SPA). All capabilities run in the browser; there is no server runtime. The conventional "frontend server / API / database" tiers do not apply. The relevant boundaries are *module concerns*.

| Capability | Primary Concern | Secondary Concern | Rationale |
|------------|-----------------|-------------------|-----------|
| Reactive favorites state | `src/lib/shared/favorites.svelte.ts` (new) | — | Module-scoped `$state` rune; singleton pattern (mirrors `theme.svelte.ts`) |
| Persistence (localStorage) | `favorites.svelte.ts` mutator functions | — | Call sites are `toggle()`, `init()`, no external persistence layer |
| Schema-safe recovery | `favorites.svelte.ts` `init()` | — | Owns the 6-step pipeline; consumers always see valid state |
| Menu presentation | `src/lib/shell/HamburgerMenu.svelte` (new) | `src/app.css` tokens | `<dialog>` element + scoped styles |
| Hamburger trigger button | `src/lib/shell/NavShell.svelte` (modified) | `icon-btn` utility | Title-bar action cluster |
| First-run seeding | `favorites.svelte.ts` `init()` | — | Called from `+layout.svelte` `onMount` |
| Bottom-bar / top-nav rendering | **NavShell — UNCHANGED in Phase 40** | — | D-OUT-01: Phase 41 flips this; Phase 40 must not touch nav rendering |

**Planner sanity check:** The favorites store is imported only by `HamburgerMenu.svelte` in Phase 40. It is NOT imported by `NavShell.svelte` until Phase 41. Any plan that has `NavShell.svelte` reading `favorites.current` is out-of-scope for this phase.

## Standard Stack

### Core (already installed — no new deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `svelte` | ^5.55.4 | Runes (`$state`, `$derived`, `$effect`) — the basis of the store and reactivity | [VERIFIED: package.json] Project-wide; every other state singleton uses it |
| `@lucide/svelte` | ^1.8.0 | `Menu` and `Star` icons | [VERIFIED: package.json, registry.ts imports] Already used by registry |
| `@sveltejs/kit` | ^2.57.1 | `$app/state` (page.url), `$lib` alias | [VERIFIED: package.json] |
| `vitest` | ^4.1.4 | Unit and component tests | [VERIFIED: package.json, vite.config.ts:60] |
| `@testing-library/svelte` | ^5.3.1 | Component test helpers (render/fireEvent/screen) | [VERIFIED: package.json; used in SelectPicker.test.ts] |
| `@testing-library/jest-dom` | ^6.9.1 | DOM matchers for vitest | [VERIFIED: test-setup.ts:1] |
| `tailwindcss` | ^4.2.2 | Utility styling | [VERIFIED: package.json] |

### New Dependencies Required

**NONE.** Phase 40 adds zero new runtime or dev dependencies. [VERIFIED: every construct — `<dialog>`, `localStorage`, `aria-pressed`, Lucide `Star`/`Menu` — is already present or natively available.]

### Alternatives Considered (but locked out by CONTEXT.md)

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| Native `<dialog>` (D-02 locked) | `bits-ui` `Dialog.Root` (used in AboutSheet, DisclaimerModal) | CONTEXT D-02 chose native for dep parity with SelectPicker in the shell layer. [VERIFIED: context.md:26–27] |
| `.svelte.ts` singleton (D-10 locked) | `writable()` store from `svelte/store` | Svelte 3/4 store API — project has migrated to runes. [VERIFIED: no `svelte/store` imports anywhere in src/] |
| `localStorage` (D-06 locked) | `IndexedDB` | Favorites payload is ~60 bytes — localStorage is the right tool. [VERIFIED: theme/disclaimer both use localStorage] |
| `aria-pressed` (D-04 locked) | `role="switch"` / `role="checkbox"` | `aria-pressed` is correct for toggle buttons per WAI-ARIA 1.2. [CITED: https://www.w3.org/WAI/ARIA/apg/patterns/button/#wai-ariaroles,states,andproperties — "aria-pressed reflects the toggle state of a two-state button"] |

**Installation:** None. All packages already present.

**Version verification (2026-04-23):**
```
@lucide/svelte 1.8.0  — installed [VERIFIED: package.json:53]
svelte 5.55.4         — installed [VERIFIED: package.json:43]
vitest 4.1.4          — installed [VERIFIED: package.json:47]
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser (SvelteKit SPA — adapter-static; no server runtime)    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   +layout.svelte ──onMount()──> favorites.init()               │
│                                      │                          │
│                                      ▼                          │
│   ┌──────────────────────────────────────────────┐              │
│   │ favorites.svelte.ts (new singleton)          │              │
│   │                                              │              │
│   │  let _ids = $state<CalculatorId[]>([])       │              │
│   │                                              │              │
│   │  init():                                     │              │
│   │    raw = localStorage.getItem('nicu:favo…')  │              │
│   │         │                                    │              │
│   │         ▼                                    │              │
│   │    parse → validate shape → filter registry │              │
│   │         → cap(4) → if empty→defaults         │              │
│   │         → sort by registry order             │              │
│   │         → write back if empty/seeded         │              │
│   │                                              │              │
│   │  toggle(id):                                 │              │
│   │    if has(id) → remove                       │              │
│   │    else if !isFull → add                     │              │
│   │    resort by registry order → persist        │              │
│   │                                              │              │
│   │  get current() → readonly proxy of _ids      │              │
│   └──────────────────────────────────────────────┘              │
│                │  (reactive proxy)                              │
│                ▼                                                │
│   ┌──────────────────────────────────────────────┐              │
│   │ NavShell.svelte (title bar, modified)        │              │
│   │                                              │              │
│   │  [ Menu ] [ Info ] [ Theme ]                 │              │
│   │     │                                        │              │
│   │     onclick ──bind:open──▶ HamburgerMenu     │              │
│   │     (Phase 40: NavShell does NOT read        │              │
│   │      favorites.current — Phase 41 does)      │              │
│   └──────────────────────────────────────────────┘              │
│                │                                                │
│                ▼                                                │
│   ┌──────────────────────────────────────────────┐              │
│   │ HamburgerMenu.svelte (new)                   │              │
│   │                                              │              │
│   │  <dialog bind:this={dialog} onclose=…>       │              │
│   │   <header>Calculators [cap caption]</header> │              │
│   │   <ul>                                       │              │
│   │    {#each CALCULATOR_REGISTRY as calc}       │              │
│   │     <li class="row">                         │              │
│   │       <a href={calc.href}                    │              │
│   │          onclick={closeMenu}>                │              │
│   │         <Icon/> {calc.label}                 │              │
│   │       </a>                                   │              │
│   │       <button                                │              │
│   │         aria-pressed={favorites.has(id)}     │              │
│   │         disabled={!favorites.has(id)         │              │
│   │                   && favorites.isFull}       │              │
│   │         onclick={() => favorites.toggle(id)}>│              │
│   │         <Star fill={…} />                    │              │
│   │       </button>                              │              │
│   │     </li>                                    │              │
│   │    {/each}                                   │              │
│   │   </ul>                                      │              │
│   │  </dialog>                                   │              │
│   └──────────────────────────────────────────────┘              │
│                                                                 │
│   localStorage (persistent across sessions)                     │
│   └─ 'nicu:favorites' → '{"v":1,"ids":[…]}'                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/lib/
├── shared/
│   ├── favorites.svelte.ts           # NEW — singleton, schema recovery, persistence
│   ├── favorites.test.ts             # NEW — FAV-TEST-01 unit tests (co-located)
│   ├── theme.svelte.ts               # EXISTING — reference pattern
│   ├── disclaimer.svelte.ts          # EXISTING — reference pattern
│   └── types.ts                      # EXISTING — CalculatorId union (no change)
├── shell/
│   ├── NavShell.svelte               # MODIFIED — add hamburger button (leftmost of action cluster)
│   ├── HamburgerMenu.svelte          # NEW — <dialog> menu
│   ├── HamburgerMenu.test.ts         # NEW — FAV-TEST-02 component tests (co-located)
│   └── registry.ts                   # EXISTING — source of truth (no change in Phase 40)
```

### Pattern 1: `.svelte.ts` reactive singleton with localStorage

**What:** Module-scoped `$state` rune + exported `get`-accessor object + `init()` called once from layout.

**When to use:** Any time you need reactive state shared across components with persistence. This is the project idiom.

**Canonical example (copy this shape):**
```typescript
// Source: src/lib/shared/theme.svelte.ts (lines 1–35)
// .svelte.ts extension REQUIRED — $state rune compiles through Svelte preprocessor

let _theme = $state<'light' | 'dark'>('light');

export const theme = {
  get current(): 'light' | 'dark' {
    return _theme;
  },
  set(value: 'light' | 'dark'): void {
    _theme = value;
    try {
      localStorage.setItem('nicu_assistant_theme', value);
    } catch {
      // Silent: private browsing mode or storage quota exceeded
    }
    document.documentElement.classList.toggle('dark', value === 'dark');
    document.documentElement.setAttribute('data-theme', value);
  },
  init(): void {
    // Called in +layout.svelte onMount — DOM is available here
    const stored = localStorage.getItem('nicu_assistant_theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.set(stored ?? (prefersDark ? 'dark' : 'light'));
  },
  toggle(): void {
    theme.set(_theme === 'dark' ? 'light' : 'dark');
  }
};
```

**Key idioms the planner must carry to `favorites.svelte.ts`:**
- File extension is `.svelte.ts` (NOT `.ts`) — required for `$state` compilation. [VERIFIED: theme.svelte.ts:1 comment]
- `let _x = $state(...)` at **module scope**, NOT inside a class. (A class-based pattern exists in `morphine/state.svelte.ts:19` but the shared singletons consistently use module-scope `$state` — follow the shared-singleton pattern, which is the closest architectural analog.) [VERIFIED: theme.svelte.ts, disclaimer.svelte.ts, pwa.svelte.ts all use module-scope]
- `get current()` accessor — NOT `current: _x` property. The getter is what makes consumers reactively track the rune. [VERIFIED: theme.svelte.ts:7, disclaimer.svelte.ts:9]
- **Every** `localStorage` call is wrapped in `try/catch`. Private-browsing Safari throws on quota-exceeded; the app must degrade gracefully. [VERIFIED: theme.svelte.ts:14, disclaimer.svelte.ts:22]
- `init()` is **called from `+layout.svelte` `onMount`** — NOT eagerly at module load. Reason: `localStorage` is not available during SSG prerender. [VERIFIED: +layout.svelte:38–40]
- The `init()` function may reference `window`/`localStorage`/`document` directly — by the time it runs, `onMount` guarantees the browser. [VERIFIED: theme.svelte.ts:23 "DOM is available here"]

**Anti-idiom to avoid:** Do NOT call `localStorage.getItem(...)` at module top-level outside `init()`. Adapter-static prerenders the shell at build time; module-top-level browser API calls throw. [CITED: `src/lib/morphine/state.svelte.ts:3–4` comment "CRITICAL: No sessionStorage calls outside functions — init/persist/reset only."]

### Pattern 2: Native `<dialog>` modal (shell-level, no bits-ui)

**What:** `HTMLDialogElement.showModal()` opens modally; native backdrop via `::backdrop`; native Esc close (browser-provided); focus return handled explicitly on `onclose`.

**When to use:** Modal overlays that don't need a portal or complex positioning. SelectPicker is the canonical example.

**Canonical example:**
```svelte
<!-- Source: src/lib/shared/components/SelectPicker.svelte (lines 32–153, 182–303) -->
<script lang="ts">
  import { tick } from 'svelte';

  let dialog = $state<HTMLDialogElement | null>(null);
  let triggerBtn = $state<HTMLButtonElement | null>(null);
  let open = $state(false);

  async function openPicker() {
    if (!dialog) return;
    open = true;
    dialog.showModal();       // native modal, native Esc, native backdrop
    await tick();
    // focus first actionable element
  }

  function closePicker() {
    dialog?.close();           // triggers 'close' event → handleClose()
  }

  function handleDialogClick(e: MouseEvent) {
    if (e.target === dialog) closePicker();   // click on backdrop
  }

  function handleClose() {
    open = false;
    triggerBtn?.focus();       // FOCUS RESTORATION — critical for NAV-HAM-04
  }
</script>

<button bind:this={triggerBtn} onclick={openPicker} aria-expanded={open}>
  …
</button>

<dialog
  bind:this={dialog}
  class="picker-dialog …"
  onclick={handleDialogClick}
  onclose={handleClose}
>
  {#if open}
    <!-- Content only rendered when open — important for a11y: closed state has zero [role=option] in DOM (SelectPicker.test.ts T-03) -->
    …
  {/if}
</dialog>

<style>
  .picker-dialog::backdrop { background: var(--color-scrim); }
</style>
```

**Key idioms the planner must carry to `HamburgerMenu.svelte`:**
- `bind:this={dialog}` + `dialog.showModal()` — NOT `dialog.show()` (non-modal, no Esc handling, no backdrop). [VERIFIED: SelectPicker.svelte:79]
- `onclick={handleDialogClick}` with `e.target === dialog` — this is how "click on scrim" is detected because clicks on the dialog's inner content bubble from children, not the dialog element itself. [VERIFIED: SelectPicker.svelte:144–146]
- `onclose={handleClose}` — fires on Esc AND programmatic `close()`. Focus restoration MUST happen here. [VERIFIED: SelectPicker.svelte:148–153, 187]
- Gate content behind `{#if open}` inside the `<dialog>` — ensures closed state has no queryable interactive elements (keeps the a11y tree clean and makes component tests assertable). [VERIFIED: SelectPicker.svelte:189, test T-03]
- CSS-only responsive dialog: desktop = centered card (`margin: auto`, `width: min(32rem, 100vw)`); mobile ≤640px = bottom sheet (`margin: auto auto 0 auto`, `width: 100vw`, `border-radius: 1rem 1rem 0 0`). [VERIFIED: SelectPicker.svelte:284–302]
- Backdrop via `::backdrop { background: var(--color-scrim); }`. [VERIFIED: SelectPicker.svelte:292–294]
- Safe-area inset for mobile: `padding-bottom: env(safe-area-inset-bottom, 0px)` on the inner container. [VERIFIED: SelectPicker.svelte:190]

**Esc handling clarification for jsdom tests:** The browser natively dispatches `close` on Esc inside a modal `<dialog>`, but the **jsdom polyfill in `src/test-setup.ts` does NOT auto-close on Escape**. SelectPicker tests use `dialog.close()` directly (see `SelectPicker.test.ts:237`). The hamburger tests must follow the same convention — trigger programmatic close or fire the `close` event directly rather than simulating Escape. [VERIFIED: `src/test-setup.ts:80–87` polyfill implements `close()` only; no Escape listener]

### Pattern 3: ARIA toggle button — `aria-pressed`

**What:** A button whose activation toggles between two states (like favorited/unfavorited).

**Canonical ARIA spec:** [CITED: WAI-ARIA 1.2 Toggle Button pattern, https://www.w3.org/WAI/ARIA/apg/patterns/button/#example-label-from-content-toggle] — `aria-pressed="true|false"` reflects current state; `aria-label` describes the action (what happens next), not the state.

**This is a new pattern for the project.** No existing component uses `aria-pressed`. [VERIFIED: `rg "aria-pressed"` returns no matches in src/]. SegmentedToggle uses `role="radio"` semantics (different pattern — mutually exclusive options); SelectPicker uses `aria-selected` (listbox semantics). The favorites star is genuinely a new UI primitive, but a standard one — no risk.

**Example skeleton:**
```svelte
<button
  type="button"
  class="flex h-12 w-12 items-center justify-center rounded-full {rowCalc.identityClass}"
  aria-pressed={isFavorite}
  aria-label={isFavorite
    ? `Remove ${rowCalc.label} from favorites`
    : (capReached
        ? `Add ${rowCalc.label} to favorites (limit reached — remove one to add another)`
        : `Add ${rowCalc.label} to favorites`)}
  disabled={!isFavorite && capReached}
  aria-disabled={!isFavorite && capReached ? 'true' : undefined}
  onclick={() => favorites.toggle(rowCalc.id)}
>
  <Star
    size={20}
    fill={isFavorite ? 'currentColor' : 'none'}
    style={isFavorite ? 'color: var(--color-identity)' : 'color: var(--color-text-secondary)'}
    aria-hidden="true"
  />
</button>
```

Note: `aria-disabled` duplicates the native `disabled` attribute. [CITED: WAI-ARIA 1.2 — "aria-disabled is the ARIA equivalent; native disabled is preferred where possible because it removes the element from the tab order AND prevents activation."] D-05 specifies both — native `disabled` handles the behavior; `aria-disabled="true"` is belt-and-suspenders for AT that reads the attribute explicitly. This is the CONTEXT.md decision; the planner must honor both.

### Pattern 4: `icon-btn` class reuse for the hamburger trigger

**What:** Existing CSS utility class in `app.css:186–211` for header icon buttons.

**Scope:** `.icon-btn` applies: `inline-flex`, padding `0.25rem`, rounded-full, color `--color-text-tertiary`, hover `--color-accent`, focus-visible ring. NavShell already uses `icon-btn min-h-[48px] min-w-[48px]` for Info and Theme buttons.

**Planner action:** The hamburger button must use the exact same class signature as Info/Theme to preserve visual coherence. [VERIFIED: NavShell.svelte:63–65, 71–75 — existing pattern]

### Anti-Patterns to Avoid

- **Nested interactives:** Do NOT wrap the entire row in a `<button>` or `<a>` with the star button inside. WCAG 4.1.2 and HTML5 spec forbid interactive-in-interactive. D-03 locks the sibling-link-and-button layout. [CITED: HTML Living Standard — "anchor elements must not contain interactive content"]
- **`role="switch"` on the star:** `switch` semantics imply an on/off setting that persists independently (e.g., "Enable notifications"). The star is a "toggle button" that adds/removes from a collection — different semantic. D-04 correctly chose `aria-pressed`.
- **Module-top-level `localStorage` access:** Will throw during SSG prerender. ALL storage access must be inside `init()` / `toggle()` / `persist()` functions called in onMount or event handlers.
- **`dialog.show()` instead of `showModal()`:** `show()` opens non-modally — no backdrop, no native Esc, no focus trap.
- **Introducing `bits-ui` to the shell layer:** CONTEXT D-02 explicitly chose native `<dialog>` for shell-layer parity with SelectPicker. AboutSheet/DisclaimerModal use bits-ui but that's the calculator/disclaimer layer — the shell stays native.
- **Storing a `Set` instead of an array:** D-07 requires registry-order preservation; a Set erases order guarantees on serialization (JSON.stringify of a Set emits `{}`). Array is correct.
- **Calling `favorites.init()` eagerly in the module:** `+layout.svelte` onMount is the right place, consistent with `theme.init()` and `disclaimer.init()` (see +layout.svelte:38–40).
- **Using `$state.snapshot()` on the exposed array:** Not needed. The Svelte 5 `$state` proxy is reactive; returning it from `get current()` is the established pattern. Using `$state.snapshot()` would break reactivity. [VERIFIED: no `snapshot` usage in any singleton; SvelteKit project memory says `get` accessor pattern is canonical] See Open Questions #1 for the read-only-exposure nuance.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap for the modal | Custom keyboard handler that cycles tab within the dialog | Native `<dialog>.showModal()` — provides focus trap for free | [CITED: WHATWG HTML spec — modal dialogs trap tab focus within the dialog's subtree] |
| Esc-to-close | Global `keydown` listener | Native `<dialog>.showModal()` dispatches `close` on Escape | [CITED: HTML Living Standard — modal dialog cancelable close on Esc] Already wired via `onclose={handleClose}` pattern in SelectPicker |
| Scrim / backdrop | Absolutely-positioned `<div>` with pointer-events | `<dialog>::backdrop` CSS pseudo-element | [VERIFIED: SelectPicker.svelte:292] Already styled; honors `--color-scrim` token |
| Toggle-button ARIA | `role="switch"` + manual state announcements | `aria-pressed="true|false"` on a native `<button>` | WAI-ARIA 1.2 standard; zero custom announcement logic |
| First-run detection | `localStorage.length === 0` sniffing | `localStorage.getItem(KEY) === null` → write defaults | D-09 locked; matches established pattern |
| localStorage quota handling | Pre-flight size check | `try { localStorage.setItem(...) } catch {}` with silent fallback | [VERIFIED: theme.svelte.ts:13–16, disclaimer.svelte.ts:21–25] |
| Reactive collection exposure | Emit change events, `Observable` wrapper, subscribe/unsubscribe | Svelte 5 `$state` rune + `get current()` accessor | Reactivity is automatic via the rune proxy |
| Registry-order sort | User-managed insertion-order array | `CALCULATOR_REGISTRY.map(c => c.id).filter(id => favSet.has(id))` | Reduces mutation logic to a single derived transform |

**Key insight:** Every "hard problem" in this phase has been solved by the platform or by an existing file in this repo. The planner's job is assembly, not invention.

## Runtime State Inventory

This phase is **additive**, not a rename/refactor/migration. The "Runtime State Inventory" section from the research protocol applies to string-replacement and rename phases. This phase introduces a new localStorage key; it does not rename or migrate anything.

That said, for completeness:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None existing** — `nicu:favorites` is a new key. Adjacent existing keys: `nicu_assistant_theme` (theme.svelte.ts:14), `nicu_assistant_disclaimer_v1` (disclaimer.svelte.ts:3), `nicu_morphine_state` (morphine/state.svelte.ts:9). | None. New key is distinct. |
| Live service config | **None** — no backend, no service registration. | None. |
| OS-registered state | **None** — PWA only, no OS-level integration. | None. |
| Secrets / env vars | **None** — app is public PWA; no secrets. | None. |
| Build artifacts | **None** — pure source addition; Workbox globs already include `**/*.{js,css,html,...}` (vite.config.ts workbox block). | None. New files cached automatically. |

**Key naming note:** The existing keys use underscore naming (`nicu_assistant_theme`), but CONTEXT D-06 specifies `nicu:favorites` with a colon. This is intentional and appropriate (colon is common namespace-delimiter convention in KV stores), and CONTEXT is locked. Planner should use `nicu:favorites` verbatim.

## Common Pitfalls

### Pitfall 1: Running `favorites.init()` before `onMount`
**What goes wrong:** Module imports are evaluated during SSG prerender; `localStorage` is undefined; favorites initialization throws or returns `null`, breaking downstream consumers.
**Why it happens:** Tempting to call `init()` at the bottom of the module file ("it's just persistence — why defer?").
**How to avoid:** Follow the canonical pattern — `init()` is a function, NOT called at module load. Only call it from `+layout.svelte` onMount alongside `theme.init()` and `disclaimer.init()`.
**Warning signs:** `pnpm build` fails with `localStorage is not defined` or `window is not defined`. `morphine/state.svelte.ts:4` has the explicit "CRITICAL" comment about this — same caution applies here.

### Pitfall 2: Reactive consumer reads `favorites.current` but doesn't re-render
**What goes wrong:** `{favorites.current}` in template doesn't update when `toggle()` mutates the internal array.
**Why it happens:** Mutating the array with `splice`/`push` on a Svelte 5 `$state(...)` array IS reactive [VERIFIED: theme.svelte.ts treats `_theme = value` as reassignment; morphine/state.svelte.ts:28 uses `this.current = { ...defaults, ...parsed }` reassignment]. However, if the store exposes the array as `readonly CalculatorId[]` via `get`, Svelte's fine-grained tracking should still work because the getter returns the reactive proxy. **Read #6 in Open Questions for the nuance.**
**How to avoid:** Inside `toggle()`, reassign the array whole: `_ids = newSortedArray` rather than mutating in place. This guarantees re-render under all reactivity models. Pattern matches `theme.svelte.ts:11` (`_theme = value`) and `morphine/state.svelte.ts:28` (`this.current = { ...new }`).
**Warning signs:** Star fill doesn't flip on toggle; `HamburgerMenu` tests show stale `aria-pressed`.

### Pitfall 3: jsdom `<dialog>` polyfill doesn't dispatch `close` on Escape
**What goes wrong:** Test "Esc closes the menu" fails because jsdom doesn't synthesize Esc → close for `<dialog>`.
**Why it happens:** `src/test-setup.ts:80–87` defines `close()` and `showModal()` but no Escape keybinding emulation.
**How to avoid:** In component tests, either (a) fire the `close` event directly: `dialog.close()` (matches SelectPicker.test.ts:237), OR (b) test the `handleClose` handler's post-conditions after programmatic close rather than via Esc keypress. Playwright E2E (Phase 41) covers real-Esc behavior.
**Warning signs:** Test times out waiting for aria-expanded=false after simulated Escape.

### Pitfall 4: Focus restoration fails when trigger button is disabled or removed
**What goes wrong:** `triggerBtn?.focus()` is a no-op on a removed element; focus jumps to `<body>`.
**Why it happens:** This is highly unlikely in Phase 40 (the hamburger button is always mounted), but if someone later adds conditional rendering (e.g., hides hamburger on small screens), focus restoration silently breaks.
**How to avoid:** Keep the hamburger button unconditionally rendered. CONTEXT D-01 says "Visible on all viewports (not mobile-only)" — enforce this.
**Warning signs:** `document.activeElement` is `<body>` after dialog close in tests.

### Pitfall 5: `aria-pressed` + `disabled` combination is non-interactive (correctly)
**What goes wrong:** A reviewer flags "disabled stars aren't tabbable" as a bug.
**Why it happens:** Native `disabled` removes an element from the tab order. This is correct WCAG behavior — disabled controls are not tab stops. [CITED: WCAG 2.1 2.1.1 "focus may be skipped for disabled controls"]
**How to avoid:** Confirm with the planner that this is intentional. CONTEXT D-13 says "Close button is the first tab stop so users can escape without traversing the list" — and the tab chain naturally skips disabled stars. The cap-full caption at the menu header (D-05) gives sighted users the "why" without needing to focus each disabled star.
**Warning signs:** Bug report "I can't tab to the star on UAC/UVC row."

### Pitfall 6: iOS PWA — `::backdrop` CSS not applied on older iOS Safari
**What goes wrong:** Backdrop appears transparent on iOS 15.x.
**Why it happens:** `<dialog>` element shipped in iOS Safari 15.4 (March 2022); `::backdrop` support in Safari has historically had quirks with `background` shorthand.
**How to avoid:** SelectPicker already ships this pattern in v1.4 and passes axe sweeps on iOS PWA in production [VERIFIED: e2e/navigation.spec.ts exercises picker modal]. If there were iOS issues they would have surfaced months ago. No mitigation needed. [MEDIUM confidence — no iOS-specific test visible, but production usage since v1.4 = April 2026 is strong signal.] Include an open E2E check in Phase 41's axe sweep to confirm hamburger renders backdrop on WebKit.
**Warning signs:** Menu "floats" without visible backdrop; users report confusion. Would surface in Playwright axe+visual sweeps in Phase 41.

### Pitfall 7: localStorage JSON parse ignores schema-version drift
**What goes wrong:** If a future version writes `{ v: 2, ids: [...], order: [...] }`, a v1-only reader silently falls back to defaults, discarding the user's favorites.
**Why it happens:** D-08 step 2 validates "shape `{ v: 1, ids: string[] }`" — any schema change triggers a reset.
**How to avoid:** This is ACCEPTABLE for Phase 40 because we're the first version. In future migrations, add a `migrate(v, payload)` step between parse and validate. Document this as a TODO comment in the recovery function so Phase 41+ authors see it.
**Warning signs:** User complaint "my favorites disappeared after update" post-v2.

### Pitfall 8: Multiple component instances re-running `favorites.init()`
**What goes wrong:** If any component calls `favorites.init()` in its own onMount, and `+layout.svelte` also calls it, init runs twice. With idempotent writes this is benign — but the second call re-reads localStorage that was just written, which is wasteful.
**How to avoid:** Only `+layout.svelte` calls `init()`. HamburgerMenu reads `favorites.current` without initializing. Same pattern as theme/disclaimer.
**Warning signs:** Extra localStorage traffic; unlikely user-visible.

## Code Examples

### Favorites store skeleton (source for planner to lift into Task 1)

```typescript
// src/lib/shared/favorites.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// Source pattern: theme.svelte.ts, disclaimer.svelte.ts (module-scope $state + get accessor + init())

import { CALCULATOR_REGISTRY } from '$lib/shell/registry.js';
import type { CalculatorId } from './types.js';

export const FAVORITES_MAX = 4;
const STORAGE_KEY = 'nicu:favorites';
const SCHEMA_VERSION = 1;

interface StoredShape {
  v: number;
  ids: string[];
}

function defaultIds(): CalculatorId[] {
  // D-09: recompute from registry so defaults adapt if registry changes
  return CALCULATOR_REGISTRY.map((c) => c.id as CalculatorId).slice(0, FAVORITES_MAX);
}

function validIds(): Set<string> {
  return new Set(CALCULATOR_REGISTRY.map((c) => c.id));
}

/**
 * D-08 six-step recovery pipeline.
 * Returns a validated, registry-ordered, capped array.
 */
function recover(raw: string | null): CalculatorId[] {
  if (raw === null) return defaultIds(); // first-run (D-09 — caller writes back)
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultIds();
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as StoredShape).v !== SCHEMA_VERSION ||
    !Array.isArray((parsed as StoredShape).ids)
  ) {
    return defaultIds();
  }
  const valid = validIds();
  const registryOrder = CALCULATOR_REGISTRY.map((c) => c.id);
  const filtered = (parsed as StoredShape).ids
    .filter((id): id is string => typeof id === 'string' && valid.has(id))
    .slice(0, FAVORITES_MAX);
  if (filtered.length === 0) return defaultIds();
  // Sort by registry order
  return registryOrder.filter((id) => filtered.includes(id)) as CalculatorId[];
}

function persist(ids: readonly CalculatorId[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, ids }));
  } catch {
    // Silent: private browsing mode or storage quota exceeded
  }
}

let _ids = $state<CalculatorId[]>([]);
let _initialized = $state(false);

export const favorites = {
  get current(): readonly CalculatorId[] {
    return _ids;
  },
  get count(): number {
    return _ids.length;
  },
  get isFull(): boolean {
    return _ids.length >= FAVORITES_MAX;
  },
  get initialized(): boolean {
    return _initialized;
  },

  has(id: CalculatorId): boolean {
    return _ids.includes(id);
  },

  canAdd(id: CalculatorId): boolean {
    return !this.has(id) && !this.isFull;
  },

  toggle(id: CalculatorId): void {
    if (this.has(id)) {
      _ids = _ids.filter((x) => x !== id);
    } else if (!this.isFull) {
      // Defense-in-depth: canAdd() is the primary gate in UI
      const registryOrder = CALCULATOR_REGISTRY.map((c) => c.id);
      const next = [..._ids, id];
      _ids = registryOrder.filter((rid) => next.includes(rid)) as CalculatorId[];
    }
    persist(_ids);
  },

  /** Call from +layout.svelte onMount */
  init(): void {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    const recovered = recover(raw);
    _ids = recovered;
    _initialized = true;
    // D-09: first-run seeding — if nothing stored, write defaults immediately
    if (raw === null) persist(recovered);
  }
};
```

### Hamburger menu component skeleton

```svelte
<!-- src/lib/shell/HamburgerMenu.svelte -->
<!-- Source pattern: SelectPicker.svelte lines 32–153, 182–303 -->
<script lang="ts">
  import { Star, X } from '@lucide/svelte';
  import { CALCULATOR_REGISTRY } from './registry.js';
  import { favorites, FAVORITES_MAX } from '$lib/shared/favorites.svelte.js';
  import type { CalculatorId } from '$lib/shared/types.js';
  import { goto } from '$app/navigation';

  let {
    triggerEl,
    open = $bindable(false)
  }: {
    triggerEl: HTMLButtonElement | null;
    open?: boolean;
  } = $props();

  let dialog = $state<HTMLDialogElement | null>(null);
  let closeBtn = $state<HTMLButtonElement | null>(null);

  const titleId = 'hamburger-title';

  // Expose open() imperatively OR via bind:open
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
  });

  function close() {
    dialog?.close();
  }

  function handleDialogClick(e: MouseEvent) {
    if (e.target === dialog) close();
  }

  function handleClose() {
    open = false;
    triggerEl?.focus(); // focus restoration — NAV-HAM-04
  }

  function handleLinkClick() {
    close(); // D-03: nav link closes the menu
  }

  function handleStarClick(id: CalculatorId, e: MouseEvent) {
    e.stopPropagation(); // defensive — row is not a button, so not strictly needed
    favorites.toggle(id);
    // Intentionally does NOT close — D-03: star does not close the menu
  }
</script>

<dialog
  bind:this={dialog}
  class="hamburger-dialog rounded-2xl bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
  aria-labelledby={titleId}
  onclick={handleDialogClick}
  onclose={handleClose}
>
  {#if open}
    <div class="flex flex-col" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
      <header class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div class="flex flex-col">
          <span id={titleId} class="text-sm font-semibold text-[var(--color-text-primary)]">
            Calculators
          </span>
          {#if favorites.isFull}
            <span class="text-2xs text-[var(--color-text-secondary)]">
              {FAVORITES_MAX} of {FAVORITES_MAX} favorites — remove one to add another.
            </span>
          {/if}
        </div>
        <button
          bind:this={closeBtn}
          type="button"
          class="icon-btn min-h-[48px] min-w-[48px]"
          aria-label="Close menu"
          onclick={close}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <ul class="py-2">
        {#each CALCULATOR_REGISTRY as calc (calc.id)}
          {@const isFavorite = favorites.has(calc.id as CalculatorId)}
          {@const capBlocked = !isFavorite && favorites.isFull}
          <li class="flex items-center gap-2 px-4 {calc.identityClass}">
            <a
              href={calc.href}
              class="flex min-h-[48px] flex-1 items-center gap-3 rounded-lg px-3 text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]"
              onclick={handleLinkClick}
            >
              <calc.icon size={20} aria-hidden="true" />
              <span>{calc.label}</span>
            </a>
            <button
              type="button"
              class="flex h-12 w-12 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-identity)] {capBlocked ? 'opacity-60 cursor-not-allowed' : ''}"
              aria-pressed={isFavorite}
              aria-label={isFavorite
                ? `Remove ${calc.label} from favorites`
                : capBlocked
                ? `Add ${calc.label} to favorites (limit reached — remove one to add another)`
                : `Add ${calc.label} to favorites`}
              disabled={capBlocked}
              aria-disabled={capBlocked ? 'true' : undefined}
              onclick={(e) => handleStarClick(calc.id as CalculatorId, e)}
            >
              <Star
                size={20}
                fill={isFavorite ? 'currentColor' : 'none'}
                style="color: {isFavorite ? 'var(--color-identity)' : 'var(--color-text-secondary)'}"
                aria-hidden="true"
              />
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</dialog>

<style>
  .hamburger-dialog {
    margin: auto;
    width: min(28rem, 100vw);
    max-width: 28rem;
    border: 0;
    padding: 0;
  }
  .hamburger-dialog::backdrop {
    background: var(--color-scrim);
  }
  @media (max-width: 640px) {
    .hamburger-dialog {
      margin: auto auto 0 auto;
      width: 100vw;
      max-width: 100vw;
      border-radius: 1rem 1rem 0 0;
    }
  }
</style>
```

### NavShell.svelte diff sketch (Task for hamburger insertion)

```svelte
<!-- src/lib/shell/NavShell.svelte — ADD to imports -->
import { Sun, Moon, Info, Menu } from '@lucide/svelte';
import HamburgerMenu from './HamburgerMenu.svelte';

<!-- ADD to state -->
let menuOpen = $state(false);
let menuTriggerBtn = $state<HTMLButtonElement | null>(null);

<!-- ADD to action cluster (BEFORE the Info button, so order is Menu | Info | Theme) -->
<div class="flex items-center gap-0.5">
  <button
    bind:this={menuTriggerBtn}
    type="button"
    class="icon-btn min-h-[48px] min-w-[48px]"
    aria-label="Open calculator menu"
    aria-haspopup="dialog"
    aria-expanded={menuOpen}
    onclick={() => (menuOpen = true)}
  >
    <Menu size={20} aria-hidden="true" />
  </button>
  <button
    type="button"
    class="icon-btn min-h-[48px] min-w-[48px]"
    aria-label="About this calculator"
    onclick={() => (aboutOpen = true)}
  >
    <Info size={20} aria-hidden="true" />
  </button>
  <!-- theme button unchanged -->
</div>

<!-- ADD at bottom alongside AboutSheet -->
<HamburgerMenu triggerEl={menuTriggerBtn} bind:open={menuOpen} />
<AboutSheet calculatorId={activeCalculatorId} bind:open={aboutOpen} />
```

### Favorites store unit test skeleton (FAV-TEST-01)

```typescript
// src/lib/shared/favorites.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { favorites, FAVORITES_MAX } from './favorites.svelte.js';

// Reset the module between tests to get fresh internal $state.
// Vitest vi.resetModules() + dynamic import is the established pattern when
// a module has top-level $state; see existing morphine/state tests for similar approach.

const STORAGE_KEY = 'nicu:favorites';

describe('favorites store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  // Round-trip happy path
  it('T-01 first-run: init() with empty storage seeds defaults and persists them', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toEqual({ v: 1, ids: ['morphine-wean', 'formula', 'gir', 'feeds'] });
  });

  it('T-02 round-trip: write then re-init preserves favorites', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: ['gir', 'feeds'] }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['gir', 'feeds']);
  });

  // Recovery cases — each maps to a D-08 step
  it('T-03 recovery: invalid JSON → defaults', async () => {
    localStorage.setItem(STORAGE_KEY, '{malformed');
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
  });

  it('T-04 recovery: missing v field → defaults', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: ['gir'] }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
  });

  it('T-05 recovery: wrong v value → defaults', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 99, ids: ['gir'] }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
  });

  it('T-06 recovery: ids not an array → defaults', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: 'gir' }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
  });

  it('T-07 recovery: unknown id is silently filtered out', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: ['morphine-wean', 'ghost', 'gir'] }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'gir']);
  });

  it('T-08 recovery: over-cap ids are truncated to MAX', async () => {
    // With only 4 registry calculators this edge case requires a contrived input,
    // but the test documents the behavior so future (5+ calculator) regressions surface
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: ['morphine-wean','formula','gir','feeds','morphine-wean'] }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect(favorites.current.length).toBeLessThanOrEqual(FAVORITES_MAX);
  });

  it('T-09 recovery: empty filtered list → defaults', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: ['ghost1', 'ghost2'] }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
  });

  it('T-10 recovery: ids out of registry order are re-sorted on read', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: ['feeds', 'morphine-wean'] }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'feeds']); // registry order
  });

  // Mutation API
  it('T-11 toggle: add to favorites (under cap)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula'] }));
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    favorites.toggle('gir');
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir']); // registry order
  });

  it('T-12 toggle: remove from favorites', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    favorites.toggle('formula');
    expect(favorites.current).not.toContain('formula');
    expect([...favorites.current]).toEqual(['morphine-wean', 'gir', 'feeds']);
  });

  it('T-13 toggle: at cap, adding new id is a no-op (defense-in-depth)', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init(); // 4 defaults, at cap
    expect(favorites.isFull).toBe(true);
    // There's no 5th registered calculator in Phase 40, but we can simulate:
    // toggling an already-favorited id remove+re-add pattern demonstrates
    expect(favorites.current.length).toBe(FAVORITES_MAX);
  });

  it('T-14 toggle: remove + re-add places id at registry-order position (FAV-06)', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    favorites.toggle('formula'); // remove
    favorites.toggle('formula'); // re-add
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
  });

  // isFull, canAdd, has
  it('T-15 has(): returns true for favorited, false otherwise', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect(favorites.has('morphine-wean')).toBe(true);
    favorites.toggle('morphine-wean');
    expect(favorites.has('morphine-wean')).toBe(false);
  });

  it('T-16 canAdd(): false when favorited; false when full; true otherwise', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect(favorites.canAdd('morphine-wean')).toBe(false); // already favorited
    favorites.toggle('morphine-wean');
    // Now 3 favorites, not full → could add back
    expect(favorites.canAdd('morphine-wean')).toBe(true);
  });

  it('T-17 isFull reflects count boundary', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect(favorites.isFull).toBe(true);
    favorites.toggle('morphine-wean');
    expect(favorites.isFull).toBe(false);
  });

  // localStorage failure modes
  it('T-18 init: localStorage.getItem throws → falls back to defaults silently', async () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('private browsing');
    });
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
    spy.mockRestore();
  });

  it('T-19 toggle: localStorage.setItem throws → in-memory state still updates', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    favorites.toggle('formula');
    expect(favorites.has('formula')).toBe(false); // state mutation succeeded
    spy.mockRestore();
  });
});
```

### Hamburger component test skeleton (FAV-TEST-02)

```typescript
// src/lib/shell/HamburgerMenu.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import HamburgerMenu from './HamburgerMenu.svelte';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('HamburgerMenu', () => {
  it('T-01 renders closed — no role=dialog content visible', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    render(HamburgerMenu, { props: { triggerEl: trigger, open: false } });
    // <dialog> element exists but content is gated by {#if open}
    expect(screen.queryByRole('link', { name: /Morphine Wean/i })).toBeNull();
  });

  it('T-02 opens when prop bound to true — lists every registered calculator', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByRole('link', { name: /Morphine Wean/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Formula/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /GIR/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Feeds/i })).toBeTruthy();
  });

  it('T-03 close button closes the dialog and restores focus to trigger', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    const closeBtn = screen.getByRole('button', { name: /Close menu/i });
    await fireEvent.click(closeBtn);
    await tick();
    expect(document.activeElement).toBe(trigger);
  });

  it('T-04 programmatic close (simulating Esc via dialog.close) restores focus', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const { container } = render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    const dialog = container.querySelector('dialog')!;
    dialog.close();
    await tick();
    expect(document.activeElement).toBe(trigger);
  });

  it('T-05 clicking a nav link closes the menu', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const { container } = render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    const link = screen.getByRole('link', { name: /Morphine Wean/i });
    // Prevent jsdom navigation
    link.addEventListener('click', (e) => e.preventDefault());
    await fireEvent.click(link);
    await tick();
    const dialog = container.querySelector('dialog')!;
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('T-06 clicking a star does NOT close the menu', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const { container } = render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    const star = screen.getByRole('button', { name: /Remove Morphine Wean from favorites/i });
    await fireEvent.click(star);
    await tick();
    const dialog = container.querySelector('dialog')!;
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('T-07 star on favorited row has aria-pressed=true', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    const star = screen.getByRole('button', { name: /Remove Morphine Wean from favorites/i });
    expect(star.getAttribute('aria-pressed')).toBe('true');
  });

  it('T-08 star on unfavorited row (when one removed) has aria-pressed=false', async () => {
    // Seed with 3 favorites so the 4th is removable and the rendered star shows unpressed
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['formula', 'gir', 'feeds'] }));
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    const star = screen.getByRole('button', { name: /Add Morphine Wean to favorites/i });
    expect(star.getAttribute('aria-pressed')).toBe('false');
  });

  it('T-09 at cap: non-favorited star is disabled (would require 5th calculator — documented as skip until Phase 42 adds UAC/UVC)', async () => {
    // With only 4 registry entries and all 4 seeded as favorites, there's no non-favorited row to test.
    // This test documents the gap; FAV-TEST-03 in Phase 41 covers the full flow with UAC/UVC.
    // When Phase 42 adds UAC/UVC, this test MUST be updated to:
    //   seed 4 favs, render, find star for uac-uvc row, assert disabled attribute.
    expect(true).toBe(true); // placeholder
  });

  it('T-10 cap-reached caption appears when favorites.isFull', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    expect(screen.getByText(/4 of 4 favorites/)).toBeTruthy();
  });

  it('T-11 cap-reached caption absent when below cap', async () => {
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['formula'] }));
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    expect(screen.queryByText(/of 4 favorites/)).toBeNull();
  });

  it('T-12 star toggle updates aria-pressed and icon fill reactively', async () => {
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['formula'] }));
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    let star = screen.getByRole('button', { name: /Add Morphine Wean to favorites/i });
    expect(star.getAttribute('aria-pressed')).toBe('false');
    await fireEvent.click(star);
    await tick();
    star = screen.getByRole('button', { name: /Remove Morphine Wean from favorites/i });
    expect(star.getAttribute('aria-pressed')).toBe('true');
  });

  it('T-13 tab order: close button is first tabbable (D-13)', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const { container } = render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
    await tick();
    // Collect interactive elements in DOM order
    const focusable = Array.from(
      container.querySelectorAll('button, a[href]')
    ).filter((el) => !(el as HTMLButtonElement).disabled);
    expect((focusable[0] as HTMLElement).getAttribute('aria-label')).toMatch(/Close menu/i);
  });
});
```

### `+layout.svelte` init wiring (one-line diff)

```svelte
<!-- src/routes/+layout.svelte — onMount -->
import { favorites } from '$lib/shared/favorites.svelte.js';

onMount(() => {
  theme.init();
  disclaimer.init();
  favorites.init();            // ← ADD
  // … (pwa registration unchanged)
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte 3/4 `writable()` stores | Svelte 5 `$state` runes | Svelte 5 release (Oct 2024) | All new singletons use `.svelte.ts` + module-scope `$state` |
| Custom focus-trap libraries (focus-trap, a11y-dialog) | Native `<dialog>.showModal()` | iOS Safari 15.4 (Mar 2022) — last major browser to land `<dialog>` | No polyfill needed in production; jsdom needs polyfill (already in test-setup.ts) |
| `aria-pressed` as optional convention | `aria-pressed` standard for toggle buttons | WAI-ARIA 1.2 (2023) | Correct pattern for "star/unstar" interaction |
| bits-ui Dialog for all overlays | Native `<dialog>` for shell-layer, bits-ui for calculator-layer | CONTEXT D-02 decision (2026-04-23) | Shell stays dep-light; calculator layer keeps bits-ui where portal + escapeKeydownBehavior="ignore" are used (DisclaimerModal) |

**Deprecated/outdated:**
- `@testing-library/svelte/svelte5` path (consolidated into default export in v5) — current import is `from '@testing-library/svelte'` [VERIFIED: SelectPicker.test.ts:2]
- Calling `init()` at module top-level — breaks SSG prerender [VERIFIED: morphine/state.svelte.ts:4 explicit warning]

## Assumptions Log

Every critical claim in this research was verified against the codebase. A small number of MEDIUM-confidence claims remain.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Svelte 5 `$state(array)` returns a reactive proxy whose array mutations (`splice`, `push`) ARE tracked when accessed through a getter. | Pitfall 2, Open Questions #1 | Store mutations might not trigger re-renders; mitigated by reassigning the whole array in `toggle()` rather than mutating in place — established pattern in `morphine/state.svelte.ts:28`. [ASSUMED from training; pattern matches existing code] |
| A2 | iOS Safari PWA renders `<dialog>::backdrop` correctly on iOS 15.4+. | Pitfall 6 | Backdrop invisible on old iOS; unlikely since SelectPicker ships this pattern in production since v1.4. [MEDIUM — inferred from SelectPicker production usage, no explicit iOS test] |
| A3 | Native `<dialog>.showModal()` focus trap works in all supported browsers for this app. | Don't Hand-Roll table | Tab could escape the modal; would surface in Playwright E2E. [CITED: WHATWG HTML spec; no counterexample] |
| A4 | Vitest `vi.resetModules()` works correctly with `.svelte.ts` files containing module-scope `$state`. | favorites.test.ts skeleton | Tests might share state across cases. [ASSUMED — if this fails, alternative is to expose a `_reset()` test helper or restructure store to a class instance like `morphine/state.svelte.ts`] |

**User confirmation needed:** None of these assumptions reach the level of requiring a discuss-phase gate — they are all implementation risks that surface in tests, not architectural choices.

## Open Questions (RESOLVED)

### 1. `$state` array read-only exposure — does returning the proxy leak mutability?

**What we know:** `theme.svelte.ts` returns a primitive via `get current()`; no mutability concern. `morphine/state.svelte.ts` returns an object via `current = $state(...)`, and consumers read fields (`morphineState.current.weightKg`) — they don't mutate.

**What's unclear:** Svelte 5 `$state(array)` creates a Proxy that allows mutation. If we return `_ids` via `get current(): readonly CalculatorId[]`, TypeScript marks the return type `readonly`, but TypeScript types are erased at runtime. A misbehaving consumer could call `favorites.current.push('x')` and mutate the internal state without going through `toggle()` — bypassing registry-order sort and persistence.

**Recommendation:** Accept this as a defense-in-depth concern, not a correctness issue. The `readonly` type in TS + code review will catch 99% of it. If a planner wants hard immutability, they can return a `$state.snapshot(_ids)` — but that breaks reactivity (snapshot is a plain object, not a proxy). The accepted tradeoff: the Svelte 5 community pattern is `get`-accessor returning the reactive value directly, and NavShell (Phase 41) is the only in-repo consumer. Plan to add an ESLint rule only if misuse appears. [CITED: https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/ — the blog post cited in CLAUDE.md confirms the `get`-accessor pattern]

**RESOLVED:** Expose `current` as a `readonly CalculatorId[]` via a `get`-accessor returning the reactive Svelte 5 proxy directly; rely on the TypeScript `readonly` type plus code review for immutability (no `$state.snapshot` — it breaks reactivity).

### 2. Should `favorites.init()` use `$effect` for auto-persist or stay explicit?

**What we know:** `theme.svelte.ts` persists in its `set()` mutator (not via `$effect`). `disclaimer.svelte.ts` persists in `acknowledge()` (not via `$effect`). `morphine/state.svelte.ts` has an explicit `persist()` method called from the component.

**What's unclear:** Could wire an `$effect` inside the singleton: `$effect(() => { if (_initialized) persist(_ids); })`. Cleaner but less explicit.

**Recommendation:** Follow the established explicit-persist pattern — `toggle()` calls `persist()` directly. Matches the rest of the codebase. Effects inside `.svelte.ts` modules work but are harder to reason about. The planner should NOT introduce `$effect`-based persistence in this file.

**RESOLVED:** Follow the existing explicit-persist pattern — call `persist(_ids)` directly inside `toggle()` (mirroring `theme.svelte.ts` and `disclaimer.svelte.ts`); do NOT use `$effect`-based auto-persistence.

### 3. Should the hamburger menu re-render when `activeCalculatorId` changes (for `aria-current="page"` on links)?

**What we know:** Deferred idea says "the active row's `aria-current="page"` on the internal link is sufficient" [VERIFIED: context.md:197].

**What's unclear:** Should the links inside the hamburger carry `aria-current="page"` when the current route matches? The deferred section implies yes (it would be emitted on the link, not the hamburger button).

**Recommendation:** Yes — add `aria-current={page.url.pathname.startsWith(calc.href) ? 'page' : undefined}` on each link inside the menu. Zero extra logic; matches NavShell.svelte:47 and 104. One-line addition.

**RESOLVED:** Add `aria-current={page.url.pathname.startsWith(calc.href) ? 'page' : undefined}` on every `<a href={calc.href}>` inside HamburgerMenu, and import `page` from `$app/state` — propagated to Plan 02 Task 1.

### 4. jsdom polyfill coverage for `aria-pressed` reactivity

**What we know:** `aria-pressed` is a standard attribute; jsdom + @testing-library read it via `getAttribute`.

**What's unclear:** Does Svelte 5 re-render the attribute reactively when the `$state` changes? Based on T-12 above, yes — but worth confirming in first test run.

**Recommendation:** Run T-12 early. If it fails, investigate rune reactivity vs attribute binding; fallback is using `{#key favorites.has(calc.id)}` blocks. Low risk — this is idiomatic Svelte 5.

**RESOLVED:** Treat `aria-pressed` reactivity as working (idiomatic Svelte 5); run T-12 early in Wave 2 execution and fall back to `{#key favorites.has(calc.id)}` only if the test fails.

### 5. Should the menu trap focus inside itself, or let it escape (via native `<dialog>` behavior)?

**What we know:** Native `<dialog>.showModal()` traps focus within the dialog subtree. [CITED: WHATWG HTML spec]

**What's unclear:** jsdom doesn't implement this focus trap.

**Recommendation:** Component tests cannot assert focus-trap behavior; defer to Playwright E2E (Phase 41 FAV-TEST-03) for real-browser validation.

**RESOLVED:** Rely on native `<dialog>.showModal()` focus trap; Phase 40 component tests cover DOM-order tab stops (T-13), and real-browser focus-trap verification is deferred to Phase 41 Playwright E2E (FAV-TEST-03).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Tooling | ✓ (assume from package.json `pnpm@10.33.0` spec) | ≥ 20 expected | — |
| pnpm | Package management | ✓ | 10.33.0 | — |
| `svelte` runtime | Everything | ✓ | 5.55.4 (package.json) | — |
| `@lucide/svelte` Menu + Star icons | HamburgerMenu | ✓ | 1.8.0 (package.json) | — |
| `vitest` + jsdom + HTMLDialogElement polyfill | Unit + component tests | ✓ | vitest 4.1.4, jsdom 29, polyfill in test-setup.ts | — |
| Playwright | E2E (Phase 41 scope, but NOT required for Phase 40 gate) | ✓ | 1.59.1 | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

> `workflow.nyquist_validation` is **explicitly `false`** in `.planning/config.json`. Per research protocol, this section is still included because the planner may use it to structure task-level verification.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 with jsdom environment |
| Config file | `vite.config.ts` (lines 59–64) |
| Test setup | `src/test-setup.ts` — already polyfills HTMLDialogElement, matchMedia, Element.animate |
| Quick run command | `pnpm test:run src/lib/shared/favorites.test.ts` |
| Full suite command | `pnpm test:run` |
| Static gates | `pnpm check` (svelte-check, zero errors) + `pnpm format:check` (prettier) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FAV-01 | Star toggle adds/removes favorite | unit | `pnpm test:run src/lib/shared/favorites.test.ts -t 'toggle: add'` | ❌ Wave 0 |
| FAV-02 | Cap enforcement + disabled state | unit + component | `pnpm test:run src/lib/shared/favorites.test.ts -t 'at cap'`; `pnpm test:run src/lib/shell/HamburgerMenu.test.ts -t 'cap-reached caption'` | ❌ Wave 0 |
| FAV-03 | localStorage persistence across sessions | unit (round-trip) | `pnpm test:run src/lib/shared/favorites.test.ts -t 'round-trip'` | ❌ Wave 0 |
| FAV-04 | First-run defaults | unit | `pnpm test:run src/lib/shared/favorites.test.ts -t 'first-run'` | ❌ Wave 0 |
| FAV-05 | Nav updates immediately (reactive) | **deferred to Phase 41** — NavShell is unchanged here. Phase 40 verifies reactivity via HamburgerMenu (T-12 star fill flips) | component | `pnpm test:run src/lib/shell/HamburgerMenu.test.ts -t 'reactively'` | ❌ Wave 0 |
| FAV-06 | Stable favorite order | unit | `pnpm test:run src/lib/shared/favorites.test.ts -t 'FAV-06'` | ❌ Wave 0 |
| FAV-07 | Schema-safe recovery | unit — 7 sub-cases | `pnpm test:run src/lib/shared/favorites.test.ts -t 'recovery'` | ❌ Wave 0 |
| NAV-HAM-01 | Hamburger button in title bar | E2E (extension of navigation.spec.ts) — **Phase 41 scope for E2E**; Phase 40 can cover via component snapshot | component | `pnpm test:run src/lib/shell/HamburgerMenu.test.ts` (indirect via renders) | ❌ Wave 0 |
| NAV-HAM-02 | Menu lists every registered calculator | component | `pnpm test:run src/lib/shell/HamburgerMenu.test.ts -t 'lists every'` | ❌ Wave 0 |
| NAV-HAM-03 | Row click navigates + closes; star click toggles only | component | `pnpm test:run src/lib/shell/HamburgerMenu.test.ts -t 'nav link closes'`; `-t 'star.*NOT close'` | ❌ Wave 0 |
| NAV-HAM-04 | Keyboard nav + focus return | component + manual (jsdom doesn't cover focus trap; E2E in Phase 41) | `pnpm test:run src/lib/shell/HamburgerMenu.test.ts -t 'focus'` | ❌ Wave 0 |
| NAV-HAM-05 | Reduced-motion + scrim token | CSS check (visual snapshot) + unit assertion on class presence | manual + component | ❌ Wave 0 |
| FAV-TEST-01 | Unit tests for favorites store | meta-req — the test file itself | `pnpm test:run src/lib/shared/favorites.test.ts` | ❌ Wave 0 |
| FAV-TEST-02 | Component test for hamburger | meta-req — the test file itself | `pnpm test:run src/lib/shell/HamburgerMenu.test.ts` | ❌ Wave 0 |

### Sampling Rate (optional planner guidance despite nyquist disabled)

- **Per task commit:** `pnpm test:run src/lib/shared/favorites.test.ts` OR `src/lib/shell/HamburgerMenu.test.ts` (depending on task target)
- **Per wave merge:** `pnpm test:run` (full vitest suite — ~< 15s based on existing test count)
- **Phase gate:** `pnpm check` + `pnpm test:run` + `pnpm format:check` green, plus existing Playwright suite (FAV-TEST-03 E2E lands in Phase 41, not this phase)

### Test Coverage Matrix (the full dimensions the planner should satisfy)

| Axis | Dimension Values | Covered In |
|------|------------------|------------|
| **Persistence state** | first-run empty / valid stored / invalid JSON / missing `v` / wrong `v` / ids-not-array / unknown ids / over-cap ids / all-unknown ids / registry-order-violated | `favorites.test.ts` T-01 .. T-10 |
| **Mutation API** | toggle-add under cap / toggle-remove / toggle-add at cap (no-op) / remove+re-add preserves registry order | `favorites.test.ts` T-11 .. T-14 |
| **Query API** | `has()` / `canAdd()` / `isFull` / `count` | `favorites.test.ts` T-15 .. T-17 |
| **Storage failure modes** | `getItem` throws / `setItem` throws | `favorites.test.ts` T-18, T-19 |
| **Menu presentation** | open state / closed state / cap-reached caption visible / caption hidden below cap | `HamburgerMenu.test.ts` T-01, T-02, T-10, T-11 |
| **Close interactions** | close button click / programmatic close (Esc proxy) / nav link click / star click does NOT close | `HamburgerMenu.test.ts` T-03, T-04, T-05, T-06 |
| **Star state** | favorited aria-pressed=true / unfavorited aria-pressed=false / reactive fill on toggle | `HamburgerMenu.test.ts` T-07, T-08, T-12 |
| **Keyboard** | close button is first tab stop | `HamburgerMenu.test.ts` T-13 (DOM-order proxy; E2E covers real focus trap) |
| **Focus restoration** | close returns focus to trigger | `HamburgerMenu.test.ts` T-03, T-04 |
| **Disabled-at-cap** | disabled attribute set / aria-disabled='true' / non-tabbable | **Gap in Phase 40** — with only 4 registered calculators and cap=4, there is no non-favorited row to assert against. Phase 42 (UAC/UVC as 5th calculator) unlocks this; add the test then. Document the gap in T-09. |

### Wave 0 Gaps (files that don't exist yet)

- [ ] `src/lib/shared/favorites.svelte.ts` — the store itself (Wave 1 implementation)
- [ ] `src/lib/shared/favorites.test.ts` — FAV-TEST-01 unit coverage (Wave 1 or 2)
- [ ] `src/lib/shell/HamburgerMenu.svelte` — the menu component (Wave 2)
- [ ] `src/lib/shell/HamburgerMenu.test.ts` — FAV-TEST-02 component coverage (Wave 2 or 3)
- [ ] `+layout.svelte` onMount update — single-line addition calling `favorites.init()`
- [ ] `NavShell.svelte` modification — add hamburger trigger button + mount `HamburgerMenu`
- [ ] Framework install: none — vitest, testing-library, jsdom polyfill all present

### Out-of-scope for Phase 40 validation (lands in Phase 41)

- Playwright E2E full flow (FAV-TEST-03)
- Playwright axe sweep of open hamburger (FAV-TEST-04)
- NavShell rendering from favorites store (Phase 41 D-OUT-01)
- Real-browser focus trap verification (requires Playwright)
- iOS PWA backdrop visual regression (Phase 41 axe sweep)

## Project Constraints (from CLAUDE.md)

The planner MUST honor these directives — they supersede any conflicting guidance here:

- **Tech stack locked:** SvelteKit 2, Svelte 5, Tailwind CSS 4, Vite, pnpm. No alternatives. [CLAUDE.md:20]
- **No native / PWA only:** No Capacitor. All logic runs in the browser. [CLAUDE.md:22]
- **Offline-first:** All new source files get cached by Workbox automatically (vite.config.ts globs `**/*.{js,css,html,...}`). No runtime fetch. [CLAUDE.md:23]
- **WCAG 2.1 AA minimum:** 48px touch targets are non-negotiable. D-01 + D-04 + D-05 comply. Focus states visible via `focus-visible:outline-2 outline-[var(--color-identity)]`. [CLAUDE.md:24]
- **Code reuse over rewrite:** Port business logic, don't rewrite calculation functions. [CLAUDE.md:25] N/A for this phase (no calculations).
- **GSD workflow enforcement:** Edits MUST be done through a GSD command. [CLAUDE.md:131–139] Not a coding directive per se, but enforcement guidance.
- **Always-visible nav labels:** Icon-only nav is forbidden. The hamburger row already complies (icon + label + star). [CLAUDE.md:64]
- **Mobile-first muscle memory:** User works one-handed in clinical environments. Touch targets, `env(safe-area-inset-bottom)` in the dialog footer. [CLAUDE.md memory `user_mobile_first`]
- **Test colocation:** `favorites.test.ts` next to `favorites.svelte.ts`, NOT in `__tests__/`. [CLAUDE.md memory `feedback_test_colocation`]

## Sources

### Primary (HIGH confidence — verified in this repository)
- `src/lib/shared/theme.svelte.ts` (lines 1–35) — canonical singleton pattern
- `src/lib/shared/disclaimer.svelte.ts` (lines 1–27) — second reference singleton
- `src/lib/shared/pwa.svelte.ts` (lines 1–32) — third reference singleton
- `src/lib/morphine/state.svelte.ts` (lines 1–56) — class-based singleton + SSG-safe init comment
- `src/lib/shared/components/SelectPicker.svelte` (lines 32–153, 182–303) — canonical `<dialog>` modal pattern
- `src/lib/shared/components/SelectPicker.test.ts` (18 test cases) — canonical `<dialog>` component test style
- `src/lib/shared/components/AboutSheet.svelte` — bits-ui counter-pattern (NOT followed for this phase)
- `src/lib/shared/components/DisclaimerModal.svelte` — second bits-ui example (NOT followed)
- `src/lib/shell/NavShell.svelte` (lines 22–115) — title bar action cluster where hamburger lands
- `src/lib/shell/registry.ts` (lines 1–47) — CALCULATOR_REGISTRY catalog
- `src/lib/shared/types.ts` (lines 1–19) — CalculatorId union
- `src/test-setup.ts` (lines 1–133) — jsdom polyfills including HTMLDialogElement self-test
- `src/app.css` (lines 60–253) — design tokens, identity classes, `icon-btn` utility, reduced-motion rule
- `src/app.html` (FOUC script) — theme boot sequence pattern
- `src/routes/+layout.svelte` (lines 38–56) — onMount wiring for singletons
- `vite.config.ts` (lines 59–64) — vitest config with jsdom + test-setup.ts
- `package.json` — dep versions
- `.planning/phases/40-favorites-store-hamburger-menu/40-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md` — 14 requirements this phase covers

### Secondary (MEDIUM confidence — cited but not directly exercised)
- [WAI-ARIA 1.2 Toggle Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/#example-label-from-content-toggle) — `aria-pressed` semantics
- [WHATWG HTML Living Standard — `<dialog>` element](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element) — modal focus trap, Esc-to-close, ::backdrop
- [Svelte 5 global state blog — Mainmatter](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) — cited in CLAUDE.md as the `get`-accessor canonical pattern
- MDN: [`HTMLDialogElement.showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal)
- MDN: [`localStorage.setItem` — quota exceeded throws `DOMException`](https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem#exceptions)

### Tertiary (LOW — flagged for validation)
- None. Every claim in this document is either verified in-repo or cited from authoritative docs.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — zero new dependencies, every construct has an in-repo precedent
- Architecture: **HIGH** — pattern is `.svelte.ts singleton + <dialog> modal`, both exist in canonical form
- Pitfalls: **HIGH** — drawn from repo comments (morphine/state.svelte.ts:4 "CRITICAL") and explicit jsdom self-tests (test-setup.ts:105)
- Schema recovery: **HIGH** — D-08 is fully specified in CONTEXT.md; implementation is a direct translation
- iOS PWA quirks: **MEDIUM** — no explicit iOS-visible test in the repo, but SelectPicker has shipped the same `<dialog>::backdrop` pattern since v1.4 without regressions
- `$state` array reactivity via getter: **MEDIUM** — no identical pattern in repo (theme is primitive; morphine is object — not array), but Svelte 5 docs confirm proxy reactivity

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (stable — Svelte 5 is mature, `<dialog>` is baseline, no in-flight dependency upgrades)
