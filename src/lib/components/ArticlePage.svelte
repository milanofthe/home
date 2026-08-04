<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ArticleResult } from '$lib/layout/articleLayout';
	import CharacterGrid from './CharacterGrid.svelte';

	interface Props {
		// Builds the article grid for a given column count. Re-invoked on
		// resize, so content can adapt (two-column vs stacked floats).
		build: (cols: number) => ArticleResult;
		// Semantic HTML for SEO / screen readers (the grid is aria-hidden).
		semantic?: import('svelte').Snippet;
	}

	let { build, semantic }: Props = $props();

	let containerEl: HTMLDivElement;
	let charWidth = $state(0);
	let fontSize = $state(0);
	let lineHeight = $state(0);
	let letterSpacingPx = $state(0);
	let article = $state.raw<ArticleResult | null>(null);
	let mounted = $state(false);
	let fontsReady = false;

	function computeLayout() {
		const vw = document.documentElement.clientWidth;
		fontSize = vw < 640 ? 11 : 14;

		const probe = document.createElement('span');
		probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;letter-spacing:0px';
		probe.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
		probe.style.fontSize = `${fontSize}px`;
		probe.textContent = 'X';
		const parent = containerEl || document.body;
		parent.appendChild(probe);
		const advanceWidth = probe.getBoundingClientRect().width;
		parent.removeChild(probe);

		const cols = Math.max(40, Math.floor(vw / advanceWidth));
		charWidth = vw / cols;
		letterSpacingPx = charWidth - advanceWidth;
		lineHeight = Math.ceil(fontSize * 1.5);

		// Same content-column variable the nav aligns to (see Navigation.svelte).
		const contentCols = Math.min(cols - 4, 114);
		document.documentElement.style.setProperty('--grid-content-width', `${contentCols * charWidth}px`);

		article = build(cols);

		tick().then(() => {
			if (!mounted && fontsReady) mounted = true;
		});
	}

	// Rebuild when the build callback changes (e.g. a tag filter on /notes).
	let lastBuild: typeof build | null = null;
	$effect(() => {
		const b = build;
		if (lastBuild && lastBuild !== b && containerEl) computeLayout();
		lastBuild = b;
	});

	onMount(() => {
		computeLayout();
		const markFontsReady = () => {
			if (fontsReady) return;
			fontsReady = true;
			computeLayout();
			if (!mounted) mounted = true;
		};
		document.fonts.ready.then(markFontsReady);
		setTimeout(markFontsReady, 1200);
		window.addEventListener('resize', computeLayout);
		return () => window.removeEventListener('resize', computeLayout);
	});
</script>

{#if semantic}
	<main class="sr-only">
		{@render semantic()}
	</main>
{/if}

<div
	bind:this={containerEl}
	class="article-container"
	class:opacity-0={!mounted}
	style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: {fontSize}px; line-height: {lineHeight}px; letter-spacing: {letterSpacingPx}px;"
>
	{#if article}
		<CharacterGrid cells={article.cells} />

		{#each article.images as img}
			{#if img.href}
				<a
					class="article-img"
					href={img.href}
					target={img.href.startsWith('/') ? undefined : '_blank'}
					rel={img.href.startsWith('/') ? undefined : 'noopener'}
					aria-label={img.label}
					style="top: {img.row * lineHeight}px; left: {img.col * charWidth}px; width: {img.cols * charWidth}px; height: {img.rows * lineHeight}px; {img.background ? `background:${img.background};` : ''}"
				>
					<img src={img.src} alt={img.label} class:fit-contain={img.fit === 'contain'} loading="lazy" decoding="async" />
				</a>
			{:else}
				<div
					class="article-img"
					style="top: {img.row * lineHeight}px; left: {img.col * charWidth}px; width: {img.cols * charWidth}px; height: {img.rows * lineHeight}px; {img.background ? `background:${img.background};` : ''}"
				>
					<img src={img.src} alt={img.label} class:fit-contain={img.fit === 'contain'} loading="lazy" decoding="async" />
				</div>
			{/if}
		{/each}

		{#each article.overlays as overlay}
			<a
				class="article-overlay"
				href={overlay.href}
				target={overlay.href.startsWith('http') ? '_blank' : undefined}
				rel={overlay.href.startsWith('http') ? 'noopener' : undefined}
				aria-label={overlay.label}
				style="top: {overlay.row * lineHeight}px; left: {overlay.col * charWidth}px; width: {overlay.length * charWidth}px; height: {lineHeight}px;"
			></a>
		{/each}
	{/if}
</div>

<style>
	.article-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
		white-space: pre;
		overflow: hidden;
		transition: opacity 0.3s;
		background: #0f0f0f;
		text-rendering: geometricPrecision;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.opacity-0 {
		opacity: 0;
	}

	.article-img {
		position: absolute;
		z-index: 2;
		overflow: hidden;
		border-radius: 4px;
		display: block;
	}

	.article-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
		display: block;
	}

	.article-img img.fit-contain {
		object-fit: contain;
		object-position: center;
	}

	.article-overlay {
		position: absolute;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		z-index: 5;
		display: block;
	}
</style>
