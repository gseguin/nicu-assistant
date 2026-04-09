# Phase 29 — GIR Titration Hero Swap · CONTEXT

**Milestone:** v1.9 — GIR Titration Hero Swap + Polish
**Phase:** 29
**Goal:** A bedside clinician reading a GIR titration bucket sees the actionable Δ rate first, not the recalculated GIR value — and every v1.8 a11y guarantee still holds.
**Requirements:** GIR-SWAP-01 through GIR-SWAP-07

---

## Vision

Act on the first piece of real clinician field feedback on v1.8 GIR. At bedside the useful number is "increase drip by 0.9 ml/hr," not "the new target GIR is 5.1 mg/kg/min." Promote Δ rate to the hero on every titration bucket, demote GIR mg/kg/min into the secondary metrics row. Zero architectural change — same component, same semantics, same tests shape, just a layout/type swap plus targeted styling.

## Surface area (scouted)

**Single file primarily affected:** `src/lib/gir/GlucoseTitrationGrid.svelte` (190 lines).

- Mobile layout: `sm:hidden` vertical card stack (lines ~89–148)
  - Current hero: `row.targetGirMgKgMin.toFixed(1)` in `text-display font-black` + `mg/kg/min` unit in `text-ui text-[var(--color-text-tertiary)]`
  - Current secondary row: `grid grid-cols-3` with Fluids | Rate | Δ rate
- Desktop layout: `hidden sm:grid` table (lines ~150–189)
  - Current columns (in order): `GIR | Fluids | Rate | Δ rate`
  - Δ rate styling is `text-base num text-[var(--color-text-secondary)]`
- Shared helper: `formatDelta(delta)` → `{ glyph: '▲'|'▼', abs: string, word: '(increase)'|'(decrease)' }`
- Special branch: `stopInfusion = row.targetGirMgKgMin <= 0` (severe neuro bucket) — currently renders `0 mg/kg/min — consider stopping infusion` as the hero instead of the GIR value
- Δ = 0 branch: inline ternary renders `0 ml/hr (no change)` in the secondary slot
- Accessibility: `role="radiogroup"` on the mobile container, `role="radio"` per row, roving tabindex via `focusIndex`, `ariaLabelFor(row)` composes the SR label, focus-visible ring in identity color
- `aria-live` announcements come from outside this component (GirCalculator handles result announcements)

**Test files that will need updating:**
- `src/lib/gir/GlucoseTitrationGrid.test.ts` — component tests asserting hero content, secondary row content, keyboard matrix, radiogroup semantics
- `tests/` Playwright GIR happy-path at mobile 375 + desktop 1280
- `tests/` Playwright a11y suite — 6 GIR axe sweeps (light/dark/focus/advisory/selected-bucket)
- `src/lib/gir/GirCalculator.test.ts` — may reference hero text from the grid child

## Locked decisions (from requirements — not up for discussion)

- Δ rate hero uses the same weight/size GIR had in v1.8 (`text-display font-black`)
- Secondary row order: **Fluids | Rate | GIR** (GIR takes the rightmost slot Δ rate vacated)
- All v1.8 a11y guarantees preserved unchanged: radiogroup, roving tabindex, `aria-live`, identity color, focus rings, `prefers-reduced-motion`
- 16/16 axe sweeps green in light + dark **before PR** (per v1.8 "axe BEFORE PR" decision)
- Component + E2E tests updated for new hero
- `role="radiogroup"` stays — locked from v1.8, not re-opened
- No new OKLCH tokens, no new identity hues

## Decisions captured in this discussion

### Decision 1 — Desktop table column reorder

**Choice:** Reorder desktop table columns to match mobile semantics: **Δ rate | Fluids | Rate | GIR**.

**Why:** Cross-layout consistency beats preserving v1.8 column muscle memory. v1.8 was only two months in production, and the whole point of this milestone is that the v1.8 ordering was wrong for bedside use — desktop should get the same correction mobile does, not a half-measure restyle.

**Implementation note for planner:** Update both the `<div class="... sm:grid">` header row (line ~150) and each data row. Δ rate column header should get the hero-appropriate weight; GIR column drops to secondary weight.

### Decision 2 — Δ = 0 no-change hero treatment

**Choice:** Use an **em-dash `—`** as the hero character for buckets where `deltaRateMlHr === 0`.

