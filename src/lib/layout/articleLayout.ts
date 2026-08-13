// Article grid engine: the /lab prototype's layout primitives, extracted and
// parametrized. Builds the same Cell[][] the landing grid uses, but with an
// article flow: title, paragraphs with inline links, floated framed images,
// code blocks. Used by the /stack/<project> pages and the other subpages.

import { FILLER_SOURCE } from '$lib/data/filler-source';
import imageDims from '$lib/data/image-dims.json';
import { glowFor } from '$lib/content/prose';
import type { Cell, CellType } from './gridLayout';

/// Narrowest a paired timeline image may get before the pair stacks instead. Below
/// this the two frames are thumbnails rather than pictures.
const MIN_PAIR_WIDTH = 20;

/// Share of the article width the timeline's image column takes. Wide enough that a
/// pair of images still reads, narrow enough to leave the text a comfortable measure.
const TIMELINE_IMAGE_SHARE = 0.46;

const IMAGE_DIMS = imageDims as unknown as Record<string, [number, number]>;

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
	/// Hover glow, so a framed image behaves like the portal tiles on the landing
	/// page rather than being the one static picture on an otherwise live surface.
	glow?: string;
}

export interface ArticleOverlay {
	row: number;
	col: number;
	length: number;
	label: string;
	href: string;
}

export interface ArticleFormField {
	id: string;
	row: number;
	col: number; // where the input starts (after "> ")
	width: number;
}

export interface ArticleAction {
	row: number;
	col: number;
	length: number;
	label: string;
	action: string; // e.g. 'submit-form'
}

export interface ArticleAnchor {
	id: string;
	row: number;
}

export interface ArticleResult {
	cells: Cell[][];
	images: ArticleImage[];
	overlays: ArticleOverlay[];
	formFields: ArticleFormField[];
	actions: ArticleAction[];
	anchors: ArticleAnchor[];
	rows: number;
}

// A paragraph is a list of segments; segments with href render in the accent
// link color and get a click overlay.
export interface TextSegment {
	text: string;
	href?: string;
	accent?: AccentKey; // link color override (defaults to article accent)
}

// A framed artifact attached to a timeline entry.
export interface TimelineImage {
	src: string;
	label: string;
	w?: number;
	href?: string;
	fit?: 'cover' | 'contain';
	background?: string;
}

// One block on the vertical timeline (see ArticleGrid.timeline).
export interface TimelineEntry {
	period: string; // label in the year column, e.g. '2015-2021'
	heading: string;
	accent?: AccentKey; // heading and connector color (defaults to article accent)
	body?: (string | TextSegment[])[];
	images?: TimelineImage[];
	links?: { text: string; href: string }[];
}

export class ArticleGrid {
	readonly cols: number;
	readonly contentWidth: number;
	readonly startCol: number;
	readonly twoCol: boolean;
	readonly cellRatio: number; // charWidth / lineHeight of a grid cell

	private accent: AccentTypes;
	private grid: Cell[][] = [];
	private images: ArticleImage[] = [];
	private overlays: ArticleOverlay[] = [];
	private formFields: ArticleFormField[] = [];
	private actions: ArticleAction[] = [];
	private anchors: ArticleAnchor[] = [];
	private row: number;

	constructor(cols: number, accent: AccentKey = 'neutral', topRows = 3, cellRatio = 0.4) {
		this.cols = cols;
		this.accent = accentTypes(accent);
		this.contentWidth = Math.min(cols - 8, 104);
		this.startCol = Math.floor((cols - this.contentWidth) / 2);
		this.twoCol = this.contentWidth >= 78;
		this.cellRatio = cellRatio;
		this.row = topRows;
	}

