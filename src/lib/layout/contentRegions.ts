// Declarative content structure for the code rain grid
// Each region defines what content goes where in the grid

import githubStats from '$lib/data/github-stats.json';

const ps = githubStats.current.pathsim;
const ph = githubStats.current.pysimhub;

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

export const contentSections: ContentSection[] = [
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
					"I'm a research engineer and PhD candidate",
					'in electrical engineering. I build simulation',
					'software and solve numerical problems for',
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
					'Previously at TU Braunschweig, where I',
					'developed numerical methods for electrochemical',
					'sensors and EDA pipelines for cryogenic',
					'quantum applications, validated in silicon.'
				],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'I built PathSim because system modeling',
					'software has a long history of vendor lock-in',
					'and clunky UX. It\'s pure Python, open source,',
					'and designed from first principles. I also',
					'designed the documentation sites, landing',
					'pages, and PathView -- the browser-based editor.'
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
				lines: ['PathSim + PathView'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'A complete ecosystem for dynamical system',
					'simulation -- framework, documentation,',
					'browser-based editor, and community-driven',
					'toolbox development.'
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
					{ id: 'docs-pathsim-org', label: 'Docs' },
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

	// Contact section
	{
		id: 'contact',
		fillerLinesBefore: 5,
		regions: [
			{
				type: 'heading',
				lines: ["LET'S WORK TOGETHER"],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{
				type: 'paragraph',
				lines: [
					'Need simulation infrastructure that\'s',
					'robust and also fun to use? Let\'s talk!'
				],
				align: 'center'
			},
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
				lines: ['Milan Rother   Impressum  Datenschutz   GitHub  LinkedIn   (c) 2026'],
				align: 'center'
			},
			{ type: 'spacer', lines: [''] },
			{ type: 'spacer', lines: [''] }
		]
	}
];
