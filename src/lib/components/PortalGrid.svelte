<script lang="ts">
	import { onMount } from 'svelte';
	import PortalTile from './PortalTile.svelte';

	interface Project {
		id: string;
		name: string;
		url: string;
		screenshot: string;
		mobileScreenshot?: string;
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
					window.location.href = project.url + (project.url.includes('?') ? '&' : '?') + 'theme=dark';
				}, 350);
			});
		});
	}
</script>

<!-- Grid - centered, columns match item count -->
<div class="grid gap-4 w-full h-full {projects.length === 1 ? 'grid-cols-1' : projects.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}">
	{#each projects as project}
		<div class="aspect-[16/10]">
			<PortalTile
				{...project}
				onclick={(rect) => handleTileClick(project, rect)}
			/>
		</div>
	{/each}
</div>

<!-- Expanding overlay -->
{#if expandingProject}
	<div
		class="portal-overlay {isExpanding ? 'expanding' : ''}"
		style={overlayStyle}
	>
		<picture>
			{#if expandingProject.mobileScreenshot}
				<source media="(max-width: 639px)" srcset={expandingProject.mobileScreenshot} />
			{/if}
			<img
				src={expandingProject.screenshot}
				alt="{expandingProject.name} preview"
				class="absolute inset-0 w-full h-full object-cover object-top"
			/>
		</picture>
	</div>
{/if}
