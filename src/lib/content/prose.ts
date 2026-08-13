// Shared prose model for copy that appears both in the character grid on the
// landing page and as an article page (/about). content.json holds the text
// once; this module translates it into whichever shape the renderer needs:
//
//   - the grid wants a plain string plus { phrase, project } inline links
//   - the article grid wants TextSegment[] with real hrefs
//
// Keeping the translation here is what makes content.json the single source of
// truth for the story instead of two copies drifting apart.

import type { AccentKey, TextSegment } from '$lib/layout/articleLayout';

// A link inside a paragraph. `project` colors the phrase in the project accent
// and, on the landing page, makes it scroll to that project's block. `href`
// overrides the derived target (used for links that leave the stack).
export interface ProseLink {
	phrase: string;
	project?: string;
	href?: string;
}

export type ProseParagraph = string | { text: string; links?: ProseLink[] };

// Project id -> accent color. Projects without their own color borrow the one
// of the family they belong to (same mapping the grid uses for cell types).
export const PROJECT_ACCENT: Record<string, AccentKey> = {
	pathsim: 'pathsim',
	pathview: 'pathsim',
	fastsim: 'fastsim',
	sane: 'sane',
	rslab: 'rslab',
	rapidpassives: 'rapidpassives',
	rapidfem: 'rapidpassives',
	rapidmom: 'rapidpassives',
	rapidmesh: 'rapidpassives',
	pysimhub: 'pysimhub',
	scidata: 'scidata',
	thesisos: 'thesisos',
	whatsmytraffic: 'whatsmytraffic'
};

// Projects with a detail page under /stack. The side projects deliberately
// have none — they link out to their own sites instead.
const STACK_SLUGS = new Set([
	'pathsim', 'pathview', 'fastsim', 'sane',
	'rapidmom', 'rapidfem', 'rapidpassives', 'rslab', 'rapidmesh'
]);

export function accentFor(project?: string): AccentKey {
	return (project && PROJECT_ACCENT[project]) || 'neutral';
}

// Hover glow per accent, matching PortalTile's palette so a framed image on an
// article page lights up in the same colour as the same project's tile on the
// landing page.
const GLOW: Record<AccentKey, string> = {
	pathsim: 'rgba(0, 112, 192, 0.3)',
	pysimhub: 'rgba(99, 102, 241, 0.3)',
	rapidpassives: 'rgba(217, 81, 60, 0.3)',
	scidata: 'rgba(216, 53, 26, 0.3)',
	fastsim: 'rgba(209, 65, 41, 0.3)',
	sane: 'rgba(78, 149, 217, 0.3)',
	rslab: 'rgba(59, 130, 246, 0.3)',
	thesisos: 'rgba(107, 138, 253, 0.3)',
	whatsmytraffic: 'rgba(111, 220, 142, 0.3)',
	neutral: 'rgba(150, 149, 145, 0.25)'
};

export function glowFor(accent: AccentKey | undefined): string {
	return GLOW[accent ?? 'neutral'] ?? GLOW.neutral;
}

export function hrefFor(link: ProseLink): string | undefined {
	if (link.href) return link.href;
	if (link.project && STACK_SLUGS.has(link.project)) return `/stack/${link.project}/`;
	return undefined;
}

export function paragraphText(p: ProseParagraph): string {
	return typeof p === 'string' ? p : p.text;
}

export function paragraphLinks(p: ProseParagraph): ProseLink[] {
	return typeof p === 'string' ? [] : (p.links ?? []);
}

// Grid flavor: only phrases tied to a project survive. The grid colors them by
// substring match per rendered line, so multi-word phrases (which may wrap)
// stay plain text there.
export function inlineLinksFor(p: ProseParagraph): { phrase: string; project: string }[] {
	return paragraphLinks(p)
		.filter((l): l is ProseLink & { project: string } => Boolean(l.project) && !l.phrase.includes(' '))
		.map(({ phrase, project }) => ({ phrase, project }));
}

// Article flavor: split the text at each link phrase so the article grid gets
// linked segments. Phrases are matched in text order; a phrase that does not
// occur is skipped.
export function toSegments(p: ProseParagraph): TextSegment[] {
	const text = paragraphText(p);
	const links = paragraphLinks(p);
	if (links.length === 0) return [{ text }];

	// First occurrence of every phrase, sorted by position, non-overlapping.
	const hits = links
		.map((link) => ({ link, at: text.indexOf(link.phrase) }))
		.filter((h) => h.at >= 0)
		.sort((a, b) => a.at - b.at);

	const segments: TextSegment[] = [];
	let cursor = 0;
	for (const { link, at } of hits) {
		if (at < cursor) continue; // overlaps an earlier phrase
		const href = hrefFor(link);
		if (!href) continue;
		if (at > cursor) segments.push({ text: text.slice(cursor, at) });
		segments.push({ text: link.phrase, href, accent: accentFor(link.project) });
		cursor = at + link.phrase.length;
	}
	if (cursor < text.length) segments.push({ text: text.slice(cursor) });
	return segments;
}
