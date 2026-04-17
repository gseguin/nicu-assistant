<script lang="ts">
	import { onMount } from 'svelte';
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
	let gridContainer: HTMLElement | undefined = $state();

	// Dock-style magnification: scroll-driven scaling of mobile bucket cards.
	// Cloned verbatim from MorphineWeanCalculator.svelte (Phase 5) — extraction to
	// $lib/shared was considered and rejected in Phase 33 planning: only 2 call sites,
	// both small, extraction would be premature abstraction. If a 3rd call site lands,
	// extract then. See .planning/phases/33-gir-dock-magnification/33-01-PLAN.md.
	// Guards: mobile-only (window.innerWidth < 768) AND !prefers-reduced-motion.
	onMount(() => {
		if (!gridContainer) return;

		const prefersReducedMotion =
			typeof window.matchMedia === 'function'
				? window.matchMedia('(prefers-reduced-motion: reduce)').matches
				: false;
		const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

		// Dock-style magnification: continuous floating index driven by scroll progress.
		// Maps total scroll position to a floating index (0.0 → n-1) so the magnification
		// slides smoothly through cards in the scroll direction, like the macOS Dock.
		const MAX_SCALE = 1.06;
		const MAX_SHADOW_BOOST = 4;

		let rafId: number | null = null;

		function updateMagnification() {
			const cards = gridContainer?.querySelectorAll<HTMLElement>('[data-bucket-index]');
			if (!cards?.length) return;

			if (prefersReducedMotion || !isMobile()) {
				cards.forEach((card) => {
					card.style.transform = '';
					card.style.boxShadow = '';
					card.style.zIndex = '';
				});
				return;
			}

			const n = cards.length;
			const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
			// Map scroll position to a continuous floating index across all cards
			// scrollY=0 → index 0, scrollY=max → index n-1
			const scrollProgress = scrollMax > 0 ? window.scrollY / scrollMax : 0;
			const floatingIdx = scrollProgress * (n - 1);

			cards.forEach((card, i) => {
				// Continuous distance from the floating index
				const dist = Math.abs(i - floatingIdx);
				// 0 → full (1.06), 1 → medium (1.03), 2 → slight, 3+ → none
				// Use radius of 2.5 so 3 cards are always visibly magnified
				const t = Math.max(0, 1 - dist / 2.5);
				const scale = 1 + (MAX_SCALE - 1) * t;
				const shadowBoost = MAX_SHADOW_BOOST * t;

				card.style.transform = `scale(${scale})`;
				card.style.boxShadow =
					shadowBoost > 0.5
						? `0 ${1 + shadowBoost}px ${4 + shadowBoost * 2}px rgba(0,0,0,${0.04 + 0.06 * t})`
						: '';
				card.style.zIndex = t > 0.3 ? '1' : '';
			});
		}

		function onScroll() {
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				updateMagnification();
				rafId = null;
			});
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		// Initial pass
		updateMagnification();

		// Re-run when cards change (severe-neuro gating, row-set updates)
		const mutObserver = new MutationObserver(() => updateMagnification());
		mutObserver.observe(gridContainer, { childList: true, subtree: true });

		return () => {
			window.removeEventListener('scroll', onScroll);
			if (rafId !== null) cancelAnimationFrame(rafId);
			mutObserver.disconnect();
		};
	});

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

	function labelWithUnit(row: GirTitrationRow): string {
		if (row.bucketId === 'severe-neuro') return row.label;
		return `${row.label} mg/dL`;
	}
</script>

<!-- Mobile: vertical card stack (<480px) -->
<div
	bind:this={gridContainer}
	class="flex flex-col gap-3 sm:hidden"
	role="radiogroup"
	aria-label="Glucose range titration helper"
