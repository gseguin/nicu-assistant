# Phase 30 — Impeccable Polish + Tech Debt Sweep · CONTEXT

**Milestone:** v1.9 — GIR Titration Hero Swap + Polish
**Phase:** 30
**Goal (from ROADMAP.md):** All three calculators feel clinically impeccable in both themes at mobile + desktop, and the codebase is on clean, current dependencies with zero lint/type noise.
**Requirements:** POLISH-01..04, DEBT-01..04

---

## Vision

Phase 30 is a **discovery-driven sweep**, not a feature phase. The work list is produced by running `impeccable:critique` across the three calculators and by reading `pnpm outdated` / `pnpm svelte-check` / lint output. The plan must be a framework the executor can run end-to-end: critique → classify → fix P1/P2 → re-verify → dep bump in groups → lint/TS cleanup → final axe gate.

This phase was planned in `--auto` mode without a discuss-phase session. Decisions below reflect safe defaults; the executor has authority to make small in-scope judgment calls during the critique → fix loop.

## Surface area (known in advance)

- **3 calculators** to critique: Morphine Wean (`src/lib/morphine/`), Formula/Fortification (`src/lib/formula/`), GIR (`src/lib/gir/`)
- **Shell chrome** (`src/lib/shell/`) — title bar, nav, disclaimer, about sheet — in scope for any cross-calculator polish findings
- **Shared components** (`src/lib/shared/components/`) — NumericInput, SelectPicker, SegmentedToggle, ResultsDisplay — in scope for polish only if a finding is traceable to them
- **Design tokens** (`src/app.css`) — bumps allowed for WCAG 2.1 AA contrast fixes ONLY; **no new identity hues, no new OKLCH tokens** (v1.9 out of scope guardrail)
- **Tests** — existing vitest + Playwright suites; polish changes must not regress them
- **Dependencies** — `package.json` + `pnpm-lock.yaml`. Stay within current major versions (no SvelteKit 3, no Svelte 6, no Vite 9)

## Known pre-existing issues to pick up (from Phase 29 deferred-items.md)

1. `src/lib/shell/__tests__/registry.test.ts:9` — asserts `CALCULATOR_REGISTRY.length === 2`, but registry has 3 entries since v1.8. **Fix:** update the assertion to 3, or replace with a key-set assertion.
2. `pnpm svelte-check` pre-existing errors (none introduced by Phase 29):
   - `src/lib/gir/GirCalculator.svelte:13:56` — `GlucoseBucket id` type narrowing
   - `src/lib/shell/NavShell.svelte:2:24` — `$app/state` module resolution (svelte-check env, not runtime)
   - `src/routes/+layout.svelte:12,44` — `virtual:pwa-*` module resolution (Vite-only virtuals)
   - `src/routes/+page.svelte:2:24` — `$app/navigation` module resolution
   - `src/lib/shared/components/SegmentedToggleHarness.svelte:5:22` — Svelte 5 `state_referenced_locally` warning
   
   **Classify each:** genuine type bug → fix. Module resolution issues that are svelte-check environment noise → suppress via config, NOT via `any` casts.
3. `pnpm lint` — the Phase 29 executor noted "eslint not installed." **Investigate:** does the repo have a lint command at all? If not, decide whether to add one or drop DEBT-03's "ESLint" requirement in favor of svelte-check + Prettier only. Document the decision in PROJECT.md Key Decisions.

## Locked decisions (from REQUIREMENTS.md and PROJECT.md)

- **No new OKLCH tokens, no new identity hues** — if axe surfaces contrast regressions, bump existing tokens only
- **Stay within current major versions** — no SvelteKit 3, no Svelte 6, no Vite 9, no Tailwind 5 (if it exists)
- **16/16 axe sweeps green before PR** — v1.8 "axe BEFORE PR" policy
- **All existing tests must pass** — spreadsheet parity tests are load-bearing
- **`.impeccable.md` is the design contract authority** for all polish work (v1.4 decision)

## Decisions locked by `--auto` planning (safe defaults)

### Decision 1 — Critique scope ordering

**Default:** Run critique on **GIR first**, then **Morphine**, then **Formula**. GIR just had a layout swap (Phase 29) so it's the most likely to have surfaced new findings; Morphine is next because it's the most typographically mature (v1.4–v1.6 polish cycles); Formula last because it's the most settled.

### Decision 2 — Severity classification

**Default:** Use `impeccable:critique`'s own P0/P1/P2/P3 rubric. Plan requires:
- **P1 and P2 fixed** (POLISH-02, POLISH-03 in REQUIREMENTS.md — P1 always, P2 "addressable without architectural change")
- **P3 deferred to NOTES.md** unless trivially cheap
- **P0 is a blocker** — if any found, stop and escalate (would indicate a pre-existing failure we missed)

### Decision 3 — Dependency update strategy

