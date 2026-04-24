---
name: NICU Assistant
description: Clinical calculator hub for NICU staff — morphine weaning, formula fortification, glucose infusion rate, feed advance, UAC/UVC catheter depth.
colors:
  clinical-blue:        "oklch(49% 0.17 220)"
  clinical-blue-light:  "oklch(86% 0.08 220)"
  clinical-blue-result: "oklch(42% 0.14 220)"
  clinical-blue-dark-accent: "oklch(82% 0.12 220)"
  bmf-amber:            "oklch(72% 0.18 65)"
  bmf-amber-result:     "oklch(44% 0.13 55)"
  surface:              "oklch(97.5% 0.006 225)"
  surface-alt:          "oklch(90% 0.008 220)"
  surface-card:         "oklch(100% 0 0)"
  surface-dark:         "oklch(16% 0.012 240)"
  surface-alt-dark:     "oklch(20% 0.014 238)"
  surface-card-dark:    "oklch(23% 0.014 236)"
  border:               "oklch(63% 0.01 220)"
  border-dark:          "oklch(58% 0.018 235)"
  text-primary:         "oklch(18% 0.012 230)"
  text-secondary:       "oklch(35% 0.01 225)"
  text-tertiary:        "oklch(50% 0.008 225)"
  text-primary-dark:    "oklch(93% 0.006 230)"
  text-secondary-dark:  "oklch(80% 0.01 228)"
  text-tertiary-dark:   "oklch(62% 0.008 228)"
  error:                "oklch(50% 0.2 25)"
  error-light:          "oklch(90% 0.06 25)"
  scrim:                "oklch(18% 0.012 230 / 0.55)"
  identity-morphine:    "oklch(49% 0.17 220)"
  identity-formula:     "oklch(49% 0.11 195)"
  identity-gir:         "oklch(42% 0.12 145)"
  identity-feeds:       "oklch(50% 0.13 30)"
  identity-uac:         "oklch(42% 0.12 350)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  ui:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  pill:    "9999px"
  card:    "0.75rem"
  surface: "1rem"
  hero:    "1.25rem"
  cta:     "0.625rem"
  tab-top: "0.5rem"
spacing:
  hairline: "0.25rem"
  tight:    "0.5rem"
  snug:     "0.75rem"
  base:     "1rem"
  comfy:    "1.25rem"
  loose:    "1.5rem"
  hero:     "2rem"
  bottom-nav-clearance: "5rem"
components:
  button-primary:
    backgroundColor: "{colors.clinical-blue-result}"
    textColor: "{colors.surface-card}"
    typography: "{typography.body}"
    rounded: "{rounded.cta}"
    padding: "0.75rem 1rem"
    height: "3.25rem"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.text-tertiary}"
    rounded: "{rounded.pill}"
    padding: "0.25rem"
    size: "48px"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.card}"
    padding: "1rem"
  hero-card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.hero}"
    padding: "1.5rem 1.25rem"
  input-numeric:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "0.5rem 0.875rem"
    height: "48px"
  segmented-toggle-track:
    backgroundColor: "{colors.surface-alt}"
    rounded: "{rounded.surface}"
    padding: "0.25rem"
  segmented-toggle-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.identity-morphine}"
    typography: "{typography.ui}"
    rounded: "{rounded.card}"
    padding: "0.75rem 1rem"
  nav-tab-desktop:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.ui}"
    rounded: "{rounded.tab-top}"
    padding: "0.75rem 1rem"
    height: "48px"
  nav-tab-bottom-mobile:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    padding: "0.5rem 0"
    height: "56px"
---

# Design System: NICU Assistant

## 1. Overview

**Creative North Star: "The Quiet Reference."**

The NICU Assistant is a well-thumbed clinical handbook on the unit shelf, translated to a phone screen. Authority comes from precision, not decoration. A clinician with a wailing infant, an order in their head, and ninety seconds to compute should reach the answer without rebuilding a mental model — every screen makes the same promise the same way: *the result is the interface*.

