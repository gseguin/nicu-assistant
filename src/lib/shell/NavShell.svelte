<script lang="ts">
	import { page } from '$app/state';
	import { CALCULATOR_REGISTRY } from './registry.js';
	import type { CalculatorEntry } from './registry.js';
	import { theme } from '$lib/shared/theme.svelte.js';
	import { Sun, Moon, Menu } from '@lucide/svelte';
	import HamburgerMenu from './HamburgerMenu.svelte';
	import { favorites } from '$lib/shared/favorites.svelte.js';

	// D-01: Map built once per module load (CALCULATOR_REGISTRY is static)
	// byId typed as Map<string, CalculatorEntry> because CalculatorEntry.id is string, not CalculatorId
	const byId = new Map<string, CalculatorEntry>(
		CALCULATOR_REGISTRY.map((c) => [c.id, c])
	);

	// Phase 45 D-02: desktop top toolbar always renders the full registry. Module-scope const
	// (not $derived) because CALCULATOR_REGISTRY is `readonly` and never mutates at runtime —
	// matches the byId pattern above. Iteration order = registry declaration order.
	const desktopVisibleCalculators: readonly CalculatorEntry[] = [...CALCULATOR_REGISTRY];

	// 42.1-03 D-15: About sheet hoisted to +layout.svelte; aboutOpen now lives at the layout
	// level so DisclaimerBanner's "More" link can also open it. NavShell binds the prop so
	// the hamburger menu's About callback continues to work.
	let { aboutOpen = $bindable(false) }: { aboutOpen?: boolean } = $props();

	let menuOpen = $state(false);
	let menuTriggerBtn = $state<HTMLButtonElement | null>(null);

	// Phase 45 D-07/D-08: refs and state for the desktop tablist scroll affordances.
	// tablistEl is the inner scrollable <div role="tablist">; isOverflowing toggles
	// the right-edge mask fade when scrollWidth > clientWidth.
	let tablistEl = $state<HTMLElement | null>(null);
	let isOverflowing = $state(false);

	// Phase 45 D-01: mobile bottom bar = favorites-driven, registry-ordered (Phase 41 contract preserved verbatim — only renamed for symmetry with desktopVisibleCalculators)
	const mobileVisibleCalculators = $derived(
		favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
	);

	// Phase 45 D-07 / UI-SPEC A2: auto-scroll active tab into view on route change and on
	// first mount. inline:'nearest' means in-view tabs do not animate (steady-state no-op).
	// Reduced-motion override per UI-SPEC AUTO-4 (WCAG 2.3.3).
	$effect(() => {
		const _path = page.url.pathname; // dependency for re-run on navigation
		if (!tablistEl) return;
		const active = tablistEl.querySelector<HTMLElement>('[aria-selected="true"]');
		if (!active) return;
		const reduce =
			typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		active.scrollIntoView({
			inline: 'nearest',
			block: 'nearest',
			behavior: reduce ? 'auto' : 'smooth'
		});
	});

	// Phase 45 D-08 / UI-SPEC A3: detect horizontal overflow on the tablist and toggle the
	// is-overflowing class so the mask fade appears only when content exceeds container.
	// ResizeObserver covers viewport resize, theme toggle reflow, and font-load layout shift.
	$effect(() => {
		if (!tablistEl) return;
		const el = tablistEl;
		const update = () => {
			isOverflowing = el.scrollWidth > el.clientWidth;
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	});
</script>

<!-- Top title bar: always visible on all viewports -->
<header
	class="sticky top-0 right-0 left-0 z-10 flex
         min-h-14 items-center gap-2 border-b
         border-[var(--color-border)] bg-[var(--color-surface)] px-4"
>
	<!-- Hamburger button: top-left corner -->
	<button
		bind:this={menuTriggerBtn}
		type="button"
		class="icon-btn -ml-2 min-h-[48px] min-w-[48px]"
		aria-label="Open calculator menu"
		aria-haspopup="dialog"
		aria-expanded={menuOpen}
		onclick={() => (menuOpen = true)}
	>
		<Menu size={20} aria-hidden="true" />
	</button>

	<!-- App name -->
	<span class="text-base font-semibold tracking-tight text-[var(--color-text-primary)]"
		>NICU Assist</span
	>

	<!-- Desktop calculator tabs (hidden on mobile) -->
	<nav class="ml-4 hidden gap-2 md:flex" aria-label="Calculator navigation">
		<div
			bind:this={tablistEl}
			class="tablist-scroll flex gap-2"
			class:is-overflowing={isOverflowing}
			role="tablist"
		>
			{#each desktopVisibleCalculators as calc}
				{@const isActive = page.url.pathname.startsWith(calc.href)}
				<a
					href={calc.href}
					class="{calc.identityClass} flex min-h-[48px] items-center gap-2 rounded-t-lg border-b-2 px-4
                 py-3 text-ui font-medium transition-colors
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]
                 {isActive
						? 'border-[var(--color-accent)] text-[var(--color-accent)]'
						: 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
					aria-label="{calc.label}. {calc.description}"
					aria-selected={isActive}
					role="tab"
				>
					<calc.icon size={18} aria-hidden="true" />
					<span>{calc.label}</span>
				</a>
			{/each}
		</div>
	</nav>

	<!-- Spacer pushes theme button right -->
	<div class="flex-1"></div>

	<!-- Theme toggle -->
	<button
		type="button"
		class="icon-btn min-h-[48px] min-w-[48px]"
		aria-label={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
		onclick={() => theme.toggle()}
	>
		{#if theme.current === 'dark'}
			<Sun size={20} aria-hidden="true" />
		{:else}
			<Moon size={20} aria-hidden="true" />
		{/if}
	</button>
</header>

<!-- Mobile bottom tab bar: calculator tabs only, hidden on md+ -->
<!-- D-11: sole glassmorphism license in the system per DESIGN.md - do not propagate -->
<nav
	class="fixed right-0 bottom-0 left-0 z-10 border-t
         border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)]
         md:hidden"
	aria-label="Calculator navigation"
>
	<div class="flex" role="tablist">
		{#each mobileVisibleCalculators as calc}
			{@const isActive = page.url.pathname.startsWith(calc.href)}
			<a
				href={calc.href}
				class="{calc.identityClass} flex min-h-14 flex-1 flex-col items-center justify-center
               gap-1 px-1 py-1 text-ui font-medium transition-colors
               focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]
               {isActive
					? 'font-semibold text-[var(--color-accent)]'
					: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
				aria-label="{calc.label}. {calc.description}"
				aria-selected={isActive}
				role="tab"
			>
				<calc.icon size={18} aria-hidden="true" />
				<span>{calc.label}</span>
			</a>
		{/each}
	</div>
</nav>

<HamburgerMenu
	triggerEl={menuTriggerBtn}
	bind:open={menuOpen}
	onAbout={() => (aboutOpen = true)}
/>

<style>
	/* Phase 45 A1: horizontal scroll affordance on the desktop tablist.
	   Tabs stay at full padding / full label / 48 px touch target at every viewport. */
	.tablist-scroll {
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
		scroll-behavior: smooth;
	}

	/* Phase 45 A3: 24 px right-edge gradient fade. Class is toggled from JS via the
	   ResizeObserver $effect so the fade is invisible when content fits. mask-image
	   preserves tab interactivity beneath the fade — no pointer-events override needed. */
	.tablist-scroll.is-overflowing {
		mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
		-webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
	}
</style>
