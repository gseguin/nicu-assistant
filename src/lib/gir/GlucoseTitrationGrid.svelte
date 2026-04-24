<script lang="ts">
	import { OctagonAlert } from '@lucide/svelte';
	import type { GirTitrationRow } from './types.js';

	interface Props {
		rows: GirTitrationRow[];
		selectedBucketId: string | null;
		onselect: (bucketId: string) => void;
	}

	let { rows, selectedBucketId, onselect }: Props = $props();

	// Roving tabindex: selected row if present, else first row
	let focusIndex = $derived.by(() => {
		if (selectedBucketId) {
			const idx = rows.findIndex((r) => r.bucketId === selectedBucketId);
			if (idx >= 0) return idx;
		}
		return 0;
	});

	let rowRefs: (HTMLDivElement | null)[] = $state([]);

	// 42.1-04 D-16 (extended): Dock-style scroll magnification removed. The roving-tabindex
	// `selectedBucketId` already drives the active-row UX via aria-checked + ring-inset,
	// so no replacement wiring is needed beyond cleaning up the side effects.

	function formatDelta(delta: number): { glyph: string; abs: string; word: string } {
		if (delta > 0) return { glyph: '▲', abs: delta.toFixed(1), word: '(increase)' };
		if (delta < 0) return { glyph: '▼', abs: Math.abs(delta).toFixed(1), word: '(decrease)' };
		return { glyph: '0', abs: '', word: '(no change)' };
	}

	function srLabelFor(bucketId: string, label: string): string {
		// Avoid screen readers reading "<40" as a tag
		switch (bucketId) {
			case 'severe-neuro':
				return 'severe neurological symptoms';
			case 'lt40':
				return 'less than 40';
			case 'gt70':
				return 'greater than 70';
			default:
				return label;
		}
	}

	function ariaLabelFor(row: GirTitrationRow): string {
		const range = srLabelFor(row.bucketId, row.label);
		if (row.targetGirMgKgMin <= 0) {
			return `Severe neuro signs. Stop dextrose infusion. Current target rate ${row.targetRateMlHr.toFixed(1)} milliliters per hour.`;
		}
		const d = formatDelta(row.deltaRateMlHr);
		if (row.deltaRateMlHr === 0) {
			return `Glucose ${range} mg per deciliter. No change in rate. Target GIR ${row.targetGirMgKgMin.toFixed(1)} milligrams per kilogram per minute, fluids ${row.targetFluidsMlKgDay.toFixed(0)} milliliters per kilogram per day, rate ${row.targetRateMlHr.toFixed(1)} milliliters per hour.`;
		}
		const direction = row.deltaRateMlHr > 0 ? 'increase' : 'decrease';
		return `Glucose ${range} mg per deciliter. ${direction} rate by ${d.abs} milliliters per hour. Target GIR ${row.targetGirMgKgMin.toFixed(1)} milligrams per kilogram per minute, fluids ${row.targetFluidsMlKgDay.toFixed(0)} milliliters per kilogram per day, rate ${row.targetRateMlHr.toFixed(1)} milliliters per hour.`;
	}

	function selectRow(idx: number) {
		if (idx < 0 || idx >= rows.length) return;
		onselect(rows[idx].bucketId);
		// Focus the row after selection
		queueMicrotask(() => rowRefs[idx]?.focus());
	}

	function handleKeydown(e: KeyboardEvent, idx: number) {
		switch (e.key) {
			case 'ArrowDown':
			case 'ArrowRight':
				e.preventDefault();
				selectRow((idx + 1) % rows.length);
				break;
			case 'ArrowUp':
			case 'ArrowLeft':
				e.preventDefault();
				selectRow((idx - 1 + rows.length) % rows.length);
				break;
			case 'Home':
				e.preventDefault();
				selectRow(0);
				break;
			case 'End':
				e.preventDefault();
				selectRow(rows.length - 1);
				break;
			case ' ':
			case 'Enter':
				e.preventDefault();
				onselect(rows[idx].bucketId);
				break;
		}
	}

</script>

<!-- Unified card-stack layout at every width. Post-shape refactor (Task 9),
     the hero above the grid carries the full selected-action statement, so
     the grid's inner row no longer needs to double as a decision display —
     it just needs to read as a tappable card with a clear eyebrow + a short
     action summary beneath. Desktop gets slightly denser vertical padding
     via md: breakpoints, but the visual structure is the same on both. -->
<div
	class="flex flex-col gap-2 md:gap-3"
	role="radiogroup"
	aria-label="Glucose range titration helper"
>
	{#each rows as row, i (row.bucketId)}
		{@const selected = selectedBucketId === row.bucketId}
		{@const stopInfusion = row.targetGirMgKgMin <= 0}
		{@const d = formatDelta(row.deltaRateMlHr)}
		<div
			bind:this={rowRefs[i]}
			role="radio"
			aria-checked={selected}
			aria-label={ariaLabelFor(row)}
			tabindex={i === focusIndex ? 0 : -1}
			class="card min-h-[72px] cursor-pointer px-4 py-3 transition-colors outline-none
             hover:bg-[var(--color-surface-alt)]
             focus-visible:ring-2 focus-visible:ring-[var(--color-identity)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]
             {row.bucketId === 'severe-neuro' && !selected
				? 'bg-[var(--color-surface-alt)]'
				: ''}
             {selected
				? 'bg-[var(--color-identity-hero)] ring-1 ring-inset ring-[var(--color-identity)] hover:bg-[var(--color-identity-hero)]'
				: ''}"
			onclick={() => selectRow(i)}
			onkeydown={(e) => handleKeydown(e, i)}
		>
			<span
				class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
			>
				IF {row.bucketId === 'severe-neuro' ? 'SEVERE NEURO SIGNS' : `GLUCOSE ${row.label} mg/dL`}
			</span>
			{#if stopInfusion}
				<!-- Severe-neuro STOP row carries the error color on the word STOP
				     and the warning icon. Card surface keeps its surface-alt tint
				     so the row's identity affordance (tappable card) remains intact. -->
				<div class="mt-1 flex items-center gap-2">
					<OctagonAlert
						size={18}
						class="shrink-0 text-[var(--color-error)]"
						aria-hidden="true"
					/>
					<span
						class="text-base font-bold tracking-wider text-[var(--color-error)] uppercase"
						>STOP</span
					>
					<span class="text-ui text-[var(--color-text-tertiary)]">dextrose infusion</span>
				</div>
			{:else if row.deltaRateMlHr === 0}
				<div class="mt-1 flex items-baseline gap-2">
					<span class="text-base font-bold text-[var(--color-text-tertiary)]">Hold</span>
					<span class="text-ui text-[var(--color-text-tertiary)]">rate (no change)</span>
				</div>
			{:else}
				<div class="mt-1 flex items-baseline gap-2">
					<span
						class="num text-base font-bold text-[var(--color-text-primary)]"
						aria-hidden="true">{d.glyph}</span
					>
					<span class="num text-base font-bold text-[var(--color-text-primary)]">{d.abs}</span>
					<span class="text-ui text-[var(--color-text-tertiary)]">ml/hr</span>
					<span class="text-ui text-[var(--color-text-tertiary)]">{d.word}</span>
				</div>
			{/if}
		</div>
	{/each}
</div>
