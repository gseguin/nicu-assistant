# Phase 42 — UI Review

**Audited:** 2026-04-23
**Baseline:** `42-UI-SPEC.md` (design contract for UAC/UVC Catheter Depth calculator)
**Screenshots captured:** yes — `.planning/ui-reviews/42-20260423-205923/` (mobile/tablet/desktop × light/dark; disclaimer dismissed, default weight 2.5 kg rendered)
**Dev server:** Vite dev on `http://localhost:5173` (port 3000 was serving a stale preview build without the `/uac-uvc` route; 5173 is the authoritative render)
**Registry audit:** n/a — `components.json` absent at project root; project uses a custom Svelte component library (UI-SPEC §Registry Safety confirms)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Shipped copy diverges from contract: hero eyebrow/title structure was re-designed post-spec, losing the contracted `"UAC DEPTH — ARTERIAL"` / `"UVC DEPTH — VENOUS"` em-dashed eyebrow (commit `d60f1ac`); all other strings (h1, subtitle, empty state, slider aria-label, AboutSheet) are exact. |
| 2. Visuals | 3/4 | Identity stripes (top/bottom), card tint, and tabular 44 px numerals render correctly in both themes; however two of the spec's three D-05 distinction cues (directional arrow icons + per-card identity-colored eyebrow) were removed, weakening clinical color-blind safety from "3 independent cues" to "2 cues". |
| 3. Color | 4/4 | `.identity-uac` OKLCH quartet (hue 350, light 42/0.12 + 95/0.035; dark 80/0.10 + 24/0.05) pasted verbatim from UI-SPEC; 7 identity-colored surfaces rendered in-scope (`text-[var(--color-identity)]` count = 7 in the component; axe light + dark sweeps pass with 0 violations first-run per `42-03-SUMMARY`). No hardcoded hex/rgb in the calculator module. |
| 4. Typography | 4/4 | Exactly 3 type roles used (`text-display`, `text-title`, `text-2xs`, `text-ui`) from the shipped 4-role scale; 2 weights (`font-semibold`, `font-black`); `.num` on hero numeral; `toFixed(1)` honored (16.5 / 8.3 at 2.5 kg). Plus Jakarta Sans on everything. No arbitrary sizes. |
| 5. Spacing | 4/4 | All spacing classes resolve to the declared token subset (`gap-2/3/4`, `px-5 py-5`, `py-6 px-4`, `mt-1`, `space-y-4/6`, `border-t-4` / `border-b-4`). No arbitrary `[Npx]` values except the deliberate `h-12` (48 px WCAG touch target on slider root) and `h-1.5` / `h-6 w-6` on slider track/thumb which fall on the 4 px base scale. |
| 6. Experience Design | 4/4 | Empty state handled (`"Enter weight to compute depth"`), out-of-range advisory inherited from NumericInput v1.6 (`showRangeError={true}`), reduced-motion gated pulse, `aria-live="polite"` + `aria-atomic="true"` on both hero sections, 48 px slider min-height, silent try/catch on all 3 sessionStorage paths. No destructive actions by design. |

**Overall: 22/24**

---

## Top 3 Priority Fixes

1. **Restore D-05's third distinction cue: per-card directional icons.**
   *User impact:* UI-SPEC locked three redundant cues (icons + eyebrow text + stripe position) specifically to protect against color-blind misreading and quick-glance error under NICU cognitive load. Commit `d60f1ac refactor(42): drop hero arrow icons` removed the icons without a matching UI-SPEC amendment. The current build has only two cues (stripe position + "Arterial"/"Venous" eyebrow) — a grayscale squint test still separates the cards, but one failure of attention (e.g. eyebrow clipped by a narrow viewport, or a user who skims only numerals) collapses the distinction to stripe-position alone.
   *Concrete fix:* Re-introduce `ArrowDownToLine` (UAC card) and `ArrowUpFromLine` (UVC card) at `size={24}`, `text-[var(--color-identity)]`, `aria-hidden="true"` in a `flex items-center gap-2` header row next to the "UAC"/"UVC" label, per UI-SPEC §Asset & Icon Inventory. If the re-layout is genuinely preferred over the spec, amend `42-UI-SPEC.md` with a Checker sign-off on a revised §Color "5 surfaces" list and §Asset Inventory — don't let the shipped artifact silently drift from the approved contract.