>
	{#each rows as row, i (row.bucketId)}
		{@const selected = selectedBucketId === row.bucketId}
		{@const stopInfusion = row.targetGirMgKgMin <= 0}
		{@const d = formatDelta(row.deltaRateMlHr)}
		<div
			bind:this={rowRefs[i]}
			data-bucket-index={i}
			role="radio"
			aria-checked={selected}
			aria-label={ariaLabelFor(row)}
			tabindex={i === focusIndex ? 0 : -1}
			class="card min-h-[88px] cursor-pointer px-4 py-4 transition-colors transition-transform outline-none
             focus-visible:ring-2 focus-visible:ring-[var(--color-identity)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]
             {row.bucketId === 'severe-neuro' && !selected
				? 'border-l-2 border-l-[var(--color-text-tertiary)]'
				: ''}
             {selected
				? 'border-l-4 border-l-[var(--color-identity)] bg-[var(--color-identity-hero)]'
				: ''}"
			onclick={() => selectRow(i)}
			onkeydown={(e) => handleKeydown(e, i)}
		>
			<span class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase">
				IF {row.bucketId === 'severe-neuro' ? 'SEVERE NEURO SIGNS' : `GLUCOSE ${row.label} mg/dL`}
			</span>
			{#if stopInfusion}
				<div class="mt-1 flex items-baseline gap-2">
					<span
						class="text-display font-black tracking-wider text-[var(--color-text-primary)] uppercase"
						>STOP</span
					>
					<span class="text-ui text-[var(--color-text-tertiary)]">dextrose infusion</span>
				</div>
			{:else if row.deltaRateMlHr === 0}
				<div class="mt-1 flex items-baseline gap-2">
					<span
						class="num text-display font-black text-[var(--color-text-tertiary)]"
						aria-hidden="true">—</span
					>
				</div>
			{:else}
				<div class="mt-1 flex items-baseline gap-2">
					<span
						class="num text-display font-black text-[var(--color-text-primary)]"
						aria-hidden="true">{d.glyph}</span
					>
					<span class="num text-display font-black text-[var(--color-text-primary)]">{d.abs}</span>
					<span class="text-ui text-[var(--color-text-tertiary)]">ml/hr</span>
					<span class="text-ui text-[var(--color-text-tertiary)]">{d.word}</span>
				</div>
			{/if}
		</div>
	{/each}
</div>

<!-- Desktop: table grid (≥480px) -->
<div
	class="hidden grid-cols-[minmax(140px,1.4fr)_1fr] gap-x-3 gap-y-1 sm:grid"
	role="radiogroup"
	aria-label="Glucose range titration helper"
>
	<!-- Header row (non-interactive) -->
	<div class="px-3 py-2 text-ui font-semibold text-[var(--color-text-secondary)]">Range</div>
	<div class="px-3 py-2 text-ui font-semibold text-[var(--color-text-secondary)]">Δ rate</div>

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
			class="col-span-full grid min-h-[48px] cursor-pointer grid-cols-subgrid items-center rounded-lg px-3 py-2 transition-colors outline-none
             focus-visible:ring-2 focus-visible:ring-[var(--color-identity)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]
             {row.bucketId === 'severe-neuro' && !selected
				? 'border-l-2 border-l-[var(--color-text-tertiary)]'
				: ''}
             {selected
				? 'border-l-4 border-l-[var(--color-identity)] bg-[var(--color-identity-hero)]'
				: ''}"
			onclick={() => selectRow(i)}
			onkeydown={(e) => handleKeydown(e, i)}
		>
			<div class="text-base text-[var(--color-text-primary)]">{labelWithUnit(row)}</div>
			{#if stopInfusion}
				<div
					class="col-span-1 text-base font-semibold tracking-wider text-[var(--color-text-primary)] uppercase"
				>
					STOP <span
						class="font-normal tracking-normal text-[var(--color-text-tertiary)] normal-case"
						>dextrose infusion</span
					>
				</div>
			{:else if row.deltaRateMlHr === 0}
				<div
					class="num text-base font-semibold text-[var(--color-text-tertiary)]"
					aria-hidden="true"
				>
					—
				</div>
			{:else}
				<div class="num text-base font-semibold text-[var(--color-text-primary)]">
					<span aria-hidden="true">{d.glyph}</span>
					{d.abs} ml/hr <span class="text-[var(--color-text-secondary)]">{d.word}</span>
				</div>
			{/if}
		</div>
	{/each}
</div>
