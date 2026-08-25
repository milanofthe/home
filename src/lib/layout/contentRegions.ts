// Declarative content structure for the code rain grid
// Content text lives in content.json; this file handles layout and structure

import contentData from '$lib/data/content.json';
import defaultStats from '$lib/data/github-stats.json';
import { inlineLinksFor, paragraphText, type ProseParagraph } from '$lib/content/prose';
import { getStackPage } from '$lib/content';

export interface GitHubStats {
	pathsim: { stars: number; forks: number; watchers?: number; openIssues?: number };
	pathview: { stars: number; forks: number; watchers?: number; openIssues?: number };
	pysimhub: { projects: number; members?: number; cumulativeStars: number };
}

export type RegionType = 'heading' | 'heading-pathsim' | 'heading-pysimhub' | 'heading-rapidpassives' | 'heading-scidata' | 'heading-fastsim' | 'heading-sane' | 'heading-rslab' | 'heading-thesisos' | 'heading-whatsmytraffic' | 'heading-falllow' | 'paragraph' | 'spacer' | 'embedded' | 'cta' | 'link-line' | 'link-line-pathsim' | 'link-line-pysimhub' | 'link-line-rapidpassives' | 'link-line-scidata' | 'link-line-fastsim' | 'link-line-sane' | 'link-line-rslab' | 'link-line-thesisos' | 'link-line-whatsmytraffic' | 'link-line-falllow' | 'footer-line' | 'content' | 'form-field' | 'project-pair';

export interface ContentRegion {
	type: RegionType;
	lines: string[];
	id?: string; // section anchor id
	embeddedId?: string; // for embedded blocks (photo, tiles, form)
	embeddedRows?: number; // how many rows the embedded block takes
	embeddedCols?: number; // how many cols the embedded block takes
	tiles?: { id: string; label: string }[]; // individual framed tiles laid out side-by-side (or stacked on mobile)
	url?: string; // for links within text
	inlineLinks?: { phrase: string; project: string }[]; // colored, clickable phrases embedded in paragraph text
	label?: string; // frame title for embedded blocks
	frameColor?: 'pathsim' | 'pysimhub' | 'rapidpassives' | 'scidata' | 'fastsim' | 'sane' | 'rslab' | 'thesisos' | 'whatsmytraffic' | 'falllow'; // project color for frame
	align?: 'center' | 'left';
	fill?: boolean; // pad heading up to the tile-row width
	fillChar?: string; // padding character, defaults to '-'
	cards?: ProjectCard[]; // for 'project-pair': the projects sharing this band
}

// One project rendered as a column of its own: heading, prose, its link line and a
// single picture, all centred in that column. Two of them share a band.
export interface ProjectCard {
	id: string;
	heading: string;
	headingType: RegionType;
	paragraphs: string[];
	statsLines: { text: string; type: RegionType }[];
	tile: { id: string; label: string };
	frameColor?: ContentRegion['frameColor'];
	readMore?: string; // '[ more on X -> ]', matched to its page by the click-target list
}

export interface ContentSection {
	id?: string;
	fillerLinesBefore: number;
	regions: ContentRegion[];
}

// --- Region builder helpers ---

const spacer = (): ContentRegion => ({ type: 'spacer', lines: [''] });

const heading = (text: string, type: RegionType = 'heading'): ContentRegion => ({
	type, lines: [text], align: 'center'
});

// Section title padded with '=' up to the tile-row width (divider look)
const sectionHeading = (text: string): ContentRegion => ({
	...heading(text), fill: true, fillChar: '='
});

// Subsection title (e.g. stack groups) padded with '-'
const subsectionHeading = (text: string): ContentRegion => ({
	...heading(text), fill: true, fillChar: '-'
});

const paragraph = (text: string, inlineLinks?: { phrase: string; project: string }[]): ContentRegion => ({
	type: 'paragraph', lines: [text], align: 'center', ...(inlineLinks ? { inlineLinks } : {})
});

const linkLine = (text: string, type: RegionType = 'link-line'): ContentRegion => ({
	type, lines: [text], align: 'center'
});

// --- Stats template resolution ---

function resolveStats(template: string, stats: Record<string, number | undefined>): string {
	return template.replace(/\{(\w+)\}/g, (_, key) => String(stats[key] ?? 0));
}

// --- Embedded block definitions (layout, not content) ---

