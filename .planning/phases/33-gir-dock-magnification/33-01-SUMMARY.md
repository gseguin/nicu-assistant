---
phase: 33-gir-dock-magnification
plan: 01
completed: 2026-04-10
status: complete
requirements_completed:
  - GIR-DOCK-01
  - GIR-DOCK-02
  - GIR-DOCK-03
  - GIR-DOCK-04
key_files:
  modified:
    - src/lib/gir/GlucoseTitrationGrid.svelte
one_liner: Inline clone of morphine dock magnification onto GIR mobile bucket list with mobile + reduced-motion guards, MutationObserver, and full cleanup
---

# 33-01 — GIR Dock Magnification

## Scope

Port morphine-wean's scroll-driven dock magnification to the now-thinner GIR bucket grid (post Phase 32). Mobile branch only. Inline clone, not extraction (premature abstraction at 2 call sites).

## Execution

Two atomic feat commits. Final task was a `human-verify` checkpoint that paused for user approval after orchestrator ran axe + e2e + build gates.

### Commits

- `0f36f81` feat(33-01): add `data-bucket-index` + `gridContainer` ref on GIR mobile branch
- `c561e0e` feat(33-01): port morphine dock magnification to GIR mobile bucket list

### Implementation notes

- **Inline clone, not extracted.** Only 2 call sites (morphine + GIR); extraction would be premature abstraction. Header comment marks the clone source for the next person who sees the duplication.
- **Drop `activeStepIndex` tracking** from morphine's pattern — GIR selection is parent-driven via `selectedBucketId`, not scroll-driven.
- **`data-bucket-index={i}`** on each mobile card wrapper (mirrors morphine's `data-step-index`) — decouples magnification queries from class names.
- **Mobile guard:** `window.innerWidth < 768` AND `!prefers-reduced-motion`. Desktop and reduced-motion users see flat cards. The guard branch explicitly wipes leftover `transform`/`boxShadow`/`zIndex` on resize-to-desktop so users dragging a window across the breakpoint don't see stale styles.
- **`MutationObserver({childList:true,subtree:true})`** on grid container refreshes magnification when the row set changes (defensive — buckets are static today, but matches morphine's pattern).
- **Cleanup teardown** (copied byte-for-byte from morphine):
  - `window.removeEventListener('scroll', onScroll)`
  - `cancelAnimationFrame(rafId)`
  - `mutObserver.disconnect()`
- **`transition-transform`** added alongside existing `transition-colors` so scale animates smoothly and selection color change still animates.
- **Click/tap selection coexists with inline transform** — selection class (`border-l-4` + `--color-identity-hero` fill) is on the same wrapper element that receives the inline `transform: scale()`. No flicker, no double-paint.
- **Desktop branch untouched** — only the `sm:hidden` mobile branch wraps cards with the magnification logic.

## Verification gates

| Gate | Result |
|------|--------|
| svelte-check | **0 errors / 0 warnings** ✓ |
| vitest | **203/203** ✓ |
| Playwright axe | **16/16** ✓ (GIR-6 + Fortification-4 + Morphine-6, light + dark) |
| Playwright e2e (full) | **48 passed / 3 skipped / 0 failed** ✓ |
| `pnpm build` | ✓ (PWA v1.2.0, 35 precache entries, 325.23 KiB) |
| Human visual sanity | ✓ approved by user |

## Requirements traceability

| REQ-ID | Evidence |
|--------|----------|
| GIR-DOCK-01 | `GlucoseTitrationGrid.svelte` `onMount` block ports morphine pattern: floating index `scrollY/scrollMax*(n-1)`, `MAX_SCALE=1.06`, `MAX_SHADOW_BOOST=4`, radius 2.5, rAF-throttled scroll handler, cleanup on unmount |
| GIR-DOCK-02 | Mobile guard: `window.innerWidth < 768` && `!prefers-reduced-motion`. Else branch wipes `transform`/`boxShadow`/`zIndex` |
| GIR-DOCK-03 | `MutationObserver({childList:true,subtree:true})` on `gridContainer` re-runs `updateMagnification()` |
| GIR-DOCK-04 | 16/16 axe sweeps re-run post-implementation in both themes — all green |

## Notes

- No new runtime deps
- No tests added beyond what svelte-check + axe sweeps cover (visual transform behavior is hard to assert in jsdom; mobile sanity verified manually as per checkpoint)
- Phase 32's slimmer cards (GirCalculator 166 lines, GlucoseTitrationGrid 177 lines) make the magnification visually pop more — confirmed in mobile sanity check
