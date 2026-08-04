<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult } from '$lib/layout/articleLayout';
	import { BOOKING_URL, CONTACT_EMAIL } from '$lib/config';

	const INTRO =
		'I help engineering teams with numerics and UX for circuits and systems: custom solvers, simulation infrastructure, and the browser-based tools to use them. From strategic questions to shipped implementation.';

	const OFFERS = [
		{
			heading: 'simulation infrastructure & numerics',
			text: 'Custom solvers, model architectures, and simulation pipelines — from numerical methods to deployment. Python, C, Rust, WASM. Including Simulink migration to open source.'
		},
		{
			heading: 'scientific UI/UX & engineering tools',
			text: 'Browser-based tools for engineering workflows: interactive visualization, model editors, dashboards. SvelteKit, TypeScript, Pyodide — tools that run where your engineers already are.'
		},
		{
			heading: 'stack integration & licensing',
			text: 'Adopt PathSim or license FastSim, SANE, and RapidMoM for your domain. Custom blocks, solver tuning, toolbox development, FMI co-simulation and digital twin architectures. Ongoing support contracts available.'
		},
		{
			heading: 'training & workshops',
			text: 'Hands-on Python simulation workshops for your team, from basics to advanced system modeling. One to two days, remote or on-site.'
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
			'Work is scoped into weekly sprints and multi-week projects — no open-ended retainers, no surprises. We start with a 30-minute intro call: you describe the problem, I tell you honestly whether and how I can help, and you get a concrete scoped proposal.'
		);
		g.paragraph(
			'The stack is my proof of work: every engine, solver, and interface on this site is built and maintained by me. If your problem lives anywhere between Maxwell and a block diagram, it is in scope.'
		);
		g.spacer();

		g.sectionHeading('get in touch');
		g.cta([
			{ text: '[ Book an intro call -> ]', href: BOOKING_URL },
			{ text: '[ Email ]', href: `mailto:${CONTACT_EMAIL}` }
		]);
		g.paragraph(`Prefer writing first? ${CONTACT_EMAIL} — or use the contact form on the front page.`);
		return g.finish();
	}
</script>

<svelte:head>
	<title>Consulting — Milan Rother</title>
	<meta name="description" content="Consulting for engineering teams: numerics and UX for circuits and systems. Custom solvers, simulation infrastructure, Simulink migration, scientific UI/UX, training." />
</svelte:head>

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
