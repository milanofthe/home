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
	// Gate the grid reveal on the web font so the first paint uses real metrics.
	let fontsReady = false;
	let dynamicSections = $state<ContentSection[] | undefined>(undefined);

	// Tile data for individual embedded blocks
	interface TileInfo {
		name: string;
		url: string;
		screenshot: string;
		color: 'pathsim' | 'pysimhub' | 'rapidpassives' | 'scidata' | 'fastsim' | 'rslab' | 'thesisos' | 'whatsmytraffic';
		themeParam?: boolean;
		fit?: 'cover' | 'contain';
		background?: string;
	}

	const tileInfo: Record<string, TileInfo> = {
		'pathsim-org': { name: 'PathSim', url: 'https://pathsim.org', screenshot: '/screenshots/pathsim-org.png', color: 'pathsim' },
		'docs-pathsim-org': { name: 'Documentation', url: 'https://docs.pathsim.org', screenshot: '/screenshots/docs-pathsim-org.png', color: 'pathsim' },
		'view-pathsim-org': { name: 'PathView', url: 'https://view.pathsim.org', screenshot: '/screenshots/view-pathsim-org.png', color: 'pathsim' },
		'pysimhub-io': { name: 'PySimHub', url: 'https://pysimhub.io', screenshot: '/screenshots/pysimhub-io.png', color: 'pysimhub' },
		'pysimhub-pathsim': { name: 'Project Page', url: 'https://pysimhub.io/projects/pathsim/', screenshot: '/screenshots/pysimhub-pathsim.png', color: 'pysimhub' },
		'rapidpassives-org': { name: 'RapidPassives', url: 'https://rapidpassives.org', screenshot: '/screenshots/rapidpassives-org.png', color: 'rapidpassives', themeParam: false },
		'rapidmom-mesh': { name: 'Transformer Mesh', url: 'mailto:rapidmom@milanrother.com', screenshot: '/images/rapidmom-mesh.png', color: 'rapidpassives', themeParam: false, fit: 'contain' },
		'rapidmom-current': { name: 'Current Density', url: 'mailto:rapidmom@milanrother.com', screenshot: '/images/rapidmom-current.png', color: 'rapidpassives', themeParam: false, fit: 'contain' },
		'rapidfem-editor': { name: 'Iris Filter', url: 'https://fem.rapidpassives.org/notebook?example=fd_iris_filter', screenshot: '/screenshots/rapidfem-editor.png', color: 'rapidpassives', themeParam: false },
		'rapidmesh-site': { name: 'RapidMesh', url: 'https://mesh.rapidpassives.org', screenshot: '/screenshots/rapidmesh-site.png', color: 'rapidpassives', themeParam: false },
		'rapidmesh-resonator': { name: 'Dielectric Resonator', url: 'https://mesh.rapidpassives.org', screenshot: '/images/rapidmesh-resonator.png', color: 'rapidpassives', themeParam: false, fit: 'contain' },
		'scidata-io': { name: 'SciData', url: 'https://scidata.io', screenshot: '/screenshots/scidata-io.png', color: 'scidata', themeParam: false },
		'scidata-app': { name: 'Canvas', url: 'https://scidata.io/app?template=paper-ryegrass-drc', screenshot: '/screenshots/scidata-app.png', color: 'scidata', themeParam: false },
		'fastsim-org': { name: 'FastSim', url: 'https://fast.pathsim.org', screenshot: '/screenshots/fastsim-org.png', color: 'fastsim' },
		'fastsim-casadi': { name: 'Performance Comparison', url: 'https://fast.pathsim.org', screenshot: '/images/fastsim-casadi-cold.png', color: 'fastsim', fit: 'contain', background: '#08080c' },
		'rslab-h2h': { name: 'vs faer & MKL PARDISO', url: 'https://github.com/milanofthe/rslab', screenshot: '/images/rslab-h2h-ldlt.png', color: 'rslab', themeParam: false, fit: 'contain', background: '#08080c' },
		'rslab-memory': { name: 'A-priori Memory Estimate', url: 'https://github.com/milanofthe/rslab', screenshot: '/images/rslab-memory-estimate.png', color: 'rslab', themeParam: false, fit: 'contain', background: '#08080c' },
		'thesisos-landing': { name: 'Landing', url: 'https://thesisos.io', screenshot: '/screenshots/thesisos-landing.png', color: 'thesisos', themeParam: false },
		'thesisos-graph': { name: 'Citation Graph', url: 'https://thesisos.io/graph?root=cb35ff8e-d0f5-437c-9528-89307638622a', screenshot: '/screenshots/thesisos-graph.png', color: 'thesisos', themeParam: false },
		'whatsmytraffic-landing': { name: 'WhatsMyTraffic', url: 'https://whatsmytraffic.com', screenshot: '/screenshots/whatsmytraffic-landing.png', color: 'whatsmytraffic', themeParam: false }
	};

	// Video tile data
	interface VideoInfo {
		name: string;
		src: string;
		color: 'pathsim' | 'pysimhub' | 'rapidpassives';
	}

	const videoInfo: Record<string, VideoInfo> = {
		'pathview-trailer': { name: 'PathView Demo', src: '/videos/PathView-Trailer-Thumbnail-2026-01-29.mp4', color: 'pathsim' }
	};

	// Contact form state
	let formStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let formMessage = $state('');

	// Form field positions from layout
	let formFieldMap = $derived.by(() => {
		if (!gridLayout) return new Map<string, FormFieldPosition>();
		const map = new Map<string, FormFieldPosition>();
		for (const f of gridLayout.formFields) {
			map.set(f.id, f);
		}
		return map;
	});

	const CONTACT_ACTION = 'https://whatsmytraffic.com/f/dekijnkgbvrk';

	async function handleFormSubmit() {
		const form = document.getElementById('grid-contact-form') as HTMLFormElement;
		if (!form) return;

		// Validate inline, in the page's own style. The native browser
		// validation popover is an OS-styled box that clashes with the grid,
		// and the [ SEND MESSAGE ] button sits outside <form> anyway — so
		// constraint checks run here and report through the status line.
		const field = (name: string) => {
			const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
			return (el?.value ?? '').trim();
		};
		if (!field('name') || !field('email') || !field('subject') || !field('message')) {
			formStatus = 'error';
			formMessage = '> all fields are required';
			return;
		}
		// type="email" still accepts "a@b" — insist on a domain with a dot.
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field('email'))) {
			formStatus = 'error';
			formMessage = '> that email address looks off';
			return;
		}

		formStatus = 'submitting';
		formMessage = '> sending message...';
		const formData = new FormData(form);
		// JSON, not multipart/form-data: Formspark currently rejects
		// multipart bodies with `formspark-status: empty` and drops the
		// submission, even though it answers 200.
		const payload: Record<string, string> = {};
		for (const [key, value] of formData.entries()) {
			payload[key] = typeof value === 'string' ? value : '';
		}
		try {
			const response = await fetch(CONTACT_ACTION, {
				method: 'POST',
				body: JSON.stringify(payload),
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			});
			if (response.ok) {
				formStatus = 'success';
				formMessage = '> message sent — talk soon';
				form.reset();
			} else {
				formStatus = 'error';
				formMessage = '> send failed — email info@milanrother.com';
			}
		} catch {
			formStatus = 'error';
			formMessage = '> send failed — email info@milanrother.com';
		}
	}

	// Clears a stale status message as soon as the user edits a field.
	function handleFormInput() {
		if (formStatus === 'success' || formStatus === 'error') {
			formStatus = 'idle';
			formMessage = '';
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
		{ text: '[ View the Stack ]', types: ['cta'], scrollTo: 'projects' },
		{ text: '[ SEND MESSAGE -> ]', types: ['cta'], action: 'submit-form' },
		{ text: 'Impressum', types: ['footer'], href: '/impressum/' },
		{ text: 'Datenschutz', types: ['footer'], href: '/datenschutz/' },
		{ text: 'info@milanrother.com', types: ['link', 'link-sane'], href: 'mailto:info@milanrother.com' },
		{ text: 'rapidmom@milanrother.com', types: ['link-rapidpassives'], href: 'mailto:rapidmom@milanrother.com' },
		{ text: 'info@pathsim.org', types: ['link-fastsim'], href: 'mailto:info@pathsim.org' },
		{ text: 'Email', types: ['footer'], href: 'mailto:info@milanrother.com' },
		{ text: 'GitHub', types: ['link', 'footer'], href: 'https://github.com/milanofthe' },
		{ text: 'LinkedIn', types: ['link', 'footer', 'content'], href: 'https://linkedin.com/in/milan-rother-648474183' },
		{ text: 'X', types: ['link', 'footer'], href: 'https://x.com/Milan1115268' },
		{ text: 'RapidPassives', types: ['link-rapidpassives'], scrollTo: 'rapidpassives' },
		{ text: 'RapidFEM', types: ['link-rapidpassives'], scrollTo: 'rapidfem' },
		{ text: 'RapidMoM', types: ['link-rapidpassives'], scrollTo: 'rapidmom' },
		{ text: 'SANE', types: ['link-sane'], scrollTo: 'sane' },
		{ text: 'FastSim', types: ['link-fastsim'], scrollTo: 'fastsim' },
		{ text: 'PathSim', types: ['link-pathsim'], scrollTo: 'pathsim' },
		{ text: 'github.com/milanofthe/rslab', types: ['link-rslab'], href: 'https://github.com/milanofthe/rslab' },
		{ text: 'github.com/milanofthe/rapidmesh', types: ['link-rapidpassives'], href: 'https://github.com/milanofthe/rapidmesh' },
		{ text: 'rapidpassives.org', types: ['link-rapidpassives'], href: 'https://rapidpassives.org' },
		{ text: 'fem.rapidpassives.org', types: ['link-rapidpassives'], href: 'https://fem.rapidpassives.org' },
		{ text: 'mesh.rapidpassives.org', types: ['link-rapidpassives'], href: 'https://mesh.rapidpassives.org' },
		{ text: 'scidata.io', types: ['link-scidata'], href: 'https://scidata.io' },
		{ text: 'fast.pathsim.org', types: ['link-fastsim'], href: 'https://fast.pathsim.org' },
		{ text: 'pathsim.org', types: ['link-pathsim'], href: 'https://pathsim.org' },
		{ text: 'view.pathsim.org', types: ['link-pathsim'], href: 'https://view.pathsim.org' },
		{ text: 'pysimhub.io', types: ['link-pysimhub'], href: 'https://pysimhub.io' },
		{ text: 'thesisos.io', types: ['link-thesisos'], href: 'https://thesisos.io' },
		{ text: 'whatsmytraffic.com', types: ['link-whatsmytraffic'], href: 'https://whatsmytraffic.com' },
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

	// The SEND MESSAGE overlay — used to anchor the status line below it.
	let submitOverlay = $derived(clickOverlays.find((o) => o.action === 'submit-form'));

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

		// Publish the exact width of the centered content column so the nav bar's
		// inner content container can align its edges to the grid content.
		// Mirrors the caps in computeGridLayout: paragraphs wrap to <=80, headings
		// and side-by-side tile rows span up to 114, everything capped by cols-4.
		const contentCols = Math.min(cols - 4, 114);
		document.documentElement.style.setProperty('--grid-content-width', `${contentCols * charWidth}px`);

		if (!gridLayout || gridLayout.cols !== cols) {
			gridLayout = computeGridLayout(cols, dynamicSections);
		}

		// Hold the reveal until the web font is ready. Revealing on fallback
		// metrics and then swapping to JetBrains Mono relayouts the whole grid —
		// the single biggest source of first-load jank. Once fonts.ready fires
		// (fast, because the primary subset is preloaded) the grid is measured
		// with real metrics and revealed without a reflow.
		tick().then(() => {
			if (!mounted && fontsReady) mounted = true;
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
		// Load GDS viewer web component
		if (!document.querySelector('script[src*="gds-viewer"]')) {
			const s = document.createElement('script');
			s.src = 'https://rapidpassives.org/embed/gds-viewer.js';
			document.head.appendChild(s);
		}
		// Load FEM viewer web component
		if (!document.querySelector('script[src*="fem-viewer"]')) {
			const s = document.createElement('script');
			s.src = 'https://fem.rapidpassives.org/embed/fem-viewer.js';
			document.head.appendChild(s);
		}
		computeLayout();

		// Reveal + re-measure once the web font is ready (corrects char ratio if a
		// fallback was measured). The timeout is a safety net so the grid still
		// appears even if fonts.ready never resolves.
		const markFontsReady = () => {
			if (fontsReady) return;
			fontsReady = true;
			computeLayout();
			if (!mounted) mounted = true;
		};
		document.fonts.ready.then(markFontsReady);
		setTimeout(markFontsReady, 1200);

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
	<p>I build the simulation stack for electronics — fields, circuits, systems. State-of-the-art numerics, fast engines, and the interfaces to use them.</p>
	<section id="about">
		<h2>Who am I</h2>
		<p>Simulation engineer. I build numerical software and solve modeling problems for teams working on complex physical systems.</p>
		<p>M.Sc. Electrical Engineering. Background in numerical methods, system modeling, electromagnetics, and compact modeling for physical systems.</p>
		<p>I built <a href="https://pathsim.org">PathSim</a> because modeling software has a long history of vendor lock-in and clunky UX. Pure Python, open source, designed from first principles. JOSS-published, with collaborators from MIT Plasma Science &amp; Fusion Center, CEA, scikit-rf, and JSBSim.</p>
		<p>Now I'm bringing it all together into one vertically integrated stack: EM field solvers (RapidFEM, RapidMoM), a symbolic analog circuit engine (SANE), and system-level simulation (PathSim, FastSim). One architecture — SSA-style compute graphs at the heart of the engines, Rust cores, Python APIs, browser interfaces.</p>
	</section>
	<section id="projects">
		<h2>The Stack</h2>
		<p>One vertically integrated simulation stack for electronics — from electromagnetic fields to circuits to systems. Open source where it builds trust, source-available and commercially licensed where it creates value. Free for academia.</p>
		<h3>Systems</h3>
		<p><a href="https://pathsim.org">PathSim</a> — pure-Python system simulation framework, MIT open source, JOSS-published. <a href="https://fast.pathsim.org">FastSim</a> — drop-in Rust replacement, 50-100x faster, JIT, autodiff, FMI 3.0, C99 code generation. <a href="https://view.pathsim.org">PathView</a> — browser-based visual model editor.</p>
		<h3>Circuits</h3>
		<p>SANE — Symbolic Analog Network Engine. Symbolic and numeric circuit analysis: DC, transient, AC, poles/zeros, noise, harmonic balance, exact sensitivities. SPICE and Verilog-A frontends. Validated against ngspice and Xyce.</p>
		<h3>Fields</h3>
		<p>RapidMoM — 2.5D Method-of-Moments solver for planar RF passives on layered substrates. <a href="https://fem.rapidpassives.org">RapidFEM</a> — Maxwell FEM solver in Rust with frequency-domain and time-domain backends. <a href="https://rapidpassives.org">RapidPassives</a> — browser-based RFIC passive layout generation.</p>
		<h3>Foundations</h3>
		<p><a href="https://github.com/milanofthe/rslab">RSLAB</a> — sparse direct solver in pure Rust. <a href="https://github.com/milanofthe/rapidmesh">RapidMesh</a> — tetrahedral mesh generator for 3D electromagnetic FEM.</p>
	</section>
	<section id="other">
		<h2>Other Projects</h2>
		<p><a href="https://pysimhub.io">PySimHub</a>, <a href="https://scidata.io">SciData</a>, <a href="https://thesisos.io">ThesisOS</a>, <a href="https://whatsmytraffic.com">WhatsMyTraffic</a>.</p>
	</section>
	<section id="services">
		<h2>Services</h2>
		<p>I help engineering teams build and scale simulation infrastructure. Available for consulting, development, commercial licensing, and training.</p>
		<p>Simulink migration, custom simulation development, digital twin and co-simulation architecture, simulation audit, training and workshops.</p>
	</section>
	<section id="contact">
		<h2>Get in Touch</h2>
		<p>Have a project in mind or want to discuss your simulation challenges?</p>
		<p>Contact: <a href="mailto:info@milanrother.com">info@milanrother.com</a></p>
	</section>
</main>

<!-- Character grid + overlays -->
<div bind:this={containerEl} class="code-rain-container" class:opacity-0={!mounted}
	style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: {fontSize}px; line-height: {lineHeight}px; letter-spacing: {letterSpacingPx}px;">
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
						<img src="/images/headshot_milan.webp" alt="Milan Rother" class="photo-img" decoding="async" />
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
			{:else if block.id === 'rapidpassives-transformer'}
				<div class="overlay-block" use:tileReveal style="top: {block.row * lineHeight}px; left: {block.col * charWidth}px; width: {block.cols * charWidth}px; height: {block.rows * lineHeight}px;">
					<div style="width: 100%; height: 100%; border-radius: 8px; overflow: hidden;">
						<gds-viewer
							src="https://rapidpassives.org/embed/demo.gds"
							rotate
							explode
							width="100%"
							height="100%"
							speed="1"
							phi="30"
							preset="sky130"
						></gds-viewer>
					</div>
				</div>
			{:else if block.id === 'sane-app' || block.id === 'sane-graph'}
				{@const saneUrl = block.id === 'sane-app'
					? 'https://sane.milanrother.com/?theme=dark'
					: 'https://sane.milanrother.com/#graph?theme=dark'}
				<div class="overlay-block" use:tileReveal style="top: {block.row * lineHeight}px; left: {block.col * charWidth}px; width: {block.cols * charWidth}px; height: {block.rows * lineHeight}px;">
					<!-- live app, rendered at 2x and scaled down for an overview look;
					     the iframe is inert (pointer-events none) — the tile is a link -->
					<a class="sane-tile" href={saneUrl} target="_blank" rel="noopener" aria-label="Open SANE">
						<iframe class="sane-frame" src={saneUrl} title="SANE — live" loading="lazy" tabindex="-1"></iframe>
					</a>
				</div>
			{:else if block.id === 'rapidfem-microstrip'}
				<div class="overlay-block" use:tileReveal style="top: {block.row * lineHeight}px; left: {block.col * charWidth}px; width: {block.cols * charWidth}px; height: {block.rows * lineHeight}px;">
					<div style="width: 100%; height: 100%; border-radius: 8px; overflow: hidden;">
						<fem-viewer
							src="https://fem.rapidpassives.org/demo/fd_microstrip_line.json"
							rotate
							cycle
							speed="0.6"
							field-samples="5000"
							field-mode="log"
							width="100%"
							height="100%"
						></fem-viewer>
					</div>
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
						themeParam={info.themeParam}
						fit={info.fit}
						background={info.background}
					/>
				</div>
			{/if}
		{/each}

		<!-- Inline form inputs -->
		<form id="grid-contact-form" class="form-inputs-layer" oninput={handleFormInput} onsubmit={(e) => e.preventDefault()} novalidate>
			<!-- `_gotcha` is the honeypot: bots fill it, real users don't; a
			     non-empty value flags the submission as spam server-side. -->
			<input type="text" name="_gotcha" value="" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;" />

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

		<!-- Submission status: typed into the grid like a terminal response -->
		{#if submitOverlay && formMessage}
			{#key formMessage}
				<div
					class="form-status form-status-{formStatus}"
					role="status"
					aria-live="polite"
					style="top: {(submitOverlay.row + 1) * lineHeight}px; font-size: {fontSize}px; line-height: {lineHeight}px; letter-spacing: {letterSpacingPx}px;"
				>
					<span
						class="form-status-text"
						style="animation-duration: {Math.max(formMessage.length * 16, 200)}ms; animation-timing-function: steps({formMessage.length});"
					>{formMessage}</span><span class="form-status-cursor" aria-hidden="true">█</span>
				</div>
			{/key}
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
		box-shadow: 0 8px 30px rgba(150, 149, 145, 0.2);
	}

	.photo-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* SANE portal tiles: the live app in an inert iframe behind a link.
	   Backdrop matches the app's dark theme --bg so loading reads seamless. */
	.sane-tile {
		display: block;
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #16181c;
		transition: box-shadow 0.3s;
	}

	.sane-tile:hover {
		box-shadow: 0 8px 30px rgba(78, 149, 217, 0.3);
	}

	.sane-frame {
		position: absolute;
		top: 0;
		left: 0;
		width: 200%;
		height: 200%;
		transform: scale(0.5);
		transform-origin: top left;
		border: 0;
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
		left: 0;
		width: 100%;
		text-align: center;
		white-space: pre;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		z-index: 5;
		pointer-events: none;
	}

	/* Reuse the grid's signature left-to-right typewriter wipe */
	.form-status-text {
		display: inline-block;
		animation-name: type-reveal;
		animation-fill-mode: both;
	}

	.form-status-cursor {
		animation: status-blink 1.1s steps(1, end) infinite;
	}

	.form-status-submitting {
		color: #969591;
	}

	.form-status-success {
		color: #969591;
	}

	.form-status-error {
		color: #f87171;
	}

	@keyframes status-blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.form-status-text,
		.form-status-cursor {
			animation: none;
		}
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
