<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { computeGridLayout, type GridLayout, type FormFieldPosition, type CellType, type ContentSection } from '$lib/layout/gridLayout';
	import { buildContentSections, type GitHubStats } from '$lib/layout/contentRegions';
	import CharacterGrid from './CharacterGrid.svelte';
	import PortalTile from './PortalTile.svelte';
	import VideoTile from './VideoTile.svelte';

	const STATS_URL = 'https://raw.githubusercontent.com/milanofthe/milanofthe.github.io/main/src/lib/data/github-stats.json';

	let containerEl: HTMLDivElement;

	let charWidth = $state(0);
	let fontSize = $state(0);
	let lineHeight = $state(0);
	let letterSpacingPx = $state(0);
	let gridLayout = $state.raw<GridLayout | null>(null);
	let mounted = $state(false);
	let dynamicSections = $state<ContentSection[] | undefined>(undefined);

	// Tile data for individual embedded blocks
	interface TileInfo {
		name: string;
		url: string;
		screenshot: string;
		color: 'pathsim' | 'pysimhub';
	}

	const tileInfo: Record<string, TileInfo> = {
		'pathsim-org': { name: 'PathSim', url: 'https://pathsim.org', screenshot: '/screenshots/pathsim-org.png', color: 'pathsim' },
		'docs-pathsim-org': { name: 'Documentation', url: 'https://docs.pathsim.org', screenshot: '/screenshots/docs-pathsim-org.png', color: 'pathsim' },
		'view-pathsim-org': { name: 'PathView', url: 'https://view.pathsim.org', screenshot: '/screenshots/view-pathsim-org.png', color: 'pathsim' },
		'pysimhub-io': { name: 'PySimHub', url: 'https://pysimhub.io', screenshot: '/screenshots/pysimhub-io.png', color: 'pysimhub' }
	};

	// Video tile data
	interface VideoInfo {
		name: string;
		src: string;
		color: 'pathsim' | 'pysimhub';
	}

	const videoInfo: Record<string, VideoInfo> = {
		'pathview-trailer': { name: 'PathView Demo', src: '/videos/PathView-Trailer-Thumbnail-2026-01-29.mp4', color: 'pathsim' }
	};

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
		{ text: 'Impressum', types: ['footer'], href: '/impressum/' },
		{ text: 'Datenschutz', types: ['footer'], href: '/datenschutz/' },
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

		// Fixed font size — smaller on mobile so text isn't squished
		fontSize = vw < 640 ? 11 : 14;

		// Measure the font's natural advance width at 14px
		const probe = document.createElement('span');
		probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;letter-spacing:0px';
		probe.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
		probe.style.fontSize = `${fontSize}px`;
		probe.textContent = 'X';

		const probeParent = containerEl || document.body;
		probeParent.appendChild(probe);
		const advanceWidth = probe.getBoundingClientRect().width;
		probeParent.removeChild(probe);

		// Dynamic column count from viewport width, min 40
		const cols = Math.max(40, Math.floor(vw / advanceWidth));

		// Exact pixel width per column (fills viewport edge-to-edge)
		charWidth = vw / cols;

		// letter-spacing correction: forces each character to occupy exactly charWidth pixels
		letterSpacingPx = charWidth - advanceWidth;

		lineHeight = Math.ceil(fontSize * 1.5);

		if (!gridLayout || gridLayout.cols !== cols) {
			gridLayout = computeGridLayout(cols, dynamicSections);
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

	function tileReveal(node: HTMLElement) {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return { destroy() {} };
		}

		const w = node.offsetWidth;
		const h = node.offsetHeight;
		const cols = Math.round(w / charWidth);
		const rows = Math.round(h / lineHeight);
		const total = cols * rows;

		// Lazy load: strip video src, preload early, play on reveal
		const videoEls = node.querySelectorAll<HTMLVideoElement>('video');
		for (const el of videoEls) {
			el.dataset.lazySrc = el.src;
			el.removeAttribute('src');
			el.pause();
		}

		// Canvas overlay filled with page background, hides the content
		const canvas = document.createElement('canvas');
		const dpr = window.devicePixelRatio || 1;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.cssText = `position:absolute;top:0;left:0;width:${w}px;height:${h}px;z-index:1;pointer-events:none`;
		const ctx = canvas.getContext('2d')!;
		ctx.scale(dpr, dpr);
		ctx.fillStyle = '#0f0f0f';
		ctx.fillRect(0, 0, w, h);
		node.appendChild(canvas);

		// Shuffled cell indices for random patch reveal
		const order = Array.from({ length: total }, (_, i) => i);
		for (let i = total - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[order[i], order[j]] = [order[j], order[i]];
		}

		// Preload observer: start fetching videos when tile is ~800px from viewport
		const preloadObserver = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					preloadObserver.unobserve(entry.target);
					for (const el of videoEls) {
						if (el.dataset.lazySrc) {
							el.src = el.dataset.lazySrc;
							el.preload = 'auto';
							el.load();
							delete el.dataset.lazySrc;
						}
					}
				}
			}
		}, { rootMargin: '800px' });
		preloadObserver.observe(node);

		// Reveal observer: start animation and play video when tile is visible
		const revealObserver = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					revealObserver.unobserve(entry.target);

					for (const el of videoEls) {
						el.play();
					}

					let i = 0;
					const perFrame = Math.max(1, Math.ceil(total / 80));
					(function step() {
						for (let n = 0; n < perFrame && i < total; n++, i++) {
							const c = order[i] % cols;
							const r = (order[i] / cols) | 0;
							ctx.clearRect(c * charWidth, r * lineHeight, charWidth + 1, lineHeight + 1);
						}
						if (i < total) requestAnimationFrame(step);
						else canvas.remove();
					})();
				}
			}
		}, { threshold: 0.1 });
		revealObserver.observe(node);

		return {
			destroy() {
				preloadObserver.disconnect();
				revealObserver.disconnect();
				canvas.remove();
			}
		};
	}

	onMount(() => {
		computeLayout();

		// Re-measure once fonts are ready (corrects char ratio if fallback was used)
		document.fonts.ready.then(() => computeLayout());

		// Fetch latest GitHub stats and rebuild grid with fresh data
		fetch(STATS_URL, { cache: 'no-store' })
			.then(r => r.ok ? r.json() : null)
			.then(data => {
				if (!data?.current) return;
				dynamicSections = buildContentSections(data.current as GitHubStats);
				// Force grid recompute with new sections
				gridLayout = null;
				computeLayout();
			})
			.catch(() => {});

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

		window.addEventListener('resize', computeLayout);
		document.addEventListener('click', handleNavClick);
		return () => {
			window.removeEventListener('resize', computeLayout);
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
				<div class="overlay-block" use:tileReveal style="top: {block.row * lineHeight}px; left: {block.col * charWidth}px; width: {block.cols * charWidth}px; height: {block.rows * lineHeight}px;">
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
			{:else if videoInfo[block.id]}
				{@const info = videoInfo[block.id]}
				<div class="overlay-block" use:tileReveal style="top: {block.row * lineHeight}px; left: {block.col * charWidth}px; width: {block.cols * charWidth}px; height: {block.rows * lineHeight}px;">
					<VideoTile
						id={block.id}
						name={info.name}
						src={info.src}
						color={info.color}
					/>
				</div>
			{:else if tileInfo[block.id]}
				{@const info = tileInfo[block.id]}
				<div class="overlay-block" use:tileReveal style="top: {block.row * lineHeight}px; left: {block.col * charWidth}px; width: {block.cols * charWidth}px; height: {block.rows * lineHeight}px;">
					<PortalTile
						id={block.id}
						name={info.name}
						url={info.url}
						screenshot={info.screenshot}
						color={info.color}
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
					target={overlay.href.startsWith('/') ? undefined : '_blank'}
					rel={overlay.href.startsWith('/') ? undefined : 'noopener'}
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
