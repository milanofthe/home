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

const sites = [
	{ id: 'pathsim-org', url: 'https://pathsim.org' },
	{ id: 'docs-pathsim-org', url: 'https://docs.pathsim.org' },
	{ id: 'view-pathsim-org', url: 'https://view.pathsim.org' },
	{ id: 'pysimhub-io', url: 'https://pysimhub.io' }
];

const themes = ['dark', 'light'];

const viewport = { width: 1440, height: 900 };

async function captureScreenshot(browser, site, theme) {
	const url = `${site.url}${site.url.includes('?') ? '&' : '?'}theme=${theme}`;
	console.log(`  ${site.id} ${theme}...`);

	const page = await browser.newPage();
	await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 2 });

	try {
		await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
		await new Promise((resolve) => setTimeout(resolve, 1500));

		const filename = `${site.id}-${theme}.png`;
		const outputPath = join(SCREENSHOTS_DIR, filename);
		await page.screenshot({ path: outputPath, type: 'png' });
		console.log(`    Saved: ${filename}`);
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
			for (const theme of themes) {
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
