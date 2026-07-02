// Declarative content structure for the code rain grid
// Content text lives in content.json — this file handles layout and structure

import contentData from '$lib/data/content.json';
import defaultStats from '$lib/data/github-stats.json';

export interface GitHubStats {
	pathsim: { stars: number; forks: number; watchers?: number; openIssues?: number };
	pathview: { stars: number; forks: number; watchers?: number; openIssues?: number };
	pysimhub: { projects: number; members?: number; cumulativeStars: number };
}

export type RegionType = 'heading' | 'heading-pathsim' | 'heading-pysimhub' | 'heading-rapidpassives' | 'heading-scidata' | 'heading-fastsim' | 'heading-sane' | 'heading-thesisos' | 'heading-whatsmytraffic' | 'paragraph' | 'spacer' | 'embedded' | 'cta' | 'link-line' | 'link-line-pathsim' | 'link-line-pysimhub' | 'link-line-rapidpassives' | 'link-line-scidata' | 'link-line-fastsim' | 'link-line-sane' | 'link-line-thesisos' | 'link-line-whatsmytraffic' | 'footer-line' | 'content' | 'form-field';

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
	frameColor?: 'pathsim' | 'pysimhub' | 'rapidpassives' | 'scidata' | 'fastsim' | 'sane' | 'thesisos' | 'whatsmytraffic'; // project color for frame
	align?: 'center' | 'left';
	fill?: boolean; // pad heading with dashes up to the content width
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

// Section title padded with dashes up to the content width (divider look)
const sectionHeading = (text: string): ContentRegion => ({
	...heading(text), fill: true
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
	rapidfem: {
		// Shares the rapidpassives brand color.
		type: 'embedded', lines: [], frameColor: 'rapidpassives',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'rapidfem-editor', label: 'Notebook' }, { id: 'rapidfem-microstrip', label: 'Microstrip' }]
	},
	scidata: {
		type: 'embedded', lines: [], frameColor: 'scidata',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'scidata-io', label: 'SciData' }, { id: 'scidata-app', label: 'Canvas' }]
	},
	fastsim: {
		type: 'embedded', lines: [], frameColor: 'fastsim',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'fastsim-org', label: 'FastSim' }]
	},
	thesisos: {
		type: 'embedded', lines: [], frameColor: 'thesisos',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'thesisos-landing', label: 'Landing' }, { id: 'thesisos-graph', label: 'Graph' }]
	},
	whatsmytraffic: {
		type: 'embedded', lines: [], frameColor: 'whatsmytraffic',
		embeddedRows: 14, embeddedCols: 54, align: 'center',
		tiles: [{ id: 'whatsmytraffic-landing', label: 'Landing' }, { id: 'whatsmytraffic-dashboard', label: 'Dashboard' }]
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
	thesisos: 'link-line-thesisos',
	whatsmytraffic: 'link-line-whatsmytraffic'
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
	thesisos: 'heading-thesisos',
	whatsmytraffic: 'heading-whatsmytraffic'
};

// --- Section builders ---

function buildHeroSection(): ContentSection {
	const c = contentData.hero;
	return {
		fillerLinesBefore: 5,
		regions: [
			{
				type: 'embedded', lines: [], embeddedId: 'photo',
				label: 'milan.png', embeddedRows: 10, embeddedCols: 22, align: 'center'
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

function buildAboutSection(): ContentSection {
	const c = contentData.about;
	const regions: ContentRegion[] = [
		sectionHeading(c.heading),
		spacer()
	];
	for (const p of c.paragraphs) {
		if (typeof p === 'string') {
			regions.push(paragraph(p), spacer());
		} else {
			// Paragraph with inline, colored, clickable project links (see clickTargets in CodeRainPage)
			regions.push(paragraph(p.text, p.links), spacer());
		}
	}
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
	regions: ContentRegion[]
) {
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

	// Domain line (rendered when domain is set alongside a stats line —
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
		regions.push(heading(group.heading));
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

function buildOtherSection(stats: GitHubStats): ContentSection {
	const c = contentData.other;
	const regions: ContentRegion[] = [
		sectionHeading(c.heading),
		spacer(),
		paragraph(c.intro),
		spacer()
	];

	const statsMap = buildStatsMap(stats);

	for (const item of c.items as ProjectItem[]) {
		renderProjectItem(item, statsMap, regions);
	}

	return { id: 'other', fillerLinesBefore: 5, regions };
}

function buildServicesSection(): ContentSection {
	const c = contentData.services;
	const regions: ContentRegion[] = [
		sectionHeading(c.heading),
		spacer(),
		paragraph(c.intro),
		spacer(),
		spacer()
	];

	for (const cat of c.categories) {
		regions.push(heading(cat.heading));
		regions.push(paragraph(cat.text));
		regions.push(spacer());
	}

	regions.push(paragraph(c.closing));

	return { id: 'services', fillerLinesBefore: 5, regions };
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
		buildAboutSection(),
		buildProjectsSection(resolvedStats),
		buildOtherSection(resolvedStats),
		buildServicesSection(),
		buildContactSection(),
		buildFooterSection()
	];
}

// Default export for backward compatibility
export const contentSections = buildContentSections();