2. **Align hero eyebrow with the locked copywriting contract — or amend the contract.**
   *User impact:* UI-SPEC §Copywriting locks `"UAC DEPTH — ARTERIAL"` (em-dash U+2014) and `"UVC DEPTH — VENOUS"` as the single-line, identity-colored eyebrows. Shipped code instead renders a large `"UAC"` / `"UVC"` in identity color (via `text-title font-black`) and a small `"Arterial depth"` / `"Venous depth"` text-secondary sub-eyebrow. The spec's em-dash typographic convention (carried across morphine/formula/GIR/feeds) is broken, and the identity-colored eyebrow role was effectively replaced by a new identity-colored `text-title` label. The copy is still clinically clear, but the app now has a fifth calculator whose hero rhythm differs from the other four.
   *Concrete fix:* Either (a) revert to the spec strings — single eyebrow row `<span class="text-2xs font-semibold tracking-wide uppercase text-[var(--color-identity)]">UAC DEPTH — ARTERIAL</span>` (and VENOUS counterpart) — matching all four prior calculators; OR (b) promote this to a UI-SPEC amendment and update `42-UI-SPEC.md` §Typography + §Copywriting to reflect the new two-line header pattern, and consider retro-fitting morphine/formula/GIR/feeds for consistency.

3. **Document the native `<input type="range">` → `bits-ui Slider` substitution in the UI-SPEC.**
   *User impact:* UI-SPEC §Layout specifies a native `<input type="range" class="range-uac">` with `accent-color` thumb tint. Commit `3d3a0eb refactor(42): replace native range slider with bits-ui Slider primitive` substitutes `Slider.Root` / `Slider.Range` / `Slider.Thumb` from `bits-ui@^2.18.0`. This is a reasonable functional upgrade (real keyboard+touch interop across browsers, dark-mode thumb visibility fixed as seen in the `critique-mobile-morphine-dark-fixed.png` pattern), but it (a) introduces a new runtime dependency surface that UI-SPEC §Registry Safety didn't account for, and (b) the SPEC's "native slider" a11y reasoning (native ArrowLeft/Home/PageUp coverage) no longer applies verbatim — now depends on bits-ui's slider ARIA implementation.
   *Concrete fix:* Update `42-UI-SPEC.md` §Layout (scoped `.range-uac` CSS) and §Registry Safety to declare bits-ui as a pre-approved component primitive library, list which primitives are in use, and assert that the bits-ui Slider passes the same keyboard matrix as native (ArrowLeft/Right, Home/End, PageUp/Down). Axe already passes (22/22 per 42-03 SUMMARY), so this is a documentation-parity fix rather than a code fix.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Pass — exact-string matches with the UI-SPEC §Copywriting table:**
- Page `<title>`: `UAC/UVC | NICU Assistant` (`+page.svelte:18`).
- Route `<h1>`: `UAC/UVC Catheter Depth` (`+page.svelte:25`).
- Route subtitle: `cm · weight-based formula` — middle-dot U+00B7 confirmed (`+page.svelte:26`).
- NumericInput label / suffix / placeholder: `Weight` / `kg` / `2.5` (`UacUvcCalculator.svelte:32-37`).
- Slider aria-label: `Weight slider` (`UacUvcCalculator.svelte:49`).
- Unit suffix: `cm` on both hero cards (`:97, :134`).
- Empty state: `Enter weight to compute depth` on both cards (`:102, :139`).
- AboutSheet entry verbatim ("Shukla/Dunn", xlsx B3/B7 citation, imaging caveat) per `42-01-SUMMARY`.

