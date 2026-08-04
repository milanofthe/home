// Article grid engine: the /lab prototype's layout primitives, extracted and
// parametrized. Builds the same Cell[][] the landing grid uses, but with an
// article flow: title, paragraphs with inline links, floated framed images,
// code blocks. Used by /stack/<project>, /notes/<slug> and the other subpages.

import { FILLER_SOURCE } from '$lib/data/filler-source';
import type { Cell, CellType } from './gridLayout';

// Project accent — maps to the existing code-grid-* color classes.
export type AccentKey =
	| 'pathsim' | 'pysimhub' | 'rapidpassives' | 'scidata' | 'fastsim'
	| 'sane' | 'rslab' | 'thesisos' | 'whatsmytraffic' | 'neutral';

interface AccentTypes {
	heading: CellType;
	link: CellType;
	frame: CellType;
}

const NEUTRAL: AccentTypes = { heading: 'heading', link: 'link', frame: 'frame' };

function accentTypes(accent: AccentKey): AccentTypes {
	if (accent === 'neutral') return NEUTRAL;
	return {
		heading: `heading-${accent}` as CellType,
		link: `link-${accent}` as CellType,
		frame: `frame-${accent}` as CellType
	};
}

// Accent for inline links that point at another project's page.
export function linkTypeFor(accent: AccentKey): CellType {
	return accentTypes(accent).link;
}

export interface ArticleImage {
	src: string;
	label: string;
	href?: string;
	row: number;
	col: number;
	rows: number;
	cols: number;
	fit?: 'cover' | 'contain';
	background?: string;
}

export interface ArticleOverlay {
	row: number;
	col: number;
	length: number;
	label: string;
	href: string;
}

export interface ArticleResult {
	cells: Cell[][];
	images: ArticleImage[];
	overlays: ArticleOverlay[];
	rows: number;
}

// A paragraph is a list of segments; segments with href render in the accent
// link color and get a click overlay.
export interface TextSegment {
	text: string;
	href?: string;
	accent?: AccentKey; // link color override (defaults to article accent)
}

export class ArticleGrid {
	readonly cols: number;
	readonly contentWidth: number;
	readonly startCol: number;
	readonly twoCol: boolean;

	private accent: AccentTypes;
	private grid: Cell[][] = [];
	private images: ArticleImage[] = [];
	private overlays: ArticleOverlay[] = [];
	private row: number;

	constructor(cols: number, accent: AccentKey = 'neutral', topRows = 3) {
		this.cols = cols;
		this.accent = accentTypes(accent);
		this.contentWidth = Math.min(cols - 8, 104);
		this.startCol = Math.floor((cols - this.contentWidth) / 2);
		this.twoCol = this.contentWidth >= 78;
		this.row = topRows;
	}

	setAccent(accent: AccentKey) {
		this.accent = accentTypes(accent);
	}

	// --- low-level cell access ---

	private fillerChar(r: number, c: number): string {
		return FILLER_SOURCE[((r * this.cols) + c) % FILLER_SOURCE.length];
	}

	private ensureRow(r: number) {
		while (this.grid.length <= r) {
			const rr = this.grid.length;
			const row: Cell[] = [];
			for (let c = 0; c < this.cols; c++) row.push({ char: this.fillerChar(rr, c), type: 'filler' });
			this.grid.push(row);
		}
	}

	private setCell(r: number, c: number, char: string, type: CellType) {
		this.ensureRow(r);
		if (c >= 0 && c < this.cols) this.grid[r][c] = { char, type };
	}

	private placeLine(r: number, col: number, text: string, type: CellType) {
		for (let j = 0; j < text.length; j++) this.setCell(r, col + j, text[j], type);
	}

	// --- text ---

	static wordWrap(text: string, maxWidth: number): string[] {
		const words = text.split(' ');
		const lines: string[] = [];
		let cur = '';
		for (const w of words) {
			if (cur && (cur + ' ' + w).length > maxWidth) {
				lines.push(cur);
				cur = w;
			} else {
				cur = cur ? cur + ' ' + w : w;
			}
		}
		if (cur) lines.push(cur);
		return lines;
	}

