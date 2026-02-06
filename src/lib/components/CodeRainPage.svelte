<script lang="ts">
	import { onMount } from 'svelte';
	import { computeGridLayout, getBreakpointConfig, type GridLayout, type EmbeddedBlockPosition, type FormFieldPosition, type CellType } from '$lib/layout/gridLayout';
	import CharacterGrid from './CharacterGrid.svelte';
	import PortalGrid from './PortalGrid.svelte';

	let containerEl: HTMLDivElement;

	let charWidth = $state(0);
	let fontSize = $state(0);
	let lineHeight = $state(0);
	let gridLayout = $state.raw<GridLayout | null>(null);
	let mounted = $state(false);

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

	// Derived block positions
	let blocks = $derived.by(() => {
		if (!gridLayout) return new Map<string, EmbeddedBlockPosition>();
		const map = new Map<string, EmbeddedBlockPosition>();
		for (const b of gridLayout.embeddedBlocks) {
			map.set(b.id, b);
		}
		return map;
	});

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

	function measureCharRatio(): number {
		const testSize = 16;
		const span = document.createElement('span');
		span.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
		span.style.fontSize = `${testSize}px`;
		span.style.position = 'absolute';
		span.style.visibility = 'hidden';
		span.style.whiteSpace = 'pre';
		span.textContent = 'X';
		document.body.appendChild(span);
		const ratio = span.getBoundingClientRect().width / testSize;
		document.body.removeChild(span);
		return ratio;
	}

	function computeLayout() {
		const vw = window.innerWidth;
		const config = getBreakpointConfig(vw);
		const ratio = measureCharRatio();
		charWidth = vw / config.cols;
		fontSize = charWidth / ratio;
		lineHeight = Math.ceil(fontSize * 1.5);
		// Only recompute grid when columns change (avoids destroying typewriter on fonts.ready)
		if (!gridLayout || gridLayout.cols !== config.cols) {
			gridLayout = computeGridLayout(config.cols);
		}
	}

	function scrollToSection(id: string) {
		if (!gridLayout) return;
		const anchor = gridLayout.sectionAnchors.find(a => a.id === id);
		if (anchor) {
			const y = anchor.row * lineHeight;
			window.scrollTo({ top: y - 60, behavior: 'smooth' });
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		containerEl.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
		containerEl.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
	}

	function handleMouseLeave() {
		if (!containerEl) return;
		containerEl.style.setProperty('--spotlight-x', '-9999px');
		containerEl.style.setProperty('--spotlight-y', '-9999px');
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
		mounted = true;

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

<!-- Character grid + embedded blocks -->
<div bind:this={containerEl} class="code-rain-container" class:opacity-0={!mounted} onmousemove={handleMouseMove} onmouseleave={handleMouseLeave}>
	{#if gridLayout}
		<CharacterGrid
			cells={gridLayout.cells}
			{fontSize}
			{lineHeight}
			{charWidth}
		/>

		<!-- Overlays positioned at embedded block rows -->
		{#if blocks.has('photo')}
			{@const b = blocks.get('photo')!}
			<div class="overlay-block" use:flyIn style="top: {b.row * lineHeight}px; left: {b.col * charWidth}px; width: {b.cols * charWidth}px; height: {b.rows * lineHeight}px;">
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
					<img src="/images/headshot_milan.png" alt="Milan Rother" class="photo-img" />
				</div>
			</div>
		{/if}

		{#if blocks.has('pathsim-tiles')}
			{@const b = blocks.get('pathsim-tiles')!}
			<div class="overlay-block" use:flyIn style="top: {b.row * lineHeight}px; left: {b.col * charWidth}px; width: {b.cols * charWidth}px; height: {b.rows * lineHeight}px;">
				<PortalGrid projects={[
					{ id: 'pathsim-org', name: 'PathSim', url: 'https://pathsim.org', screenshot: '/screenshots/pathsim-org.png', mobileScreenshot: '/screenshots/pathsim-org-mobile.png', color: 'pathsim' },
					{ id: 'docs-pathsim-org', name: 'Documentation', url: 'https://docs.pathsim.org', screenshot: '/screenshots/docs-pathsim-org.png', mobileScreenshot: '/screenshots/docs-pathsim-org-mobile.png', color: 'pathsim' },
					{ id: 'view-pathsim-org', name: 'PathView', url: 'https://view.pathsim.org', screenshot: '/screenshots/view-pathsim-org.png', mobileScreenshot: '/screenshots/view-pathsim-org-mobile.png', color: 'pathsim' }
				]} />
			</div>
		{/if}

		{#if blocks.has('pysimhub-tiles')}
			{@const b = blocks.get('pysimhub-tiles')!}
			<div class="overlay-block" use:flyIn style="top: {b.row * lineHeight}px; left: {b.col * charWidth}px; width: {b.cols * charWidth}px; height: {b.rows * lineHeight}px;">
				<PortalGrid projects={[
					{ id: 'pysimhub-io', name: 'PySimHub', url: 'https://pysimhub.io', screenshot: '/screenshots/pysimhub-io.png', mobileScreenshot: '/screenshots/pysimhub-io-mobile.png', color: 'pysimhub' }
				]} />
			</div>
		{/if}

		<!-- Inline form inputs positioned over form-field grid rows -->
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
</div>

<style>
	.code-rain-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
		transition: opacity 0.3s;
	}

	.overlay-block {
		position: absolute;
		z-index: 2;
	}

	.photo-tile {
		width: 100%;
		height: 100%;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 2px solid rgba(0, 217, 192, 0.15);
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