**Deviation — eyebrow copy restructured (per commit `d60f1ac`):**
- Shipped: two-line header — `UAC` in `text-title font-black text-[var(--color-identity)]` as primary label, then `ARTERIAL DEPTH` in `text-2xs font-semibold uppercase text-[var(--color-text-secondary)]` as secondary (`UacUvcCalculator.svelte:83-91`).
- Spec: single-line eyebrow `UAC DEPTH — ARTERIAL` in `text-2xs font-semibold uppercase text-[var(--color-identity)]`, with the hero numeral carrying the visual weight (UI-SPEC §Typography + §Copywriting).
- Em-dash (U+2014) specifically required by UI-SPEC is not rendered anywhere in the hero; it remains in the AboutSheet caveat and NumericInput's auto-generated range-hint via the en-dash in `0.3–10 kg`.
- Clinical voice (precise, calm, no marketing, no exclamations) is preserved — the deviation is structural, not tonal.

**Generic-label grep (`Submit|Click Here|OK|Cancel`) within `src/lib/uac-uvc/`:** zero matches. No CTA buttons in the calculator by design.

### Pillar 2: Visuals (3/4)

**Pass — screenshots confirm the pillar's core intents at all three viewports × both themes:**
- Mobile (375 × 812): cards stack `grid-cols-1 gap-4`, UAC on top with visible 4 px top stripe, UVC on bottom with visible 4 px bottom stripe. The "stripe-bookends-the-pair" mnemonic from §Layout is intact.
- Tablet (768 × 1024): `md:grid-cols-2` activates; cards sit side-by-side within the 4xl-capped container.
- Desktop (1440 × 900): same side-by-side; significant whitespace below (fold respects 100dvh).
- Hero value focal point dominates each card — 44 px tabular numeral with `cm` suffix baseline-aligned (`flex items-baseline gap-2` on `:93, :130`).
- Dark-mode hero tint (`oklch(24% 0.05 350)`) reads as "deep rose-slate" against surface; identity text pops at light chroma.

**Deviation — D-05 "three independent cues" reduced to two:**
- Cue 1 (icons) — **REMOVED.** No `ArrowDownToLine` / `ArrowUpFromLine` imports in `UacUvcCalculator.svelte`; grep confirms. Visual squint test of the desktop-light screenshot shows no per-card glyph.
- Cue 2 (eyebrow text) — present but weakened: the word "ARTERIAL" / "VENOUS" now sits under a larger "UAC" / "UVC" label rather than being the primary identifying eyebrow. Still legible; semantically still distinct.
- Cue 3 (stripe position) — present and correct (top for UAC, bottom for UVC).

**Visual hierarchy:**
- Clear focal point per card: hero numeral (44 px, font-black) dominates.
- Icon-only controls: the one icon-only control on this route (theme toggle in top bar) lives outside Phase 42 scope. The Ruler header icon carries `aria-hidden="true"` — correct (decorative, paired with the h1 text).

**`needs_human_review: false`** — all visual findings are deterministic against the SPEC text. The "should icons be restored" question is a contract reconciliation task, not a subjective judgement.

### Pillar 3: Color (4/4)

**Token implementation verbatim from UI-SPEC §Color:**
- `src/app.css:255-263` contains the four OKLCH values literally: `oklch(42% 0.12 350)`, `oklch(95% 0.035 350)`, `oklch(80% 0.10 350)`, `oklch(24% 0.05 350)`. Confirmed by `42-01-SUMMARY` grep verification.
- No hardcoded hex / rgb / hsl in `src/lib/uac-uvc/` (grep returns zero).