const PROJECT_EMBEDS: Record<string, ContentRegion> = {
	pathsim: {
		type: 'embedded', lines: [], frameColor: 'pathsim',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'pathsim-org', label: 'PathSim' }, { id: 'docs-pathsim-org', label: 'Docs' }]
	},
	pathview: {
		type: 'embedded', lines: [], frameColor: 'pathsim',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'pathview-trailer', label: 'Demo' }, { id: 'view-pathsim-org', label: 'PathView' }]
	},
	pysimhub: {
		type: 'embedded', lines: [], frameColor: 'pysimhub',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'pysimhub-io', label: 'PySimHub' }, { id: 'pysimhub-pathsim', label: 'Project Page' }]
	},
	rapidpassives: {
		type: 'embedded', lines: [], frameColor: 'rapidpassives',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'rapidpassives-org', label: 'RapidPassives' }, { id: 'rapidpassives-transformer', label: 'Transformer' }]
	},
	rapidmom: {
		// Shares the rapidpassives brand color.
		type: 'embedded', lines: [], frameColor: 'rapidpassives',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'rapidmom-mesh', label: 'Mesh' }, { id: 'rapidmom-current', label: 'Current Density' }]
	},
	rapidfem: {
		// Shares the rapidpassives brand color.
		type: 'embedded', lines: [], frameColor: 'rapidpassives',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'rapidfem-editor', label: 'Notebook' }, { id: 'rapidfem-microstrip', label: 'Microstrip' }]
	},
	rapidmesh: {
		// Shares the rapidpassives brand color.
		type: 'embedded', lines: [], frameColor: 'rapidpassives',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'rapidmesh-site', label: 'RapidMesh' }, { id: 'rapidmesh-resonator', label: 'Dielectric Resonator' }]
	},
	sane: {
		type: 'embedded', lines: [], frameColor: 'sane',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'sane-app', label: 'SANE' }, { id: 'sane-graph', label: 'Symbolic Graph' }]
	},
	scidata: {
		type: 'embedded', lines: [], frameColor: 'scidata',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'scidata-io', label: 'SciData' }, { id: 'scidata-app', label: 'Canvas' }]
	},
	fastsim: {
		type: 'embedded', lines: [], frameColor: 'fastsim',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'fastsim-org', label: 'FastSim' }, { id: 'fastsim-casadi', label: 'Performance Comparison' }]
	},
	rslab: {
		type: 'embedded', lines: [], frameColor: 'rslab',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'rslab-h2h', label: 'vs faer & PARDISO' }, { id: 'rslab-memory', label: 'Memory Estimate' }]
	},
	thesisos: {
		type: 'embedded', lines: [], frameColor: 'thesisos',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'thesisos-landing', label: 'Landing' }, { id: 'thesisos-graph', label: 'Graph' }]
	},
	whatsmytraffic: {
		type: 'embedded', lines: [], frameColor: 'whatsmytraffic',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'whatsmytraffic-landing', label: 'WhatsMyTraffic' }]
	},
	falllow: {
		type: 'embedded', lines: [], frameColor: 'falllow',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'falllow-landing', label: 'falllow' }]
	},
	// No frameColor: the two reading projects carry no brand of their own and
	// take the neutral grey frame.
	nanospice: {
		type: 'embedded', lines: [],
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'nanospice-title', label: 'Talk' }, { id: 'nanospice-osc', label: 'Ring Oscillator' }]
	},
	nanofem: {
		type: 'embedded', lines: [],
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'nanofem-mesh', label: 'Antenna Mesh' }, { id: 'nanofem-field', label: 'Field at Resonance' }]
	}
};

const LINK_LINE_TYPES: Record<string, RegionType> = {
	pathsim: 'link-line-pathsim',
	pathview: 'link-line-pathsim',
	pysimhub: 'link-line-pysimhub',
	rapidpassives: 'link-line-rapidpassives',
	rapidfem: 'link-line-rapidpassives',
	rapidmom: 'link-line-rapidpassives',
	rapidmesh: 'link-line-rapidpassives',
	scidata: 'link-line-scidata',
	fastsim: 'link-line-fastsim',
	sane: 'link-line-sane',
	rslab: 'link-line-rslab',
	thesisos: 'link-line-thesisos',
	whatsmytraffic: 'link-line-whatsmytraffic',
	falllow: 'link-line-falllow'
};

const HEADING_TYPES: Record<string, RegionType> = {
	pathsim: 'heading-pathsim',
	pysimhub: 'heading-pysimhub',
	rapidpassives: 'heading-rapidpassives',
	rapidfem: 'heading-rapidpassives',
	rapidmom: 'heading-rapidpassives',
	scidata: 'heading-scidata',
	fastsim: 'heading-fastsim',
	sane: 'heading-sane',
	rslab: 'heading-rslab',
	thesisos: 'heading-thesisos',
	whatsmytraffic: 'heading-whatsmytraffic',
	falllow: 'heading-falllow'
};

// --- Section builders ---

function buildHeroSection(): ContentSection {
	const c = contentData.hero;
	return {
		fillerLinesBefore: 5,
		regions: [
			{
				type: 'embedded', lines: [], embeddedId: 'photo',
				label: 'milan.png', embeddedRows: 15, embeddedCols: 33, align: 'center'
			},
			spacer(),
			heading(c.heading),
			spacer(),
			paragraph(c.tagline),
			spacer(),
			{ type: 'cta', lines: [c.cta], align: 'center' }
		]
	};
}

