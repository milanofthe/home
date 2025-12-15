<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Icons from '$lib/components/Icons.svelte';
	import githubStats from '$lib/data/github-stats.json';

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
			console.log('Web3Forms response:', data);

			if (data.success) {
				formStatus = 'success';
				form.reset();
			} else {
				console.error('Form error:', data);
				formStatus = 'error';
			}
		} catch (err) {
			console.error('Form exception:', err);
			formStatus = 'error';
		}
	}

	// Tiles with stats from GitHub (fetched at build time)
	const pathsimTiles = [
		{ icon: 'cpu' as const, title: 'Hot-Swappable', caption: 'Runtime changes' },
		{ icon: 'layers' as const, title: 'Hierarchical', caption: 'Nested subsystems' },
		{ icon: 'chart' as const, title: 'Multi-Solver', caption: 'Adaptive integrators' },
		{ icon: 'zap' as const, title: 'Event Handling', caption: 'Zero-crossing detection' },
		{ icon: 'star' as const, title: `${githubStats.pathsim.stars}+`, caption: 'GitHub Stars' }
	];

	const pysimhubTiles = [
		{ icon: 'layers' as const, title: 'Browse', caption: 'Simulation libraries' },
		{ icon: 'code' as const, title: 'Submit', caption: 'Your projects' },
		{ icon: 'users' as const, title: 'Community', caption: 'Open collaboration' },
		{ icon: 'github' as const, title: 'Open Source', caption: 'MIT licensed' },
		{ icon: 'star' as const, title: `${githubStats.pysimhub.projects}`, caption: 'Featured Projects' }
	];

	const services = [
		{
			icon: 'code' as const,
			title: 'Model Development',
			description: 'Formulating mathematical models that fit your data and modeling pipeline. From differential equations to state-space representations.',
			items: ['System identification', 'Parameter estimation', 'Model order reduction', 'Validation against data']
		},
		{
			icon: 'zap' as const,
			title: 'Numerical Problem Solving',
			description: 'Fixing stability, convergence, and performance issues in your simulations. Making slow models fast and unstable models robust.',
			items: ['Stiff system handling', 'Solver selection & tuning', 'Multirate integration', 'HPC & parallelization']
		},
		{
			icon: 'layers' as const,
			title: 'Digital Twin Integration',
			description: 'Connecting multiple models into unified simulations. Co-simulation of FEM, circuit, and system-level models.',
			items: ['Multi-physics coupling', 'Co-simulation orchestration', 'Real-time integration', 'API & pipeline design']
		}
	];

	const domains = [
		{
			title: 'Nuclear Fusion',
			items: ['Fuel-cycle modeling', 'Multirate systems', 'FEM co-simulation', 'Event & failure mode analysis']
		},
		{
			title: 'RF & Microwave',
			items: ['Nonlinear frequency domain', 'Limit cycle analysis', 'Multitone simulation', 'Uncertainty quantification']
		},
		{
			title: 'Analog Circuits',
			items: ['Biomedical sensors', 'Parametric modeling', 'SPICE integration', 'Mixed-signal systems']
		}
	];

</script>

<Navigation />