The system is **warm clinical**, not hospital-cold and not consumer-app-warm. Plus Jakarta Sans replaces the institutional sans-serifs that cue "EHR fatigue"; OKLCH neutrals carry a faint blue lean (chroma 0.006–0.014) that reads as cared-for rather than sterile; the dark mode is intentionally re-perceived in warm slate, never auto-inverted. Tabular numerals are non-negotiable — clinical numbers must align under their successors when a clinician scans for the value to act on. The interface explicitly rejects the consumer-health aesthetic (gradients, illustration, wellness pastels), the legacy-EHR aesthetic (grey forms, dense tables, button overload), the SaaS-dashboard aesthetic (sidebar nav, charts, enterprise grey), and the baby-app aesthetic (pastels, cartoon type, playful energy).

This system is for a **product** register, not a brand surface — familiarity is a feature, surprise is a tax. Calculators are siblings, not personalities. New calculators inherit the system; they do not redesign within it.

**Key Characteristics:**
- **Result-first hierarchy.** The display numeral (2.75 rem / 44 px / weight 800, tabular) owns its viewport. Inputs are necessary, never primary.
- **OKLCH everywhere.** No `#000`, no `#fff`. Every neutral is faintly blue-tinted; every accent passes WCAG 4.5:1 against its surface.
- **Single family, five roles.** Plus Jakarta Sans at five sizes (display 44, title 22, body 16, ui 13, label 11). No display/body pair, no mono.
- **Identity-as-system, scoped.** Each calculator declares an `.identity-{name}` hue pair (light + dark). Identity color appears **only inside that calculator's surfaces** — eyebrow, hero tint, slider track — never in global chrome.
- **48 px touch floor.** Every interactive element. Always.
- **Both themes designed.** Dark mode is warm slate with reduced chroma at the extremes. Light mode is the default for bright NICU lighting.

## 2. Colors

A restrained palette anchored on Clinical Blue, with Amber reserved for the BMF fortifier semantic. Identity hues per calculator extend the palette — but only inside the calculator's own surfaces.

### Primary
- **Clinical Blue** (`oklch(49% 0.17 220)`): The system accent. Carries chrome (active tab underline, focus rings, hamburger CTA), the morphine identity surface, and the result-card background on the morphine and formula heroes. Light variant `oklch(86% 0.08 220)` for chip backgrounds; result variant `oklch(42% 0.14 220)` for white-text cards passing 4.5:1.

### Secondary
- **BMF Amber** (`oklch(72% 0.18 65)`): Reserved for the **BMF fortifier mode** semantic in the formula calculator. Result variant `oklch(44% 0.13 55)` for white-text cards. Amber is not decorative — it carries clinical meaning (breast milk fortifier present). Never used for any other purpose.

### Tertiary (Identity Hues — scoped)
Each calculator owns one identity hue pair, declared as `.identity-{name}` in `app.css`. New calculators add a new pair following the same pattern. Identity color appears **inside the calculator's route only**.

- **Identity Morphine** — clinical blue (`oklch(49% 0.17 220)`).
- **Identity Formula** — muted teal (`oklch(49% 0.11 195)`).
- **Identity GIR** — clinical green (`oklch(42% 0.12 145)`).
- **Identity Feeds** — warm coral (`oklch(50% 0.13 30)`).
- **Identity UAC/UVC** — clinical rose (`oklch(42% 0.12 350)`).

Each has a light-mode `--color-identity-hero` token (~95% lightness, low chroma) for hero card tint, and a dark-mode pair (~80% identity / ~24% hero) re-perceived for the warm-slate dark surface.

### Neutral
- **Surface** (`oklch(97.5% 0.006 225)`): Page background, light. **Surface Card** (`oklch(100% 0 0)`) for raised cards.
- **Surface Dark** (`oklch(16% 0.012 240)`): Warm-slate page background. **Surface Card Dark** (`oklch(23% 0.014 236)`) — three-step lightness rise creates depth without harsh borders.
- **Border** (`oklch(63% 0.01 220)` light / `oklch(58% 0.018 235)` dark): WCAG-tuned at 3:1 against surface and card. Never `oklch(80% ...)` (too soft).
- **Text Primary / Secondary / Tertiary** at lightness 18 / 35 / 50 (light mode), 93 / 80 / 62 (dark mode) — every step passes 4.5:1 against its intended surface.

### Error
- **Error** (`oklch(50% 0.2 25)`): Reserved for advisory and validation only. Never a UI accent. Light variant for tinted backgrounds.

