# NICU Assistant — Workstream `pert`

## What This Is

Parallel workstream of the **NICU Assistant** PWA, focused on adding a sixth clinical calculator: a **Pediatric Exocrine Pancreatic Insufficiency (EPI) PERT dosing calculator** covering both oral meals and tube-feeding. Shipped alongside the main workstream's v1.14 work without disturbing it.

## Core Value (workstream)

NICU and pediatric GI clinicians can calculate Pancreatic Enzyme Replacement Therapy (PERT) capsule counts at the bedside — for a meal or for a 24-hour tube-feed — using the same trusted weight-toggle / segmented-toggle / hero-result pattern as the other five NICU Assistant calculators.

## Current Milestone: v1.15 Pediatric EPI PERT Calculator

**Goal:** Add a sixth calculator (`/pert`) with two modes (Oral / Tube-Feed) matching `epi-pert-calculator.xlsx` Pediatric tabs, parity-tested within ~1% epsilon, and integrated into the registry, navigation, AboutSheet, and PWA shell with zero regressions.

**Target features:**

- **Pediatric Oral PERT mode** — weight (lbs/kg toggle) + fat grams + lipase units/kg + medication + strength → capsules per dose, total lipase, max lipase units/day safety cap (parity with `Pediatric Oral PERT Tool` sheet)
- **Pediatric Tube Feed PERT mode** — weight (lbs/kg toggle) + pediatric enteral formula picker (~17 formulas with fat g/L) + volume/day (mL) + lipase units/kg/day + medication + strength → capsules/day, capsules/month, lipase per kg (parity with `Pediatric Tube Feed PERT` sheet)
- **Shared PERT infrastructure** — `pert-config.json` (5 medications: Creon, Zenpep, Pancreaze, Pertzye, Viokace, with strength arrays + pediatric formula fat-g/L table), SegmentedToggle for mode switching, weight-unit toggle (lbs/kg) with conversion
- **Architecture integration** — `CalculatorId` union extended with `'pert'`, registry entry with `.identity-pert` OKLCH hue (researched pre-PR per v1.8 decision), `src/lib/pert/` module, `/pert` route, NavShell `activeCalculatorId` ternary extended, AboutSheet entry citing `epi-pert-calculator.xlsx` Pediatric tabs + DailyMed
- **Quality gates** — spreadsheet-parity vitest within ~1% epsilon for both modes (multiple weight + fat fixtures), component tests (empty / valid / mode-switch / out-of-range / lbs-kg-toggle), Playwright E2E (mobile 375 + desktop 1280, both modes), 2 axe sweeps (light/dark) added to the existing extended axe suite, version bump
- **Zero regressions** — favorites store, hamburger menu, NavShell, and the 5 existing calculators (Morphine, Formula, GIR, Feeds, UAC/UVC) unchanged; clinical gate green before merge

**Inspirations from `/home/ghislain/src/pert-calculator`:** medication/strength filtering, `runFormula` step-based config approach, `dosing.ts` pure-function design, SelectPicker for formula. **Not** ported: adult tabs, full FDA NDA records (DailyMed citation only), Capacitor native build.

### Out of Scope (workstream)

- Adult Oral PERT and Adult Tube Feed PERT tabs — pediatric only for v1.15 (adult deferred to a future milestone if needed)
- Capacitor / native iOS/Android — PWA only, consistent with main project Out of Scope
- Per-meal historical logging — stateless calculator like the other five
- Pertzye row-30 / Pediatric-Tube-Feed row-28 `Pertzye=2.0` xlsx artifact — treated as data-entry noise, not a real strength
- Backend / API — all data embedded at build time, consistent with main project
- Analytics / telemetry — clinical privacy, consistent with main project

## Context

**Why a separate workstream:** The main workstream is mid-flight on v1.14 (Kendamil formulas + desktop full nav). Adding a calculator and a Kendamil expansion in the same milestone would couple two independent change vectors and slow review. The `pert` workstream lets PERT plan/execute/ship in parallel without blocking v1.14.

