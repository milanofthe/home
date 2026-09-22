#!/usr/bin/env node

/**
 * Re-encodes the site's photographs and screenshots as WebP, in the build
 * output only, and points everything that referenced a PNG at the WebP.
 *
 * The sources stay PNG: they come out of screenshot runs and image exports,
 * they are what gets edited and re-captured, and a lossy format is not a thing
 * to keep an original in. What gets deployed is another question, and there a
 * 1.5 MB screenshot that reads identically at 120 KB is twelve times the
 * transfer for nothing.
 *
 * Only `images/` and `screenshots/`. The social card, the icons and anything
 * else in `static/` stay as they are: og:image is read by crawlers that still
 * do not all take WebP, and an icon is small enough that the format is not
 * where its bytes are.
 *
 * Each image is encoded twice, lossless and lossy, and the smaller file wins
 * with a thumb on the scale for lossless. That is not a compromise between the
 * two, it is what measuring them said: a screenshot of a UI is flat colour and
 * text, which lossless WebP packs better than lossy does. falllow-landing.png
 * is 165 KB as PNG, 79 KB at quality 82, and 46 KB with nothing thrown away at
 * all. Photographs go the other way, by a factor of three, and that is what
 * the lossy branch is there for.
 *
 * Run after `vite build`, on the `build` directory.
 */

import { readdirSync, readFileSync, writeFileSync, rmSync, statSync } from 'fs';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const build = join(root, 'build');

/** Directories under the build whose raster images are re-encoded. */
const DIRS = ['images', 'screenshots'];
/** Quality for the lossy branch, on the scale WebP uses. Only photographs end
 *  up here; at 82 the one portrait on the site is a third of its lossless
 *  size and indistinguishable at the size it is shown. */
const QUALITY = 82;
/** How much larger a lossless file may be and still be preferred. Half again
 *  the bytes is worth it for a screenshot of code or a plot of thin lines,
 *  where lossy WebP smears exactly what the picture is there to show. A
 *  photograph is three to five times larger lossless, so it stays lossy. */
const LOSSLESS_SLACK = 1.6;
const SOURCES = new Set(['.png', '.jpg', '.jpeg']);

function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
	);
}

const converted = [];
let before = 0;
let after = 0;
let lossless = 0;

for (const name of DIRS) {
	const dir = join(build, name);
	let files;
	try {
		files = walk(dir);
	} catch {
		continue;
	}
	for (const file of files) {
		const ext = extname(file).toLowerCase();
		if (!SOURCES.has(ext)) continue;
		const out = file.slice(0, -ext.length) + '.webp';
		// A hand-made WebP next to the source wins: headshot_milan.webp was
		// exported on purpose and is what the markup already asks for.
		let exists = false;
		try {
			statSync(out);
			exists = true;
		} catch {}
		const from = statSync(file).size;
		if (!exists) {
			const [flat, lossy] = await Promise.all([
				sharp(file).webp({ lossless: true, effort: 5 }).toBuffer(),
				sharp(file).webp({ quality: QUALITY, effort: 5 }).toBuffer(),
			]);
			const keepFlat = flat.length <= lossy.length * LOSSLESS_SLACK;
			if (keepFlat) lossless++;
			writeFileSync(out, keepFlat ? flat : lossy);
		}
		const to = statSync(out).size;
		before += from;
		after += exists ? 0 : to;
		if (exists) before -= from;
		converted.push({
			from: '/' + file.slice(build.length + 1),
			to: '/' + out.slice(build.length + 1),
		});
		rmSync(file);
	}
}

if (converted.length === 0) {
	console.log('no images to re-encode');
	process.exit(0);
}

// Point the site at them. The paths live in two places once built: in the
// prerendered HTML and in the JS chunk that carries content.json, so this
// rewrites both rather than guessing which one a given image came through.
const REWRITABLE = new Set(['.html', '.js', '.json', '.css', '.xml', '.txt']);
const map = new Map(converted.map((c) => [c.from, c.to]));
let touched = 0;
for (const file of walk(build)) {
	if (!REWRITABLE.has(extname(file).toLowerCase())) continue;
	const text = readFileSync(file, 'utf8');
	let out = text;
	for (const [from, to] of map) {
		if (out.includes(from)) out = out.split(from).join(to);
	}
	if (out !== text) {
		writeFileSync(file, out);
		touched++;
	}
}

// Anything still pointing at a picture that is not there. Cheap to check here,
// since this pass already walks every built file, and the alternative is
// noticing a missing image by looking at the page. Not fatal: the screenshot
// captures run in CI, so a local build is missing the tiles they produce.
const missing = new Set();
for (const file of walk(build)) {
	if (!REWRITABLE.has(extname(file).toLowerCase())) continue;
	const text = readFileSync(file, 'utf8');
	for (const ref of text.match(/\/(?:images|screenshots)\/[\w./-]+\.(?:webp|png|jpg|jpeg|svg|gif)/g) ?? []) {
		try {
			statSync(join(build, ref));
		} catch {
			missing.add(ref);
		}
	}
}
if (missing.size > 0) console.log(`warning: ${missing.size} missing image(s): ${[...missing].join(', ')}`);

const mb = (n) => (n / 1048576).toFixed(1);
console.log(
	`re-encoded ${converted.length} images as WebP: ${mb(before)} MB -> ${mb(after)} MB ` +
		`(${Math.round((1 - after / before) * 100)}% smaller), ${lossless} of them with ` +
		`nothing thrown away, rewritten in ${touched} files`,
);