**Default:** Bump in **dependency groups**, not individually:
- Group A: Svelte ecosystem (`svelte`, `@sveltejs/kit`, `@sveltejs/adapter-static`, `@sveltejs/vite-plugin-svelte`)
- Group B: Vite + Tailwind (`vite`, `@tailwindcss/vite`, `tailwindcss`)
- Group C: Testing (`vitest`, `@playwright/test`, `@vitest/*`)
- Group D: Other (`@lucide/svelte`, `bits-ui`, `@vite-pwa/sveltekit`)

After each group: full test suite + svelte-check + axe sweep. One atomic commit per group. If a group breaks, revert and try individual bumps within that group.

### Decision 4 — Lint / type strict cleanup

**Default:** Fix what's fixable without touching out-of-scope files. Any suppression must be explicit (`// @ts-expect-error: <reason>`) with a rationale comment. No blanket `any` casts.

### Decision 5 — Screenshot capture for critique record

**Default:** For each impeccable critique pass, capture screenshots to `.planning/phases/30-impeccable-polish-tech-debt-sweep/critique/` for the record. Delete them after phase completion (not committed to git; they're transient evidence).

### Decision 6 — When to stop fixing

**Default:** The phase is done when:
- Critique findings are resolved or explicitly deferred with rationale
- Deps are current within major versions
- `svelte-check` has zero new warnings (pre-existing may be documented-and-deferred only if fundamentally unfixable, e.g., Vite virtual modules)
- Phase 29 deferred-items.md issues are addressed or re-deferred with rationale
- 16/16 axe sweeps green in light + dark
- Full test suite green

The executor should NOT chase infinite P3 polish. Time-box if needed.

## Non-goals (explicit)

- No new calculators, no new features
- No GIR-SWAP follow-up work — Phase 29 is closed
- No architectural refactors — "addressable without architectural change" is the POLISH-03 filter
- No major version dependency upgrades
- No new OKLCH tokens or identity hues
- No changes to the `impeccable` skill itself
- No localization / i18n
- No PDF export / share links

## Downstream guidance

### For `gsd-phase-researcher` (if spawned)
**Probably skip research entirely for this phase.** The real "research" happens during execution when `impeccable:critique` runs. A pre-execution researcher adds little value because:
- Polish findings are empirical, not literature-derived
- The design contract (`.impeccable.md`) already exists
- Dependency choices are locked ("stay within current majors")
- The tech debt list is knowable from `pnpm outdated` + `svelte-check`, which happens during execution

If research IS spawned, scope it to: "which existing OKLCH tokens are safest to bump for contrast fixes without cascading visual regressions?" and nothing else.

### For `gsd-planner`
Structure the plan as a **framework with gates**, not a fixed task list:
- **Plan 30-01: Impeccable critique + fix loop** — run critique for each calculator, classify findings, fix P1+P2 in atomic commits, re-verify. End gate: 16/16 axe green + all tests green + critique findings resolved.
- **Plan 30-02: Tech debt sweep** — audit deferred items from Phase 29, update deps in groups (Decision 3), lint/TS cleanup, document what can't be fixed. End gate: zero new svelte-check warnings + full test suite green + deps current within majors.

Two plans allow Phase 30 to naturally split into a "design correctness" pass and a "code correctness" pass, each with its own gate. They can ship sequentially.

Each task should:
- Reference specific files/commands where knowable
- Be atomic where possible (one critique finding = one commit, one dep group = one commit)
- Document where the executor has discretion (critique triage, severity calls, suppression decisions)
- Honor the "stop when" criteria from Decision 6

### For the executor
You will be making real judgment calls during execution — the plan can't predict what critique will find. Key principles:
- **Trust the design contract** (`.impeccable.md`) — it's authoritative
- **Atomic commits** — one finding fixed, one commit; one dep group bumped, one commit
- **Every fix gets a test run + axe sweep** before the next fix — don't batch unverified changes
- **When in doubt, defer to NOTES.md** — better to ship 8 well-verified fixes than 12 half-checked ones
- **Screenshot before and after** each P1/P2 visual fix (store in `critique/` dir, don't commit)

## Success criteria (from ROADMAP.md, restated)

1. A documented `impeccable:critique` pass exists for Morphine, Formula, and GIR in both themes at mobile 375 + desktop 1280, with severity-rated findings.
2. Every P1 finding and every P2 finding addressable without architectural change is fixed and visible in the running app.
3. Axe-core reports zero WCAG 2.1 AA regressions after polish — 16/16 sweeps remain green in both themes.
4. Dependencies (SvelteKit, Svelte, Vite, Tailwind, Vitest, Playwright, @lucide/svelte, bits-ui) are updated within current majors and the full test suite passes.
5. `svelte-check` and ESLint report zero warnings across `src/` (if ESLint is not installed, document the decision); dead code and deferred cleanups from v1.5–v1.8 are removed or re-deferred with rationale in PROJECT.md Key Decisions.

---
*Created: 2026-04-09 — Phase 30 auto-planned (no discuss-phase session)*
