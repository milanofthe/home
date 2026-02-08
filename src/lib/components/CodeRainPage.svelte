<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { computeGridLayout, getBreakpointConfig, type GridLayout, type FormFieldPosition, type CellType } from '$lib/layout/gridLayout';
	import CharacterGrid from './CharacterGrid.svelte';
	import PortalTile from './PortalTile.svelte';

	let containerEl: HTMLDivElement;

	let charWidth = $state(0);
	let fontSize = $state(0);
	let lineHeight = $state(0);
	let letterSpacingPx = $state(0);
	let gridLayout = $state.raw<GridLayout | null>(null);
	let mounted = $state(false);

	// Tile data for individual embedded blocks
	interface TileInfo {
		name: string;
		url: string;
		screenshot: string;
		mobileScreenshot?: string;
		color: 'pathsim' | 'pysimhub';
	}

	const tileInfo: Record<string, TileInfo> = {
		'pathsim-org': { name: 'PathSim', url: 'https://pathsim.org', screenshot: '/screenshots/pathsim-org.png', mobileScreenshot: '/screenshots/pathsim-org-mobile.png', color: 'pathsim' },
		'docs-pathsim-org': { name: 'Documentation', url: 'https://docs.pathsim.org', screenshot: '/screenshots/docs-pathsim-org.png', mobileScreenshot: '/screenshots/docs-pathsim-org-mobile.png', color: 'pathsim' },
		'view-pathsim-org': { name: 'PathView', url: 'https://view.pathsim.org', screenshot: '/screenshots/view-pathsim-org.png', mobileScreenshot: '/screenshots/view-pathsim-org-mobile.png', color: 'pathsim' },
		'pysimhub-io': { name: 'PySimHub', url: 'https://pysimhub.io', screenshot: '/screenshots/pysimhub-io.png', mobileScreenshot: '/screenshots/pysimhub-io-mobile.png', color: 'pysimhub' }
	};

	// Expanding tile animation
	let expandingTile = $state<TileInfo | null>(null);
	let overlayStyle = $state('');
	let isExpanding = $state(false);

	function handleTileClick(info: TileInfo, rect: DOMRect) {
		expandingTile = info;
		overlayStyle = `top: ${rect.top}px; left: ${rect.left}px; width: ${rect.width}px; height: ${rect.height}px;`;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				isExpanding = true;
				setTimeout(() => { window.location.href = info.url; }, 350);
			});
		});
	}

	// Contact form state
	let formStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');

	// Form field positions from layout
	let formFieldMap = $derived.by(() => {
		if (!gridLayout) return new Map<string, FormFieldPosition>();
		const map = new Map<string, FormFieldPosition>();
		for (const f of gridLayout.formFields) {
			map.set(f.id, f);
		}
		return map;
	});

	async function handleFormSubmit() {
		formStatus = 'submitting';
		const form = document.getElementById('grid-contact-form') as HTMLFormElement;
		if (!form) return;
		const formData = new FormData(form);
		try {
			const response = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				body: formData
			});
			const data = await response.json();
			formStatus = data.success ? 'success' : 'error';
			if (data.success) form.reset();
		} catch {
			formStatus = 'error';
		}
	}

	// Unified clickable overlay system
	interface ClickOverlay {
		row: number;
		col: number;
		length: number;
		label: string;
		href?: string;
		scrollTo?: string;
		action?: string;
	}

	const clickTargets: { text: string; types: CellType[]; href?: string; scrollTo?: string; action?: string }[] = [
		{ text: '[ Get in Touch -> ]', types: ['cta'], scrollTo: 'contact' },
		{ text: '[ View Projects ]', types: ['cta'], scrollTo: 'projects' },
		{ text: '[ SEND MESSAGE -> ]', types: ['cta'], action: 'submit-form' },
		{ text: 'GitHub', types: ['link', 'footer'], href: 'https://github.com/milanofthe' },
		{ text: 'LinkedIn', types: ['link', 'footer', 'content'], href: 'https://linkedin.com/in/milan-rother-648474183' },
	];

	let clickOverlays = $derived.by((): ClickOverlay[] => {
		if (!gridLayout) return [];
		const overlays: ClickOverlay[] = [];

		for (let r = 0; r < gridLayout.cells.length; r++) {
			const row = gridLayout.cells[r];
			for (const target of clickTargets) {
				if (!row.some(c => target.types.includes(c.type))) continue;
				for (let c = 0; c <= row.length - target.text.length; c++) {
					if (!target.types.includes(row[c].type)) continue;
					let match = true;
					for (let k = 0; k < target.text.length; k++) {
						if (row[c + k].char !== target.text[k]) { match = false; break; }
					}
					if (match) {
						overlays.push({
							row: r, col: c, length: target.text.length,
							label: target.text, href: target.href, scrollTo: target.scrollTo, action: target.action
						});
					}
				}
			}
		}
		return overlays;
	});

	function computeLayout() {
		const vw = document.documentElement.clientWidth;
		const config = getBreakpointConfig(vw);

		// Exact character width: viewport divided evenly among columns
		charWidth = vw / config.cols;

		// Compute fontSize so the font's natural advance width ≈ charWidth.
		const probe = document.createElement('span');
		probe.style.position = 'absolute';
		probe.style.visibility = 'hidden';
		probe.style.whiteSpace = 'pre';
		probe.style.letterSpacing = '0px';
		probe.textContent = 'X';

		const probeParent = containerEl || document.body;
		probeParent.appendChild(probe);

		probe.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
		probe.style.fontSize = '16px';
		const w16 = probe.getBoundingClientRect().width;
		fontSize = charWidth * 16 / w16;

		for (let i = 0; i < 3; i++) {
			probe.style.fontSize = `${fontSize}px`;
			const w = probe.getBoundingClientRect().width;
			if (w > 0) fontSize *= charWidth / w;
		}

		// Measure the font's actual advance width at final fontSize
		probe.style.fontSize = `${fontSize}px`;
		const advanceWidth = probe.getBoundingClientRect().width;
		probeParent.removeChild(probe);

		// letter-spacing correction: forces each character to occupy exactly charWidth pixels.
		// This bridges the tiny gap between the font's natural advance and vw/cols.
		letterSpacingPx = charWidth - advanceWidth;

		lineHeight = Math.ceil(fontSize * 1.5);

		if (!gridLayout || gridLayout.cols !== config.cols) {
			gridLayout = computeGridLayout(config.cols);
		}

		tick().then(() => {
			if (!mounted) mounted = true;
		});
	}

	function scrollToSection(id: string) {
		if (!gridLayout) return;
		const anchor = gridLayout.sectionAnchors.find(a => a.id === id);
		if (anchor) {
			const y = anchor.row * lineHeight;
			window.scrollTo({ top: y - 60, behavior: 'smooth' });
		}
	}

	// Hovered word highlight
	let hoveredWord = $state<{ row: number; col: number; length: number; text: string } | null>(null);

	function handleMouseMove(e: MouseEvent) {
		if (!containerEl || !gridLayout) { hoveredWord = null; return; }
		const rect = containerEl.getBoundingClientRect();
		const row = Math.floor((e.clientY - rect.top) / lineHeight);
		const col = Math.floor((e.clientX - rect.left) / charWidth);

		const cells = gridLayout.cells;
		if (row < 0 || row >= cells.length || col < 0 || col >= cells[0].length) {
			hoveredWord = null;
			return;
		}

		const cell = cells[row][col];
		if (cell.type !== 'filler' || cell.char === ' ') {
			hoveredWord = null;
			return;
		}

		// Find whitespace-separated token boundaries
		const rowCells = cells[row];
		let start = col;
		while (start > 0 && rowCells[start - 1].type === 'filler' && rowCells[start - 1].char !== ' ') start--;
		let end = col;
		while (end < rowCells.length - 1 && rowCells[end + 1].type === 'filler' && rowCells[end + 1].char !== ' ') end++;

		// Skip update if same word
		if (hoveredWord && hoveredWord.row === row && hoveredWord.col === start) return;

		let text = '';
		for (let i = start; i <= end; i++) text += rowCells[i].char;
		hoveredWord = { row, col: start, length: end - start + 1, text };
	}

	function handleMouseLeave() {
		hoveredWord = null;
	}

	function flyIn(node: HTMLElement) {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return { destroy() {} };
		}
		node.style.opacity = '0';
		node.style.transform = 'translateY(30px)';
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					observer.unobserve(entry.target);
					node.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
					// Clear transform after animation so position:fixed children work correctly
					function onEnd() {
						node.removeEventListener('transitionend', onEnd);
						node.style.transform = '';
						node.style.transition = '';
					}
					node.addEventListener('transitionend', onEnd);
					requestAnimationFrame(() => {
						node.style.opacity = '1';
						node.style.transform = 'translateY(0)';
					});
				}
			}
		}, { threshold: 0.1 });
		observer.observe(node);
		return { destroy() { observer.disconnect(); } };
	}

	onMount(() => {
		computeLayout();

		// Re-measure once fonts are ready (corrects char ratio if fallback was used)
		document.fonts.ready.then(() => computeLayout());

		// Intercept nav anchor clicks and scroll to grid section positions
		function handleNavClick(e: Event) {
			const anchor = (e.target as HTMLElement).closest('a[href^="/#"]');
			if (!anchor) return;
			const id = anchor.getAttribute('href')!.replace('/#', '');
			if (gridLayout?.sectionAnchors.some(a => a.id === id)) {
				e.preventDefault();
				scrollToSection(id);
				history.pushState(null, '', `/#${id}`);
			}
		}

		// Handle initial hash on load
		if (window.location.hash) {
			const id = window.location.hash.replace('#', '');
			setTimeout(() => scrollToSection(id), 100);
		}

		// Reset expand animation when returning via back button
		function handlePageShow(e: PageTransitionEvent) {
			if (e.persisted) { expandingTile = null; isExpanding = false; }
		}

		window.addEventListener('resize', computeLayout);
		window.addEventListener('pageshow', handlePageShow);
		document.addEventListener('click', handleNavClick);
		return () => {
			window.removeEventListener('resize', computeLayout);
			window.removeEventListener('pageshow', handlePageShow);
			document.removeEventListener('click', handleNavClick);
		};
	});
