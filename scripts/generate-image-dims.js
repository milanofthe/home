#!/usr/bin/env node

/**
 * Reads the pixel dimensions of every image under static/images and
 * static/screenshots and writes them to src/lib/data/image-dims.json.
 * The article grid uses these to size image frames at the real aspect
 * ratio. Run after adding or regenerating images (CI runs it after the
 * screenshot capture, before the build).
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function pngSize(buf) {
	// IHDR: width/height as big-endian u32 at offsets 16/20
	if (buf.length < 24 || buf.readUInt32BE(12) !== 0x49484452) return null;
	return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function webpSize(buf) {
	if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
	const fourcc = buf.toString('ascii', 12, 16);
	if (fourcc === 'VP8X') {
		// canvas size minus one as 24-bit LE at offsets 24/27
		return {
			w: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
			h: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16))
		};
	}
	if (fourcc === 'VP8 ') {
		// lossy: 14-bit dimensions at offsets 26/28 after the frame tag
		return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
	}
	if (fourcc === 'VP8L') {
		// lossless: 14-bit minus-one dimensions packed after the signature byte
		const b = buf.readUInt32LE(21);
		return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) };
	}
	return null;
}

const dims = {};

/**
 * Walks a directory tree, recording every image it finds under its public URL.
 *
 * Recursive because images live in subfolders too (static/images/timeline). A flat
 * read silently skipped those, and a missing entry is not a visible error: the
 * layout just falls back to a declared height and the frame no longer matches the
 * picture's aspect ratio.
 */
function collect(abs, urlPrefix) {
	for (const entry of readdirSync(abs, { withFileTypes: true })) {
		const path = join(abs, entry.name);
		const url = `${urlPrefix}/${entry.name}`;

		if (entry.isDirectory()) {
			collect(path, url);
			continue;
		}

		const ext = extname(entry.name).toLowerCase();
		if (ext !== '.png' && ext !== '.webp') continue;

		const buf = readFileSync(path);
		const size = ext === '.png' ? pngSize(buf) : webpSize(buf);
		if (size) dims[url] = [size.w, size.h];
		else console.warn(`could not read dimensions: ${url}`);
	}
}

for (const dir of ['images', 'screenshots']) {
	collect(join(root, 'static', dir), `/${dir}`);
}

const out = join(root, 'src', 'lib', 'data', 'image-dims.json');
writeFileSync(out, JSON.stringify(dims, null, '\t') + '\n');
console.log(`wrote ${Object.keys(dims).length} image dimensions to ${out}`);
