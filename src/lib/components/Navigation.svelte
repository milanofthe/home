<script lang="ts">
	import { onMount } from 'svelte';

	let scrolled = $state(false);
	let mobileMenuOpen = $state(false);

	onMount(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 50;
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function closeMenu() {
		mobileMenuOpen = false;
	}

	const navLinks = [
		{ href: '/#about', label: 'About' },
		{ href: '/#projects', label: 'Projects' },
		{ href: '/#services', label: 'Services' },
		{ href: '/#contact', label: 'Contact' }
	];

	let showBackground = $derived(scrolled || mobileMenuOpen);
</script>

<nav
	class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-mono {showBackground ? 'bg-charcoal/95 backdrop-blur-sm border-b border-cream/10' : ''}"
>
	<div class="nav-content py-4">
		<div class="flex items-center justify-between">
			<!-- Name -->
			<a href="/" class="font-mono font-medium text-sm text-cream hover:text-cream-light transition-colors">
				Milan Rother
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center gap-8">
				{#each navLinks as link}
					<a
						href={link.href}
						class="text-sm transition-colors duration-200 {link.href === '/#contact' ? 'text-cream hover:text-cream-light font-medium' : 'text-cream/60 hover:text-cream'}"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="md:hidden p-2 text-cream/60 hover:text-cream transition-colors"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if mobileMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden pt-4 pb-2 border-t border-cream/10 mt-4">
				<div class="flex flex-col gap-4">
					{#each navLinks as link}
						<a
							href={link.href}
							class="text-sm transition-colors {link.href === '/#contact' ? 'text-cream font-medium' : 'text-cream/60 hover:text-cream'}"
							onclick={closeMenu}
						>
							{link.label}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</nav>

<style>
	/* The nav BAR spans the full viewport (background/border stay edge-to-edge);
	   only this inner content container is constrained to the character-grid
	   content column so the nav items line up with the content edges.
	   CodeRainPage sets --grid-content-width to the exact pixel width of the
	   grid's content column; the 114ch fallback (JetBrains Mono at 14px) matches
	   it closely for the first paint and for pages without the grid. */
	.nav-content {
		width: var(--grid-content-width, 114ch);
		max-width: calc(100% - 1.5rem);
		margin-inline: auto;
		font-size: 14px;
	}
</style>
