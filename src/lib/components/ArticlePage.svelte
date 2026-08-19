<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import type { ArticleResult } from '$lib/layout/articleLayout';
	import { submitContactForm } from '$lib/contactForm';
	import { tileReveal } from '$lib/tileReveal';
	import { BOOKING_URL } from '$lib/config';
	import CharacterGrid from './CharacterGrid.svelte';

	// The same tilt the portal tiles use on the landing page, so a framed image
	// behaves identically wherever it appears. Kept here rather than imported from
	// PortalTile because that component owns a link and a screenshot; this is the
	// gesture alone, applied to a frame the article grid has already placed.
	function tilt(event: MouseEvent) {
		const el = event.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width - 0.5;
		const y = (event.clientY - rect.top) / rect.height - 0.5;
		el.style.transform = `perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale(1.03)`;
	}

	function resetTilt(event: MouseEvent) {
		(event.currentTarget as HTMLElement).style.transform = '';
	}

	interface Props {
		// Builds the article grid for a given column count and cell aspect
		// ratio (charWidth / lineHeight, for image sizing). Re-invoked on
		// resize, so content can adapt (two-column vs stacked floats).
		build: (cols: number, cellRatio: number) => ArticleResult;
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

	// Contact form state (only used when the article declares form fields)
	let formStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let formMessage = $state('');
	let formEl: HTMLFormElement | undefined = $state();

	let fieldMap = $derived.by(() => {
		const map = new Map<string, { row: number; col: number; width: number }>();
		for (const f of article?.formFields ?? []) map.set(f.id, f);
		return map;
	});

	let submitAction = $derived(article?.actions.find(a => a.action === 'submit-form'));

	async function handleFormSubmit() {
		if (!formEl || formStatus === 'submitting') return;
		formStatus = 'submitting';
		formMessage = '> sending message...';
		const result = await submitContactForm(formEl);
		formStatus = result.status;
		formMessage = result.message;
		if (result.status === 'success') formEl.reset();
	}

	function handleFormInput() {
		if (formStatus === 'success' || formStatus === 'error') {
			formStatus = 'idle';
			formMessage = '';
		}
	}

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

		article = build(cols, charWidth / lineHeight);

		tick().then(() => {
			if (!mounted && fontsReady) mounted = true;
		});
	}

	// Rebuild on every client-side navigation. Same-route param changes
	// (/stack/a -> /stack/b) reuse this component instance, and the build
	// callback's identity does not change, so navigation is the signal.
	afterNavigate(() => {
		if (containerEl) computeLayout();
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
		<CharacterGrid cells={article.cells} armed={mounted} />

		{#each article.images as img (`${img.src}:${img.row}:${img.col}`)}
			{@const box = `top: ${img.row * lineHeight}px; left: ${img.col * charWidth}px; width: ${img.cols * charWidth}px; height: ${img.rows * lineHeight}px; ${img.background ? `background:${img.background};` : ''}${img.glow ? `--glow-color:${img.glow};` : ''}`}
			{#if img.href}
				<a
					class="article-img tilt"
					href={img.href}
					target={img.href.startsWith('/') ? undefined : '_blank'}
					rel={img.href.startsWith('/') ? undefined : 'noopener'}
					aria-label={img.label}
					use:tileReveal={{ charWidth, lineHeight }}
					onmousemove={tilt}
					onmouseleave={resetTilt}
					style={box}
				>
					<img src={img.src} alt={img.label} class:fit-contain={img.fit === 'contain'} decoding="async" />
				</a>
			{:else}
				<div
					class="article-img tilt"
					use:tileReveal={{ charWidth, lineHeight }}
					onmousemove={tilt}
					onmouseleave={resetTilt}
					role="presentation"
					style={box}
				>
					<img src={img.src} alt={img.label} class:fit-contain={img.fit === 'contain'} decoding="async" />
				</div>
			{/if}
		{/each}

		{#each article.overlays as overlay}
			<a
				class="article-overlay"
				href={overlay.href}
				target={overlay.href.startsWith('http') ? '_blank' : undefined}
				rel={overlay.href.startsWith('http') ? 'noopener' : undefined}
				data-wmt-booking={overlay.href === BOOKING_URL ? '' : undefined}
				aria-label={overlay.label}
				style="top: {overlay.row * lineHeight}px; left: {overlay.col * charWidth}px; width: {overlay.length * charWidth}px; height: {lineHeight}px;"
			></a>
		{/each}

		<!-- Scroll anchors (e.g. #contact) -->
		{#each article.anchors as anchor}
			<div id={anchor.id} class="article-anchor" style="top: {(anchor.row - 4) * lineHeight}px;"></div>
		{/each}

		<!-- Inline contact form -->
		{#if article.formFields.length > 0}
			<form bind:this={formEl} class="form-inputs-layer" oninput={handleFormInput} onsubmit={(e) => e.preventDefault()} novalidate>
				<!-- `_gotcha` is the honeypot: bots fill it, real users don't. -->
				<input type="text" name="_gotcha" value="" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;" />

				{#if fieldMap.has('field-name')}
					{@const f = fieldMap.get('field-name')!}
					<input type="text" name="name" required autocomplete="name" placeholder="your name" class="grid-input"
						style="top: {f.row * lineHeight}px; left: {f.col * charWidth}px; width: {f.width * charWidth}px; height: {lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px;" />
				{/if}
				{#if fieldMap.has('field-email')}
					{@const f = fieldMap.get('field-email')!}
					<input type="email" name="email" required autocomplete="email" placeholder="you@example.com" class="grid-input"
						style="top: {f.row * lineHeight}px; left: {f.col * charWidth}px; width: {f.width * charWidth}px; height: {lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px;" />
				{/if}
				{#if fieldMap.has('field-subject')}
					{@const f = fieldMap.get('field-subject')!}
					<input type="text" name="subject" required placeholder="what's this about?" class="grid-input"
						style="top: {f.row * lineHeight}px; left: {f.col * charWidth}px; width: {f.width * charWidth}px; height: {lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px;" />
				{/if}
				{#if fieldMap.has('field-message-1')}
					{@const f1 = fieldMap.get('field-message-1')!}
					{@const f3 = fieldMap.get('field-message-3')}
					<textarea name="message" required placeholder="tell me about your project..." class="grid-input grid-textarea"
						style="top: {f1.row * lineHeight}px; left: {f1.col * charWidth}px; width: {f1.width * charWidth}px; height: {(f3 ? f3.row - f1.row + 1 : 3) * lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px;"
					></textarea>
				{/if}
			</form>

			{#if submitAction}
				<button
					class="article-overlay article-submit"
					aria-label={submitAction.label}
					disabled={formStatus === 'submitting'}
					onclick={handleFormSubmit}
					style="top: {submitAction.row * lineHeight}px; left: {submitAction.col * charWidth}px; width: {submitAction.length * charWidth}px; height: {lineHeight}px;"
				></button>
				{#if formMessage}
					{#key formMessage}
						<div
							class="form-status form-status-{formStatus}"
							role="status"
							aria-live="polite"
							style="top: {(submitAction.row + 1) * lineHeight}px; left: {submitAction.col * charWidth}px; font-size: {fontSize}px; line-height: {lineHeight}px; letter-spacing: {letterSpacingPx}px;"
						>{formMessage}</div>
					{/key}
				{/if}
			{/if}
		{/if}
	{/if}
</div>

<style>
	.article-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
		white-space: pre;
		overflow: hidden;
		transition: opacity var(--grid-fade);
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

	/* Portal-tile behaviour: the frame tilts under the cursor and lights up in its
	   project's colour. Same timings and glow as PortalTile so the two read as one
	   component wherever they appear. */
	.article-img.tilt {
		transition: transform 0.15s ease-out, box-shadow 0.3s;
		will-change: transform;
	}

	.article-img.tilt:hover {
		box-shadow: 0 8px 30px var(--glow-color, rgba(150, 149, 145, 0.25));
	}

	@media (prefers-reduced-motion: reduce) {
		.article-img.tilt {
			transition: box-shadow 0.3s;
			transform: none !important;
		}
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

	.article-anchor {
		position: absolute;
		width: 1px;
		height: 1px;
		pointer-events: none;
	}

	.form-inputs-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 0;
	}

	.grid-input {
		position: absolute;
		background: transparent;
		border: none;
		outline: none;
		color: #f0efe9;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		padding: 0;
		caret-color: #969591;
		z-index: 5;
	}

	.grid-input::placeholder {
		color: rgba(240, 239, 233, 0.15);
	}

	.grid-input:focus {
		background: rgba(150, 149, 145, 0.08);
	}

	.grid-textarea {
		resize: none;
	}

	.form-status {
		position: absolute;
		white-space: pre;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		z-index: 5;
		pointer-events: none;
		color: #969591;
	}

	.form-status-error {
		color: #f87171;
	}
</style>