**Why:** Silent, unambiguous, culturally understood as "no value / no action." Avoids the confusion of showing "0 ml/hr" as hero-sized type (reads like a real number). Avoids "Maintain" / "No change" which competes with the eyebrow label for attention.

**Implementation note for planner:**
- Hero slot renders a single em-dash `—` in the same `text-display font-black` type scale
- Consider a softened color (`var(--color-text-tertiary)`) so the em-dash doesn't outweigh populated buckets
- Secondary row still shows Fluids | Rate | GIR as normal — no change to the demoted row's behavior
- Screen reader should announce something more explicit than "em-dash" — see Decision 6 below

### Decision 3 — Direction glyph and unit styling on the new hero

**Choices:**
- `▲` / `▼` glyph sits **left of the number** (e.g., `▲ 0.9 ml/hr`)
- `ml/hr` unit gets the **same de-emphasis treatment** `mg/kg/min` had on the v1.8 hero (`text-ui text-[var(--color-text-tertiary)]`)
- `(increase)` / `(decrease)` word stays **parenthetical and smaller** — not a separate line, not dropped

**Why:** Mirrors the v1.8 GIR hero structure as closely as possible so muscle memory transfers. Parenthetical word + glyph redundancy is a deliberate belt-and-braces safety: color-blind users, glyph rendering issues, and glance-readers are all covered.

**Implementation note for planner:**
- Mobile hero structure (approximate): `<div class="flex items-baseline gap-2"><span glyph><span big-number>0.9</span><span small-unit>ml/hr</span><span small-paren>(increase)</span></div>`
- Reuse `formatDelta()` unchanged — it already returns glyph, abs, and word
- Maintain baseline alignment of glyph + number (glyph is the same typographic weight as the number, unit + paren recede)
- Parenthetical word size should match the v1.8 `text-ui` scale (same as the old `mg/kg/min` unit scale)

### Decision 4 — Direction color coding

**Choice:** **No color differentiation between ▲ increase and ▼ decrease.** Both use identity-green as the full-hero color.

**Why:** Keeps v1.9 honest to its "no new identity hues" out-of-scope guardrail. Avoids axe tuning work. Glyph + parenthetical word already carry the direction semantic.

**Deferred idea captured in `.planning/NOTES.md`:** "GIR Δ rate direction color coding" — revisit in a future polish milestone if field feedback shows monochrome hero is a bedside confusion source.

### Decision 5 — `stopInfusion` card (severe neuro, GIR ≤ 0) hero

**Choice:** A **distinct "STOP" treatment** — the stop-infusion card gets its own hero visual, not the Δ rate hero and not the em-dash.

**Why:** This is the highest-stakes card in the whole grid. Clinically it means "glucose is dangerous low, consider stopping the dextrose drip entirely." Neither "Δ rate" nor "GIR value" is the right headline here — the headline is the *action*: STOP.

**Implementation note for planner:**
- Replace the current `0 mg/kg/min — consider stopping infusion` text with a typographically distinct hero (e.g., `STOP` word + short qualifier, or a clear stop-style treatment that still respects clinical restraint — no red unless it passes axe in both themes, no icons that look playful)
- The card's role in the radiogroup and keyboard nav MUST be preserved — it's still selectable
- The eyebrow label is "IF SEVERE NEURO SIGNS" (not a glucose range) — keep
- Secondary metrics row: Fluids and Rate still apply to the target the clinician would titrate *to* (or show `—` if not meaningful); GIR slot shows `0 mg/kg/min`
- **Strongly prefer:** no new color tokens. Try weight, caps, spacing, and an optional border-left treatment (already used for selection) to carry the "stop" signal
- **Axe constraint:** any treatment MUST pass contrast in light + dark before PR

### Decision 6 — Screen reader `aria-label` composition

**Choice (small-stuff bucket, no discussion needed):** Update `ariaLabelFor(row)` so the Δ rate action is announced **first** in the composed label, matching the new visual hierarchy.

**Why:** SR users should get the same "action-first" reading order that sighted users get. v1.8 labeled rows starting with the glucose range and GIR value — new order should start with the glucose range (still the anchor) and then the action.