	spacer(n = 1) {
		this.ensureRow(this.row + n - 1);
		this.row += n;
	}

	// Page title in the accent color, with an optional plain subtitle line.
	title(text: string, subtitle?: string) {
		this.placeLine(this.row, this.startCol, text, this.accent.heading);
		this.row += 1;
		if (subtitle) {
			this.placeLine(this.row, this.startCol, subtitle, 'content');
			this.row += 1;
		}
		this.row += 1;
	}

	// Meta line under the title (date / tags / reading time) — muted link style.
	metaLine(text: string) {
		this.placeLine(this.row, this.startCol, text, 'link');
		this.row += 2;
	}

	// Section heading inside the article, padded with the fill char to the
	// content width (same divider look as the landing page).
	sectionHeading(text: string, fillChar = '-') {
		const target = this.contentWidth;
		let line = text;
		if (text.length < target - 4) {
			const total = target - text.length - 2;
			const left = Math.floor(total / 2);
			line = fillChar.repeat(left) + ' ' + text + ' ' + fillChar.repeat(total - left);
		}
		this.placeLine(this.row, this.startCol, line, this.accent.heading);
		this.row += 2;
	}

	// Plain left-aligned subheading.
	heading(text: string) {
		this.placeLine(this.row, this.startCol, text, this.accent.heading);
		this.row += 2;
	}

	// Segment-aware paragraph: wraps across the full content width; link
	// segments are colored and get click overlays. Link phrases wrap like
	// normal text — overlays are recorded per line.
	paragraph(segments: string | TextSegment[], width?: number, col?: number, startRow?: number): number {
		const segs: TextSegment[] = typeof segments === 'string' ? [{ text: segments }] : segments;
		const w = width ?? this.contentWidth;
		const c = col ?? this.startCol;
		const r0 = startRow ?? this.row;

		interface Tok { word: string; href?: string; label?: string; accent?: AccentKey; glue?: boolean }
		const toks: Tok[] = [];
		for (const seg of segs) {
			let first = true;
			for (const word of seg.text.split(' ')) {
				if (word.length === 0) continue;
				// Punctuation opening a segment attaches to the previous token
				// (no space before ", an open-source library" after a link).
				const glue = first && /^[,.;:!?)]/.test(word);
				toks.push({ word, href: seg.href, label: seg.text, accent: seg.accent, glue });
				first = false;
			}
		}

		// wrap tokens into lines
		const lines: Tok[][] = [];
		let cur: Tok[] = [];
		let curLen = 0;
		for (const t of toks) {
			const sep = cur.length === 0 || t.glue ? 0 : 1;
			const extra = t.word.length + sep;
			if (cur.length > 0 && curLen + extra > w) {
				lines.push(cur);
				cur = [{ ...t, glue: false }];
				curLen = t.word.length;
			} else {
				cur.push(t);
				curLen += extra;
			}
		}
		if (cur.length > 0) lines.push(cur);

		// place lines, record overlays for consecutive same-href runs
		lines.forEach((line, i) => {
			const r = r0 + i;
			let cc = c;
			let runStart = -1;
			let runHref: string | undefined;
			let runLabel = '';
			const flushRun = (end: number) => {
				if (runHref && runStart >= 0) {
					this.overlays.push({ row: r, col: runStart, length: end - runStart, label: runLabel, href: runHref });
				}
				runStart = -1;
				runHref = undefined;
			};
			line.forEach((t, j) => {
				if (j > 0 && !t.glue) {
					// space between tokens: joins a link run if both sides share the href
					const sameRun = runHref && t.href === runHref;
					this.setCell(r, cc, ' ', sameRun ? this.linkCellType(t.accent) : 'content');
					if (!sameRun) flushRun(cc);
					cc += 1;
				} else if (j > 0 && t.glue && runHref && t.href !== runHref) {
					flushRun(cc);
				}
				if (t.href) {
					if (t.href !== runHref) {
						flushRun(cc);
						runStart = cc;
						runHref = t.href;
						runLabel = t.label ?? t.word;
					}
					this.placeLine(r, cc, t.word, this.linkCellType(t.accent));
				} else {
					flushRun(cc);
					this.placeLine(r, cc, t.word, 'content');
				}
				cc += t.word.length;
			});
			flushRun(cc);
		});

