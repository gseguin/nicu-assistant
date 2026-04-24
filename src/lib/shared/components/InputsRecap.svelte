<!--
  src/lib/shared/components/InputsRecap.svelte

  A neutral metadata strip that sits below the calculator title and above the hero.
  Restates what's currently loaded in the drawer so a clinician reads
  "what I fed it" before "what it says" — matches clinical reading order.

  Mobile: rendered as a <button> that opens the InputDrawer (onOpen callback).
  Desktop: rendered as a passive <div> group — inputs are already visible in
  the sticky right column, a drawer trigger is meaningless there.

  Visual treatment is intentionally quiet (no identity hue, no shadow, tonal
  lift via --color-surface not surface-card) so the hero below owns the color
  moment. Per DESIGN.md Identity-Inside Rule, identity belongs on the hero.
-->
<script lang="ts">
	import { MoreVertical } from '@lucide/svelte';
	import { formatLastEdited, isStale } from '$lib/shared/lastEdited.svelte.js';

	export type RecapItem = {
		label: string;
		value: string | null;
		unit?: string;
		// Opt-in: render this item on its own row, full-width. Weight uses this
		// across every calculator — it's the patient anchor and reads first.
		fullRow?: boolean;
	};

	let {
		items,
		onOpen,
		expanded = false,
		ariaControls,
		lastEditedAt = null
	}: {
		items: RecapItem[];
		onOpen: () => void;
		expanded?: boolean;
		ariaControls?: string;
		// Epoch ms of the last input edit. When non-null AND stale (>4h),
		// a warning caption renders below the item list. Fresh edits show
		// nothing — the UI stays quiet unless it has something to say.
		lastEditedAt?: number | null;
	} = $props();

	const PLACEHOLDER = '·';

	// Re-read current time reactively so the stale flag flips on its own as
	// the page sits open. Refresh every minute — precise enough for "Xh ago".
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => {
			now = Date.now();
		}, 60_000);
		return () => clearInterval(id);
	});

	const staleLabel = $derived.by(() => {
		if (!isStale(lastEditedAt, now)) return null;
		const rel = formatLastEdited(lastEditedAt, now);
		return rel === null ? null : `Edited ${rel}. Verify values.`;
	});

	const fullRowItems = $derived(items.filter((it) => it.fullRow));
	const pairedItems = $derived(items.filter((it) => !it.fullRow));

	// Chunk paired items into rows of 2 so the divider can render BETWEEN the
	// pair (inside a flex row) rather than trailing the left item as a sibling
	// — trailing siblings wrap independently and orphan the divider.
	const pairedRows = $derived.by<RecapItem[][]>(() => {
		const rows: RecapItem[][] = [];
		for (let i = 0; i < pairedItems.length; i += 2) {
			rows.push(pairedItems.slice(i, i + 2));
		}
		return rows;
	});

	const composedAriaLabel = $derived.by(() => {
		const parts = items.map((it) => {
			const v = it.value ?? PLACEHOLDER;
			return it.unit ? `${it.label} ${v} ${it.unit}` : `${it.label} ${v}`;
		});
		return `${parts.join(', ')}. Tap to edit inputs.`;
	});
</script>

{#snippet itemBody(item: RecapItem)}
	<div class="flex min-w-0 flex-col justify-center gap-0.5" title={item.value ?? ''}>
		<dt
			class="truncate text-2xs font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
		>
			{item.label}
		</dt>
		<dd class="flex min-w-0 flex-wrap items-baseline gap-x-1 leading-tight">
			<!-- Clinical values must read in full. Value and unit each stay
			     whitespace-nowrap (so "0.04" doesn't break and "mg/kg" stays
			     intact), but the pair can wrap at the space between them if
			     the column is still too narrow. -->
			<span
				class="num text-ui font-medium whitespace-nowrap {item.value === null
					? 'text-[var(--color-text-tertiary)]'
					: 'text-[var(--color-text-primary)]'}"
			>
				{item.value ?? PLACEHOLDER}
			</span>
			{#if item.unit && item.value !== null}
				<span class="text-ui font-normal whitespace-nowrap text-[var(--color-text-tertiary)]">
					{item.unit}
				</span>
			{/if}
		</dd>
	</div>
{/snippet}

{#snippet itemList()}
	<!-- Layout contract:
	       - fullRow items (e.g. Weight) each claim their own row, full-width.
	       - remaining items group 2-per-row with a vertical divider between
	         them. Each pair is its own flex row container so the divider
	         always sits between siblings that share the row. -->
	<div class="flex min-w-0 flex-1 flex-col gap-y-3">
		<dl class="flex min-w-0 flex-col gap-y-3">
			{#each fullRowItems as item}
				{@render itemBody(item)}
			{/each}

			{#each pairedRows as row}
				<div class="flex min-w-0 items-stretch gap-x-4">
					{#each row as item, j}
						{#if j > 0}
							<div
								class="w-px self-stretch bg-[var(--color-border)]"
								aria-hidden="true"
							></div>
						{/if}
						<div class="min-w-0 flex-1">
							{@render itemBody(item)}
						</div>
					{/each}
				</div>
			{/each}
		</dl>

		{#if staleLabel}
			<!-- Stale-value warning: appears only when the last edit is >4h old.
			     Renders a quiet secondary line, identity-tinted on the left edge
			     via a 1px top border (not a side stripe) to signal "caution,
			     not error" — red is reserved for calculation errors. -->
			<p
				class="border-t border-[var(--color-border)] pt-2 text-ui font-medium text-[var(--color-text-tertiary)]"
				aria-live="polite"
			>
				{staleLabel}
			</p>
		{/if}
	</div>
{/snippet}

<!-- Mobile: tappable button, opens the drawer -->
<button
	type="button"
	class="inputs-recap flex w-full items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-alt)] active:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-identity)] md:hidden"
	aria-label={composedAriaLabel}
	aria-haspopup="dialog"
	aria-expanded={expanded}
	aria-controls={ariaControls}
	onclick={onOpen}
>
	{@render itemList()}
	<MoreVertical
		size={18}
		class="shrink-0 self-center text-[var(--color-text-tertiary)]"
		aria-hidden="true"
	/>
</button>

<!-- Desktop (md+) hides the recap entirely: inputs are already visible in the
     sticky right column, so the recap would duplicate information without
     adding a drawer affordance that doesn't exist on desktop. The mobile
     <button> variant above is the only InputsRecap render path that ever
     reaches the DOM on wide viewports (where it's hidden via md:hidden). -->

<style>
	.inputs-recap {
		min-height: 52px;
	}
</style>
