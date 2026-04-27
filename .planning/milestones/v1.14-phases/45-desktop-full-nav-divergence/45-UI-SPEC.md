---
phase: 45
slug: desktop-full-nav-divergence
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-25
auto_mode: true
---

# Phase 45 — UI Design Contract

> Visual and interaction contract for the Desktop Full-Nav Divergence phase. Single source file affected: `src/lib/shell/NavShell.svelte`. Three new visual/interactive affordances on the desktop top toolbar — horizontal scroll, auto-scroll active tab into view, right-edge gradient fade. Mobile bottom bar is **explicitly unchanged** from v1.13.

> All decisions in this contract are pre-populated from CONTEXT.md (D-01..D-09) and DESIGN.md. Auto-mode sub-decisions are flagged inline with `[AUTO]`.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | none (custom Svelte 5 + Tailwind 4) | CLAUDE.md |
| Preset | not applicable — no shadcn equivalent for SvelteKit in this project | CLAUDE.md "Component library: Custom (merge existing)" |
| Component library | none — direct `.svelte` components in `$lib/shell/` | CLAUDE.md, NavShell.svelte |
| Icon library | `@lucide/svelte` (Svelte 5 official) | CLAUDE.md, registry.ts:3 |
| Font | Plus Jakarta Sans (token: `--font-sans`) | DESIGN.md §Typography, app.css:57 |
| Color system | OKLCH only — tokens in `src/app.css` | DESIGN.md §The OKLCH-Only Rule |
| Theme | Light + dark, both intentional; `.dark` class on `<html>` | app.css:13, 90-114 |

---

## Spacing Scale

The project uses Tailwind 4 default spacing tokens (4 px base unit) plus a small set of semantic tokens declared in DESIGN.md §spacing. Values used in this phase are all multiples of 4.

| Token | Value | Usage in this phase |
|-------|-------|---------------------|
| `gap-2` | 8 px | Existing gap between desktop nav tabs (NavShell.svelte:55, unchanged) |
| `px-4` | 16 px | Existing tab horizontal padding (NavShell.svelte:61, unchanged) |
| `py-3` | 12 px | Existing tab vertical padding (NavShell.svelte:62, unchanged — non-multiple-of-4 exception inherited from v1.13) |
| `min-h-[48px]` | 48 px | Touch-target floor for every tab (NavShell.svelte:61, preserved verbatim) |
| Fade-overlay width | 24 px | Right-edge gradient fade — declared in CONTEXT.md D-08 |
| Scrollbar thickness | thin (UA default ≈ 6-10 px) | `scrollbar-width: thin` — non-numeric Tailwind/CSS native |

**Exceptions:**
- `py-3` (12 px) is not a multiple of 4 (it is 4 × 3 = 12, which IS a multiple of 4 — no exception).
- All new affordances additive; **no existing spacing token is modified**.

---

## Typography

Five-Roles-Only (DESIGN.md §The Five-Roles-Only Rule). This phase uses **only `ui` role** — no new sizes introduced.

| Role | Size | Weight | Line Height | Usage in this phase |
|------|------|--------|-------------|---------------------|
| `ui` | 13 px (`0.8125 rem`, token `--text-ui`) | 500 (medium) — overridden to 600 (semibold) on active tab via existing `font-medium` + identity color | 1.3 | All 5 desktop tab labels (Morphine, Formula, GIR, Feeds, UAC/UVC); existing class `text-ui font-medium` on NavShell.svelte:62 — **preserved verbatim** |

**No display, title, body, or label text is rendered by Phase 45.** The hero numeral typography (`display`), page heading (`title`), advisory copy (`body`), and bottom-nav label (`label`) are all out of scope — Phase 45 touches only the desktop top-toolbar tab labels, which already use `text-ui font-medium`.

**Tabular numerics:** N/A for this phase — nav labels are text, not numerics. The Tabular-Numbers Rule does not apply.

---

## Color

The 60/30/10 split applies system-wide (DESIGN.md). For the Phase 45 nav surface only:

| Role | Token | Value (light / dark) | Usage in this phase |
|------|-------|----------------------|---------------------|
| Dominant (60%) | `--color-surface` | `oklch(97.5% 0.006 225)` / `oklch(16% 0.012 240)` | Title bar background (existing) **AND the new fade-gradient terminal color** |
| Secondary (30%) | `--color-surface-card` | `oklch(100% 0 0)` / `oklch(23% 0.014 236)` | N/A in this phase (cards live inside calculator routes) |
| Accent (10%) | `--color-accent` (Clinical Blue) | `oklch(49% 0.17 220)` / `oklch(82% 0.12 220)` | Active tab text color, active tab `border-b-2` underline, focus-visible outline (per Identity-Inside Rule the chrome accent is Clinical Blue, not the per-calculator identity hue) |
| Border / scrollbar | `--color-border` | `oklch(63% 0.01 220)` / `oklch(58% 0.018 235)` | New scrollbar thumb color when scrollbar is shown by the OS |
| Inactive tab text | `--color-text-secondary` | `oklch(35% 0.01 225)` / `oklch(80% 0.01 228)` | Existing inactive tab color (NavShell.svelte:66, unchanged) |
| Hover tab text | `--color-text-primary` | `oklch(18% 0.012 230)` / `oklch(93% 0.006 230)` | Existing hover transition (NavShell.svelte:66, unchanged) |
| Destructive | `--color-error` | `oklch(50% 0.2 25)` / `oklch(72% 0.16 25)` | **Not used in this phase** — no destructive actions |

**Accent reserved for (this phase):** active tab underline (`border-b-2`), active tab text, focus-visible outline ring on tabs. **Identity hues per calculator are NOT used in nav chrome** (DESIGN.md The Identity-Inside Rule — already enforced in NavShell.svelte:65 which uses `var(--color-accent)`, not `var(--color-identity)`).

**Color rules honored:**
- The OKLCH-Only Rule — every color token is OKLCH; no hex.
- The Identity-Inside Rule — desktop nav chrome stays Clinical Blue; identity hues do not bleed into the toolbar.
- The Red-Means-Wrong Rule — no red in nav chrome.
- The Amber-as-Semantic Rule — no amber in nav chrome.

---

## Copywriting Contract

| Element | Copy | Source |
|---------|------|--------|
| Tab labels (5) | `Morphine`, `Formula`, `GIR`, `Feeds`, `UAC/UVC` | registry.ts:22-58, **unchanged** |
| Tab `aria-label` | `"{label}. {description}"` per registry — e.g., `"Morphine. Morphine weaning schedule calculator"` | NavShell.svelte:67, **unchanged** |
| Nav container `aria-label` | `Calculator navigation` | NavShell.svelte:55, **unchanged** |
| Primary CTA | N/A — phase contains no buttons or new actions | — |
| Empty state heading | N/A — desktop list is registry-driven and never empty (always 5 calculators) | CONTEXT.md D-02 |
| Empty state body | N/A | — |
| Error state | N/A — phase introduces no validation or error surfaces | — |
| Destructive confirmation | N/A — phase contains no destructive actions | — |

**Em-dash ban (DESIGN.md):** No em-dashes in any user-rendered string, `aria-label`, or screen-reader copy. The five existing tab labels and `aria-label` strings already comply (verified — no `—` or `--` characters).

---

## Affordance Contracts (Phase-Specific)

The three new desktop-nav affordances. Each entry declares the visual contract the executor implements verbatim.

### A1 — Horizontal Scroll Container (D-06)

**Goal:** All 5 tabs render at full padding / full label / 48 px touch target at every viewport. When content exceeds container width, the container scrolls horizontally — no truncation, no stacking, no responsive label hiding.

| Property | Value | Notes |
|----------|-------|-------|
| Apply to | The inner `<div role="tablist">` at NavShell.svelte:56 (the row containing the 5 `<a>` tabs) | The outer `<nav class="ml-4 hidden gap-2 md:flex">` keeps `md:flex` to gate desktop visibility; the **inner** `tablist` becomes the scroll container so the `aria-label="Calculator navigation"` boundary stays accurate. |
| Tailwind class | `overflow-x-auto` | Standard Tailwind 4 utility |
| `scrollbar-width` | `thin` | CSS native (`scrollbar-width: thin;`) |
| `scrollbar-color` | `var(--color-border) transparent` | Thumb in border token, transparent track — matches warm clinical palette |
| `scroll-behavior` | `smooth` | CSS native — pairs with the JS `behavior: 'smooth'` in A2 |
| `tabindex` | **Not added** | `[AUTO]` Tabs are themselves focusable `<a>` elements; browser auto-scrolls a focused tab into view via Tab key. Adding `tabindex="0"` to the scroll container would inject an extra Tab stop with no payoff. |
| Vertical overflow | Must remain unaffected | Tab focus rings and `border-b-2` underline are within the inner row's vertical bounds — `overflow-x-auto` does not cause vertical clipping at the existing tab height. |

