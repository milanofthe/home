// Build-time content loading: markdown files under src/content are bundled
// as raw strings and parsed once at module init. Everything is prerendered,
// so this cost is paid at build, not per visit.

import { parseMarkdown, accentKey, type ArticleDoc } from './markdown';
import type { AccentKey } from '$lib/layout/articleLayout';

const stackModules = import.meta.glob('/src/content/stack/*.md', {
	query: '?raw', import: 'default', eager: true
}) as Record<string, string>;

export interface StackPage {
	slug: string;
	doc: ArticleDoc;
	title: string;
	accent: AccentKey;
	tagline: string;
	group: string; // systems | circuits | fields | foundations
	order: number;
}

function slugOf(path: string): string {
	return path.split('/').pop()!.replace(/\.md$/, '');
}

function buildStackPages(): StackPage[] {
	const pages: StackPage[] = [];
	for (const [path, raw] of Object.entries(stackModules)) {
		const doc = parseMarkdown(raw);
		const fm = doc.frontmatter;
		pages.push({
			slug: slugOf(path),
			doc,
			title: fm.title ?? slugOf(path),
			accent: accentKey(fm.accent ?? fm.project),
			tagline: fm.tagline ?? '',
			group: fm.group ?? '',
			order: parseInt(fm.order ?? '99')
		});
	}
	pages.sort((a, b) => a.order - b.order);
	return pages;
}

export const stackPages: StackPage[] = buildStackPages();

export function getStackPage(slug: string): StackPage | undefined {
	return stackPages.find(p => p.slug === slug);
}