**Inherited tech stack** (from main project — read `.planning/PROJECT.md` for full validated history):
- SvelteKit 2.55 + Svelte 5 (runes) + Tailwind CSS 4 + Vite 8 + TypeScript 6 + pnpm 10.33
- 5 calculators shipped through v1.13: Morphine, Formula, GIR, Feeds, UAC/UVC
- Plugin-style calculator registry, identity OKLCH tokens, sessionStorage-backed `$state` singletons, `<HeroResult>` shared component, sticky InputDrawer, `<DisclaimerBanner>` v2 (dismissable), favorites-driven nav (max 4), hamburger menu listing all calculators
- Quality bar: svelte-check 0/0, spreadsheet-parity vitest within ~1% epsilon, Playwright E2E + extended axe suite green in both themes, axe-core a11y on every calculator (16/16 → 33/33 sweeps as calculators were added)

**xlsx source of truth:** `epi-pert-calculator.xlsx` at the repo root. Six sheets total; this milestone consumes `Pediatric Oral PERT Tool` and `Pediatric Tube Feed PERT` only.

**Users:** NICU clinicians + pediatric GI physicians + pediatric dietitians at point of care, plus parents/caregivers of pediatric EPI patients (cystic fibrosis, Shwachman-Diamond, chronic pancreatitis). Mobile-first, one-handed bedside use; also desktop workstations for tube-feed planning.

## Constraints (workstream-specific additions)

Inherits all main-project constraints (PWA only, offline-first, WCAG 2.1 AA, embedded clinical data). Additional:

- **xlsx parity is non-negotiable** — Pediatric tab cell formulas (`B5/B7` weight conversion, `ROUNDUP`, `CEILING`, `VLOOKUP`) must match within ~1% epsilon, with row-by-row fixtures
- **Safety cap honored** — `B12 = B5 × 10000` (max lipase units/day = 10,000 × kg) must surface as a clinical advisory when a dose would exceed it (consistent with v1.8 GIR safety advisories pattern)
- **Two-mode UI without breaking favorites** — single registry entry, single `/pert` route; mode switching internal to the calculator (SegmentedToggle pattern from v1.6)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pediatric-only for v1.15 | Adult dosing has different fat-load assumptions and would double the test surface; pediatric is the NICU-adjacent subset | Pending |
| Single `/pert` route with internal mode toggle | Two routes would split favorites/registry semantics and break the "5 → 6 calculators" mental model | Pending |
| `runFormula` step config from /home/ghislain/src/pert-calculator | Already pure, already tested, already declarative — let clinical updates be JSON-only | Pending |
| Cite xlsx + DailyMed in AboutSheet (not full NDA records) | The reference app's full FDA-source-record JSON is nice-to-have; the xlsx is the clinical authority for this app | Pending |
| OKLCH identity hue researched pre-PR | v1.8 decision: axe-core retuning costs more than upfront audit | Pending |

## v1.15 Closure (Pediatric EPI PERT Calculator -- 2026-04-26)

Workstream `pert` v1.15.0 ships the sixth NICU Assistant calculator: Pediatric EPI PERT (Oral + Tube-Feed modes), parity-tested within ~1% epsilon against `epi-pert-calculator.xlsx` Pediatric tabs, integrated into the registry, navigation, AboutSheet, and PWA shell with zero regressions to the five shipped calculators (Morphine, Formula, GIR, Feeds, UAC/UVC) or the v1.13 favorites store / hamburger menu.

### Newly Validated requirement IDs (v1.15.0 Phase 5)

- PERT-REL-01 -- `package.json` bumped 1.13.0 -> 1.15.0; AboutSheet auto-flows via `__APP_VERSION__` Vite-define (commit `92e4a1c`)
- PERT-REL-02 -- AboutSheet reflects `v1.15.0` for all 6 calculator entries (no `about-content.ts` edit needed); production bundle baked with the literal `1.15.0` at `build/_app/immutable/nodes/0.BbEh0vra.js:28`
- PERT-REL-03 -- workstream PROJECT.md Validated list updated; main `.planning/PROJECT.md` fold-back deferred to `/gsd-workstreams complete pert` per 05-CONTEXT.md D-06
- PERT-REL-04 -- workstream ROADMAP.md Progress rows flipped to Complete; orphan UAT debug artifacts cleaned (11 targets removed in commit `0024855`)
- PERT-REL-05 -- 7-gate clinical gate green pre-bump (svelte-check 0/0; vitest 425/425; pnpm build 576.21 KiB; pert-a11y 4/4; pert.spec 12/12; disclaimer-banner targeted 6 passed + 1 baseline flake on `disclaimer-banner.spec.ts:28` per established Phase 1/2/3/3.1/4 precedent; PERT-route invariants all 9 assertions PASS)

