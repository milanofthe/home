<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Icons from '$lib/components/Icons.svelte';
	import PortalGrid from '$lib/components/PortalGrid.svelte';


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
					Currently consulting for MIT Plasma Science & Fusion Center on nuclear fusion fuel-cycle modeling — building simulation infrastructure for systems that don't fit in commercial tools.
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

	<!-- Projects Section -->
	<section id="projects" class="py-24 lg:py-32 border-t border-cream/5">
		<div class="max-w-5xl mx-auto px-6">
			<div class="text-center mb-16">
				<h2 class="font-display text-3xl sm:text-4xl font-bold text-teal uppercase mb-4">
					Projects
				</h2>
				<p class="text-lg text-cream/60 max-w-2xl mx-auto">
					Building open-source infrastructure for system modeling and simulation.
				</p>
			</div>

			<!-- PathSim Section -->
			<div class="mb-20 text-center">
				<div class="flex items-center justify-center gap-6 mb-6">
					<img src="/images/pathsim_logo.png" alt="PathSim" class="h-20 w-auto" />
					<span class="text-cream/30 text-2xl">+</span>
					<img src="/images/pathview_logo.png" alt="PathView" class="h-20 w-auto" />
				</div>
				<p class="text-cream/70 leading-relaxed mb-6 max-w-2xl mx-auto">
					A complete ecosystem for dynamical system simulation — framework, documentation, browser-based editor, and community-driven toolbox development.
				</p>
				<div class="flex flex-wrap justify-center gap-4 mb-8">
					<a href="https://github.com/milanofthe/pathsim" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-cream/70 hover:text-pathsim transition-colors">
						<Icons name="github" class="w-5 h-5" />
						<span>GitHub</span>
					</a>
				</div>
				<PortalGrid projects={[
					{ id: 'pathsim-org', name: 'PathSim', url: 'https://pathsim.org', screenshot: '/screenshots/pathsim-org.png', description: 'Landing page', color: 'pathsim' },
					{ id: 'docs-pathsim-org', name: 'Documentation', url: 'https://docs.pathsim.org', screenshot: '/screenshots/docs-pathsim-org.png', description: 'API reference & tutorials', color: 'pathsim' },
					{ id: 'view-pathsim-org', name: 'PathView', url: 'https://view.pathsim.org', screenshot: '/screenshots/view-pathsim-org.png', description: 'Browser-based editor', color: 'pathsim' }
				]} />
			</div>

			<!-- PySimHub Section -->
			<div class="pt-16 border-t border-cream/5 text-center">
				<div class="flex items-center justify-center gap-4 mb-6">
					<img src="/images/pysimhub-logo.png" alt="PySimHub" class="h-20 w-auto" />
				</div>
				<p class="text-cream/70 leading-relaxed mb-6 max-w-2xl mx-auto">
					An open community platform for Python simulation and numerics libraries. Discover tools across robotics, control systems, fluid dynamics, and more.
				</p>
				<div class="flex flex-wrap justify-center gap-4 mb-8">
					<a href="https://github.com/pysimhub" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-cream/70 hover:text-pysimhub transition-colors">
						<Icons name="github" class="w-5 h-5" />
						<span>GitHub</span>
					</a>
				</div>
				<PortalGrid projects={[
					{ id: 'pysimhub-io', name: 'PySimHub', url: 'https://pysimhub.io', screenshot: '/screenshots/pysimhub-io.png', description: 'Community platform', color: 'pysimhub' }
				]} />
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
