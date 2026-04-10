# Roadmap: NICU Assistant

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-04-01)
- v1.1 Morphine Wean Calculator - Phases 5-6 (shipped 2026-04-02)
- v1.2 UI Polish - Phases 7-8 (shipped 2026-04-07)
- v1.3 Fortification Calculator Refactor - Phases 9-11 (shipped 2026-04-07) — see [milestones/v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md)
- v1.4 UI Polish - Phases 12-17 (shipped 2026-04-07) — see [milestones/v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md)
- [v1.5 Tab Identity & Search](milestones/v1.5-ROADMAP.md) - Phases 18-20 (shipped 2026-04-07)
- [v1.6 Toggle & Harden](milestones/v1.6-ROADMAP.md) - Phases 21-24 (shipped 2026-04-08)
- [v1.7 Formula Micro-Polish](milestones/v1.7-ROADMAP.md) - Phase 25 (shipped 2026-04-08)
- [v1.8 GIR Calculator](milestones/v1.8-ROADMAP.md) - Phases 26-28 (shipped 2026-04-09)
- [v1.9 GIR Titration Hero Swap + Polish](milestones/v1.9-ROADMAP.md) - Phases 29-31 (shipped 2026-04-09)
- [v1.10 GIR Simplification + Dock + Tech Debt](milestones/v1.10-ROADMAP.md) - Phases 32-34 (shipped 2026-04-10)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0-v1.9 (Phases 1-31) — SHIPPED</summary>

See individual milestone archives under `milestones/`.

</details>

<details>
<summary>v1.10 GIR Simplification + Dock + Tech Debt (Phases 32-34) — SHIPPED 2026-04-10</summary>

- [x] **Phase 32: GIR Simplification** — Remove summary hero card, per-card secondary metrics row, reference card; preserve click/tap visual treatment; drop `aria-live` (GIR-SIMP-06 dropped mid-flight) (1/1 plan)
- [x] **Phase 33: GIR Dock Magnification** — Port morphine-wean dock magnification to `GlucoseTitrationGrid` mobile branch; mobile + reduced-motion guards; MutationObserver (1/1 plan)
- [x] **Phase 34: Tech Debt Majors + Release v1.10** — `@types/node` 22→25, `typescript` 5→6 (zero source edits); `package.json` → 1.10.0; PROJECT.md Validated list with retired strikethroughs (1/1 plan)

See [milestones/v1.10-ROADMAP.md](milestones/v1.10-ROADMAP.md) for full phase details.

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-25 | v1.0-v1.7 | — | Complete | 2026-04-08 |
| 26-28 | v1.8 | 9/9 | Complete | 2026-04-09 |
| 29-31 | v1.9 | 4/4 | Complete | 2026-04-09 |
| 32-34 | v1.10 | 3/3 | Complete | 2026-04-10 |
