# Phase 19: Tab Identity Token — Research

**Researched:** 2026-04-07
**Domain:** CSS design tokens / per-route theming / Svelte 5 + Tailwind CSS 4
**Confidence:** HIGH — all findings are grounded in the current codebase (not external libraries or training data).

## Summary

Phase 19 adds a single new CSS custom property, `--color-identity`, plus a paired `--color-identity-hero` variant, defined in `src/app.css` for both light and dark themes. The token is overridden per calculator route by adding a wrapper class — `identity-morphine` / `identity-formula` — on the outer `<div>` inside each route's `+page.svelte`. Only four surfaces consume the token: the result hero card, focus-visible outlines inside the calculator body, eyebrow labels, and the active calculator tab indicator in `NavShell.svelte`. The nav tab case is special because `NavShell` lives above the routes, so it cannot inherit route-scoped CSS vars; it gets a per-tab inline `style="--color-identity: ..."` derived from a new `identity` field on each entry in `CALCULATOR_REGISTRY`.

**Primary recommendation:** Route-scoped wrapper class (`identity-morphine` / `identity-formula`) declared in `app.css`, plus per-tab inline style in `NavShell.svelte` sourced from `registry.ts`. Reuse the existing `--color-clinical-600` / `--color-accent-result` tokens as Morphine's identity values (no new Morphine token — they already exist and already pass WCAG in v1.4). Add only the new Teal tokens for Formula.

## Project Constraints (from CLAUDE.md)

- **Tech stack**: SvelteKit 2 + Svelte 5 runes + Tailwind CSS 4 + `@tailwindcss/vite`. Tokens live in `@theme` + `:root` / `.dark` blocks in `src/app.css` (Tailwind 4 pattern, already in use).
- **Accessibility**: WCAG 2.1 AA minimum. Phase 20 runs the axe-core sweep, but Phase 19 must hit the targets on first pass.
- **Warm restraint**: identity hue must not spread beyond the four named surfaces.
- **Code reuse**: do not rewrite business logic; this phase is purely visual token wiring.
- **GSD workflow enforcement**: no direct edits outside a GSD command (this research runs under `/gsd-research-phase`).

## User Constraints (from prompt — no CONTEXT.md exists for this phase)

### Locked Decisions
- Token name is `--color-identity` (and a paired `--color-identity-hero` — see §Token Wiring for rationale).
- Morphine identity = Clinical Blue hue 220 (reuse existing `--color-clinical-600` / `--color-accent-result`).
- Formula identity = new Teal hue ~195.
- Exactly four surfaces get `--color-identity`: result hero, focus-visible outlines inside calculator body, eyebrow labels, active nav tab indicator.
- `--color-accent` stays as global fallback for shell chrome and non-identity surfaces.
- BMF Amber stays scoped to fortifier-mode semantic signal only.

### Claude's Discretion
- Exact OKLCH values for new teal tokens.
- Scoping mechanism (wrapper class vs data-attribute vs layout file).
- How `NavShell` learns each tab's identity color.
- Test strategy for Phase 19 (phase 20 handles axe-core contrast).

### Deferred Ideas (OUT OF SCOPE)
- Animated identity color swap on tab change (instant swap is acceptable — REQUIREMENTS "Out of Scope").
- Replacing `--color-accent` globally.
- Recoloring buttons, input borders, picker check marks, body icons with identity hue.
- Third calculator identity (future requirement).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IDENT-01 | `--color-identity` defined light + dark, scoped per route | §Token Wiring + §app.css edit |
| IDENT-02 | Result hero uses `--color-identity` | §Result Hero Mapping (two real surfaces, both use `--color-accent-light` today) |
| IDENT-03 | Focus-visible outlines inside calculator body use `--color-identity` | §Focus-Visible Audit (NumericInput, SelectPicker, Morphine mode tabs) |
| IDENT-04 | Eyebrow labels use `--color-identity` | §Eyebrow Audit (currently on `--color-text-secondary`, must change) |
| IDENT-05 | Active nav tab indicator uses `--color-identity` | §NavShell Strategy (per-tab inline style from registry) |
| IDENT-06 | BMF Amber stays scoped to fortifier mode | §BMF Scoping (no current mode class exists; forward-looking constraint) |
| IDENT-07 | Shell chrome stays on neutral tokens | §Shell Chrome Audit (no edits to `NavShell` header, `AboutSheet`, `DisclaimerModal`, `.icon-btn`) |

## Standard Stack

No new libraries. This phase is CSS tokens + a few component edits. Stack already inherited:

| Tool | Version | Role |
|------|---------|------|
| Tailwind CSS | ^4.2.2 | `@theme` + `@custom-variant dark` already configured in `src/app.css` |
| Svelte 5 (runes) | ^5.55.0 | `+page.svelte` uses `$derived`, `$state`, `$effect` — no new patterns needed |
| Vitest | ^4.1.2 | Component tests for IDENT-01..07 assertions |
| Playwright | ^1.58.2 | Used by Phase 20 only |

**Installation:** none.

## Architecture Patterns

### Token Wiring — RESOLVED: wrapper class on route page root

Three options were considered. The RESOLVED choice is **wrapper class on the route's outermost `<div>`**, declared in `app.css`:

