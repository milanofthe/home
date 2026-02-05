<script lang="ts">
	import { onMount } from 'svelte';
	import PortalTile from './PortalTile.svelte';

	interface Project {
		id: string;
		name: string;
		url: string;
		screenshot: string;
		color: 'pathsim' | 'pysimhub';
	}

	interface Props {
		projects: Project[];
	}

	let { projects }: Props = $props();

	let expandingProject: typeof projects[0] | null = $state(null);
	let overlayStyle = $state('');
	let isExpanding = $state(false);

	onMount(() => {
		// Reset state when returning via back button
		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				expandingProject = null;
				isExpanding = false;
			}
		};
		window.addEventListener('pageshow', handlePageShow);
		return () => window.removeEventListener('pageshow', handlePageShow);
	});

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
				}, 350);
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
	</div>
{/if}