### Named Rules

**The Identity-Inside Rule.** Identity hue belongs inside the calculator's own surfaces — eyebrow text, hero card tint, slider track, focus ring on the calculator's inputs. Identity hue is **prohibited** in the global nav (top tabs and bottom tab bar both use Clinical Blue for the active state), the hamburger drawer (star icons are neutral), and the title bar. Adding a sixth, seventh, or eighth calculator does not add a sixth, seventh, or eighth color to the chrome.

**The Amber-as-Semantic Rule.** Amber (`oklch(72% 0.18 65)` family) is reserved exclusively for the BMF fortifier mode in the formula calculator. It carries a clinical meaning (breast milk fortifier present in the recipe). Amber for decoration, identity, or any other state is **forbidden**.

**The OKLCH-Only Rule.** All color values are declared in OKLCH. Hex, `#000`, `#fff`, RGB, HSL — **prohibited**. The token system in `app.css` is the single source of truth; if a value is needed and not in the token system, add it as a token, do not inline a hex.

**The Red-Means-Wrong Rule.** Red is reserved for errors and out-of-range advisories. Red as a UI accent (delete buttons, primary CTAs, alerting badges) is **forbidden** — clinicians will read it as "the calculation is wrong" and pause.

## 3. Typography

**Display Font:** Plus Jakarta Sans (with `ui-sans-serif, system-ui, sans-serif` fallbacks)
**Body Font:** Plus Jakarta Sans (one family across the system)
**Label/Mono Font:** Plus Jakarta Sans

**Character:** Plus Jakarta Sans is professional without being institutional, distinctive without being decorative. It carries the entire system. The product register permits a single family — display/body pairing would create noise where consistency is the brand. Tabular numerals (`font-variant-numeric: tabular-nums`) are mandatory on every clinical output via the `.num` utility class.

### Hierarchy

- **Display** (weight 800, 2.75 rem / 44 px, line-height 1, letter-spacing -0.01 em): Primary clinical result values only. The hero numeral on every calculator. Always tabular.
- **Title** (weight 600, 1.375 rem / 22 px, line-height 1.2): Page `<h1>` (calculator name in the route header) and AboutSheet section headings.
- **Body** (weight 400, 1 rem / 16 px, line-height 1.5): Paragraph copy in disclaimer, AboutSheet, and advisory messages. Cap at 65–75 ch.
- **UI** (weight 500, 0.8125 rem / 13 px, line-height 1.3): Nav labels, field labels, button text, segmented-toggle pills, slider value readouts.
- **Label** (weight 600, 0.6875 rem / 11 px, line-height 1.2, letter-spacing 0.02 em, often UPPERCASE): Eyebrow text above hero numerals (e.g. "MORPHINE WEAN", "ARTERIAL DEPTH"), bottom-nav tab labels, in-card section eyebrows.

### Named Rules

**The Five-Roles-Only Rule.** Five sizes, five roles. **Prohibited:** arbitrary `text-[Npx]` values, fluid `clamp()` typography (consistent DPI in clinical use makes fluid type a regression), display fonts paired against the body font.

**The Tabular-Numbers Rule.** Every clinical number renders with `.num` (`font-variant-numeric: tabular-nums`). A column of doses, volumes, or rates must align under itself when a clinician scans. **Prohibited:** proportional figures on any value a clinician will read or copy.

**The Eyebrow-Above-Numeral Rule.** Hero numerals are introduced by a single label-role eyebrow row, identity-colored, uppercase. The numeral itself is the largest object on the screen. The unit suffix (`mg`, `mL/hr`, `cm`) sits in body or ui weight beside or below the numeral, never above.

**The 11 px Floor.** `--text-2xs` (11 px) is the floor and is for **labels only** — bottom-nav tab labels, in-card eyebrows, range hints under inputs. **Prohibited:** advisory copy, error messages, or paragraph text at 11 px. Advisory copy steps up to `--text-ui` (13 px) minimum.

## 4. Elevation

The system is **mostly flat with disciplined tonal layering**. Depth is conveyed through three lightness steps in the surface family (`surface` → `surface-alt` → `surface-card`) and a single subtle shadow (`shadow-sm`) on raised cards. The dark mode follows the same pattern with a warm-slate base instead of inverted neutrals.

