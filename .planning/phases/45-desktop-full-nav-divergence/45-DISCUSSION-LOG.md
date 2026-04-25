# Phase 45: Desktop Full-Nav Divergence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 45-desktop-full-nav-divergence
**Areas discussed:** Splitting strategy, Active-route semantics, Narrow-desktop reflow, Hamburger contents

---

## Splitting strategy (NavShell internals)

### Q1: How should the two render lists be exposed in NavShell.svelte?

| Option | Description | Selected |
|--------|-------------|----------|
| mobile + desktop renamed pair | Rename `visibleCalculators` → `mobileVisibleCalculators` (favorites-driven) and add `desktopVisibleCalculators` (registry-driven, all 5). REQUIREMENTS NAV-ALL-01 explicitly names this shape. Symmetric, self-documenting. | ✓ |
| Keep visibleCalculators + add desktopAllCalculators | Smaller diff — keep existing name unchanged (still mobile/favorites) and just add desktop list. Pro: no rename churn. Con: asymmetric naming hides the divergence. | |
| Inline CALCULATOR_REGISTRY directly into desktop `<nav>` | Skip the second derived value entirely. Pro: minimum code. Con: harder to unit-test the desktop list shape (NAV-ALL-TEST-02). | |

**User's choice:** mobile + desktop renamed pair (Recommended)

### Q2: Should the new desktop list be a `$derived` value or a module-scope const?

| Option | Description | Selected |
|--------|-------------|----------|
| Module-scope const | `CALCULATOR_REGISTRY` is `readonly` and never mutates. `[...CALCULATOR_REGISTRY]` once at module load. Mirrors the existing `byId` Map at NavShell:13. | ✓ |
| $derived value | Wrap in `$derived(CALCULATOR_REGISTRY.slice())` for symmetry. Pro: parallel structure. Con: pointless reactivity. | |

**User's choice:** Module-scope const (Recommended)

---

## Active-route semantics divergence

### Q3: Confirm the divergence — desktop = always-lit, mobile = unchanged?

| Option | Description | Selected |
|--------|-------------|----------|
| Desktop = always-lit, mobile = unchanged | Desktop ALWAYS lights the active tab (since all 5 are rendered). Mobile keeps Phase 41 D-03 (no tab lit if non-favorited). Natural consequence of the divergence. | ✓ |
| Both bars stay "lit only if favorited" | Even on desktop, only light if favorited. Pro: consistent with Phase 41 D-03 verbatim. Con: bizarre on desktop. | |
| Both bars always-lit | Force mobile to always-light too. Con: requires growing a temporary tab (Phase 41 NAV-FAV-03 forbids this). | |

**User's choice:** Desktop = always-lit, mobile = unchanged (Recommended)

### Q4: Should desktop's always-lit behavior change ARIA semantics?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep role=tab + aria-selected on both | Desktop and mobile both stay role="tablist"/role="tab"/aria-selected (Phase 41 D-04 unchanged). | ✓ |
| Desktop migrates to role=navigation + aria-current=page | Treat desktop as a different surface. Pro: matches roadmap success-criterion 3. Con: silently changes screen-reader behavior between mobile and desktop. | |
| Both bars migrate to role=navigation + aria-current=page | Full migration on both. Con: explicit Phase 41 D-04 reversal — would warrant its own phase. | |

**User's choice:** Keep role=tab + aria-selected on both (Recommended)

### Q5: Roadmap success-criterion 3 says `aria-current="page"`; Phase 41 D-04 says `aria-selected`. Which wins?

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 41 D-04 wins — keep aria-selected | Roadmap line was pre-merge guidance superseded by D-04 carve-out. Document override in CONTEXT.md so future audits don't re-litigate. | ✓ |
| Add aria-current=page ALONGSIDE aria-selected | Keep both. Pro: satisfies both texts. Con: dual-semantic noise; ARIA spec discourages mixing tab + current-page roles. | |
| Roadmap wins — migrate to aria-current=page | Treat roadmap as spec. Con: full Phase 41 D-04 reversal as a side-effect of "divergence" phase. | |

**User's choice:** Phase 41 D-04 wins — keep aria-selected, ignore the roadmap mention (Recommended)

---

## Narrow-desktop reflow at 768px

### Q6 (initial): How should the desktop nav reflow at 768px?

The first version of this question listed only padding/label/touch-target tradeoffs. The user pushed back asking about a scrollable navbar — a strong option I had missed. The question was reformulated and re-asked.

**Math walked through:** 5 desktop tabs (icons + labels) ≈ 580px + App name + hamburger + theme button ≈ 240px = ~820px on a 768px viewport → ~54px overflow.

