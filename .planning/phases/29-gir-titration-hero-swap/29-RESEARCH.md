# Phase 29: GIR Titration Hero Swap — Research

**Researched:** 2026-04-09
**Domain:** Svelte 5 + Tailwind 4 presentation-layer swap on one component
**Confidence:** HIGH (all findings grounded in code at known line numbers)

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D1 — Desktop column reorder:** `Δ rate | Fluids | Rate | GIR` on desktop (mirrors mobile).
- **D2 — Δ=0 hero:** em-dash `—` in `text-display font-black`, suggested `--color-text-tertiary`.
- **D3 — Hero shape:** `▲`/`▼` glyph left of number, `ml/hr` unit de-emphasized like v1.8's `mg/kg/min`, `(increase)`/`(decrease)` parenthetical kept inline-small.
- **D4 — No color diff between ▲ and ▼** (identity-green or text-primary, no new hues).
- **D5 — STOP card:** distinct "STOP"-style hero, **no new tokens, no new colors**, no red unless it passes axe both themes.
- **D6 — `ariaLabelFor` reorder:** Δ rate action announced before GIR value.
- All v1.8 a11y guarantees preserved verbatim: `role="radiogroup"`, roving tabindex, `aria-live`, identity focus rings, `prefers-reduced-motion`.
- 16/16 axe sweeps green light+dark **before PR**.

### Claude's Discretion
- Exact STOP card typographic treatment (pick from Finding 3 proposals).
- Final color token for em-dash hero (tertiary vs secondary — see Finding 2).
- Exact `aria-label` wording (D6 shape is suggested, not locked).

### Deferred Ideas (OUT OF SCOPE)
- Direction color coding (▲ vs ▼ hues) — captured in `.planning/NOTES.md`.
- "Maintain current rate" copy — rejected in favor of em-dash.
- Badge/pill visual mode.
- Morphine / Formula calculator polish (Phase 30).
- `GirCalculator.svelte` top-level result hero (unchanged).
- `calculations.ts` and `formatDelta()` (unchanged).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GIR-SWAP-01 | Δ rate hero on all buckets | Finding 1 — reuse v1.8 hero class combo |
| GIR-SWAP-02 | GIR in secondary metrics rightmost slot | Finding 1 — swap slot content only |
| GIR-SWAP-03 | Δ=0 neutral hero (em-dash) | Finding 2 — contrast verdict |
| GIR-SWAP-04 | STOP card distinct hero | Finding 3 — treatment proposals |
| GIR-SWAP-05 | Desktop column reorder | Finding 4 — test selector audit |
| GIR-SWAP-06 | Component + E2E tests updated | Findings 4 & 5 — line-numbered update list |
| GIR-SWAP-07 | 16/16 axe green before PR | Findings 2 & 3 — contrast risks |

---

## Summary

- **Reusable v1.8 hero pattern exists in-file** at `GlucoseTitrationGrid.svelte:120–123`. Copy that exact class combo into the new Δ rate hero — no new CSS needed. `[VERIFIED: src read]`
- **Em-dash in `--color-text-tertiary` is SAFE for hero size.** `text-display` = 44px (well above WCAG 1.4.3 "large text" 18.66px threshold, so 3:1 applies, not 4.5:1). Tertiary token is pinned at 4.5:1+ per the v1.4 comment in `app.css:95–96`. Verdict: use tertiary; no fallback needed. `[VERIFIED: app.css:60,95-96]`
- **STOP card can be built with existing primitives only** — propose three no-new-token treatments in Finding 3.
- **Component tests use role-based + text-regex selectors, no column-index fragility.** Desktop column reorder is selector-safe for vitest. `[VERIFIED: GlucoseTitrationGrid.test.ts read]`
- **Exactly 2 vitest assertions will break from the hero swap** (lines 75 and 89–93) — not because of reorder but because of content changes ("consider stopping infusion" and "(no change)" text disappearing). Line-numbered in Finding 4.
- **E2E `gir.spec.ts` is safe**: its only `mg/kg/min` assertion (line 29) targets the CURRENT GIR hero in `GirCalculator.svelte`, which is explicitly out of scope.
- **`gir-a11y.spec.ts` has exactly 6 axe sweeps** (light, dark, focus, advisory, selected-bucket-light, selected-bucket-dark). Zero text-content assertions — purely axe-based. No hero assertions to update; just rerun. `[VERIFIED: e2e/gir-a11y.spec.ts read]`
- **`formatDelta()` returns `'0'` as glyph when delta===0** (line 26) — the em-dash branch must NOT use `d.glyph`; it should hardcode `—` and ignore the helper's zero-case output.
- **Existing stop-infusion left border already uses `border-l-2 border-l-[var(--color-text-tertiary)]`** (line 107, 170) — a good starting point for a stronger STOP treatment.