Glassmorphism, ambient glows, and decorative shadows are **prohibited**. The disclaimer modal uses a single Tailwind `shadow-2xl` for genuine separation from the scrim — that is the maximum shadow weight in the system.

### Shadow Vocabulary

- **Card** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` — Tailwind `shadow-sm`): Standard raised card. Inputs card, hero card, schedule cards.
- **Modal / Drawer** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)` — Tailwind `shadow-2xl`): Disclaimer modal, hamburger drawer, AboutSheet, SelectPicker dialog. Used for genuine layering above the scrim.
- **Inset (Segmented Toggle)** (`box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` — Tailwind `shadow-inner`): The segmented-toggle track recesses into its surface; the active pill rises with `shadow-sm`.
- **Focus** (`box-shadow: 0 0 0 2px var(--color-accent-light)`): Custom focus indicator on the icon button. All other focus states use `outline-2 outline-offset-2 outline-[var(--color-identity)]` — outline, not shadow.

### Named Rules

**The Tonal-Depth Rule.** Depth is conveyed through the three surface tokens (`--color-surface` < `--color-surface-alt` < `--color-surface-card`), not through shadows. **Prohibited:** drop shadows on inline content, ambient glows, and any shadow used to separate elements that share the same surface — use a tonal step or a 1 px border instead.

**The Flat-Card-Default Rule.** Cards are flat by default with a 1 px border and `shadow-sm`. **Prohibited:** nested cards (always wrong), gradient card backgrounds, pseudo-3D card lifts on hover.

## 5. Components

### Buttons

- **Shape:** `0.625 rem` (10 px) corners on the primary CTA — slightly tighter than card corners to feel pressable; `9999 px` (pill) on icon buttons.
- **Primary:** Solid `--color-accent-result` (`oklch(42% 0.14 220)`), white text, `1 rem` body weight 600, padding `0.75 rem 1 rem`, minimum height `3.25 rem` (52 px). Used sparingly — disclaimer acknowledgment, drawer "About" link, SelectPicker confirm. Never for "submit" because no calculator submits.
- **Hover / Focus:** Focus is `outline-2 outline-offset-2 outline-[var(--color-accent-light)]` — the accent-light variant carries the focus ring against the solid accent body. No hover transform; opacity stays 1.
- **Icon button** (`.icon-btn`): Transparent background, `--color-text-tertiary` glyph, 48 × 48 px hit area, glyph 18–24 px. Hover and focus shift glyph to `--color-accent`. Focus adds `0 0 0 2px var(--color-accent-light)` ring.
- **Tab (desktop calculator nav):** Transparent background, identity-colored when `aria-selected=true`, 48 px height, padding `0.75 rem 1 rem`, top corners `rounded-t-lg` with `border-b-2` underline in the active state. *(Per The Identity-Inside Rule, the `border-b-2` color shifts to Clinical Blue as the chrome accent — identity hue stays inside the route.)*

### Chips (segmented toggle)

- **Track:** `rounded-2xl` (`1 rem`) container, `--color-surface-alt` background, `border` 1 px, `shadow-inner`, padding `0.25 rem`.
- **Pill (active):** `--color-surface-card` background, identity text color, `rounded-xl` (`0.75 rem`), `shadow-sm`, padding `0.75 rem 1 rem`, weight 600, ui-size text. Two-state visual contrast: active rises out of the recessed track.
- **Pill (inactive):** Transparent background, `--color-text-primary`, hover lightens to `--color-surface` and identity hue. No border on inactive.

### Cards / Containers

- **Standard card** (`.card`): `rounded-xl` (`0.75 rem`), 1 px `--color-border`, `--color-surface-card` background, `shadow-sm`, padding `1 rem`.
- **Hero card:** `rounded-2xl` (`1 rem`) or `rounded-3xl` (`1.25 rem`) depending on calculator, identity-tinted background (`--color-identity-hero`), 1 px `--color-border`, `shadow-sm`, padding `1.5 rem 1.25 rem`. Houses the hero numeral and unit suffix.
- **Inputs card:** Standard `.card` styling. Always above the hero on mobile, beside the hero on desktop.
- **Drawer / Modal surface:** `rounded-2xl` (`1 rem`) on desktop, `rounded-t-2xl` on mobile (slides from bottom), `shadow-2xl`, `--color-surface-card` background. Footer respects `env(safe-area-inset-bottom)`.
- **No nested cards.** Ever. If a card needs internal grouping, use spacing and `--color-border` dividers, not a card-in-card.