### Q6 (final): How should the desktop nav handle narrow widths?

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll on the desktop nav | `overflow-x-auto`. All 5 tabs render at full padding/label/48px target at every width. Active tab auto-scrolls into view on route change. Right-edge gradient fade hints at scrollable content. Zero compromise on v1.13 visual contract; future-proof. | ✓ |
| Tighten padding px-4 → px-3, gap-2 → gap-1.5 | Shrink to fit at 768px without scroll. Pro: no scroll affordance needed. Con: visual rhythm changes; if 6th calc lands later, this knob is already turned. | |
| Drop the App name on md (768–1023), show on lg+ | Hide "NICU Assist" between 768 and 1023px. Pro: aggressive whitespace reclaim. Con: clinicians lose the app-identity anchor — conflicts with PROJECT.md "clinical confidence". | |
| Drop 48px touch target on desktop (allow 36px) | WCAG AA only requires 24×24 for pointer. Pro: frees horizontal room. Con: CLAUDE.md says "48px touch targets" without breakpoint qualifier — explicit deviation. | |

**User's choice:** Horizontal scroll on the desktop nav (Recommended)

**Notes:** User preferred horizontal scroll because it preserves the v1.13 visual contract at every width, future-proofs against a 6th calc, and keeps the "trust through restraint, no decoration" aesthetic intact (no abbreviations, no hidden app name, no asymmetric touch targets).

### Q7: Should the active tab auto-scroll into view when the route changes?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with `inline: 'nearest', behavior: 'smooth'` | `$effect` finds the active tab and calls `scrollIntoView({ inline: 'nearest', behavior: 'smooth' })`. `nearest` only scrolls if clipped; `smooth` matches calm clinical pacing. ~6 lines. | ✓ |
| Yes, but instant (no `behavior: 'smooth'`) | Same logic with `behavior: 'auto'`. Pro: respects prefers-reduced-motion implicitly. Con: jarring when navigating from hamburger. | |
| No, leave scroll position unmanaged | User scrolls manually. Pro: simplest. Con: clinicians via hamburger to a clipped calc see stale scroll position with no visible active tab. | |

**User's choice:** Yes, with `inline: 'nearest', behavior: 'smooth'` (Recommended)

### Q8: Right-edge gradient fade-out indicator?

| Option | Description | Selected |
|--------|-------------|----------|
| Add fade only when content overflows | 24px wide right-edge gradient (`from-[var(--color-surface)] to-transparent`) appears only when nav is scrollable. Vanishes at ≥1280px. Subtle, professional. | ✓ |
| Always show fade on md+ regardless of overflow | Fade always present on desktop. Pro: simpler CSS. Con: visible at 1280+ where it's meaningless decoration; conflicts with "earn trust through restraint". | |
| Skip the fade — native scrollbar is enough | `scrollbar-width: thin` only. Pro: zero extra UI. Con: native scrollbars nearly invisible on macOS/iPadOS; clinicians may miss the cue. | |

**User's choice:** Add fade only when content overflows (Recommended)

---

## Hamburger contents on desktop

### Q9: Should the per-calc list with star-toggles render on desktop?

| Option | Description | Selected |
|--------|-------------|----------|
| Render hamburger identically on desktop | No conditional rendering. Star-toggle list renders on desktop same as mobile. Pro: zero code change to HamburgerMenu, simplest possible diff. Con: stars are inert on desktop — mitigated because users move between mobile bedside and desktop workstation and want their mobile favorites manageable from anywhere. | ✓ |
| Hide the per-calc list on desktop, show only About + disclaimer | Add `md:hidden` so list doesn't render on md+. Pro: clean desktop hamburger. Con: expands phase scope into HamburgerMenu.svelte. | |
| Show the list with a "manages mobile bottom bar" subtitle | Keep list + add explanatory caption. Pro: educates users. Con: adds copy, still touches HamburgerMenu.svelte, breakpoint-gated. | |

**User's choice:** Render hamburger identically on desktop (Recommended)

---

## Claude's Discretion

- Exact CSS class names for the scroll/fade implementation (Tailwind utility composition vs custom `:global` rule).
- ResizeObserver vs simpler $effect for overflow detection.
- Selector for finding the active tab in the auto-scroll $effect (bind:this array, data-active attribute, or querySelector).
- Test fixture layout for NAV-ALL-TEST-01/02/03 — match existing patterns.

## Deferred Ideas

- Full ARIA migration to role=navigation + aria-current=page on both bars — would warrant its own phase with screen-reader regression testing.
- Per-breakpoint favorites caps (e.g., 6 desktop / 4 mobile) — captured as FAV-FUT-02; not in v1.14.
- Sticky/snap-scroll on the desktop nav — considered and rejected; smooth scrollIntoView is enough.
- Hamburger drawer customization for desktop (hide list / add subtitle) — considered and rejected to keep Phase 45 NavShell-only.
- Hide the hamburger button on desktop — REQUIREMENTS Future Requirements; needs AboutSheet trigger relocation.
- Tighter App name / logo at narrow widths — eliminated by the horizontal-scroll decision.
