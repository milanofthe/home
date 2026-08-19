#!/usr/bin/env node

/**
 * Renders static/og-image.png, the card every page links as og:image.
 *
 * Generated rather than drawn, for the same reason the screenshots are: the card
 * carries the site's tagline, and a tagline that lives in two places is a tagline
 * that will disagree with itself. Heading and tagline come from content.json, the
 * background is the same filler text the code-rain grid uses, and the type is the
 * site's own JetBrains Mono, inlined so the script needs no server.
 *
 * Run with: npm run og
 */

import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 1200x630 is the card size every platform crops from. At 20px JetBrains Mono the
// grid comes out at 100 columns by 21 rows, which is what the layout below assumes.
const WIDTH = 1200;
const HEIGHT = 630;
const COLS = 100;
const ROWS = 21;
const FONT_PX = 20;
const LINE_PX = 30;

const CHARCOAL = '#0f0f0f';
const CREAM = '#f0efe9';
const ACCENT = '#969591';
const TEAL = '#00d9c0'; // the prompt in the touch icon, so card and icon read as one mark
const FILLER = 'rgba(240, 239, 233, 0.07)';

const content = JSON.parse(readFileSync(join(root, 'src/lib/data/content.json'), 'utf8'));

// filler-source.ts is a single exported string literal; read it rather than import
// it, because this script is plain Node and that file is TypeScript.
const fillerSrc = readFileSync(join(root, 'src/lib/data/filler-source.ts'), 'utf8');
const FILLER_SOURCE = JSON.parse(fillerSrc.slice(fillerSrc.indexOf('"'), fillerSrc.lastIndexOf('"') + 1));

const fontB64 = readFileSync(join(root, 'static/fonts/jetbrains-mono-latin.woff2')).toString('base64');
const portraitB64 = readFileSync(join(root, 'static/images/headshot_milan.webp')).toString('base64');

// The picture sits in the same ASCII frame the page draws around every image, so the
// frame is part of the character grid and the photo is positioned into its interior
// by grid coordinates -- exactly how the code-rain page places its own tiles.
const CHAR_W = WIDTH / COLS;
const FRAME = { col: 4, cols: 28, row: 3, innerRows: 12, label: 'milan.png' };
const FRAME_PX = {
	x: (FRAME.col + 1) * CHAR_W,
	y: (FRAME.row + 1) * LINE_PX,
	w: (FRAME.cols - 2) * CHAR_W,
	h: FRAME.innerRows * LINE_PX
};
const MSG_X = (FRAME.col + FRAME.cols + 3) * CHAR_W;

// One sentence, not the whole tagline: a card is read at thumbnail size and gets to
// say one thing. The rest of the positioning is on the page it links to.
const LEAD = content.hero.tagline.split(/(?<=\.)\s+/)[0];

function wrap(text, width) {
	const out = [];
	let line = '';
	for (const word of text.split(' ')) {
		if (line && (line + ' ' + word).length > width) {
			out.push(line);
			line = word;
		} else {
			line = line ? line + ' ' + word : word;
		}
	}
	if (line) out.push(line);
	return out;
}

