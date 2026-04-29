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

	// Body-scroll lock while the drawer is open. iOS auto-scrolls the page to
	// bring focused inputs into view, which moves vv.offsetTop and breaks the
	// dialog's bottom-anchor geometry (computing distance from layout-bottom
	// to keyboard-top relies on a stable scroll position). Locking with
	// position: fixed + top: -scrollY preserves the visual scroll position
	// so closing the drawer doesn't jump the page back to top.
	$effect(() => {
		if (typeof document === 'undefined') return;
		if (!expanded) return;
		const scrollY = window.scrollY;
		const body = document.body;
		const prev = {
			position: body.style.position,
			top: body.style.top,
			width: body.style.width,
			overflow: body.style.overflow
		};
		body.style.position = 'fixed';
		body.style.top = `-${scrollY}px`;
		body.style.width = '100%';
		body.style.overflow = 'hidden';
		return () => {
			body.style.position = prev.position;
			body.style.top = prev.top;
			body.style.width = prev.width;
			body.style.overflow = prev.overflow;
			window.scrollTo(0, scrollY);
		};
	});

	let sheet = $state<HTMLDivElement | null>(null);

	// Phase 49 / DRAWER-05..06: visualViewport-aware sizing for iOS standalone PWA.
	// Final design (post-real-iPhone iteration): pure CSS, no JS measurement.
	// - Dialog uses CSS `height: 100dvh; max-height: 100dvh` — iOS Safari sizes
	//   100dvh to track the visible region when the keyboard appears.
	// - Sheet has CSS `max-height: 80dvh` (keyboard-down baseline) with a
	//   keyboard-up override `.input-drawer-dialog[data-keyboard-open]
	//   .input-drawer-sheet { max-height: 100% }` so the sheet fills the
	//   reduced-100dvh dialog when the keyboard is up.
	// - Body scroll is locked while the drawer is open so iOS doesn't
	//   auto-scroll to bring focused inputs into view (which would shift
	//   vv.offsetTop and break geometry).
	// - data-keyboard-open is the only signal needed; no inline style on the
	//   dialog. Preserves PITFALLS.md P-15 (no transform leakage) trivially.

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
	data-keyboard-open={vv.keyboardOpen ? '' : undefined}
	onclick={handleDialogClick}
	onclose={handleClose}
>
	{#if expanded}
		<div
			bind:this={sheet}
			class="input-drawer-sheet flex flex-col bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
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
			<!-- onfocusin scrolls the newly focused input into view inside the
			     overflow-y-auto container. iOS' keyboard accessory-bar prev/next
			     advances focus correctly, but its native scrollIntoView traverses
			     the page scroller, not the drawer's internal overflow scroller —
			     so an off-screen next-input gets focus without being made
			     visible, and the user perceives the chain as stuck. Calling
			     scrollIntoView({ block: 'nearest' }) on focusin guarantees the
			     focused element is visible inside this container. -->
			<div
				class="drawer-scroll flex-1 overflow-y-auto px-4 py-4"
				onfocusin={(e) => {
					const t = e.target as HTMLElement | null;
					t?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
				}}
			>
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
	/* Keyboard-up: dialog is positioned + sized to match visualViewport
	   exactly (top: vv.offsetTop, height: vv.height inline). The sheet
	   is flex-end aligned within that and content-sized; the inputs
	   container scrolls if content exceeds the dialog. The sheet's
	   80dvh cap doesn't apply because dialog height is already capped
	   to vv.height which is < 80dvh in practice. */
	.input-drawer-dialog[data-keyboard-open] .input-drawer-sheet {
		max-height: 100%;
	}
	.input-drawer-dialog[open] {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.input-drawer-sheet {
		width: 100%;
		max-height: 80vh;
		max-height: 80dvh;
		overflow: hidden;
		/* Clear the iOS home indicator when overlaying the nav. Keyboard-up
		   sizing is handled by inline style on the outer <dialog> (which
		   resizes to match visualViewport when vv.keyboardOpen), not on
		   the sheet — see dialogStyle in the script block. */
		padding-bottom: env(safe-area-inset-bottom, 0px);
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
	}

	/* scroll-margin gives focused inputs breathing room inside the
	   .drawer-scroll overflow container — when scrollIntoView fires on
	   focusin, the input lands ~12px from the container edge instead of
	   pinned flush against it. Applies to inputs, selects, the slider
	   thumb (kept focusable for screen readers), and the SelectPicker
	   custom trigger button. */
	.drawer-scroll :global(:is(input, select, textarea, [role='slider'], [data-select-trigger])) {
		scroll-margin-block: 0.75rem;
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
