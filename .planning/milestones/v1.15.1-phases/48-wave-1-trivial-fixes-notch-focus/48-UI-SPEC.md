---
phase: 48
slug: wave-1-trivial-fixes-notch-focus
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-27
---

# Phase 48 — UI Design Contract

> Structural hardening phase. **Zero new design decisions.** The locked v1.13 design contract (`DESIGN.md` / `DESIGN.json` at project root) is preserved verbatim. This UI-SPEC's job is to (a) lock in that fact by citing the source-of-truth for every visual concern, and (b) record the only two new **interaction contracts** introduced by this phase.

---

## Scope (what this UI-SPEC actually contracts)

Two interaction contracts on existing components — **no new components, screens, layouts, colors, typography, motion, or copy**:

1. **Safe-area inset application** on the existing `NavShell.svelte` sticky `<header>` (lines 76–80) so the hamburger / wordmark / theme-info buttons sit below the iPhone 14 Pro+ Dynamic Island in standalone PWA mode.
2. **Drawer first-focus target** on the existing `InputDrawer.svelte` close button (lines 107–119) so opening the drawer never summons the iOS soft keyboard before a clinician chooses a field.

Both edits live inside the locked design system. The visible runtime change is:

- iPhone 14 Pro+ standalone PWA: title-bar chrome sits ~47 px lower (clears the Dynamic Island).
- iPhone landscape: title-bar chrome respects `safe-area-inset-left/right`; browser-tab fallback preserves the existing `1rem` gutter.
- Any iOS device: opening the drawer lands focus on the close button (focus ring visible), not on a textbox — soft keyboard does NOT appear.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (custom — see DESIGN.md / DESIGN.json) |
| Preset | not applicable |
| Component library | none (`$lib` shared components inside this app) |
| Icon library | `@lucide/svelte` |
| Font | Plus Jakarta Sans |

**Source of truth:** `/DESIGN.md` (project root) + `/DESIGN.json` (project root) — locked v1.13 contract. Phase 48 does NOT modify either file.

---

## Spacing Scale

