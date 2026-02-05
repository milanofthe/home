import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = join(import.meta.dirname, '..', 'src');
const OUTPUT = join(SRC_DIR, 'lib', 'data', 'filler-source.ts');
const TARGET_LENGTH = 5000;

function collectFiles(dir, files = []) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const stat = statSync(full);
		if (stat.isDirectory()) {
			collectFiles(full, files);
		} else if (['.ts', '.svelte', '.css', '.js'].includes(extname(entry))) {
			// Skip the output file itself and data files
			if (!full.includes('filler-source') && !full.includes('.json')) {
				files.push(full);
			}
		}
	}
	return files;
}

const files = collectFiles(SRC_DIR);
let raw = '';

for (const f of files) {
	const content = readFileSync(f, 'utf-8');
	raw += content + '\n';
}

// Clean up: collapse whitespace, replace newlines with semicolons
let filler = raw
	.replace(/\t/g, ' ')           // tabs to spaces
	.replace(/\r\n/g, '\n')        // normalize line endings
	.split('\n')
	.map(line => line.trim())
	.filter(line => line.length > 0)
	.join('; ')
	.replace(/\s{2,}/g, ' ')       // collapse multiple spaces
	.replace(/;{2,}/g, ';')        // collapse multiple semicolons
	.replace(/; ;/g, ';');          // clean up

// Trim to target length
if (filler.length > TARGET_LENGTH) {
	filler = filler.slice(0, TARGET_LENGTH);
}

const output = `// Auto-generated filler source code for the code rain grid
// Run: node scripts/generate-filler.js
export const FILLER_SOURCE = ${JSON.stringify(filler)};
`;

writeFileSync(OUTPUT, output);
console.log(`Generated filler source: ${filler.length} chars`);