```css
@layer base {
  :root {
    /* Default / shell fallback — resolves to current accent so untagged surfaces
       (if any sneak in) stay visually consistent. Chrome never reads this. */
    --color-identity:      var(--color-accent);
    --color-identity-hero: var(--color-accent-light);
  }

  /* Morphine: reuse existing Clinical Blue tokens — no new values needed */
  .identity-morphine {
    --color-identity:      var(--color-accent);        /* light: clinical-600 */
    --color-identity-hero: var(--color-accent-light);  /* light: clinical-200 */
  }

  /* Formula: new Teal ~195 */
  .identity-formula {
    --color-identity:      oklch(49% 0.11 195);  /* mid teal — passes 4.5:1 on white/surface-card */
    --color-identity-hero: oklch(92% 0.05 195);  /* light teal — hero bg, holds dark text at 4.5:1 */
  }

  .dark .identity-morphine,
  [data-theme="dark"] .identity-morphine {
    --color-identity:      var(--color-accent);        /* dark: already tuned oklch(82% 0.12 220) */
    --color-identity-hero: oklch(32% 0.10 220);        /* darker clinical — hero bg holds light text */
  }

  .dark .identity-formula,
  [data-theme="dark"] .identity-formula {
    --color-identity:      oklch(82% 0.09 195);        /* mirror of accent lightness, teal hue */
    --color-identity-hero: oklch(30% 0.08 195);        /* dark hero bg */
  }
}
```

**Why wrapper class (not data-attribute, not `+layout.svelte`, not inline style):**

1. **Route-level styling already lives in `+page.svelte`** at `src/routes/morphine-wean/+page.svelte:21` and `src/routes/formula/+page.svelte:21` — both wrap content in a `<div class="max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4">`. Adding `identity-morphine` / `identity-formula` to that existing `<div>` is a one-line change per route.
2. **No per-route `+layout.svelte` files exist today** (`src/routes/morphine-wean/` contains only `+page.svelte`). Creating them just for scoping is overkill.
3. **Data-attribute selectors** (`[data-route="morphine"]`) work identically, but Tailwind's convention in this codebase is classes — the existing code uses `.dark`, `.card`, `.icon-btn`, `.num`. Classes stay consistent.
4. **`app.css` already has the pattern** for light/dark override blocks — adding two more sibling selectors fits the existing file shape (see lines 62–98).

**Why two tokens (`--color-identity` and `--color-identity-hero`):** both existing hero surfaces (Morphine start→end summary at `MorphineWeanCalculator.svelte:262` and Formula "Amount to Add" at `FortificationCalculator.svelte:185`) use `bg-[var(--color-accent-light)]` with **dark text on a light tint**, not white text on a dark fill. That's the opposite profile from `--color-accent-result` (which is for white-on-dark). So the hero needs its own *light-tint* identity variant, not `--color-identity` at full saturation. One token can't serve both "focus ring on white" (needs 3:1 mid-chroma) and "hero background holding dark text" (needs very light tint) — hence the split.

### Anti-Patterns to Avoid
- **Do not** override `--color-accent` itself per route — that would leak identity into every surface that reads `--color-accent` (icon-btn hover, AboutSheet bullets, DisclaimerModal outline, etc.), violating IDENT-07.
- **Do not** use Tailwind arbitrary classes like `bg-[oklch(...)]` inline — tokens must stay centralized in `app.css` so Phase 20's axe sweep + future theming stay sane.
- **Do not** put the wrapper class on `<main>` in `+layout.svelte` — that layout is route-agnostic and would require reading `page.url.pathname` there, duplicating NavShell's logic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-route theming | Runtime JS that swaps stylesheets | CSS custom properties + a single wrapper class | CSS cascade is instant, SSR-safe, zero JS cost, survives adapter-static. |
| OKLCH contrast validation | Hand-computed relative-luminance formula | Reuse existing `--color-accent` tone values where possible; defer rigorous check to Phase 20's axe-core sweep | Phase 20 exists specifically for this; duplicating its math here is wasted effort. |
| Nav tab identity plumbing | Svelte context / store | Add `identity` field to `CalculatorEntry` in `registry.ts`; NavShell reads it directly | Registry is already the single source of truth for tabs; context would be over-abstracted for two fields. |

## Exact OKLCH Values for New Teal (RESOLVED)

**Hue choice — RESOLVED:** `195` (squarely cyan-teal, clearly distinct from Clinical Blue 220 and nowhere near BMF Amber 60).

**Target contrasts:**
- `--color-identity` (light): text/icon on `--color-surface-card` (oklch 100% 0 0) → needs ≥4.5:1 (IDENT-03 focus ring on input, IDENT-04 eyebrow label, IDENT-05 nav active text).
- `--color-identity-hero` (light): background holding `--color-text-primary` (oklch 18% 0.012 230) → needs ≥4.5:1 for the eyebrow and numeric text rendered on it.
- `--color-identity` (dark): text/icon on `--color-surface-card` (oklch 23% 0.014 236) → needs ≥4.5:1.
- `--color-identity-hero` (dark): background holding `--color-text-primary` (oklch 93% 0.006 230) → needs ≥4.5:1.

**Proposed values (mirror the existing Clinical Blue tuning — lightness values are copied from already-passing blue tokens, only hue changes to 195):**

