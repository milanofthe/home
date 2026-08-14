#!/usr/bin/env node

/**
 * Generates the CV PDF from src/lib/data/cv.json.
 * Layout is an HTML template printed to A4 via Chrome, using the same fonts
 * the site ships. Output: static/cv/milan-rother-cv.pdf (committed, since CI
 * has no Chrome). Run with: npm run cv
 */

import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const cv = JSON.parse(readFileSync(join(ROOT, 'src/lib/data/cv.json'), 'utf-8'));
const stats = JSON.parse(readFileSync(join(ROOT, 'src/lib/data/github-stats.json'), 'utf-8'));

// Round stars down to a stable "N+" figure so the CV does not pretend
// day-level precision.
const stars = Math.floor((stats.current?.pathsim?.stars ?? 400) / 50) * 50;

const fontUrl = (f) => pathToFileURL(join(ROOT, 'static/fonts', f)).href;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tpl = (s) => esc(s).replace('{pathsimStars}', String(stars));

const entry = (e) => `
	<div class="entry">
		<div class="period">${esc(e.period)}</div>
		<div class="body">
			<div class="role">${esc(e.title)}<span class="org"> · ${esc(e.org)}</span></div>
			${e.note ? `<div class="note">${esc(e.note)}</div>` : ''}
			${e.bullets ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
		</div>
	</div>`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
	@font-face { font-family: 'Inter'; src: url('${fontUrl('inter-latin.woff2')}') format('woff2'); font-weight: 400 600; }
	@font-face { font-family: 'Space Grotesk'; src: url('${fontUrl('space-grotesk-latin.woff2')}') format('woff2'); font-weight: 500 700; }
	@font-face { font-family: 'JetBrains Mono'; src: url('${fontUrl('jetbrains-mono-latin.woff2')}') format('woff2'); font-weight: 400 600; }

	@page { size: A4; margin: 15mm 17mm 16mm 17mm; }
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html { -webkit-print-color-adjust: exact; }
	body { font-family: 'Inter', sans-serif; font-size: 9.3pt; line-height: 1.42; color: #1a1a1a; }

	a { color: inherit; text-decoration: none; }

	header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 4mm; border-bottom: 0.6pt solid #1a1a1a; }
	h1 { font-family: 'Space Grotesk', sans-serif; font-size: 21pt; font-weight: 700; letter-spacing: 0.01em; }
	.headline { font-size: 10pt; color: #444; margin-top: 1mm; }
	.contact { font-family: 'JetBrains Mono', monospace; font-size: 7.6pt; color: #444; text-align: right; line-height: 1.65; }

	section { margin-top: 5mm; break-inside: auto; }
	h2 { font-family: 'Space Grotesk', sans-serif; font-size: 8.6pt; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #0b5e96; margin-bottom: 2.2mm; }

	.summary { color: #333; }

	.entry { display: flex; gap: 4mm; margin-bottom: 2.6mm; break-inside: avoid; }
	.period { font-family: 'JetBrains Mono', monospace; font-size: 7.6pt; color: #666; flex: 0 0 27mm; padding-top: 0.4mm; }
	.body { flex: 1; }
	.role { font-weight: 600; }
	.org { font-weight: 400; color: #555; }
	.note { color: #444; margin-top: 0.4mm; }
	ul { margin: 0.6mm 0 0 3.6mm; }
	li { margin-bottom: 0.5mm; color: #333; }

	.oss .entry { margin-bottom: 1.8mm; }
	.oss .name { font-weight: 600; flex: 0 0 27mm; font-size: 9.3pt; font-family: 'Inter', sans-serif; color: #1a1a1a; padding-top: 0; }
	.pubs li, .skills li { list-style: none; margin-bottom: 1mm; color: #333; }
	.pubs ul, .skills ul { margin-left: 0; }
	.skills .label { font-weight: 600; color: #1a1a1a; }

	footer { position: fixed; bottom: -10mm; right: 0; font-family: 'JetBrains Mono', monospace; font-size: 6.6pt; color: #999; }
</style></head><body>

<header>
	<div>
		<h1>${esc(cv.name)}</h1>
		<div class="headline">${esc(cv.headline)}</div>
	</div>
	<div class="contact">
		<a href="mailto:${esc(cv.contact.email)}">${esc(cv.contact.email)}</a><br>
		<a href="https://${esc(cv.contact.web)}">${esc(cv.contact.web)}</a> · <a href="https://${esc(cv.contact.github)}">${esc(cv.contact.github)}</a><br>
		<a href="https://${esc(cv.contact.linkedin)}">${esc(cv.contact.linkedin)}</a><br>
		${esc(cv.contact.location)} · ${esc(cv.contact.languages)}
	</div>
</header>

<section><p class="summary">${esc(cv.summary)}</p></section>

<section>
	<h2>Experience</h2>
	${cv.experience.map(entry).join('')}
</section>

<section>
	<h2>Education</h2>
	${cv.education.map(entry).join('')}
</section>

<section class="oss">
	<h2>Open source &amp; products</h2>
	${cv.openSource.map((p) => `
	<div class="entry">
		<div class="name">${esc(p.name)}</div>
		<div class="body" style="color:#333">${tpl(p.desc)}</div>
	</div>`).join('')}
</section>

<section class="pubs">
	<h2>Publications &amp; talks</h2>
	<ul>${cv.publications.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
</section>

<section class="skills">
	<h2>Skills</h2>
	<ul>${cv.skills.map((s) => `<li><span class="label">${esc(s.label)}:</span> ${esc(s.text)}</li>`).join('')}</ul>
</section>

<section>
	<h2>Beyond engineering</h2>
	${cv.other.map((o) => `
	<div class="entry">
		<div class="period">${esc(o.period)}</div>
		<div class="body" style="color:#333">${esc(o.text)}</div>
	</div>`).join('')}
</section>

</body></html>`;

const tmp = join(tmpdir(), 'milan-cv.html');
writeFileSync(tmp, html);

const outDir = join(ROOT, 'static/cv');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, 'milan-rother-cv.pdf');

const browser = await puppeteer.launch({ headless: 'new', channel: 'chrome' });
const page = await browser.newPage();
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0' });
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('wrote', out);