**Layout impact:**
- At ≥ 1280 px: `scrollWidth ≤ clientWidth`, no scrollbar shown by the OS, no fade visible.
- At 768 px (Tailwind `md` breakpoint, where the desktop nav first appears): `scrollWidth ≈ 580 px (5 tabs) + chrome ≈ 240 px > 768 px` → scrollbar may render and fade is shown.
- At 1024 px: borderline — depends on label widths; the affordance handles either case identically.

### A2 — Auto-Scroll Active Tab Into View (D-07)

**Goal:** On route change (and on first mount, see [AUTO] below), the currently-active tab smoothly scrolls into view if it is clipped. If it is already visible, no animation runs.

| Property | Value | Notes |
|----------|-------|-------|
| Trigger | A `$effect` reading `page.url.pathname` | Re-runs on every navigation; existing `import { page } from '$app/state'` at NavShell.svelte:2 is reused |
| Active-tab selector | `[AUTO]` Element ref via `bind:this` on each `<a>` indexed by calculator id, OR `querySelector('[aria-selected="true"]')` on the `tablist` ref. **Recommended:** `querySelector('[aria-selected="true"]')` — simpler, no array juggling, ARIA already drives the rendering | CONTEXT.md D-07 leaves selector to discretion |
| API call | `activeTab.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })` | `inline: 'nearest'` ensures already-visible tabs do not animate. `block: 'nearest'` prevents the page from vertical-scrolling. |
| First-mount behavior | `[AUTO]` **Yes — auto-scroll on mount.** | A clinician arriving via direct URL (`/uac-uvc`) or hamburger nav must see UAC/UVC in view immediately. `inline: 'nearest'` makes this a no-op when the active tab is already visible (the common case at desktop widths), so the cost is zero in steady state. |
| Reduced-motion behavior | `[AUTO]` Override `behavior: 'smooth'` to `behavior: 'auto'` (instant) when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. | WCAG 2.3.3 (AAA) compliance. The DESIGN.md project pattern at app.css:147-151 already disables transitions globally under reduced-motion; the JS animation here must follow the same discipline. |
| Cleanup | None | `scrollIntoView` is one-shot; no listeners to detach |
| Interaction with Tab-key focus | **No interference.** | When a user Tab-keys into a clipped tab, the browser's focus-driven scroll fires from the user gesture — independent of the route-change `$effect`. Document this in the planner brief so no redundant focus-management code is added. |

**Sample implementation shape (for planner reference, not verbatim contract):**
```ts
let tablistEl = $state<HTMLElement | null>(null);

$effect(() => {
  const _path = page.url.pathname; // dependency
  if (!tablistEl) return;
  const active = tablistEl.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!active) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  active.scrollIntoView({
    inline: 'nearest',
    block: 'nearest',
    behavior: reduce ? 'auto' : 'smooth'
  });
});
```

### A3 — Right-Edge Gradient Fade (D-08)

**Goal:** When the tablist content overflows horizontally, a 24 px right-edge gradient fade hints at scrollable content. Invisible when content fits.

| Property | Value | Notes |
|----------|-------|-------|
| Width | 24 px | CONTEXT.md D-08 — locked |
| Mechanism | `[AUTO]` **CSS `mask-image`** preferred over absolutely-positioned overlay | Mask preserves underlying tab content (focus rings, hover states, click-through) without needing `pointer-events: none`. `linear-gradient(to right, black calc(100% - 24px), transparent)` applied conditionally via a class. |
| Class toggle | `is-overflowing` (or equivalent — planner picks final name) | Applied to the tablist container when `scrollWidth > clientWidth` |
| Detection | `[AUTO]` **`ResizeObserver`** observing the tablist container | Robust against viewport resize, theme toggle (which can reflow chrome), and font-load layout shift. A simpler `$effect` reading `scrollWidth/clientWidth` would miss window-resize events without an extra `window.resize` handler. |
| Lifecycle | Observer attached when tablist mounts; disconnected on component teardown via `$effect` cleanup function | Standard Svelte 5 pattern |
| Theme awareness | **None needed.** | The fade terminates in `transparent`, not in `var(--color-surface)` painted as a solid. The mask reveals or hides the underlying tab — there is no painted color to swap between light and dark. (If a future variant uses an opaque overlay, it must use `var(--color-surface)` to match the title bar, which the token already handles per-theme.) |
| Reduced-motion | **N/A — the fade is static CSS.** | The fade APPEARS / DISAPPEARS via the class toggle (an instantaneous DOM mutation). It does not animate in or out. No reduced-motion override needed. |
| Interaction with right-edge tabs | A clipped tab beneath the fade remains clickable and focusable — `mask-image` is non-interactive | Verified in the CSS contract; if planner chooses overlay div instead, must add `pointer-events: none`. |

