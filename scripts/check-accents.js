#!/usr/bin/env node

/**
 * Asserts that the accent list and the accent palette agree.
 *
 * A project's colour lives in exactly two places: its name in
 * src/lib/accents.ts and one `.accent-<name>` rule in src/app.css. Everything
 * else is derived from the list. This checks the one seam that is left, and
 * it exists because the failure it catches is silent: a name with no rule
 * behind it falls back to the default grey and looks like a design decision,
 * which is how a project sat on the landing page in the wrong colour.
 *
 * Also checks the other direction, since a rule nobody reads is dead weight
 * that reads as though the colour were in use.
 *
 * Run with: npm run check-accents
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ts = readFileSync(join(root, 'src/lib/accents.ts'), 'utf8');
const list = ts.slice(ts.indexOf('ACCENT_KEYS = ['), ts.indexOf('] as const'));
const names = [...list.matchAll(/'([a-z]+)'/g)].map((m) => m[1]).filter((n) => n !== 'neutral');

const css = readFileSync(join(root, 'src/app.css'), 'utf8');
const rules = [...css.matchAll(/\.accent-([a-z]+)\s*\{\s*--accent-colour:\s*(#[0-9a-fA-F]{3,8})/g)];
const palette = new Map(rules.map((m) => [m[1], m[2]]));

const missing = names.filter((n) => !palette.has(n));
const extra = [...palette.keys()].filter((n) => !names.includes(n));
const duplicates = [...palette.values()].filter((c, i, all) => all.indexOf(c) !== i);

console.log(`${names.length} accents, ${palette.size} colours`);
for (const n of names) console.log(`  ${n.padEnd(16)} ${palette.get(n) ?? 'MISSING'}`);

let failures = 0;
const fail = (msg) => {
	console.log(`FAIL  ${msg}`);
	failures++;
};

if (missing.length) fail(`no colour in app.css for: ${missing.join(', ')}`);
if (extra.length) fail(`a colour in app.css that no accent uses: ${extra.join(', ')}`);
// Two projects in the same colour is not an error in principle, but it has
// always been a copy and paste in practice.
if (duplicates.length) fail(`two accents share a colour: ${[...new Set(duplicates)].join(', ')}`);

console.log(failures === 0 ? '\nthe accent list and the palette agree' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
