<!--
  src/lib/shared/components/InputDrawer.svelte

  Mobile-only inputs drawer for the D-08 hero-fills-viewport shell (Plan 42.1-05).

  Composition:
    - A fixed handle button pinned ABOVE the bottom nav (respects env(safe-area-inset-bottom)
      + Plan 1's `pb-[calc(theme(spacing.16)+env(safe-area-inset-bottom,0px)+1rem)]` clearance).
    - A native <dialog> that opens as a bottom sheet (~80dvh) when expanded.

  Why native <dialog>: focus trap + Esc + scrim are free, identical to HamburgerMenu's drawer
  pattern. The slide-up animation is gated on `prefers-reduced-motion`.

  Desktop (md+) hides both the handle and the sheet — calculator routes render their inputs
  in a sticky right column instead. The drawer is a mobile-only affordance.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronUp, ChevronDown } from '@lucide/svelte';

	let {
		summary,
		title = 'Inputs',
		expanded = $bindable(false),
		children
	}: {
		summary: string;
		title?: string;
		expanded?: boolean;
		children: Snippet;
	} = $props();

	let dialog = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!dialog) return;
		if (expanded && !dialog.open) {
			dialog.showModal();
		}
		if (!expanded && dialog.open) {
			dialog.close();
		}
	});

	function handleDialogClick(e: MouseEvent) {
		if (e.target === dialog) {
			expanded = false;
		}
	}

	function handleClose() {
		expanded = false;
	}
</script>

<!-- Collapsed handle: pinned above the mobile bottom nav (md:hidden so desktop has its own layout). -->
<button
	type="button"
	class="fixed right-0 left-0 z-20 flex min-h-14 items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-card)]/95 px-4 py-2 text-ui font-medium text-[var(--color-text-primary)] shadow-md backdrop-blur transition-colors hover:bg-[var(--color-surface-card)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)] md:hidden"
	style="bottom: calc(env(safe-area-inset-bottom, 0px) + 4rem);"
	aria-label="Open inputs drawer"
	aria-expanded={expanded}
	onclick={() => (expanded = true)}
>
	<span class="flex min-w-0 flex-1 items-center gap-2">
		<span class="text-2xs font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
			>Inputs</span
		>
		<span class="truncate text-[var(--color-text-primary)]">{summary}</span>
	</span>
	<ChevronUp size={20} aria-hidden="true" />
</button>

<dialog
	bind:this={dialog}
	class="input-drawer-dialog bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
	aria-label={title}
	onclick={handleDialogClick}
	onclose={handleClose}
>
	{#if expanded}
		<div class="flex h-full flex-col" style="padding-bottom: env(safe-area-inset-bottom, 0px);">
			<header
				class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4"
			>
				<h2 class="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
				<button
					type="button"
					class="icon-btn min-h-[48px] min-w-[48px]"
					aria-label="Close inputs drawer"
					onclick={() => (expanded = false)}
				>
					<ChevronDown size={20} aria-hidden="true" />
				</button>
			</header>
			<div class="flex-1 overflow-y-auto px-4 py-4">
				{@render children()}
			</div>
		</div>
	{/if}
</dialog>

<style>
	/* Reset default <dialog> centering — anchor as a bottom sheet. */
	.input-drawer-dialog {
		margin: 0;
		padding: 0;
		border: 0;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		top: auto;
		width: 100%;
		max-width: 100%;
		height: 80vh;
		height: 80dvh;
		max-height: 80vh;
		max-height: 80dvh;
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
	}
	.input-drawer-dialog::backdrop {
		background: var(--color-scrim);
	}
	@media (prefers-reduced-motion: no-preference) {
		.input-drawer-dialog[open] {
			animation: slide-up 200ms cubic-bezier(0.22, 1, 0.36, 1);
		}
		.input-drawer-dialog[open]::backdrop {
			animation: fade-in 200ms ease;
		}
	}
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
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
