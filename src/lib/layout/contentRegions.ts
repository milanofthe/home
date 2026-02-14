// Declarative content structure for the code rain grid
// Each region defines what content goes where in the grid

import defaultStats from '$lib/data/github-stats.json';

export interface GitHubStats {
	pathsim: { stars: number; forks: number; watchers?: number; openIssues?: number };
	pathview: { stars: number; forks: number; watchers?: number; openIssues?: number };
	pysimhub: { projects: number; members?: number; cumulativeStars: number };
}

export type RegionType = 'heading' | 'heading-pathsim' | 'heading-pysimhub' | 'paragraph' | 'spacer' | 'embedded' | 'cta' | 'link-line' | 'link-line-pathsim' | 'link-line-pysimhub' | 'footer-line' | 'content' | 'form-field';

export interface ContentRegion {
	type: RegionType;
	lines: string[];
	id?: string; // section anchor id
	embeddedId?: string; // for embedded blocks (photo, tiles, form)
	embeddedRows?: number; // how many rows the embedded block takes
	embeddedCols?: number; // how many cols the embedded block takes
	tiles?: { id: string; label: string }[]; // individual framed tiles laid out side-by-side (or stacked on mobile)
	url?: string; // for links within text
	label?: string; // frame title for embedded blocks
	frameColor?: 'pathsim' | 'pysimhub'; // project color for frame
	align?: 'center' | 'left';
}

export interface ContentSection {
	id?: string;
	fillerLinesBefore: number;
	regions: ContentRegion[];
}