**Suggested shape for planner (not locked, planner may refine):**
- Normal bucket: `"Glucose {range} mg/dL. {direction} rate by {abs} ml/hr. Target GIR {targetGir} mg/kg/min, fluids {fluids} ml/kg/d, rate {rate} ml/hr."`
- Δ = 0 bucket: `"Glucose {range} mg/dL. No change in rate. Target GIR {targetGir} mg/kg/min, fluids {fluids} ml/kg/d, rate {rate} ml/hr."`
- Stop-infusion bucket: `"Severe neuro signs. Stop dextrose infusion. Current rate {rate} ml/hr."` (or similar — planner confirms)

## Non-goals (explicit)

- **No new identity hues or OKLCH tokens.** If axe surfaces contrast issues post-swap, fix with existing token bumps only.
- **No change to `role="radiogroup"` semantics or keyboard nav.**
- **No change to `formatDelta()`** — it already returns what we need.
- **No change to the GIR calculation logic** in `src/lib/gir/calculations.ts`. This is a pure presentation layer phase.
- **No change to `GirCalculator.svelte`** except tests if they assert text content from the grid child. The top-level result display (Current GIR + Initial rate) is out of scope for Phase 29 — it is NOT a titration bucket.
- **No polish of Morphine or Formula calculators** — that's Phase 30.

## Deferred / scope boundary notes

- **"Maintain current rate" copy option** for Δ=0 — rejected in favor of em-dash. Reconsider only if usability feedback says em-dash is too cryptic.
- **Badge-style Δ rate indicator** (e.g., a pill on each row) — rejected; hero swap is the goal, not a third visual mode.
- **Hero-level direction color** — captured in NOTES.md as a deferred idea.

## Downstream guidance

### For `gsd-phase-researcher` (if spawned)
This phase is a layout swap on a single Svelte component with tests; research scope is narrow.
- **Do NOT research:** general GIR clinical theory (v1.8 already did this), radiogroup ARIA patterns (locked), new color tokens (explicitly out of scope)
- **DO look at:** Svelte 5 + Tailwind 4 patterns for baseline-aligned mixed-size typographic heroes (big number + small unit + small parenthetical); axe-core false-positive patterns for text-size + tertiary-color combinations if the em-dash hero trips contrast heuristics; any prior `text-display font-black` usage elsewhere in the codebase for consistency
- **Confirm:** that `text-display`, `font-black`, `num` (tabular), `text-2xs`, `text-ui` utility classes are still the right building blocks vs. anything newer added since v1.8

### For `gsd-planner`
- Expect roughly **1–2 plans**: one for the layout + style swap + tests, optionally a second if the STOP treatment warrants its own tight scope
- **Wave structure:** presentation + tests in the same wave (TDD-friendly), then axe sweep verification as the gate
- **File touch list (expected):**
  - `src/lib/gir/GlucoseTitrationGrid.svelte` — main change
  - `src/lib/gir/GlucoseTitrationGrid.test.ts` — component test updates
  - Playwright GIR specs for E2E + a11y sweeps (new hero assertions, new axe snapshots if applicable)
  - `GirCalculator.test.ts` only if it asserts grid-child text
- **Gate before PR:** full test suite green, `svelte-check` clean, all 16 axe sweeps green in light + dark on the running dev server (not just test env)
- **Risks to call out:**
  - Em-dash hero contrast in tertiary color (may need `text-secondary` instead)
  - STOP treatment typography — if weight alone is insufficient, may need to reach for border or spacing tricks (but no new tokens)
  - Desktop column reorder may break any test selectors that depend on column index — update carefully

## Success criteria (from ROADMAP.md, restated for planner)

1. On every GIR titration bucket card (all 6 buckets + the "current state" card), Δ rate (▲/▼ X.X ml/hr with "increase"/"decrease" label) renders as the hero using the same weight/size GIR mg/kg/min had in v1.8.
2. GIR mg/kg/min appears in the secondary metrics row in the rightmost slot (row order: Fluids | Rate | GIR).
3. The Δ=0 "current state" card shows a neutral/placeholder treatment — no ▲/▼ and no misleading "increase" label. *(This phase: em-dash hero.)*
4. Keyboard nav, roving tabindex, `role="radiogroup"`, `aria-live` announcements, identity color, focus rings, and `prefers-reduced-motion` behave identically to v1.8 (component tests + E2E pass).
5. All 16 axe sweeps (morphine 6 + fortification 4 + gir 6) are green in light + dark on the new layout, audited BEFORE PR.

---
*Created: 2026-04-09 — Phase 29 discussion*
