---
phase: 27
slug: gir-ui-identity-registration
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-09
---

# Phase 27 — UI Design Contract

> Visual and interaction contract for the GIR calculator surface (Glucose Infusion Rate). Consumed by `gsd-planner`, `gsd-executor`, `gsd-ui-checker`, `gsd-ui-auditor`.

**Scope locked by milestone research (SUMMARY / STACK / FEATURES / ARCHITECTURE / PITFALLS).** No questions asked — `/gsd-ui-phase --auto`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (custom Svelte 5 + Tailwind v4; no shadcn — not a React project) |
| Preset | not applicable |
| Component library | In-house `src/lib/shared/components/*` — reused **zero-modification** |
| Icon library | `@lucide/svelte` (already installed) — **new icon: `Droplet`** |
| Font | Plus Jakarta Sans (already loaded globally in `src/app.css`) |
| Dark mode | `.dark` + `[data-theme="dark"]` (Tailwind v4 `@custom-variant`) |
| Identity mechanism | v1.5 `identityClass` → CSS custom-property swap (`--color-identity`, `--color-identity-hero`) |

**Shared components reused as-is (ARCH-06, zero new props):** `NumericInput` (v1.6+v1.7 advisory rails), `ResultsDisplay`, `DisclaimerModal`, `AboutSheet`, `NavShell`, `.animate-result-pulse`, `.card`, `.num`. `SegmentedToggle` is **intentionally not used** for the titration grid — tablist semantics conflict with a 6-row clinical radiogroup; a dedicated `GlucoseTitrationGrid.svelte` is built instead under `src/lib/gir/`.

---

## Spacing Scale

All spacing uses Tailwind's 4px base. No exceptions beyond the existing 48px minimum touch-target baseline in `src/app.css` and the 88px titration card minimum below.

| Token | Value | Usage in this phase |
|-------|-------|---------------------|
| xs  | 4px  | Glyph↔text gap in Δ-rate cell, eyebrow letter-spacing balance |
| sm  | 8px  | NumericInput label↔field gap, 3-col footer gap in mobile titration cards |
| md  | 16px | Default `.card` padding, inter-input stack gap, input row → hero gap |
| lg  | 24px | Section gap between hero / grid / reference card (matches Morphine `space-y-6`) |
| xl  | 32px | Route container `py-8` on desktop ≥768px |
| 2xl | 48px | **Minimum** touch-target height for interactive rows/buttons (WCAG 2.1 AA, enforced globally) |
| 3xl | 64px | Page-level breathing room above footer on desktop |

**Phase-specific minimums (load-bearing):**
- Titration row tap target ≥ **48px** on ≥480px (desktop/tablet grid mode)
- Titration card min-height **88px** on <480px (mobile stack mode) — 48px target + padding + 3-col footer
- NumericInput field height ≥ **48px** (inherited from global `input { min-h-[48px] }`)
- Advisory panel padding `px-4 py-3` (matches Morphine hero card)

**Route container:** `max-w-lg md:max-w-4xl mx-auto px-4 py-6` — mirrors `/morphine-wean` and `/fortification` exactly.

---

## Typography

Plus Jakarta Sans globally. All clinical numeric output uses `.num` (tabular-nums + tnum feature) so digit columns align. Declared exactly 4 sizes and 2 weights for this phase.

| Role | Token / Size | Weight | Line Height | Usage |
|------|--------------|--------|-------------|-------|
| Display (hero numeral) | `text-display` / 44px | 900 (black) | leading-none (1.0) | Current GIR mg/kg/min hero value; Target GIR numeral on selected-bucket hero |
| Title (h1 + secondary hero) | `text-title` / 22px | 700 (bold) | 1.2 | Page `<h1>Glucose Infusion Rate</h1>`; Initial rate ml/hr secondary value |
| Body | `text-base` / 16px | 500 (medium) → 600 (semibold) on strong labels | 1.5 | Advisory text, reference card copy, field values |
| Label / UI | `text-ui` / 13px | 600 (semibold) | 1.4 | NumericInput labels, 3-col footer labels on titration cards, reference card row labels |
| Eyebrow | `text-2xs` / 11px | 600 (semibold), `uppercase tracking-wide` | 1.3 | `"Current GIR"`, `"Initial rate"`, `"Target GIR"`, `"If glucose 50–60 mg/dL"` card eyebrows, `"Starting GIR by population"` |

