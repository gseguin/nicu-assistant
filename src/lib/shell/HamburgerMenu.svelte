<!-- src/lib/shell/HamburgerMenu.svelte -->
<!-- Left-side sliding drawer. <dialog> element gives us focus trap + Esc + scrim for free; -->
<!-- CSS anchors it to the left edge and slides it in. About row lives at the bottom, separated. -->
<script lang="ts">
	import { page } from '$app/state';
	import { Star, X, Info } from '@lucide/svelte';
	import { CALCULATOR_REGISTRY } from './registry.js';
	import { favorites, FAVORITES_MAX } from '$lib/shared/favorites.svelte.js';
	import type { CalculatorId } from '$lib/shared/types.js';

	let {
		triggerEl,
		open = $bindable(false),
		onAbout
	}: {
		triggerEl: HTMLButtonElement | null;
		open?: boolean;
		onAbout?: () => void;
	} = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	const titleId = 'hamburger-title';

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
		if (e.target === dialog) close();
	}

	function handleClose() {
		open = false;
		triggerEl?.focus();
	}

	function handleLinkClick() {
		close();
	}

	function handleStarClick(id: CalculatorId, e: MouseEvent) {
		e.stopPropagation();
		favorites.toggle(id);
	}

	function handleAboutClick() {
		close();
		onAbout?.();
	}
</script>

<dialog
	bind:this={dialog}
	class="hamburger-dialog bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
	aria-labelledby={titleId}
	onclick={handleDialogClick}
	onclose={handleClose}
>
	{#if open}
		<div
			class="flex h-full flex-col"
			style="padding-bottom: env(safe-area-inset-bottom, 0px)"
		>
			<header
				class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4"
			>
				<div class="flex flex-col">
					<h2 id={titleId} class="text-sm font-semibold text-[var(--color-text-primary)]">
						Calculators
					</h2>
					{#if favorites.isFull}
						<span class="text-2xs text-[var(--color-text-secondary)]">
							{FAVORITES_MAX} of {FAVORITES_MAX} favorites. Remove one to add another.
						</span>
					{/if}
				</div>
				<button
					type="button"
					class="icon-btn min-h-[48px] min-w-[48px]"
					aria-label="Close menu"
					onclick={close}
				>
					<X size={20} aria-hidden="true" />
				</button>
			</header>

			<ul class="flex-1 overflow-y-auto py-2">
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
									? `Add ${calc.label} to favorites (limit reached. Remove one to add another.)`
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

			<div class="border-t border-[var(--color-border)]">
				<button
					type="button"
					class="flex min-h-[48px] w-full items-center gap-3 px-5 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]"
					aria-label="About this app"
					onclick={handleAboutClick}
				>
					<Info size={20} aria-hidden="true" />
					<span>About</span>
				</button>
			</div>
		</div>
	{/if}
</dialog>

<style>
	/* Reset default <dialog> centering — we anchor to the left edge as a drawer. */
	.hamburger-dialog {
		margin: 0;
		padding: 0;
		border: 0;
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: auto;
		height: 100vh;
		height: 100dvh;
		max-height: 100vh;
		max-height: 100dvh;
		width: min(20rem, 85vw);
		max-width: min(20rem, 85vw);
		border-top-right-radius: 1rem;
		border-bottom-right-radius: 1rem;
	}
	.hamburger-dialog::backdrop {
		background: var(--color-scrim);
	}
	@media (prefers-reduced-motion: no-preference) {
		.hamburger-dialog[open] {
			animation: slide-in 180ms cubic-bezier(0.22, 1, 0.36, 1);
		}
		.hamburger-dialog[open]::backdrop {
			animation: fade-in 180ms ease;
		}
	}
	@keyframes slide-in {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
