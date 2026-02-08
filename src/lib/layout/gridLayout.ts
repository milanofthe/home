// Grid layout engine: takes viewport info + content definitions,
// outputs a 2D array of character cells

import { FILLER_SOURCE } from '$lib/data/filler-source';
import { contentSections, type ContentSection, type ContentRegion } from './contentRegions';

export type CellType = 'filler' | 'content' | 'heading' | 'heading-pathsim' | 'heading-pysimhub' | 'cta' | 'link' | 'link-pathsim' | 'link-pysimhub' | 'footer' | 'empty' | 'form-field' | 'frame' | 'frame-pathsim' | 'frame-pysimhub';

export interface Cell {
	char: string;
	type: CellType;
}

export interface EmbeddedBlockPosition {
	id: string;
	row: number;
	col: number;
	rows: number;
	cols: number;
}

export interface FormFieldPosition {
	id: string;
	row: number;
	col: number; // where the > prompt content starts
	width: number; // character width of the field
}

export interface GridLayout {
	cells: Cell[][];
	rows: number;
	cols: number;
	embeddedBlocks: EmbeddedBlockPosition[];
	formFields: FormFieldPosition[];
	sectionAnchors: { id: string; row: number }[];
}

export interface BreakpointConfig {
	cols: number;
	fontSize: number;
}

export function getBreakpointConfig(viewportWidth: number): BreakpointConfig {
	if (viewportWidth < 640) return { cols: 40, fontSize: 11 };
	if (viewportWidth < 768) return { cols: 60, fontSize: 12 };
	if (viewportWidth < 1024) return { cols: 80, fontSize: 13 };
	if (viewportWidth < 1280) return { cols: 100, fontSize: 13 };
	return { cols: 120, fontSize: 14 };
}

// Word-wrap text to fit within maxWidth, splitting on word boundaries
function wordWrap(text: string, maxWidth: number): string[] {
	if (text.length <= maxWidth) return [text];
	const words = text.split(' ');
	const lines: string[] = [];
	let current = '';
	for (const word of words) {
		if (current && (current + ' ' + word).length > maxWidth) {
			lines.push(current);
			current = word;
		} else {
			current = current ? current + ' ' + word : word;
		}
	}
	if (current) lines.push(current);
	return lines;
}

// Types that should be word-wrapped when lines exceed available width
const WRAPPABLE_TYPES: Set<string> = new Set([
	'paragraph', 'content', 'link-line', 'link-line-pathsim', 'link-line-pysimhub', 'footer-line'
]);

// Fill a line with filler source characters, cycling through the source
function fillerLine(cols: number, offset: number): Cell[] {
	const cells: Cell[] = [];
	for (let i = 0; i < cols; i++) {
		const idx = (offset + i) % FILLER_SOURCE.length;
		cells.push({ char: FILLER_SOURCE[idx], type: 'filler' });
	}
	return cells;
}

// Create a line with content centered, filler on margins
function contentLine(
	text: string,
	cols: number,
	fillerOffset: number,
	type: CellType,
	align: 'center' | 'left' = 'center'
): Cell[] {
	const cells: Cell[] = [];
	const contentWidth = Math.min(text.length, cols - 4); // min 2 char margin each side
	let startCol: number;

	if (align === 'center') {
		startCol = Math.floor((cols - contentWidth) / 2);
	} else {
		startCol = Math.max(2, Math.floor((cols - 50) / 2)); // left-align within content area
	}
	const endCol = startCol + contentWidth;

	for (let i = 0; i < cols; i++) {
		if (i >= startCol && i < endCol) {
			const charIdx = i - startCol;
			cells.push({ char: text[charIdx] || ' ', type });
		} else {
			const idx = (fillerOffset + i) % FILLER_SOURCE.length;
			cells.push({ char: FILLER_SOURCE[idx], type: 'filler' });
		}
	}
	return cells;
}

// Terminal window frame helpers
function buildFrameTop(frameCols: number, label: string): string {
	const maxLabel = frameCols - 5;
	const trimmed = label.slice(0, Math.max(0, maxLabel));
	if (!trimmed) return '+' + '-'.repeat(frameCols - 2) + '+';
	const prefix = '+- ' + trimmed + ' ';
	return prefix + '-'.repeat(Math.max(0, frameCols - prefix.length - 1)) + '+';
}

function buildFrameBottom(frameCols: number): string {
	return '+' + '-'.repeat(frameCols - 2) + '+';
}

function frameBorderLine(cols: number, frameStart: number, border: string, offset: number, frameType: CellType = 'frame'): Cell[] {
	const cells: Cell[] = [];
	for (let i = 0; i < cols; i++) {
		if (i >= frameStart && i < frameStart + border.length) {
			cells.push({ char: border[i - frameStart], type: frameType });
		} else {
			const idx = (offset + i) % FILLER_SOURCE.length;
			cells.push({ char: FILLER_SOURCE[idx], type: 'filler' });
		}
	}
	return cells;
}