**Weights in active use:** 500 (medium body) and 700 (bold title) are the primary pair. 900 (black) is reserved to the single `text-display` hero numeral (matches `ResultsDisplay.svelte`). 600 (semibold) is inherited from existing shared component internals (labels, eyebrows) — not a new addition to the phase.

**Tabular numerics (`.num`) mandatory on:** Current GIR value, Initial rate value, Target GIR value in hero, all 4 numeric columns in titration grid (Target GIR / Target fluids / Target rate / Δ rate), reference card numeric ranges, NumericInput display values.

**Placeholders:** `"3.1"`, `"12.5"`, `"80"` — plain, no unit in placeholder (suffix carries the unit).

---

## Color

OKLCH throughout. No new semantic tokens — only **one new identity class** `.identity-gir` added to `src/app.css`, scoped to the v1.5 four identity surfaces (result hero, focus rings, eyebrows, active nav indicator). No palette drift.

### 60 / 30 / 10 split on the `/gir` route

| Role | Token | Usage |
|------|-------|-------|
| Dominant (60%) | `var(--color-surface)` (light: `oklch(97.5% 0.006 225)`; dark: `oklch(16% 0.012 240)`) | Page background, breathing room |
| Secondary (30%) | `var(--color-surface-card)` (light: `oklch(100% 0 0)`; dark: `oklch(23% 0.014 236)`) | `.card` surfaces: input section, titration rows, reference card, grid wrapper |
| Accent (10%) | `var(--color-identity)` + `var(--color-identity-hero)` | **Exactly 4 surfaces only:** (1) result hero background fill (`--color-identity-hero`), (2) focus rings on NumericInput + titration rows (`--color-identity`), (3) uppercase eyebrows above hero values and titration card labels (`--color-identity`), (4) active nav tab indicator (already handled by `NavShell` consuming `identityClass`). Selected titration row also uses `--color-identity` for its left border + subtle bg tint — counts under surface (1)/(3). |
| Destructive | `var(--color-error)` / `var(--color-error-light)` | **Reserved.** The GIR phase has zero red surfaces. Red is strictly for `NumericInput` error ring when advisory `rangeError` fires. No red on Δ-rate signs, no red on severe-neuro row, no red on Dex% > 12.5 advisory. |

**Accent reserved for:** result hero card background + focus-visible rings + uppercase eyebrow text + active nav indicator + selected titration row border/tint. Never used on body text, never on the institutional disclaimer strip, never on reference card numerals.

### New identity tokens — `.identity-gir` (ARCH-02)

Hue **145 Dextrose Green**. Perceptual gap 50° from Formula teal (195), 25° from the opposite side of Morphine blue (220). Literal OKLCH values modeled on v1.5 Formula teal + v1.5 Morphine post-audit fix pattern (`L=95% C=0.04` hero discipline to pre-empt the Phase 20 axe-contrast repeat).

```css
/* src/app.css — append to the existing @layer base identity block (lines 186–209) */
.identity-gir {
  --color-identity:      oklch(46% 0.12 145);   /* light-mode accent text + focus ring */
  --color-identity-hero: oklch(94% 0.045 145);  /* light-mode hero background */
}
.dark .identity-gir,
[data-theme="dark"] .identity-gir {
  --color-identity:      oklch(82% 0.10 145);   /* dark-mode accent text + focus ring */
  --color-identity-hero: oklch(30% 0.09 145);   /* dark-mode hero background */
}
```