</script>

<!-- Semantic content for SEO / screen readers -->
<main class="sr-only">
	<h1>Milan Rother</h1>
	<p>I build simulation tools end-to-end — numerical methods, infrastructure, and the interfaces to use them.</p>
	<section id="about">
		<h2>Who am I</h2>
		<p>I'm a research engineer and PhD candidate in electrical engineering. I build simulation software and solve numerical problems for teams working on complex physical systems.</p>
		<p>Currently consulting for MIT Plasma Science & Fusion Center on nuclear fusion fuel-cycle modeling.</p>
		<p>Previously at TU Braunschweig, where I developed numerical methods for electrochemical sensors and EDA pipelines for cryogenic quantum applications.</p>
		<p>I built <a href="https://pathsim.org">PathSim</a> because system modeling software has a long history of vendor lock-in and clunky UX. I also designed <a href="https://view.pathsim.org">PathView</a> — the browser-based editor.</p>
	</section>
	<section id="projects">
		<h2>Projects</h2>
		<p>Building open-source infrastructure for system modeling and simulation.</p>
	</section>
	<section id="contact">
		<h2>Let's Work Together</h2>
		<p>Need simulation infrastructure that's robust and also fun to use? Let's talk!</p>
	</section>
</main>

<!-- Character grid + overlays -->
<div bind:this={containerEl} class="code-rain-container" class:opacity-0={!mounted}
	style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: {fontSize}px; line-height: {lineHeight}px; letter-spacing: {letterSpacingPx}px;"
	onmousemove={handleMouseMove} onmouseleave={handleMouseLeave}>
	{#if gridLayout}
		<CharacterGrid cells={gridLayout.cells} />

		<!-- Embedded block overlays — absolutely positioned to match frame -->
		{#each gridLayout.embeddedBlocks as block}
			{#if block.id === 'photo'}
				<div class="overlay-block" use:flyIn style="top: {block.row * lineHeight}px; left: {block.col * charWidth}px; width: {block.cols * charWidth}px; height: {block.rows * lineHeight}px;">
					<div
						class="photo-tile"
						onmousemove={(e) => {
							const el = e.currentTarget;
							const rect = el.getBoundingClientRect();
							const x = (e.clientX - rect.left) / rect.width - 0.5;
							const y = (e.clientY - rect.top) / rect.height - 0.5;
							el.style.transform = `perspective(600px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) scale(1.03)`;
						}}
						onmouseleave={(e) => { e.currentTarget.style.transform = ''; }}
					>
						<img src="/images/headshot_milan.webp" alt="Milan Rother" class="photo-img" />
					</div>
				</div>
			{:else if tileInfo[block.id]}
				{@const info = tileInfo[block.id]}
				<div class="overlay-block" use:flyIn style="top: {block.row * lineHeight}px; left: {block.col * charWidth}px; width: {block.cols * charWidth}px; height: {block.rows * lineHeight}px;">
					<PortalTile
						id={block.id}
						name={info.name}
						url={info.url}
						screenshot={info.screenshot}
						mobileScreenshot={info.mobileScreenshot}
						color={info.color}
						onclick={(rect) => handleTileClick(info, rect)}
					/>
				</div>
			{/if}
		{/each}

		<!-- Inline form inputs -->
		<form id="grid-contact-form" class="form-inputs-layer">
			<input type="hidden" name="access_key" value="6b5ed4bf-68a0-45cc-9b44-f89d78af8a94" />
			<input type="hidden" name="subject" value="New contact from milanrother.com" />
			<input type="hidden" name="from_name" value="Website Contact Form" />

			{#if formFieldMap.has('field-name')}
				{@const f = formFieldMap.get('field-name')!}
				<input
					type="text" name="name" required autocomplete="name"
					placeholder="your name"
					class="grid-input"
					style="top: {f.row * lineHeight}px; left: {f.col * charWidth}px; width: {f.width * charWidth}px; height: {lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px;"
				/>
			{/if}
			{#if formFieldMap.has('field-email')}
				{@const f = formFieldMap.get('field-email')!}
				<input
					type="email" name="email" required autocomplete="email"
					placeholder="you@example.com"
					class="grid-input"
					style="top: {f.row * lineHeight}px; left: {f.col * charWidth}px; width: {f.width * charWidth}px; height: {lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px;"
				/>
			{/if}
			{#if formFieldMap.has('field-subject')}
				{@const f = formFieldMap.get('field-subject')!}
				<input
					type="text" name="subject" required
					placeholder="what's this about?"
					class="grid-input"
					style="top: {f.row * lineHeight}px; left: {f.col * charWidth}px; width: {f.width * charWidth}px; height: {lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px;"
				/>
			{/if}
			{#if formFieldMap.has('field-message-1')}
				{@const f1 = formFieldMap.get('field-message-1')!}
				{@const f3 = formFieldMap.get('field-message-3')}
				<textarea
					name="message" required
					placeholder="tell me about your project..."
					class="grid-input grid-textarea"
					style="top: {f1.row * lineHeight}px; left: {f1.col * charWidth}px; width: {f1.width * charWidth}px; height: {(f3 ? f3.row - f1.row + 1 : 3) * lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px;"
				></textarea>
			{/if}
		</form>

		{#if formStatus === 'error'}
			<!-- Error shown near form area -->
		{/if}

		<!-- Clickable overlays -->
		{#each clickOverlays as overlay}
			{#if overlay.href}
				<a
					class="click-overlay"
					href={overlay.href}
					target="_blank"
					rel="noopener"
					aria-label={overlay.label}
					style="top: {overlay.row * lineHeight}px; left: {overlay.col * charWidth}px; width: {overlay.length * charWidth}px; height: {lineHeight}px;"
				></a>
			{:else if overlay.scrollTo}
				<button
					class="click-overlay"
					aria-label={overlay.label}
					style="top: {overlay.row * lineHeight}px; left: {overlay.col * charWidth}px; width: {overlay.length * charWidth}px; height: {lineHeight}px;"
					onclick={() => scrollToSection(overlay.scrollTo!)}
				></button>
			{:else if overlay.action === 'submit-form'}
				<button
					class="click-overlay"
					aria-label={overlay.label}
					style="top: {overlay.row * lineHeight}px; left: {overlay.col * charWidth}px; width: {overlay.length * charWidth}px; height: {lineHeight}px;"
					disabled={formStatus === 'submitting'}
					onclick={handleFormSubmit}
				></button>
			{/if}
		{/each}
	{/if}

	{#if hoveredWord}
		<span
			class="hovered-word"
			aria-hidden="true"
			style="top: {hoveredWord.row * lineHeight}px; left: {hoveredWord.col * charWidth}px; font-size: {fontSize}px; line-height: {lineHeight}px;"
		>{hoveredWord.text}</span>
	{/if}
</div>

{#if expandingTile}
	<div
		class="portal-overlay {isExpanding ? 'expanding' : ''}"
		style={overlayStyle}
	>
		<picture>
			{#if expandingTile.mobileScreenshot}
				<source media="(max-width: 639px)" srcset={expandingTile.mobileScreenshot} />
			{/if}
			<img
				src={expandingTile.screenshot}
				alt="{expandingTile.name} preview"
				class="absolute inset-0 w-full h-full object-cover object-top"
			/>
		</picture>
	</div>
{/if}

<style>
	.code-rain-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
		white-space: pre;
		overflow: hidden;
		transition: opacity 0.3s;
		text-rendering: geometricPrecision;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.overlay-block {
		position: absolute;
		z-index: 2;
		overflow: hidden;
		display: grid;
		contain: paint;
		clip-path: inset(0);
	}

	.photo-tile {
		width: 100%;
		height: 100%;
		border-radius: 0.75rem;
		overflow: hidden;
		border: none;
		transition: transform 0.15s ease-out, box-shadow 0.3s;
		will-change: transform;
	}

	.photo-tile:hover {
		box-shadow: 0 8px 30px rgba(0, 217, 192, 0.2);
	}

	.photo-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
		caret-color: #00d9c0;
		z-index: 5;
	}

	.grid-input::placeholder {
		color: rgba(240, 239, 233, 0.15);
	}

	.grid-input:focus {
		background: rgba(0, 217, 192, 0.05);
	}

	.grid-textarea {
		resize: none;
	}

	.click-overlay {
		position: absolute;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		z-index: 5;
		display: block;
		font: inherit;
	}

	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