**No change.** See `DESIGN.json:spacing` and `DESIGN.md §1` (the project's named spacing scale: `hairline 4`, `tight 8`, `snug 12`, `base 16`, `comfy 20`, `loose 24`, `hero 32`, `bottom-nav-clearance 80`). All Phase 48 edits reuse existing tokens.

**Phase 48 spacing usage:**

- `NavShell.svelte` `<header>`: existing `min-h-14` (= 56 px), existing `gap-2`, existing `px-4` (= 16 px) replaced with `px-[max(env(safe-area-inset-left,0px),1rem)]` — **fallback `1rem` = 16 px = same value**, the inset only adds when iOS reports a non-zero value (per CONTEXT.md D-02 + PITFALLS.md P-10).
- New `pt-[env(safe-area-inset-top,0px)]` on the same `<header>` adds 0 px in browser-tab mode (Safari URL bar consumes the inset; CSS `env()` returns 0) and ~47 px in iPhone 14 Pro+ standalone PWA mode. The inset is reported by the platform — this phase declares no new token.

Exceptions: none.

---

## Typography

**No change.** See `DESIGN.json:typography` and `DESIGN.md §3` (locked five-roles-only contract: `display`, `title`, `body`, `ui`, `label`). Phase 48 does not introduce, alter, or replace any typography role. The existing close-button label `Close {title.toLowerCase()}` (e.g. "Close inputs") is unchanged.

| Role | Source |
|------|--------|
| Display / Title / Body / UI / Label | Locked — see DESIGN.json:typography |

---

## Color

**No change.** See `DESIGN.json:colors` and `DESIGN.md §2` (locked OKLCH palette + Identity-Inside Rule + Amber-as-Semantic Rule + Red-Means-Wrong Rule). Phase 48 does not introduce, alter, or replace any color token.

**NOTCH-03 satisfaction (background paints into the inset):** the existing `bg-[var(--color-surface)]` declaration on the `<header>` (line 79) extends into the new `pt-[env(safe-area-inset-top,0px)]` region by default per CSS box-model rules — no new color token, no new style rule, no contrast change. Existing 16/16 axe sweeps in light + dark must remain green (CONTEXT.md D-20).

**FOCUS-visible ring on close button:** the existing `focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]` (InputDrawer line 109) is unchanged. `--color-identity` resolves to the calculator's locked identity hue per the Identity-Inside Rule.

| Role | Source |
|------|--------|
| Dominant / Secondary / Accent / Identity / Error | Locked — see DESIGN.json:colors |

Accent reserved for: unchanged from v1.13 — see `DESIGN.md §2 Identity-Inside Rule`.

---

## Layout (NEW interaction contract)

The only section of this UI-SPEC with new prescriptive content. Two contracts:

### LC-01 — `NavShell.svelte` sticky header inset application

**File:** `src/lib/shell/NavShell.svelte` lines 76–80.

**Existing className (preserved):**
```
sticky top-0 right-0 left-0 z-10 flex
min-h-14 items-center gap-2 border-b
border-[var(--color-border)] bg-[var(--color-surface)] px-4
```

**New className (Phase 48):**
```
sticky top-0 right-0 left-0 z-10 flex
min-h-14 items-center gap-2 border-b
border-[var(--color-border)] bg-[var(--color-surface)]
pt-[env(safe-area-inset-top,0px)]
px-[max(env(safe-area-inset-left,0px),1rem)]
```

**Rules:**

- **Bare `env()` form, no `max()` floor on `pt-`.** Per PITFALLS.md P-10 + CONTEXT.md D-02. A `max(env(safe-area-inset-top,0px), Npx)` floor would add `N` px in browser-tab mode (where `env()` returns 0 because Safari already consumes the inset), silently breaking the Phase 42.1 "hero fills viewport on mount" contract.
- **`max()` IS used on `px-`** because the existing `px-4` (= 1rem = 16 px) gutter is the design floor for chrome content; the inset adds on top in landscape on notched devices. `max(env(safe-area-inset-left,0px), 1rem)` keeps the existing 16 px gutter when `env()` is 0 (browser tab + non-notched portrait).
- **Mirror the bottom-nav pattern verbatim.** `NavShell.svelte:150` already uses `pb-[env(safe-area-inset-bottom,0px)]`. The new top + side insets MUST read with the same Tailwind arbitrary-value bracket shape and same `0px` fallback default. Reviewers should not have to context-switch.
- **No new wrapper element.** Single className edit on the existing `<header>`. No DOM-structure change. Preserves Phase 41 / Phase 45 bottom-bar + desktop-tablist contracts already on the same element.
- **Background paints into the inset region.** Existing `bg-[var(--color-surface)]` is sufficient — CSS extends the background into the padded region by default. NOTCH-03 satisfied without a separate rule (CONTEXT.md D-04).
- **`bg-[var(--color-surface)]` (not `--color-surface-card`).** Preserves the v1.13 chrome contract — title bar sits on the page-background tone, not on the raised-card tone. Phase 48 makes no token change.
- **No `--header-h` CSS custom property.** PITFALLS.md P-09 floated this; CONTEXT.md D-06 rejected it because no consumer needs the live header height (the existing `top-20` on calculator route asides is conservative enough — desktop has no notch). Adding the property would be over-engineering for a 10-LOC fix.
- **Sticky-top consumers unchanged.** All 6 calculator routes use `sticky top-20` (= 80 px) for their input/result asides on desktop. Mobile asides are inside `InputDrawer` (not sticky). Desktop has no notch — `min-h-14` (56 px) + `pt-[env(safe-area-inset-top,0px)]` (0 px on desktop) totals 56 px, well under 80 px. No `top-20` value changes (CONTEXT.md D-05).

### LC-02 — Browser-tab vs standalone PWA fallback behavior

**Contract:** in **Safari browser tab** (no "Add to Home Screen") on the same iPhone 14 Pro+:
- `safe-area-inset-top` = 0 (Safari URL bar already consumes the inset)
- `safe-area-inset-left/right` = 0 (portrait) or > 0 (landscape on notched devices)
- New `pt-[env(safe-area-inset-top,0px)]` resolves to 0 px → header behaves identically to today.
- New `px-[max(env(safe-area-inset-left,0px),1rem)]` resolves to `max(0, 1rem)` = 1rem (portrait) or `max(N, 1rem)` (landscape) → preserves existing 16 px gutter, adds inset only when platform reports it.
- Phase 42.1 hero-fills-viewport contract preserved.

**Contract:** in **standalone PWA mode** on iPhone 14 Pro+:
- `safe-area-inset-top` ≈ 47–59 px (Dynamic Island)
- `safe-area-inset-left/right` = 0 (portrait) or ≈ 47 px (landscape, leading edge)
- New `pt-[env(...)]` clears the Dynamic Island in portrait.
- New `px-[max(env(...),1rem)]` clears the side notch in landscape (NOTCH-02).

### LC-03 — Drawer first-focus target

**File:** `src/lib/shared/components/InputDrawer.svelte`.

**Delete in full:** lines 47–57 (the `// Move focus...` comment block PLUS the `queueMicrotask(() => firstInput?.focus())` block). No boolean opt-out, no narrowed selector, no replacement comment. Per CONTEXT.md D-08 + D-15 + PITFALLS.md P-13.

**Add `autofocus`** to the existing close button at lines 107–119 (the inner `<button>` with `aria-label="Close {title.toLowerCase()}"`). NOT to the optional Clear button (lines 98–105) — Clear is conditional (`{#if onClear}`) and not present on every calculator (CONTEXT.md D-09 + D-10).

**Rules:**

- **Single source of truth.** The `autofocus` attribute lives on the close button inside `InputDrawer.svelte`. NO per-calculator divergence (FOCUS-03). All 6 calculators (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT) inherit the same first-focus contract.
- **Declarative > imperative.** Use the HTML `autofocus` attribute, not `dialog.focus()` (PITFALLS.md P-14: inconsistent across browsers). Native `<dialog>.showModal()` honors `autofocus` deterministically across WebKit / Chromium / Firefox.
- **Order matters.** The close button is rendered AFTER the optional Clear button in DOM (lines 96–120). HTML's `autofocus` attribute wins over the native `<dialog>` "first focusable child" heuristic — explicit `autofocus` makes it deterministic regardless of whether Clear is present.
- **Existing focus indicator unchanged.** `focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]` (line 109) renders the focus ring when `autofocus` lands. No new focus styling, no new motion.
- **VoiceOver announcement contract preserved.** With `autofocus` on a `<button>` carrying `aria-label="Close inputs"`, VoiceOver announces **"Close inputs, button"** on drawer open (PITFALLS.md P-01). Keyboard users get a deterministic Tab origin; clinician must tap a field to summon the OSK.
- **iOS soft keyboard does NOT appear.** Close button is a `<button>` (not `<input>`/`<select>`/`<textarea>`/`[role="slider"]`) so no OSK summoning side-effect.

---

## Motion

**No change.** See `DESIGN.md §6 Don't ship animations the clinician will read as "the app is laggy."` Existing drawer animations (slide-up 200 ms cubic-bezier(0.22, 1, 0.36, 1) on `.input-drawer-sheet`; fade-in 200 ms ease on `::backdrop`; both gated on `prefers-reduced-motion: no-preference`) are preserved verbatim. Phase 48 introduces no new animation, no new transition, no new duration.

---

## Copywriting Contract

**No change.** Phase 48 alters no user-facing string.

| Element | Source |
|---------|--------|
| Close button `aria-label` | Existing: `Close {title.toLowerCase()}` (e.g. "Close inputs"). Becomes the VoiceOver announcement on drawer open per LC-03. |
| Clear button `aria-label` | Existing: `Clear {title.toLowerCase()}` (calculators with reset only) |
| Hamburger button `aria-label` | Existing: `Open calculator menu` |
| Theme toggle `aria-label` | Existing: `Switch to light mode` / `Switch to dark mode` |
| App name | Existing: `NICU Assist` |

No empty states added (no new screens). No error states added (no new inputs). No destructive confirmations added (no new destructive actions).

---

## Cross-Calculator Consistency Contract

The 6 calculator routes (`/morphine-wean`, `/formula`, `/gir`, `/feeds`, `/uac-uvc`, `/pert`) are **NOT individually edited**. The drawer is a single source of truth in `InputDrawer.svelte`; the title bar is a single source of truth in `NavShell.svelte`. FOCUS-03 (single-source-of-truth, no per-calculator divergence) is satisfied by construction.

**Verified by:** the cross-calculator Playwright spec at `e2e/drawer-no-autofocus.spec.ts` (CONTEXT.md D-14) iterates all 6 calculator routes × 2 Playwright projects (`chromium` + `webkit-iphone`) = 12 test cases, asserting `getByRole('button', { name: /Close /i }).toBeFocused()` after drawer open on each route.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none | not applicable |

Phase 48 introduces no new registry, no new third-party blocks, no new dependencies. The two edits are pure HTML/CSS attribute changes against existing components.

---

## Verification Surfaces (CI vs real-iPhone)

Phase 48 success criteria are deliberately CI-verifiable. Real-iPhone visual notch verification belongs to Phase 50 (SMOKE-02 closes NOTCH-01, SMOKE-03 closes FOCUS-01 + FOCUS-02). Per CONTEXT.md D-19 + PITFALLS.md P-19, Playwright cannot render the Dynamic Island even at iPhone-14-Pro-Max viewport.

| Surface | What it proves |
|---------|----------------|
| Source-grep test (`NavShell.test.ts` NEW) | `pt-[env(safe-area-inset-top` literal present (NOTCH-TEST-01) |
| Source-grep test (`InputDrawer.test.ts`) | `queueMicrotask` literal absent + `[role="slider"]` literal absent (FOCUS-TEST-02) |
| Component test (`InputDrawer.test.ts`) | After `dialog.showModal()`, `document.activeElement` is NOT input/select/textarea/`[role="slider"]`; positive assertion that `aria-label` matches `/Close /i` (FOCUS-TEST-01) |
| Cross-calculator Playwright spec (`drawer-no-autofocus.spec.ts` NEW, runs under both `chromium` + `webkit-iphone`) | Six routes × two projects = 12 cases asserting close button is focused on drawer open (FOCUS-TEST-03 + FOCUS-03) |
| Existing 16/16 axe sweeps (light + dark across 6 calculators) | No contrast or landmark regression from inset-fill or focus-order shift (NOTCH-TEST-01 second clause + CONTEXT.md D-20) |
| Existing 99-passing chromium Playwright suite | No regression from FOCUS deletion (CONTEXT.md D-21) |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (no copy changes — locked v1.13 strings preserved)
- [ ] Dimension 2 Visuals: PASS (no visual changes — locked DESIGN.md / DESIGN.json contract preserved)
- [ ] Dimension 3 Color: PASS (no color changes — locked DESIGN.json:colors preserved; existing `bg-[var(--color-surface)]` paints into the new inset region by default)
- [ ] Dimension 4 Typography: PASS (no typography changes — locked DESIGN.json:typography five-roles preserved)
- [ ] Dimension 5 Spacing: PASS (no new tokens — `env()` insets are platform-reported; `1rem` fallback preserves existing chrome gutter)
- [ ] Dimension 6 Registry Safety: PASS (no registry, no third-party blocks, no new dependencies)

**Approval:** pending