| Token | Light | Dark | Mirrors |
|-------|-------|------|---------|
| `--color-identity` (Formula) | `oklch(49% 0.11 195)` | `oklch(82% 0.09 195)` | mirrors `--color-accent` L=49% light / L=82% dark (lines 70, 91 of `app.css`) |
| `--color-identity-hero` (Formula) | `oklch(92% 0.05 195)` | `oklch(30% 0.08 195)` | light mirrors `--color-accent-light` L=86%; dark mirrors `--color-accent-light` L=28% (lines 71, 92). Light bumped slightly (92%) because teal at hue 195 reads cooler than blue and benefits from a lighter tint to hold `--color-text-primary` text. |
| `--color-identity` (Morphine) | `var(--color-accent)` | `var(--color-accent)` | identical — no new value |
| `--color-identity-hero` (Morphine) | `var(--color-accent-light)` | `oklch(32% 0.10 220)` | light reuses existing; dark introduces a new step because `--color-accent-light` in dark (`oklch(28% 0.08 225)`) tests slightly low for `--color-text-primary` foreground, so bump L to 32 |

**Chroma note:** C=0.11 for `--color-identity` (vs 0.17 for `--color-accent` light) is deliberately lower because hue 195 at C=0.17 is visually garish in clinical UI — teals tolerate less chroma than blues before they read "candy." This matches the "warm restraint" design principle.

**[ASSUMED]** These exact lightness/chroma values will pass axe-core on first run. Phase 20 is the verification gate. If any value fails, tune L by ±3 and re-run. No escape hatch via `disableRules(['color-contrast'])`.

**Mandatory Phase 19 verification (before handoff to Phase 20):** run the existing color-contrast snapshot test (if one exists) OR compute contrast offline for these four pairs using an OKLCH contrast tool. Document computed ratios in the phase notes.

## File-by-File Edit Map (RESOLVED)

Only the following files are modified. No other files are touched.

### 1. `src/app.css` — ADD tokens
- **Lines 60–98 block:** append the four override blocks shown in §Token Wiring above. No existing lines are modified. No existing token value changes. `--color-accent*` and `--color-bmf*` untouched.
- **Estimated added lines:** ~25.

