# Phase 18: Searchable SelectPicker — Research

**Researched:** 2026-04-07
**Domain:** Svelte 5 shared component extension (a11y combobox inside native `<dialog>`)
**Confidence:** HIGH (all findings verified against actual source files in repo)

## Summary

Phase 18 adds an opt-in `searchable` prop to `src/lib/shared/components/SelectPicker.svelte`. Only one consumer turns it on — the Formula picker in `FortificationCalculator.svelte:166`. Morphine does not use `SelectPicker` at all (verified — zero matches in `src/lib/morphine/`), so "Morphine pickers unchanged" is automatically satisfied at the code level; the risk is regressing the shared component's existing behavior, not Morphine-specific wiring.

The pert-calculator reference implementation (`/mnt/data/src/pert-calculator/src/lib/components/SelectPicker.svelte`) already ships a working searchable mode. It is a good blueprint for behavior (search state, keyboard traversal, Enter-to-select-single) but it is NOT a drop-in port because:

1. Pert has no grouped-options mode; ours does, and the Formula picker uses `group: manufacturer` for all 30 formulas.
2. Pert's option shape uses `detail`; ours uses `group`. SEARCH-01 says "filter by label + detail/manufacturer" — in our codebase that means `label + group`.
3. Pert uses Tailwind custom classes (`text-primary`, `bg-surface-card`, `border-border-subtle`) and an inline rgba backdrop; ours uses CSS custom properties (`var(--color-text-primary)`, `var(--color-surface-card)`, `var(--color-scrim)`) and Lucide icons (`@lucide/svelte`).
4. Pert uses `role="combobox"` on the trigger with `aria-controls`; ours uses `aria-haspopup="dialog"`. The combobox pattern is more correct for searchable mode but changing it unconditionally will break tests T-02, T-04, T-11 and change the accessibility tree for the non-searchable Morphine-free path. Keep `aria-haspopup="dialog"` when `searchable=false`; switch to `aria-haspopup="listbox"` + `aria-controls={listboxId}` only when `searchable=true`.

**Primary recommendation:** Add `searchable` as an opt-in prop that layers new behavior on top of existing code without touching the grouped/flat rendering branches or current attribute contract when `searchable=false`. Filter the options array in a `$derived`, and when a query is active render a single flat list (bypass groups) — this sidesteps the "what happens to empty groups while filtering" question entirely.

## User Constraints