<main class="relative">
	<!-- Background grid pattern -->
	<div class="fixed inset-0 bg-grid-pattern bg-grid opacity-50 pointer-events-none"></div>

	<!-- Hero Section -->
	<section class="relative min-h-screen flex items-center overflow-hidden">
		<div class="relative z-10 max-w-6xl mx-auto px-6 py-32">
			<div class="max-w-3xl">
				<p class="section-label mb-6 animate-fade-in">Dynamical Systems Modeling & Simulation</p>

				<h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cream leading-tight mb-6 animate-slide-up">
					Building interconnected
					<span class="text-gradient">dynamical systems</span>
				</h1>

				<p class="text-lg sm:text-xl text-cream/70 leading-relaxed mb-8 max-w-2xl animate-slide-up animate-delay-100">
					Creator of <a href="https://pathsim.org" target="_blank" rel="noopener" class="link font-medium">PathSim</a>, a Python-native open-source system modeling and simulation platform. With contributions from MIT Plasma Science & Fusion Center and CEA.
				</p>

				<!-- CTA -->
				<div class="animate-slide-up animate-delay-200">
					<a href="#contact" class="btn-primary">
						Get in Touch
						<Icons name="arrow-right" class="w-4 h-4" />
					</a>
				</div>
			</div>
		</div>

		<!-- Scroll indicator -->
		<div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
			<div class="w-6 h-10 border-2 border-cream/20 rounded-full flex justify-center">
				<div class="w-1 h-2 bg-teal rounded-full mt-2"></div>
			</div>
		</div>
	</section>

	<!-- Services Section -->
	<section id="services" class="relative py-24 lg:py-32">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-16">
				<p class="section-label mb-4">What I Offer</p>
				<h2 class="font-display text-3xl sm:text-4xl font-bold text-cream mb-4">
					Services
				</h2>
				<p class="text-lg text-cream/60 max-w-2xl mx-auto">
					Expert in dynamical systems, differential equations, numerics, and Python integration.
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

	<!-- Domain Expertise Section -->
	<section class="relative py-16 lg:py-20 bg-charcoal-warm/30">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<p class="section-label mb-4">Domain Experience</p>
				<h2 class="font-display text-2xl sm:text-3xl font-bold text-cream">
					Industries & Applications
				</h2>
			</div>

			<div class="grid md:grid-cols-3 gap-6">
				{#each domains as domain}
					<div class="text-center">
						<h3 class="font-display text-lg font-semibold text-cream mb-4">{domain.title}</h3>
						<ul class="space-y-2">
							{#each domain.items as item}
								<li class="text-sm text-cream/60">{item}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- PathSim Section -->
	<section id="pathsim" class="relative py-24 lg:py-32">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center">
				<p class="font-mono text-xs uppercase tracking-[0.2em] text-pathsim mb-4">Featured Project</p>
				<img src="/images/pathsim_logo.png" alt="PathSim" class="h-24 w-auto mb-6 mx-auto" />
				<p class="text-lg text-cream/70 leading-relaxed mb-10 max-w-2xl mx-auto">
					A minimal-dependency Python framework for modeling and simulating complex dynamical systems using block diagrams. Applied and experimentally validated for nuclear fusion fuel-cycle modeling at MIT Plasma Science & Fusion Center.
				</p>

				<!-- Tiles -->
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10 max-w-4xl mx-auto">
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
						href="https://github.com/milanofthe/pathsim"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 text-cream/70 hover:text-pathsim transition-colors"
					>
						<Icons name="github" class="w-5 h-5" />
						<span>View on GitHub</span>
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
				</div>
			</div>
		</div>
	</section>

	<!-- PySimHub Section -->
	<section id="pysimhub" class="relative py-24 lg:py-32 bg-charcoal-warm/30">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center">
				<p class="font-mono text-xs uppercase tracking-[0.2em] text-pysimhub mb-4">Founder</p>
				<img src="/images/pysimhub-logo.png" alt="PySimHub" class="h-16 w-auto mb-6 mx-auto" />
				<p class="text-lg text-cream/70 leading-relaxed mb-10 max-w-2xl mx-auto">
					An open community catalog for Python simulation and numerics libraries. Helping researchers, engineers, and developers discover tools across robotics, control systems, fluid dynamics, optimization, and more.
				</p>

				<!-- Tiles -->
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10 max-w-4xl mx-auto">
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

	<!-- About Section -->
	<section id="about" class="relative py-24 lg:py-32">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
				<!-- Portrait -->
				<div class="lg:col-span-2 flex justify-center">
					<div class="w-48 h-48 lg:w-56 lg:h-56 rounded-2xl border border-cream/10 overflow-hidden">
						<img
							src="/images/headshot_linkedin_2_crop.png"
							alt="Milan Rother"
							class="w-full h-full object-cover"
						/>
					</div>
				</div>

				<!-- Bio -->
				<div class="lg:col-span-3">
					<p class="section-label mb-4">About Me</p>
					<h2 class="font-display text-3xl sm:text-4xl font-bold text-cream mb-6">
						Milan Rother
					</h2>
					<div class="space-y-4 text-cream/70 leading-relaxed">
						<p>
							I'm a freelance consultant and PhD candidate in electrical engineering, specializing in numerical simulation and scientific computing. Currently, I'm working with MIT Plasma Science & Fusion Center on nuclear fusion fuel-cycle system modeling and simulation.
						</p>
						<p>
							I created <a href="https://pathsim.org" target="_blank" rel="noopener" class="link">PathSim</a>, an open-source Python framework for block-based dynamical system simulation. It's now used by researchers at MIT PSFC and CEA, and has been published in the Journal of Open Source Software.
						</p>
						<p>
							With a Master's degree in electrical engineering (honors) and a background spanning control systems, multi-physics simulation, and real-time computing, I help teams build simulations that are accurate, fast, and well-architected.
						</p>
					</div>

					<!-- Social links -->
					<div class="flex gap-4 mt-8">
						<a
							href="https://github.com/milanofthe"
							target="_blank"
							rel="noopener"
							class="w-10 h-10 rounded-lg bg-charcoal-light border border-cream/10 flex items-center justify-center text-cream/60 hover:text-teal hover:border-teal/30 transition-all"
							aria-label="GitHub"
						>
							<Icons name="github" class="w-5 h-5" />
						</a>
						<a
							href="https://linkedin.com/in/milan-rother-648474183"
							target="_blank"
							rel="noopener"
							class="w-10 h-10 rounded-lg bg-charcoal-light border border-cream/10 flex items-center justify-center text-cream/60 hover:text-teal hover:border-teal/30 transition-all"
							aria-label="LinkedIn"
						>
							<Icons name="linkedin" class="w-5 h-5" />
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Contact Section -->
	<section id="contact" class="relative py-24 lg:py-32 bg-charcoal-warm/30">
		<div class="max-w-6xl mx-auto px-6">
			<div class="max-w-xl mx-auto">
				<div class="text-center mb-10">
					<p class="section-label mb-4">Get in Touch</p>
					<h2 class="font-display text-3xl sm:text-4xl font-bold text-cream mb-6">
						Let's Build Something Together
					</h2>
					<p class="text-lg text-cream/60">
						Have a simulation challenge? I offer a free 30-minute consultation to discuss your needs.
					</p>
				</div>

				<!-- Contact Form -->
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
						<!-- Web3Forms configuration -->
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

				<!-- Alternative contact -->
				<p class="text-sm text-cream/40 mt-8 text-center">
					Prefer LinkedIn? <a href="https://linkedin.com/in/milan-rother-648474183" target="_blank" rel="noopener" class="link">Connect with me there</a>.
				</p>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="relative py-12 border-t border-cream/5">
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