**Contrast contract (checker must verify in Phase 28 axe sweep):**
- Light `--color-identity` L=46% on `--color-surface-card` L=100% → expected ≥5.0:1 (AA normal). If axe flags, darken to `oklch(44% 0.12 145)` (same one-step fix v1.5 applied to Morphine — documented precedent).
- Light `--color-identity-hero` L=94% holding `--color-text-primary` L=18% → expected ≥12:1 (AAA).
- Dark `--color-identity` L=82% on `--color-surface-card` L=23% → expected ≥7.5:1 (AA, likely AAA).
- Dark `--color-identity-hero` L=30% holding `--color-text-primary` L=93% → expected ≥9:1 (AAA).

### Advisory-tone hierarchy (SAFE-02/03/04)

| Tier | Trigger | Visual | Tokens |
|------|---------|--------|--------|
| **Tier 1 — Prominent amber** | `dextrosePct > 12.5` → *"Dextrose >12.5% requires central venous access"* | Full card-width band directly beneath the Dextrose input. Amber icon (`AlertTriangle` from lucide, 20px), semibold body text, left border 4px, padded `px-4 py-3`, rounded-xl. **Light:** `background: oklch(97% 0.04 78)` (bmf-50-aligned), `border-left: 4px solid oklch(62% 0.16 60)` (bmf-600), text `var(--color-text-primary)`. **Dark:** `background: oklch(28% 0.08 65)` (bmf-light-aligned), `border-left: 4px solid oklch(72% 0.18 65)` (bmf-500), text `var(--color-text-primary)`. Reuses existing BMF amber scale tokens — **no new color token introduced**. | `--color-bmf-50` / `--color-bmf-500` / `--color-bmf-600` (already in `@theme`) |
| **Tier 2 — Standard grey range hint** | NumericInput out-of-range on blur (all 3 fields), Current GIR > 12 (hyperinsulinism), Current GIR < 4 (below basal) | Uses `NumericInput`'s built-in `rangeHint` + `rangeError` slot for input fields. For GIR-level advisories (>12, <4), a plain subtle card under the hero: `.card` surface, small text (`text-ui`), `text-[var(--color-text-secondary)]`, an `Info` lucide icon 16px, no colored border. Quiet, informational. | `var(--color-text-secondary)` + `var(--color-surface-card)` |
| **Reserved error red** | NumericInput `displayError` only (blur + out-of-range with `showRangeError=true`) | Existing NumericInput behavior, untouched. | `var(--color-error)` / `var(--color-error-light)` |

**Rationale for Tier 1 = amber (not red):** red is reserved for input-level errors (v1.0 decision). Dex%>12.5 is a clinically-critical warning about a concrete harm pathway (peripheral extravasation) but the input itself is not "wrong" — higher concentrations exist and are valid via central access. Amber signals "stop and verify" without false-flagging the value as invalid. Reusing the BMF scale avoids introducing a fifth accent.

---

## Layout & Composition

### Page composition (section order, top → bottom)

