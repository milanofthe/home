<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult, type TextSegment, type TimelineEntry } from '$lib/layout/articleLayout';
	import { BOOKING_URL, CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, X_URL } from '$lib/config';
	import content from '$lib/data/content.json';
	import { accentFor, paragraphText, toSegments, type ProseParagraph } from '$lib/content/prose';

	// The CV as a timeline: dates and artifacts, where the story above is the
	// narrative. Old GitHub projects appear where they actually happened.
	const TIMELINE: TimelineEntry[] = [
		{
			period: '2014',
			heading: 'climbing coach, DAV Braunschweig',
			body: [
				'Led the competition climbing team from entry level to international level, until 2021. First lesson in building things over years.'
			]
		},
		{
			period: '2015',
			heading: 'electrical engineering, TU Braunschweig',
			body: [
				'B.Sc. in electrical engineering. From 2018 on teaching assistant: weekly tutorials on linear dynamical systems and circuit theory for 50+ students, the material that became the throughline of everything since.'
			]
		},
		{
			period: '2019',
			heading: 'internship, Volkswagen AG',
			body: [
				'Low-voltage and redundant power supply systems in Wolfsburg: concept, schematic, hardware, ASIL considerations.'
			]
		},
		{
			period: '2021',
			heading: "master's + research assistant, CMOS design",
			body: [
				'M.Sc. in electrical engineering at TU Braunschweig, with honors. Research assistant at the Institut fuer CMOS Design: high-frequency measurement calibration, verification hardware, teaching the circuit theory seminar.',
				'And in the summer: the 120-page LaTeX manuscript on linear system theory, written to help out a friend.'
			],
			links: [{ text: '[ lti manuscript ]', href: 'https://github.com/milanofthe/Lineare-Zeitinvariante-Systeme-Skript' }]
		},
		{
			period: '2022',
			heading: 'first numerical side projects',
			body: [
				'The early experiments went on GitHub: an interactive 2D electromagnetic FDTD simulation environment, a fast relaxed vector fitting implementation for MIMO systems, an interactive Bode plot tool.'
			],
			image: { src: '/images/timeline/fdtd.png', label: 'fdtd.png', w: 40 },
			links: [
				{ text: '[ 2d fdtd ]', href: 'https://github.com/milanofthe/Interactive_2D_FDTD' },
				{ text: '[ vectorfitting ]', href: 'https://github.com/milanofthe/Vectorfitting' },
				{ text: '[ bode plot ]', href: 'https://github.com/milanofthe/Interactive_BodePlot' }
			]
		},
		{
			period: '2023',
			heading: 'PhD + research associate, CMOS design',
			accent: 'rapidpassives',
			body: [
				'External PhD program at TU Ilmenau, research associate at the Institut fuer CMOS Design: numerical modeling of electrochemical sensors for analog circuit design, bio-impedance spectroscopy hardware and software, and an EDA pipeline for RFIC passives, validated in silicon for cryogenic quantum applications. That pipeline became RapidPassives.'
			],
			links: [{ text: '[ rapidpassives ]', href: '/stack/rapidpassives/' }]
		},
		{
			period: '2024',
			heading: 'PathSim',
			accent: 'pathsim',
			body: [
				'Started in February as an analog computer emulator side project, PathSim grew into a full hybrid system modeling and simulation framework. The same year: a minimalistic harmonic balance framework and a symbolic circuit analysis tool, the seed of what is now SANE.'
			],
			image: { src: '/images/timeline/harmonicbalance.png', label: 'harmonicbalance.png', w: 44, fit: 'contain', background: '#ffffff' },
			links: [
				{ text: '[ pathsim ]', href: 'https://github.com/pathsim/pathsim' },
				{ text: '[ harmonicbalance ]', href: 'https://github.com/milanofthe/harmonicbalance' }
			]
		},
		{
			period: '2025',
			heading: 'open source',
			accent: 'pathsim',
			body: [
				'PathSim opened in early 2025 as an open alternative to Simulink. JOSS-published, adopted for nuclear fusion fuel-cycle modeling at the MIT Plasma Science & Fusion Center and by JSBSim for flight dynamics. PathView, the browser-based visual editor, followed.'
			],
			links: [
				{ text: '[ pathsim.org ]', href: 'https://pathsim.org' },
				{ text: '[ pathview ]', href: '/stack/pathview/' }
			]
		},
		{
			period: '2026',
			heading: 'one stack',
			accent: 'sane',
			body: [
				'The full roundtrip back through circuits and fields: RapidFEM, RapidMesh, RapidMoM, RSLAB, SANE, FastSim. One architecture, SSA-style compute graphs, Rust cores, Python APIs, browser interfaces.'
			],
			links: [{ text: '[ view the stack -> ]', href: '/#projects' }]
		}
	];

	// Story and side projects come from content.json — the same copy the landing
	// page renders into the character grid. Here the inline links resolve to the
	// stack detail pages instead of scroll targets.
	const PARAGRAPHS = content.about.paragraphs as ProseParagraph[];
	const STORY: TextSegment[][] = PARAGRAPHS.map(toSegments);

	const SIDE_PROJECTS = content.other.items.map((item) => ({
		name: item.heading,
		href: item.url,
		accent: accentFor(item.id),
		text: item.paragraphs[0]
	}));

	function build(cols: number, cellRatio: number): ArticleResult {
		const g = new ArticleGrid(cols, 'neutral', 6, cellRatio);
		g.title(content.about.heading);
		g.spacer();
		g.image('/images/headshot_milan.webp', 'milan.png', 24, 10);
		g.spacer();
		for (const p of STORY) {
			g.paragraph(p);
		}
		g.spacer();

		g.sectionHeading('timeline');
		g.spacer();
		g.timeline(TIMELINE);
		g.spacer();

		g.sectionHeading('side quests');
		g.paragraph(content.other.intro);
		g.spacer();
		for (const sp of SIDE_PROJECTS) {
			g.paragraph([{ text: sp.name, href: sp.href, accent: sp.accent }]);
			g.paragraph(sp.text);
			g.spacer();
		}

		g.sectionHeading('elsewhere');
		g.cta([
			{ text: '[ GitHub ]', href: GITHUB_URL },
			{ text: '[ LinkedIn ]', href: LINKEDIN_URL },
			{ text: '[ X ]', href: X_URL }
		]);
		g.spacer();
		g.contactSection({ bookingUrl: BOOKING_URL, email: CONTACT_EMAIL });
		return g.finish();
	}
</script>

<Seo
	title="About — Milan Rother"
	description="I build the simulation stack for electronics: fields, circuits, systems. Custom solvers and engineering tools for client teams, built and integrated end to end."
	path="/about/"
/>

<Navigation />
<ArticlePage {build}>
	{#snippet semantic()}
		<h1>About Milan Rother</h1>
		{#each PARAGRAPHS as p}
			<p>{paragraphText(p)}</p>
		{/each}
		<h2>Timeline</h2>
		<ul>
			{#each TIMELINE as entry}
				<li>
					<strong>{entry.period}: {entry.heading}.</strong>
					{(entry.body ?? []).map((p) => (typeof p === 'string' ? p : p.map((s) => s.text).join(' '))).join(' ')}
				</li>
			{/each}
		</ul>
		<h2>Side projects</h2>
		<ul>
			{#each SIDE_PROJECTS as sp}
				<li><a href={sp.href}>{sp.name}</a>: {sp.text}</li>
			{/each}
		</ul>
	{/snippet}
</ArticlePage>
