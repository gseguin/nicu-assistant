---
phase: 4
slug: design-polish-impeccable
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-26
workstream: pert
milestone: v1.15
upstream:
  context: .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CONTEXT.md
  roadmap: .planning/workstreams/pert/ROADMAP.md
  requirements: .planning/workstreams/pert/REQUIREMENTS.md
  design_contract: DESIGN.md
  design_tokens: DESIGN.json
  phase_2_ui_spec: .planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-UI-SPEC.md
  phase_3_1_summary: .planning/workstreams/pert/phases/03.1-selectpicker-bridge-fix/03.1-04-SUMMARY.md
  impeccable_skill: ~/.claude/plugins/marketplaces/impeccable/.claude/skills/impeccable/SKILL.md
---

# Phase 4 UI-SPEC — Design Polish (`/impeccable` Critique Sweep)

> **This SPEC is a design-contract-enforcement spec, not a build spec.** Phase 4 ships zero new components. The PERT UI was fully built in Phases 1-2 and bridge-fixed in Phase 3.1; what remains is a *critique-then-fix sweep* against the locked v1.13 DESIGN.md / DESIGN.json contract. This spec codifies the 8 critique contexts, the 10-rule named audit, the PERT-specific watch items, the triage policy, the score acceptance gate, and the post-Phase-3.1 component invariants that must hold post-fix. The plan-checker validates each plan's tasks against this spec; the executor uses this spec as the visual source of truth when applying P1 fixes.

## Purpose

Phase 4 converts a built PERT calculator into a *polished* PERT calculator. The deliverable is not new code but a verified design contract:

- 8 `/impeccable critique` transcripts (one per `theme × viewport × mode` triple).
- A triaged `04-FINDINGS.md` table (severity / disposition / DESIGN.md rule violated).
- All P1 findings fixed inside the PERT-route allowlist (D-08 / D-08a / D-08b).
- DESIGN.md 10-rule audit script returning 0 violations on the post-fix code.
- Final `/impeccable score` of ≥35/40 in ≥6/8 contexts and ≥35/40 aggregate.

The spec below names the rules, the artifacts, the invariants, and the verification commands. Everything is grep-mappable or command-mappable so the verifier can execute it without re-research.

---

## Critique Matrix (the 8 contexts)

Each row is one `/impeccable critique` invocation against the live dev server, producing one transcript artifact. The 8 transcripts together drive `04-FINDINGS.md`. Per CONTEXT D-01: theme × viewport × mode = 8.

| # | Theme | Viewport | Mode | URL state | Transcript artifact |
|---|-------|----------|------|-----------|---------------------|
| 1 | light | mobile 375 | Oral | `/pert` after `pertState.reset()` + Oral selected + valid inputs (weight 9.98, fat 25 g, lipase 1000, Creon 12000) | `04-CRITIQUE-light-mobile-oral.md` |
| 2 | light | mobile 375 | Tube-Feed | `/pert` Tube-Feed mode + valid inputs (weight 6.80, formula Kate Farms Pediatric Standard 1.2, volume 1000 mL, lipase 1000, Creon 12000) | `04-CRITIQUE-light-mobile-tube-feed.md` |
| 3 | light | desktop 1280 | Oral | same Oral inputs as #1 | `04-CRITIQUE-light-desktop-oral.md` |
| 4 | light | desktop 1280 | Tube-Feed | same Tube-Feed inputs as #2 | `04-CRITIQUE-light-desktop-tube-feed.md` |
| 5 | dark  | mobile 375 | Oral | dark theme via `localStorage.setItem('nicu_assistant_theme','dark')` + reload; same inputs as #1 | `04-CRITIQUE-dark-mobile-oral.md` |
| 6 | dark  | mobile 375 | Tube-Feed | dark + same inputs as #2 | `04-CRITIQUE-dark-mobile-tube-feed.md` |
| 7 | dark  | desktop 1280 | Oral | dark + same inputs as #1 | `04-CRITIQUE-dark-desktop-oral.md` |
| 8 | dark  | desktop 1280 | Tube-Feed | dark + same inputs as #2 | `04-CRITIQUE-dark-desktop-tube-feed.md` |

**Why 8 (not 4):** Oral and Tube-Feed render materially different input affordances (Oral: 2 NumericInputs; Tube-Feed: SelectPicker formula + 2 NumericInputs) and different hero secondaries (Oral: capsulesPerDose + tertiary daily total; Tube-Feed: capsulesPerDay + capsulesPerMonth + lipasePerKg). A theme×viewport-only sweep would miss mode-specific issues.

**Empty-state coverage (additive, NOT counted toward the 8):** Wave 1 SHOULD also capture an empty-state screenshot for each theme × viewport (4 screenshots; appended to whichever critique transcript is most adjacent). The empty-state hero must own the viewport on first paint per ROADMAP SC-1; if it does not, that's a P1 finding under PERT-DESIGN-04.

**Findings normalization:** All 8 transcripts feed into ONE table at `04-FINDINGS.md` with columns:

```
| id | context (1-8) | severity (P1|P2|P3) | description | proposed fix | disposition (fix-now|defer|wontfix) | DESIGN.md rule violated (or "n/a") |
```

---

## Tooling Contract (`/impeccable` invocation)

**Skill manifest:** `~/.claude/plugins/marketplaces/impeccable/.claude/skills/impeccable/SKILL.md` (verified version `3.0.1`). The skill is a multi-phase workflow, NOT a single-shot CLI.

### How `/impeccable critique` actually works (verified from `reference/critique.md`)

The critique skill spawns **two independent assessments per invocation**:

1. **Assessment A — LLM Design Review:** A sub-agent reads source files (HTML/CSS/JS/TS) and, when browser automation is available, visually inspects the live page in a new browser tab labeled `[LLM]`. Returns Nielsen 10-heuristic scores 0-4 each, AI slop verdict, cognitive-load checklist, persona red flags, prioritized issues with P0-P3 severity.
2. **Assessment B — Automated detection:** Two parallel paths:
   - **CLI scan:** `npx impeccable --json [--fast] <target>` — pass `.svelte` files or directories. Exit 0 = clean, 2 = findings. NOT available for raw URLs.
   - **Browser overlay:** `npx impeccable live &` (auto-port, capture from stdout) → navigate to URL in a new tab labeled `[Human]` → inject `<script src='http://localhost:PORT/detect.js'>` → wait 2-3s → read console with pattern `impeccable`. Cleanup: `npx impeccable live stop`.