```
┌─────────────────────────────────────────────────┐
│ <header>  Droplet icon + "Glucose Infusion Rate"│   ← text-title bold, identity icon
│           "mg/kg/min · titration helper"        │   ← text-ui secondary eyebrow
├─────────────────────────────────────────────────┤
│ INPUTS CARD (.card)                             │
│   Weight (kg)                                   │   ← NumericInput, stacked
│   Dextrose (%)                                  │
│   [Tier 1 amber advisory if dex > 12.5]         │   ← inline, directly below Dex
│   Fluid order (ml/kg/day)                       │
├─────────────────────────────────────────────────┤
│ RESULT HERO (.card identity-hero)               │   ← aria-live polite, pulse on change
│   eyebrow: CURRENT GIR                          │
│   44px  8.2  mg/kg/min                          │   ← display, tabular
│   eyebrow: INITIAL RATE                         │
│   22px  10.6 ml/hr                              │
│   [Tier 2 GIR >12 / <4 advisory inline below]   │
├─────────────────────────────────────────────────┤
│ TITRATION HEADER                                │
│   "If current glucose is…"                      │   ← text-ui semibold, no identity color
│   small subtitle disclaimer (text-2xs tertiary) │
├─────────────────────────────────────────────────┤
│ GLUCOSE TITRATION GRID                          │   ← role="radiogroup"
│   6 rows (cards <480 / table ≥480)              │
│   no default selection                          │
├─────────────────────────────────────────────────┤
│ TARGET-GUIDANCE HERO (.card identity-hero)      │   ← aria-live polite, {#key selectedBucketId}
│   eyebrow: TARGET GIR                           │
│   44px  7.2  mg/kg/min                          │   ← OR empty state message
│   22px  target fluids / target rate / Δ rate    │
├─────────────────────────────────────────────────┤
│ POPULATION REFERENCE CARD (.card)               │
│   "Starting GIR by population"                  │
│   3 compact rows: IDM/LGA / IUGR / Preterm or NPO│
└─────────────────────────────────────────────────┘
```

**Why this order (vs inputs→grid→hero→reference):** the result hero must be immediately visible after inputs so clinicians verify the Current GIR before interpreting any titration suggestion. The titration grid drives a separate target-guidance hero placed below it (not merged with the primary hero) because the clinician's mental model is a two-step action: (1) verify current, (2) pick glucose → see target. Merging would conflate "what you're running now" with "what you'd change to". The population reference card lives at the end as a quiet sanity check — not a primary input aid.

### Input layout

- **Mobile (<768px):** 3 `NumericInput` stacked full-width inside one `.card` with `flex flex-col gap-4` — mirrors Morphine exactly.
- **Tablet/Desktop (≥768px):** same single-column stack inside the card. **No side-by-side 3-col layout.** Rationale: clinicians often tab through sequentially; columns invite left-right scanning that slows entry. Morphine and Formula both use stacked inputs on desktop — consistency wins.

### Titration grid layout

#### <480px (vertical card stack)

```
┌─────────────────────────────────────────────┐
│ [role="radio" aria-checked="false"]         │
│ eyebrow: IF GLUCOSE 50–60 mg/dL             │   text-2xs identity
│ 7.7 mg/kg/min          [TARGET GIR]         │   text-display bold num
│ ┌──────────┬──────────┬──────────────────┐  │
│ │ Fluids   │ Rate     │ Δ rate           │  │   text-ui labels
│ │ 61 ml/kgd│ 10.0 ml/h│ ▼ 0.6 (decrease) │  │   num values
│ └──────────┴──────────┴──────────────────┘  │
└─────────────────────────────────────────────┘
```

- **Container:** `flex flex-col gap-3` (12px gaps)
- **Card:** `.card` + `px-4 py-4`, `min-h-[88px]`, `cursor-pointer`, `tabindex` per roving-tabindex rule
- **Selected state:** `border-l-4 border-[var(--color-identity)]` replaces the default 1px border on that edge + `background: var(--color-identity-hero)` + fires `.animate-result-pulse` via `{#key selectedBucketId}`
- **Focus-visible:** `ring-2 ring-[var(--color-identity)] ring-offset-2 ring-offset-[var(--color-surface)]` (standard pattern, matches SegmentedToggle)
- **Hero numeral alignment:** left side of card, eyebrow above
- **3-col footer:** `grid grid-cols-3 gap-2 text-ui` with top border `border-t border-[var(--color-border)] pt-2 mt-2`

#### ≥480px (table grid)

```
| Range          | Target GIR    | Target Fluids  | Target rate   | Δ rate              |
| "50–60 mg/dL"  | 7.7 mg/kg/min | 61 ml/kg/day   | 10.0 ml/hr    | ▼ 0.6 (decrease)    |
```