export function buildContentSections(stats?: GitHubStats): ContentSection[] {
	const ps = stats?.pathsim ?? defaultStats.current.pathsim;
	const pv = stats?.pathview ?? defaultStats.current.pathview ?? { stars: 0, forks: 0 };
	const ph = stats?.pysimhub ?? defaultStats.current.pysimhub;

	return [
	// Hero section
	{
		fillerLinesBefore: 5,
		regions: [
			{
				type: 'embedded',
				lines: [],
				embeddedId: 'photo',
				label: 'milan.png',
				embeddedRows: 10,
				embeddedCols: 22,
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'heading',
				lines: ['MILAN ROTHER'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'I build simulation tools end-to-end --',
					'numerical methods, infrastructure, and',
					'the interfaces to use them.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'cta',
				lines: ['[ Get in Touch -> ]   [ View Projects ]'],
				align: 'center'
			}
		]
	},

	// About section
	{
		id: 'about',
		fillerLinesBefore: 5,
		regions: [
			{
				type: 'heading',
				lines: ['WHO AM I'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'Simulation engineer. I build numerical',
					'software and solve modeling problems for',
					'teams working on complex physical systems.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'Currently consulting for MIT Plasma Science',
					'& Fusion Center on nuclear fusion fuel-cycle',
					'modeling -- building simulation infrastructure',
					'for systems that don\'t fit in commercial tools.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'M.Sc. Electrical Engineering. Background',
					'in numerical methods, system modeling,',
					'sensitivity and failure mode analysis, and',
					'compact modeling for physical systems.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'I built PathSim because modeling software',
					'has a long history of vendor lock-in and',
					'clunky UX. Pure Python, open source, and',
					'designed from first principles.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'link-line',
				lines: ['GitHub   LinkedIn'],
				align: 'center'
			}
		]
	},

	// Projects section
	{
		id: 'projects',
		fillerLinesBefore: 5,
		regions: [
			{
				type: 'heading',
				lines: ['PROJECTS'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'Building open-source infrastructure for',
					'system modeling and simulation.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] },
			{
				type: 'heading-pathsim',
				lines: ['PathSim'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'A pure-Python framework for modeling and',
					'simulating dynamical systems. Built from',
					'first principles with custom solvers, an event',
					'system, and a modular block-diagram API.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'Published in JOSS. Adopted by JSBSim for',
					'flight dynamics and used at MIT PSFC for',
					'nuclear fusion fuel-cycle modeling.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'link-line-pathsim',
				lines: [`${ps.stars} stars / ${ps.forks} forks`],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'embedded',
				lines: [],
				frameColor: 'pathsim',
				embeddedRows: 10,
				embeddedCols: 34,
				tiles: [
					{ id: 'pathsim-org', label: 'PathSim' },
					{ id: 'docs-pathsim-org', label: 'Docs' }
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] },
			{
				type: 'heading-pathsim',
				lines: ['PathView'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'A browser-based visual editor for PathSim',
					'models. Drag-and-drop block diagrams, live',
					'simulation preview, and instant sharing --',
					'built with SvelteKit, SvelteFlow, and Pyodide.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'link-line-pathsim',
				lines: [`${pv.stars} stars / ${pv.forks} forks`],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'embedded',
				lines: [],
				frameColor: 'pathsim',
				embeddedRows: 10,
				embeddedCols: 34,
				tiles: [
					{ id: 'pathview-trailer', label: 'Demo' },
					{ id: 'view-pathsim-org', label: 'PathView' }
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] },
			{
				type: 'heading-pysimhub',
				lines: ['PySimHub'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'An open community catalog bridging Python\'s',
					'scattered simulation communities -- an awesome',
					'list that\'s also awesome to use.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'link-line-pysimhub',
				lines: [`${ph.projects} projects / ${ph.cumulativeStars} cumulative stars`],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'embedded',
				lines: [],
				frameColor: 'pysimhub',
				tiles: [
					{ id: 'pysimhub-io', label: 'PySimHub' }
				],
				embeddedRows: 10,
				embeddedCols: 34,
				align: 'center'
			}
		]
	},

	// Services section
	{
		id: 'services',
		fillerLinesBefore: 5,
		regions: [
			{
				type: 'heading',
				lines: ['SERVICES'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'I help engineering teams build and scale',
					'simulation infrastructure. Available for',
					'consulting, development, and training.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] },
			{ type: 'heading', lines: ['// simulink migration'], align: 'center' },
			{
				type: 'paragraph',
				lines: [
					'Move existing Simulink workflows to Python.',
					'Reduce license costs, improve automation,',
					'and eliminate vendor lock-in. Full model',
					'validation against your existing results.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'heading', lines: ['// custom simulation'], align: 'center' },
			{
				type: 'paragraph',
				lines: [
					'Tailored models, solvers, and simulation',
					'pipelines for your engineering domain.',
					'From single-component ODEs to full',
					'multi-domain system architectures.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'heading', lines: ['// digital twin & co-simulation'], align: 'center' },
			{
				type: 'paragraph',
				lines: [
					'FMU/FMI-compliant architectures connecting',
					'simulation models to real-time sensor data',
					'and control systems. Standards-based',
					'interoperability across platforms.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'heading', lines: ['// simulation audit'], align: 'center' },
			{
				type: 'paragraph',
				lines: [
					'Review and validate your existing simulation',
					'infrastructure. Identify numerical issues,',
					'bottlenecks, and improvement opportunities.',
					'Actionable recommendations, not just reports.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'heading', lines: ['// training & workshops'], align: 'center' },
			{
				type: 'paragraph',
				lines: [
					'Hands-on Python simulation workshops for',
					'your team. From basics to advanced system',
					'modeling. 1-2 days, remote or on-site.'
				],
				align: 'center'
			},
		]
	},

	// Contact section
	{
		id: 'contact',
		fillerLinesBefore: 5,
		regions: [
			{
				type: 'heading',
				lines: ['GET IN TOUCH'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'Have a project in mind or want to discuss',
					'your simulation challenges? Write me or',
					'use the form below.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'link-line',
				lines: ['milan.rother@gmx.de'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] },
			{ type: 'content', lines: ['// name'], align: 'center' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-name' },
			{ type: 'spacer', lines: [''] },
			{ type: 'content', lines: ['// email'], align: 'center' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-email' },
			{ type: 'spacer', lines: [''] },
			{ type: 'content', lines: ['// subject'], align: 'center' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-subject' },
			{ type: 'spacer', lines: [''] },
			{ type: 'content', lines: ['// message'], align: 'center' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-message-1' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-message-2' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-message-3' },
			{ type: 'spacer', lines: [''] },
			{ type: 'cta', lines: ['[ SEND MESSAGE -> ]'], align: 'center' },
			{ type: 'spacer', lines: [''] },
			{ type: 'content', lines: ['Your data is processed per our privacy policy.'], align: 'center' },
		]
	},

	// Footer
	{
		fillerLinesBefore: 3,
		regions: [
			{
				type: 'footer-line',
				lines: ['Milan Rother   Impressum  Datenschutz   Email  GitHub  LinkedIn   (c) 2026'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] }
		]
	}
];
}

// Default export for backward compatibility
export const contentSections = buildContentSections();