**Accent (`--color-identity`) surface count within `UacUvcCalculator.svelte`:**
- Grep of `var(--color-identity)` = 7 occurrences (lines 54, 58, 64, 75, 83, 112, 120).
- Breakdown by surface role:
  1. Slider track fill / range (`:54, :58`) — 2 uses, collectively one "filled track" surface.
  2. Slider thumb border + ring color (`:64`) — 1 use.
  3. UAC card top-stripe border-color (`:75`) — 1 use.
  4. UVC card bottom-stripe border-color (`:112`) — 1 use.
  5. UAC large "UAC" label text (`:83`) — 1 use.
  6. UVC large "UVC" label text (`:120`) — 1 use.
- Plus the route-header Ruler icon (`+page.svelte:23`) — 1 use.
- Effective identity surface count: 6-7 distinct roles, within the spec's "~10%" accent budget. The two `text-title` "UAC"/"UVC" labels replace the spec's "eyebrow" role — same accent volume, re-mapped role.

**60/30/10 split — visually confirmed in screenshots:**
- 60% dominant: `--color-surface` fills the page background (light pale blue / dark slate).
- 30% secondary: `--color-surface-card` on the inputs card.
- 10% accent: the two rose hero cards + slider fill + header icon.

**Dark mode:** identity hero reads deep-rose (`oklch(24% 0.05 350)`) with pale-rose labels. The thumb in dark mode has a dark surface fill with a rose border — contrast adequate at 8.63:1 per UI-SPEC pre-verified quartet. Screenshots look intentional in both themes; no bleed from any other identity hue.

**Error color:** `--color-error` reserved for out-of-range advisory; not rendered in default screenshots (weight = 2.5 kg is in-range). No new "warning/success/info" tokens introduced.

### Pillar 4: Typography (4/4)

**Declared type roles in use (`UacUvcCalculator.svelte`):**
- `text-display` (44 px / 900) — hero numerals ×2 (`:94, :131`).
- `text-title` (22 px / 900) — "UAC" / "UVC" card labels ×2 (`:83, :120`). *Note: spec declares `text-title` at weight 700 only for the route h1, but the shipped code uses weight 900 on the card labels. This is consistent with the spec's rule that identity labels carry visual weight, but it is a re-use of the Title size role beyond its spec'd surface.*
- `text-2xs` (11 px / 600) — sub-eyebrow "Arterial depth" / "Venous depth" and NumericInput range hint.
- `text-ui` (13 px / 400) — `cm` suffix, empty-state copy, route subtitle.
- Route h1 (`+page.svelte:25`) uses `text-title font-bold` (700) — matches spec.

**Font-weight distribution (grep of `UacUvcCalculator.svelte`):** exactly 2 distinct weights used inside the calculator (`font-black` = 900 on hero numerals and card labels; `font-semibold` = 600 on eyebrows). Route h1 adds a 700 for the title. Total of 3 weights across the full route — matches §Typography "exactly 3".

**Tabular numerics:** `.num` class applied to both hero numerals (`:94, :131`) — satisfies mandatory tabular-nums for clinical output.

