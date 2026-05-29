# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.18 — Persistence Seam

**Shipped:** 2026-05-29
**Phases:** 4 (55–58) | **Plans:** 5 | **Tasks:** ~14 | **Sessions:** 1 (full chain in `--auto`)

### What Was Built
- **PersistentValue<T> seam** (`src/lib/shared/persistent-value.ts`, 126 LOC, plain `.ts`, zero imports, zero runes): guarded `read`/`write`/`remove` behind a single SSR + private-mode guard, per-instance codec defaulting to JSON plus a `rawStringCodec` (raw values stored without JSON quotes, FOUC-safe), and an optional `recover(raw: string | null) => T` migrate hook that owns the read path when present. Single test surface (26 co-located tests + 4 edge-case guards added from code review) covering SSR, parse-failure fallback, write-throw silent-catch, and both representative recover fixtures (disclaimer-style + favorites-style).
- **Four shared singletons** (theme, disclaimer, favorites, lastEdited) migrated onto the seam as thin behavior-preserving adapters: byte-identical storage keys + persisted shapes; `theme` stores `'dark'` unquoted (FOUC-safe), `disclaimer` keeps v1 read-only for audit trail, `favorites` custom codec wraps `{v:1, ids}` while passing the existing 6-step `recover()` to the seam, `lastEdited` uses a recover hook that guards `Number('') === 0 → null`. Three regression suites (`favorites.test.ts`, `calculator-store.test.ts`, `DisclaimerBanner.test.ts`) stayed green with **zero test edits**.
- **Auto-persist consolidation:** `CalculatorStore` constructor installs one `$effect.root(() => $effect(() => { JSON.stringify(this.current); this.persist(); }))` after `this.init()`, wrapped in `if (typeof localStorage !== 'undefined')` for SSR safety. **Nine duplicate `$effect(...persist...)` blocks deleted** — 5 from `*Inputs.svelte` (the plan target) + 4 from `*Calculator.svelte` parents (the code review caught a plan scope gap). Re-entry impossible by construction (effect reads `this.current`, never `this.lastEdited.current`); existing 60s `STAMP_DEBOUNCE_MS` is defense-in-depth.
- **Release v1.18.0:** `package.json` bumped 1.17.0 → 1.18.0 (single string edit; pnpm-lock.yaml unchanged for version-only bump as predicted by research). Clinical gate: svelte-check 0/0 across 4592 files, vitest 451/451 (+15 net from milestone start), `pnpm build` OK. Playwright + extended axe sweeps deferred to CI via `58-HUMAN-UAT.md` (Phase 54 precedent). Tagged `v1.18.0` and pushed.

### What Worked
- **`--auto` chain end-to-end** across 4 phases (discuss → plan → execute → verify → transition × 4). Each phase landed in 5–15 minutes of executor wall time; the orchestrator stayed under context budget by delegating all heavy lifting to subagents.
- **Worktree isolation + fast-forward merges.** Every executor ran in an isolated worktree against the same base as `main`; the merge back was always a fast-forward, leaving a clean linear history of atomic per-task commits (`feat`, `test`, `refactor`, `docs`) — every phase produced a readable git log on its own.
- **Code review as a real scope-gap detector.** Phase 57's REVIEW.md WR-01 caught the duplicated `$effect` in 4 `*Calculator.svelte` parent files that the plan had missed (the plan listed only `*Inputs.svelte`). Without that finding, AUTO-01 would have shipped a half-consolidated solution. The review-fix-recommit pattern is now a load-bearing part of the GSD loop, not advisory polish.
- **Locking byte-shape facts in CONTEXT.md decisions.** D-01..D-08 across phases 55/56/57 captured the load-bearing details (rawStringCodec for FOUC, favorites custom codec wraps `{v:1,ids}`, lastEdited recover-hook for `Number('') === 0`) before research/planning. When the planner agent later needed to reason about codec choice, the answer was already in CONTEXT — no re-litigation, no drift.
- **Research stage caught real implementation traps.** Phase 57 research verified `$effect.root()` correctness against the Svelte 5.55.4 source and confirmed async-microtask flush semantics, which made the test idiom (`await tick()`) and spy-positioning rules concrete. Phase 56 research found two adapter-level traps (theme + favorites null-probe necessity; favorites custom-codec wrapping) that the CONTEXT had partially missed.
- **Phase 54 release pattern as a template.** Phase 58 followed Phase 54's two-plan shape (58-01 doc-sync, 58-02 version-bump + gate + HUMAN-UAT). The Playwright-deferred-to-CI pattern carried forward cleanly via HUMAN-UAT.md.

