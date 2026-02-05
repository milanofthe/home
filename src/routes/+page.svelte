<script lang="ts">
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Icons from '$lib/components/Icons.svelte';
	import PortalGrid from '$lib/components/PortalGrid.svelte';

	const STATS_URL = 'https://raw.githubusercontent.com/milanofthe/milanofthe.github.io/main/src/lib/data/github-stats.json';

	let animatedStars = $state(0);
	let animatedProjects = $state(0);

	function animateCount(from: number, to: number, duration: number, onUpdate: (val: number) => void) {
		const start = performance.now();
		const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

		function update(now: number) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const easedProgress = easeOutQuart(progress);
			const current = Math.round(from + (to - from) * easedProgress);
			onUpdate(current);

			if (progress < 1) {
				requestAnimationFrame(update);
			}
		}
		requestAnimationFrame(update);
	}

	onMount(async () => {
		try {
			const response = await fetch(STATS_URL, { cache: 'no-store' });
			if (response.ok) {
				const data = await response.json();
				// Animate the counters
				animateCount(0, data.current.pathsim.stars, 1500, (val) => animatedStars = val);
				animateCount(0, data.current.pysimhub.projects, 1500, (val) => animatedProjects = val);
			}
		} catch {
			// Keep default values on error
		}
	});

	// Contact form state
	let formStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formStatus = 'submitting';

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (data.success) {
				formStatus = 'success';
				form.reset();
			} else {
				formStatus = 'error';
			}
		} catch (err) {
			formStatus = 'error';
		}
	}

	const services = [
		{
			icon: 'code' as const,
			title: 'Model Development',
			description: 'Mathematical models that fit your data and pipeline. From differential equations to state-space representations.',
			items: ['System identification', 'Parameter estimation', 'Model order reduction', 'Validation']
		},
		{
			icon: 'zap' as const,
			title: 'Numerical Problem Solving',
			description: 'Fixing stability, convergence, and performance issues. Making slow models fast and unstable models robust.',
			items: ['Stiff system handling', 'Solver selection', 'Multirate integration', 'Parallelization']
		},
		{
			icon: 'layers' as const,
			title: 'Digital Twin Integration',
			description: 'Connecting multiple models into unified simulations. Co-simulation of FEM, circuit, and system-level models.',
			items: ['Multi-physics coupling', 'Co-simulation', 'Real-time integration', 'API design']
		}
	];

	// PathSim tiles with animated stats
	let pathsimTiles = $derived([
		{ icon: 'cpu' as const, title: 'Hot-Swappable', caption: 'Runtime changes' },
		{ icon: 'layers' as const, title: 'Hierarchical', caption: 'Nested subsystems' },
		{ icon: 'chart' as const, title: 'Multi-Solver', caption: 'Adaptive integrators' },
		{ icon: 'zap' as const, title: 'Event Handling', caption: 'Zero-crossing detection' },
		{ icon: 'star' as const, title: `${animatedStars}+`, caption: 'GitHub Stars' }
	]);

	// PySimHub tiles with animated stats
	let pysimhubTiles = $derived([
		{ icon: 'layers' as const, title: 'Browse', caption: 'Simulation libraries' },
		{ icon: 'code' as const, title: 'Submit', caption: 'Your projects' },
		{ icon: 'users' as const, title: 'Community', caption: 'Open collaboration' },
		{ icon: 'github' as const, title: 'Open Source', caption: 'MIT licensed' },
		{ icon: 'star' as const, title: `${animatedProjects}`, caption: 'Featured Projects' }
	]);
</script>

<Navigation />