---

## Finding 1 — Hero typography pattern to reuse

**Canonical v1.8 hero** at `src/lib/gir/GlucoseTitrationGrid.svelte:120–123`:

```svelte
<div class="flex items-baseline gap-2 mt-1">
  <span class="text-display font-black num text-[var(--color-text-primary)]">{row.targetGirMgKgMin.toFixed(1)}</span>
  <span class="text-ui text-[var(--color-text-tertiary)]">mg/kg/min</span>
</div>
```

**New Δ rate hero — copy the container verbatim, reuse the same two inner spans plus one parenthetical span:**

```svelte
<div class="flex items-baseline gap-2 mt-1">
  <span class="text-display font-black num text-[var(--color-text-primary)]" aria-hidden="true">{d.glyph}</span>
  <span class="text-display font-black num text-[var(--color-text-primary)]">{d.abs}</span>
  <span class="text-ui text-[var(--color-text-tertiary)]">ml/hr</span>
  <span class="text-ui text-[var(--color-text-tertiary)]">{d.word}</span>
</div>
```

**Baseline-alignment notes:**
- `items-baseline` on the flex container gives proper baseline alignment across mixed sizes — already proven in v1.8 hero. No need for `align-*` overrides.
- The glyph (`▲`/`▼`) at `text-display` will render at the number's cap height; since it's a geometric shape not a letter, it reads as leading indicator naturally.
- `num` class enables tabular-nums (inherited from v1.8) — keep on both glyph and number spans so right-alignment is consistent across rows in the desktop table column.
- `aria-hidden="true"` on the glyph span prevents SR from reading "black up-pointing triangle" — the `ariaLabelFor` composition handles direction in words (D6).

**Desktop table hero:** same inner structure, but container drops `mt-1` (cell has its own padding) and stays inside the reordered first grid column. Current desktop secondary cell pattern to replace is at lines 184–186.