function frameSideRow(cols: number, frameStart: number, frameCols: number, offset: number, frameType: CellType = 'frame'): Cell[] {
	const cells: Cell[] = [];
	const frameEnd = frameStart + frameCols;
	for (let i = 0; i < cols; i++) {
		if (i === frameStart || i === frameEnd - 1) {
			cells.push({ char: '|', type: frameType });
		} else if (i > frameStart && i < frameEnd - 1) {
			const idx = (offset + i) % FILLER_SOURCE.length;
			cells.push({ char: FILLER_SOURCE[idx], type: 'empty' });
		} else {
			const idx = (offset + i) % FILLER_SOURCE.length;
			cells.push({ char: FILLER_SOURCE[idx], type: 'filler' });
		}
	}
	return cells;
}


export function computeGridLayout(cols: number): GridLayout {
	const cells: Cell[][] = [];
	const embeddedBlocks: EmbeddedBlockPosition[] = [];
	const formFields: FormFieldPosition[] = [];
	const sectionAnchors: { id: string; row: number }[] = [];
	let fillerOffset = 0;

	function advanceOffset(amount: number) {
		fillerOffset = (fillerOffset + amount) % FILLER_SOURCE.length;
	}

	function addFillerLines(count: number) {
		for (let i = 0; i < count; i++) {
			cells.push(fillerLine(cols, fillerOffset));
			advanceOffset(cols);
		}
	}

	function addContentRegion(region: ContentRegion) {
		const type: CellType =
			region.type === 'heading' ? 'heading' :
			region.type === 'heading-pathsim' ? 'heading-pathsim' :
			region.type === 'heading-pysimhub' ? 'heading-pysimhub' :
			region.type === 'cta' ? 'cta' :
			region.type === 'link-line' ? 'link' :
			region.type === 'link-line-pathsim' ? 'link-pathsim' :
			region.type === 'link-line-pysimhub' ? 'link-pysimhub' :
			region.type === 'footer-line' ? 'footer' :
			region.type === 'form-field' ? 'form-field' :
			'content';

		if (region.type === 'spacer') {
			cells.push(fillerLine(cols, fillerOffset));
			advanceOffset(cols);
			return;
		}

		if (region.type === 'embedded') {
			const frameType: CellType =
				region.frameColor === 'pathsim' ? 'frame-pathsim' :
				region.frameColor === 'pysimhub' ? 'frame-pysimhub' :
				'frame';
			const innerRows = region.embeddedRows || 10;

			// Individual framed tiles (embeddedCols = per-tile inner width)
			if (region.tiles && region.tiles.length > 0) {
				const n = region.tiles.length;
				const gap = 2;
				let perTileInnerCols = Math.min(region.embeddedCols || 26, cols - 8);
				const perTileFrameCols = perTileInnerCols + 2;
				const totalWidth = n * perTileFrameCols + (n - 1) * gap;
				const sideBySide = cols > 60 && totalWidth <= cols - 4;

				// Stacked mobile tiles: narrower + taller for portrait screenshot AR
				const stackedInnerCols = cols <= 60 ? Math.min(20, cols - 8) : perTileInnerCols;
				const stackedRows = cols <= 60 ? 10 : innerRows;

				if (sideBySide) {
					const groupStart = Math.floor((cols - totalWidth) / 2);
					const tileStarts: number[] = [];
					for (let t = 0; t < n; t++) {
						tileStarts.push(groupStart + t * (perTileFrameCols + gap));
					}

					// Top borders (all on one row)
					const topRow: Cell[] = fillerLine(cols, fillerOffset);
					for (let t = 0; t < n; t++) {
						const top = buildFrameTop(perTileFrameCols, region.tiles[t].label);
						for (let i = 0; i < top.length; i++) {
							topRow[tileStarts[t] + i] = { char: top[i], type: frameType };
						}
					}
					cells.push(topRow);
					advanceOffset(cols);

					// Record embedded block positions
					for (let t = 0; t < n; t++) {
						embeddedBlocks.push({
							id: region.tiles[t].id,
							row: cells.length,
							col: tileStarts[t] + 1,
							rows: innerRows,
							cols: perTileInnerCols
						});
					}

					// Content rows with side borders for all tiles
					for (let r = 0; r < innerRows; r++) {
						const row: Cell[] = fillerLine(cols, fillerOffset);
						for (let t = 0; t < n; t++) {
							const s = tileStarts[t];
							const end = s + perTileFrameCols;
							row[s] = { char: '|', type: frameType };
							row[end - 1] = { char: '|', type: frameType };
							for (let i = s + 1; i < end - 1; i++) {
								row[i] = { ...row[i], type: 'empty' };
							}
						}
						cells.push(row);
						advanceOffset(cols);
					}

					// Bottom borders (all on one row)
					const botRow: Cell[] = fillerLine(cols, fillerOffset);
					for (let t = 0; t < n; t++) {
						const bot = buildFrameBottom(perTileFrameCols);
						for (let i = 0; i < bot.length; i++) {
							botRow[tileStarts[t] + i] = { char: bot[i], type: frameType };
						}
					}
					cells.push(botRow);
					advanceOffset(cols);
				} else {
					// Stacked: narrower portrait tiles on mobile
					const stackedFrameCols = stackedInnerCols + 2;
					const frameStart = Math.floor((cols - stackedFrameCols) / 2);

					for (let t = 0; t < n; t++) {
						cells.push(frameBorderLine(cols, frameStart, buildFrameTop(stackedFrameCols, region.tiles[t].label), fillerOffset, frameType));
						advanceOffset(cols);

						embeddedBlocks.push({
							id: region.tiles[t].id,
							row: cells.length,
							col: frameStart + 1,
							rows: stackedRows,
							cols: stackedInnerCols
						});

						for (let r = 0; r < stackedRows; r++) {
							cells.push(frameSideRow(cols, frameStart, stackedFrameCols, fillerOffset, frameType));
							advanceOffset(cols);
						}

						cells.push(frameBorderLine(cols, frameStart, buildFrameBottom(stackedFrameCols), fillerOffset, frameType));
						advanceOffset(cols);

						if (t < n - 1) {
							cells.push(fillerLine(cols, fillerOffset));
							advanceOffset(cols);
						}
					}
				}
				return;
			}

			// Single embedded block with frame (non-tile, e.g. photo)
			const label = region.label || '';
			const innerCols = Math.min(region.embeddedCols || 40, cols - 6);
			const frameCols = innerCols + 2;
			const frameStartCol = Math.floor((cols - frameCols) / 2);

			cells.push(frameBorderLine(cols, frameStartCol, buildFrameTop(frameCols, label), fillerOffset, frameType));
			advanceOffset(cols);

			embeddedBlocks.push({
				id: region.embeddedId || '',
				row: cells.length,
				col: frameStartCol + 1,
				rows: innerRows,
				cols: innerCols
			});

			for (let r = 0; r < innerRows; r++) {
				cells.push(frameSideRow(cols, frameStartCol, frameCols, fillerOffset, frameType));
				advanceOffset(cols);
			}

			cells.push(frameBorderLine(cols, frameStartCol, buildFrameBottom(frameCols), fillerOffset, frameType));
			advanceOffset(cols);
			return;
		}

		if (region.type === 'form-field') {
			const line = region.lines[0] || '> ________________________________________';
			const row = contentLine(line, cols, fillerOffset, 'form-field', region.align);
			// Find where the form-field content starts (after "> ")
			const fieldStart = row.findIndex(c => c.type === 'form-field');
			const fieldEnd = row.length - [...row].reverse().findIndex(c => c.type === 'form-field');
			if (fieldStart >= 0 && region.id) {
				formFields.push({
					id: region.id,
					row: cells.length,
					col: fieldStart + 2, // skip "> "
					width: fieldEnd - fieldStart - 2
				});
			}
			cells.push(row);
			advanceOffset(cols);
			return;
		}

		// Word-wrap paragraph-type regions only when lines would be truncated
		let lines = region.lines;
		const maxWidth = cols - 4;
		if (region.type === 'cta') {
			// Split CTA buttons onto separate lines when they don't fit
			const expanded: string[] = [];
			for (const line of lines) {
				if (line.length > maxWidth) {
					expanded.push(...line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean));
				} else {
					expanded.push(line);
				}
			}
			lines = expanded;
		} else if (WRAPPABLE_TYPES.has(region.type)) {
			if (lines.some(l => l.length > maxWidth)) {
				const joined = lines.join(' ');
				lines = wordWrap(joined, maxWidth);
			}
		}

		for (const line of lines) {
			cells.push(contentLine(line, cols, fillerOffset, type, region.align));
			advanceOffset(cols);
		}
	}

	for (const section of contentSections) {
		if (section.id) {
			sectionAnchors.push({ id: section.id, row: cells.length + section.fillerLinesBefore });
		}

		addFillerLines(section.fillerLinesBefore);

		for (const region of section.regions) {
			addContentRegion(region);
		}
	}

	addFillerLines(3);

	return {
		cells,
		rows: cells.length,
		cols,
		embeddedBlocks,
		formFields,
		sectionAnchors
	};
}
