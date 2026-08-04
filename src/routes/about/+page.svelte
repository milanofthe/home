<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult, type TextSegment } from '$lib/layout/articleLayout';
	import { BOOKING_URL, CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, X_URL } from '$lib/config';

	// The story, with inline links now pointing at the stack detail pages.
	const STORY: TextSegment[][] = [
		[{ text: 'I build simulation tools and infrastructure and solve numerical modeling problems for engineering teams.' }],
		[
			{ text: "Long ago during my studies I was already building small numerical side projects. A symbolic circuit analysis tool, an eigenmode solver for the Schrödinger equation, a CUDA-accelerated 2D FDTD solver, a MIMO vector fitting implementation, and so on. I even wrote a 120-page LaTeX manuscript on linear system theory during the summer of 2021 to help out a friend." }
		],
		[
			{ text: "During my master's I dipped my toes into the RFIC EDA world and worked on compact modeling and layout generation of RFIC passives (inductors, transformers, baluns...). This has now become" },
			{ text: 'RapidPassives', href: '/stack/rapidpassives/', accent: 'rapidpassives' },
			{ text: ', an open-source library.' }
		],
		[
			{ text: 'At the beginning of my PhD (early 2023) I diverged from the circuit path to the more general system level, where you have signal flow diagrams and ODEs instead of Maxwell and KVL/KCL. During that time' },
			{ text: 'PathSim', href: '/stack/pathsim/', accent: 'pathsim' },
			{ text: 'started as a side project. Initially just an analog computer emulator, it evolved into a fully fledged continuous and discrete (hybrid, we have events!) system modeling and simulation framework. I open sourced it in early 2025 as an open alternative to Simulink, and a modern take on system modeling in general. Clean API, mutability from the get-go, robust solvers (stiffness, algebraic loops, no problem). Today (mid 2026) we are at roughly 400 stars on GitHub and have many users and collaborators worldwide, some of them prominent figures such as the MIT Plasma Science and Fusion Center, scikit-rf, and JSBSim developers.' }
		],
		[
			{ text: "Now I'm making the full roundtrip back through circuits and fields, bringing it all together into one vertically integrated stack: EM solvers (" },
			{ text: 'RapidFEM', href: '/stack/rapidfem/', accent: 'rapidpassives' },
			{ text: ',' },
			{ text: 'RapidMoM', href: '/stack/rapidmom/', accent: 'rapidpassives' },
			{ text: '), a symbolic circuit engine (' },
			{ text: 'SANE', href: '/stack/sane/', accent: 'sane' },
			{ text: '), and system-level simulation (' },
			{ text: 'PathSim', href: '/stack/pathsim/', accent: 'pathsim' },
			{ text: ',' },
			{ text: 'FastSim', href: '/stack/fastsim/', accent: 'fastsim' },
			{ text: '). One architecture: SSA-style compute graphs at the heart of the engines, Rust cores, Python APIs, browser interfaces. The commercial EDA world splits these levels across vendors and decades of legacy. I think one coherent, modern stack can do better.' }
		],
		[{ text: "Those who have talked to me know that I can't stop talking about numerics, modeling, and simulation principles and ideas." }],
		[
			{ text: 'I work as a freelancer and license my tools commercially, free for academia. If you have something you want my take on, or need some ideas and even implementation,' },
			{ text: "don't hesitate to reach out", href: '/consulting/' },
			{ text: '.' }
		]
	];

	const SIDE_PROJECTS = [
		{
			name: 'PySimHub',
			href: 'https://pysimhub.io',
			accent: 'pysimhub' as const,
			text: "An open community catalog bridging Python's scattered simulation communities. An awesome list that's also awesome to use."
		},
		{
			name: 'SciData',
			href: 'https://scidata.io',
			accent: 'scidata' as const,
			text: 'A node-based environment for scientific data analysis. Drop a CSV, chain pandas, scipy, statsmodels and plotly blocks; the pipeline compiles to plain Python.'
		},
		{
			name: 'ThesisOS',
			href: 'https://thesisos.io',
			accent: 'thesisos' as const,
			text: 'A local-first literature manager for researchers. Ingest PDFs, search them semantically, and trace citations across your library.'
		},
		{
			name: 'WhatsMyTraffic',
			href: 'https://whatsmytraffic.com',
			accent: 'whatsmytraffic' as const,
			text: 'Self-hosted web analytics with a form backend and passwordless auth. A Docker stack on a VPS.'
		}
	];

	function build(cols: number): ArticleResult {
		const g = new ArticleGrid(cols, 'neutral', 6);
		g.title('WHO AM I');
		g.spacer();
		g.image('/images/headshot_milan.webp', 'milan.png', 24, 10);
		g.spacer();
		for (const p of STORY) {
			g.paragraph(p);
		}
		g.spacer();

		g.sectionHeading('side quests');
		g.paragraph('Tools I built because I wanted them to exist.');
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
		{#each STORY as p}
			<p>{p.map(s => s.text).join(' ')}</p>
		{/each}
		<h2>Side projects</h2>
		<ul>
			{#each SIDE_PROJECTS as sp}
				<li><a href={sp.href}>{sp.name}</a>: {sp.text}</li>
			{/each}
		</ul>
	{/snippet}
</ArticlePage>
