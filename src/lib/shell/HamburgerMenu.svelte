<!-- src/lib/shell/HamburgerMenu.svelte -->
<!-- Source pattern: SelectPicker.svelte lines 32–153, 182–303 -->
<!-- Phase 40 Plan 02 — native <dialog>-based hamburger menu -->
<script lang="ts">
	import { page } from '$app/state';
	import { Star, X } from '@lucide/svelte';
	import { CALCULATOR_REGISTRY } from './registry.js';
	import { favorites, FAVORITES_MAX } from '$lib/shared/favorites.svelte.js';
	import type { CalculatorId } from '$lib/shared/types.js';

	let {
		triggerEl,
		open = $bindable(false)
	}: {
		triggerEl: HTMLButtonElement | null;
		open?: boolean;
	} = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let closeBtn = $state<HTMLButtonElement | null>(null);
	const titleId = 'hamburger-title';

	// Reactive open gate: calling showModal() on an already-open <dialog>
	// throws InvalidStateError, hence the !dialog.open guard.
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
		}
	});

	function close() {
		dialog?.close();
	}

	function handleDialogClick(e: MouseEvent) {
		// Scrim click: only the dialog element itself (backdrop) has target === dialog;
		// clicks on children bubble with target === child.
		if (e.target === dialog) close();
	}

	function handleClose() {
		// Fires on BOTH programmatic close() AND native Esc.
		// Focus restoration lives here so T-03 (close button) and T-04 (programmatic) both pass.
		open = false;
		triggerEl?.focus(); // NAV-HAM-04
	}

	function handleLinkClick() {
		close(); // D-03: nav link closes the menu
	}

	function handleStarClick(id: CalculatorId, e: MouseEvent) {
		e.stopPropagation();
		favorites.toggle(id);
		// Intentionally does NOT close — D-03: star does not close the menu
	}
</script>

<dialog
	bind:this={dialog}
	class="hamburger-dialog rounded-2xl bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
	aria-labelledby={titleId}
	onclick={handleDialogClick}
	onclose={handleClose}
>
	{#if open}
		<div class="flex flex-col" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
			<header
				class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4"
			>
				<div class="flex flex-col">
					<h2 id={titleId} class="text-sm font-semibold text-[var(--color-text-primary)]">
						Calculators
					</h2>
					{#if favorites.isFull}
						<span class="text-2xs text-[var(--color-text-secondary)]">
							{FAVORITES_MAX} of {FAVORITES_MAX} favorites — remove one to add another.
						</span>
					{/if}
				</div>
				<button
					bind:this={closeBtn}
					type="button"
					class="icon-btn min-h-[48px] min-w-[48px]"
					aria-label="Close menu"
					onclick={close}
				>
					<X size={20} aria-hidden="true" />
				</button>
			</header>

			<ul class="py-2">
				{#each CALCULATOR_REGISTRY as calc (calc.id)}
					{@const isFavorite = favorites.has(calc.id as CalculatorId)}
					{@const capBlocked = !isFavorite && favorites.isFull}
					<li class="flex items-center gap-2 px-4 {calc.identityClass}">
						<a
							href={calc.href}
							aria-current={page.url.pathname.startsWith(calc.href) ? 'page' : undefined}
							class="flex min-h-[48px] flex-1 items-center gap-3 rounded-lg px-3 text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]"
							onclick={handleLinkClick}
						>
							<calc.icon size={20} aria-hidden="true" />
							<span>{calc.label}</span>
						</a>
						<button
							type="button"
							class="flex h-12 w-12 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-identity)] {capBlocked
								? 'cursor-not-allowed opacity-60'
								: ''}"
							aria-pressed={isFavorite}
							aria-label={isFavorite
								? `Remove ${calc.label} from favorites`
								: capBlocked
									? `Add ${calc.label} to favorites (limit reached — remove one to add another)`
									: `Add ${calc.label} to favorites`}
							disabled={capBlocked}
							aria-disabled={capBlocked ? 'true' : undefined}
							onclick={(e) => handleStarClick(calc.id as CalculatorId, e)}
						>
							<Star
								size={20}
								fill={isFavorite ? 'currentColor' : 'none'}
								style="color: {isFavorite
									? 'var(--color-identity)'
									: 'var(--color-text-secondary)'}"
								aria-hidden="true"
							/>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</dialog>

<style>
	.hamburger-dialog {
		margin: auto;
		width: min(28rem, 100vw);
		max-width: 28rem;
		border: 0;
		padding: 0;
	}
	.hamburger-dialog::backdrop {
		background: var(--color-scrim);
	}
	@media (max-width: 640px) {
		.hamburger-dialog {
			margin: auto auto 0 auto;
			width: 100vw;
			max-width: 100vw;
			border-radius: 1rem 1rem 0 0;
		}
	}
</style>