### What Was Inefficient
- **Two passes to land Phase 57 completely.** The plan only scoped `*Inputs.svelte` deletions and missed the `*Calculator.svelte` duplicates. Required a follow-up commit (`ccdc923`) after code review. Lesson: the planner should scope-check duplicates *by pattern*, not by file group named in the requirement — a grep of `JSON.stringify(...State.current)` across all `src/lib/**/*.svelte` would have caught both layers up-front.
- **HUMAN-UAT.md scanner format mismatch.** The pre-close `audit-open` scanner expected `result: pending` pattern but `58-HUMAN-UAT.md` used `result: [pending — CI]`. The audit reported `open_scenario_count: 0` even though there *were* two pending CI items. Cosmetic, but the HUMAN-UAT template should match the scanner's regex so dashboards reflect reality.
- **MILESTONES.md double-entry on `milestone.complete`.** The CLI prepended a stub `## v1.18` entry above the proper entry that Phase 58-01 had already written, requiring manual de-duplication. Future GSD update: the CLI should detect an existing entry for the version and merge or skip.
- **Phase 58 grep-gate over-strict in plan-checker.** The plan asserted `grep -c 'JSON.stringify(this.current)' calculator-store.svelte.ts → 1` but the actual count was 2 (one new auto-persist line + one pre-existing `persist()` line). Cosmetic — the second match was correct code from before the phase. Lesson: count grep gates need to whitelist pre-existing matches or assert delta, not absolute count.

### Patterns Established
- **The seam-and-adapter shape for cross-cutting concerns.** When a pattern is duplicated across N modules with subtle drift, extract a tested seam (plain `.ts`, no rune) + thin adapter wrappers (rune-bearing where reactivity is needed). Adapter keeps `$state` and DOM side-effects; seam owns guarded I/O. PersistentValue<T> is the v1.18 canonical example; CalculatorStore + LastEdited follow the same pattern from v1.13/v1.15.1.
- **Behavior-preserving milestones are first-class.** v1.18 added zero user-visible features. It shipped on the strength of: locality (storage failure handled once), leverage (1 seam serving 4 adapters + every calculator), and audited consolidation (1 well-tested place instead of 4 hand-rolled copies). Tag rule: a behavior-preserving milestone is a minor bump (1.X.0), not a patch.
- **Code review as RED phase for incomplete scope.** Treating REVIEW.md WARNING findings as scope-gap signals rather than polish — the WR-01 fix in Phase 57 became a 4-file deletion that completed AUTO-01.
- **`$effect.root()` in a `.svelte.ts` class constructor** is the standard Svelte 5 idiom for hosting reactivity outside a component. Singleton lifetime = app lifetime → cleanup callback discarded; subscription is via a deep `JSON.stringify(this.current)` touch; re-entry safety is proven by the effect not reading the side-effect signal it writes.
- **Two raw `localStorage.getItem` null-probes are allowed exceptions** for adapters that need to distinguish "nothing stored" from "stored the default value" (theme prefers-color-scheme fallback; favorites first-run write-back detection). Document them inline in the grep gates so future audits don't false-positive.

### Key Lessons
1. **Test as the regression gate, not as ceremony.** The "existing test suites stay green with zero edits" hard gate for Phase 56 prevented behavior drift that a "tests pass after migration" gate would have allowed (you'd be tempted to "fix" T-19 if a spy interaction changed). The test files are the spec.
2. **Grep gates need to assert deltas, not absolute counts** when refactoring within an existing file. A grep that counts `effect.root` in CalculatorStore would naturally see 2 (one comment + one call) without that being wrong.
3. **CI-deferred items go in HUMAN-UAT.md, not in deferred-items prose.** The structured artifact surfaces in `/gsd:progress` and `/gsd:audit-uat`; prose in STATE.md does not. Phase 54's HUMAN-UAT template is now the canonical shape.
4. **MILESTONES.md entries should be written by the planning phase that did the work**, not by the CLI from SUMMARY one-liners. Phase 58-01 wrote a rich, technically accurate entry; the CLI's auto-stub was nearly useless.
5. **Decision documents (CONTEXT.md) are the source of truth, not the plan or the research.** When research surfaced refinements (theme null-probe; favorites custom codec), they amended CONTEXT before reaching the planner. The downstream chain is only as good as CONTEXT.

### Cost Observations
- **Single session for the entire milestone** under `--auto` chain. Sub-agent delegation (researcher, planner, plan-checker, executor in worktree, code-reviewer, verifier) kept orchestrator context low; each agent ran with 100% fresh context.
- **Model mix:** Orchestrator on Opus 4.7 (1M context); all sub-agents on Sonnet via `executor_model: "sonnet"`. The 1M-context orchestrator turned out matter only at the milestone-close step (this retrospective + MILESTONES.md narrative); the bulk of the chain ran fine on Sonnet sub-agents.
- **Notable:** The first end-to-end auto-chain through a 4-phase milestone with zero human-in-the-loop interventions until the explicit "tag and push" + "complete milestone" checkpoints. Code-review iteration (1 round per phase) was the only intra-phase loop.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.18 | 1 | 4 | First full end-to-end `--auto` chain across a behavior-preserving architecture milestone; code-review-as-scope-detector validated; HUMAN-UAT CI-deferral pattern reused from v1.17. |

### Cumulative Quality

| Milestone | Tests | svelte-check | Zero-Dep Additions |
|-----------|-------|--------------|--------------------|
| v1.18 | 451 (+15 from v1.17) | 0 / 0 (4592 files) | Yes (no new packages) |

### Top Lessons (Verified Across Milestones)

1. Behavior-preserving milestones ship on the strength of locality + leverage + audited consolidation; do not need user-visible features to qualify as a minor bump.
2. CI-deferral via HUMAN-UAT.md is the durable pattern for environment-bound gates (Playwright, real-iPhone, axe browser sweeps). It surfaces in `/gsd:audit-uat` so the deferral never silently rots.
