// The CV timeline as content, not as code. content.json holds the entries in
// the same prose shape as the rest of the copy ({ text, links } paragraphs,
// project ids instead of hand-written accents and hrefs); this module
// translates them into the TimelineEntry the article grid renders.
//
// The point is the same one prose.ts makes for the story paragraphs: an entry
// is a fact about a year, and facts belong next to the other facts, not inside
// a component.

import type { AccentKey, TimelineEntry, TimelineImage } from '$lib/layout/articleLayout';
import { accentFor, hrefFor, toSegments, type ProseParagraph } from './prose';

// One artifact of an entry. `project` points the tile at that project's stack
// page and is the usual case; `href` covers everything that lives elsewhere.
export interface TimelineImageJson {
	src: string;
	label: string;
	project?: string;
	href?: string;
	fit?: 'cover' | 'contain';
	background?: string;
}

export interface TimelineEntryJson {
	period: string;
	heading: string;
	// Accent for the heading, connector and tile glow. A project id borrows that
	// project's colour; `accent` sets one directly for entries without a project.
	project?: string;
	accent?: AccentKey;
	body?: ProseParagraph[];
	images?: TimelineImageJson[];
	links?: { text: string; href?: string; project?: string }[];
}

function imageOf(img: TimelineImageJson): TimelineImage {
	return {
		src: img.src,
		label: img.label,
		href: img.href ?? hrefFor({ phrase: img.label, project: img.project }),
		fit: img.fit,
		background: img.background
	};
}

export function toTimeline(entries: TimelineEntryJson[]): TimelineEntry[] {
	return entries.map((entry) => ({
		period: entry.period,
		heading: entry.heading,
		accent: entry.accent ?? accentFor(entry.project),
		body: (entry.body ?? []).map(toSegments),
		images: (entry.images ?? []).map(imageOf),
		links: (entry.links ?? [])
			.map((l) => ({ text: l.text, href: l.href ?? hrefFor({ phrase: l.text, project: l.project }) }))
			.filter((l): l is { text: string; href: string } => Boolean(l.href))
	}));
}

// Plain-text flattening for the semantic (screen-reader / SEO) markup.
export function entryText(entry: TimelineEntryJson): string {
	return (entry.body ?? [])
		.map((p) => (typeof p === 'string' ? p : p.text))
		.join(' ');
}