### Inputs / Fields

- **NumericInput:** 48 px minimum height, 1 px `--color-border`, `--color-surface-card` background, `rounded-xl`, padding `0.5 rem 0.875 rem`, body-size text, `--color-text-primary`. Right-side suffix (`mg`, `kg`, `cm`) at body weight, `--color-text-tertiary`. Spinner buttons hidden (`appearance: none`); wheel events handled non-passively only when focused.
- **Focus:** `outline-2 outline-offset-2 outline-[var(--color-identity)]` — focus ring takes the calculator's identity hue *(per Identity-Inside, this is correct because the input lives inside the calculator's route)*.
- **Range hint** (under input): `--text-ui` (13 px), `--color-text-tertiary`, format `min–max unit` (e.g. `0.3–10 kg`). Uses en-dash, never em-dash.
- **Range error** (blur-gated): `--text-ui` (13 px), `--color-error`, copy `"Outside expected range. Verify."` Single sentence, period. **Never auto-clamps the value** — user is the source of truth, the input is advisory.
- **SelectPicker:** Trigger button looks like a NumericInput (same height, border, padding, radius). Chevron-down glyph at right, `--color-text-tertiary`. Opens a `<dialog>` SelectPicker (mobile = bottom sheet, desktop = centered).

### Navigation

- **Title bar (sticky):** `sticky top-0`, `--color-surface-card` background, 1 px bottom border, contains hamburger button (left), app title (center-left), theme toggle (right). Always visible.
- **Desktop calculator tabs:** Below title bar on `md:` and up. Horizontal `role="tablist"`, identity-class per tab, active tab carries Clinical Blue underline (`border-b-2`) and Clinical Blue text. Inactive tabs `--color-text-secondary`.
- **Mobile bottom tab bar:** `fixed bottom-0`, `--color-surface-card` background, 1 px top border, `safe-area-inset-bottom` padding. Each tab `min-h-14` (56 px) with icon (size 18) + 11 px UPPERCASE label. Active tab carries Clinical Blue text and a top inset stripe. Bottom nav clears `5 rem` on the page below it (verified against `env(safe-area-inset-bottom)`).
- **Hamburger drawer:** Slides from right on mobile (full height, `min(20rem, 85vw)` width), slides from right on desktop. Native `<dialog>` element. Title bar with close button, scrollable list of all registered calculators with neutral star icons (per Identity-Inside, stars are NOT identity-colored), favorites cap visible inline.

### Hero Result (signature pattern — to be codified in Phase 42.1)

Every calculator's primary result is rendered as a `<HeroResult>` block:
- Identity-tinted hero card (`--color-identity-hero` background)
- One-line eyebrow above (`label` role, identity color, UPPERCASE, e.g. "GLUCOSE INFUSION RATE", "ARTERIAL DEPTH")
- Display numeral (`display` role, `.num` tabular)
- Unit suffix beside the numeral in body weight, `--color-text-secondary`
- Optional secondary line below (e.g. "of weaning target", "from current rate") in `--text-ui`
- `aria-live="polite"` and `aria-atomic="true"` for screen readers when the value updates
- `animate-result-pulse` on value change (200 ms, reduced-motion respected)

**This pattern is shared across all calculators including future ones. Calculators do not invent their own hero shape.**

### Disclaimer Modal *(under review in Phase 42.1)*

Native `<dialog>` rendered via bits-ui Dialog primitives. Bottom sheet on mobile (`bottom-0`, `rounded-t-2xl`), centered on `sm:` and up (`rounded-2xl`). Single CTA button at full width. *Per the 2026-04-24 critique, the modal is being rescoped in Phase 42.1: drop one of the three locks (`onOpenChange={() => {}}` is redundant), shift CTA from solid-accent to outline, add re-read affordance in AboutSheet.*

## 6. Do's and Don'ts

