<!--
  src/lib/shared/components/InputDrawer.svelte

  Mobile-only inputs drawer for the D-08 hero-fills-viewport shell (Plan 42.1-05).

  Drawer is opened by the <InputsRecap> strip below each calculator's title
  (the pinned collapsed-handle above the bottom nav was retired once the recap
  block took over as the tap target — it sat in the wrong reading position).

  When expanded, the native <dialog> opens as a bottom sheet that covers the
  bottom nav (top-layer showModal() puts it above NavShell). The slide-up
  animation is gated on `prefers-reduced-motion`.

  Desktop (md+) hides the sheet — calculator routes render their inputs
  in a sticky right column instead. The drawer is a mobile-only affordance.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown } from '@lucide/svelte';
	import { vv } from '$lib/shared/visualViewport.svelte.js';

	let {
		title = 'Inputs',
		expanded = $bindable(false),
		onClear,
		children
	}: {
		title?: string;
		expanded?: boolean;
		// Optional per-calculator reset. When provided, a "Clear" text button
		// renders at the left of the header — clicking resets state to defaults
		// and closes the drawer. Omitted on calculators without meaningful reset.
		onClear?: () => void;
		children: Snippet;
	} = $props();

	function handleClear() {
		onClear?.();
		expanded = false;
	}

	let dialog = $state<HTMLDialogElement | null>(null);
	let closeBtn = $state<HTMLButtonElement | null>(null);

	$effect(() => {
		if (!dialog) return;
		if (expanded && !dialog.open) {
			dialog.showModal();
			// Native <dialog>.showModal() runs the HTML focus-fixup-step
			// synchronously and reads the AUTOFOCUS CONTENT ATTRIBUTE on
			// dialog descendants. Svelte 5's `autofocus` directive only
			// sets the IDL property, so the attribute is invisible to
			// dialog focus resolution and the browser falls back to
			// "first focusable child" — which can be a textbox/spinbutton
			// (re-summoning the iOS soft keyboard, the bug we just fixed).
			// We explicitly focus the close button to honor the contract
			// the declarative `autofocus` attribute on the close button
			// represents. Single source of truth in InputDrawer.svelte;
			// no per-calculator divergence.
			closeBtn?.focus();
		}
		if (!expanded && dialog.open) {
			dialog.close();
		}
	});

	let sheet = $state<HTMLDivElement | null>(null);

	// Phase 49 / DRAWER-05..06: visualViewport-aware sheet sizing for iOS standalone PWA.
	// When the soft keyboard is up (iOS only — heuristic in vv.keyboardOpen), inline-bind
	// --ivv-max-height so the sheet shrinks to fit vv.height − 16px. The flex-end aligned
	// dialog naturally places that constrained sheet above the keyboard, so no
	// padding-bottom adjustment is needed (real-iPhone correction post-DRAWER-07: the
	// original max(env(safe-area-inset-bottom), --ivv-bottom) double-counted, producing
	// ~keyboard-height spurious padding inside the sheet).
	// When the keyboard is down, short-circuit to '' so the var(--ivv-max-height, 80dvh)
	// fallback governs — verbatim Phase-48 behavior.
	const ivvStyle = $derived(
		vv.keyboardOpen ? `--ivv-max-height: ${vv.height - 16}px;` : ''
	);

	function handleDialogClick(e: MouseEvent) {
		// Only close on backdrop taps (the empty flex space above the sheet).
		// If the click lands inside the sheet — including inputs, buttons,
		// slider thumbs — leave it alone. Using `contains()` is iOS-safe
		// whereas `e.target === dialog` can miss on WebKit tap-bubble quirks.
		if (!sheet) return;
		if (sheet.contains(e.target as Node)) return;
		expanded = false;
	}

	function handleClose() {
		expanded = false;
	}
</script>

<dialog
	bind:this={dialog}
	class="input-drawer-dialog"
	aria-label={title}
	onclick={handleDialogClick}
	onclose={handleClose}
>
	{#if expanded}
		<div
			bind:this={sheet}
			class="input-drawer-sheet flex flex-col bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
			style={ivvStyle}
		>
			<!-- Header holds two siblings: optional Clear on the left, collapse
			     button on the right. Collapse dominates the row; Clear stays quiet
			     at ui-size secondary text. No nested interactives. -->
			<header class="flex min-h-[56px] items-stretch border-b border-[var(--color-border)]">
				{#if onClear}
					<button
						type="button"
						class="flex items-center px-5 text-ui font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] active:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]"
						aria-label="Clear {title.toLowerCase()}"
						onclick={handleClear}
					>
						Clear
					</button>
				{/if}
				<button
					bind:this={closeBtn}
					type="button"
					autofocus
					class="flex min-h-[56px] flex-1 items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-alt)] active:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]"
					aria-label="Close {title.toLowerCase()}"
					onclick={() => (expanded = false)}
				>
					<span class="text-base font-semibold text-[var(--color-text-primary)]">{title}</span>
					<ChevronDown
						size={20}
						class="shrink-0 text-[var(--color-text-tertiary)]"
						aria-hidden="true"
					/>
				</button>
			</header>
			<div class="flex-1 overflow-y-auto px-4 py-4">
				{@render children()}
			</div>
		</div>
	{/if}
</dialog>

<style>
	/* Bottom-sheet dialog, iOS Safari compatible. Dialog fills the viewport
	   invisibly via 100dvh; the visible sheet sits inside via flex-end. This
	   avoids the top-layer positioning bugs that break `position: fixed;
	   bottom: 0` on iOS (the scrim shows but the sheet collapses to 0 height). */
	.input-drawer-dialog {
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		width: 100vw;
		max-width: 100vw;
		height: 100vh;
		max-height: 100vh;
		height: 100dvh;
		max-height: 100dvh;
		overflow: hidden;
	}
	.input-drawer-dialog[open] {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.input-drawer-sheet {
		width: 100%;
		max-height: 80vh;
		max-height: calc(var(--ivv-max-height, 80dvh));
		overflow: hidden;
		/* Clear the iOS home indicator when overlaying the nav. Keyboard-up
		   case is handled by max-height alone — flex-end alignment in the
		   <dialog> places the constrained sheet above the keyboard. */
		padding-bottom: env(safe-area-inset-bottom, 0px);
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
	}
	.input-drawer-dialog::backdrop {
		background: var(--color-scrim);
	}
	@media (prefers-reduced-motion: no-preference) {
		.input-drawer-dialog[open] .input-drawer-sheet {
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