// The filler grid, the card's background texture. The message sits over it in a
// separate layer at readable sizes: a card is looked at as a thumbnail, where the
// grid's own 20px type would be unreadable, so the type scale is the one thing here
// that does not follow the page.
function buildRows() {
	const rows = [];
	for (let r = 0; r < ROWS; r++) {
		const cells = [];
		for (let c = 0; c < COLS; c++) {
			cells.push({ ch: FILLER_SOURCE[(r * COLS + c) % FILLER_SOURCE.length], cls: 'f' });
		}
		rows.push(cells);
	}

	// A one-cell quiet zone around the frame. Without it whatever the filler happens
	// to spell runs straight into the border, and the filler at this spot is the
	// unicode-range list: its "U+0304" puts a + against the corner and the frame reads
	// as if it had two.
	for (let r = FRAME.row - 1; r <= FRAME.row + FRAME.innerRows + 2; r++) {
		if (r < 0 || r >= ROWS) continue;
		for (let c = FRAME.col - 1; c <= FRAME.col + FRAME.cols; c++) {
			if (c < 0 || c >= COLS) continue;
			rows[r][c] = { ch: ' ', cls: 'f' };
		}
	}

	// The frame, in the page's own vocabulary: +- label ---+ over | sides over +---+.
	const put = (r, c, text) => {
		for (let i = 0; i < text.length; i++) rows[r][c + i] = { ch: text[i], cls: 'fr' };
	};
	const label = ` ${FRAME.label} `;
	const dashes = FRAME.cols - 3 - label.length;
	put(FRAME.row, FRAME.col, '+-' + label + '-'.repeat(Math.max(0, dashes)) + '+');
	for (let r = FRAME.row + 1; r <= FRAME.row + FRAME.innerRows; r++) {
		put(r, FRAME.col, '|');
		put(r, FRAME.col + FRAME.cols - 1, '|');
	}
	put(FRAME.row + FRAME.innerRows + 1, FRAME.col, '+' + '-'.repeat(FRAME.cols - 2) + '+');
	return rows;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {
	font-family: 'JetBrains Mono';
	font-style: normal;
	font-weight: 400 600;
	src: url(data:font/woff2;base64,${fontB64}) format('woff2');
}
html, body { margin: 0; padding: 0; background: ${CHARCOAL}; }
body {
	width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden;
	font-family: 'JetBrains Mono', monospace;
	font-size: ${FONT_PX}px; line-height: ${LINE_PX}px;
	white-space: pre;
}
.r { height: ${LINE_PX}px; }
.f { color: ${FILLER}; }
.fr { color: ${ACCENT}; }
/* The name is capped by the column, not by taste: 12 characters at 0.1em tracking
   fill 0.7 em each, so anything past 84px runs out of the message column. */
.name { font-size: 84px; line-height: 1.05; font-weight: 600; letter-spacing: 0.1em; color: ${CREAM}; }
.lead { font-size: 35px; line-height: 1.4; color: ${CREAM}; white-space: normal; margin-top: 30px; }
.site { font-size: 33px; color: ${ACCENT}; letter-spacing: 0.06em; margin-top: 30px; }
.site .p { color: ${TEAL}; }
	.portrait {
		position: absolute;
		left: ${FRAME_PX.x}px; top: ${FRAME_PX.y}px;
		width: ${FRAME_PX.w}px; height: ${FRAME_PX.h}px;
		object-fit: cover; object-position: 50% 30%;
	}
	.msg {
		position: absolute; left: ${MSG_X}px; right: 60px;
		top: 0; bottom: 0;
		display: flex; flex-direction: column; justify-content: center;
	}
</style></head><body>${buildRows()
	.map((cells) => {
		// Collapse runs of the same class so the DOM stays small.
		let out = '';
		let run = '';
		let cls = null;
		const flush = () => {
			if (run) out += `<span class="${cls}">${run.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m])}</span>`;
			run = '';
		};
		for (const cell of cells) {
			if (cell.cls !== cls) { flush(); cls = cell.cls; }
			run += cell.ch;
		}
		flush();
		return `<div class="r">${out}</div>`;
	})
	.join('')}<img class="portrait" src="data:image/webp;base64,${portraitB64}" alt="" />
<div class="msg">
	<div class="name">${content.hero.heading}</div>
	<div class="lead">${LEAD}</div>
	<div class="site"><span class="p">&gt;</span> milanrother.com</div>
</div></body></html>`;

const browser = await puppeteer.launch({ channel: 'chrome', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluateHandle('document.fonts.ready');
const out = join(root, 'static/og-image.png');
await page.screenshot({ path: out });
await browser.close();

const bytes = readFileSync(out).length;
console.log(`wrote ${out} (${WIDTH}x${HEIGHT}, ${(bytes / 1024).toFixed(1)} kB)`);