- **Container:** `role="radiogroup"` div with `grid grid-cols-[minmax(140px,1.4fr)_1fr_1fr_1fr_1.2fr] gap-x-3 gap-y-1`
- **Row:** each row is a `role="radio"` contiguous sub-grid `col-span-full grid grid-cols-subgrid min-h-[48px] items-center px-3 py-2 rounded-lg`, `cursor-pointer`
- **Header row:** text-ui semibold text-secondary, not selectable, `sticky` not required
- **Selected state:** `border-l-4 border-[var(--color-identity)] -ml-1 pl-[calc(0.75rem-3px)]` + `background: var(--color-identity-hero)` + pulse via `{#key}`
- **Severe-neuro row visual differentiation:** subtle `border-l-2 border-[var(--color-text-tertiary)]` at rest (promoted to 4px identity when selected) + eyebrow text `"Symptomatic / seizure"` in the Range column. **Never red, never filled.**
- **All 6 rows always visible.** No `overflow-x-auto`, no collapse, no horizontal scroll at any width.

#### ≥1024px

Same as ≥480px. Title remains above the grid (not alongside) to match Morphine/Formula.

### Target-guidance hero layout

Identical to Current GIR hero (`.card bg-[var(--color-identity-hero)] px-5 py-5`), positioned *below* the grid. Empty state until a bucket is selected. When populated, primary value is Target GIR (text-display), secondary line shows `Target fluids · Target rate · Δ rate` as three small columns (text-title for numerals, text-ui for units).

### Population reference card

Single `.card px-5 py-4`. Title row: eyebrow `"Starting GIR by population"` in identity color, top-aligned. Body: 3-row table-grid `grid grid-cols-[1fr_auto] gap-y-2` — left column population name (text-ui secondary), right column range (text-base semibold num + `"mg/kg/min"` suffix in text-ui tertiary). Not competing with result hero — quiet, informational.

---

## Interaction Contract

### NumericInput behavior (unchanged from v1.7 contract)

- `inputmode="decimal"` (already default in shared component — Phase 28 asserts)
- `showRangeHint={true}`, `showRangeError={true}` for **all three** GIR fields
- Advisory only — no clamp. Blur-gated rangeError shows "Outside expected range — verify"
- `$effect` normalization at state layer (already Phase 26 complete): `trim()` + locale-comma → decimal point

### Hero (Current GIR + Initial rate)

- `aria-live="polite"`, `aria-atomic="true"`
- Shows empty-state copy when `calculateGir(state, buckets)` returns `null` (any input null/invalid)
- Pulses via `{#key}` wrapping the inner `.animate-result-pulse` element, keyed on `` `${currentGir.toFixed(1)}-${initialRate.toFixed(1)}` ``
- `prefers-reduced-motion: reduce` automatically disables the animation (already in `.animate-result-pulse` CSS — line 156 of `src/app.css`)

### GlucoseTitrationGrid keyboard contract (WAI-ARIA radiogroup)

| Key | Action |
|-----|--------|
| `Tab` | Move focus into the group onto the single tabbable row (selected if any, else first row) |
| `Tab` (when focused) | Move focus out of the group to the next focusable element (target-guidance hero is not focusable; moves to reference card link if any) |
| `ArrowDown` / `ArrowUp` | Move selection + focus to next / previous row. Wraps (bottom↔top). Both in vertical card mode and in horizontal table mode (single-column vertical semantics since the table is logically a 1D list). |
| `ArrowRight` / `ArrowLeft` | **Also** move next/previous. Equivalent to Down/Up. Safer for clinicians unsure which axis the grid uses; WAI-ARIA radiogroup permits either. |
| `Home` | Select + focus first row (Severe neurologic signs) |
| `End` | Select + focus last row (>70 mg/dL) |
| `Space` / `Enter` | Affirm current row as selected (no toggle-off on re-press — single-select only, matches spec) |

