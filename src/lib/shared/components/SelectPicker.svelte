<script lang="ts">
	import { Select } from 'bits-ui';
	import { Check, ChevronDown } from '@lucide/svelte';
	import { getCalculatorContext } from '../context.js';
	import type { SelectOption } from '../types.js';

	let {
		label,
		value = $bindable(),
		options,
		placeholder = 'Select...',
		class: className = '',
	}: {
		label: string;
		value: string;
		options: SelectOption[];
		placeholder?: string;
		class?: string;
	} = $props();

	// Derive groups from options (empty array = no grouping = flat list)
	const groups = $derived(
		[...new Set(options.map((o) => o.group).filter(Boolean))] as string[]
	);
	const hasGroups = $derived(groups.length > 0);

	const selectedLabel = $derived(
		options.find((o) => o.value === value)?.label ?? placeholder
	);

	// Calculator accent color from Svelte context (D-06)
	const ctx = getCalculatorContext();
	const accentColor = ctx.accentColor;

	// Unique id for aria-labelledby association (a11y: proper label linkage)
	const labelId = `select-${crypto.randomUUID()}`;
</script>

<div class="min-w-0 {className}">
	<div class="flex flex-col gap-1.5">
		<span
			id={labelId}
			class="text-xs font-semibold leading-none tracking-[0.02em] text-[var(--color-text-secondary)] ml-0.5"
		>
			{label}
		</span>

		<Select.Root type="single" bind:value items={options}>
			<Select.Trigger
				class="flex min-h-[3rem] w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-card)] px-3.5 py-2.5 text-left text-[0.9375rem] font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
				aria-labelledby={labelId}
			>
				<span class="flex-1">{selectedLabel}</span>
				<ChevronDown
					class="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]"
					aria-hidden="true"
				/>
			</Select.Trigger>

			<Select.Portal>
				<Select.Content
					class="z-50 rounded-2xl bg-[var(--color-surface-card)] shadow-2xl border-0"
					preventScroll={true}
				>
					<Select.Viewport class="overscroll-contain max-h-[70svh] overflow-y-auto px-2 py-2">
						{#if hasGroups}
							{#each groups as group}
								<Select.Group>
									<Select.GroupHeading
										class="sticky top-0 z-10 bg-[var(--color-surface-card)] px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.18em]"
										style="color: {accentColor}"
									>
										{group}
									</Select.GroupHeading>
									{#each options.filter((o) => o.group === group) as option (option.value)}
										<Select.Item
											value={option.value}
											label={option.label}
											class="flex w-full items-center justify-between rounded-xl px-4 py-3 min-h-[44px] text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)] data-[highlighted]:bg-[var(--color-surface-alt)] data-[selected]:bg-[var(--color-surface-alt)] data-[selected]:font-semibold"
										>
											{#snippet children({ selected })}
												<span>{option.label}</span>
												{#if selected}
													<Check
														class="h-4 w-4 shrink-0"
														style="color: {accentColor}"
														aria-hidden="true"
													/>
												{/if}
											{/snippet}
										</Select.Item>
									{/each}
								</Select.Group>
							{/each}
						{:else}
							{#each options as option (option.value)}
								<Select.Item
									value={option.value}
									label={option.label}
									class="flex w-full items-center justify-between rounded-xl px-4 py-3 min-h-[44px] text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)] data-[highlighted]:bg-[var(--color-surface-alt)] data-[selected]:bg-[var(--color-surface-alt)] data-[selected]:font-semibold"
								>
									{#snippet children({ selected })}
										<span>{option.label}</span>
										{#if selected}
											<Check
												class="h-4 w-4 shrink-0"
												style="color: {accentColor}"
												aria-hidden="true"
											/>
										{/if}
									{/snippet}
								</Select.Item>
							{/each}
						{/if}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	</div>
</div>