### Do:
- **Do** declare every color in OKLCH. The token system in `app.css` is the single source of truth. New colors are added as tokens, not inlined as hex.
- **Do** use the `.num` utility on every clinical numeric output (doses, volumes, rates, depths, percentages). Tabular figures are non-negotiable.
- **Do** restrict identity hue to inside the calculator's route. Eyebrow, hero tint, slider track, calculator-input focus ring — yes. Global nav, hamburger drawer, title bar — no.
- **Do** size every interactive element at 48 px minimum (height for inputs/buttons, hit area for icons). Clinical use is one-handed in dim light.
- **Do** use `env(safe-area-inset-bottom)` on every fixed-bottom element. The mobile bottom nav clears `5 rem` of page below it; verify on every calculator.
- **Do** show range hints (`min–max unit`) under every NumericInput. Use en-dash (`–`), never em-dash (`—`).
- **Do** show out-of-range advisories on blur (`"Outside expected range. Verify."`) — never auto-clamp the value. The clinician is the source of truth.
- **Do** design dark mode intentionally: warm slate base, lower chroma at extremes, three-step surface lightness for tonal depth. Never auto-invert.
- **Do** use `aria-live="polite"` + `aria-atomic="true"` on the hero result so screen readers announce the new number when it changes.
- **Do** prevent FOUC: read `localStorage.nicu_assistant_theme` and apply `.dark` class before first paint via the inline script in `app.html`.
- **Do** preserve clinician's work: the disclaimer cannot wipe inputs, navigation cannot drop the calculator's state, and the input value persists in `sessionStorage` per calculator.

### Don't:
- **Don't** use `#000`, `#fff`, hex, RGB, or HSL anywhere in the codebase. **OKLCH only.**
- **Don't** use em dashes (`—` or `--`) in any user-rendered string, `aria-label`, or screen-reader copy. Screen readers read em-dash as a long pause; the ban applies to a11y too. Use colon, period, semicolon, or parentheses.
- **Don't** ship side-stripe borders. `border-left` or `border-right` greater than 1 px as a colored accent on cards, list items, or alerts is **prohibited** — already purged in commit `2378d29`. Replace with full borders, tinted backgrounds, or inset rings.
- **Don't** spread identity hue into the chrome. **Prohibited:** identity color on the active desktop tab underline (use Clinical Blue), identity color on hamburger-drawer star icons (neutral), identity color in the title bar. *(See The Identity-Inside Rule.)*
- **Don't** invent a new hero shape per calculator. Every calculator uses the shared `<HeroResult>` pattern. *(Codified in Phase 42.1.)*
- **Don't** show false precision. Morphine doses round to 3 decimals, percentages to 2. Format-for-display is separate from the parity-tested calculation result.
- **Don't** use red as a UI accent. Red is reserved for errors, out-of-range advisories, and validation. *(See The Red-Means-Wrong Rule.)*
- **Don't** use Amber for decoration or identity. Amber is **only** the BMF fortifier semantic in the formula calculator. *(See The Amber-as-Semantic Rule.)*
- **Don't** use 11 px text for advisory copy or paragraphs. 11 px is for labels only. *(See The 11 px Floor.)*
- **Don't** ship gradient text, gradient buttons, glassmorphism, or ambient glows. Decorative effects undermine clinical confidence.
- **Don't** use a modal as the first thought. The disclaimer modal is the only blocking modal in the system; everything else uses inline panels, sheets, or drawers.
- **Don't** nest cards. Ever. If a card needs internal grouping, use spacing and 1 px `--color-border` dividers.
- **Don't** ship icon-only navigation. Bottom nav, hamburger drawer rows, and desktop tabs always carry a text label beside the glyph. Clinical use does not have time to learn icon meanings.
- **Don't** auto-clamp NumericInput values. Show advisory on blur; trust the clinician.
- **Don't** ship pure consumer-health, legacy-EHR, SaaS-dashboard, marketing-page, or baby-app aesthetics. *(All five are PRODUCT.md anti-references.)*
- **Don't** ship animations the clinician will read as "the app is laggy." Scroll-driven scaling, decorative entrances, orchestrated page-loads — **prohibited**. Motion conveys state (result pulse, drawer open, focus ring), nothing else. Reduced-motion is always honored.