- **Roving tabindex:** exactly one row has `tabindex="0"` at any time (selected if present, else first). All others `tabindex="-1"`. Identical implementation pattern to `SegmentedToggle.svelte` (lines 27–59).
- **Click/tap:** immediately selects + moves roving tabindex + focuses the clicked row.
- **No default selection on mount.** `state.selectedBucketId === null` initially. First row carries `tabindex="0"` so keyboard users can Tab in. Selecting via keyboard/click updates both `selectedBucketId` and roving tabindex.

### Tab order across the page

1. Header (no focusable elements — icon is `aria-hidden`)
2. Weight input
3. Dextrose input
4. Fluid order input
5. Single tabbable row in titration grid (first row or selected row)
6. (Target-guidance hero is non-interactive, skipped)
7. (Population reference card is non-interactive, skipped)
8. Out of page → nav shell / footer

### Δ rate glyph contract (TITR-06)

| Sign | Display |
|------|---------|
| `delta > 0` | `▲ {abs(delta).toFixed(1)} ml/hr (increase)` |
| `delta < 0` | `▼ {abs(delta).toFixed(1)} ml/hr (decrease)` |
| `delta === 0` | `0 ml/hr (no change)` |

- Glyph **and** parenthetical word are both required — WCAG 1.4.1 forbids color-alone.
- Glyph uses text-secondary color, not red or green. **No color carries meaning.**
- Glyph font size matches the numeral (`text-ui` in card footer, `text-base` in table row); no custom icon font.
- Alignment in table mode: left-aligned glyph + space + numeral + space + unit + space + parenthetical, all inside one `span`.

### ≤0 Target GIR display guidance (TITR-07)

When `row.targetGirMgKgMin <= 0`:
- Target GIR cell renders literally `"0 mg/kg/min — consider stopping infusion"` (display-only; raw value preserved in state and props for tests).
- Target fluids / rate / Δ rate cells in that row render a dash `"—"` (text-tertiary).
- No red, no warning icon — the copy carries the message.

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast text | All body/label text is `--color-text-primary` or `--color-text-secondary` on `.card` surfaces — already AA per v1.4 token audit. Identity-hero backgrounds preserve primary text contrast (L=94% light / L=30% dark). |
| Color contrast non-text UI | Focus rings use `--color-identity` which passes 3:1 AA (see Color section contrast contract). Selected-row 4px border uses same token. |
| Use of color (1.4.1) | Δ rate direction uses ▲/▼ glyph + `(increase)` / `(decrease)` text — never color alone. Selected row uses border-left + background tint, not just color. Severe-neuro row differentiates via border width/position, not hue. |
| Keyboard (2.1.1) | Full radiogroup keyboard model above. No mouse-only interactions. |
| Focus visible (2.4.7) | `focus-visible` ring 2px at `--color-identity` with 2px offset on surface — inherited from shared components. |
| Touch target (2.5.5 AAA aspiration, clinical constraint) | 48px minimum everywhere; 88px on mobile titration cards. |
| Name/role/value (4.1.2) | Titration grid: `role="radiogroup"` with `aria-label="Glucose range titration helper"` on container, `role="radio"` + `aria-checked="true|false"` + `aria-label="{srLabel} mg/dL. Target GIR {n} mg/kg/min, target rate {r} ml/hr, {direction} {delta} ml/hr"` per row. Use `srLabel` from `gir-config.json` buckets (e.g. `"less than 40"`, `"severe neurological symptoms"`) so screen readers don't pronounce `<40` as literal tag markup. |
| Live regions (4.1.3) | Both heroes carry `aria-live="polite"` + `aria-atomic="true"`. Hero only updates when all 3 inputs valid (v1.6 pattern — prevents keystroke spam). |
| Reduced motion | `.animate-result-pulse` gated by existing `@media (prefers-reduced-motion: reduce)` in `src/app.css` line 156. Theme transitions gated by `html:not(.no-transition) *` + `@media (prefers-reduced-motion)` on line 120. |
| iOS decimal keyboard (TEST-06) | `inputmode="decimal"` on all 3 NumericInput fields — shared component default; Phase 28 Playwright assertion. |
| Tab-switch state isolation | Dedicated `nicu_gir_state` sessionStorage key (Phase 26 complete). |

