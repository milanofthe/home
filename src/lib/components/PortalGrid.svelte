<script lang="ts">
	import PortalTile from './PortalTile.svelte';

	const projects = [
		{
			id: 'pathsim-org',
			name: 'PathSim',
			url: 'https://pathsim.org',
			screenshot: '/screenshots/pathsim-org.png',
			description: 'Landing page',
			color: 'pathsim' as const
		},
		{
			id: 'docs-pathsim-org',
			name: 'Documentation',
			url: 'https://docs.pathsim.org',
			screenshot: '/screenshots/docs-pathsim-org.png',
			description: 'API reference & tutorials',
			color: 'pathsim' as const
		},
		{
			id: 'view-pathsim-org',
			name: 'PathView',
			url: 'https://view.pathsim.org',
			screenshot: '/screenshots/view-pathsim-org.png',
			description: 'Browser-based editor',
			color: 'pathsim' as const
		},
		{
			id: 'pysimhub-io',
			name: 'PySimHub',
			url: 'https://pysimhub.io',
			screenshot: '/screenshots/pysimhub-io.png',
			description: 'Community catalog',
			color: 'pysimhub' as const
		}
	];

	let overlayElement: HTMLDivElement | null = $state(null);
	let expandingProject: typeof projects[0] | null = $state(null);
	let overlayStyle = $state('');
	let isExpanding = $state(false);

	function handleTileClick(project: typeof projects[0], rect: DOMRect) {
		expandingProject = project;

		// Set initial position matching the tile
		overlayStyle = `
			top: ${rect.top}px;
			left: ${rect.left}px;
			width: ${rect.width}px;
			height: ${rect.height}px;
			border-radius: 0.5rem;
		`;

		// Force a reflow before adding expanding class
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				isExpanding = true;

				// Navigate after animation
				setTimeout(() => {
					window.location.href = project.url;
				}, 500);
			});
		});
	}
</script>

<!-- Grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
	{#each projects as project}
		<PortalTile
			{...project}
			onclick={(rect) => handleTileClick(project, rect)}
		/>
	{/each}
</div>

<!-- Expanding overlay -->
{#if expandingProject}
	<div
		bind:this={overlayElement}
		class="portal-overlay {isExpanding ? 'expanding' : ''}"
		style={overlayStyle}
	>
		<img
			src={expandingProject.screenshot}
			alt="{expandingProject.name} preview"
			class="absolute inset-0 w-full h-full object-cover object-top"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-charcoal/60 to-charcoal/90 {isExpanding ? 'opacity-0' : ''} transition-opacity duration-500"></div>
		<div class="absolute bottom-0 left-0 right-0 p-4 text-left {isExpanding ? 'opacity-0' : ''} transition-opacity duration-300">
			<h3 class="font-display font-semibold text-cream text-lg mb-1">{expandingProject.name}</h3>
			<p class="text-sm text-cream/70">{expandingProject.description}</p>
		</div>
	</div>
{/if}
