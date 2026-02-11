#!/usr/bin/env node

/**
 * Fetches all-time star history for PathSim and PathView repos.
 * Uses the stargazers API with timestamps to reconstruct cumulative star counts.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATS_PATH = join(__dirname, '..', 'src', 'lib', 'data', 'github-stats.json');

const REPOS = [
	{ key: 'pathsim', owner: 'pathsim', repo: 'pathsim' },
	{ key: 'pathview', owner: 'pathsim', repo: 'pathview' },
];

async function fetchStargazersPage(owner, repo, page) {
	const url = `https://api.github.com/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`;
	const response = await fetch(url, {
		headers: {
			'Accept': 'application/vnd.github.v3.star+json',
			'User-Agent': 'milanrother-website',
		}
	});

	if (!response.ok) {
		if (response.status === 403 || response.status === 429) {
			const reset = response.headers.get('x-ratelimit-reset');
			const resetDate = reset ? new Date(parseInt(reset) * 1000) : null;
			throw new Error(`Rate limited. Resets at: ${resetDate?.toISOString() || 'unknown'}`);
		}
		throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

async function fetchAllStargazers(owner, repo) {
	const allStargazers = [];
	let page = 1;

	while (true) {
		console.log(`  Fetching page ${page}...`);
		const stargazers = await fetchStargazersPage(owner, repo, page);

		if (stargazers.length === 0) break;

		for (const sg of stargazers) {
			allStargazers.push(sg.starred_at.split('T')[0]);
		}

		if (stargazers.length < 100) break;
		page++;
	}

	return allStargazers;
}

function buildCumulativeHistory(starDates) {
	if (starDates.length === 0) return [];

	// Sort dates
	starDates.sort();

	// Count stars per day
	const dailyCounts = {};
	for (const date of starDates) {
		dailyCounts[date] = (dailyCounts[date] || 0) + 1;
	}

	// Build cumulative series - only include days where stars were added
	const sortedDays = Object.keys(dailyCounts).sort();
	const history = [];
	let cumulative = 0;

	for (const day of sortedDays) {
		cumulative += dailyCounts[day];
		history.push({ date: day, stars: cumulative });
	}

	return history;
}

async function main() {
	console.log('Fetching all-time star history...\n');

	const starHistory = {};

	for (const { key, owner, repo } of REPOS) {
		console.log(`Fetching stargazers for ${owner}/${repo}...`);
		const starDates = await fetchAllStargazers(owner, repo);
		console.log(`  Total stargazers: ${starDates.length}`);

		starHistory[key] = buildCumulativeHistory(starDates);
		console.log(`  History entries: ${starHistory[key].length}\n`);
	}

	// Load existing data and add star history
	const existingData = JSON.parse(readFileSync(STATS_PATH, 'utf-8'));
	existingData.starHistory = starHistory;

	writeFileSync(STATS_PATH, JSON.stringify(existingData, null, '\t'));
	console.log(`Star history written to ${STATS_PATH}`);
	console.log(`PathSim: ${starHistory.pathsim.length} entries (${starHistory.pathsim.at(-1)?.stars || 0} total stars)`);
	console.log(`PathView: ${starHistory.pathview.length} entries (${starHistory.pathview.at(-1)?.stars || 0} total stars)`);
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
