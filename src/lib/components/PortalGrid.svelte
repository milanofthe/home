<script lang="ts">
	import PortalTile from './PortalTile.svelte';

	interface Project {
		id: string;
		name: string;
		url: string;
		screenshot: string;
		description: string;
		color: 'pathsim' | 'pysimhub';
	}

	interface Props {
		projects: Project[];
	}

	let { projects }: Props = $props();

	let expandingProject: typeof projects[0] | null = $state(null);
	let overlayStyle = $state('');
	let isExpanding = $state(false);

	function handleTileClick(project: typeof projects[0], rect: DOMRect) {
		expandingProject = project;

		// Set initial position matching the tile exactly
		overlayStyle = `
			top: ${rect.top}px;
			left: ${rect.left}px;
			width: ${rect.width}px;
			height: ${rect.height}px;
		`;

		// Force reflow then trigger expansion
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				isExpanding = true;

				// Navigate after animation
				setTimeout(() => {
					window.location.href = project.url;
				}, 650);
			});
		});
	}
</script>

<!-- Grid - centered, columns match item count -->
<div class="grid gap-6 mx-auto {projects.length === 1 ? 'grid-cols-1 max-w-md' : projects.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl' : 'grid-cols-1 md:grid-cols-3 max-w-5xl'}">
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
		class="portal-overlay {isExpanding ? 'expanding' : ''}"
		style={overlayStyle}
	>
		<img
			src={expandingProject.screenshot}
			alt="{expandingProject.name} preview"
			class="absolute inset-0 w-full h-full object-cover object-top"
		/>
		<div
			class="absolute bottom-0 left-0 right-0 p-5 text-left bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300"
			class:opacity-0={isExpanding}
		>
			<h3 class="font-display font-bold text-cream text-xl mb-1 drop-shadow-lg">{expandingProject.name}</h3>
			<p class="text-sm text-cream/80 drop-shadow">{expandingProject.description}</p>
		</div>
	</div>
{/if}