No CONTEXT.md exists for this phase yet. Constraints come from REQUIREMENTS.md (SEARCH-01..06, A11Y-03) and CLAUDE.md (SvelteKit 2 + Svelte 5 runes, Tailwind 4, WCAG 2.1 AA, 48px targets, tests co-located).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEARCH-01 | Case-insensitive substring filter across label + detail | Filter in `$derived filteredOptions`. Our `SelectOption` has no `detail` field — filter `label + group` (manufacturer). See Gotcha #1. |
| SEARCH-02 | "No matches" empty state | Render `<p role="status">No matches</p>` inside listbox container when `filteredOptions.length === 0`. `role="status"` gives a polite live-region announcement (see A11y #3). |
| SEARCH-03 | ArrowDown from input → first; ArrowUp from first option → input | Add `handleSearchKeydown` (ArrowDown → `focusOption(0)`); extend `handleListboxKeydown` ArrowUp branch: if `focusedIndex <= 0 && searchable`, focus `searchInput` and set `focusedIndex = -1`. |
| SEARCH-04 | Enter in input selects when exactly one match | In `handleSearchKeydown`: `if (key==='Enter' && filteredOptions.length === 1) select(filteredOptions[0].value)`. |
| SEARCH-05 | `searchable` opt-in; non-Formula consumers unchanged | Default `searchable=false`. All current call sites in `FortificationCalculator.svelte:153,166,170,174` omit the prop → unchanged. Only line 166 adds `searchable`. |
| SEARCH-06 | Query resets on reopen; focus lands on search input | In `openPicker()` set `searchQuery = ''` before `showModal()`; after `tick()`, if `searchable` focus `searchInput` instead of `focusOption()`. Also reset in `handleClose()` for belt-and-suspenders. |
| A11Y-03 | Keyboard traversal + Enter-single-match covered by test | Extend `src/lib/shared/components/SelectPicker.test.ts` with 4–5 new cases. E2E not required — jsdom polyfill already supports `showModal` (`src/test-setup.ts:13`). |

## Standard Stack

No new runtime dependencies. Everything needed is already installed:

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| svelte | ^5.55.0 | `$state`, `$derived`, `$props`, `$bindable` runes | package.json (existing) |
| @lucide/svelte | already used | `Check`, `ChevronDown`, optionally `Search` icon in search input | SelectPicker.svelte:3 |
| @testing-library/svelte | existing | `render`, `fireEvent` | SelectPicker.test.ts:2 |
| vitest | ^4.1.2 | test runner with jsdom | package.json |

The jsdom HTMLDialogElement polyfill in `src/test-setup.ts` already handles `showModal`, `close`, and the `close` event dispatch — no new test infra needed.

## Architecture Patterns

### Current SelectPicker.svelte structure (line map)

| Lines | Section | Change for Phase 18 |
|-------|---------|---------------------|
| 1–6 | Imports | Add `Search` icon if desired (optional) |
| 7–19 | `$props()` destructure | Add `searchable?: boolean = false` |
| 21–27 | IDs, context | Add `searchInputId = \`select-${uid}-search\`` (optional, for aria wiring) |
| 29–32 | State | Add `searchInput = $state<HTMLInputElement \| null>(null)`, `listboxEl = $state<HTMLDivElement \| null>(null)`, `searchQuery = $state('')` |
| 34–41 | Derived | Add `filteredOptions = $derived(...)`, override `hasGroups`/`groups` to be suppressed when a query is active (see below) |
| 47–55 | `openPicker()` | Reset `searchQuery = ''`; after `tick()`, focus `searchInput` when `searchable`, else existing `focusOption()` path |
| 61–67 | `focusOption(i)` | Re-scope DOM query to `listboxEl` for reliability when search input steals focus; current `dialog.querySelector` still works but binding `listboxEl` is cleaner |
| 74–92 | `handleListboxKeydown` | ArrowUp branch: if `focusedIndex <= 0 && searchable`, focus search input + set `focusedIndex = -1`. Clamp Home/End/ArrowDown to `filteredOptions.length - 1` when filtering |
| (new) | `handleSearchKeydown` | ArrowDown, Escape, Enter-single-match |
| 98–102 | `handleClose` | Also reset `searchQuery = ''` |
| 132–138 | `<dialog>` | No structural change |
| 144–151 | `<header>` | Keep; add conditional `<div>` with `<input>` after header when `searchable` |
| 153–160 | listbox container | `bind:this={listboxEl}`. Keep as-is for structure |
| 161–217 | Grouped vs flat rendering | **Suppress grouped mode when `searchQuery.trim() !== ''`** — render flat filtered list instead. This avoids "group heading with zero children" rendering edge case and matches pert's flat-filter behavior |
| 217 (after flat each) | Empty state | `{#if searchable && filteredOptions.length === 0}<p role="status">No matches</p>{/if}` |

### Recommended derived-state shape

```svelte
let searchQuery = $state('');
const normalizedQuery = $derived(searchQuery.trim().toLowerCase());
const isSearching = $derived(searchable && normalizedQuery.length > 0);
const filteredOptions = $derived(
  isSearching
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(normalizedQuery) ||
          (o.group?.toLowerCase().includes(normalizedQuery) ?? false)
      )
    : options
);
// Only show grouped layout when NOT actively searching
const showGrouped = $derived(hasGroups && !isSearching);
```

Then the template becomes `{#if showGrouped} ...existing grouped branch (iterates `options`)... {:else} ...flat branch iterates `filteredOptions`... {/if}`.

### Trigger ARIA — conditional combobox

```svelte
<button
  ...
  aria-haspopup={searchable ? 'listbox' : 'dialog'}
  aria-controls={searchable ? listboxId : undefined}
  role={searchable ? 'combobox' : undefined}
  ...
>
```

This preserves exact attribute parity with today's Morphine-free non-searchable usage (tests T-02, T-04, T-11 continue to pass) and elevates the Formula picker to the WAI-ARIA 1.2 combobox pattern when searching.

## How the Pert Reference Differs

| Concern | Pert reference | Our component | Recommendation |
|---------|----------------|---------------|----------------|
| Option shape | `{value, label, detail?}` | `{value, label, group?}` | Keep our shape; filter on `label + group` |
| Grouped rendering | None | `hasGroups` / `groups` branches | Keep ours; bypass groups while searching |
| Trigger role | `role="combobox"` always | `aria-haspopup="dialog"` always | Make role conditional on `searchable` |
| aria-controls | Always set to listboxId | Not set | Set only when `searchable` |
| Backdrop | Inline `rgba(15,23,42,0.65)` | `var(--color-scrim)` | Keep ours — theme-aware |
| Icons | Inline SVG paths | `@lucide/svelte` (`Check`, `ChevronDown`) | Keep ours |
| Accent colour | Tailwind `accent` class | `style="color: {accentColor}"` from context | Keep ours |
| Close handling | `onMount` + `addEventListener('close', …)` | `onclose={handleClose}` attribute | Keep ours — cleaner |
| Label/ariaLabel props | Separate `label` + `ariaLabel` | `label` only | Don't add `ariaLabel` — out of scope |
| Search input styling | `text-placeholder` Tailwind class | N/A (new) | Use `text-[var(--color-text-primary)]` + `placeholder:text-[var(--color-text-tertiary)]` to match our token system |
| Search input height | `py-3` inline | (new) | Min-height 48px to honor CLAUDE.md touch target rule. Use `min-h-12` on the wrapper or the input itself |

**Patterns to port verbatim:** `handleSearchKeydown` structure (ArrowDown/Escape/Enter-single), `openPicker` reset-then-focus-input ordering, ArrowUp-returns-to-input branch in listbox handler, "No matches" empty state.

**Patterns to adapt:** role/aria wiring (conditional), filter predicate (use `group` not `detail`), flat-bypass for grouped mode.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy search / typo tolerance | Hand-rolled Levenshtein | **Nothing — out of scope (REQUIREMENTS.md line 37: "Future")** | Requirement SEARCH-01 explicitly says "case-insensitive substring match" |
| Focus trap inside dialog | Hand-rolled focus-trap | Native `<dialog>.showModal()` | Already used — browsers implement trap + ESC-to-close natively. The polyfill in `src/test-setup.ts` mirrors this for jsdom |
| Search debouncing | setTimeout / lodash.debounce | Nothing — filter is synchronous over ≤30 items | 30 formulas × substring is sub-millisecond. Debounce adds latency and test complexity |
| Screen reader live region | Aria-live polyfill library | `role="status"` on the "No matches" node | Native polite live region, supported everywhere |

## Runtime State Inventory

This is a code-only change with no stored state, no OS registrations, no build artifacts, no secrets. All categories: None.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — `searchQuery` is ephemeral component state; no persistence | — |
| Live service config | None — PWA only, no backend | — |
| OS-registered state | None | — |
| Secrets/env vars | None | — |
| Build artifacts | None — Vite rebuild handles it | — |

## Common Pitfalls

### Pitfall 1: Grouped rendering with filtered options
**What goes wrong:** If you keep the grouped branch active while filtering, empty groups will render a sticky heading with zero options under it — or worse, a group heading with an unrelated group's options because the inner `{#each options as option, idx}` still iterates the full array with `option.group === group` guard.
**Why it happens:** The current template iterates `options` twice (outer by group, inner by item) and guards the item with `option.group === group`. A filter wouldn't flow through cleanly without restructuring.
**How to avoid:** Make `showGrouped = hasGroups && !isSearching`. When searching, render the flat filtered list.
**Warning signs:** Visible empty group heading, or options appearing under the wrong heading.

### Pitfall 2: `focusedIndex` out of sync with `filteredOptions.length`
**What goes wrong:** After filtering from 30 → 2 options, `focusedIndex` may still be `5`, and pressing ArrowDown/End silently focuses nothing.
**How to avoid:** On each `searchQuery` change, reset `focusedIndex = -1` (focus belongs to the input while typing). An `$effect(() => { searchQuery; focusedIndex = -1; })` handles it, OR clamp inside handlers: `Math.min(focusedIndex + 1, filteredOptions.length - 1)` and `Math.max(0, Math.min(focusedIndex, filteredOptions.length - 1))`.
**Warning signs:** Keyboard seems "stuck" after typing.

### Pitfall 3: Enter-to-select fires on 0 or 2+ matches
**What goes wrong:** User hits Enter with 0 matches, browser submits enclosing form. Or user hits Enter with 2 matches expecting "select first one" and we silently do nothing, which is confusing.
**How to avoid:** Always `e.preventDefault()` Enter in the search input regardless of match count; only `select()` when length is exactly 1. Match the spec literally (SEARCH-04).
**Warning signs:** Form submissions, or surprising selection behavior.

### Pitfall 4: Query persists across reopens
**What goes wrong:** User searches "sim", picks nothing, reopens — query still reads "sim".
**How to avoid:** Reset in `openPicker()` AND in `handleClose()`. SEARCH-06 is explicit about this.
**Warning signs:** Tests T-01/T-11 suddenly see filtered option counts.

### Pitfall 5: `aria-labelledby` on trigger breaking under combobox role
**What goes wrong:** Current `aria-labelledby={labelId}` (line 118) + switching to `role="combobox"` double-announces. Combobox with `aria-labelledby` is valid but some SRs also read the accessible value. Not a blocker, but worth verifying.
**How to avoid:** Keep `aria-labelledby` — it names the combobox. Do NOT add `aria-label`.
**Warning signs:** Double-announce in NVDA/VoiceOver smoke test.

### Pitfall 6: Search input inside native dialog and iOS keyboard
**What goes wrong:** On iOS, focusing an input inside a `<dialog>` that's pinned to bottom via the mobile CSS branch (lines 235–242) can cause the keyboard to cover the list.
**How to avoid:** Defer — not in Phase 18 scope. Document as known risk. Reasonable mitigation: `max-h-[50svh]` when `searchable` on mobile, but wait for real user feedback.
**Warning signs:** Clinician complaint during testing on iPhone.

## A11y Deep-Dive (combobox inside dialog)

1. **Focus trap:** Native `<dialog>.showModal()` traps focus across all major browsers. No library needed. Escape-to-close is native.

2. **aria-activedescendant vs roving tabindex:** Our current component uses **roving tabindex** (`tabindex={idx === focusedIndex ? 0 : -1}` on options, plus `.focus()` call). Keep that — it works with the polyfill, existing tests assert `document.activeElement.getAttribute('data-index')`, and switching to `aria-activedescendant` would force focus to stay on the search input and require all existing focus-assertion tests to be rewritten. Pert reference also uses roving tabindex.

3. **"No matches" announcement:** Use `role="status"` (implicit `aria-live="polite"`, `aria-atomic="true"`). It will announce when the node appears. Do not use `aria-live="assertive"` — interrupting while the user is still typing is hostile.

4. **Filtered result count announcement (nice-to-have, not required by spec):** An additional off-screen `<div role="status" class="sr-only">{filteredOptions.length} results</div>` would announce "N results" as the user types. **Not required by SEARCH-01..06.** Document as potential enhancement; do not add in Phase 18 unless the planner opts in explicitly — it adds one more live region to reason about.

5. **Combobox pattern reference:** https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ — the dialog+listbox variant matches our approach (search input + listbox inside dialog, trigger is the combobox).

6. **Touch target:** Search input wrapper must be `min-h-12` (48px) per CLAUDE.md. The input text itself doesn't need 48px as long as the clickable wrapper is ≥48px.

## Code Example — proposed searchable block

```svelte
{#if searchable}
  <div class="border-b border-[var(--color-border)] px-4 py-3">
    <input
      bind:this={searchInput}
      type="text"
      class="w-full min-h-12 bg-transparent text-sm font-medium text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
      placeholder="Search..."
      aria-label="Filter {label}"
      bind:value={searchQuery}
      onkeydown={handleSearchKeydown}
    />
  </div>
{/if}
```

And inside the listbox, after the flat `{#each}`:

```svelte
{#if searchable && filteredOptions.length === 0}
  <p role="status" class="px-4 py-3 text-sm text-[var(--color-text-tertiary)]">
    No matches
  </p>
{/if}
```

## Testing Strategy

### Existing tests that MUST still pass unchanged

`src/lib/shared/components/SelectPicker.test.ts` — all 11 tests (T-01..T-11). None of them pass `searchable`, so the default path must be byte-identical in behavior:
- T-02 asserts `aria-labelledby` on trigger — unchanged (we always set it).
- T-04 asserts `aria-expanded=true` post-open — unchanged.
- T-05, T-06 assert roving tabindex via `document.activeElement.getAttribute('data-index')` — unchanged because focus still lands on an option when `searchable=false`.
- T-07 asserts refocus trigger on select — `handleClose` still runs.
- T-08, T-09 assert grouped rendering — unchanged because `isSearching=false` when `searchable=false`.

Also `src/lib/fortification/FortificationCalculator.test.ts` — the `UI-04` test (line 139) counts 4 select triggers; this is unchanged because we don't add/remove triggers. Worth re-running after the change.

### New tests to add (co-located in `SelectPicker.test.ts`)

Recommended additions — 6 cases covering SEARCH-01..06 + A11Y-03:

| ID | Assertion | Why |
|----|-----------|-----|
| T-12 | `searchable=true` renders a text input with role=textbox inside the dialog after open | SEARCH-05 inverse + SEARCH-06 focus target exists |
| T-13 | Typing in the search input filters visible options by label AND by group (use grouped options with group="Abbott"; type "abb" → only Abbott items remain) | SEARCH-01 |
| T-14 | Typing a query that matches nothing shows a "No matches" element with `role="status"` | SEARCH-02 |
| T-15 | ArrowDown in the search input moves focus to first option; ArrowUp from first option returns focus to the search input | SEARCH-03 + A11Y-03 |
| T-16 | With exactly one filtered match, Enter in the search input selects it and closes the dialog (assert trigger text updated + aria-expanded=false) | SEARCH-04 + A11Y-03 |
| T-17 | Close-and-reopen: set a query, close via ESC (or programmatic close), reopen — query is empty and focus lands on the search input | SEARCH-06 |
| T-18 (optional) | `searchable` omitted → no textbox rendered inside dialog after open | SEARCH-05 — asserts default is off |

**Vitest details:** Focus assertions use `document.activeElement` after `await tick()`. The existing dialog polyfill in `src/test-setup.ts:13` handles `showModal()` — the fireEvent patterns from T-05/T-06 translate directly. The jsdom polyfill does NOT close on ESC automatically; to exercise the close-and-reopen case, call `dialog.close()` programmatically or dispatch the close event. Use the `closePicker()` call indirectly by clicking an option (like T-07).

**Searchable test fixture:** Add a new fixture `searchableOptions` with `group` manufacturer strings:
```ts
const searchableOptions = [
  { value: 'sim-adv', label: 'Similac Advance', group: 'Abbott' },
  { value: 'sim-neo', label: 'Similac NeoSure', group: 'Abbott' },
  { value: 'enfa-ar', label: 'Enfamil AR', group: 'Mead Johnson' },
];
```

### E2E (Playwright) — is it required?

**No.** A11Y-03 says "component test OR E2E test." Component tests cover both SEARCH-03 (ArrowDown/ArrowUp traversal) and SEARCH-04 (Enter-single-match) exhaustively. Playwright would add value only if we wanted real-browser focus-trap verification — out of scope for this phase. Recommendation: skip E2E in Phase 18, keep the phase tight.

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Morphine picker regression | **None** — Morphine doesn't use SelectPicker (verified: zero matches in `src/lib/morphine/`) | — | Run existing MorphineWeanCalculator tests anyway as smoke |
| FortificationCalculator existing tests break | Low | Medium | Re-run `FortificationCalculator.test.ts` including UI-04 trigger-count test after change |
| Existing SelectPicker tests (T-01..T-11) break via ARIA changes | Medium IF we unconditionally change trigger role to combobox | High | Make `role="combobox"` conditional on `searchable` |
| Grouped rendering regression for Formula picker (non-searching state) | Low | High | Keep `showGrouped` path identical when `isSearching=false` |
| `focusedIndex` desync with filtered list | Medium | Medium | Reset `focusedIndex` when query changes; clamp in handlers |
| jsdom polyfill missing methods for new input interactions | Low | Low | `src/test-setup.ts` already covers `showModal/close`; inputs are standard jsdom — no new polyfill needed |
| `$derived` re-running filter on every keystroke causing visible lag | Very low | Low | 30 options × substring ≈ microseconds. No debouncing needed |

## Files Modified / Created

### Modified (2 files)
- `src/lib/shared/components/SelectPicker.svelte` — add prop, state, `handleSearchKeydown`, searchable template block, flat-filter branch, updated `openPicker`/`handleClose`, conditional trigger ARIA
- `src/lib/fortification/FortificationCalculator.svelte:166` — add `searchable` prop to the Formula picker call site (and only that one; Base/Target Calorie/Unit stay unchanged)

### Possibly touched (1 file) — re-run, do not edit unless failing
- `src/lib/fortification/FortificationCalculator.test.ts` — UI-04 trigger count should still be 4; only update if assertions about picker internals break

### Created (0 new files)
- New tests are added in-place in `src/lib/shared/components/SelectPicker.test.ts` (existing file, per project convention of co-location — see user memory `feedback_test_colocation.md`)

### Unchanged (verified)
- `src/lib/morphine/MorphineWeanCalculator.svelte` — does not import or use SelectPicker
- `src/lib/shared/types.ts` — `SelectOption` interface keeps `{value, label, group?}`; we do NOT add `detail` field (out of scope, no consumer needs it)

## Project Constraints (from CLAUDE.md)

- **SvelteKit 2 + Svelte 5 runes only.** Use `$state`, `$derived`, `$props`, `$bindable`. No legacy reactivity (`$:`, stores) for this new code.
- **Tailwind CSS 4** via `@tailwindcss/vite`. Use our CSS custom properties (`var(--color-*)`) — do NOT adopt pert's `text-primary`/`bg-surface-card` class names.
- **WCAG 2.1 AA, 48px touch targets.** Search input wrapper `min-h-12`.
- **Tests co-located.** Add to existing `SelectPicker.test.ts`, not a new `__tests__/` directory.
- **Accessibility always-visible labels.** The search input has `placeholder="Search..."` AND `aria-label="Filter {label}"` so assistive tech gets a real label (placeholders aren't labels).
- **No GSD bypass.** All edits must go through `/gsd:execute-phase`.

## Assumptions Log

All claims in this document are VERIFIED against files in `/mnt/data/src/nicu-assistant` or `/mnt/data/src/pert-calculator` in this session, except:

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 30 formulas in the Formula picker | Summary / Don't Hand-Roll | Low — verified via `fortification-config.json` has 30 formula entries. Substring-filter is fast even at 10× |
| A2 | `role="status"` announces "No matches" politely in NVDA/VO | A11y #3 | Low — standard ARIA, widely supported. Worst case: silent announcement, not incorrect |
| A3 | Native `<dialog>` focus trap works in all target browsers | A11y #1 | Low — supported in all evergreen browsers; current codebase already depends on this |
| A4 | Combobox + listbox inside dialog is a valid WAI-ARIA pattern | A11y #5 | Low — documented in APG, matches pert reference |

## Open Questions (RESOLVED)

1. **Should we also add filtered-count announcement?** — RESOLVED: No. Not required by SEARCH-01..06. Out of scope for Phase 18.
2. **Should `SelectOption` gain a `detail` field?** — RESOLVED: No. Manufacturer already lives in `group` in our schema; filter on `label + group`. Do NOT add a `detail` field in Phase 18.
3. **Should the `Search` icon from Lucide appear inside the search input?** — RESOLVED: No. Cosmetic, adds visual noise, not required. Out of scope for Phase 18.

## Validation Architecture

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 + @testing-library/svelte |
| Config file | `vite.config.ts` (Vitest config inline) |
| Test setup | `src/test-setup.ts` (HTMLDialogElement polyfill already present) |
| Quick run command | `pnpm vitest run src/lib/shared/components/SelectPicker.test.ts` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Command | Exists? |
|-----|----------|-----------|---------|---------|
| SEARCH-01 | label + group substring filter | unit | T-13 in SelectPicker.test.ts | ❌ Wave 0 |
| SEARCH-02 | "No matches" empty state | unit | T-14 | ❌ Wave 0 |
| SEARCH-03 | Arrow traversal input↔list | unit | T-15 | ❌ Wave 0 |
| SEARCH-04 | Enter selects single match | unit | T-16 | ❌ Wave 0 |
| SEARCH-05 | searchable opt-in | unit | T-18 (+ existing T-01..T-11 as regression) | ❌ Wave 0 (new) / ✅ (existing) |
| SEARCH-06 | reset on reopen, focus input | unit | T-12 + T-17 | ❌ Wave 0 |
| A11Y-03 | keyboard traversal + Enter-single | unit | T-15 + T-16 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/lib/shared/components/SelectPicker.test.ts src/lib/fortification/FortificationCalculator.test.ts`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full `pnpm vitest run` + `pnpm lint` green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Extend `src/lib/shared/components/SelectPicker.test.ts` with searchable fixture + T-12..T-18
- [ ] Manual smoke: open Formula picker in dev, type "abb", verify filter, Arrow traverse, Enter-single, reopen clears

Nothing else is missing — test infrastructure and dialog polyfill already exist.

## Sources

### Primary (HIGH)
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/SelectPicker.svelte` (current implementation, all line numbers)
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/SelectPicker.test.ts` (existing test patterns)
- `/mnt/data/src/nicu-assistant/src/lib/fortification/FortificationCalculator.svelte` (consumer, line 166 target)
- `/mnt/data/src/nicu-assistant/src/lib/fortification/fortification-config.json` (30 formulas confirmed)
- `/mnt/data/src/nicu-assistant/src/lib/shared/types.ts` (`SelectOption` shape: value/label/group)
- `/mnt/data/src/nicu-assistant/src/test-setup.ts` (dialog polyfill)
- `/mnt/data/src/nicu-assistant/.planning/REQUIREMENTS.md` (SEARCH-01..06, A11Y-03)
- `/mnt/data/src/pert-calculator/src/lib/components/SelectPicker.svelte` (reference searchable impl)
- Morphine dir grep: zero SelectPicker references (verified)

### Secondary (MEDIUM)
- WAI-ARIA APG Combobox pattern: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ (cited, not re-fetched this session)

## Metadata

**Confidence breakdown:**
- Line-level diff plan: HIGH — read actual current file
- Pert diff analysis: HIGH — both files read side-by-side
- A11y recommendations: HIGH for pattern choice, MEDIUM for SR behavior specifics (not tested live this session)
- Test strategy: HIGH — existing polyfill and test patterns verified
- Morphine non-regression: HIGH — grep confirms no usage

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (30 days — stable component, no external deps)