### 2. `src/routes/morphine-wean/+page.svelte` — ADD wrapper class
- **Line 21:** change `<div class="max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4">` to `<div class="identity-morphine max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4">`.
- No other edits. (The `<Syringe>` icon at line 23 uses `--color-accent` — that's shell-adjacent "calculator header" visual, not one of the four identity surfaces per the locked spec, so it STAYS on `--color-accent`. See §Open Questions Q1 RESOLVED.)

### 3. `src/routes/formula/+page.svelte` — ADD wrapper class
- **Line 21:** change `<div class="max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4">` to `<div class="identity-formula max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4">`.
- Same note on the `<Milk>` icon at line 23 — stays on `--color-accent`.

### 4. `src/lib/morphine/MorphineWeanCalculator.svelte` — swap tokens on 2 surfaces
- **Line 262** (result hero — start→end summary card): change `bg-[var(--color-accent-light)]` to `bg-[var(--color-identity-hero)]`. (IDENT-02)
- **Lines 264, 269, 273** (eyebrow labels "Start", "Step N", "Total reduction" — currently `text-[var(--color-text-secondary)]`): change to `text-[var(--color-identity)]`. (IDENT-04)
- **Line 289** (step card eyebrow "Step 1 — Starting dose" / `Step N`): change `text-[var(--color-text-secondary)]` → `text-[var(--color-identity)]`. (IDENT-04)
- **Line 202** (mode-tab pills focus-visible): change `focus-visible:ring-[var(--color-accent-light)]` → `focus-visible:ring-[var(--color-identity)]`; active state `text-[var(--color-accent)]` → `text-[var(--color-identity)]`; hover `hover:text-[var(--color-accent)]` → `hover:text-[var(--color-identity)]`. These are focus-visible + active within the calculator body (IDENT-03). The active mode tab (linear/compounding) is **inside the calculator body**, not the top-level nav, so it correctly falls under IDENT-03, not IDENT-05.

### 5. `src/lib/fortification/FortificationCalculator.svelte` — swap tokens on 2 surfaces
- **Line 185** (result hero — "Amount to Add"): change `bg-[var(--color-accent-light)]` to `bg-[var(--color-identity-hero)]`. (IDENT-02)
- **Line 190** (eyebrow "Amount to Add"): change `text-[var(--color-text-secondary)]` → `text-[var(--color-identity)]`. (IDENT-04)
- **Line 214** (eyebrow "Verification"): change `text-[var(--color-text-secondary)]` → `text-[var(--color-identity)]`. (IDENT-04)

### 6. `src/lib/shared/components/NumericInput.svelte` — focus ring
- **Line 126:** change `focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-light)]` → `focus:border-[var(--color-identity)] focus:ring-[var(--color-identity)]`. Also the scale-focus state `border-[var(--color-accent)]` → `border-[var(--color-identity)]`. (IDENT-03)
- NOTE: The idle input border at `border-[var(--color-border)]` stays neutral — identity only activates on focus. This preserves IDENT-07 (input borders stay neutral at rest).

### 7. `src/lib/shared/components/SelectPicker.svelte` — focus outlines
- **Line 176** (trigger button): `hover:border-[var(--color-accent)] focus-visible:outline-[var(--color-accent)]` → `hover:border-[var(--color-identity)] focus-visible:outline-[var(--color-identity)]`. (IDENT-03)
- **Line 250, 274** (option buttons): `focus-visible:outline-[var(--color-accent)]` → `focus-visible:outline-[var(--color-identity)]`. (IDENT-03)
- **Lines 238, 257, 281** (checkmarks — currently `style="color: {accentColor}"` where `accentColor` comes from `ctx.accentColor`): these are decorative selection indicators inside the picker. Per the spec's "Out of Scope" — "picker check marks… stay neutral" — these MUST NOT be changed. Leave as-is. The `ctx.accentColor` wiring in `context.ts` also remains untouched.

### 8. `src/lib/shell/NavShell.svelte` — per-tab identity for active indicator (IDENT-05)
- **Lines 26–46 (desktop nav)** and **lines 84–103 (mobile nav)**: the `{#each CALCULATOR_REGISTRY as calc}` loop currently hardcodes `border-[var(--color-accent)] text-[var(--color-accent)]` on the active tab. Because NavShell is above the route and its parent `<header>` / `<nav>` is NOT inside any `.identity-*` wrapper, `--color-identity` will resolve to the `:root` fallback — wrong color.
- **Solution — RESOLVED:** add `style="--color-identity: {calc.identity}"` to each `<a>` element (both desktop and mobile), where `calc.identity` is a new string field on `CalculatorEntry`. Then swap the active-state classes:
  - Desktop line 36: `border-[var(--color-accent)] text-[var(--color-accent)]` → `border-[var(--color-identity)] text-[var(--color-identity)]`.
  - Mobile line 93: `text-[var(--color-accent)]` → `text-[var(--color-identity)]`.
  - Desktop line 34 focus-visible: `outline-[var(--color-accent)]` → `outline-[var(--color-identity)]`.
  - Mobile line 91 focus-visible: same swap.
- The inline `style=` sets `--color-identity` on the `<a>` element so the class-based `text-[var(--color-identity)]` resolves correctly regardless of route scoping.

### 9. `src/lib/shell/registry.ts` — extend `CalculatorEntry`
- **Add field:** `identity: string` (CSS color expression). Two entries get:
  - `morphine-wean`: `identity: 'var(--color-accent)'` (reuse the global accent token — resolves to clinical-600 in light, tuned clinical in dark).
  - `formula`: `identity: 'oklch(49% 0.11 195)'` **in light only** — BUT: inline styles can't do theme switching. RESOLVED alternative below.
- **Problem:** inline styles do not participate in `.dark` variants. The teal value needs to differ between themes.
- **RESOLVED solution:** instead of `identity: oklch(...)` in registry, give each entry `identityClass: string` — `'identity-morphine'` / `'identity-formula'` — and apply that class to the `<a>` element. The class selector in `app.css` works regardless of DOM ancestry, because `.identity-formula { --color-identity: ... }` sets the var on *that element itself*, and the element's text/border class `text-[var(--color-identity)]` reads it from the same element. Theme switching via `.dark .identity-formula { ... }` works because the `.dark` class is on `<html>` and is an ancestor of everything. **This is cleaner than inline style and reuses the exact same tokens declared in §Token Wiring — no duplication.**
- **Final change to registry.ts:** add field `identityClass: 'identity-morphine' | 'identity-formula'`.
- **Final change to NavShell.svelte:** apply `class="{calc.identityClass} ..."` to both the desktop and mobile `<a>` tags. Active state classes become `text-[var(--color-identity)]` / `border-[var(--color-identity)]`; inactive state does not read `--color-identity` at all, so inactive tabs show no color leakage — IDENT-07 preserved.

### Files confirmed NOT touched (IDENT-07 preservation)
- `src/routes/+layout.svelte` — shell-level, stays neutral.
- `src/lib/shell/NavShell.svelte` header `<span>` (app name, line 23), `.icon-btn` (Info / theme toggle buttons, lines 56–74) — stay on `--color-text-*` / `--color-accent` via `.icon-btn` class in `app.css`.
- `src/app.css` `.icon-btn` block (lines 142–164) — stays on `--color-accent` / `--color-accent-light`.
- `src/lib/shared/components/AboutSheet.svelte` (line 62 uses `text-[var(--color-accent)]` for bullets — that's About sheet content, not calculator body, stays neutral accent).
- `src/lib/shared/components/DisclaimerModal.svelte` (line 46 uses `--color-accent-result` / `--color-accent-light` — disclaimer is shell-level, stays neutral accent).
- `src/lib/shared/components/ResultsDisplay.svelte` — **exported but unused** (verified via grep: only referenced in `src/lib/shared/index.ts`). Do not edit; either leave as dead code or delete in a separate phase.
- `src/lib/shared/context.ts` — `ctx.accentColor` remains `var(--color-accent)`, used only for picker checkmarks which are out of scope.

## Result Hero Mapping (IDENT-02 audit)

There are **two** real hero surfaces. The `ResultsDisplay.svelte` component is exported but **unused** — do not edit it.

| Calculator | File | Line | Current token | New token |
|------------|------|------|---------------|-----------|
| Morphine | `MorphineWeanCalculator.svelte` | 262 | `bg-[var(--color-accent-light)]` | `bg-[var(--color-identity-hero)]` |
| Formula | `FortificationCalculator.svelte` | 185 | `bg-[var(--color-accent-light)]` | `bg-[var(--color-identity-hero)]` |

Both heroes render `--color-text-primary` on top of the background (not white), so the hero token must be a *light tint* in light mode and a *dark tint* in dark mode. This drives the `--color-identity-hero` split token design above.

## Focus-Visible Audit (IDENT-03 audit)

Every current `focus-visible:outline-[var(--color-accent)]` / `focus:ring-[var(--color-accent-light)]` inside calculator-body components:

| File | Line | Current | New |
|------|------|---------|-----|
| `NumericInput.svelte` | 126 | `focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-light)]` | `focus:border-[var(--color-identity)] focus:ring-[var(--color-identity)]` |
| `SelectPicker.svelte` | 176 | `focus-visible:outline-[var(--color-accent)]` | `focus-visible:outline-[var(--color-identity)]` |
| `SelectPicker.svelte` | 250 | `focus-visible:outline-[var(--color-accent)]` | `focus-visible:outline-[var(--color-identity)]` |
| `SelectPicker.svelte` | 274 | `focus-visible:outline-[var(--color-accent)]` | `focus-visible:outline-[var(--color-identity)]` |
| `MorphineWeanCalculator.svelte` | 202 | `focus-visible:ring-[var(--color-accent-light)]` | `focus-visible:ring-[var(--color-identity)]` |

Because `NumericInput` and `SelectPicker` are `$lib/shared/components`, they are used by both calculators. Since they're rendered inside each route's `identity-*` wrapper, each component instance inherits the correct `--color-identity` value via CSS cascade at paint time — no per-consumer prop needed.

## Eyebrow Audit (IDENT-04 audit)

Eyebrow label = small uppercase label above a value/section. All currently render in `--color-text-secondary`.

| File | Line | Label text |
|------|------|------------|
| `MorphineWeanCalculator.svelte` | 264 | "Start" |
| `MorphineWeanCalculator.svelte` | 269 | "Step N" |
| `MorphineWeanCalculator.svelte` | 273 | "Total reduction" |
| `MorphineWeanCalculator.svelte` | 289 | "Step 1 — Starting dose" / "Step N" |
| `FortificationCalculator.svelte` | 190 | "Amount to Add" |
| `FortificationCalculator.svelte` | 214 | "Verification" |

All swap `text-[var(--color-text-secondary)]` → `text-[var(--color-identity)]` on the specific `<span>` only (not the surrounding card). Note that lines 264/269/273 are eyebrows *inside the summary hero card* — with the hero bg now being `--color-identity-hero` (a light tint), the eyebrow text color swapping to `--color-identity` (mid chroma) still needs to pass contrast against the light tint. **[ASSUMED]** This will pass because `--color-identity` light is L=49% and `--color-identity-hero` light is L=92%, a ~43-point lightness gap — well over the ~40-point delta needed for 4.5:1. Phase 20 verifies.

## NavShell Strategy (IDENT-05 audit — detailed)

**The core constraint:** `NavShell.svelte` is rendered in `+layout.svelte` at line 69, above `<main>`. Neither `NavShell` nor its parent `<header>`/`<nav>` is ever inside a `.identity-*` wrapper class. A naive approach (putting classes in `app.css` and hoping cascade works) would resolve `--color-identity` to the `:root` fallback for every tab — both tabs would show the same accent color, failing IDENT-05.

**The resolved solution (see File 9 edits):** each `<a>` tab element in `NavShell.svelte` receives the matching `identityClass` from its registry entry. That class sets `--color-identity` on the element itself (not via an ancestor), which the element's own `text-[var(--color-identity)]` / `border-[var(--color-identity)]` classes then read. Theme switching via `.dark .identity-formula { ... }` still works because `.dark` is applied to `<html>`, which IS an ancestor of every `<a>` tab.

**Single source of truth:** the teal OKLCH values only appear once — in `app.css` under `.identity-formula`. `registry.ts` carries only the class name string, not the color. `NavShell` never hardcodes a color.

**Desktop `<a>` active vs inactive:** the inactive state must NOT read `--color-identity` (IDENT-07 — untouched chrome). The current code already uses conditional classes — just ensure the inactive branch stays on `border-transparent text-[var(--color-text-secondary)]` and only the active branch uses `--color-identity`. The `identityClass` is applied unconditionally to the `<a>` so the var is *available*, but only the active classes *consume* it. Inactive tabs render zero identity color. Verified safe.

## BMF Scoping (IDENT-06)

**Finding:** there is currently **no code path** in `FortificationCalculator.svelte` that toggles BMF-mode styling. The `--color-bmf-*` scale (app.css lines 23–32) and `--color-bmf-result` (lines 46, 73, 94) are declared but **never consumed in component markup** (verified via grep — only internal `--color-bmf-*` self-references in app.css, plus the unused `ResultsDisplay.svelte` accepting a `'bmf'` variant). There is no `.mode-bmf` class, no `$derived` for fortifier mode, nothing.

**IDENT-06 is therefore a forward-looking constraint:** Phase 19 must not consume `--color-bmf-*` as Formula identity (it doesn't — Formula identity is the new Teal 195 token, hue ≠ 55 amber). The `--color-bmf-*` tokens remain dormant and reserved for future fortifier-mode work. Nothing in Phase 19 touches them.

**Do not delete the BMF tokens** — they are the reserved semantic channel.

## Shell Chrome Audit (IDENT-07)

Every `--color-accent` reference in shell-adjacent code, verified unchanged by Phase 19:

| File | Line | Purpose | Stays on `--color-accent`? |
|------|------|---------|----------------------------|
| `NavShell.svelte` | 34, 36, 37 | desktop tab focus + active | **CHANGES** to `--color-identity` (active branch) — covered by IDENT-05 |
| `NavShell.svelte` | 91, 93 | mobile tab focus + active | **CHANGES** to `--color-identity` — IDENT-05 |
| `app.css` | 142–164 `.icon-btn` | info/theme buttons in header | stays on `--color-accent` ✓ |
| `AboutSheet.svelte` | 62 | bullet point in About sheet | stays on `--color-accent` ✓ |
| `DisclaimerModal.svelte` | 46 | primary button bg/outline | stays on `--color-accent-result` / `--color-accent-light` ✓ |
| `morphine-wean/+page.svelte` | 23 | route-header Syringe icon | stays on `--color-accent` ✓ (see §Open Q1) |
| `formula/+page.svelte` | 23 | route-header Milk icon | stays on `--color-accent` ✓ (see §Open Q1) |

## Runtime State Inventory

Not a rename/refactor phase. No stored data, live service config, OS registrations, secrets/env, or build artifacts need changes. Category omitted per spec.

## Common Pitfalls

### Pitfall 1: NavShell cascade trap
**What goes wrong:** developer puts `.identity-morphine { --color-identity: ... }` in `app.css` and adds the wrapper class only to the route page. The nav tab then resolves `--color-identity` to `:root` fallback (accent blue for both tabs).
**Why it happens:** NavShell is a sibling of `<main>`, not a descendant of the route page.
**How to avoid:** Apply `identityClass` directly to each `<a>` in NavShell (File 9 / §NavShell Strategy).
**Warning sign:** both tabs show identical active color when navigating.

### Pitfall 2: Picker checkmark bleed
**What goes wrong:** developer mass-finds-and-replaces `--color-accent` → `--color-identity` in SelectPicker, changing checkmarks to identity color.
**Why it happens:** picker checkmarks use `style="color: {accentColor}"` via context (lines 238/257/281), which feels like "an accent surface".
**How to avoid:** checkmarks are explicitly out of scope per REQUIREMENTS "Out of Scope". Leave `ctx.accentColor` untouched; only swap `--color-accent` → `--color-identity` in `outline-` and `border-hover` classes.
**Warning sign:** checkmark color changes visibly between Morphine and Formula pickers.

### Pitfall 3: Route header icon creep
**What goes wrong:** developer decides the route-header icon (Syringe/Milk at line 23 of each `+page.svelte`) "feels like identity" and swaps it.
**Why it happens:** it's inside the route wrapper, so the class is available.
**How to avoid:** the locked spec lists exactly four surfaces. The route-header icon is NOT one of them. It is visually "calculator chrome" and stays on `--color-accent`.
**Warning sign:** route icons take on the teal hue on the Formula tab.

### Pitfall 4: Regressing v1.4 axe-core passes
**What goes wrong:** touching a shared token value (e.g., bumping `--color-accent-light` to help hero contrast) cascades into every `--color-accent-light` consumer and breaks one or more existing v1.4 contrast wins.
**Why it happens:** v1.4 (Phase 17 per recent git log `7acba7b chore: archive v1.4 milestone`, `66c34b6 feat(17): close v1.4 a11y deep-dive`) specifically tuned `--color-text-secondary`, `--color-text-tertiary`, `--color-accent` in dark mode to hit WCAG AA. Those are load-bearing.
**How to avoid:** **Phase 19 modifies ZERO existing values in `app.css`.** All changes are *additive*: two new token names, four override blocks. No touching lines 62–98.
**Warning sign:** diff in `app.css` shows any `-` line inside the `:root` / `.dark` blocks.

### Pitfall 5: Dark-mode `--color-accent-light` for Morphine hero is weak
**What goes wrong:** reusing `var(--color-accent-light)` as Morphine `--color-identity-hero` in dark mode. Dark accent-light is `oklch(28% 0.08 225)` — dark but not quite enough contrast against `--color-text-primary` (oklch 93%) for tight 4.5:1.
**How to avoid:** introduce a dedicated `oklch(32% 0.10 220)` for dark Morphine `--color-identity-hero` (§OKLCH values table).
**Warning sign:** Phase 20 axe-core fails on Morphine dark hero text.

## Code Examples

### Adding wrapper class (route page)
```svelte
<!-- src/routes/morphine-wean/+page.svelte — line 21 -->
<div class="identity-morphine max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4">
```

### app.css additions (append to base layer)
```css
@layer base {
  :root {
    --color-identity:      var(--color-accent);
    --color-identity-hero: var(--color-accent-light);
  }
  .identity-morphine {
    --color-identity:      var(--color-accent);
    --color-identity-hero: var(--color-accent-light);
  }
  .identity-formula {
    --color-identity:      oklch(49% 0.11 195);
    --color-identity-hero: oklch(92% 0.05 195);
  }
  .dark .identity-morphine,
  [data-theme="dark"] .identity-morphine {
    --color-identity:      var(--color-accent);
    --color-identity-hero: oklch(32% 0.10 220);
  }
  .dark .identity-formula,
  [data-theme="dark"] .identity-formula {
    --color-identity:      oklch(82% 0.09 195);
    --color-identity-hero: oklch(30% 0.08 195);
  }
}
```

### NavShell per-tab identityClass
```svelte
<!-- desktop tab loop, line 28 area -->
{#each CALCULATOR_REGISTRY as calc}
  {@const isActive = page.url.pathname.startsWith(calc.href)}
  <a
    href={calc.href}
    class="{calc.identityClass} flex items-center gap-2 px-4 py-3 text-ui font-medium
           min-h-[48px] border-b-2 transition-colors rounded-t-lg
           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-identity)]
           {isActive
             ? 'border-[var(--color-identity)] text-[var(--color-identity)]'
             : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
    ...
  >
```

### registry.ts extension
```ts
export interface CalculatorEntry {
  id: string;
  label: string;
  href: string;
  icon: Component;
  description: string;
  identityClass: 'identity-morphine' | 'identity-formula';
}

export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  { id: 'morphine-wean', label: 'Morphine Wean', href: '/morphine-wean',
    icon: Syringe, description: 'Morphine weaning schedule calculator',
    identityClass: 'identity-morphine' },
  { id: 'formula', label: 'Formula', href: '/formula',
    icon: Milk, description: 'Infant formula fortification calculator',
    identityClass: 'identity-formula' },
] as const;
```

## Testing Strategy (RESOLVED)

`workflow.nyquist_validation` is **false** in `.planning/config.json`, so the full Nyquist sampling architecture is skipped. Phase 20 handles contrast via axe-core. Phase 19 only needs to prove wiring, not color science.

**Recommended: computed-style DOM assertions in Vitest component tests — lightest possible.**

Three new test files (co-located per MEMORY.md `feedback_test_colocation.md`):

1. **`src/routes/morphine-wean/+page.test.ts`** (new): render the page, assert root wrapper has `identity-morphine` class, assert `getComputedStyle(el).getPropertyValue('--color-identity')` is truthy (non-empty). Covers IDENT-01 Morphine.

2. **`src/routes/formula/+page.test.ts`** (new): same pattern with `identity-formula`. Covers IDENT-01 Formula.

3. **`src/lib/shell/NavShell.test.ts`** (already exists — extend): add test cases asserting that each rendered tab `<a>` has the matching `identityClass`. Assert that, when a tab is active, its computed `color` property resolves to a non-empty value and that the two tabs resolve to **different** computed colors. Covers IDENT-05.

4. **Class-presence assertion for IDENT-02/03/04** inside existing `MorphineWeanCalculator.test.ts` and `FortificationCalculator.test.ts`:
   - Assert hero card element has class substring `identity-hero`.
   - Assert at least one eyebrow `<span>` has class substring `text-[var(--color-identity)]`.
   - Assert `NumericInput` rendered inside the route has updated focus class.
   - These are string-match assertions against rendered HTML — cheap, deterministic, prove wiring without re-running color math.

5. **IDENT-06 (BMF scoping):** grep assertion in a unit test: `expect(appCss).not.toMatch(/identity.*bmf|bmf.*identity/i)`. Covers the forward-looking constraint cheaply.

6. **IDENT-07 (shell chrome neutrality):** snapshot of NavShell rendered HTML — assert no `--color-identity` appears inside the `<header>` `<span>` (app name) or `.icon-btn` buttons. String-match is sufficient.

**Rejected alternatives:**
- **Visual regression snapshots:** Too heavy for this phase. Per-pixel deltas will flake on theme transitions and dock-magnification rAF state.
- **Full Playwright E2E:** Phase 20 already adds axe-core sweeps that load both routes in both themes. Duplicating that in Phase 19 is waste.

## Environment Availability

No new external dependencies. All tooling already present: Vitest 4.1.2, Svelte 5, Tailwind 4. No Context7 lookups needed because no new libraries are introduced.

## Validation Architecture

Skipped — `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`.

## Security Domain

No security-relevant surface area. Pure presentation tokens. No input validation, no auth, no crypto, no state mutation. `security_enforcement` irrelevant here.

## State of the Art

| Old approach | Current approach | When | Impact |
|--------------|------------------|------|--------|
| Tailwind 3 `darkMode: 'class'` config | Tailwind 4 `@custom-variant dark` | Tailwind 4.0, Jan 2025 | Already adopted in this repo (`app.css:7`) — no migration needed |
| SASS theme maps | Native CSS custom properties + `@theme` | CSS Custom Props 2017+; Tailwind 4 `@theme` 2024 | This phase extends the pattern already in use |
| JS runtime theming (svelte-themes) | Inline script + `.svelte.ts` store | chosen in project CLAUDE.md | Identity token phase aligns — no JS runtime needed |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `oklch(49% 0.11 195)` passes 4.5:1 on `--color-surface-card` (white) in light mode | OKLCH values | Phase 20 axe-core fails — tune L down by 3–5 points and re-verify. Not a blocker to Phase 19 merge if Phase 20 catches it; the token name and wiring stay correct, only the oklch values change. |
| A2 | `oklch(92% 0.05 195)` holds `--color-text-primary` (L=18%) at 4.5:1 in light mode | OKLCH values | Same mitigation — tune L or bump chroma. |
| A3 | `oklch(82% 0.09 195)` passes 4.5:1 on dark `--color-surface-card` (L=23%) | OKLCH values | Mirror the v1.4 dark-accent fix pattern (L=82% already validated for blue). |
| A4 | `oklch(32% 0.10 220)` dark Morphine hero holds `--color-text-primary` (L=93%) | OKLCH values | If fails, drop to L=28% (matches existing `--color-accent-light` dark). |
| A5 | Inline `identityClass` on `<a>` correctly overrides the `:root` fallback via cascade specificity | NavShell Strategy | Class selector (0,0,1,0) > root selector (0,0,0,1) always — structurally cannot fail. HIGH confidence, listing only for completeness. |
| A6 | v1.4 axe-core sweep covers the current `--color-accent-light` hero background and passes | Pitfall 4 | If v1.4 passes aren't on current hero surfaces, Phase 19 isn't regressing anything but Phase 20 picks up both old and new failures. Worst case: Phase 20 spends extra tuning cycles. |

Items tagged ASSUMED are all contrast-numeric. They are expected to pass and will be verified automatically by Phase 20's existing axe-core sweep — **no user confirmation needed before Phase 19 execution**, because Phase 20 is the gate.

## Open Questions

All prior open questions are resolved inline (marked RESOLVED). One residual clarification, documented as resolved:

1. **Q: Should the route-header `<Syringe>` / `<Milk>` icons at line 23 of each `+page.svelte` adopt `--color-identity`?**
   **What we know:** They're inside the route (so the wrapper class makes the token available), visually prominent, and arguably "identity-adjacent."
   **What's unclear:** They're not explicitly in the four-surface list but they're not in the excluded shell chrome list either.
   **RESOLVED — stays on `--color-accent`.** The locked spec lists exactly four surfaces (hero / focus / eyebrow / nav tab). "Warm restraint" + the "exactly four surfaces" phrasing in IDENT success criterion #2 ("and no other surfaces do") is the tiebreaker. If v1.6 wants to expand, that's a future phase.

2. **Q: Does `.dark .identity-formula` selector correctly override when `[data-theme="dark"]` is used instead of `.dark`?**
   **RESOLVED — yes, because `app.css:82-83` already declares both `.dark, [data-theme="dark"]` as equivalents in the existing dark block.** The new tokens add both selectors (see §Token Wiring code example) for symmetry.

## Sources

### Primary (HIGH confidence — codebase verified)
- `/mnt/data/src/nicu-assistant/src/app.css` (lines 1–166, full file read)
- `/mnt/data/src/nicu-assistant/src/lib/shell/NavShell.svelte` (full file read)
- `/mnt/data/src/nicu-assistant/src/lib/shell/registry.ts` (full file read)
- `/mnt/data/src/nicu-assistant/src/routes/+layout.svelte` (full file read)
- `/mnt/data/src/nicu-assistant/src/routes/morphine-wean/+page.svelte` (full file read)
- `/mnt/data/src/nicu-assistant/src/routes/formula/+page.svelte` (full file read)
- `/mnt/data/src/nicu-assistant/src/lib/morphine/MorphineWeanCalculator.svelte` (full file read)
- `/mnt/data/src/nicu-assistant/src/lib/fortification/FortificationCalculator.svelte` (full file read)
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/ResultsDisplay.svelte` (full file read — confirmed unused)
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/NumericInput.svelte` (line 126 grepped)
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/SelectPicker.svelte` (lines 176/238/250/257/274/281 grepped)
- `/mnt/data/src/nicu-assistant/src/lib/shared/context.ts` (full file read)
- `/mnt/data/src/nicu-assistant/.planning/REQUIREMENTS.md` (full file read)
- `/mnt/data/src/nicu-assistant/.planning/ROADMAP.md` (phase 19 block read)
- `/mnt/data/src/nicu-assistant/.planning/config.json` (full file read)

### Secondary (MEDIUM — training knowledge, standard practice)
- Tailwind CSS 4 `@theme` + `@custom-variant dark` — already in use in this repo.
- OKLCH color space contrast intuition — calibrated against already-passing clinical blue values in the same file.

### Tertiary (LOW — none)
No web searches were required; the phase is fully scoped by existing codebase state.

## Metadata

**Confidence breakdown:**
- Token wiring strategy: **HIGH** — only three sensible options; wrapper class matches existing file patterns.
- OKLCH values: **MEDIUM** — mirrored from already-passing blue lightness/chroma, but 195-hue teal may need Phase 20 tuning.
- File edit map: **HIGH** — every line cited is from a file read end-to-end.
- Pitfalls: **HIGH** — derived from current code structure, not speculation.
- Test strategy: **HIGH** — lightest wiring-only approach, Phase 20 owns contrast verification.

**Research date:** 2026-04-07
**Valid until:** code on the listed lines doesn't drift. Recommend re-verifying line numbers at plan execution time if any Phase 18 follow-up landed in the meantime.