**Locations to edit:**
- Mobile hero block: `GlucoseTitrationGrid.svelte:120–123` (replace) and `124–139` (swap Δ rate cell content → GIR cell, keep `text-2xs` eyebrow labels on the metrics row, update `'Δ rate'` → `'GIR'`, update value → `{row.targetGirMgKgMin.toFixed(1)} mg/kg/min`).
- Desktop header row: `150–156` — reorder to `Range | Δ rate | Target fluids | Target rate | Target GIR`. Update `Δ rate` header weight to match hero (probably same `font-semibold` — headers don't need to be heroed, the cell content carries it).
- Desktop data row: `175–186` — reorder the 4 data cells; the new first data cell gets the hero treatment (but at `text-display` — check: desktop currently uses `text-base`, not `text-display`. **The desktop grid is in table density mode, not card mode.** See "Desktop density caveat" below).

### Desktop density caveat (IMPORTANT)

The v1.8 desktop table uses `text-base font-semibold num` for GIR (line 181), **not** `text-display`. `text-display` is only used on the mobile card hero. The desktop table is intentionally a compact tabular view — hero-ing to 44px would blow up the row height.

**Recommended:** On desktop, the new Δ rate cell should remain at `text-base font-semibold` but gain weight contrast over siblings — i.e., match what GIR had at line 181 (`text-base font-semibold num text-[var(--color-text-primary)]`) and demote the now-last GIR cell to the siblings' weight (`text-base num text-[var(--color-text-primary)]`, no `font-semibold`). This preserves the "hero swap" intent in tabular form without breaking row density. `[VERIFIED: lines 181–186]`

---

## Finding 2 — Em-dash contrast risk

**Verdict: SAFE. Use `--color-text-tertiary` as suggested in Decision 2. No fallback needed.**

**Reasoning:**
- `--text-display: 2.75rem` = 44px (`app.css:63`). WCAG 2.1 SC 1.4.3 defines "large text" as ≥18.66px bold or ≥24px regular. 44px bold crosses both thresholds → **3:1 contrast minimum applies**, not 4.5:1.
- `--color-text-tertiary` is pinned at 4.5:1+ on surface in both themes: `app.css:95` comments "v1.4 A11Y fix: was 70%, now 4.5:1+ on surface/card/border"; `app.css:96` equivalent for dark. It already clears normal-text thresholds, so it comfortably clears the 3:1 large-text threshold with headroom.
- Axe-core's color-contrast rule reads font-size + font-weight to pick the correct threshold, so a `text-display font-black` em-dash in tertiary color will pass.

**Edge case to watch:** when the row is *selected*, background changes to `var(--color-identity-hero)` (line 108/171). The tertiary token was tuned against surface/card, not against identity-hero. **Axe will catch it in the selected-bucket sweeps (both themes) if it fails** — that's exactly what those two sweeps exist for. If axe flags it, escalate to `--color-text-secondary` for the em-dash (only) without needing a new token.

**Risk level:** LOW. Fallback path is clean (one-line token swap on the em-dash span only).

---

## Finding 3 — STOP card treatment options (no new tokens)

Existing available primitives (all confirmed in `app.css` / component):
- Tokens: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-border`, `--color-identity`, `--color-identity-hero`, `--color-surface`, `--color-accent`.
- Utilities: `text-display`, `text-ui`, `text-2xs`, `font-black`, `font-semibold`, `uppercase`, `tracking-wide`, `tracking-wider`, `tracking-widest`, `num`, `border-l-2`, `border-l-4`, `border-l-8`, spacing primitives.
- Component already sets `border-l-2 border-l-[var(--color-text-tertiary)]` on `severe-neuro` when unselected (lines 107, 170).

### Option A — "Type-only STOP word" (LOWEST axe risk)

```svelte
<div class="flex items-baseline gap-2 mt-1">
  <span class="text-display font-black uppercase tracking-wider text-[var(--color-text-primary)]">STOP</span>
  <span class="text-ui text-[var(--color-text-tertiary)]">dextrose infusion</span>
</div>
```

- **Distinctness:** Word "STOP" at 44px black uppercase vs. numeric heroes elsewhere creates immediate visual differentiation through shape alone (letters vs. digits + glyph).
- **Axe risk:** NONE — uses same tokens as the working v1.8 hero. Guaranteed to pass both themes.
- **Tradeoff:** No color/border signaling; relies 100% on typographic mass.

### Option B — "STOP word + strengthened left border" (MEDIUM distinctness)

Same hero as Option A, plus promote the existing tertiary left border to a thicker identity border even when unselected:

```svelte
class="... border-l-4 border-l-[var(--color-text-secondary)] ..."
```

- Escalate current `border-l-2 border-l-[var(--color-text-tertiary)]` (line 107/170) to `border-l-4 border-l-[var(--color-text-secondary)]` for the severe-neuro card.
- **Axe risk:** NONE — border color is a cosmetic non-text element, not under axe text-contrast. `--color-text-secondary` already a11y-clean everywhere.
- **Tradeoff:** When *selected*, the existing `border-l-4 border-l-[var(--color-identity)]` on line 108/171 must still override cleanly — verify cascade: selected border rule comes after the severe-neuro rule in the class string, so it wins. Confirm ordering in the svelte class-string.

### Option C — "STOP word + uppercase eyebrow escalation" (HIGHEST distinctness)

Option A hero, plus escalate the eyebrow label (`IF SEVERE NEURO SIGNS`, line 112–113) from `text-2xs font-semibold uppercase tracking-wide text-[var(--color-identity)]` to `text-ui font-black uppercase tracking-widest text-[var(--color-text-primary)]`:

- **Axe risk:** LOW — both text-ui and font-black are primary token; axe only needs to re-verify contrast of `--color-text-primary` on surface (trivially passes) and on `--color-identity-hero` when selected (already verified in v1.8 sweeps, no change).
- **Tradeoff:** Diverges from the eyebrow style used on the other 5 cards. This is a *feature* of the proposal — inconsistency is the distinctness. Only apply the escalation to the severe-neuro card.

### Recommendation for planner

**Pick Option A as the baseline, layer Option B if field-testing suggests insufficient distinctness.** Option C is the escalation path if Options A+B still feel under-signaled in a clinician review. All three are additive, so a single-plan implementation can land A and add B/C in the same wave without any new tokens.

**Do NOT:**
- Add red / warning hues — Decision 5 constraint + out-of-scope guardrail.
- Add an icon unless it exists in `@lucide/svelte` and passes axe SVG labeling — more surface area than the phase warrants.
- Introduce an `aria-live="assertive"` region for the STOP card — the radiogroup semantics already cover it and assertive would fight the existing `aria-live` in `GirCalculator`.

---

## Finding 4 — Test-selector update list (`GlucoseTitrationGrid.test.ts`)

**Good news:** All selectors use `getByRole('radio')` or `getByText(regex)` — **no column-index or nth-child selectors**. Desktop column reorder will not break any test.

**Content assertions that WILL break from the hero swap** (not from reorder):

| Line(s) | Current assertion | Breaks because | Planner action |
|---|---|---|---|
| **73–77** | `getAllByText(/consider stopping infusion/)` | STOP card replaces that phrase (Decision 5) | Replace with `getAllByText(/^STOP$/)` (or whichever word Option A/B/C ships with); also consider adding an `aria-label` regex check on the severe-neuro row. |
| **89–93** | `getAllByText(/\(no change\)/)` | Δ=0 hero becomes `—`, the text `(no change)` disappears from DOM (D2) | Replace with `getAllByText('—')` — but note vitest renders both mobile+desktop so the em-dash will appear twice (one per layout), same as current `length).toBeGreaterThan(0)` pattern. Also verify SR label still contains "no change" via `aria-label` check on the Δ=0 row. |

**Content assertions that SURVIVE the swap unchanged:**

| Line(s) | Assertion | Why it survives |
|---|---|---|
| 79–82 | `/▲.*\(increase\)/` | Glyph + `(increase)` word still present, just relocated from secondary row to hero. Regex is layout-agnostic. |
| 84–87 | `/▼.*\(decrease\)/` | Same reason. |
| 19–24 | `getAllByRole('radio').length === 12` | jsdom renders both layouts; row count unchanged. |
| 26–37 | tabindex / aria-checked | Keyboard semantics locked per CONTEXT. |
| 39–72, 95–131 | keyboard nav matrix | All role-based. |

**New tests the planner should add** (not exhaustive — planner decides):
- Hero contains `▲` or `▼` glyph with `text-display` class (DOM class-list check on hero span).
- `ariaLabelFor` severe-neuro row starts with "Severe neuro" or equivalent action-first phrasing (D6 verification).
- Δ=0 row hero contains the em-dash AND `aria-label` contains "no change" (SR/visual parity).
- Desktop column header order: read header divs at lines ~150–156 post-reorder and assert text order `['Range', 'Δ rate', 'Target fluids', 'Target rate', 'Target GIR']`.

---

## Finding 5 — E2E / axe sweep update list

### `e2e/gir.spec.ts` — **SAFE, one line to audit**

Only text-content assertion that mentions hero semantics is line 29:

```ts
await expect(page.getByText('mg/kg/min').first()).toBeVisible();
```

**Verdict:** This targets the `CURRENT GIR` hero block in `GirCalculator.svelte` (still shows `mg/kg/min` — explicitly out of scope per CONTEXT). `.first()` guarantees it grabs that top-level hero, not a titration bucket. **No update required.**

Line 39 (`await expect(page.getByText('TARGET GIR', { exact: true })).toBeVisible()`) — `TARGET GIR` label lives in `GirCalculator.svelte`, also out of scope. **No update required.**

**Planner action:** None for `gir.spec.ts`. Rerun post-implementation to confirm the 4 existing tests stay green at both viewports.

### `e2e/gir-a11y.spec.ts` — **6 axe sweeps, zero text assertions, just rerun**

Sweep inventory (verified line-by-line):

| # | Line | Name | State |
|---|---|---|---|
| 1 | 17–27 | light mode, empty form | Default page load, light theme forced |
| 2 | 29–41 | dark mode, empty form | Dark theme forced, 250ms settle |
| 3 | 43–54 | focus ring visible | Weight field focused with values filled |
| 4 | 56–77 | dextrose advisory (light) | 15% dextrose triggers central access advisory |
| 5 | 79–102 | selected bucket (light) | First radio clicked, transitions disabled |
| 6 | 104–128 | selected bucket (dark) | Same as #5 in dark |

**No `getByText` / hero-content assertions anywhere in this file.** The entire suite is `AxeBuilder(...).analyze()` contrast/semantic checks.

**Planner action:** No assertion updates needed. Post-swap: (a) run all 6 + the 4 morphine sweeps + 4 fortification sweeps + 2 GIR happy-path viewports → should be 16 axe runs as CONTEXT promises; (b) if sweeps 5/6 fail specifically on the em-dash or STOP hero, that's the Finding 2 / Finding 3 fallback trigger.

**One addition to consider** (planner discretion): add a 7th sweep that selects the severe-neuro bucket (not the first radio) so axe verifies the STOP card contrast in its selected state. Current sweep #5 clicks `.first()` which is `severe-neuro` — so this is **already covered**. Confirmed: no 7th sweep needed.

### `GirCalculator.test.ts` — audit needed

CONTEXT says this "may reference hero text from the grid child." Planner should grep for `'Δ rate'`, `'(increase)'`, `'(decrease)'`, `'(no change)'`, `'consider stopping infusion'` in that file and update any hits. I did not open it because it's not in the `<files_to_read>` list; planner should add a 60-second grep as the first step of the plan.

---

## Risks (ranked)

1. **STOP card distinctness feels weak in clinical review** (MEDIUM). Mitigation: Options A→B→C ladder in Finding 3, all layerable in one wave with zero token changes.
2. **Desktop table row height creep** if a planner mistakenly uses `text-display` in the desktop Δ rate cell (LOW–MEDIUM). Mitigation: Finding 1 "Desktop density caveat" explicitly documents the `text-base font-semibold` pattern to preserve.
3. **`formatDelta()` returns `'0'` as glyph for delta===0** (LOW but subtle). Mitigation: the Δ=0 hero must hardcode `—` and not reference `d.glyph`; called out in Finding 1 summary.
4. **Em-dash contrast fail on selected-bucket background** (LOW). Mitigation: escalate em-dash span only to `--color-text-secondary`; Finding 2 documents the one-line fix.
5. **`GirCalculator.test.ts` hidden text assertions** (LOW, unquantified). Mitigation: planner greps before editing.
6. **Eyebrow label styling cascade** (LOW). The Option C escalation for the severe-neuro eyebrow must not leak to the other 5 cards' eyebrows. Mitigation: conditional class application per `bucketId === 'severe-neuro'`, same pattern already used at line 107.

---

## Out of scope reminders (for planner discipline)

- Don't touch `GirCalculator.svelte` top-level hero (CURRENT GIR / TARGET GIR / Initial rate blocks).
- Don't touch `src/lib/gir/calculations.ts`.
- Don't modify `formatDelta()` — it already returns what's needed.
- Don't introduce new OKLCH tokens or new identity hues.
- Don't add red / warning color to the STOP card unless axe-validated in both themes (and even then, prefer Options A–C first).
- Don't touch `role="radiogroup"`, roving tabindex, or keyboard handler logic.
- Don't touch Morphine or Formula calculators (Phase 30 territory).
- Don't add dynamic imports, badges, pill indicators, or a "Maintain" copy variant (rejected).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | `text-display` (44px `font-black`) qualifies as WCAG "large text" so 3:1 applies to the em-dash | Finding 2 | If wrong (e.g., 44px is somehow sub-threshold in axe's heuristic), the em-dash sweep fails in selected state — one-line fallback to `--color-text-secondary`. Verified via spec math: 44px >> 18.66px bold threshold. `[VERIFIED: WCAG 1.4.3]` |
| A2 | `GirCalculator.test.ts` does not assert grid-child hero text | Finding 5 | If wrong, 1–3 extra assertions break. Detection is a 60-second grep — listed as planner's first step. |
| A3 | jsdom renders both mobile + desktop layouts (12 radios) while real browsers render one (6 radios) | Finding 4 | Already empirically confirmed by existing test line 23 and `e2e/gir.spec.ts:4–6` comments. `[VERIFIED: test comments]` |

---

## Sources

### Primary (HIGH confidence — read this session)
- `src/lib/gir/GlucoseTitrationGrid.svelte` lines 1–190 — full component structure, hero classes, class-string cascade.
- `src/lib/gir/GlucoseTitrationGrid.test.ts` lines 1–132 — assertion patterns, selector strategies.
- `src/app.css` lines 47–216 (grep) — token values, WCAG pinning comments at 95–96, display type scale at 60–63.
- `e2e/gir.spec.ts` lines 1–55 — viewport matrix, text assertions, scope boundaries.
- `e2e/gir-a11y.spec.ts` lines 1–129 — all 6 axe sweeps enumerated.
- `.planning/phases/29-gir-titration-hero-swap/29-CONTEXT.md` — locked decisions.

### Secondary
- WCAG 2.1 SC 1.4.3 "large text" threshold (18.66px bold / 24px regular) — used for Finding 2 verdict.

---

## Metadata

**Confidence breakdown:**
- Hero typography pattern: HIGH — copied from working in-file code.
- Em-dash contrast: HIGH — token contrast pre-verified in v1.4 work; large-text threshold gives margin.
- STOP options: HIGH for Option A (pure-type), MEDIUM for Options B/C (border escalation, eyebrow escalation) — axe must confirm in selected state.
- Test update list: HIGH — every break/survive call is line-anchored.
- Axe sweep count: HIGH — 6 sweeps enumerated and named.

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable — presentation-layer phase on frozen v1.8 foundation)