// The two-path fork (consulting / products) plus the about teaser, the
// visitor picks a funnel here instead of scrolling through everything.
function buildPathsSection(): ContentSection {
	const c = contentData.paths;
	const regions: ContentRegion[] = [
		sectionHeading(c.heading),
		spacer()
	];
	for (const item of c.items) {
		regions.push(heading(item.heading));
		regions.push(paragraph(item.text));
		regions.push({ type: 'cta', lines: [item.link], align: 'center' });
		regions.push(spacer());
	}
	return { id: 'paths', fillerLinesBefore: 5, regions };
}

// The full story on the landing page. Same copy as /about: both read the
// paragraphs from content.json, only the link rendering differs.
function buildAboutSection(): ContentSection {
	const c = contentData.about;
	const regions: ContentRegion[] = [
		sectionHeading(c.heading),
		spacer()
	];
	for (const p of c.paragraphs as ProseParagraph[]) {
		const links = inlineLinksFor(p);
		regions.push(paragraph(paragraphText(p), links.length ? links : undefined), spacer());
	}
	// The landing page carries the story; the timeline, the side quests and the
	// rest of the CV live on /about.
	regions.push({ type: 'cta', lines: [c.cta], align: 'center' }, spacer());
	regions.push(linkLine(c.links));
	return { id: 'about', fillerLinesBefore: 5, regions };
}

interface ProjectItem {
	id: string;
	heading: string;
	headingType?: string;
	paragraphs: string[];
	metrics?: string;
	statsTemplate?: string;
	statsSource?: string;
	statsText?: string;
	domain?: string;
	url?: string; // canonical site, used by the /about side-project list
}

function buildStatsMap(stats: GitHubStats): Record<string, Record<string, number | undefined>> {
	return {
		pathsim: stats.pathsim as unknown as Record<string, number | undefined>,
		pathview: stats.pathview as unknown as Record<string, number | undefined>,
		pysimhub: stats.pysimhub as unknown as Record<string, number | undefined>
	};
}

function renderProjectItem(
	item: ProjectItem,
	statsMap: Record<string, Record<string, number | undefined>>,
	regions: ContentRegion[],
	options: { readMore?: boolean } = {}
) {
	// A project gets a read-more link when it has a page to read. Deciding that here
	// rather than per section is what lets a side project have one: adding the
	// markdown file is the whole of it, with nothing to remember to switch on.
	const { readMore = !!getStackPage(item.id) } = options;
	regions.push(spacer());
	regions.push({ ...heading(item.heading, HEADING_TYPES[item.headingType ?? ''] ?? 'heading'), id: item.id });
	regions.push(spacer());

	for (const p of item.paragraphs) {
		regions.push(paragraph(p), spacer());
	}

	// Metrics line: hard capability/performance numbers
	if (item.metrics) {
		regions.push(paragraph(item.metrics), spacer());
	}

	// Stats line
	if (item.statsTemplate && item.statsSource) {
		const resolved = resolveStats(item.statsTemplate, statsMap[item.statsSource] ?? {});
		regions.push(linkLine(resolved, LINK_LINE_TYPES[item.id] ?? 'link-line'));
	} else if (item.statsText) {
		regions.push(linkLine(item.statsText, LINK_LINE_TYPES[item.id] ?? 'link-line'));
	}

	// Domain line (rendered when domain is set alongside a stats line,
	// projects using statsText already encode the domain there, so we
	// only emit this extra line when it would not be redundant).
	if (item.domain && item.statsTemplate) {
		regions.push(linkLine(item.domain, LINK_LINE_TYPES[item.id] ?? 'link-line'));
	}

	regions.push(spacer());

	// Embedded tiles
	if (PROJECT_EMBEDS[item.id]) {
		regions.push(PROJECT_EMBEDS[item.id]);
	}

	// Read-more link to the project detail page (unique text per project so
	// the overlay matcher can map it to its href).
	if (readMore) {
		regions.push(spacer());
		regions.push({ type: 'cta', lines: [`[ more on ${item.heading} -> ]`], align: 'center' });
	}

	// Extra spacing between projects
	regions.push(spacer(), spacer());
}

function buildProjectsSection(stats: GitHubStats): ContentSection {
	const c = contentData.projects;
	const regions: ContentRegion[] = [
		sectionHeading(c.heading),
		spacer(),
		paragraph(c.intro),
		spacer()
	];

	const statsMap = buildStatsMap(stats);

	for (const group of c.groups) {
		regions.push(spacer(), spacer());
		regions.push(subsectionHeading(group.heading));
		if ('intro' in group && group.intro) {
			regions.push(spacer(), paragraph(group.intro as string));
		}
		regions.push(spacer());

		for (const item of group.items as ProjectItem[]) {
			renderProjectItem(item, statsMap, regions);
		}
	}

	return { id: 'projects', fillerLinesBefore: 5, regions };
}

