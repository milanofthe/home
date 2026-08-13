// Minimal markdown subset for the grid article pages. No external parser,
// the renderer targets a character grid, not HTML, so a small block/segment
// model beats a full AST.
//
// Supported:
//   --- frontmatter ---        key: value pairs
//   # / ## / ###               title / section heading / subheading
//   paragraph text             with [text](href) inline links, **bold** and
//                              `code` markers stripped
//   ![label](src)              centered framed image
//   ![label|right|46x18](src)  floated image; the following paragraph wraps
//                              beside it (left|right|center, WxH in cells)
//   ``` fenced code ```        framed code block (optional language as label)
//   - item                     list items

import type { TextSegment, AccentKey } from '$lib/layout/articleLayout';

export type Block =
	| { kind: 'title'; text: string }
	| { kind: 'heading'; text: string }
	| { kind: 'subheading'; text: string }
	| { kind: 'paragraph'; segments: TextSegment[] }
	| { kind: 'image'; src: string; label: string; side: 'left' | 'right' | 'center'; w: number; h: number; fit?: 'contain' }
	| { kind: 'code'; code: string; label: string }
	| { kind: 'list'; items: TextSegment[][] };

export interface ArticleDoc {
	frontmatter: Record<string, string>;
	blocks: Block[];
}

const IMAGE_RE = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

// Accents recognized as `accent:` frontmatter and link color overrides.
const ACCENTS = new Set([
	'pathsim', 'pysimhub', 'rapidpassives', 'scidata', 'fastsim',
	'sane', 'rslab', 'thesisos', 'whatsmytraffic', 'neutral'
]);

export function accentKey(value: string | undefined): AccentKey {
	return value && ACCENTS.has(value) ? (value as AccentKey) : 'neutral';
}

function stripInlineMarkers(text: string): string {
	return text
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/`([^`]+)`/g, '$1');
}

// Split a text line into plain/link segments.
export function parseSegments(text: string): TextSegment[] {
	const segments: TextSegment[] = [];
	let last = 0;
	for (const m of text.matchAll(LINK_RE)) {
		if (m.index! > last) {
			segments.push({ text: stripInlineMarkers(text.slice(last, m.index)) });
		}
		segments.push({ text: stripInlineMarkers(m[1]), href: m[2] });
		last = m.index! + m[0].length;
	}
	if (last < text.length) {
		segments.push({ text: stripInlineMarkers(text.slice(last)) });
	}
	return segments.filter(s => s.text.length > 0);
}

function parseImageLabel(raw: string): { label: string; side: 'left' | 'right' | 'center'; w: number; h: number; fit?: 'contain' } {
	const parts = raw.split('|').map(p => p.trim());
	let label = parts[0] || '';
	let side: 'left' | 'right' | 'center' = 'center';
	let w = 46;
	let h = 14;
	let fit: 'contain' | undefined;
	for (const p of parts.slice(1)) {
		if (p === 'left' || p === 'right' || p === 'center') side = p;
		else if (p === 'contain') fit = 'contain';
		else {
			const m = p.match(/^(\d+)x(\d+)$/);
			if (m) { w = parseInt(m[1]); h = parseInt(m[2]); }
		}
	}
	return { label, side, w, h, fit };
}

export function parseMarkdown(raw: string): ArticleDoc {
	const frontmatter: Record<string, string> = {};
	const blocks: Block[] = [];
	let lines = raw.replace(/\r\n/g, '\n').split('\n');

	// frontmatter
	if (lines[0]?.trim() === '---') {
		const end = lines.indexOf('---', 1);
		if (end > 0) {
			for (const l of lines.slice(1, end)) {
				const idx = l.indexOf(':');
				if (idx > 0) frontmatter[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
			}
			lines = lines.slice(end + 1);
		}
	}

	let paragraph: string[] = [];
	let list: TextSegment[][] | null = null;

	const flushParagraph = () => {
		if (paragraph.length) {
			blocks.push({ kind: 'paragraph', segments: parseSegments(paragraph.join(' ')) });
			paragraph = [];
		}
	};
	const flushList = () => {
		if (list) {
			blocks.push({ kind: 'list', items: list });
			list = null;
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		// fenced code
		if (trimmed.startsWith('```')) {
			flushParagraph();
			flushList();
			const label = trimmed.slice(3).trim();
			const codeLines: string[] = [];
			i++;
			while (i < lines.length && !lines[i].trim().startsWith('```')) {
				codeLines.push(lines[i]);
				i++;
			}
			blocks.push({ kind: 'code', code: codeLines.join('\n'), label });
			continue;
		}

		if (trimmed === '') {
			flushParagraph();
			flushList();
			continue;
		}

		const img = trimmed.match(IMAGE_RE);
		if (img) {
			flushParagraph();
			flushList();
			const { label, side, w, h, fit } = parseImageLabel(img[1]);
			blocks.push({ kind: 'image', src: img[2], label, side, w, h, fit });
			continue;
		}

		if (trimmed.startsWith('### ')) {
			flushParagraph();
			flushList();
			blocks.push({ kind: 'subheading', text: stripInlineMarkers(trimmed.slice(4)) });
			continue;
		}
		if (trimmed.startsWith('## ')) {
			flushParagraph();
			flushList();
			blocks.push({ kind: 'heading', text: stripInlineMarkers(trimmed.slice(3)) });
			continue;
		}
		if (trimmed.startsWith('# ')) {
			flushParagraph();
			flushList();
			blocks.push({ kind: 'title', text: stripInlineMarkers(trimmed.slice(2)) });
			continue;
		}

		if (trimmed.startsWith('- ')) {
			flushParagraph();
			if (!list) list = [];
			list.push(parseSegments(trimmed.slice(2)));
			continue;
		}

		paragraph.push(trimmed);
	}
	flushParagraph();
	flushList();

	return { frontmatter, blocks };
}

// Semantic HTML for the sr-only SEO layer (grid is aria-hidden).
export function blocksToHtml(blocks: Block[]): string {
	const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const segs = (ss: TextSegment[]) =>
		ss.map(s => (s.href ? `<a href="${esc(s.href)}">${esc(s.text)}</a>` : esc(s.text))).join(' ');
	const parts: string[] = [];
	for (const b of blocks) {
		switch (b.kind) {
			case 'title': parts.push(`<h1>${esc(b.text)}</h1>`); break;
			case 'heading': parts.push(`<h2>${esc(b.text)}</h2>`); break;
			case 'subheading': parts.push(`<h3>${esc(b.text)}</h3>`); break;
			case 'paragraph': parts.push(`<p>${segs(b.segments)}</p>`); break;
			case 'image': parts.push(`<p><img src="${esc(b.src)}" alt="${esc(b.label)}"></p>`); break;
			case 'code': parts.push(`<pre><code>${esc(b.code)}</code></pre>`); break;
			case 'list': parts.push(`<ul>${b.items.map(it => `<li>${segs(it)}</li>`).join('')}</ul>`); break;
		}
	}
	return parts.join('\n');
}
