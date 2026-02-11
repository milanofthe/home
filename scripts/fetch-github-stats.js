#!/usr/bin/env node

/**
 * Fetches GitHub stats for PathSim and PySimHub with history tracking.
 * Preserves historical data - only adds new daily entries.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATS_PATH = join(__dirname, '..', 'src', 'lib', 'data', 'github-stats.json');

function loadExistingData() {
	try {
		const content = readFileSync(STATS_PATH, 'utf-8');
		const data = JSON.parse(content);
		// Migrate old format if needed
		if (!data.history) {
			return {
				current: {
					pathsim: data.pathsim || { stars: 0, forks: 0 },
					pysimhub: data.pysimhub || { projects: 0, members: 0 }
				},
				history: [],
				fetchedAt: data.fetchedAt || null
			};
		}
		return data;
	} catch {
		return {
			current: {
				pathsim: { stars: 0, forks: 0 },
				pysimhub: { projects: 0, members: 0 }
			},
			history: [],
			fetchedAt: null
		};
	}
}

function getTodayDate() {
	return new Date().toISOString().split('T')[0];
}

async function fetchGitHubRepo(owner, repo) {
	const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
		headers: {
			'Accept': 'application/vnd.github.v3+json',
			'User-Agent': 'milanrother-website'
		}
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return response.json();
}

async function fetchOrgMembers(org) {
	const response = await fetch(`https://api.github.com/orgs/${org}/members?per_page=100`, {
		headers: {
			'Accept': 'application/vnd.github.v3+json',
			'User-Agent': 'milanrother-website'
		}
	});

	if (!response.ok) {
		return [];
	}

	return response.json();
}

async function fetchPySimHubProjects() {
	const response = await fetch('https://pysimhub.io/data/projects.json', {
		headers: {
			'User-Agent': 'milanrother-website'
		}
	});

	if (!response.ok) {
		return [];
	}

	return response.json();
}

function parseGitHubUrl(url) {
	const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
	return match ? { owner: match[1], repo: match[2] } : null;
}

async function fetchCumulativeStars(projects) {
	let total = 0;
	for (const project of projects) {
		if (!project.github) continue;
		const parsed = parseGitHubUrl(project.github);
		if (!parsed) continue;
		try {
			const data = await fetchGitHubRepo(parsed.owner, parsed.repo);
			const stars = data.stargazers_count || 0;
			total += stars;
			console.log(`    ${parsed.owner}/${parsed.repo}: ${stars} stars`);
		} catch {
			console.log(`    ${parsed.owner}/${parsed.repo}: failed to fetch`);
		}
	}
	return total;
}

async function main() {
	const existingData = loadExistingData();
	const today = getTodayDate();

	// Check if we already have an entry for today
	const hasToday = existingData.history.some(h => h.date === today);

	const stats = {
		pathsim: { stars: 0, forks: 0, watchers: 0, openIssues: 0 },
		pathview: { stars: 0, forks: 0, watchers: 0, openIssues: 0 },
		pysimhub: { projects: 0, members: 0, cumulativeStars: 0 }
	};

	try {
		// Fetch PathSim repo stats
		console.log('Fetching PathSim stats...');
		const pathsimData = await fetchGitHubRepo('pathsim', 'pathsim');
		stats.pathsim = {
			stars: pathsimData.stargazers_count || 0,
			forks: pathsimData.forks_count || 0,
			watchers: pathsimData.subscribers_count || 0,
			openIssues: pathsimData.open_issues_count || 0
		};
		console.log(`  Stars: ${stats.pathsim.stars}, Forks: ${stats.pathsim.forks}`);

		// Fetch PathView repo stats
		console.log('Fetching PathView stats...');
		const pathviewData = await fetchGitHubRepo('pathsim', 'pathview');
		stats.pathview = {
			stars: pathviewData.stargazers_count || 0,
			forks: pathviewData.forks_count || 0,
			watchers: pathviewData.subscribers_count || 0,
			openIssues: pathviewData.open_issues_count || 0
		};
		console.log(`  Stars: ${stats.pathview.stars}, Forks: ${stats.pathview.forks}`);

		// Fetch PySimHub projects
		console.log('Fetching PySimHub projects...');
		const projects = await fetchPySimHubProjects();
		stats.pysimhub.projects = Array.isArray(projects) ? projects.length : 0;
		console.log(`  Projects: ${stats.pysimhub.projects}`);

		// Fetch cumulative stars across all listed projects
		console.log('Fetching cumulative stars...');
		stats.pysimhub.cumulativeStars = await fetchCumulativeStars(Array.isArray(projects) ? projects : []);
		console.log(`  Cumulative stars: ${stats.pysimhub.cumulativeStars}`);

		// Fetch PySimHub org members
		console.log('Fetching PySimHub members...');
		const members = await fetchOrgMembers('pysimhub');
		stats.pysimhub.members = Array.isArray(members) ? members.length : 0;
		console.log(`  Members: ${stats.pysimhub.members}`);

	} catch (error) {
		console.error('Error fetching stats:', error.message);
		// Use existing current values as fallback
		stats.pathsim = existingData.current.pathsim;
		stats.pathview = existingData.current.pathview || { stars: 0, forks: 0, watchers: 0, openIssues: 0 };
		stats.pysimhub = existingData.current.pysimhub;
	}

	// Update current stats
	existingData.current = stats;
	existingData.fetchedAt = new Date().toISOString();

	// Add to history if we don't have today's entry
	if (!hasToday) {
		existingData.history.push({
			date: today,
			pathsim: { ...stats.pathsim },
			pathview: { ...stats.pathview },
			pysimhub: { ...stats.pysimhub }
		});
		console.log(`Added history entry for ${today}`);
	} else {
		// Update today's entry with latest values
		const todayIndex = existingData.history.findIndex(h => h.date === today);
		existingData.history[todayIndex] = {
			date: today,
			pathsim: { ...stats.pathsim },
			pathview: { ...stats.pathview },
			pysimhub: { ...stats.pysimhub }
		};
		console.log(`Updated history entry for ${today}`);
	}

	// Sort history by date
	existingData.history.sort((a, b) => a.date.localeCompare(b.date));

	// Write updated stats
	writeFileSync(STATS_PATH, JSON.stringify(existingData, null, '\t'));
	console.log(`\nStats written to ${STATS_PATH}`);
	console.log(`History entries: ${existingData.history.length}`);
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
