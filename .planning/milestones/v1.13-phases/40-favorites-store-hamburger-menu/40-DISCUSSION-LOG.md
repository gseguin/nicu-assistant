# Phase 40: Favorites Store + Hamburger Menu - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 40-favorites-store-hamburger-menu
**Mode:** `--auto` (recommended defaults selected non-interactively)
**Areas discussed (auto-resolved):** Hamburger placement, Menu presentation, Row composition, Star semantics, Cap-full feedback, Storage schema, Favorite order, Schema recovery, First-run seeding, Store API, Cap constant, Menu rendering source, Keyboard nav, Motion/identity

---

## Hamburger placement

| Option | Description | Selected |
|--------|-------------|----------|
| Leftmost of title-bar action cluster (Menu, Info, Theme) | Visible on all viewports; matches `icon-btn` pattern | ✓ |
| Rightmost (Info, Theme, Menu) | Preserves Info/Theme-leftmost muscle memory | |
| Mobile-only, floating action button | Adds a new pattern; unclear desktop affordance | |

**Selected:** Leftmost of title-bar action cluster. (D-01)
**Rationale:** Phase 42 puts UAC/UVC behind the hamburger even on desktop — desktop needs the hamburger too. Menu-left keeps Info/Theme anchored right so muscle memory is preserved.

---

## Menu presentation

| Option | Description | Selected |
|--------|-------------|----------|
| `<dialog>` + `showModal()` full-screen sheet | Mirrors SelectPicker/AboutSheet/DisclaimerModal; free focus trap + Esc | ✓ |
| Side drawer (slide from left) | Needs custom focus trap + gesture handling | |
| Popover anchored to hamburger button | Crowded on mobile 375px | |

**Selected:** `<dialog>`-based modal sheet. (D-02)
**Rationale:** Zero new dependencies; proven a11y via v1.4 SelectPicker pattern; jsdom polyfill already in place.

---

## Row composition (per calculator)

| Option | Description | Selected |
|--------|-------------|----------|
| Link wrapper with nested star button | Nested interactives: a11y + iOS double-tap issues | |
| Sibling link + star button (label/icon is link, star is sibling button) | Unambiguous for AT and touch; no double-activation | ✓ |
| Whole row is a button; star is a visual indicator only (click a different location to toggle) | Non-obvious UX | |

**Selected:** Sibling link + star button. (D-03)

---

## Star button semantics & visual state

| Option | Description | Selected |
|--------|-------------|----------|
| `aria-pressed` toggle, single Star icon with `fill` swap | Standard ARIA toggle pattern; no layout shift | ✓ |
| `role="switch"` | Wrong semantic — switches are for on/off state, not collection-add | |
| Swap between Star and StarFilled icons | Layout shift risk if icon metrics differ | |

**Selected:** `aria-pressed` + fill swap; identity-hue tint when favorited. (D-04)

---

## Cap-full feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Disabled button + extended aria-label + menu-level caption | AT reads "why"; sighted users see caption + disabled visual | ✓ |
| Native tooltip on hover | Inconsistent across OS/browsers; no mobile hover | |
| Modal confirm when user tries to exceed cap | Adds friction for a design-constraint case | |

**Selected:** Disabled button + extended aria-label + menu header caption. (D-05)

---

## Storage schema

| Option | Description | Selected |
|--------|-------------|----------|
| `{ v: 1, ids: CalculatorId[] }` versioned JSON array | Migration-friendly; array preserves order | ✓ |
| `Set<CalculatorId>` serialized | Loses order; Set semantics not useful for favorites | |
| Object map `{ id: boolean }` | Verbose; no order semantics | |

**Selected:** Versioned JSON array, key `nicu:favorites`. (D-06)

---

## Favorite order

| Option | Description | Selected |
|--------|-------------|----------|
| Registry order (sorted by position in CALCULATOR_REGISTRY) | Predictable; no mutable ordering | ✓ |
| Insertion order (order user favorited) | Non-obvious after toggling; inconsistent with bottom bar history | |
| Alphabetical | Clinical tools not usually alphabetized | |

**Selected:** Registry order. (D-07)

---

## Schema-safe recovery (FAV-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Parse → validate shape → filter to known ids → cap → default-if-empty → sort by registry | Defensive, no user-visible failures | ✓ |
| Parse and throw if invalid (let UI show error) | Surfaces data issues users can't resolve | |
| Migrate schema versions explicitly | Over-engineering for v1; defer to Phase N if v2 shape needed | |

**Selected:** Filter + default-on-fail. (D-08)

---

## First-run seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Write defaults `['morphine-wean', 'formula', 'gir', 'feeds']` on first load | Phase 41 reads a populated store; no empty-state branching | ✓ |
| Lazy-default on read, write on first mutation | Two code paths for "unseeded" state | |
| No defaults — empty bar until user stars | Existing users lose their bottom bar on update | |

**Selected:** Write defaults immediately. (D-09)

---

## Store API shape

| Option | Description | Selected |
|--------|-------------|----------|
| `.svelte.ts` singleton with `get`-accessors (theme.svelte.ts pattern) | Consistent with 5 existing singletons; Svelte 5 idiomatic | ✓ |
| Svelte `writable` store | Deprecated pattern for runes-based app | |
| Class with subscribe method | Reinventing the rune | |

**Selected:** `.svelte.ts` singleton. (D-10)

---

## Cap constant location

| Option | Description | Selected |
|--------|-------------|----------|
| Code-level `FAVORITES_MAX = 4` exported constant | Tied to UX layout; not user-tweakable | ✓ |
| `config.json` field | Implies clinicians can change it; misleading | |

**Selected:** Code-level constant. (D-11)

---

## Menu rendering source

| Option | Description | Selected |
|--------|-------------|----------|
| Iterate `CALCULATOR_REGISTRY` directly | Single source of truth; new calcs appear automatically | ✓ |
| Separate "menu items" config | Duplication; drift risk | |

**Selected:** Iterate registry. (D-12)

---

## Keyboard navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Native tab order (close, link1, star1, link2, star2, …) + Esc to close | Standard; no custom keymap; short list | ✓ |
| Roving tabindex + arrow keys | Over-engineered for ≤8 items | |

**Selected:** Native tab order. (D-13)

---

## Motion & identity

| Option | Description | Selected |
|--------|-------------|----------|
| Gate open/close animation behind `prefers-reduced-motion`; use `--color-scrim`; header reads "Calculators" | Consistent with v1.6/v1.10 motion and clinical-first labeling | ✓ |

**Selected:** As above. (D-14)

---

## Claude's Discretion

- Scrim opacity exact value (match SelectPicker).
- Transition durations (match existing modals; reduced-motion gated).
- Whether menu header shows app version (optional flourish, not required).
- Whether to throttle localStorage writes (fine as-is for 4-max; revisit if profiling shows a hotspot).

## Deferred Ideas

- Drag-to-reorder favorites (FAV-FUT-01).
- Per-breakpoint cap (FAV-FUT-02).
- Export/import favorites (FAV-FUT-03).
- Search box in hamburger (CAT-FUT-01).
- "Active-but-not-favorited" indicator in the menu beyond `aria-current="page"`.
- Haptic feedback on star toggle.