**Combined report:** synthesizes A + B into a single critique with the Design Health Score table (Nielsen 10 heuristics × 0-4 = `??/40`), Anti-Patterns Verdict, Priority Issues (P0-P3 + suggested fix command), Persona Red Flags, Minor Observations.

### Per-context invocation form (Phase 4 binding)

For each row in the Critique Matrix, the Wave 1 plan invokes:

```
/impeccable critique <URL>
```

where `<URL>` is the dev-server URL with the appropriate viewport / theme / mode pre-set. **There is no `theme` / `viewport` / `mode` flag on the skill** — those are browser-side state. Per CONTEXT D-09 / D-10:

- **Viewport:** set via Playwright/Chromium DevTools or browser-window-resize before calling `/impeccable critique`.
- **Theme:** set via `localStorage.setItem('nicu_assistant_theme', 'dark' | 'light')` + reload.
- **Mode:** click the SegmentedToggle to Oral or Tube-Feed; verify `pertState.current.mode` matches via DOM inspection.
- **Inputs:** programmatically set via `pertState.current.* = ...` in the browser console, OR via Playwright UI driving (preferred — exercises the same code path a clinician would).

**The CLI scan branch (`npx impeccable --json`) MAY also be invoked separately** against the static source as a deterministic pre-filter:

```bash
npx impeccable --json src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte
```