### Cross-reference to previously-Validated PERT-* requirement IDs

All 49 IDs Validated post-Phase-3.1 + Phase 4 stay Validated:

- PERT-ARCH-01..07 (Phase 1)
- PERT-HUE-01..03 (Phase 1)
- PERT-DATA-01..04 (Phase 1)
- PERT-ORAL-01..08 (Phase 2)
- PERT-TUBE-01..07 (Phase 2)
- PERT-MODE-01..04 (Phase 2)
- PERT-SAFE-01..04 (Phase 2; PERT-SAFE-01 referenced-not-modified at Phase 4 Wave 6)
- PERT-TEST-01..04 + PERT-TEST-06 (Phase 3); PERT-TEST-05 (Phase 3 + Phase 3.1 FULL closure)
- PERT-DESIGN-01..06 (Phase 4)

Total v1.15 Validated: 54 / 54.

### Phase closures

- Phase 1 (Architecture, Identity Hue & Clinical Data) -- Complete 2026-04-24 (commits `34d64d6`, `f693b57`, `f7683bd`, `38468dd`, `d321580`, `805fd79`, `d9486ec`, `aa60629`)
- Phase 2 (Calculator Core: Both Modes + Safety) -- Complete 2026-04-25 (commits `3a9b18f`, `6f05cfc`, `c1ba699`, `3171b06`, `b2e8e2b`, `1c74ef5`)
- Phase 3 (Tests) -- Complete 2026-04-25 (commits `5d1356f`, `ad3bf36`, `3d45c7e`, `c56abf7`, `b83c0ea`)
- Phase 3.1 (KI-1 Resolution: SelectPicker bridge fix) -- Complete 2026-04-26 (commits `f2da16d`, `dfb6a62`, `0d9636f`)
- Phase 4 (Design Polish: /impeccable critique sweep) -- Complete 2026-04-26 (commits `eec18c2`, `e1e60cb`, `72be821`, `29306e7`, `136b624`, `2dc7ae2`, `5cd3386`, `95e31b0`, `3001c2a`, `33695e1`, `a6d9469`, `d82aa30`, `78686f9`, `f4565b4`, `618a66f`, `b0fe1a0`, `a5ed7d7`)
- Phase 5 (Release) -- Complete 2026-04-26 (commits `0024855` cleanup, `92e4a1c` bump, plus the closure-record + SUMMARY commits authored by this plan)

### Open backlog at workstream completion

None of these block v1.15.0 release; all flagged for v1.15.x hotfix or v1.16 carrier:

- F-01 NumericInput template en-dash (~1 LOC; v1.15.x or v1.16 cross-calculator polish phase)
- F-02 NavShell sticky-overlay layering (~5-15 LOC investigation; v1.16 carrier)
- `pert-config.json:137 invalidLipaseRate` en-dash (~1 LOC; same v1.16 carrier as F-01)
- Weight-in-Oral UX evolution past Option 3 (Wave 6 D-14 helper text shipped; if future user feedback wants Option 1 -- separate section header -- or another rung, that is a v1.15.x or v1.16 cycle)

### Workstream-completion handoff

After Kendamil v1.14 ships on main, run from the main repo:

```
cd /mnt/data/src/nicu-assistant
git fetch origin workspace/pert
git merge workspace/pert
git worktree remove /mnt/data/src/gsd-workspaces/pert/nicu-assistant
/gsd-workstreams complete pert
```

The `/gsd-workstreams complete pert` handler:
- Reads this PROJECT.md's v1.15 Closure section
- Folds the 54 Validated PERT-* IDs into the main `.planning/PROJECT.md` Validated list
- Updates the main `.planning/REQUIREMENTS.md` traceability
- Archives the workstream

## Evolution

This document evolves at phase transitions and milestone boundaries within the `pert` workstream.

**After each phase transition** (via `/gsd-transition --ws pert`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**At workstream completion** — fold validated requirements + decisions back into the main `.planning/PROJECT.md` Validated list, then archive this workstream via `/gsd-workstreams complete pert`.

---
*Last updated: 2026-04-25 — workstream `pert` v1.15 milestone started (Pediatric EPI PERT Calculator)*