// Side projects outside the simulation stack, same tile treatment, but no
// detail pages behind them.
// One card per side project: the heading, its prose, the link line and the FIRST of
// its tiles. A side project does not need two screenshots to make its point, and one
// each is what lets two of them share a row.
function buildProjectCard(
	item: ProjectItem,
	statsMap: Record<string, Record<string, number | undefined>>
): ProjectCard | null {
	const embed = PROJECT_EMBEDS[item.id];
	const tile = embed?.tiles?.[0];
	if (!tile) return null;

	const statsLines: { text: string; type: RegionType }[] = [];
	const linkType = LINK_LINE_TYPES[item.id] ?? 'link-line';
	if (item.statsTemplate && item.statsSource) {
		statsLines.push({
			text: resolveStats(item.statsTemplate, statsMap[item.statsSource] ?? {}),
			type: linkType
		});
		if (item.domain) statsLines.push({ text: item.domain, type: linkType });
	} else if (item.statsText) {
		statsLines.push({ text: item.statsText, type: linkType });
	}

	return {
		id: item.id,
		heading: item.heading,
		headingType: HEADING_TYPES[item.headingType ?? ''] ?? 'heading',
		paragraphs: item.paragraphs,
		statsLines,
		tile,
		frameColor: embed.frameColor,
		// Same rule as a full-width project: a card links onward when there is a page
		// to link to, so adding the markdown file is still the whole of it.
		readMore: getStackPage(item.id) ? `[ more on ${item.heading} -> ]` : undefined
	};
}

function buildOtherSection(stats: GitHubStats): ContentSection {
	const c = contentData.other;
	const regions: ContentRegion[] = [
		sectionHeading(c.heading),
		spacer(),
		paragraph(c.intro),
		spacer()
	];

	const statsMap = buildStatsMap(stats);
	const cards = (c.items as ProjectItem[])
		.map((item) => buildProjectCard(item, statsMap))
		.filter((card): card is ProjectCard => card !== null);

	// Two to a band; an odd last card sits centred on its own.
	for (let i = 0; i < cards.length; i += 2) {
		regions.push(spacer());
		regions.push({ type: 'project-pair', lines: [], cards: cards.slice(i, i + 2) });
		regions.push(spacer(), spacer());
	}

	return { id: 'other', fillerLinesBefore: 5, regions };
}

function buildContactSection(): ContentSection {
	const c = contentData.contact;
	return {
		id: 'contact',
		fillerLinesBefore: 5,
		regions: [
			sectionHeading(c.heading),
			spacer(),
			paragraph(c.intro),
			spacer(),
			{ type: 'cta', lines: [c.cta], align: 'center' },
			spacer(),
			linkLine(c.email),
			spacer(),
			spacer(),
			{ type: 'content', lines: ['// name'], align: 'center' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-name' },
			spacer(),
			{ type: 'content', lines: ['// email'], align: 'center' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-email' },
			spacer(),
			{ type: 'content', lines: ['// subject'], align: 'center' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-subject' },
			spacer(),
			{ type: 'content', lines: ['// message'], align: 'center' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-message-1' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-message-2' },
			{ type: 'form-field', lines: ['> ________________________________________'], align: 'center', id: 'field-message-3' },
			spacer(),
			{ type: 'cta', lines: ['[ SEND MESSAGE -> ]'], align: 'center' },
			spacer(),
			{ type: 'content', lines: [c.privacy], align: 'center' },
		]
	};
}

function buildFooterSection(): ContentSection {
	return {
		fillerLinesBefore: 3,
		regions: [
			{ type: 'footer-line', lines: [contentData.footer.line], align: 'center' },
			spacer(),
			spacer()
		]
	};
}

// --- Main builder ---

export function buildContentSections(stats?: GitHubStats): ContentSection[] {
	const ps = stats?.pathsim ?? defaultStats.current.pathsim;
	const pv = stats?.pathview ?? defaultStats.current.pathview ?? { stars: 0, forks: 0 };
	const ph = stats?.pysimhub ?? defaultStats.current.pysimhub;

	const resolvedStats: GitHubStats = { pathsim: ps, pathview: pv, pysimhub: ph };

	return [
		buildHeroSection(),
		buildPathsSection(),
		buildAboutSection(),
		buildProjectsSection(resolvedStats),
		buildOtherSection(resolvedStats),
		buildContactSection(),
		buildFooterSection()
	];
}

// Default export for backward compatibility
export const contentSections = buildContentSections();
