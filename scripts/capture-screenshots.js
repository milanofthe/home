#!/usr/bin/env node

/**
 * Captures screenshots of project websites using Puppeteer.
 * Captures both dark and light themes using ?theme= URL parameter.
 * Run with: npm run screenshots
 */

import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, '..', 'static', 'screenshots');

// Per-site capture config. `extraWaitMs` is the post-load settle time —
// bump it for sites that boot WASM, Pyodide, or otherwise need time after
// networkidle to actually render content (the GitHub-Pages 404 on SPA
// routes still serves the SPA shell, so what matters is in-browser render
// time, not the HTTP status).
const sites = [
	{ id: 'pathsim-org', url: 'https://pathsim.org' },
	{ id: 'docs-pathsim-org', url: 'https://docs.pathsim.org' },
	{ id: 'view-pathsim-org', url: 'https://view.pathsim.org' },
	{ id: 'pysimhub-io', url: 'https://pysimhub.io' },
	{ id: 'pysimhub-pathsim', url: 'https://pysimhub.io/projects/pathsim/' },
	{ id: 'rapidpassives-org', url: 'https://rapidpassives.org', darkOnly: true, waitUntil: 'domcontentloaded', timeout: 60000, extraWaitMs: 12000 },
	{ id: 'rapidfem-editor', url: 'https://fem.rapidpassives.org/notebook?example=fd_iris_filter', darkOnly: true, waitUntil: 'networkidle2', timeout: 90000, extraWaitMs: 20000 },
	{ id: 'rapidmesh-site', url: 'https://mesh.rapidpassives.org', darkOnly: true, waitUntil: 'domcontentloaded', timeout: 60000, extraWaitMs: 12000 },
	{ id: 'scidata-io', url: 'https://scidata.io', darkOnly: true, waitUntil: 'networkidle2', timeout: 60000, extraWaitMs: 10000 },
	{ id: 'scidata-app', url: 'https://scidata.io/app?template=paper-ryegrass-drc', darkOnly: true, waitUntil: 'networkidle2', timeout: 120000, extraWaitMs: 20000 },
	{ id: 'fastsim-org', url: 'https://fast.pathsim.org', waitUntil: 'networkidle2', timeout: 60000, extraWaitMs: 12000 },
	{ id: 'thesisos-landing', url: 'https://thesisos.io/?static=true', darkOnly: true, waitUntil: 'networkidle2', timeout: 60000, extraWaitMs: 10000 },
	{ id: 'thesisos-graph', url: 'https://thesisos.io/graph?root=cb35ff8e-d0f5-437c-9528-89307638622a', darkOnly: true, waitUntil: 'networkidle2', timeout: 60000, extraWaitMs: 20000 },
	{ id: 'whatsmytraffic-landing', url: 'https://whatsmytraffic.com', darkOnly: true, waitUntil: 'networkidle2', timeout: 60000, extraWaitMs: 10000 }
];

const themes = ['dark', 'light'];

// Capture viewport aspect ratio is matched to the homepage tiles so the
// screenshot fills the tile (object-fit: cover) with no awkward cropping. The
// grid tiles are 54 cols x 14 rows of JetBrains Mono (~0.6em advance width,
// 1.5 line-height):  AR = (54 * 0.6) / (14 * 1.5) ≈ 1.54.
const TILE_AR = 1.54;
const BASE_WIDTH = 1440;

// "Zoom" makes the site content render larger relative to the frame. A CSS zoom
// transform anchors at the top-left and crops the right/bottom edges, which
// looked broken — instead we shrink the captured CSS region while keeping
// TILE_AR, so content scales up with no cropping. Per-site `zoom` overrides
// this; set 1 to capture the full-width layout.
const ZOOM = 1.15;

// Device scale factor. The tile shows the screenshot at only ~455 CSS px wide,
// so an oversized capture gets downscaled hard at render time — and heavy
// browser downscaling is exactly what aliases. Capturing nearer the display
// size (~2x for retina) keeps it crisp AND keeps the files light.
const DPR = 1.5;

async function captureScreenshot(browser, site, theme) {
	const url = site.darkOnly ? site.url : `${site.url}${site.url.includes('?') ? '&' : '?'}theme=${theme}`;
	console.log(`  ${site.id} ${theme}...`);

	const page = await browser.newPage();
	const zoom = site.zoom ?? ZOOM;
	const width = Math.round(BASE_WIDTH / zoom);
	const height = Math.round(width / TILE_AR);
	await page.setViewport({ width, height, deviceScaleFactor: DPR });

	try {
		await page.goto(url, { waitUntil: site.waitUntil || 'networkidle2', timeout: site.timeout || 30000 });
		// Default settle wait — even after networkidle most sites still have
		// post-mount work to do (hydration, fonts, late images). Per-site
		// extraWaitMs covers WASM boot, Pyodide, FEM solvers, lazy thumbnails.
		const settleMs = site.extraWaitMs ?? 8000;
		await new Promise((resolve) => setTimeout(resolve, settleMs));

		const filename = `${site.id}-${theme}.png`;
		const outputPath = join(SCREENSHOTS_DIR, filename);
		await page.screenshot({ path: outputPath, type: 'png' });
		console.log(`    Saved: ${filename}`);

		// Also save dark theme as the default screenshot (used by the homepage)
		if (theme === 'dark') {
			const defaultFilename = `${site.id}.png`;
			const defaultPath = join(SCREENSHOTS_DIR, defaultFilename);
			await page.screenshot({ path: defaultPath, type: 'png' });
			console.log(`    Saved: ${defaultFilename}`);
		}
	} catch (error) {
		console.error(`    Error: ${error.message}`);
	} finally {
		await page.close();
	}
}

async function main() {
	if (!existsSync(SCREENSHOTS_DIR)) {
		mkdirSync(SCREENSHOTS_DIR, { recursive: true });
		console.log(`Created directory: ${SCREENSHOTS_DIR}`);
	}

	console.log('Launching browser...');
	const browser = await puppeteer.launch({
		headless: true,
		channel: 'chrome',
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});

	try {
		for (const site of sites) {
			console.log(`\nCapturing ${site.id} (${site.url}):`);
			const siteThemes = site.darkOnly ? ['dark'] : themes;
			for (const theme of siteThemes) {
				await captureScreenshot(browser, site, theme);
			}
		}
	} finally {
		await browser.close();
	}

	console.log('\nDone!');
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
