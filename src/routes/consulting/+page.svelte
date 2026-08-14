<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult } from '$lib/layout/articleLayout';
	import { BOOKING_URL, CONTACT_EMAIL } from '$lib/config';

	const INTRO =
		'Custom solvers and engineering tools for client teams, built and integrated end to end. Numerics and UX for circuits and systems.';

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

	// Proof, in facts: what the work looks like when it is done. Each item names
	// what kind of engagement it was, so a collaboration is not dressed up as a
	// client mandate.
	const WORK = [
		{
			heading: 'tritium fuel cycles, MIT PSFC & UKAEA',
			text: 'An open-source collaboration around PathSim. The MIT Plasma Science and Fusion Center and the UK Atomic Energy Authority build tritium fuel-cycle models on it, mixing residence-time models, a liquid-metal bubble column and FESTIM finite-element transport in one timestepping loop. I co-authored the workflow paper and rebuilt PathView, the visual editor the models are assembled in.',
			links: [
				{ text: '[ the paper ]', href: 'https://arxiv.org/abs/2603.25751' },
				{ text: '[ pathsim ]', href: '/stack/pathsim/' }
			]
		},
		{
			heading: 'RFIC passives, validated in silicon',
			text: 'At the Institut fuer CMOS Design, TU Braunschweig, I built an EDA pipeline for RFIC passives that was validated in silicon for cryogenic quantum applications. It became RapidPassives, and the layouts it generates are what RapidMoM simulates today.',
			links: [{ text: '[ rapidpassives ]', href: '/stack/rapidpassives/' }]
		},
		{
			heading: 'the stack on this site',
			text: 'Two EM solvers, a mesher, a sparse direct solver, a symbolic circuit engine and two system simulators, built between 2023 and 2026 on one architecture: Rust cores, Python APIs, browser interfaces. Benchmarked against PARDISO, faer, CasADi and ngspice, and each detail page states what is validated and what is not.',
			links: [{ text: '[ view the stack -> ]', href: '/#projects' }]
		}
	];

	// The collaboration, step by step. This mirrors how real engagements run.
	const STEPS = [
		{
			heading: '1 // intro call',
			text: '30 minutes, free. You describe the problem, I tell you whether and how I can help. If the material is sensitive, we sign an NDA before you share anything.'
		},
		{
			heading: '2 // proposal',
			text: 'You get a written proposal with a fixed structure: summary, milestones, feature coverage, timeline, assumptions and client dependencies, commercial terms. Fixed scope, no open-ended retainer.'
		},
		{
			heading: '3 // sprints',
			text: 'Work runs in weekly sprints against the proposal milestones. You see progress as running code and measured numbers, not status slides, and scope questions are settled when they appear.'
		},
		{
			heading: '4 // delivery',
			text: 'Deliverables are engineering artifacts: source in your repository, a reproducible benchmark pipeline, notebooks your team can run, and a technical report whose figures are generated from that same pipeline.'
		},
		{
			heading: '5 // after',
			text: 'The work is documented and reproducible, so your team owns it from day one. Follow-up support, further sprints, or a license with integration support are available when you need them.'
		}
	];

	const MODELS = [
		{
			heading: 'scoped project',
			text: 'A multi-week project against a milestone plan. The right shape for a new solver, a new tool, or a migration.'
		},
		{
			heading: 'sprint engagement',
			text: 'One or a few weekly sprints for a focused question: a feasibility study, a performance investigation, a prototype, a review of your numerics.'
		},
		{
			heading: 'licensing + integration',
			text: 'A commercial license for FastSim, SANE, or RapidMoM, with the integration work and support to make it productive in your environment.'
		}
	];

	function build(cols: number, cellRatio: number): ArticleResult {
		const g = new ArticleGrid(cols, 'neutral', 6, cellRatio);
		g.title('CONSULTING');
		g.paragraph(INTRO);
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

		g.sectionHeading('selected work');
		g.spacer();
		for (const w of WORK) {
			g.heading('// ' + w.heading);
			g.paragraph(w.text);
			g.cta(w.links);
			g.spacer();
		}

		g.sectionHeading('how a collaboration works');
		g.spacer();
		for (const step of STEPS) {
			g.heading(step.heading);
			g.paragraph(step.text);
			g.spacer();
		}

		g.sectionHeading('engagement models');
		g.spacer();
		for (const model of MODELS) {
			g.heading('// ' + model.heading);
			g.paragraph(model.text);
			g.spacer();
		}

		g.contactSection({ bookingUrl: BOOKING_URL, email: CONTACT_EMAIL });
		return g.finish();
	}
</script>

<Seo
	title="Consulting - Milan Rother"
	description="Custom solvers and engineering tools for client teams, built and integrated end to end. Numerics and UX for circuits and systems."
	path="/consulting/"
/>

<Navigation />
<ArticlePage {build}>
	{#snippet semantic()}
		<h1>Consulting</h1>
		<p>{INTRO}</p>
		{#each OFFERS as offer}
			<h2>{offer.heading}</h2>
			<p>{offer.text}</p>
		{/each}
		<h2>Selected work</h2>
		{#each WORK as w}
			<h3>{w.heading}</h3>
			<p>{w.text}</p>
		{/each}
		<h2>How a collaboration works</h2>
		{#each STEPS as step}
			<h3>{step.heading}</h3>
			<p>{step.text}</p>
		{/each}
		<h2>Engagement models</h2>
		{#each MODELS as model}
			<h3>{model.heading}</h3>
			<p>{model.text}</p>
		{/each}
		<p>Book an intro call: <a href={BOOKING_URL}>{BOOKING_URL}</a> or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
	{/snippet}
</ArticlePage>
