<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { X } from '@lucide/svelte';
	import { aboutContent } from '$lib/shared/about-content.js';
	import type { CalculatorId } from '$lib/shared/types.js';

	let {
		calculatorId,
		open = $bindable(false)
	}: {
		calculatorId: CalculatorId;
		open: boolean;
	} = $props();

	let content = $derived(aboutContent[calculatorId]);

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
	}

	function handleCloseAutoFocus(e: Event) {
		e.preventDefault();
		// bits-ui handles focus restoration automatically; preventDefault stops default behavior
		// so focus returns to whatever element was focused before the sheet opened
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" />
		<Dialog.Content
			onCloseAutoFocus={handleCloseAutoFocus}
			class="fixed right-0 bottom-0 left-0
             z-50 flex max-h-[85svh] flex-col overflow-hidden
             rounded-t-2xl bg-[var(--color-surface-card)] shadow-2xl sm:top-0 sm:right-0
             sm:bottom-auto sm:left-auto sm:h-full
             sm:w-[min(28rem,100vw)] sm:rounded-none sm:rounded-l-2xl"
			aria-labelledby="about-title"
		>
			<div class="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
				<div>
					<Dialog.Title id="about-title" class="text-lg font-bold text-[var(--color-text-primary)]">
						{content.title}
					</Dialog.Title>
					<span class="text-2xs font-medium text-[var(--color-text-tertiary)]"
						>{content.version}</span
					>
				</div>
				<Dialog.Close
					class="flex h-10 w-10 items-center justify-center rounded-xl
                 bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]
                 transition-colors hover:bg-[var(--color-border)]"
					aria-label="Close"
				>
					<X class="h-5 w-5" aria-hidden="true" />
				</Dialog.Close>
			</div>

			<div
				class="flex-1 space-y-4 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
			>
				<p class="text-base leading-relaxed text-[var(--color-text-secondary)]">
					{content.description}
				</p>
				<ul class="space-y-2">
					{#each content.notes as note}
						<li class="flex gap-2 text-sm text-[var(--color-text-secondary)]">
							<span class="mt-0.5 font-bold text-[var(--color-accent)]" aria-hidden="true"
								>&#8226;</span
							>
							<span>{note}</span>
						</li>
					{/each}
				</ul>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
