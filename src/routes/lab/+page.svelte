<script lang="ts">
	// LAYOUT PROTOTYPE — isolated demo route, NOT wired into the landing/nav.
	// Reuses the landing's character-grid look (CharacterGrid renderer, filler
	// source, .code-grid-* classes) but with a 2-column article layout to
	// prototype per-project detail pages. Filled with lorem ipsum + local
	// screenshots as placeholder images.
	import { onMount, tick } from 'svelte';
	import { FILLER_SOURCE } from '$lib/data/filler-source';
	import type { Cell, CellType } from '$lib/layout/gridLayout';
	import CharacterGrid from '$lib/components/CharacterGrid.svelte';

	let containerEl: HTMLDivElement;

	let charWidth = $state(0);
	let fontSize = $state(0);
	let lineHeight = $state(0);
	let letterSpacingPx = $state(0);
	let cells = $state.raw<Cell[][]>([]);
	let mounted = $state(false);

	interface ImageBlock {
		src: string;
		label: string;
		row: number;
		col: number;
		rows: number;
		cols: number;
	}
	let images = $state.raw<ImageBlock[]>([]);

	// --- Placeholder content ---
	const LOREM = [
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
		'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
		'Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi.',
		'Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc.',
		'Nullam rhoncus aliquam metus. Etiam egestas wisi a erat. Ut tellus dolor, dapibus eget, elementum vel, cursus eleifend, elit. Aenean auctor wisi et urna. Aliquam erat volutpat. Duis ac turpis. Integer rutrum ante eu lacus. Vestibulum libero nisl, porta vel, scelerisque eget, malesuada at, neque.'
	];

	const BODY = LOREM.join(' ');
	const SRC = {
		overview: '/screenshots/pathsim-org.png',
		results: '/screenshots/scidata-io.png',
		editor: '/screenshots/view-pathsim-org.png'
	};

	// --- Grid building primitives ---
	function wordWrap(text: string, maxWidth: number): string[] {
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

	function buildFrameTop(w: number, label: string): string {
		const maxLabel = w - 5;
		const t = label.slice(0, Math.max(0, maxLabel));
		if (!t) return '+' + '-'.repeat(w - 2) + '+';
		const prefix = '+- ' + t + ' ';
		return prefix + '-'.repeat(Math.max(0, w - prefix.length - 1)) + '+';
	}

	function buildArticle(cols: number): { grid: Cell[][]; imgs: ImageBlock[] } {
		const grid: Cell[][] = [];
		const imgs: ImageBlock[] = [];

		const fillerChar = (r: number, c: number) =>
			FILLER_SOURCE[((r * cols) + c) % FILLER_SOURCE.length];

		const ensureRow = (r: number) => {
			while (grid.length <= r) {
				const rr = grid.length;
				const row: Cell[] = [];
				for (let c = 0; c < cols; c++) row.push({ char: fillerChar(rr, c), type: 'filler' });
				grid.push(row);
			}
		};
		const setCell = (r: number, c: number, char: string, type: CellType) => {
			ensureRow(r);
			if (c >= 0 && c < cols) grid[r][c] = { char, type };
		};
		const placeLine = (r: number, col: number, text: string, type: CellType) => {
			for (let j = 0; j < text.length; j++) setCell(r, col + j, text[j], type);
		};
		// Place wrapped text, return rows consumed.
		const placeText = (startRow: number, col: number, width: number, text: string, type: CellType) => {
			const lines = wordWrap(text, width);
			lines.forEach((l, i) => placeLine(startRow + i, col, l, type));
			return lines.length;
		};
		// Draw a terminal frame, mark interior empty, record an image overlay.
		// Returns total rows consumed (incl. borders).
		const drawFrame = (
			startRow: number, col: number, w: number, h: number,
			label: string, src: string, frameType: CellType
		) => {
			placeLine(startRow, col, buildFrameTop(w, label), frameType);
			for (let r = 1; r <= h; r++) {
				setCell(startRow + r, col, '|', frameType);
				setCell(startRow + r, col + w - 1, '|', frameType);
				for (let c = col + 1; c < col + w - 1; c++) {
					ensureRow(startRow + r);
					grid[startRow + r][c] = { char: grid[startRow + r][c].char, type: 'empty' };
				}
			}
			placeLine(startRow + h + 1, col, '+' + '-'.repeat(w - 2) + '+', frameType);
			imgs.push({ src, label, row: startRow + 1, col: col + 1, rows: h, cols: w - 2 });
			return h + 2;
		};

		// --- Layout math ---
		const contentWidth = Math.min(cols - 8, 104);
		const startCol = Math.floor((cols - contentWidth) / 2);
		const twoCol = contentWidth >= 78;

		const accentHeading: CellType = 'heading-pathsim';
		const accentLink: CellType = 'link-pathsim';
		const accentFrame: CellType = 'frame-pathsim';

		// Float an image to one side; text wraps beside it (1-row / 2-col spacing)
		// around the image) then flows full width below. Image size varies per call.
		const flowFloat = (
			startRow: number, side: 'left' | 'right', imgW: number, imgH: number,
			src: string, label: string, text: string
		) => {
			if (!twoCol) {
				const fr = drawFrame(startRow, startCol, contentWidth, Math.min(imgH, 12), label, src, accentFrame);
				let r = startRow + fr + 1;
				r += placeText(r, startCol, contentWidth, text, 'content');
				return r;
			}
			const w = Math.min(imgW, contentWidth - 24);
			const imgTotalH = imgH + 2;
			const gap = 2;
			const narrowWidth = contentWidth - w - gap;
			const imgCol = side === 'right' ? startCol + contentWidth - w : startCol;
			const textCol = side === 'right' ? startCol : startCol + w + gap;
			drawFrame(startRow, imgCol, w, imgH, label, src, accentFrame);
			const narrowLines = wordWrap(text, narrowWidth);
			narrowLines.slice(0, imgTotalH).forEach((l, i) => placeLine(startRow + i, textCol, l, 'content'));
			let r = startRow + imgTotalH + 1; // continue below the image, 1 row gap
			const rest = narrowLines.slice(imgTotalH).join(' ');
			if (rest.trim()) {
				const fullLines = wordWrap(rest, contentWidth);
				fullLines.forEach((l, i) => placeLine(r + i, startCol, l, 'content'));
				r += fullLines.length;
			}
			return r;
		};

		let row = 3;

		// Title — clean, no comment markers
		placeLine(row, startCol, 'PathSim', accentHeading); row += 1;
		placeLine(row, startCol, 'Open-source system simulation in pure Python.', 'content'); row += 2;

		// Lead paragraph
		row += placeText(row, startCol, contentWidth, LOREM[0], 'content'); row += 2;

		// Varied-size, alternating-side image blocks (the inline look throughout)
		row = flowFloat(row, 'right', 46, 18, SRC.overview, 'overview.png', BODY) + 2;
		row = flowFloat(row, 'left', 24, 9, SRC.results, 'results.png', BODY) + 2;

		// Full-width paragraph for rhythm
		row += placeText(row, startCol, contentWidth, LOREM[2], 'content'); row += 2;

		row = flowFloat(row, 'right', 42, 10, SRC.editor, 'editor.png', BODY) + 2;

		// Closing + back
		row += placeText(row, startCol, contentWidth, LOREM[4], 'content'); row += 2;
		placeLine(row, startCol, '[ <- back ]', accentLink); row += 1;

		// Trailing filler
		ensureRow(row + 3);
		return { grid, imgs };
	}

	function computeLayout() {
		const vw = document.documentElement.clientWidth;
		fontSize = vw < 640 ? 11 : 14;

		const probe = document.createElement('span');
		probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;letter-spacing:0px';
		probe.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
		probe.style.fontSize = `${fontSize}px`;
		probe.textContent = 'X';
		const parent = containerEl || document.body;
		parent.appendChild(probe);
		const advanceWidth = probe.getBoundingClientRect().width;
		parent.removeChild(probe);

		const cols = Math.max(40, Math.floor(vw / advanceWidth));
		charWidth = vw / cols;
		letterSpacingPx = charWidth - advanceWidth;
		lineHeight = Math.ceil(fontSize * 1.5);

		const { grid, imgs } = buildArticle(cols);
		cells = grid;
		images = imgs;

		tick().then(() => { if (!mounted) mounted = true; });
	}

	onMount(() => {
		computeLayout();
		document.fonts.ready.then(() => computeLayout());
		window.addEventListener('resize', computeLayout);
		return () => window.removeEventListener('resize', computeLayout);
	});
</script>

<svelte:head>
	<title>Layout prototype</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div
	bind:this={containerEl}
	class="demo-container"
	class:opacity-0={!mounted}
	style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: {fontSize}px; line-height: {lineHeight}px; letter-spacing: {letterSpacingPx}px;"
>
	{#if cells.length}
		<CharacterGrid {cells} />

		{#each images as img}
			<div
				class="demo-img"
				style="top: {img.row * lineHeight}px; left: {img.col * charWidth}px; width: {img.cols * charWidth}px; height: {img.rows * lineHeight}px;"
			>
				<img src={img.src} alt={img.label} />
			</div>
		{/each}
	{/if}
</div>

<style>
	.demo-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
		white-space: pre;
		overflow: hidden;
		transition: opacity 0.3s;
		background: #0f0f0f;
		text-rendering: geometricPrecision;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.opacity-0 {
		opacity: 0;
	}

	.demo-img {
		position: absolute;
		z-index: 2;
		overflow: hidden;
		border-radius: 4px;
	}

	.demo-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
		display: block;
	}
</style>