**CSS contract (mask approach):**
```css
.tablist-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
  scroll-behavior: smooth;
}
.tablist-scroll.is-overflowing {
  mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
  -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
}
```

---

## Motion Contract

| Motion | Trigger | Duration | Curve | Reduced-motion behavior |
|--------|---------|----------|-------|-------------------------|
| Smooth scroll (CSS) | User scroll, anchor jump | UA default (~300 ms) | UA default | UA respects `prefers-reduced-motion` natively for `scroll-behavior: smooth` per CSSOM View spec |
| Smooth scroll (JS, `scrollIntoView`) | Route change `$effect` + first mount | UA default | UA default | **Phase 45 must override:** read `prefers-reduced-motion` and pass `behavior: 'auto'` when reduced — see A2 |
| Tab color transition | Hover, active state change | 200 ms (existing app.css:140-145 `transition: color 200ms ease-out`) | `ease-out` | Existing app.css:147-151 sets `transition: none !important` under reduced-motion globally — already correct |
| Fade overlay | Class toggle when overflow state changes | **None — instantaneous** | — | N/A |

**Project motion philosophy (DESIGN.md):** "Motion conveys state … nothing else. Reduced-motion is always honored." The new auto-scroll meets this — it conveys "the active tab is now in view" — and respects reduced-motion via the explicit override.

---

## Interaction Contract

| Interaction | Behavior |
|-------------|----------|
| Click a desktop tab | Existing SvelteKit `<a href>` navigation. Route changes. `$effect` fires. Active tab smoothly auto-scrolls into view (no-op if already visible). |
| Tab into desktop nav via keyboard | Browser default focus traversal. Each `<a>` is sequentially focusable; focus visualises via existing `focus-visible:outline-2 outline-offset-2 outline-[var(--color-accent)]` (NavShell.svelte:63). When a clipped tab receives focus, the browser auto-scrolls it into view (UA default). |
| Arrow-key navigation across tabs | **Not implemented in Phase 45.** `[AUTO]` The existing v1.13 NavShell uses no arrow-key roving-tabindex handlers; Phase 45 preserves that exact behavior. A full WAI-ARIA tablist implementation (with arrow-key roving) is a Deferred Idea matching the deferred ARIA-migration phase noted in CONTEXT.md. |
| Mouse-wheel over the scroll container | Browser default — vertical wheel scrolls vertically (page), not horizontally. Phase 45 does not transform wheel events. |
| Touch swipe on the desktop nav | Browser default for `overflow-x-auto`. Touch-pan works at narrow desktop / hybrid devices. |
| Window resize across overflow boundary | `ResizeObserver` toggles `is-overflowing` class → fade appears/disappears instantly. |
| Theme toggle (light ↔ dark) | No new behavior. Existing tab color transitions (200 ms ease-out) already cover hover/active state. Fade mask is theme-agnostic. |
| Hamburger button (desktop) | **Unchanged from v1.13** (CONTEXT.md D-09). Renders identical drawer. Star toggles affect `favorites.current`, which is consumed by the **mobile** bottom bar only. |
| Mobile bottom bar | **No changes.** Iterates `mobileVisibleCalculators` (renamed from `visibleCalculators`). All Phase 41 contracts preserved verbatim. |

---