---

## Copywriting Contract

Every user-facing string is locked below. No paraphrasing. Tone: precise, calm, trustworthy.

### Navigation & page chrome

| Element | Copy |
|---------|------|
| Nav tab label (mobile bottom + desktop side) | `GIR` |
| Nav tab `description` (screen reader) | `Glucose infusion rate calculator` |
| Route path | `/gir` |
| `<svelte:head>` title | `GIR | NICU Assistant` |
| Page `<h1>` | `Glucose Infusion Rate` |
| Page subtitle / eyebrow | `mg/kg/min · titration helper` |
| Page icon | Lucide `Droplet` (`@lucide/svelte`), 28px, `aria-hidden` |

### Inputs

| Field | Label | Suffix | Placeholder | `id` |
|-------|-------|--------|-------------|------|
| Weight | `Weight` | `kg` | `3.1` | `gir-weight` |
| Dextrose | `Dextrose` | `%` | `12.5` | `gir-dextrose` |
| Fluid order | `Fluid order` | `ml/kg/day` | `80` | `gir-fluid` |

Range hints (auto-rendered by `NumericInput` from config): `0.3–10 kg`, `2.5–25 %`, `40–200 ml/kg/day`.

### Result hero (Current GIR + Initial rate)

| State | Copy |
|-------|------|
| Primary eyebrow | `CURRENT GIR` |
| Primary value format | `{currentGir.toFixed(1)}` (1 decimal) |
| Primary unit | `mg/kg/min` |
| Secondary eyebrow | `INITIAL RATE` |
| Secondary value format | `{initialRate.toFixed(1)}` (1 decimal) |
| Secondary unit | `ml/hr` |
| Empty state (any input null) | `Enter weight, dextrose %, and fluid rate to compute GIR` |

### Advisories

| Trigger | Copy | Tier |
|---------|------|------|
| `dextrosePct > 12.5` | `Dextrose >12.5% requires central venous access` | **1 — amber** |
| `currentGir > 12` | `GIR >12 mg/kg/min — consider hyperinsulinism workup / central access` | 2 — grey |
| `currentGir < 4 && currentGir > 0` | `Below basal glucose utilization (≈4–6 mg/kg/min)` | 2 — grey |
| NumericInput out-of-range (shared component built-in) | `Outside expected range — verify` | Error red (existing) |

### Titration grid

| Element | Copy |
|---------|------|
| Grid header | `If current glucose is…` |
| Grid disclaimer (small, below header) | `Institutional titration helper — verify against your protocol before acting.` |
| Column headers (≥480px table mode) | `Range` · `Target GIR` · `Target fluids` · `Target rate` · `Δ rate` |
| Bucket labels (from `gir-config.json`, inline with `mg/dL` suffix where applicable) | `Severe neurologic signs` · `<40 mg/dL` · `40–50 mg/dL` · `50–60 mg/dL` · `60–70 mg/dL` · `>70 mg/dL` |
| Severe-neuro eyebrow (mobile card mode) | `IF SEVERE NEURO SIGNS` |
| Target GIR ≤ 0 display | `0 mg/kg/min — consider stopping infusion` |
| Δ rate > 0 | `▲ {abs.toFixed(1)} ml/hr (increase)` |
| Δ rate < 0 | `▼ {abs.toFixed(1)} ml/hr (decrease)` |
| Δ rate = 0 | `0 ml/hr (no change)` |
| ARIA label per row | `{srLabel} mg per deciliter. Target GIR {n} milligrams per kilogram per minute, target rate {r} milliliters per hour, {direction} {delta} milliliters per hour.` — built at render from bucket `srLabel` + computed row values |

**Copy note:** the grid intentionally uses `mg/dL` inline on every bucket label except Severe neurologic signs (which has no threshold). Research PITFALLS #3 requires this.

