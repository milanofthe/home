// Build-time content loading: markdown files under src/content are bundled
// as raw strings and parsed once at module init. Everything is prerendered,
// so this cost is paid at build, not per visit.

import { parseMarkdown, accentKey, type ArticleDoc } from './markdown';
import type { AccentKey } from '$lib/layout/articleLayout';

const noteModules = import.meta.glob('/src/content/notes/*.md', {
	query: '?raw', import: 'default', eager: true
}) as Record<string, string>;

const stackModules = import.meta.glob('/src/content/stack/*.md', {
	query: '?raw', import: 'default', eager: true
}) as Record<string, string>;

export interface Note {
	slug: string;
	doc: ArticleDoc;
	title: string;
	date: string; // YYYY-MM-DD
	project: string; // tag, also picks the accent color
	accent: AccentKey;
	description: string;
	readingMinutes: number;
}

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

function wordCount(doc: ArticleDoc): number {
	let n = 0;
	for (const b of doc.blocks) {
		if (b.kind === 'paragraph') for (const s of b.segments) n += s.text.split(' ').length;
		if (b.kind === 'list') for (const it of b.items) for (const s of it) n += s.text.split(' ').length;
	}
	return n;
}

function buildNotes(): Note[] {
	const notes: Note[] = [];
	for (const [path, raw] of Object.entries(noteModules)) {
		const doc = parseMarkdown(raw);
		const fm = doc.frontmatter;
		notes.push({
			slug: slugOf(path),
			doc,
			title: fm.title ?? slugOf(path),
			date: fm.date ?? '',
			project: fm.project ?? '',
			accent: accentKey(fm.project),
			description: fm.description ?? '',
			readingMinutes: Math.max(1, Math.round(wordCount(doc) / 220))
		});
	}
	notes.sort((a, b) => b.date.localeCompare(a.date));
	return notes;
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

export const notes: Note[] = buildNotes();
export const stackPages: StackPage[] = buildStackPages();

export function getNote(slug: string): Note | undefined {
	return notes.find(n => n.slug === slug);
}

export function getStackPage(slug: string): StackPage | undefined {
	return stackPages.find(p => p.slug === slug);
}

export function notesFor(project: string): Note[] {
	return notes.filter(n => n.project === project);
}