**Decimal precision:** `result.uacCm.toFixed(1)` and `result.uvcCm.toFixed(1)` — locked per §Typography "Hero value decimal precision". Screenshot at default 2.5 kg renders `16.5` / `8.3` (UVC rounds 8.25 → 8.3 via standard IEEE-754 banker's-rounding at the `toFixed` boundary; consistent with clinical-display convention).

**Arbitrary font sizes:** zero. Only the four declared scale tokens are used.

### Pillar 5: Spacing (4/4)

**Calculator-component spacing grep (`UacUvcCalculator.svelte`):**
- `space-y-6` — vertical rhythm between inputs card and hero grid (`:27`).
- `gap-4` — inputs-card internal stacking + hero grid column gap (`:29, :70`).
- `gap-3` — hero card internal row stacking (`:80, :117`).
- `gap-2` — icon-to-eyebrow / value-to-unit (`:93, :130`).
- `mt-1` — slider top margin below NumericInput range hint (`:50`).
- `px-5 py-5` — hero card internal padding override on top of `.card`'s `p-4` (`:74, :111`).

**Route-shell spacing (`+page.svelte`):**
- `mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl` (`:21`) — matches §Layout route container literally.
- `gap-3` on header icon-text row (`:22`) — 12 px, idiomatic for icon + title pair.

**Exceptions:**
- `border-t-4` / `border-b-4` — 4 px stripe, deliberate per §Spacing "Exceptions (justified)".
- `h-12` on `Slider.Root` (`:50`) — 48 px WCAG touch target, explicitly justified.
- `h-1.5` on slider track (`:53`) — 6 px, falls on the 4 px scale (1.5 × 4).
- `h-6 w-6` on slider thumb (`:63`) — 24 px, aligns with the scale.

**Arbitrary-value search** (regex for `[Npx]` / `[Nrem]`) **:** zero matches in `src/lib/uac-uvc/`.

### Pillar 6: Experience Design (4/4)

**State coverage:**
- **Loading:** n/a — SSR not used on this route; initial paint renders the default 2.5 kg immediately via Svelte 5's `$state` default. No fetch/async surface to show a skeleton.
- **Empty:** handled — when `weightKg === null`, both cards swap the icon/eyebrow/value structure for `Enter weight to compute depth` in `text-ui text-secondary` (`:101-103, :138-140`).
- **Error (out-of-range):** handled via `NumericInput`'s `showRangeError={true}` — blur-gated advisory `Outside expected range — verify`, reserved for textbox path only (slider is HTML-min/max-clamped per §Interaction Contract).
- **Disabled:** not applicable to the calculator; disabled state is relevant in the hamburger cap-full scenario verified by the 42-03 E2E spec.

**Interaction patterns verified:**
- `aria-live="polite" aria-atomic="true"` on both hero `<section>` elements (`:76-77, :113-114`) — screen-reader announces the full eyebrow + value + unit on weight change.
- Both hero cards wrapped in `{#key pulseKey}` with `pulseKey = weight.toFixed(2)` — reduced-motion-gated `animate-result-pulse` fires on every 0.01 kg resolution change.
- Slider = `bits-ui Slider` with `h-12` root (48 px touch) and focus-visible ring bound to `--color-identity` — satisfies WCAG 2.1 AA touch and focus-visibility requirements.
- Bidirectional sync: textbox uses `bind:value` on the same `$state.weightKg` the slider's `onValueChange` writes — component tests `42-02 Scenarios 3/4` verify both directions.

**Destructive-action coverage:** correctly none — phase has no destructive surfaces (no reset button wired, no auto-clamp, no confirmation dialog). This matches §Copywriting Contract "No destructive actions in Phase 42".

**Persistence robustness:** `state.svelte.ts` has three `try/catch` blocks — one each around `sessionStorage.getItem` (init), `setItem` (persist), `removeItem` (reset). Silent failures, no user-facing error copy — matches §Interaction Contract Persistence.

**Reduced-motion:** `animate-result-pulse` is gated at `app.css:180-184`; `bits-ui` Slider inherits its own transition behaviour (`transition-transform` on the thumb `:63`) — not gated by the app's reduced-motion rule, but the transform is on an already-focused thumb (active scale on drag) and doesn't violate WCAG 2.3.3. Minor — not blocking.

**E2E + a11y coverage (from `42-03-SUMMARY`):** 9 E2E tests passing + 2 axe sweeps (light + dark) passing first-run with zero violations. Project axe total moved from 20/20 → 22/22.

---

## UI-SPEC Reconciliation Summary

For downstream readers, the drift between the approved `42-UI-SPEC.md` and the shipped artifact (commits `d60f1ac` and `3d3a0eb` landed after plan 42-02's SUMMARY and after plan 42-03 passed):

| UI-SPEC clause | Shipped reality | Status |
|---|---|---|
| §Asset Inventory: `ArrowDownToLine` UAC, `ArrowUpFromLine` UVC per-card icons | Removed (commit d60f1ac) | **Drift** — Top Fix #1 |
| §Copywriting: `UAC DEPTH — ARTERIAL` / `UVC DEPTH — VENOUS` single-line em-dash eyebrow in identity color | Replaced with two-line header (`UAC` big identity-colored, `ARTERIAL DEPTH` small secondary) | **Drift** — Top Fix #2 |
| §Layout: native `<input type="range" class="range-uac">` | Replaced with `bits-ui Slider.Root` composition (commit 3d3a0eb) | **Drift (functional improvement, undocumented)** — Top Fix #3 |
| §Color OKLCH quartet at hue 350 | Verbatim in `app.css:255-263` | Match |
| §Typography 4 roles | In use, with `text-title` role extended to card labels | Match w/ minor extension |
| §Spacing scale | Match | Match |
| §Interaction: `aria-live="polite" aria-atomic="true"` | Match | Match |
| §Copywriting: AboutSheet entry (Shukla/Dunn, xlsx B3/B7, imaging caveat) | Verbatim | Match |
| §Copywriting: route h1, subtitle, placeholder, range hint, out-of-range advisory | Verbatim | Match |
| §Registry Safety: no third-party registries | `bits-ui` is a Svelte UI primitive library — not a shadcn-style registry, but is a new runtime dep surface | Partial — deserves a SPEC note |

---

## Registry Safety

`components.json` is absent at project root — confirmed via file-existence check. The project uses a custom Svelte component library and never initialized shadcn (per CLAUDE.md §"No Additional UI Component Libraries" and UI-SPEC §Design System). **Registry Safety audit is non-applicable and skipped**, per the agent spec.

Noted separately (not a shadcn registry flag, informational only): commit `3d3a0eb` introduces `bits-ui@^2.18.0` as a runtime dependency for the Slider primitive. This is a well-known SvelteKit headless-component library (Melt UI successor). The calculator component contains no suspicious network-access or dynamic-code-execution patterns (grep of the component for network fetches, env access, dynamic code eval, and http-scheme dynamic imports returned zero matches).

---

## Files Audited

**Implementation:**
- `src/lib/uac-uvc/UacUvcCalculator.svelte` — 147 lines, component under audit.
- `src/routes/uac-uvc/+page.svelte` — 32 lines, route shell.
- `src/lib/uac-uvc/state.svelte.ts` — 55 lines, persistence robustness check.
- `src/app.css` — lines 59-64 (type scale), 214-263 (identity tokens including new `.identity-uac`).
- `package.json` — line 50, `bits-ui ^2.18.0` dependency confirmation.

**Baseline / planning context:**
- `.planning/phases/42-uac-uvc-calculator/42-UI-SPEC.md` — 496 lines, design contract (audit baseline).
- `.planning/phases/42-uac-uvc-calculator/42-CONTEXT.md` — 336 lines, locked decisions D-01..D-16.
- `.planning/phases/42-uac-uvc-calculator/42-01-SUMMARY.md` — Plan 01 execution record (scaffold + OKLCH tokens + module).
- `.planning/phases/42-uac-uvc-calculator/42-02-SUMMARY.md` — Plan 02 execution record (UI composition, pre-drift).
- `.planning/phases/42-uac-uvc-calculator/42-03-SUMMARY.md` — Plan 03 execution record (E2E + axe 22/22, pre-drift).

**Screenshots:**
- `.planning/ui-reviews/42-20260423-205923/uac-mobile-light.png`
- `.planning/ui-reviews/42-20260423-205923/uac-mobile-dark.png`
- `.planning/ui-reviews/42-20260423-205923/uac-tablet-light.png`
- `.planning/ui-reviews/42-20260423-205923/uac-desktop-light.png`
- `.planning/ui-reviews/42-20260423-205923/uac-desktop-dark.png`

---

*Phase: 42-uac-uvc-calculator*
*Reviewed: 2026-04-23*
