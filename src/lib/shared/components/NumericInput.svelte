<script lang="ts">
	import { slide } from 'svelte/transition';

	// Reduced-motion preference read once at module-load.
	// Matches the pattern used by MorphineWeanCalculator's dock magnification.
	const PREFERS_REDUCED_MOTION =
		typeof window !== 'undefined' && typeof window.matchMedia === 'function'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	let idCounter = 0;

	let {
		value = $bindable(),
		label = '',
		placeholder = '',
		suffix = '',
		error = '',
		min,
		max,
		step = 0.1,
		showRangeHint = true,
		showRangeError = true,
		id = `numeric-input-${++idCounter}`
	} = $props<{
		value: number | null;
		label?: string;
		placeholder?: string;
		suffix?: string;
		error?: string;
		min?: number;
		max?: number;
		step?: number;
		showRangeHint?: boolean;
		showRangeError?: boolean;
		id?: string;
	}>();

	let isFocused = $state(false);
	let hasBlurred = $state(false);

	// Derived out-of-range error: show advisory on blur when value exceeds min/max
	let rangeError = $derived.by(() => {
		if (!showRangeError) return '';
		if (error) return '';
		if (value === null) return '';
		if (!hasBlurred) return '';
		const belowMin = min !== undefined && value < min;
		const aboveMax = max !== undefined && value > max;
		if (belowMin || aboveMax) return 'Outside expected range — verify';
		return '';
	});

	let displayError = $derived(error || rangeError);

	let rangeHint = $derived.by(() => {
		if (!showRangeHint) return '';
		if (displayError) return '';
		if (min === undefined && max === undefined) return '';
		const unit = suffix ? ` ${suffix}` : '';
		if (min !== undefined && max !== undefined) return `${min}–${max}${unit}`;
		if (min !== undefined) return `≥ ${min}${unit}`;
		return `≤ ${max}${unit}`;
	});

	// Handle manual input parsing
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = target.value;

		if (val === '') {
			value = null;
			return;
		}

		const parsed = parseFloat(val);
		if (!isNaN(parsed) && isFinite(parsed)) {
			value = parsed;
		}
	}

	// Enter key blurs to confirm value instead of submitting a form
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
		}
	}

	// Show inline error on blur instead of silently clamping
	function handleBlur(_e: FocusEvent) {
		isFocused = false;
		hasBlurred = true;
	}

	// Svelte action to handle non-passive wheel events
	function setupWheel(node: HTMLInputElement) {
		const onWheel = (e: WheelEvent) => {
			if (!isFocused) return;

			// Must be non-passive to prevent scroll
			e.preventDefault();

			const direction = e.deltaY > 0 ? -1 : 1;
			const lowerBound = min ?? Number.NEGATIVE_INFINITY;
			const upperBound = max ?? Number.POSITIVE_INFINITY;
			const current = value ?? (direction > 0 ? lowerBound - step : upperBound + step);
			const precision = Math.max(0, -Math.floor(Math.log10(step)));
			const next = parseFloat((current + direction * step).toFixed(precision));
			if (!Number.isFinite(next)) return;
			if (next >= lowerBound && next <= upperBound) {
				value = next;
			}
		};

		node.addEventListener('wheel', onWheel, { passive: false });
		return {
			destroy() {
				node.removeEventListener('wheel', onWheel);
			}
		};
	}
</script>

<div class="w-full space-y-1.5">
	{#if label}
		<label for={id} class="ml-1 block text-ui font-semibold text-[var(--color-text-secondary)]">
			{label}
		</label>
	{/if}

	<div class="group relative">
		<input
			{id}
			use:setupWheel
			type="number"
			inputmode="decimal"
			value={value === null ? '' : value}
			oninput={handleInput}
			onfocus={() => (isFocused = true)}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			{placeholder}
			min={min ?? undefined}
			max={max ?? undefined}
			{step}
			class="num w-full rounded-xl border bg-[var(--color-surface-card)] py-3 pl-4 text-base font-medium text-[var(--color-text-primary)] shadow-sm transition-all outline-none {displayError
				? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]'
				: 'border-[var(--color-border)] focus:border-[var(--color-identity)] focus:ring-2 focus:ring-[var(--color-identity)]'} {isFocused
				? 'scale-[1.01] border-[var(--color-identity)]'
				: ''} {suffix.length > 3 ? 'pr-20' : suffix ? 'pr-12' : 'pr-4'}"
			aria-invalid={!!displayError}
			aria-describedby={displayError ? `${id}-error` : suffix ? `${id}-suffix` : undefined}
			aria-label={label || placeholder}
		/>

		{#if suffix}
			<span
				id="{id}-suffix"
				class="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold text-[var(--color-text-secondary)] select-none"
			>
				{suffix}
			</span>
		{/if}
	</div>

	{#if rangeHint}
		<p class="ml-1 text-xs text-[var(--color-text-tertiary)]">
			{rangeHint}
		</p>
	{/if}

	{#if displayError}
		<p
			id="{id}-error"
			class="ml-1 text-xs text-[var(--color-error)]"
			transition:slide={{ duration: PREFERS_REDUCED_MOTION ? 0 : 150 }}
		>
			{displayError}
		</p>
	{/if}
</div>

<style>
	/* Hide standard HTML5 number arrows for cleaner clinical UI */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>