		if (startRow === undefined) {
			this.row = r0 + lines.length + 1;
		}
		return lines.length;
	}

	private linkCellType(accent?: AccentKey): CellType {
		return accent ? accentTypes(accent).link : this.accent.link;
	}

	// Standalone clickable line (e.g. "[ read more -> ]" or a bare URL).
	linkLine(text: string, href: string, cellType?: CellType) {
		this.placeLine(this.row, this.startCol, text, cellType ?? this.accent.link);
		this.overlays.push({ row: this.row, col: this.startCol, length: text.length, label: text, href });
		this.row += 2;
	}

	// CTA row: several bracketed buttons on one line (wraps onto separate
	// lines when they don't fit).
	cta(buttons: { text: string; href: string }[]) {
		const joined = buttons.map(b => b.text).join('   ');
		if (joined.length <= this.contentWidth) {
			let c = this.startCol;
			for (const b of buttons) {
				this.placeLine(this.row, c, b.text, 'cta');
				this.overlays.push({ row: this.row, col: c, length: b.text.length, label: b.text, href: b.href });
				c += b.text.length + 3;
			}
			this.row += 2;
		} else {
			for (const b of buttons) {
				this.placeLine(this.row, this.startCol, b.text, 'cta');
				this.overlays.push({ row: this.row, col: this.startCol, length: b.text.length, label: b.text, href: b.href });
				this.row += 2;
			}
		}
	}

	// List item with a "- " bullet, wrapped with hanging indent.
	listItem(segments: string | TextSegment[]) {
		this.placeLine(this.row, this.startCol, '-', this.accent.heading);
		const segs: TextSegment[] = typeof segments === 'string' ? [{ text: segments }] : segments;
		const lines = this.paragraph(segs, this.contentWidth - 2, this.startCol + 2, this.row);
		this.row += lines;
	}

	// --- frames ---

	private buildFrameTop(w: number, label: string): string {
		const maxLabel = w - 5;
		const t = label.slice(0, Math.max(0, maxLabel));
		if (!t) return '+' + '-'.repeat(w - 2) + '+';
		const prefix = '+- ' + t + ' ';
		return prefix + '-'.repeat(Math.max(0, w - prefix.length - 1)) + '+';
	}

	// Terminal frame with an image overlay inside. Returns rows consumed.
	private drawFrame(
		startRow: number, col: number, w: number, h: number,
		label: string, src: string, opts?: { href?: string; fit?: 'cover' | 'contain'; background?: string }
	): number {
		this.placeLine(startRow, col, this.buildFrameTop(w, label), this.accent.frame);
		for (let r = 1; r <= h; r++) {
			this.setCell(startRow + r, col, '|', this.accent.frame);
			this.setCell(startRow + r, col + w - 1, '|', this.accent.frame);
			for (let c = col + 1; c < col + w - 1; c++) {
				this.ensureRow(startRow + r);
				this.grid[startRow + r][c] = { char: this.grid[startRow + r][c].char, type: 'empty' };
			}
		}
		this.placeLine(startRow + h + 1, col, '+' + '-'.repeat(w - 2) + '+', this.accent.frame);
		this.images.push({
			src, label, href: opts?.href, fit: opts?.fit, background: opts?.background,
			row: startRow + 1, col: col + 1, rows: h, cols: w - 2
		});
		return h + 2;
	}

	// Centered standalone framed image.
	image(src: string, label: string, w: number, h: number, opts?: { href?: string; fit?: 'cover' | 'contain'; background?: string }) {
		const fw = Math.min(w, this.contentWidth);
		const col = this.startCol + Math.floor((this.contentWidth - fw) / 2);
		const consumed = this.drawFrame(this.row, col, fw, Math.min(h, 24), label, src, opts);
		this.row += consumed + 1;
	}

	// Float an image to one side; the paragraph wraps beside it, then flows
	// full width below (the /lab look). Falls back to stacked on narrow grids.
	imageWithText(
		side: 'left' | 'right', src: string, label: string, imgW: number, imgH: number,
		segments: string | TextSegment[], opts?: { href?: string; fit?: 'cover' | 'contain'; background?: string }
	) {
		if (!this.twoCol) {
			const consumed = this.drawFrame(this.row, this.startCol, this.contentWidth, Math.min(imgH, 12), label, src, opts);
			this.row += consumed + 1;
			this.paragraph(segments);
			return;
		}
		const w = Math.min(imgW, this.contentWidth - 24);
		const imgTotalH = imgH + 2;
		const gap = 2;
		const narrowWidth = this.contentWidth - w - gap;
		const imgCol = side === 'right' ? this.startCol + this.contentWidth - w : this.startCol;
		const textCol = side === 'right' ? this.startCol : this.startCol + w + gap;
		const r0 = this.row;
		this.drawFrame(r0, imgCol, w, imgH, label, src, opts);

		// Wrap at the narrow width beside the image; remainder flows full width.
		const segs: TextSegment[] = typeof segments === 'string' ? [{ text: segments }] : segments;
		const plain = segs.map(s => s.text).join(' ');
		const narrowLines = ArticleGrid.wordWrap(plain, narrowWidth);
		const besideText = narrowLines.slice(0, imgTotalH).join(' ');
		const belowText = narrowLines.slice(imgTotalH).join(' ');

		// Re-split segments at the beside/below boundary, preserving links.
		const [besideSegs, belowSegs] = splitSegments(segs, besideText.length);
		const besideRows = this.paragraph(besideSegs, narrowWidth, textCol, r0);
		let r = r0 + Math.max(imgTotalH, besideRows) + 1;
		if (belowText.trim()) {
			const belowRows = this.paragraph(belowSegs, this.contentWidth, this.startCol, r);
			r += belowRows;
		}
		this.row = r + 1;
	}

	// Code block in a terminal frame; long lines wrap hard at the inner width.
	codeBlock(code: string, label = '') {
		const rawLines = code.replace(/\t/g, '    ').split('\n');
		const innerW = this.contentWidth - 4;
		const lines: string[] = [];
		for (const l of rawLines) {
			if (l.length <= innerW) lines.push(l);
			else for (let i = 0; i < l.length; i += innerW) lines.push(l.slice(i, i + innerW));
		}
		const w = this.contentWidth;
		const r0 = this.row;
		this.placeLine(r0, this.startCol, this.buildFrameTop(w, label), this.accent.frame);
		lines.forEach((l, i) => {
			const r = r0 + 1 + i;
			this.setCell(r, this.startCol, '|', this.accent.frame);
			this.setCell(r, this.startCol + w - 1, '|', this.accent.frame);
			for (let c = this.startCol + 1; c < this.startCol + w - 1; c++) {
				const idx = c - this.startCol - 2;
				const ch = idx >= 0 && idx < l.length ? l[idx] : ' ';
				this.setCell(r, c, ch, ch === ' ' ? 'empty' : 'content');
			}
		});
		this.placeLine(r0 + lines.length + 1, this.startCol, '+' + '-'.repeat(w - 2) + '+', this.accent.frame);
		this.row = r0 + lines.length + 2 + 1;
	}

	finish(trailingRows = 3): ArticleResult {
		this.ensureRow(this.row + trailingRows);
		return { cells: this.grid, images: this.images, overlays: this.overlays, rows: this.grid.length };
	}
}

// Split a segment list into two lists at a character offset of the joined
// plain text (used by imageWithText to preserve links across the fold).
function splitSegments(segs: TextSegment[], offset: number): [TextSegment[], TextSegment[]] {
	const before: TextSegment[] = [];
	const after: TextSegment[] = [];
	let pos = 0;
	for (const seg of segs) {
		const start = pos;
		const end = pos + seg.text.length;
		if (end <= offset) {
			before.push(seg);
		} else if (start >= offset) {
			after.push(seg);
		} else {
			const cut = offset - start;
			before.push({ ...seg, text: seg.text.slice(0, cut).trimEnd() });
			after.push({ ...seg, text: seg.text.slice(cut).trimStart() });
		}
		pos = end + 1; // +1 for the joining space
	}
	return [before.filter(s => s.text), after.filter(s => s.text)];
}