<main class="bg-charcoal min-h-screen">
	<!-- Hero Section -->
	<section class="relative min-h-screen flex items-center">
		<div class="max-w-6xl mx-auto px-6 py-32 w-full">
			<div class="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
				<!-- Photo -->
				<div class="flex-shrink-0">
					<div class="w-48 h-48 lg:w-56 lg:h-56 rounded-full border-2 border-cream/10 overflow-hidden">
						<img
							src="/images/headshot_milan.png"
							alt="Milan Rother"
							class="w-full h-full object-cover"
						/>
					</div>
				</div>

				<!-- Intro -->
				<div class="text-center lg:text-left">
					<p class="section-label mb-4">Dynamical Systems & Simulation</p>
					<h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cream leading-tight mb-6">
						Milan Rother
					</h1>
					<p class="text-lg sm:text-xl text-cream/70 leading-relaxed mb-8 max-w-2xl">
						Building tools and infrastructure for numerical modeling and simulation. Creator of <a href="https://pathsim.org" class="link">PathSim</a>. Currently consulting for MIT on nuclear fusion fuel-cycle modeling.
					</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
						<a href="#contact" class="btn-primary">
							Get in Touch
							<Icons name="arrow-right" class="w-4 h-4" />
						</a>
						<a href="#projects" class="btn-secondary">
							View Projects
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- About Section -->
	<section id="about" class="py-24 lg:py-32 border-t border-cream/5">
		<div class="max-w-4xl mx-auto px-6">
			<div class="text-center mb-8">
				<h2 class="font-display text-3xl sm:text-4xl font-bold text-teal uppercase">
					Who am I
				</h2>
			</div>
			<div class="space-y-6 text-lg text-cream/70 leading-relaxed">
				<p>
					I'm a research engineer and PhD candidate in electrical engineering. I build simulation software and solve numerical problems for teams working on complex physical systems.
				</p>
				<p>
					Currently consulting for <span class="text-cream">MIT Plasma Science & Fusion Center</span> on nuclear fusion fuel-cycle modeling — building simulation infrastructure for systems that don't fit in commercial tools.
				</p>
				<p>
					Previously at TU Braunschweig, where I developed numerical methods for electrochemical sensors and EDA pipelines for cryogenic quantum applications, validated in silicon.
				</p>
				<p>
					I built <a href="https://pathsim.org" class="link">PathSim</a> because system modeling software has a long history of vendor lock-in and clunky UX. It's pure Python, open source, and designed from first principles. I also designed the documentation sites, landing pages, and <a href="https://view.pathsim.org" class="link">PathView</a> — the browser-based editor.
				</p>
			</div>

			<!-- Social links -->
			<div class="flex flex-wrap gap-4 mt-10 justify-center">
				<a
					href="https://github.com/milanofthe"
					target="_blank"
					rel="noopener"
					class="inline-flex items-center gap-2 text-cream/70 hover:text-teal transition-colors"
					aria-label="GitHub"
				>
					<Icons name="github" class="w-5 h-5" />
					<span>GitHub</span>
				</a>
				<a
					href="https://linkedin.com/in/milan-rother-648474183"
					target="_blank"
					rel="noopener"
					class="inline-flex items-center gap-2 text-cream/70 hover:text-teal transition-colors"
					aria-label="LinkedIn"
				>
					<Icons name="linkedin" class="w-5 h-5" />
					<span>LinkedIn</span>
				</a>
			</div>
		</div>
	</section>

	<!-- Services Section -->
	<section id="services" class="py-24 lg:py-32 border-t border-cream/5">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-16">
				<h2 class="font-display text-3xl sm:text-4xl font-bold text-teal uppercase mb-4">
					What I do
				</h2>
				<p class="text-lg text-cream/60 max-w-2xl mx-auto">
					Building tools and infrastructure for numerical and modeling software — from solvers and APIs to documentation and developer UX.
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-6">
				{#each services as service}
					<div class="card card-hover p-8 flex flex-col">
						<div class="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center mb-6">
							<Icons name={service.icon} class="w-6 h-6 text-teal" />
						</div>
						<h3 class="font-display text-xl font-semibold text-cream mb-3">{service.title}</h3>
						<p class="text-cream/60 leading-relaxed mb-6 flex-grow">{service.description}</p>
						<ul class="space-y-2">
							{#each service.items as item}
								<li class="flex items-center gap-2 text-sm text-cream/70">
									<Icons name="check" class="w-4 h-4 text-teal flex-shrink-0" />
									{item}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Projects Section -->
	<section id="projects" class="py-24 lg:py-32 border-t border-cream/5">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-16">
				<h2 class="font-display text-3xl sm:text-4xl font-bold text-teal uppercase mb-4">
					Projects
				</h2>
				<p class="text-lg text-cream/60 max-w-2xl mx-auto">
					Open-source tools for numerical modeling and simulation. Click to explore.
				</p>
			</div>

			<!-- Portal Grid -->
			<div class="mb-20">
				<PortalGrid />
			</div>

			<!-- PathSim Details -->
			<div class="text-center mb-20">
				<!-- Logos -->
				<div class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-8">
					<img src="/images/pathsim_logo.png" alt="PathSim" class="h-20 w-auto" />
					<span class="text-cream/30 text-2xl font-light hidden sm:block">+</span>
					<img src="/images/pathview_logo.png" alt="PathView" class="h-20 w-auto" />
				</div>

				<p class="text-lg text-cream/70 leading-relaxed mb-8 max-w-2xl mx-auto">
					A minimal-dependency Python framework for modeling and simulating complex dynamical systems using block diagrams. Applied and experimentally validated for nuclear fusion fuel-cycle modeling at MIT Plasma Science & Fusion Center.
				</p>

				<!-- Tiles -->
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
					{#each pathsimTiles as tile}
						<div class="text-center p-6 card border-pathsim/10">
							<div class="w-10 h-10 rounded-lg bg-pathsim/10 flex items-center justify-center mb-3 mx-auto">
								<Icons name={tile.icon} class="w-5 h-5 text-pathsim" />
							</div>
							<div class="font-display font-semibold text-cream">{tile.title}</div>
							<div class="text-xs text-cream/50 mt-1">{tile.caption}</div>
						</div>
					{/each}
				</div>

				<!-- Links -->
				<div class="flex flex-wrap gap-4 justify-center">
					<a
						href="https://pathsim.org"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 text-cream/70 hover:text-pathsim transition-colors"
					>
						<Icons name="globe" class="w-5 h-5" />
						<span>Homepage</span>
					</a>
					<a
						href="https://docs.pathsim.org"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 text-cream/70 hover:text-pathsim transition-colors"
					>
						<Icons name="book" class="w-5 h-5" />
						<span>Documentation</span>
					</a>
					<a
						href="https://view.pathsim.org"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 text-cream/70 hover:text-pathsim transition-colors"
					>
						<Icons name="play" class="w-5 h-5" />
						<span>PathView</span>
					</a>
					<a
						href="https://github.com/milanofthe/pathsim"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 text-cream/70 hover:text-pathsim transition-colors"
					>
						<Icons name="github" class="w-5 h-5" />
						<span>GitHub</span>
					</a>
				</div>
			</div>

			<!-- PySimHub Details -->
			<div class="text-center pt-16 border-t border-cream/5">
				<img src="/images/pysimhub-logo.png" alt="PySimHub" class="h-16 w-auto mb-6 mx-auto" />
				<p class="text-lg text-cream/70 leading-relaxed mb-8 max-w-2xl mx-auto">
					An open community catalog for Python simulation and numerics libraries. Helping researchers, engineers, and developers discover tools across robotics, control systems, fluid dynamics, optimization, and more.
				</p>

				<!-- Tiles -->
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
					{#each pysimhubTiles as tile}
						<div class="text-center p-6 card border-pysimhub/10">
							<div class="w-10 h-10 rounded-lg bg-pysimhub/10 flex items-center justify-center mb-3 mx-auto">
								<Icons name={tile.icon} class="w-5 h-5 text-pysimhub" />
							</div>
							<div class="font-display font-semibold text-cream">{tile.title}</div>
							<div class="text-xs text-cream/50 mt-1">{tile.caption}</div>
						</div>
					{/each}
				</div>

				<!-- Links -->
				<div class="flex flex-wrap gap-4 justify-center">
					<a
						href="https://github.com/pysimhub"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 text-cream/70 hover:text-pysimhub transition-colors"
					>
						<Icons name="github" class="w-5 h-5" />
						<span>View on GitHub</span>
					</a>
					<a
						href="https://pysimhub.io"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 text-cream/70 hover:text-pysimhub transition-colors"
					>
						<Icons name="globe" class="w-5 h-5" />
						<span>Visit pysimhub.io</span>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Contact Section -->
	<section id="contact" class="py-24 lg:py-32 border-t border-cream/5">
		<div class="max-w-2xl mx-auto px-6">
			<div class="text-center mb-10">
				<h2 class="font-display text-3xl sm:text-4xl font-bold text-teal uppercase mb-6">
					Let's Work Together
				</h2>
				<p class="text-lg text-cream/60">
					Have a simulation challenge? I offer a free 30-minute consultation.
				</p>
			</div>

			{#if formStatus === 'success'}
				<div class="card p-8 border-glow text-center">
					<div class="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
						<Icons name="check" class="w-8 h-8 text-teal" />
					</div>
					<h3 class="font-display text-xl font-semibold text-cream mb-2">Message Sent</h3>
					<p class="text-cream/60">Thanks for reaching out. I'll get back to you soon.</p>
				</div>
			{:else}
				<form onsubmit={handleSubmit} class="card p-8 space-y-6">
					<input type="hidden" name="access_key" value="6b5ed4bf-68a0-45cc-9b44-f89d78af8a94" />
					<input type="hidden" name="subject" value="New contact from milanrother.com" />
					<input type="hidden" name="from_name" value="Website Contact Form" />

					<div class="grid sm:grid-cols-2 gap-6">
						<div>
							<label for="name" class="block text-sm font-medium text-cream/70 mb-2">Name</label>
							<input
								type="text"
								id="name"
								name="name"
								required
								class="w-full px-4 py-3 bg-charcoal border border-cream/10 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-teal/50 transition-colors"
								placeholder="Your name"
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-cream/70 mb-2">Email</label>
							<input
								type="email"
								id="email"
								name="email"
								required
								class="w-full px-4 py-3 bg-charcoal border border-cream/10 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-teal/50 transition-colors"
								placeholder="you@example.com"
							/>
						</div>
					</div>
					<div>
						<label for="subject" class="block text-sm font-medium text-cream/70 mb-2">Subject</label>
						<input
							type="text"
							id="subject"
							name="subject"
							required
							class="w-full px-4 py-3 bg-charcoal border border-cream/10 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-teal/50 transition-colors"
							placeholder="What's this about?"
						/>
					</div>
					<div>
						<label for="message" class="block text-sm font-medium text-cream/70 mb-2">Message</label>
						<textarea
							id="message"
							name="message"
							rows="5"
							required
							class="w-full px-4 py-3 bg-charcoal border border-cream/10 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-teal/50 transition-colors resize-none"
							placeholder="Tell me about your project..."
						></textarea>
					</div>

					{#if formStatus === 'error'}
						<p class="text-red-400 text-sm">Something went wrong. Please try again or contact me on LinkedIn.</p>
					{/if}

					<button
						type="submit"
						disabled={formStatus === 'submitting'}
						class="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if formStatus === 'submitting'}
							Sending...
						{:else}
							Send Message
							<Icons name="arrow-right" class="w-4 h-4" />
						{/if}
					</button>
				</form>
			{/if}

			<p class="text-sm text-cream/40 mt-8 text-center">
				Prefer LinkedIn? <a href="https://linkedin.com/in/milan-rother-648474183" target="_blank" rel="noopener" class="link">Connect with me there</a>.
			</p>
		</div>
	</section>

	<!-- Footer -->
	<footer class="py-12 border-t border-cream/5">
		<div class="max-w-6xl mx-auto px-6">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
				<span class="text-sm text-cream/40">Milan Rother</span>

				<div class="flex items-center gap-6">
					<a
						href="https://github.com/milanofthe"
						target="_blank"
						rel="noopener"
						class="text-cream/40 hover:text-teal transition-colors"
						aria-label="GitHub"
					>
						<Icons name="github" class="w-5 h-5" />
					</a>
					<a
						href="https://linkedin.com/in/milan-rother-648474183"
						target="_blank"
						rel="noopener"
						class="text-cream/40 hover:text-teal transition-colors"
						aria-label="LinkedIn"
					>
						<Icons name="linkedin" class="w-5 h-5" />
					</a>
				</div>

				<p class="text-sm text-cream/30">
					&copy; {new Date().getFullYear()}
				</p>
			</div>
		</div>
	</footer>
</main>
