// Declarative content structure for the code rain grid
// Content text lives in content.json — this file handles layout and structure

import contentData from '$lib/data/content.json';
import defaultStats from '$lib/data/github-stats.json';

export interface GitHubStats {
	pathsim: { stars: number; forks: number; watchers?: number; openIssues?: number };
	pathview: { stars: number; forks: number; watchers?: number; openIssues?: number };
	pysimhub: { projects: number; members?: number; cumulativeStars: number };
}

export type RegionType = 'heading' | 'heading-pathsim' | 'heading-pysimhub' | 'heading-rapidpassives' | 'paragraph' | 'spacer' | 'embedded' | 'cta' | 'link-line' | 'link-line-pathsim' | 'link-line-pysimhub' | 'link-line-rapidpassives' | 'footer-line' | 'content' | 'form-field';

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
	frameColor?: 'pathsim' | 'pysimhub' | 'rapidpassives'; // project color for frame
	align?: 'center' | 'left';
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

const paragraph = (text: string): ContentRegion => ({
	type: 'paragraph', lines: [text], align: 'center'
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
		embeddedRows: 10, embeddedCols: 34, align: 'center',
		tiles: [{ id: 'pathsim-org', label: 'PathSim' }, { id: 'docs-pathsim-org', label: 'Docs' }]
	},
	pathview: {
		type: 'embedded', lines: [], frameColor: 'pathsim',
		embeddedRows: 10, embeddedCols: 34, align: 'center',
		tiles: [{ id: 'pathview-trailer', label: 'Demo' }, { id: 'view-pathsim-org', label: 'PathView' }]
	},
	pysimhub: {
		type: 'embedded', lines: [], frameColor: 'pysimhub',
		embeddedRows: 10, embeddedCols: 34, align: 'center',
		tiles: [{ id: 'pysimhub-io', label: 'PySimHub' }, { id: 'pysimhub-pathsim', label: 'Project Page' }]
	},
	rapidpassives: {
		type: 'embedded', lines: [], frameColor: 'rapidpassives',
		embeddedRows: 10, embeddedCols: 34, align: 'center',
		tiles: [{ id: 'rapidpassives-org', label: 'RapidPassives' }, { id: 'rapidpassives-transformer', label: 'Transformer' }]
	}
};

const LINK_LINE_TYPES: Record<string, RegionType> = {
	pathsim: 'link-line-pathsim',
	pathview: 'link-line-pathsim',
	pysimhub: 'link-line-pysimhub',
	rapidpassives: 'link-line-rapidpassives'
};

const HEADING_TYPES: Record<string, RegionType> = {
	pathsim: 'heading-pathsim',
	pysimhub: 'heading-pysimhub',
	rapidpassives: 'heading-rapidpassives'
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
		heading(c.heading),
		spacer()
	];
	for (const p of c.paragraphs) {
		regions.push(paragraph(p), spacer());
	}
	regions.push(linkLine(c.links));
	return { id: 'about', fillerLinesBefore: 5, regions };
}

function buildProjectsSection(stats: GitHubStats): ContentSection {
	const c = contentData.projects;
	const regions: ContentRegion[] = [
		heading(c.heading),
		spacer(),
		paragraph(c.intro),
		spacer()
	];

	const statsMap: Record<string, Record<string, number | undefined>> = {
		pathsim: stats.pathsim as unknown as Record<string, number | undefined>,
		pathview: stats.pathview as unknown as Record<string, number | undefined>,
		pysimhub: stats.pysimhub as unknown as Record<string, number | undefined>
	};

	for (const item of c.items) {
		regions.push(spacer());
		regions.push(heading(item.heading, HEADING_TYPES[item.headingType] ?? 'heading'));
		regions.push(spacer());

		for (const p of item.paragraphs) {
			regions.push(paragraph(p), spacer());
		}

		// Stats line
		if (item.statsTemplate && item.statsSource) {
			const resolved = resolveStats(item.statsTemplate, statsMap[item.statsSource] ?? {});
			regions.push(linkLine(resolved, LINK_LINE_TYPES[item.id] ?? 'link-line'));
		} else if (item.statsText) {
			regions.push(linkLine(item.statsText, LINK_LINE_TYPES[item.id] ?? 'link-line'));
		}

		regions.push(spacer());

		// Embedded tiles
		if (PROJECT_EMBEDS[item.id]) {
			regions.push(PROJECT_EMBEDS[item.id]);
		}

		// Extra spacing between projects
		regions.push(spacer(), spacer());
	}

	return { id: 'projects', fillerLinesBefore: 5, regions };
}

function buildServicesSection(): ContentSection {
	const c = contentData.services;
	const regions: ContentRegion[] = [
		heading(c.heading),
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
			heading(c.heading),
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
		buildServicesSection(),
		buildContactSection(),
		buildFooterSection()
	];
}

// Default export for backward compatibility
export const contentSections = buildContentSections();
