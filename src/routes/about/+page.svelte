<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult, type TextSegment, type TimelineEntry } from '$lib/layout/articleLayout';
	import { BOOKING_URL, CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, X_URL } from '$lib/config';
	import content from '$lib/data/content.json';
	import { accentFor, paragraphText, toSegments, type ProseParagraph } from '$lib/content/prose';

	// The CV as a timeline, newest first: education, positions and the
	// projects of each era, with artifacts pulled from the repos of the time.
	const TIMELINE: TimelineEntry[] = [
		{
			period: '2026',
			heading: 'one stack',
			accent: 'sane',
			body: [
				'The full roundtrip back through circuits and fields: RapidFEM, RapidMesh, RapidMoM, RSLAB, SANE, FastSim. One architecture, SSA-style compute graphs, Rust cores, Python APIs, browser interfaces.'
			],
			images: [
				{ src: '/screenshots/sane-graph.png', label: 'sane symbolic graph', href: '/stack/sane/' },
				{ src: '/screenshots/sane-app.png', label: 'sane', href: '/stack/sane/' },
				{ src: '/images/rapidmesh-resonator.png', label: 'rapidmesh', href: '/stack/rapidmesh/', fit: 'contain', background: '#131316' },
				{ src: '/images/rapidmom-current.png', label: 'rapidmom current density', href: '/stack/rapidmom/', fit: 'contain', background: '#131316' }
			],
			links: [{ text: '[ view the stack -> ]', href: '/#projects' }]
		},
		{
			period: '2025',
			heading: 'open source',
			accent: 'pathsim',
			body: [
				'PathSim opened in early 2025 as an open alternative to Simulink. JOSS-published, adopted for nuclear fusion fuel-cycle modeling at the MIT Plasma Science & Fusion Center and by JSBSim for flight dynamics. PathView, the browser-based visual editor, followed.'
			],
			images: [
				{ src: '/screenshots/view-pathsim-org.png', label: 'view.pathsim.org', href: '/stack/pathview/' },
				{ src: '/screenshots/pathsim-org.png', label: 'pathsim.org', href: 'https://pathsim.org' },
				{ src: '/screenshots/docs-pathsim-org.png', label: 'docs', href: 'https://docs.pathsim.org' }
			],
			links: [
				{ text: '[ pathsim.org ]', href: 'https://pathsim.org' },
				{ text: '[ pathview ]', href: '/stack/pathview/' }
			]
		},
		{
			period: '2024',
			heading: 'PathSim',
			accent: 'pathsim',
			body: [
				'Started in February as an analog computer emulator side project, PathSim grew into a full hybrid system modeling and simulation framework. The same year: a minimalistic harmonic balance framework and a symbolic circuit analysis tool, the seed of what is now SANE.'
			],
			images: [
				{
					src: '/images/timeline/harmonicbalance.png',
					label: 'harmonic balance',
					fit: 'contain',
					background: '#ffffff',
					href: 'https://github.com/milanofthe/harmonicbalance'
				},
				{
					src: '/images/timeline/qesfvm.png',
					label: 'electrostatic FVM',
					fit: 'contain',
					background: '#ffffff',
					href: 'https://github.com/milanofthe/QESFVM'
				}
			],
			links: [
				{ text: '[ pathsim ]', href: 'https://github.com/pathsim/pathsim' },
				{ text: '[ harmonicbalance ]', href: 'https://github.com/milanofthe/harmonicbalance' }
			]
		},
		{
			period: '2023-2025',
			heading: 'research associate, CMOS design',
			accent: 'rapidpassives',
			body: [
				'Research associate at the Institut fuer CMOS Design, TU Braunschweig: numerical modeling of electrochemical sensors for analog circuit design, bio-impedance spectroscopy hardware and software, and an EDA pipeline for RFIC passives, validated in silicon for cryogenic quantum applications. That pipeline became RapidPassives.'
			],
			// Then and now, side by side: the Tkinter pipeline of 2023 next to what it
			// became. The pair says more about the arc than either picture alone.
			images: [
				{ src: '/images/timeline/rapidpassives-tkinter.png', label: 'back then', href: '/stack/rapidpassives/' },
				{ src: '/screenshots/rapidpassives-transformer.png', label: 'today', href: '/stack/rapidpassives/' }
			],
			links: [{ text: '[ rapidpassives ]', href: '/stack/rapidpassives/' }]
		},
		{
			period: '2023-now',
			heading: 'PhD candidate, TU Ilmenau',
			body: ['External PhD program in electrical engineering.']
		},
		{
			period: '2022-2023',
			heading: 'first numerical side projects',
			body: [
				'The early experiments went on GitHub: an interactive 2D electromagnetic FDTD simulation environment, a fast relaxed vector fitting implementation for MIMO systems, an interactive Bode plot tool.'
			],
			images: [
				{ src: '/images/timeline/fdtd.png', label: 'fdtd.png', href: 'https://github.com/milanofthe/Interactive_2D_FDTD' },
				{
					src: '/images/timeline/vf-freq.png',
					label: 'vectorfitting',
					fit: 'contain',
					background: '#ffffff',
					href: 'https://github.com/milanofthe/Vectorfitting'
				}
			],
			links: [
				{ text: '[ 2d fdtd ]', href: 'https://github.com/milanofthe/Interactive_2D_FDTD' },
				{ text: '[ vectorfitting ]', href: 'https://github.com/milanofthe/Vectorfitting' },
				{ text: '[ bode plot ]', href: 'https://github.com/milanofthe/Interactive_BodePlot' }
			]
		},
		{
			period: '2021-2023',
			heading: "M.Sc. electrical engineering, TU Braunschweig",
			body: ['Master of science with honors, thesis graded excellent.']
		},
		{
			period: '2021-2023',
			heading: 'research assistant, CMOS design',
			body: [
				'High-frequency measurement calibration methods, design and implementation of verification hardware, teaching the circuit theory seminar.'
			]
		},
		{
			period: '2021',
			heading: 'the manuscript',
			body: [
				'The 120-page LaTeX manuscript on linear system theory, written over the summer to help out a friend.'
			],
			images: [
				{
					src: '/images/timeline/lti-manuscript.png',
					label: 'the manuscript',
					fit: 'contain',
					background: '#ffffff',
					href: 'https://github.com/milanofthe/Lineare-Zeitinvariante-Systeme-Skript'
				}
			],
			links: [{ text: '[ lti manuscript ]', href: 'https://github.com/milanofthe/Lineare-Zeitinvariante-Systeme-Skript' }]
		},
		{
			period: '2019-2020',
			heading: 'internship, Volkswagen AG',
			body: [
				'Low-voltage and redundant power supply systems in Wolfsburg: concept, schematic, hardware, ASIL considerations.'
			]
		},
		{
			period: '2018-2021',
			heading: 'teaching assistant, TU Braunschweig',
			body: [
				'Weekly independent tutorials on linear dynamical systems and circuit theory for 50+ students, the material that became the throughline of everything since.'
			]
		},
		{
			period: '2015-2021',
			heading: 'B.Sc. electrical engineering, TU Braunschweig',
			body: ['Bachelor of science, thesis graded excellent.']
		},
		{
			period: '2014-2021',
			heading: 'climbing coach, DAV Braunschweig',
			body: [
				'Led the competition climbing team from entry level to international level. First lesson in building things over years.'
			]
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
