<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult } from '$lib/layout/articleLayout';
	import { BOOKING_URL, CONTACT_EMAIL } from '$lib/config';

	const INTRO =
		'I build custom solvers and custom tools for engineering teams, and I help with integration. Numerics and UX for circuits and systems.';

	const OFFERS = [
		{
			heading: 'custom solvers',
			text: 'Numerical engines built for your problem: formulation, solver architecture, performance. Rust, C, Python, WASM. Deterministic, tested, benchmarked against references.'
		},
		{
			heading: 'custom tools',
			text: 'Browser-based engineering tools on top of your workflows: model editors, interactive visualization, parameter studies. SvelteKit, TypeScript, Pyodide, WebGL. No install for your users.'
		},
		{
			heading: 'integration',
			text: 'PathSim and FastSim in your environment: custom blocks, domain toolboxes, FMI co-simulation, migration from closed tools. Licensing of FastSim, SANE, and RapidMoM with support.'
		}
	];

	const PROOF =
		'JOSS-published / used at MIT PSFC / adopted by JSBSim / benchmarked head-to-head against Cadence EMX';

	function build(cols: number): ArticleResult {
		const g = new ArticleGrid(cols, 'neutral', 6);
		g.title('CONSULTING');
		g.paragraph(INTRO);
		g.metaLine(PROOF);
		g.spacer();
		g.cta([{ text: '[ Book an intro call -> ]', href: BOOKING_URL }]);
		g.spacer();

		g.sectionHeading('what I do');
		g.spacer();
		for (const offer of OFFERS) {
			g.heading('// ' + offer.heading);
			g.paragraph(offer.text);
			g.spacer();
		}

		g.sectionHeading('how we work');
		g.paragraph(
			'Work is scoped into weekly sprints and multi-week projects. It starts with a 30-minute intro call: you describe the problem, I tell you whether and how I can help, and you get a scoped proposal.'
		);
		g.paragraph(
			'Every engine, solver, and interface on this site is built and maintained by me. That is the reference for what you get.'
		);
		g.spacer();

		g.sectionHeading('get in touch');
		g.cta([
			{ text: '[ Book an intro call -> ]', href: BOOKING_URL },
			{ text: '[ Email ]', href: `mailto:${CONTACT_EMAIL}` }
		]);
		g.paragraph(`Prefer writing first? ${CONTACT_EMAIL}`);
		return g.finish();
	}
</script>

<Seo
	title="Consulting — Milan Rother"
	description="Custom solvers, custom tools, and integration for engineering teams. Numerics and UX for circuits and systems."
	path="/consulting/"
/>

<Navigation />
<ArticlePage {build}>
	{#snippet semantic()}
		<h1>Consulting</h1>
		<p>{INTRO}</p>
		<p>{PROOF}</p>
		{#each OFFERS as offer}
			<h2>{offer.heading}</h2>
			<p>{offer.text}</p>
		{/each}
		<p>Book an intro call: <a href={BOOKING_URL}>{BOOKING_URL}</a> or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
	{/snippet}
</ArticlePage>
