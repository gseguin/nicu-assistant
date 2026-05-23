# Phase 52: Code Purge + Test Suite Repair - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 52-Code Purge + Test Suite Repair
**Areas discussed:** Plan structure / atomicity, Test surgery in shared specs, Historical-comment policy, Verification / grep-gate enforcement

---

## Plan structure / atomicity

### Q1: Should Phase 52 ship as a single atomic plan or split into ordered plans?

| Option | Description | Selected |
|--------|-------------|----------|
| Three plans: deletes → integration → tests | 52-01 file deletes + registry, 52-02 source integration, 52-03 test surgery. Matches v1.16 calculator-store refactor pattern. | ✓ |
| Two plans: source purge + test surgery | 52-01 deletes + integration in one, 52-02 test repair. Allows mid-phase red. | |
| Single mega-plan | All 14 reqs in one atomic commit. Hard to review, no checkpoint. | |
| You decide based on Phase 52 specifics | Let me pick after scanning blast radius. | |

**User's choice:** Three plans (Recommended)
**Notes:** Aligns with proven v1.16 pattern; each plan reviewable in isolation; cleaner bisect.

### Q2: Should each plan's commit leave the test suite green?

| Option | Description | Selected |
|--------|-------------|----------|
| Each plan green (52-01 includes registry edit) | Tests pass at every commit boundary; clean bisect. | ✓ |
| Mid-phase red allowed | Simpler 52-01 but breaks `pnpm test` between commits. | |
| Hybrid: 52-01+52-02 paired, 52-03 pure test cleanup | Treat first two as logical pair. | |

**User's choice:** Each plan green (Recommended)
**Notes:** Registry edit lands with deletes to prevent mid-phase red.

### Q3: Should e2e/pert*.spec.ts be deleted in 52-01 or 52-03?

| Option | Description | Selected |
|--------|-------------|----------|
| Delete e2e specs in 52-01 alongside source | 1:1 source-test deletion; prevents red Playwright between commits. | ✓ |
| Hold for 52-03 with rest of test surgery | Clean "all test changes in one plan" grouping but fails Playwright on 52-01. | |
| Skip via Playwright .skip() in 52-01, delete in 52-03 | Two-step churn without value. | |

**User's choice:** Delete in 52-01 (Recommended)

### Q4: What goes into 52-02 vs 52-03?

| Option | Description | Selected |
|--------|-------------|----------|
| 52-02 = source-side edits; 52-03 = test-file edits | Clean split by file role. | ✓ |
| 52-02 = all non-test + favorites.test.ts; 52-03 = remaining test edits | Group source+test couplings together. | |
| Merge into 2-plan structure | Drop back to 2 plans. | |

**User's choice:** Source-side vs test-file split (Recommended)

---

## Test surgery in shared specs

### Q1: What's the right editing posture for cross-cutting test files?

| Option | Description | Selected |
|--------|-------------|----------|
| Remove PERT-specific assertions/data; keep test shape intact | Surgical edits, tests still cover 5 remaining calculators. | ✓ |
| Refactor to data-driven from CALCULATOR_REGISTRY | Future-proof but scope creep beyond "remove PERT". | |
| Delete broken assertions entirely | Smaller diff but loses coverage. | |

**User's choice:** Surgical removal (Recommended)

### Q2: How to handle favoritesStore upgrade safety?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep filter as-is; add regression test | Existing logic handles unknown IDs; just add verification. | ✓ |
| Add explicit one-shot migration code | Heavier-handed, dead code risk. | |
| Just update default array; trust the filter | Minimal but no regression coverage. | |

**User's choice:** Keep filter + regression test (Recommended)

### Q3: Should we keep test names referencing 'PERT' anywhere?

| Option | Description | Selected |
|--------|-------------|----------|
| Scrub all 'PERT' strings from active test files | Post-52-03 grep returns only intentional historical comments. | ✓ |
| Allow 'PERT' in self-documenting test names | Self-documenting but non-zero grep hit. | |
| Hybrid: scrub describe/it names, allow in literals | Pragmatic middle ground. | |

**User's choice:** Scrub all (Recommended)

### Q4: How to square the favorites regression test with the scrub rule?

| Option | Description | Selected |
|--------|-------------|----------|
| Use generic 'unknown-calculator-id' literal | Feature-agnostic test, cleanest grep result. | ✓ |
| Keep 'pert' as the test literal | Self-documenting but pollutes grep. | |
| Both: generic test + historical comment | Combines areas #2 and #3. | |

**User's choice:** Generic literal (Recommended)

---

## Historical-comment policy

