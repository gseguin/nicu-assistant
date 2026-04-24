<script lang="ts">
	import { page } from '$app/state';
	import { CALCULATOR_REGISTRY } from './registry.js';
	import type { CalculatorEntry } from './registry.js';
	import { theme } from '$lib/shared/theme.svelte.js';
	import { Sun, Moon, Menu } from '@lucide/svelte';
	import AboutSheet from '$lib/shared/components/AboutSheet.svelte';
	import HamburgerMenu from './HamburgerMenu.svelte';
	import type { CalculatorId } from '$lib/shared/types.js';
	import { favorites } from '$lib/shared/favorites.svelte.js';

	// D-01: Map built once per module load (CALCULATOR_REGISTRY is static)
	// byId typed as Map<string, CalculatorEntry> because CalculatorEntry.id is string, not CalculatorId
	const byId = new Map<string, CalculatorEntry>(
		CALCULATOR_REGISTRY.map((c) => [c.id, c])
	);

	let aboutOpen = $state(false);
	let menuOpen = $state(false);
	let menuTriggerBtn = $state<HTMLButtonElement | null>(null);

	// D-05: registry-driven derivation — undefined when on non-calculator routes (e.g. /)
	const activeCalculatorId = $derived<CalculatorId | undefined>(
		(CALCULATOR_REGISTRY.find((c) => page.url.pathname.startsWith(c.href))?.id as CalculatorId) ?? undefined
	);

	// D-01: render only favorited calculators in registry order
	const visibleCalculators = $derived(
		favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
	);
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
		<div class="flex gap-2" role="tablist">
			{#each visibleCalculators as calc}
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
<nav
	class="fixed right-0 bottom-0 left-0 z-10 border-t
         border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom,0px)]
         md:hidden"
	aria-label="Calculator navigation"
>
	<div class="flex" role="tablist">
		{#each visibleCalculators as calc}
			{@const isActive = page.url.pathname.startsWith(calc.href)}
			<a
				href={calc.href}
				class="{calc.identityClass} flex min-h-14 flex-1 flex-col items-center justify-center
               gap-1 py-2 text-ui font-medium transition-colors
               focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]
               {isActive
					? 'font-semibold text-[var(--color-accent)]'
					: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
				aria-label="{calc.label}. {calc.description}"
				aria-selected={isActive}
				role="tab"
			>
				<calc.icon size={22} aria-hidden="true" />
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
<AboutSheet calculatorId={activeCalculatorId ?? 'morphine-wean'} bind:open={aboutOpen} />