	// Frame height (inner rows) for an image at its real aspect ratio, given
	// the inner frame width in cells. Falls back to the declared height when
	// the image is not in the dimensions map.
	private imageRows(src: string, innerCols: number, fallback: number): number {
		const dims = IMAGE_DIMS[src];
		if (!dims) return fallback;
		const [iw, ih] = dims;
		const rows = Math.round((innerCols * this.cellRatio * ih) / iw);
		return Math.max(4, Math.min(rows, 36));
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

	// Page title in the accent color, with an optional plain subtitle.
	title(text: string, subtitle?: string) {
		for (const line of ArticleGrid.wordWrap(text, this.contentWidth)) {
			this.placeLine(this.row, this.startCol, line, this.accent.heading);
			this.row += 1;
		}
		if (subtitle) {
			for (const line of ArticleGrid.wordWrap(subtitle, this.contentWidth)) {
				this.placeLine(this.row, this.startCol, line, 'content');
				this.row += 1;
			}
		}
		this.row += 1;
	}

	// Meta line under the title (date / tags / reading time), muted link style.
	metaLine(text: string) {
		for (const line of ArticleGrid.wordWrap(text, this.contentWidth)) {
			this.placeLine(this.row, this.startCol, line, 'link');
			this.row += 1;
		}
		this.row += 1;
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
				// (no space before ", an open-source library" after a link), and
				// a segment right after an opening bracket attaches too (no space
				// in "EM solvers (RapidFEM").
				const prev = toks[toks.length - 1];
				const glue = first && (/^[,.;:!?)]/.test(word) || (prev ? /[([{/]$/.test(prev.word) : false));
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

	// Vertical timeline: a continuous rail of '|' cells with the year column,
	// framed images to the LEFT of the rail and the entry text to the RIGHT.
	// Same ASCII vocabulary as the tile frames on the landing page.
	//
	//   +- artifact -----+  2026 -+  one stack
	//   |                |        |  The full roundtrip ...
	//   +----------------+        |  [ view the stack -> ]
	//                             |
	//                     2025 -+  open source
	//
	// On narrow grids there is no room for a side column; images stack below
	// their entry text instead and the rail moves to the left edge.
	timeline(entries: TimelineEntry[]) {
		const periodW = Math.max(...entries.map((e) => e.period.length));
		const side = this.twoCol;
		const imgColW = side ? Math.min(52, Math.floor(this.contentWidth * TIMELINE_IMAGE_SHARE)) : 0;
		const yearCol = this.startCol + (side ? imgColW + 2 : 0);
		const railCol = yearCol + periodW + 2;
		const contentCol = railCol + 3;
		const contentW = this.startCol + this.contentWidth - contentCol;
		const railStart = this.row;

		for (const entry of entries) {
			const entryAccent = entry.accent ? accentTypes(entry.accent) : this.accent;
			const entryGlow = glowFor(entry.accent);
			const entryStart = this.row;

			// Year, connector and heading share the first row of the entry.
			this.placeLine(this.row, yearCol, entry.period.padStart(periodW), 'link');
			this.placeLine(this.row, railCol - 1, '-+', entryAccent.heading);
			for (const line of ArticleGrid.wordWrap(entry.heading, contentW)) {
				this.placeLine(this.row, contentCol, line, entryAccent.heading);
				this.row += 1;
			}
			this.row += 1;

			for (const p of entry.body ?? []) {
				const segs: TextSegment[] = typeof p === 'string' ? [{ text: p }] : p;
				const lines = this.paragraph(segs, contentW, contentCol, this.row);
				this.row += lines + 1;
			}

			// Stacked fallback: images sit below the text, full text width.
			if (!side) {
				for (const img of entry.images ?? []) {
					const fw = Math.min(img.w ?? 44, contentW);
					const rows = this.imageRows(img.src, fw - 2, 12);
					const consumed = this.drawFrame(this.row, contentCol, fw, rows, img.label, img.src, {
						href: img.href,
						fit: img.fit,
						background: img.background,
						glow: entryGlow
					});
					this.row += consumed + 1;
				}
			}

			if (entry.links?.length) {
				let c = contentCol;
				for (const link of entry.links) {
					// Wrap onto a new row when the next button no longer fits.
					if (c + link.text.length > contentCol + contentW) {
						c = contentCol;
						this.row += 2;
					}
					this.placeLine(this.row, c, link.text, 'cta');
					this.overlays.push({ row: this.row, col: c, length: link.text.length, label: link.text, href: link.href });
					c += link.text.length + 3;
				}
				this.row += 2;
			}

			// Side images: left of the rail, the first row top-aligned with the
			// heading, further rows stacked below. Right-aligned against the rail
			// so they visibly hang off the line. The entry is as tall as the
			// taller of text and image stack.
			//
			// Two sit side by side when the column is wide enough for both to stay
			// legible; below that they stack, because a pair of thumbnails too
			// small to read is worse than one picture you can see.
			if (side && entry.images?.length) {
				const gap = 2;
				const pairWidth = Math.floor((imgColW - gap) / 2);
				const pairs = pairWidth >= MIN_PAIR_WIDTH;
				let imgRow = entryStart;

				for (let i = 0; i < entry.images.length; ) {
					const first = entry.images[i];
					const second = entry.images[i + 1];
					// A declared width means the caller wants that size; only
					// undeclared images are candidates for pairing.
					const canPair = pairs && second && !first.w && !second.w;

					if (canPair) {
						const rowsA = this.imageRows(first.src, pairWidth - 2, 12);
						const rowsB = this.imageRows(second.src, pairWidth - 2, 12);
						// One height for the pair, so their frames line up.
						const rows = Math.min(rowsA, rowsB);
						const leftCol = this.startCol + imgColW - (pairWidth * 2 + gap);
						this.drawFrame(imgRow, leftCol, pairWidth, rows, first.label, first.src, {
							href: first.href, fit: first.fit, background: first.background, glow: entryGlow
						});
						this.drawFrame(imgRow, leftCol + pairWidth + gap, pairWidth, rows, second.label, second.src, {
							href: second.href, fit: second.fit, background: second.background, glow: entryGlow
						});
						imgRow += rows + 3;
						i += 2;
					} else {
						const fw = Math.min(first.w ?? imgColW, imgColW);
						const rows = this.imageRows(first.src, fw - 2, 12);
						const imgCol = this.startCol + imgColW - fw;
						const consumed = this.drawFrame(imgRow, imgCol, fw, rows, first.label, first.src, {
							href: first.href, fit: first.fit, background: first.background, glow: entryGlow
						});
						imgRow += consumed + 1;
						i += 1;
					}
				}
				this.row = Math.max(this.row, imgRow);
			}

			// Breathing room between entries.
			this.row += 1;
		}

		// The rail: every row from the first entry down to the end of the last
		// one, except where a connector already sits.
		for (let r = railStart; r < this.row - 2; r++) {
			this.ensureRow(r);
			if (this.grid[r][railCol].char !== '+') this.setCell(r, railCol, '|', 'link');
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
		label: string, src: string,
		opts?: { href?: string; fit?: 'cover' | 'contain'; background?: string; glow?: string }
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
			glow: opts?.glow,
			row: startRow + 1, col: col + 1, rows: h, cols: w - 2
		});
		return h + 2;
	}

	// Centered standalone framed image, height from the real aspect ratio.
	image(src: string, label: string, w: number, h: number, opts?: { href?: string; fit?: 'cover' | 'contain'; background?: string }) {
		const fw = Math.min(w, this.contentWidth);
		const rows = this.imageRows(src, fw - 2, Math.min(h, 24));
		const col = this.startCol + Math.floor((this.contentWidth - fw) / 2);
		const consumed = this.drawFrame(this.row, col, fw, rows, label, src, opts);
		this.row += consumed + 1;
	}

	// Float an image to one side; the paragraph wraps beside it, then flows
	// full width below (the /lab look). Falls back to stacked on narrow grids.
	imageWithText(
		side: 'left' | 'right', src: string, label: string, imgW: number, imgH: number,
		segments: string | TextSegment[], opts?: { href?: string; fit?: 'cover' | 'contain'; background?: string }
	) {
		if (!this.twoCol) {
			const stackedRows = this.imageRows(src, this.contentWidth - 2, Math.min(imgH, 12));
			const consumed = this.drawFrame(this.row, this.startCol, this.contentWidth, stackedRows, label, src, opts);
			this.row += consumed + 1;
			this.paragraph(segments);
			return;
		}
		const w = Math.min(imgW, this.contentWidth - 24);
		const rows = this.imageRows(src, w - 2, imgH);
		const imgTotalH = rows + 2;
		const gap = 2;
		const narrowWidth = this.contentWidth - w - gap;
		const imgCol = side === 'right' ? this.startCol + this.contentWidth - w : this.startCol;
		const textCol = side === 'right' ? this.startCol : this.startCol + w + gap;
		const r0 = this.row;
		this.drawFrame(r0, imgCol, w, rows, label, src, opts);

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

	// Code block in a terminal frame with syntax highlighting; long lines
	// wrap hard at the inner width. The fence label doubles as the language.
	codeBlock(code: string, label = '') {
		const rawLines = code.replace(/\t/g, '    ').split('\n');
		const lineTypes = highlightCode(rawLines, label);
		const innerW = this.contentWidth - 4;
		const lines: { text: string; types: CellType[] }[] = [];
		rawLines.forEach((l, li) => {
			const types = lineTypes[li];
			if (l.length <= innerW) {
				lines.push({ text: l, types });
			} else {
				for (let i = 0; i < l.length; i += innerW) {
					lines.push({ text: l.slice(i, i + innerW), types: types.slice(i, i + innerW) });
				}
			}
		});
		const w = this.contentWidth;
		const r0 = this.row;
		this.placeLine(r0, this.startCol, this.buildFrameTop(w, label), this.accent.frame);
		lines.forEach((l, i) => {
			const r = r0 + 1 + i;
			this.setCell(r, this.startCol, '|', this.accent.frame);
			this.setCell(r, this.startCol + w - 1, '|', this.accent.frame);
			for (let c = this.startCol + 1; c < this.startCol + w - 1; c++) {
				const idx = c - this.startCol - 2;
				const ch = idx >= 0 && idx < l.text.length ? l.text[idx] : ' ';
				this.setCell(r, c, ch, ch === ' ' ? 'empty' : (l.types[idx] ?? 'content'));
			}
		});
		this.placeLine(r0 + lines.length + 1, this.startCol, '+' + '-'.repeat(w - 2) + '+', this.accent.frame);
		this.row = r0 + lines.length + 2 + 1;
	}

	// Named scroll target at the current row (rendered as a DOM anchor).
	anchor(id: string) {
		this.anchors.push({ id, row: this.row });
	}

	// Column where a line of the given length starts when centered in the
	// article's content column.
	private centerCol(length: number): number {
		return this.startCol + Math.max(0, Math.floor((this.contentWidth - length) / 2));
	}

	// The site-wide contact block: booking CTA, email, and the inline grid
	// form, centered like the landing page contact section. ArticlePage
	// renders the actual inputs over the field rows.
	contactSection(opts: { bookingUrl: string; email: string; privacy?: string }) {
		this.anchor('contact');
		this.sectionHeading('GET IN TOUCH', '=');

		const centered = (text: string, type: CellType) => {
			for (const line of ArticleGrid.wordWrap(text, this.contentWidth)) {
				this.placeLine(this.row, this.centerCol(line.length), line, type);
				this.row += 1;
			}
		};

		centered('Book a call directly, write me, or use the form below.', 'content');
		this.spacer();

		const booking = '[ Book an intro call -> ]';
		const bookingCol = this.centerCol(booking.length);
		this.placeLine(this.row, bookingCol, booking, 'cta');
		this.overlays.push({ row: this.row, col: bookingCol, length: booking.length, label: booking, href: opts.bookingUrl });
		this.row += 2;

		const emailCol = this.centerCol(opts.email.length);
		this.placeLine(this.row, emailCol, opts.email, 'link');
		this.overlays.push({ row: this.row, col: emailCol, length: opts.email.length, label: opts.email, href: `mailto:${opts.email}` });
		this.row += 2;

		const fieldWidth = Math.min(this.contentWidth - 4, 56);
		const fieldLine = '> ' + '_'.repeat(fieldWidth);
		const fieldCol = this.centerCol(fieldLine.length);
		const addField = (id: string, label: string, rows = 1) => {
			const labelText = '// ' + label;
			this.placeLine(this.row, this.centerCol(labelText.length), labelText, 'content');
			this.row += 1;
			for (let r = 0; r < rows; r++) {
				this.placeLine(this.row, fieldCol, fieldLine, 'form-field');
				this.formFields.push({
					id: rows > 1 ? `${id}-${r + 1}` : id,
					row: this.row,
					col: fieldCol + 2,
					width: fieldWidth
				});
				this.row += 1;
			}
			this.row += 1;
		};
		addField('field-name', 'name');
		addField('field-email', 'email');
		addField('field-subject', 'subject');
		addField('field-message', 'message', 3);

		const submit = '[ SEND MESSAGE -> ]';
		const submitCol = this.centerCol(submit.length);
		this.placeLine(this.row, submitCol, submit, 'cta');
		this.actions.push({
			row: this.row, col: submitCol, length: submit.length,
			label: submit, action: 'submit-form'
		});
		this.row += 2;
		if (opts.privacy !== '') {
			centered(opts.privacy ?? 'Your data is processed per our privacy policy.', 'content');
			this.row += 1;
		}
	}

	finish(trailingRows = 3): ArticleResult {
		this.ensureRow(this.row + trailingRows);
		return {
			cells: this.grid,
			images: this.images,
			overlays: this.overlays,
			formFields: this.formFields,
			actions: this.actions,
			anchors: this.anchors,
			rows: this.grid.length
		};
	}
}

// --- Minimal syntax highlighting for code blocks ---
// Per-character cell types for one line. Handles comments, strings, numbers,
// and per-language keyword sets; everything else stays 'content'.

const CODE_KEYWORDS: Record<string, Set<string>> = {
	python: new Set([
		'def', 'class', 'import', 'from', 'return', 'for', 'in', 'if', 'elif',
		'else', 'while', 'with', 'as', 'lambda', 'None', 'True', 'False', 'not',
		'and', 'or', 'try', 'except', 'raise', 'yield', 'pass', 'global',
		'assert', 'del', 'async', 'await'
	]),
	rust: new Set([
		'fn', 'let', 'mut', 'use', 'pub', 'struct', 'impl', 'enum', 'match',
		'for', 'in', 'if', 'else', 'return', 'mod', 'crate', 'self', 'Self',
		'const', 'static', 'trait', 'where', 'loop', 'while', 'break',
		'continue', 'unsafe', 'as', 'dyn', 'ref', 'move', 'async', 'await',
		'true', 'false'
	]),
	javascript: new Set([
		'const', 'let', 'var', 'function', 'return', 'for', 'of', 'in', 'if',
		'else', 'while', 'class', 'new', 'import', 'from', 'export', 'default',
		'async', 'await', 'true', 'false', 'null', 'undefined', 'this'
	])
};
CODE_KEYWORDS.ts = CODE_KEYWORDS.javascript;
CODE_KEYWORDS.js = CODE_KEYWORDS.javascript;
CODE_KEYWORDS.py = CODE_KEYWORDS.python;

const COMMENT_PREFIX: Record<string, string> = {
	python: '#', py: '#', bash: '#', sh: '#', yaml: '#', toml: '#',
	rust: '//', javascript: '//', ts: '//', js: '//', c: '//', cpp: '//'
};

// Highlight a whole code block. Stateful across lines so python
// triple-quoted strings keep their color after a line break.
function highlightCode(lines: string[], lang: string): CellType[][] {
	const keywords = CODE_KEYWORDS[lang];
	const commentPrefix = COMMENT_PREFIX[lang];
	const supportsTriple = lang === 'python' || lang === 'py';
	const out: CellType[][] = [];
	let triple: string | null = null; // open '"""' or "'''" from a prior line

	for (const line of lines) {
		const types: CellType[] = new Array(line.length).fill('content');
		let i = 0;

		// continue an open triple-quoted string
		if (triple) {
			const close = line.indexOf(triple);
			if (close === -1) {
				types.fill('code-str');
				out.push(types);
				continue;
			}
			for (let k = 0; k < close + 3; k++) types[k] = 'code-str';
			i = close + 3;
			triple = null;
		}

		let commentStart = -1;
		while (i < line.length) {
			const ch = line[i];
			// triple-quoted string opening
			if (supportsTriple && (line.startsWith('"""', i) || line.startsWith("'''", i))) {
				const q = line.slice(i, i + 3);
				const close = line.indexOf(q, i + 3);
				if (close === -1) {
					for (let k = i; k < line.length; k++) types[k] = 'code-str';
					triple = q;
					i = line.length;
				} else {
					for (let k = i; k < close + 3; k++) types[k] = 'code-str';
					i = close + 3;
				}
				continue;
			}
			// single-line string literal
			if (ch === '"' || ch === "'" || ch === '`') {
				const quote = ch;
				let j = i + 1;
				while (j < line.length && line[j] !== quote) {
					if (line[j] === '\\') j++;
					j++;
				}
				for (let k = i; k <= Math.min(j, line.length - 1); k++) types[k] = 'code-str';
				i = j + 1;
				continue;
			}
			if (commentPrefix && line.startsWith(commentPrefix, i)) {
				commentStart = i;
				break;
			}
			// html comments regardless of prefix table
			if (lang === 'html' && line.startsWith('<!--', i)) {
				commentStart = i;
				break;
			}
			i++;
		}
		if (commentStart >= 0) {
			for (let k = commentStart; k < line.length; k++) types[k] = 'code-com';
		}

		const codeEnd = commentStart >= 0 ? commentStart : line.length;
		const segment = line.slice(0, codeEnd);

		// numbers
		for (const m of segment.matchAll(/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/g)) {
			if (types[m.index!] !== 'content') continue;
			for (let k = m.index!; k < m.index! + m[0].length; k++) types[k] = 'code-num';
		}

		// keywords
		if (keywords) {
			for (const m of segment.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) {
				if (!keywords.has(m[0])) continue;
				if (types[m.index!] !== 'content') continue;
				for (let k = m.index!; k < m.index! + m[0].length; k++) types[k] = 'code-kw';
			}
		}

		// html tags: color tag names as keywords
		if (lang === 'html') {
			for (const m of segment.matchAll(/<\/?([A-Za-z][A-Za-z0-9-]*)/g)) {
				for (let k = m.index!; k < m.index! + m[0].length; k++) {
					if (types[k] === 'content') types[k] = 'code-kw';
				}
			}
		}

		out.push(types);
	}
	return out;
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
