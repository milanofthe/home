#!/usr/bin/env node

/**
 * Captures screenshots of project websites using Puppeteer.
 * Run with: npm run screenshots
 */

import puppeteer from 'puppeteer';
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

async function captureScreenshot(browser, site) {
	console.log(`Capturing ${site.id} (${site.url})...`);

	const page = await browser.newPage();
	await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

	// Enable dark mode
	await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

	try {
		await page.goto(site.url, {
			waitUntil: 'networkidle2',
			timeout: 30000
		});

		// Wait a bit for any animations to settle
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const outputPath = join(SCREENSHOTS_DIR, `${site.id}.png`);
		await page.screenshot({
			path: outputPath,
			type: 'png'
		});

		console.log(`  Saved: ${outputPath}`);
	} catch (error) {
		console.error(`  Error capturing ${site.id}:`, error.message);
	} finally {
		await page.close();
	}
}

async function main() {
	// Ensure screenshots directory exists
	if (!existsSync(SCREENSHOTS_DIR)) {
		mkdirSync(SCREENSHOTS_DIR, { recursive: true });
		console.log(`Created directory: ${SCREENSHOTS_DIR}`);
	}

	console.log('Launching browser...');
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});

	try {
		for (const site of sites) {
			await captureScreenshot(browser, site);
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