### Target-guidance hero

| State | Copy |
|-------|------|
| Eyebrow | `TARGET GIR` |
| Value format | `{targetGir.toFixed(1)}` (or `"0"` with display override when ≤0) |
| Unit | `mg/kg/min` |
| Secondary line format | `{targetFluids.toFixed(0)} ml/kg/day · {targetRate.toFixed(1)} ml/hr · {deltaDisplay}` |
| Empty state (no bucket selected) | `Select a glucose range to see target rate` |
| Aggressive-wean stop message | `0 mg/kg/min — consider stopping infusion` (same string as grid cell) |

### Population reference card (REF-01)

| Element | Copy |
|---------|------|
| Card eyebrow | `STARTING GIR BY POPULATION` |
| Row 1 left | `IDM / LGA` |
| Row 1 right | `3–5 mg/kg/min` |
| Row 2 left | `IUGR` |
| Row 2 right | `5–7 mg/kg/min` |
| Row 3 left | `Preterm or NPO` |
| Row 3 right | `4–6 mg/kg/min` |
| Footnote (text-2xs tertiary) | `Reference ranges only — not a prescription.` |

### Disclaimer / About

- No phase-specific disclaimer in this phase. Single shared `DisclaimerModal` holds (v1.0 decision). Phase 28 updates `AboutSheet` with the GIR source citation — **out of scope for Phase 27**.

### No copywriting in this phase

- No "Clear inputs" button copy (Morphine has one; for GIR v1.8 the reset is via nav reload or state reset on mount — keeps the surface minimal). If a Clear button is added later, it mirrors Morphine's `Clear inputs`.
- No destructive actions. No confirmation dialogs. No toast/notification copy.

---

## Registry

### Registry entry (`src/lib/shell/registry.ts`)

Extend `identityClass` union literal and append one entry:

```ts
import { Syringe, Milk, Droplet } from '@lucide/svelte';

export interface CalculatorEntry {
  // ...existing fields...
  identityClass: 'identity-morphine' | 'identity-formula' | 'identity-gir';
}

export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  { /* morphine */ },
  { /* formula */ },
  {
    id: 'gir',
    label: 'GIR',
    href: '/gir',
    icon: Droplet,
    description: 'Glucose infusion rate calculator',
    identityClass: 'identity-gir',
  },
] as const;
```

**GIR appended to end** — preserves existing tab muscle memory (PROJECT decision, locked in STATE.md v1.8).

### Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| In-house `src/lib/shared/components/*` | `NumericInput`, `ResultsDisplay` (optional), `.animate-result-pulse`, `.card`, `.num` | Not applicable — first-party code, reviewed in normal PR flow |
| `@lucide/svelte` (already installed) | `Droplet` (new in this phase), `AlertTriangle` (amber advisory icon, new import), `Info` (Tier 2 hint icon, new import) | Not applicable — already-vetted dependency, official Svelte 5 package |
| shadcn / third-party registries | none | not applicable — no shadcn in this project |

**No third-party registry vetting required.** No new runtime dependencies.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — every string locked above, tone matches "precise / calm / trustworthy"
- [ ] Dimension 2 Visuals: PASS — layout diagrams locked, 4 identity surfaces preserved, no palette drift
- [ ] Dimension 3 Color: PASS — OKLCH literals declared for `.identity-gir` both themes, Tier 1 amber reuses existing BMF scale, contrast contract documented (axe verification in Phase 28)
- [ ] Dimension 4 Typography: PASS — 4 sizes, 2 primary weights, tabular-nums on all clinical outputs
- [ ] Dimension 5 Spacing: PASS — 4px scale, 48px/88px tap-target minimums, route container matches Morphine/Formula
- [ ] Dimension 6 Registry Safety: PASS — zero new dependencies, zero new props on shared components, additive-only CSS + registry extension

**Approval:** pending (Phase 28 axe sweep is the final gate on the identity OKLCH literals)