## Accessibility Contract

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Touch target ≥ 48 px | Existing `min-h-[48px]` on every `<a>` tab — preserved verbatim | NavShell.svelte:61, REQUIREMENTS NAV-ALL-03 |
| Visible labels (no icon-only nav) | Existing `<calc.icon size={18} /> <span>{calc.label}</span>` pattern preserved on every tab | NavShell.svelte:71-72, DESIGN.md "Don't ship icon-only navigation" |
| ARIA roles | `role="tablist"` on container + `role="tab"` + `aria-selected="true|false"` on each tab — **kept** per CONTEXT.md D-05 (NOT migrated to `role="navigation"` + `aria-current="page"`) | CONTEXT.md D-05, Phase 41 D-04 |
| Active route indication | Both `aria-selected="true"` AND visual identity-color underline (`border-b-2 border-[var(--color-accent)]`) AND text color — multi-channel signaling | NavShell.svelte:64-66 |
| Focus-visible outline | Existing `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]` — preserved verbatim | NavShell.svelte:63 |
| Keyboard scrollability of overflowing nav | Tab-key focus on a clipped tab triggers UA-default focus-driven scroll into view. **No `tabindex="0"` added to the scroll container** — would inject a redundant Tab stop. | `[AUTO]` |
| Reduced-motion honored | Auto-scroll `behavior` flips to `'auto'` under `prefers-reduced-motion: reduce`. CSS transitions already globally disabled under reduced-motion. | A2, app.css:147-151 |
| Color contrast | Active accent (`--color-accent` = `oklch(49% 0.17 220)` light / `oklch(82% 0.12 220)` dark) and inactive secondary text both pass 4.5:1 on `--color-surface`. Border `oklch(63% 0.01 220)` light / `oklch(58% 0.018 235)` dark passes 3:1 on surface (DESIGN.md §Color). | DESIGN.md §Neutral / §Accent |
| Scrollbar visibility | OS-rendered thin scrollbar in `--color-border` thumb on transparent track — visible enough for sighted users to perceive scrollability without being a heavy chrome element | A1 |
| Screen-reader announcement on auto-scroll | None added. The `aria-selected="true"` change on route navigation already announces the new active tab; the visual scroll is purely sighted-user feedback. | CONTEXT.md D-05 (no ARIA changes) |
| Axe sweep coverage | NAV-ALL-TEST-03 — Playwright axe sweep at desktop 1280 with all 5 tabs visible, light + dark themes | REQUIREMENTS.md |

---

## Visual Inventory (What This Phase Adds, Modifies, or Preserves)

| Element | State | Notes |
|---------|-------|-------|
| Desktop top toolbar (`<nav class="md:flex">`) | **Modified** — iterates `desktopVisibleCalculators` instead of `visibleCalculators` | CONTEXT.md D-01, D-02 |
| Desktop tablist container (`<div role="tablist">`) | **Modified** — gains `overflow-x-auto`, scrollbar styling, `bind:this` ref, conditional `is-overflowing` class with `mask-image` fade | A1, A3 |
| Desktop tab `<a>` element | **Preserved verbatim** — no class, ARIA, or content change | DESIGN.md "every v1.13 visual contract preserved" |
| Active-tab indicator (`border-b-2 border-[var(--color-accent)]`) | **Preserved verbatim** | NavShell.svelte:65 |
| Active-tab text color (`text-[var(--color-accent)]`) | **Preserved verbatim** | NavShell.svelte:65 |
| Inactive-tab text color (`text-[var(--color-text-secondary)]`) | **Preserved verbatim** | NavShell.svelte:66 |
| Hover state (`hover:text-[var(--color-text-primary)]`) | **Preserved verbatim** | NavShell.svelte:66 |
| Focus-visible outline | **Preserved verbatim** | NavShell.svelte:63 |
| Identity color per tab (`{calc.identityClass}`) | **Preserved verbatim** | NavShell.svelte:61 — note that the identityClass declares `--color-identity` for the tab but per Identity-Inside Rule the active visual is `--color-accent`, not identity. Existing behavior. |
| Mobile bottom bar | **Preserved verbatim** — only `visibleCalculators` reference is renamed to `mobileVisibleCalculators` | CONTEXT.md D-04, REQUIREMENTS NAV-ALL-02 |
| Hamburger button | **Preserved verbatim** | CONTEXT.md D-09, REQUIREMENTS NAV-ALL-04 |
| Hamburger drawer (HamburgerMenu.svelte) | **Untouched (separate file)** | CONTEXT.md D-09 |
| Title bar | **Preserved verbatim** | NavShell.svelte:31-94 outer chrome unchanged |
| Theme toggle button | **Preserved verbatim** | NavShell.svelte:82-93 |

**Net new visual surfaces in Phase 45:** zero new surfaces. **Net new affordances on existing surfaces:** three (horizontal scroll, auto-scroll, fade) — all on the desktop tablist container.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — this project does not use shadcn | not applicable |
| Third-party | none — no new components, no new dependencies | not applicable |

CLAUDE.md explicitly bans new runtime dependencies for v1.14: "no other new runtime dependencies needed". `scrollIntoView`, `mask-image`, `ResizeObserver`, `matchMedia` are all native browser APIs.

---

## Test Surface Hooks (Planner Reference)