### Q1: How to handle historical comments in source code?

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite generically (drop 'PERT' reference) | Intent preserved, name removed; clean grep. | ✓ |
| Keep verbatim 'PERT' reference | Honors SC #3 literally but adds grep noise. | |
| Rewrite + add CHANGELOG/migration note | Best of both; clean code + auditable history. | |
| Delete the comment entirely if cruft | Case-by-case during execution. | |

**User's choice:** Rewrite generically (Recommended)

### Q2: How should commit messages reference PERT?

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit PERT references in commits | Git log is canonical removal record. | ✓ |
| Neutral language ('narrow calculator registry') | Forward-looking but harder to find via git archaeology. | |
| PERT in 52-01 only | One canonical headline commit. | |

**User's choice:** Explicit references throughout (Recommended)

### Q3: Should .planning/ artifacts be edited too?

| Option | Description | Selected |
|--------|-------------|----------|
| .planning/ is historical record — leave intact | Planning docs describe what was *done*; immutable. | ✓ |
| Scrub PERT from .planning/ too | Maximalist; breaks meaning of historical artifacts. | |
| Archive v1.17 planning docs to isolate references | Existing convention but Phase 54, not 52. | |

**User's choice:** Leave .planning/ intact (Recommended)

### Q4: How should user-visible documentation describe the change?

| Option | Description | Selected |
|--------|-------------|----------|
| Both: technical + clinical rationale | Two-sentence CHANGELOG note. | ✓ |
| Technical only ('Removed PERT calculator (out of clinical scope)') | Terse, factual. | |
| Clinical only ('narrowed scope to neonatal') | Forward-looking but unhelpful for existing PERT users. | |
| Defer to Phase 54 (release) | Out of Phase 52 scope. | |

**User's choice:** Both technical + clinical (Recommended) — but DEFERRED to Phase 53/54 per scope clarification

---

## Verification / grep-gate enforcement

### Q1: How should the grep gate be enforced?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual verification in 52-VERIFICATION.md | One-time scripted check; catches at code-review thereafter. | ✓ |
| CI check (`pnpm verify:no-pert`) | Permanent guardrail but maintenance burden. | |
| Pre-commit hook | Catches at commit time but adds friction. | |
| Skip grep gate; trust file-by-file checklist | Belt-and-suspenders argument; redundant. | |

**User's choice:** Manual verification (Recommended)

### Q2: What's the right grep command pattern?

| Option | Description | Selected |
|--------|-------------|----------|
| Word-boundary grep: `git grep -niwE 'pert\|PERT'` | No exclude list needed; matches whole words. | ✓ |
| Substring grep with exclude list | Catches partial matches but brittle. | |
| Two-pass: word grep + case-sensitive PERT separately | Verifies both casings independently. | |

**User's choice:** Word-boundary grep (Recommended)

### Q3: What should 52-VERIFICATION.md attest?

| Option | Description | Selected |
|--------|-------------|----------|
| Tests + grep + build + svelte-check + bundle delta | Full attestation including expected bundle shrinkage. | ✓ |
| Minimal: tests pass + grep clean | Only the two explicit SCs. | |
| Add manual smoke (navigate, confirm 5 tabs, no /pert) | Belt-and-suspenders; catches what tests don't. | |
| All of the above | Maximum confidence. | |

**User's choice:** Tests + grep + build + check + bundle (Recommended)

### Q4: How to handle the 32 pre-existing Playwright failures?

| Option | Description | Selected |
|--------|-------------|----------|
| Baseline + ignore in Phase 52 verification | Verify "did not INCREASE from baseline"; pre-existing red owned by Phase 47 follow-up. | ✓ |
| Treat as blockers | Strict; scope creep but cleaner state. | |
| Carve out: verify only PERT-touched tests | Narrower scope; ignores everything else. | |

**User's choice:** Baseline + ignore (Recommended)

---

## Claude's Discretion

- **D-07** (specifically: replace 5th-tab assertion in desktop-full-nav.spec.ts vs delete it): implementer chooses at execution time based on cleanest test intent.
- **D-03** (favoritesStore default array edit): verify against current codebase whether 'pert' is in defaults; edit only if present.

## Deferred Ideas

- User-facing docs (CHANGELOG/README/About PERT removal narrative) → Phase 53 (DOC)
- v1.17 planning artifact archival → Phase 54 (REL)
- Version bump 1.16.1 → 1.17.0 → Phase 54 (REL)
- CI grep guardrail (`pnpm verify:no-pert`) — rejected as over-engineering
- Pre-commit hook blocking 'pert' substrings — rejected as friction without value
- Data-driven test refactor (registry-derived expected calculators) — possible future improvement
- 32 pre-existing Playwright failures (28 axe dlitem + 2 disclaimer-banner + 2 calc UI) → Phase 47 follow-up backlog