Output is JSON; pipe into `04-FINDINGS.md` as the deterministic-detector seed. Use `--fast` only if the file count climbs past 200 (it won't for PERT — the surface is 3 files).

### Score subcommand

There is **no separate `/impeccable score`** subcommand in v3.0.1 — the score (Nielsen 10 heuristics, total /40) is part of the `/impeccable critique` output itself. CONTEXT D-04's "re-run `/impeccable score`" therefore means: re-run `/impeccable critique` against the post-fix UI and record the new Design Health Score table in `04-VERIFICATION.md`.

### Live server pipeline (Wave 1 + Wave 3 binding)

```bash
# 1. Spin up dev server (background)
pnpm dev &  # captures auto-port to stdout (typically 5173)
DEV_PORT=$(...)  # parse from stdout

# 2. For each (theme, viewport, mode) triple in the critique matrix:
#    a. Launch a fresh Playwright/Chromium browser at the right viewport
#    b. Navigate to http://localhost:$DEV_PORT/pert
#    c. Set localStorage theme + reload
#    d. Click SegmentedToggle to mode
#    e. Drive inputs via Playwright (NOT pertState mutation — this exercises
#       the SelectPicker UX which is the post-Phase-3.1 production-polish surface)
#    f. /impeccable critique http://localhost:$DEV_PORT/pert
#    g. Capture transcript to 04-CRITIQUE-{theme}-{viewport}-{mode}.md

# 3. Tear down:
npx impeccable live stop  # only if the live overlay was used
kill $DEV_PID
```

**Screenshot fallback:** if `/impeccable critique` cannot drive the browser in this environment (e.g. no `chrome-devtools-mcp` configured), use Playwright (already a project dependency; see `e2e/pert.spec.ts` for the existing screenshot pattern at viewport sizes `375 × 812` and `1280 × 800`) to capture screenshots and pass the screenshot file paths to `/impeccable critique` via `Read`-then-describe. The Wave 1 plan's RESEARCH section MUST verify which path the executor's environment supports before authoring the plan tasks.

---

## DESIGN.md Named-Rule Audit (10 rules, grep-mappable)

The audit script lives at `.planning/workstreams/pert/phases/04-design-polish-impeccable/04-AUDIT.sh` (D-05a — Phase-4-only deliverable, NOT a permanent codebase asset). Its output is appended verbatim to `04-VERIFICATION.md`. Each rule maps to a concrete grep or check; each maps to a P1 if violated post-fix.

| # | DESIGN.md Rule | What it forbids / requires | Concrete check (PERT-route scope) | Failure severity |
|---|----------------|----------------------------|------------------------------------|------------------|
| 1 | **Identity-Inside Rule** | `.identity-pert` ONLY on hero / focus rings / eyebrows / active nav. NEVER on chrome (top tabs underline, bottom nav active, hamburger drawer stars, title bar, advisory cards, SegmentedToggle track). | `grep -rE "identity-pert\|--color-identity\b" src/lib/pert/ src/routes/pert/` — every hit must be on (a) HeroResult eyebrow, (b) secondary-output card eyebrow, (c) input/picker focus ring, (d) SegmentedToggle active-pill text (not track), (e) tertiary "Estimated daily total" eyebrow. Any hit on advisory-card border / advisory text / segmented track / chrome surface = P1. | **P1** |
| 2 | **Amber-as-Semantic Rule** | Amber (oklch 65 hue family) is exclusively the BMF fortifier semantic. PERT must never reference amber tokens. | `grep -rE "bmf-amber\|amber\|oklch\([^)]*\b65\b" src/lib/pert/ src/routes/pert/` returns 0 hits. | **P1** |
| 3 | **OKLCH-Only Rule** | All color values declared via OKLCH tokens (`var(--color-*)`). No hex (`#fff`, `#000`, `#0ff`), no `rgb(`, no `hsl(`. | `grep -rEn "(rgb\|hsl)\(\|#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?(\b\|;)" src/lib/pert/ src/routes/pert/` returns 0 hits. (Note: `oklch(...)` literals are also forbidden in PERT route code — colors flow through `var(--color-*)` from `app.css` only.) Add: `grep -rE "oklch\(" src/lib/pert/ src/routes/pert/` should also be 0 (PERT route reads tokens, never declares them). | **P1** |
| 4 | **Red-Means-Wrong Rule (with STOP-red carve-out)** | `var(--color-error)` is reserved for: (a) STOP-red max-lipase advisory card border + icon + bold message text (PERT-SAFE-01 — the ONE named carve-out for PERT), (b) NumericInput blur-gated range error border + caption (inherited shared component, applies project-wide). NOWHERE else. | `grep -rnE "color-error" src/lib/pert/ src/routes/pert/` — every hit MUST live in (a) the `{#each stopAdvisories}` block of `PertCalculator.svelte` (currently lines 309-322) or (b) zero hits in `PertInputs.svelte` / `+page.svelte` (the inline blur error is owned by the shared `<NumericInput>` itself, not by PERT files). Any hit on a button, hover state, badge, decoration, or warning advisory = P1. | **P1** |
| 5 | **Five-Roles-Only Rule** | Typography uses `text-display` / `text-title` / `text-base` (body) / `text-ui` / `text-2xs` (label) — exactly 5 roles. No arbitrary `text-[Npx]`, no `text-xs` (12px) / `text-sm` (14px) / `text-lg`+ in PERT route, no fluid `clamp()` typography. (Exception: `<NumericInput>` internal `text-xs` for the inherited range hint — that's INHERITED from the shared component, not a Phase-4 violation.) | `grep -rnE "text-(xs\|sm\|lg\|xl\|\\[)\b" src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte` returns 0 hits. | **P1** |
| 6 | **Tabular-Numbers Rule** | Every clinical numeric output renders with `class="num"`. | `grep -nE "class=\"[^\"]*\bnum\b" src/lib/pert/PertCalculator.svelte` returns ≥ **5** hits (capsulesPerDose/Day hero numeral; oral: totalLipase + lipasePerDose + estimatedDailyTotal; OR tube-feed: totalFatG + totalLipase + lipasePerKg + capsulesPerMonth = 4 in tube-feed branch). Confirm by reading the rendered output: every `<span>` containing a numeric value MUST also carry `.num`. | **P1** |
| 7 | **Eyebrow-Above-Numeral Rule** | Every hero numeral introduced by an UPPERCASE Label-11 (`text-2xs`) eyebrow ABOVE; unit suffix BESIDE/BELOW in body or ui weight, never above. | Read `PertCalculator.svelte` — the `<HeroResult>` `children` snippet (lines 140-167 currently) must show: `text-title font-black ... uppercase` "PERT" + `text-2xs ... uppercase` mode-qualifier ABOVE; `text-display font-black ... num` numeral + `text-ui font-medium` unit-suffix BELOW. Every secondary card row (lines 175-301): `text-2xs ... uppercase` eyebrow ABOVE; `text-title font-bold ... num` numeral BELOW. Tertiary row (lines 213-227): `text-2xs ... uppercase` eyebrow ABOVE; `text-base font-medium ... num` value BELOW. ANY numeral whose nearest ancestor sibling is NOT a `text-2xs uppercase` eyebrow = P1. | **P1** |
| 8 | **11px Floor** | `text-2xs` (11px) is the floor and is for LABELS only — eyebrows, bottom-nav labels, in-card section headers, range hints under inputs. NEVER for advisory copy, error messages, paragraph text. Advisory copy steps up to `text-ui` (13px) minimum. | `grep -rEn "text-2xs" src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte` — every hit MUST be on an `uppercase tracking-wide` eyebrow. The `<p>` advisory message text in `PertCalculator.svelte:320, 337` MUST be `text-ui` (13px), NOT `text-2xs`. Any `text-2xs` on `<p>` / advisory message / range hint paragraph = P1. | **P1** |
| 9 | **Tonal-Depth Rule** | Surfaces use `var(--color-surface)` / `--color-surface-alt` / `--color-surface-card` tokens. No raw OKLCH literals. Depth via 3-step lightness, not shadows. | `grep -rE "oklch\(" src/lib/pert/ src/routes/pert/` returns 0 hits. `grep -rE "shadow-(md\|lg\|xl\|2xl)\|drop-shadow\|filter:\s*drop-shadow" src/lib/pert/ src/routes/pert/` returns 0 hits (only `shadow-sm` is permitted on cards; modal/drawer shadows are owned by shared components). | **P1** if raw OKLCH; **P2** if heavy shadow on inline content |
| 10 | **Flat-Card-Default Rule** | Cards are flat with 1px border + `shadow-sm`. No nested cards (`<section class="card">` inside `<section class="card">` is forbidden). No gradient backgrounds, no hover lifts. | `grep -rEn "<section[^>]*class=\"[^\"]*\bcard\b" src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte` and confirm no card element nests another card element (manual read, ≤30 LOC of structure). The STOP-red advisory uses `border-2` (a deliberate weight escalation per Phase 2 UI-SPEC) — that is explicitly permitted and NOT a violation. | **P1** if nested cards or gradient bg |

**Audit script skeleton (D-05a — `04-AUDIT.sh`):**

```bash
#!/usr/bin/env bash
# Phase 4 DESIGN.md named-rule audit — PERT route only.
# Returns 0 if all 10 rules pass, 1 if any rule fails.
# Output is appended verbatim to 04-VERIFICATION.md.

set -u
cd "$(dirname "$0")/../../../../.."  # repo root from phase dir

scope="src/lib/pert src/routes/pert"
fail=0

check() {
  local rule="$1"; shift
  local result; result="$("$@")"
  local count; count=$(echo "$result" | grep -cv '^$' || true)
  if [ "$count" -eq 0 ]; then
    echo "  [PASS] Rule $rule"
  else
    echo "  [FAIL] Rule $rule (count=$count)"
    echo "$result" | sed 's/^/         /'
    fail=1
  fi
}

echo "=== DESIGN.md Named-Rule Audit ==="
check "1 Identity-Inside" grep -rEn "identity-pert|--color-identity\b" $scope  # then manual whitelist filter
check "2 Amber-as-Semantic" grep -rEn "bmf-amber|amber|oklch\([^)]*\b65\b" $scope
check "3 OKLCH-Only" grep -rEn "(rgb|hsl)\(|#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?(\b|;)|oklch\(" $scope
check "4 Red-Means-Wrong" grep -rnE "color-error" src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte  # PertCalculator hits are scoped check
check "5 Five-Roles-Only" grep -rEn "text-(xs|sm|lg|xl|\[)\b" src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte
check "6 Tabular-Numbers (≥5 hits in PertCalculator)" bash -c "test \$(grep -cE 'class=\"[^\"]*\\bnum\\b' src/lib/pert/PertCalculator.svelte) -ge 5 && echo '' || echo 'FAIL: less than 5 .num hits'"
# Rules 7, 8, 9, 10 mix grep checks + manual reads; printed separately for human verification.
check "8 11px-Floor" grep -rEn "text-2xs" $scope  # then manual whitelist for eyebrow vs body
check "9 Tonal-Depth (no raw OKLCH)" grep -rEn "oklch\(" $scope
check "9 Tonal-Depth (no heavy shadow)" grep -rEn "shadow-(md|lg|xl|2xl)|drop-shadow" $scope

echo "=== End audit ==="
exit $fail
```

The Wave 3 verification plan executes this script and pastes its output into `04-VERIFICATION.md`. Manual review of rules 1, 4, 7, 8 (the ones whose grep hits need a whitelist filter to distinguish allowed vs forbidden usage) is itemized in the verification checklist below.

---

## PERT Component Invariants (post-Phase-3.1 contract)

These are the **post-conditions** the critique fixes preserve, NOT build specs. Phase 2's UI-SPEC (`02-UI-SPEC.md`) and Phase 3.1's bridge fix (commit `f2da16d`) shipped the implementation; Phase 4 verifies these invariants still hold after any P1/P2 fixes ship.

### `<PertCalculator>` invariants (`src/lib/pert/PertCalculator.svelte`)

**Hero (`<HeroResult>`) — must hold across all 8 contexts:**

- `eyebrow="PERT"` prop passed; `pulseKey` reactive on mode + result; `numericValue={heroValue}` for the screen-reader announcement.
- Children-snippet renders: `text-title font-black tracking-tight text-[var(--color-identity)] uppercase` "PERT" promoted eyebrow + `text-2xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase` mode qualifier ("Oral dose" / "Tube-feed dose" — ASCII hyphen, NOT en-dash).
- When valid: `<span class="num text-display font-black text-[var(--color-text-primary)]">{heroValue}</span>` + `<span class="text-ui font-medium text-[var(--color-text-secondary)]">{heroUnit}</span>` where `heroUnit` is `"capsules/dose"` (Oral) or `"capsules/day"` (Tube-Feed).
- When empty: `<p class="text-ui text-[var(--color-text-secondary)]">{emptyMessage}</p>` from `validationMessages.emptyOral` / `emptyTubeFeed`.
- `aria-live="polite"` + `aria-atomic="true"` inherited from `<HeroResult>`.
- Hero owns the above-the-fold viewport on mount (ROADMAP SC-1) — verified per-context in the critique matrix.

**Mode-conditional secondary outputs:**

- **Oral mode (`{#if pertState.current.mode === 'oral' && oralResult}` block):** `<section class="card">` with `divide-y divide-[var(--color-border)]` + 3 rows: (1) Total lipase needed, (2) Lipase per dose, (3) Tertiary "Estimated daily total (3 meals/day)" — text-2xs eyebrow + text-base value (smaller than secondaries per Phase 2 D-09).
- **Tube-Feed mode (`{:else if pertState.current.mode === 'tube-feed' && tubeFeedResult}` block):** `<section class="card">` with 4 rows: (1) Total fat g/day, (2) Total lipase needed units/day, (3) Lipase per kg units/kg/day, (4) Capsules per month.
- Every numeral row: `text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase` eyebrow + `num text-title font-bold text-[var(--color-text-primary)]` numeral + `text-ui text-[var(--color-text-secondary)]` unit.
- Hidden entirely when `oralResult === null` / `tubeFeedResult === null` (D-08 empty-state gate).

**STOP-red advisory invariant (PERT-SAFE-01 carve-out — ONE per calculator):**

- `<section role="alert" aria-live="assertive">` with classes `flex items-start gap-3 rounded-xl border-2 border-[var(--color-error)] bg-[var(--color-surface-card)] px-4 py-3`.
- Icon: `<OctagonAlert size={20} class="mt-0.5 shrink-0 text-[var(--color-error)]" aria-hidden="true" />` from `@lucide/svelte` (NOT `AlertOctagon` — that name doesn't exist; per Phase 2 D-20).
- Message: `<p class="text-ui font-bold text-[var(--color-error)]">{advisory.message}</p>`.
- Renders when `dailyLipase > weightKg * 10000` (calc layer determines; advisory entry has `severity: "stop"` in `pert-config.json`).
- Card border is `border-2` (deliberate weight escalation; permitted exception to Flat-Card-Default).
- Card background is `--color-surface-card` (NEUTRAL), NOT `--color-error-light` — the urgency lives in the border + icon + bold red text, not the surface tint.

**Neutral warning advisory invariant:**

- `<div role="note">` (NOT `<section>`) with classes `flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3`.
- Icon: `<AlertTriangle size={20} class="mt-0.5 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />`.
- Message: `<p class="text-ui font-semibold text-[var(--color-text-primary)]">{advisory.message}</p>`.
- Border 1px (default) — NOT 2px. Surface `--color-surface-alt`.

**Empty-state invariants:**

- When ANY required input is null/<=0: hero shows empty-state copy; secondaries HIDDEN; advisories HIDDEN.
- `oralResult` / `tubeFeedResult` derivations short-circuit to `null` via `isOralValid` / `isTubeFeedValid` gates (PertCalculator.svelte:22-45).
- Advisory derivation receives `null` result and returns `[]` (no false-positive STOP-red on incomplete inputs).

### `<PertInputs>` invariants (`src/lib/pert/PertInputs.svelte`)

**SegmentedToggle (PERT-DESIGN-05 / ROADMAP SC-3):**

- `bind:value={pertState.current.mode}`; `label="Calculator mode"`; `ariaLabel="PERT mode"`; `options=[{value:'oral',label:'Oral'},{value:'tube-feed',label:'Tube-Feed'}]`.
- Visual integration: active pill carries `text-[var(--color-identity)]` (identity-purple text on `--color-surface-card` background) — matches v1.6 SegmentedToggle treatment used by the Feeds calculator. Track stays `--color-surface-alt` (chrome-adjacent, identity hue does NOT spread to track).
- Lives at the TOP of `<PertInputs>` inside the SHARED card (`<section class="card flex flex-col gap-4 px-5 py-5">`) ABOVE the Weight input. Same card, NOT a separate card.
- Keyboard nav (←/→/Home/End) inherited from shared `<SegmentedToggle>` — Phase 4 must NOT regress this behavior (PERT-MODE-01).

**Mode-shared inputs:**

- Weight: `<RangedNumericInput bind:value={pertState.current.weightKg} label="Weight" suffix="kg" min={inputs.weightKg.min /*0.3*/} max={inputs.weightKg.max /*80*/} step={inputs.weightKg.step /*0.1*/} typeStep={0.01} placeholder="3.0" id="pert-weight" sliderAriaLabel="Weight slider" />`. Slider visible.
- Medication SelectPicker: 5 options (Creon, Zenpep, Pancreaze, Pertzye, Viokace from `medications` after `fdaAllowlist` filter). NO search. Function-binding wrapper per Phase 3.1 D-01.
- Strength SelectPicker: filtered options derived from `getStrengthsForMedication(medicationId)`. Options formatted `"12,000 units"` (en-US locale, no decimal). Placeholder switches: `"Select strength"` when medication selected, `"Choose medication first"` when not. Function-binding wrapper per Phase 3.1 D-01. D-11 cascade: when `medicationId` changes, `strengthValue` resets to `null` (lastMedId effect at PertInputs.svelte:92-100).

**Oral-mode-only inputs (`{#if pertState.current.mode === 'oral'}` block):**

- Fat per meal: `<NumericInput>` `label="Fat per meal"` `suffix="g"` `min=0` `max=200` `step=0.5` `placeholder="25"` `id="pert-fat-grams"`.
- Lipase rate: `<NumericInput>` `label="Lipase per gram of fat"` `suffix="units/g"` `min=500` `max=4000` `step=250` `placeholder="1000"` `id="pert-oral-lipase-rate"`. **Label MUST be "Lipase per gram of fat" with suffix "units/g" per Phase 2 D-17 — NOT "Lipase per kg per meal" / "units/kg/meal" (the JSON key keeps the legacy name `lipasePerKgPerMeal` for state-schema continuity, but UI semantics are fat-based per xlsx parity).**

**Tube-Feed-mode-only inputs (`{:else}` block):**

- Formula: `<SelectPicker label="Formula" searchable={true} placeholder="Select formula" />` over 17 `formulas` options. Search ENABLED (17 options exceeds the no-search threshold). Function-binding wrapper per Phase 3.1 D-01.
- Volume per day: `<NumericInput>` `label="Volume per day"` `suffix="mL"` `min=0` `max=3000` `step=10` `placeholder="1000"` `id="pert-volume"`.
- Lipase rate: `<NumericInput>` `label="Lipase per gram of fat"` `suffix="units/g"` (SAME label/suffix as Oral mode per D-17) `min=500` `max=4000` `step=250` `placeholder="1000"` `id="pert-tube-lipase-rate"`.

**Function-binding bridges (Phase 3.1 D-01 — KI-1 resolution):**

The 3 SelectPicker bridges (medication, strength, formula) MUST use Svelte 5.9+ function-binding wrappers (getter/setter inline at each `<SelectPicker>` site). They MUST NOT be re-introduced as string-bridge `$state` proxies. Verification:

```bash
# Confirm function-binding shape (getter+setter object literal) — should have 3 hits
grep -nE "bind:value=\{$" src/lib/pert/PertInputs.svelte
# Confirm NO string-bridge $state proxies remain (should be 0)
grep -nE "let \w+(Bridge|Proxy) = \$state" src/lib/pert/PertInputs.svelte
```

If any P1/P2 fix in Wave 2 touches `PertInputs.svelte`, the post-fix file MUST still pass both checks. KI-1 (the click-revert race) was structurally resolved at Phase 3.1 plan 01 commit `f2da16d`; Phase 4 must not regress it.

---

## PERT-Specific Watch Items (priors)

These 6 items codify CONTEXT D-11 — the known risk areas the critique should specifically evaluate per context. Each watch item maps to a likely finding pattern; the critique should look hard at these surfaces in each transcript.

| # | Watch item | Why it's a prior | Likely finding pattern | Disposition guidance |
|---|------------|------------------|------------------------|----------------------|
| 1 | **Identity-pert hue contrast in dark mode** | Phase 1 D-04 axe-passed at 4.5:1 first run, but `/impeccable` may flag perceived-contrast distinct from numerical contrast (axe ≠ visual polish). Token at `app.css:283-291` (`.identity-pert` block; lines reflect actual file). | Critique notes "identity color feels low-contrast on dark surface" — purple at L=80% on warm-slate L=22% can look muted at dim ambient brightness. | If flagged P1: invoke D-08a exception, retune the `.identity-pert` dark-mode tokens (and ONLY those) with a small chroma/lightness bump. If P2 only: defer with note. |
| 2 | **STOP-red advisory card prominence** | Phase 2 D-04 + D-20 use `OctagonAlert` + `border-2 var(--color-error)` on a NEUTRAL `--color-surface-card` background. The escalation is border + icon + bold text, NOT surface tint. | Critique may suggest tinting the card surface red (`--color-error-light`) for "more urgency." | This is **WONTFIX with rationale**: the v1.13 GIR carve-out precedent (commit `8fde90e`) and the Red-Means-Wrong rule both demand the neutral surface — tinted red would dilute the "red = wrong" semantic. Document in FINDINGS as `wontfix — intentional per Phase 2 D-04 + DESIGN.md §Red-Means-Wrong`. |
| 3 | **SegmentedToggle visual integration** (PERT-DESIGN-05 / ROADMAP SC-3) | Does the Oral / Tube-Feed toggle read as part of the existing identity-hue idiom (consistent with Feeds Bedside / Full Nutrition toggle), or look foreign? Toggle component itself is shared (D-08b forbids edits), but its label, surrounding spacing, and card placement are PERT-route-local and tunable. | Critique may flag: (a) toggle label "Calculator mode" is too generic vs. Feeds' wording, (b) toggle should sit OUTSIDE the shared input card for visual hierarchy, (c) active-pill identity-purple feels disconnected from the hero's identity-purple eyebrow. | Label change = ≤5 LOC = **fix-now P2**. Card placement change ≤ 5 LOC = **fix-now P2**. Identity treatment change requires shared component edit = **D-08b forbidden — escalate to user; cannot auto-fix in Phase 4**. |
| 4 | **HeroResult hero-owns-viewport on mount** (PERT-DESIGN-04 / ROADMAP SC-1) | Does the result numeral (or empty-state copy) fill the top 60% of the viewport at first paint in both modes, both viewports, both themes? First-run defaults are `weight=3.0, all else null` per Phase 1 D-11 — so first-paint shows the empty-state copy. The empty-state copy must own the viewport too. | Critique may flag: (a) on mobile 375 the InputDrawer trigger pushes the hero down too far, (b) on desktop the sticky aside is wider than necessary and crowds the hero. Empty-state copy at `text-ui` may feel "small" in the hero card. | Layout fixes (gap, padding adjustments) ≤ 5 LOC = **fix-now P1** (this directly maps to ROADMAP SC-1). InputDrawer / aside layout changes requiring shared-component or `+page.svelte` shell edits = D-08a / D-08b boundary check; `+page.svelte` is allowed-with-restriction (Phase 2 noted `recapItems` as the documented extension surface). |
| 5 | **Tube-Feed tertiary outputs visual hierarchy** | capsulesPerMonth and lipasePerKg are secondary lines below the hero. Phase 2 D-04 puts them in a `divide-y` list — Phase 4 critique should verify capsulesPerDay (hero) > capsulesPerMonth (secondary) > lipasePerKg (secondary) reads as a clear hierarchy, not visual equality. | Critique may flag: all 4 tube-feed secondary rows look visually identical — clinician scanning needs to find capsulesPerMonth quickly (it's the prescribing artifact). | Reorder rows OR add a subtle visual weight bump (eyebrow color change is forbidden per Identity-Inside; a font-weight bump on the most-prescribed row IS allowed) = **fix-now P2 if ≤5 LOC**. |
| 6 | **Formula picker modal in mobile portrait** | The SelectPicker uses `<dialog showModal()>` which spans full screen in mobile. Post-Phase-3.1 the picker UX is in production-polish for the first time — Phase 4 critique sees it. | Critique may flag: (a) dialog scroll behavior on mobile portrait feels janky, (b) search input doesn't auto-focus consistently, (c) dismiss tap target is too small. | The SelectPicker component is shared and **D-08b forbids edits**. Findings here MUST be filed as cross-calculator backlog items (deferred per CONTEXT "Out of scope: cross-calculator design audit"). Disposition: **defer with cross-reference**. |

---

## Triage + Score Acceptance

### Severity rubric (codifies CONTEXT D-02 verbatim)

| Severity | Definition | Examples |
|----------|------------|----------|
| **P1 (must-fix before merge)** | DESIGN.md named-rule violation; clinical-trust regression; WCAG AA contrast failure on a critical surface; broken layout at mobile 375; regression vs. Phase 42.1 v1.13 design-polish bar. | Em-dash appears in rendered string. `.identity-pert` color leaks into chrome (e.g. on the bottom nav active state). STOP-red advisory loses its visual distinction (border-2 missing, message text not bold). Hero numeral not tabular. Identity hue contrast measurably below 4.5:1. |
| **P2 (should-fix; fix inline if cheap)** | Inconsistency with the other 5 calculators that doesn't violate a named rule but degrades cross-route polish; minor a11y issue caught by `/impeccable` but not by axe-core; theme-asymmetric polish (one theme cleaner than the other). | Spacing inconsistency between PERT input card padding and Feeds. Tube-feed tertiary rows lack hierarchy. SegmentedToggle label phrasing weaker than v1.6. |
| **P3 (nice-to-fix; usually defer)** | Subjective improvements (micro-animations, optional embellishments); ideas that would expand scope beyond the 6 PERT-DESIGN-* requirements. | Animation refinement on mode switch. Custom illustration on empty state. Decorative gradient on hero card. |

### Disposition rules (codifies CONTEXT D-03 verbatim)

| Severity | Default disposition | Override conditions |
|----------|---------------------|---------------------|
| P1 | **fix-now** (no exceptions) | None. Block merge until 0 P1 remain. |
| P2 | **fix-now** if ≤5 LOC AND touches only PERT-route allowlist (D-08); **defer** otherwise | Touching shared component (D-08b) → forced **defer** (cross-calculator backlog). Touching `app.css` outside `.identity-pert` block → forced **defer**. |
| P3 | **defer** (default) | **fix-now** ONLY if <3 LOC AND PERT-route only. |
| Any | **wontfix** | Requires one-sentence rationale referencing DESIGN.md rule, Phase decision, or precedent (e.g. "intentional per Phase 1 D-03 Identity-Inside Rule"). |

### Score acceptance gate (codifies CONTEXT D-04 verbatim)

The phase passes when ALL FOUR conditions hold:

1. **Per-context score:** `/impeccable critique` (which produces the Nielsen 10-heuristic score 0-4 each, total /40) returns ≥35/40 in **at least 6 of the 8 contexts**. The remaining 2 may be 33-34/40 IF accompanied by an explicit triage note explaining the gap (matches v1.13 Phase 42.2 "predominant pass" pattern).
2. **Aggregate score:** Mean of all 8 contexts ≥35/40.
3. **P1 count:** Zero P1 findings remain in `04-FINDINGS.md` after the fix wave (`disposition === "fix-now"` AND status === "shipped"; OR `disposition === "wontfix"` with rationale).
4. **DESIGN.md audit:** `04-AUDIT.sh` exits with status 0 — all 10 rules pass on the post-fix code.

`04-VERIFICATION.md` (Wave 3 deliverable) records evidence for all 4 conditions in a table mirroring the Phase 3.1 7-gate format.

---

## Negative-Space (Files Phase 4 May NOT Touch)

### Allowlist (D-08 — PERT-route files)

```
src/lib/pert/**/*
src/routes/pert/**/*
src/lib/pert/pert-config.json
.planning/workstreams/pert/phases/04-design-polish-impeccable/**/*
```

Verifier asserts via:

```bash
git diff --name-only $BASELINE..HEAD -- 'src/' 'e2e/' \
  | grep -vE '^(src/lib/pert/|src/routes/pert/|src/app\.css$|src/lib/shell/registry\.ts$|e2e/pert(-a11y)?\.spec\.ts$)'
```

Output MUST be empty. Any line printed = a touch outside the allowlist = STOP and escalate.

### Allowed exceptions to D-08 (D-08a — each requires explicit acknowledgment in `04-SUMMARY.md`)

| File | Allowed scope | Trigger |
|------|---------------|---------|
| `src/app.css` | ONLY the `.identity-pert` block (lines 283-291 + the `.dark .identity-pert` / `[data-theme='dark'] .identity-pert` block lines 287-291; verify exact line range at edit time). NEVER any other token, never any other identity class. | Critique-driven contrast retune (Watch Item 1). |
| `src/lib/shell/registry.ts` | ONLY the PERT entry (`{id: 'pert', ...}`). Never edit any other calculator's entry, never re-sort the array. | Critique flags PERT label/icon/description polish. |
| `e2e/pert.spec.ts` | Selector-only updates if a P1 fix invalidates an existing selector. NO behavior changes. | A P1 fix changes a class name or aria-label that an e2e selector targets. |
| `e2e/pert-a11y.spec.ts` | Same selector-only rule. | Same. |

### Strictly forbidden (D-08b — escalate to user, do NOT auto-fix)

- `src/lib/shared/components/*.svelte` — HeroResult, SegmentedToggle, SelectPicker, NumericInput, RangedNumericInput, InputDrawer, DisclaimerBanner, AboutSheet, NavShell, InputsRecap.
- `src/lib/shell/HamburgerMenu.svelte`, `src/lib/shell/NavShell.svelte`.
- `src/lib/{morphine-wean,formula,gir,feeds,uac-uvc}/**` (other calculators).
- `src/lib/fortification/**`.
- `src/lib/shared/about-content.ts`, `src/lib/shared/favorites.svelte.ts`.
- `DESIGN.md`, `DESIGN.json` (Phase 4 enforces, never updates).
- `src/lib/pert/types.ts`, `src/lib/pert/state.svelte.ts`, `src/lib/pert/calculations.ts`, `src/lib/pert/config.ts` — Phase 2 / 3.1 frozen; Phase 4 polish never touches calc layer or state shape.

If any of these need to change to satisfy a P1 finding, the disposition becomes `escalate-to-user` and the plan halts with a Rule-4 stop. Do NOT auto-fix.

---

## Verification Checklist (the verifier's checklist)

The Wave 3 verification plan (`04-LAST-PLAN.md`) executes this checklist verbatim. Each item is a concrete command or grep with an expected output. The 7-gate clinical sequence (inherited from Phase 3.1 plan 04) runs FIRST; the design-polish-specific items below run AFTER.

### Pre-design-polish gates (the inherited 7-gate clinical sequence)

| # | Gate | Command | Expected |
|---|------|---------|----------|
| 1 | svelte-check | `pnpm exec svelte-check` | `0 errors / 0 warnings` |
| 2 | vitest | `pnpm test:run` | `≥ 425 passed` (Phase 3.1 baseline; no test changes expected in Phase 4) |
| 3 | build | `pnpm build` | exit 0; PWA bundle ≤ 580 KiB |
| 4 | pert-a11y | `CI=1 pnpm exec playwright test pert-a11y --reporter=line` | `4 passed` |
| 5 | pert.spec | `CI=1 pnpm exec playwright test pert.spec --reporter=line` | `12 passed` |
| 6 | full Playwright | `CI=1 pnpm exec playwright test --reporter=line` | `117 passed, 1 failed` (the same disclaimer-banner.spec.ts:28 baseline flake; Phase 1+2+3+3.1 precedent) |
| 7 | negative-space | `git diff --name-only $BASELINE..HEAD -- src/ e2e/ \| grep -vE '^(src/lib/pert/\|src/routes/pert/\|src/app\.css$\|src/lib/shell/registry\.ts$\|e2e/pert(-a11y)?\.spec\.ts$)'` | empty (exit 1 from grep is OK; means no out-of-scope hits) |

### Design-polish-specific gates (Phase 4 additions)

| # | Gate | Command | Expected |
|---|------|---------|----------|
| 8 | DESIGN.md named-rule audit | `bash .planning/workstreams/pert/phases/04-design-polish-impeccable/04-AUDIT.sh` | exit 0; all 10 rules PASS. Output appended to `04-VERIFICATION.md`. |
| 9 | Identity-pert reservation manual check | Manual read of `04-AUDIT.sh` Rule-1 grep output against the 10-surface whitelist in Phase 2 UI-SPEC §Color | Every hit on whitelisted surface; 0 hits on chrome. |
| 10 | STOP-red carve-out manual check | Manual read of `04-AUDIT.sh` Rule-4 grep output | Every `--color-error` hit in `PertCalculator.svelte` lines 309-322 (the stopAdvisories block); 0 hits in `PertInputs.svelte` / `+page.svelte`. |
| 11 | Em-dash + en-dash sweep on PERT-route files | `grep -nE "—\|–" src/lib/pert/ src/routes/pert/ src/lib/pert/pert-config.json` | 0 hits across all files (em-dash: U+2014 `—`; en-dash: U+2013 `–`). The pert-config.json was Phase 2 D-19 cleaned; Phase 4 must not regress. |
| 12 | Tabular-numerals manual check | `grep -cE "class=\"[^\"]*\\bnum\\b" src/lib/pert/PertCalculator.svelte` | ≥5 hits (1 hero + 3 oral OR 4 tube-feed secondaries; both branches covered = up to 9 total). |
| 13 | Function-binding bridges intact (Phase 3.1 D-01 regression guard) | `grep -cE "bind:value=\{$" src/lib/pert/PertInputs.svelte` AND `grep -cE "let \w+(Bridge\|Proxy) = \$state" src/lib/pert/PertInputs.svelte` | First grep: 3 hits (medication, strength, formula). Second grep: 0 hits. |
| 14 | All 8 critique transcripts captured | `ls .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-*.md \| wc -l` | 8 |
| 15 | FINDINGS triage table populated | Read `04-FINDINGS.md`; verify table has rows; verify zero rows with severity=P1 AND disposition≠"fix-now"/"shipped"/"wontfix" | 0 unhandled P1 |
| 16 | Per-context score ≥35/40 in ≥6/8 contexts | Read each `04-CRITIQUE-*.md` Design Health Score table; tally `≥35/40` count | ≥6 |
| 17 | Aggregate score ≥35/40 | Compute mean of the 8 per-context scores | ≥35/40 |
| 18 | Watch Item 6 (Formula picker dialog) findings filed as cross-calc backlog | Read `04-FINDINGS.md`; if any finding cites `src/lib/shared/components/SelectPicker.svelte`, verify disposition is `defer` with cross-reference | All such findings deferred (no shared-component edits) |

The verification plan writes `04-VERIFICATION.md` enumerating all 18 gates with PASS/FAIL + raw evidence (paste of grep output, paste of audit script output, paste of FINDINGS triage summary).

---

## Wave Structure (recommended; planner has final say)

Codifies CONTEXT D-07 + D-07a. Phase 4 has a built-in replan beat: Wave 2 plan count cannot be authored ahead of Wave 1 output.

| Wave | Plan(s) | Purpose | Output |
|------|---------|---------|--------|
| Wave 1 (sequential, 1 plan) | `04-01-PLAN.md` | Run all 8 `/impeccable critique` invocations against the live dev server. Capture transcripts. Run `npx impeccable --json` against the 3 PERT route files. Normalize findings into `04-FINDINGS.md` triage table. NO code changes. | 8 transcripts + populated `04-FINDINGS.md` |
| Wave 2 (1-N plans, parallel-eligible if file-disjoint) | `04-02-PLAN.md` ... `04-0N-PLAN.md` | Apply fixes per disposition column. Plan count + scope determined AFTER Wave 1 ships. **Replan beat:** orchestrator (or `/gsd-plan-phase 4 --gaps`) generates these plans post-Wave-1. | Code changes confined to D-08 allowlist; em-dash regression guard re-run; function-binding bridges re-verified |
| Wave 3 (sequential, 1 plan) | `04-LAST-PLAN.md` | Re-run `/impeccable critique` on post-fix UI for all 8 contexts; run 7-gate clinical sequence + 11 design-polish gates above; write `04-VERIFICATION.md` certifying ≥35/40 + zero P1 + DESIGN.md audit clean. | `04-VERIFICATION.md` + 8 post-fix critique transcripts (overwrite or `-postfix-` suffix; planner picks naming) |

The Wave 1 plan starts with: `pnpm dev &` (background); orchestrate the 8 contexts; `kill $DEV_PID`; populate FINDINGS. The Wave 3 plan re-runs the same dev-server pipeline against post-fix code.

---

## Conflict Surface (resolved during research, no planner action required)

The CONTEXT D-09 "Researcher TODO" is now resolved:

1. **`/impeccable` skill API:** Verified at `~/.claude/plugins/marketplaces/impeccable/.claude/skills/impeccable/SKILL.md` v3.0.1. The skill is a multi-phase workflow (LLM Assessment + Automated Detection), not a single-shot CLI score command. The score (Nielsen 10-heuristic table totaling /40) is part of the `/impeccable critique` output. There is no separate `/impeccable score` subcommand; CONTEXT D-04's "re-run `/impeccable score`" is reinterpreted as "re-run `/impeccable critique` and read its Design Health Score table."
2. **Per-context invocation:** `/impeccable critique <URL>` per (theme, viewport, mode) triple — 8 invocations total. The skill does not accept theme/viewport/mode flags; those are browser-side state set before each invocation via `localStorage`, viewport resize, and SegmentedToggle click.
3. **Browser automation:** The skill uses `npx impeccable live` for an injectable overlay AND/OR a sub-agent visual review. Both depend on browser automation (Playwright already a project dep). If the executor's environment lacks browser automation, fall back to the deterministic CLI scan (`npx impeccable --json src/lib/pert/...`) plus a screenshot-based sub-agent review using Playwright captures. Wave 1 plan's RESEARCH section MUST verify which path the environment supports.
4. **STOP-red carve-out semantics:** Surface tint stays NEUTRAL (`--color-surface-card`); the urgency lives in `border-2 var(--color-error)` + `OctagonAlert` icon + bold red message text. Any critique suggesting a tinted-red surface is a WONTFIX with the rationale documented in this spec under Watch Item 2.
5. **CONTEXT D-04 mention of `AlertOctagon` icon:** Phase 2 D-20 corrected this — the Lucide-Svelte export is `OctagonAlert`. Live source `PertCalculator.svelte:14` confirms `import { OctagonAlert } from '@lucide/svelte'`. Phase 4 critique fixes MUST NOT regress this import to the non-existent `AlertOctagon`.

No conflicts remain that require planner action. UI-SPEC ships as `draft` to allow the checker to validate.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PENDING (em-dash + en-dash sweep at gate 11; advisory copy invariants at PertCalculator invariants section)
- [ ] Dimension 2 Visuals: PENDING (Hero invariants + secondary-output invariants + STOP-red invariant)
- [ ] Dimension 3 Color: PENDING (DESIGN.md Rules 1, 2, 3, 4 — Identity-Inside reservation list, Amber ban, OKLCH-only, Red-Means-Wrong with carve-out)
- [ ] Dimension 4 Typography: PENDING (DESIGN.md Rules 5, 7, 8 — Five-Roles-Only, Eyebrow-Above-Numeral, 11px Floor)
- [ ] Dimension 5 Spacing: PENDING (Phase 2 UI-SPEC spacing scale inherited; Phase 4 verifies no regression via critique)
- [ ] Dimension 6 Registry Safety: PENDING (no new shared components; PERT-route allowlist enforced via gate 7)

**Approval:** pending — awaiting `gsd-ui-checker` sign-off. The planner reads this spec verbatim; the executor uses it as the visual source of truth for any P1/P2 fix that ships.

---

*Generated by gsd-ui-researcher on 2026-04-26. Workstream: pert. Phase: 04-design-polish-impeccable. Status: draft.*
*This is a design-contract-enforcement spec, not a build spec — Phase 4 codifies the 10-rule audit + 8-context critique matrix + post-Phase-3.1 invariants the critique fixes preserve.*

## UI-SPEC COMPLETE