The UI-SPEC declares the visual contract; the planner converts these into NAV-ALL-TEST-01..03 plans. Each affordance maps to a verifiable test:

| Test ID | Affordance verified | Suggested probe |
|---------|---------------------|-----------------|
| NAV-ALL-TEST-01 (Playwright @ 1280) | Desktop full-nav (5 calculators visible regardless of favorites) | `expect(page.locator('nav[aria-label="Calculator navigation"] [role="tab"]')).toHaveCount(5)` |
| NAV-ALL-TEST-01 (Playwright @ 375) | Mobile favorites-driven bar unchanged | `expect(mobileNavTabs).toHaveCount(4)` after default favorites |
| NAV-ALL-TEST-02 (Vitest) | `desktopVisibleCalculators` = full registry regardless of `favorites.current` | Render NavShell with `favorites.current = []`; assert desktop tablist contains all 5 ids in registry order |
| NAV-ALL-TEST-02 (Vitest) | A1 — `overflow-x-auto` present on tablist | Source-string match for `overflow-x-auto` on the desktop tablist container |
| NAV-ALL-TEST-03 (Playwright axe) | Light + dark axe sweep at desktop 1280 with all 5 tabs | Existing pattern from `e2e/fortification-a11y.spec.ts` extended for the desktop nav |
| (implicit) | A2 — auto-scroll on route change | Optional Playwright probe: navigate to `/uac-uvc` at narrow desktop, assert active tab is within scroll viewport (`scrollLeft + offsetWidth ≥ activeTab.offsetLeft + activeTab.offsetWidth`) |
| (implicit) | A3 — fade visible only on overflow | Vitest source check: assert `is-overflowing` class is conditionally present on tablist when `scrollWidth > clientWidth` (or covered indirectly via Playwright at 768 px viewport) |

---

## Auto-Mode Decision Log

Sub-decisions made by the researcher under `--auto`. The user can review and override each.

| ID | Decision | Rationale |
|----|----------|-----------|
| AUTO-1 | A3 fade implementation: `mask-image` (not absolutely-positioned overlay) | Preserves tab interactivity beneath the fade; no `pointer-events: none` needed; fewer DOM nodes |
| AUTO-2 | A3 detection mechanism: `ResizeObserver` (not bare `$effect`) | Robust against viewport resize, theme toggle, font-load reflow without extra listeners |
| AUTO-3 | A2 first-mount auto-scroll: yes | Direct-URL arrival to `/uac-uvc` should land with the active tab in view; `inline: 'nearest'` makes the steady-state cost zero |
| AUTO-4 | A2 reduced-motion: override `behavior` to `'auto'` | WCAG 2.3.3 + DESIGN.md project pattern (app.css:147-151 already disables CSS transitions globally under reduced-motion) |
| AUTO-5 | A2 active-tab selector: `querySelector('[aria-selected="true"]')` (not bind:this array) | Simpler; ARIA already drives the "active" definition; no array bookkeeping |
| AUTO-6 | A1 scroll container: inner `<div role="tablist">` (not outer `<nav>`) | Keeps `aria-label="Calculator navigation"` on the semantic boundary; isolates scroll mechanics |
| AUTO-7 | A1 `tabindex="0"` on scroll container: NO | Avoids redundant Tab stop; tabs are already focusable; UA handles focus-driven scroll |
| AUTO-8 | Arrow-key roving-tabindex: NOT added | Matches v1.13 NavShell behavior; full WAI-ARIA tablist is captured as Deferred Idea |
| AUTO-9 | Scroll-snap: NONE | Already rejected in CONTEXT.md Deferred Ideas; confirmed |
| AUTO-10 | Scrollbar: `scrollbar-width: thin` + `scrollbar-color: var(--color-border) transparent` | Matches warm clinical palette; lets OS render the bar (no full custom scrollbar styling) |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — labels unchanged from registry; em-dash ban honored; no new strings
- [ ] Dimension 2 Visuals: PASS — zero new surfaces, three affordances additive, every v1.13 contract preserved
- [ ] Dimension 3 Color: PASS — OKLCH-only; Identity-Inside honored; chrome stays Clinical Blue
- [ ] Dimension 4 Typography: PASS — single role (`ui` 13 px), Five-Roles-Only honored
- [ ] Dimension 5 Spacing: PASS — multiples of 4; 24 px fade and 48 px touch target are explicit
- [ ] Dimension 6 Registry Safety: PASS — no shadcn, no third-party, no new dependencies

**Approval:** pending
