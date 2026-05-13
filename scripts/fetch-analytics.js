#!/usr/bin/env node

/**
 * Fetches Cloudflare Web Analytics data for all configured sites.
 * Implements incremental fetching - only fetches dates not already in analytics.json.
 * Initial run fetches full history (~90 days).
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { sites, config } from './analytics-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANALYTICS_PATH = join(__dirname, '..', 'src', 'lib', 'data', 'analytics.json');

// GraphQL query for time series data (fetches hourly, aggregated to 6-hour buckets)
const TIMESERIES_QUERY = `
query GetTimeseries($accountTag: String!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      timeseries: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 1000, orderBy: [datetimeHour_ASC]) {
        count
        sum { visits }
        dimensions { datetimeHour }
      }
    }
  }
}
`;

// Daily aggregate query: same dimensions but grouped by `date` as well.
// One Cloudflare call returns up to 5000 (date, dimension) tuples per group;
// we then bucket client-side to build per-day Top-50 snapshots.
const DAILY_AGGREGATE_QUERY = `
query GetDailyAggregates($accountTag: String!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      dailyPages: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 5000, orderBy: [count_DESC]) {
        count
        dimensions { date, requestPath }
      }
      dailyReferrers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 5000, orderBy: [count_DESC]) {
        count
        dimensions { date, refererHost }
      }
      dailyCountries: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 5000, orderBy: [count_DESC]) {
        count
        dimensions { date, countryName }
      }
      dailyBrowsers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 2000, orderBy: [count_DESC]) {
        count
        dimensions { date, userAgentBrowser }
      }
    }
  }
}
`;

// Per-day Top-N limits (kept in sync with the dashboard's getAggregateData topN).
const DAILY_TOP_N = { pages: 50, referrers: 50, countries: 50, browsers: 20 };

// GraphQL query for aggregate data (top pages, referrers, etc.).
// Limits are generous so the dashboard can show long tails and the country map
// has enough data points. Cloudflare's hard limit is 10k per group.
const AGGREGATE_QUERY = `
query GetAggregates($accountTag: String!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      topPages: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 50, orderBy: [count_DESC]) {
        count
        dimensions { requestPath }
      }
      topReferrers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 50, orderBy: [count_DESC]) {
        count
        dimensions { refererHost }
      }
      topCountries: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 250, orderBy: [count_DESC]) {
        count
        dimensions { countryName }
      }
      topBrowsers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 20, orderBy: [count_DESC]) {
        count
        dimensions { userAgentBrowser }
      }
    }
  }
}
`;

function loadExistingData() {
	try {
		const content = readFileSync(ANALYTICS_PATH, 'utf-8');
		return JSON.parse(content);
	} catch {
		return { lastFetched: null, sites: {} };
	}
}

function getLatestDatetimeForSite(existingData, hostname) {
	const siteData = existingData.sites[hostname];
	if (!siteData?.timeseries?.length) return null;

	// Find the most recent datetime in the timeseries
	const datetimes = siteData.timeseries.map((d) => d.datetime).sort();
	return datetimes[datetimes.length - 1];
}

function formatDate(date) {
	return date.toISOString().split('T')[0];
}

// --- Schema validators ----------------------------------------------------
// Lightweight runtime checks for the GraphQL responses we care about. If
// Cloudflare changes the shape we fail loud instead of writing junk to disk.

class SchemaError extends Error {}

function expectObject(val, path) {
	if (val === null || typeof val !== 'object' || Array.isArray(val)) {
		throw new SchemaError(`${path}: expected object, got ${val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val}`);
	}
}

function expectArray(val, path) {
	if (!Array.isArray(val)) {
		throw new SchemaError(`${path}: expected array, got ${typeof val}`);
	}
}

function expectNumber(val, path) {
	if (typeof val !== 'number' || !Number.isFinite(val)) {
		throw new SchemaError(`${path}: expected finite number, got ${typeof val}`);
	}
}

function expectString(val, path) {
	if (typeof val !== 'string') {
		throw new SchemaError(`${path}: expected string, got ${typeof val}`);
	}
}

function validateGraphqlEnvelope(json) {
	expectObject(json, 'response');
	if (json.errors) {
		throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
	}
	expectObject(json.data, 'response.data');
	expectObject(json.data.viewer, 'data.viewer');
	expectArray(json.data.viewer.accounts, 'data.viewer.accounts');
}

function validateTimeseriesResponse(data) {
	validateGraphqlEnvelope({ data });
	const account = data.viewer.accounts[0];
	if (!account) return;
	expectArray(account.timeseries, 'account.timeseries');
	for (const [i, row] of account.timeseries.entries()) {
		expectNumber(row.count, `timeseries[${i}].count`);
		expectObject(row.dimensions, `timeseries[${i}].dimensions`);
		expectString(row.dimensions.datetimeHour, `timeseries[${i}].dimensions.datetimeHour`);
	}
}

function validateAggregateResponse(data) {
	validateGraphqlEnvelope({ data });
	const account = data.viewer.accounts[0];
	if (!account) return;
	for (const group of ['topPages', 'topReferrers', 'topCountries', 'topBrowsers']) {
		expectArray(account[group], `account.${group}`);
		for (const [i, row] of account[group].entries()) {
			expectNumber(row.count, `${group}[${i}].count`);
			expectObject(row.dimensions, `${group}[${i}].dimensions`);
		}
	}
}

function validateDailyAggregateResponse(data) {
	validateGraphqlEnvelope({ data });
	const account = data.viewer.accounts[0];
	if (!account) return;
	for (const group of ['dailyPages', 'dailyReferrers', 'dailyCountries', 'dailyBrowsers']) {
		expectArray(account[group], `account.${group}`);
		for (const [i, row] of account[group].entries()) {
			expectNumber(row.count, `${group}[${i}].count`);
			expectObject(row.dimensions, `${group}[${i}].dimensions`);
			expectString(row.dimensions.date, `${group}[${i}].dimensions.date`);
		}
	}
}

// --- Network --------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function graphqlRequest(query, variables, { validate, label = 'graphql', maxAttempts = 3 } = {}) {
	let lastError;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await fetch(config.graphqlEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${config.apiToken}`
				},
				body: JSON.stringify({ query, variables })
			});

			if (!response.ok) {
				// 4xx (except 408/429) are not worth retrying
				const transient = response.status >= 500 || response.status === 408 || response.status === 429;
				const err = new Error(`API error: ${response.status} ${response.statusText}`);
				if (!transient) throw err;
				lastError = err;
			} else {
				const json = await response.json();
				if (json.errors) {
					// GraphQL errors are usually deterministic; don't retry
					throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
				}
				if (validate) validate(json.data);
				return json.data;
			}
		} catch (err) {
			lastError = err;
			// Schema errors and explicit non-retriable errors should not loop
			if (err instanceof SchemaError) throw err;
			if (err.message?.startsWith('GraphQL error:')) throw err;
		}
		if (attempt < maxAttempts) {
			const backoff = 1000 * 2 ** (attempt - 1);
			console.warn(`${label}: attempt ${attempt} failed (${lastError?.message}); retrying in ${backoff}ms`);
			await sleep(backoff);
		}
	}
	throw lastError ?? new Error(`${label}: exhausted retries`);
}

// Convert hour to 4-hour bucket end time in UTC (4, 8, 12, 16, 20, 24)
// Label represents the END of the 4-hour period (e.g., "12:00" = data from 08:00-12:00)
function get4HourBucket(datetimeHour) {
	// datetimeHour format: "2026-01-23T14:00:00Z"
	const date = new Date(datetimeHour);

	// Use UTC directly (no timezone conversion)
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	const utcHour = date.getUTCHours();

	// Use end of bucket: ceil to next 4-hour mark (0 -> 4, 1-4 -> 4, 5-8 -> 8, etc.)
	const bucketEndHour = Math.ceil((utcHour + 1) / 4) * 4;

	// Handle day rollover (24 -> next day 00:00, but we label it as 24:00 same day for clarity)
	if (bucketEndHour === 24) {
		return `${year}-${month}-${day}T24:00:00`;
	}

	return `${year}-${month}-${day}T${String(bucketEndHour).padStart(2, '0')}:00:00`;
}

async function fetchTimeseriesForSite(site, startDate, endDate) {
	const variables = {
		accountTag: config.accountId,
		filter: {
			AND: [
				{ datetime_geq: `${startDate}T00:00:00Z`, datetime_leq: `${endDate}T23:59:59Z` },
				{ OR: [{ siteTag: site.siteTag }] }
			]
		}
	};

	const data = await graphqlRequest(TIMESERIES_QUERY, variables, {
		validate: validateTimeseriesResponse,
		label: `timeseries ${site.name}`
	});
	const hourlyData = data.viewer.accounts[0]?.timeseries || [];

	// Aggregate hourly data into 4-hour buckets
	const buckets = new Map();
	for (const d of hourlyData) {
		const bucket = get4HourBucket(d.dimensions.datetimeHour);
		if (!buckets.has(bucket)) {
			buckets.set(bucket, { pageViews: 0, visits: 0 });
		}
		const b = buckets.get(bucket);
		b.pageViews += d.count;
		b.visits += d.sum?.visits || 0;
	}

	// Convert to array and sort
	return Array.from(buckets.entries())
		.map(([datetime, data]) => ({
			datetime,
			pageViews: data.pageViews,
			visits: data.visits
		}))
		.sort((a, b) => a.datetime.localeCompare(b.datetime));
}

// Defines the ranges we fetch top-N aggregates for.
// `start(now)` returns the inclusive lower bound; `end` is always `now`.
const AGGREGATE_RANGES = {
	today: {
		// UTC midnight of the current day
		start: (now) => {
			const d = new Date(now);
			d.setUTCHours(0, 0, 0, 0);
			return d;
		}
	},
	'4h': { start: (now) => new Date(now.getTime() - 4 * 60 * 60 * 1000) },
	'24h': { start: (now) => new Date(now.getTime() - 24 * 60 * 60 * 1000) },
	'7d': { start: (now) => new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
	'30d': { start: (now) => new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
};

async function fetchAggregatesForRange(site, rangeKey, startDate, endDate) {
	const variables = {
		accountTag: config.accountId,
		filter: {
			AND: [
				{
					datetime_geq: startDate.toISOString(),
					datetime_leq: endDate.toISOString()
				},
				{ OR: [{ siteTag: site.siteTag }] }
			]
		}
	};

	const data = await graphqlRequest(AGGREGATE_QUERY, variables, {
		validate: validateAggregateResponse,
		label: `aggregates ${site.name}/${rangeKey}`
	});
	const account = data.viewer.accounts[0];

	return {
		periodStart: startDate.toISOString(),
		periodEnd: endDate.toISOString(),
		topPages: (account?.topPages || [])
			.filter((d) => d.dimensions.requestPath)
			.map((d) => ({
				path: d.dimensions.requestPath,
				pageViews: d.count
			})),
		topReferrers: (account?.topReferrers || [])
			.filter((d) => d.dimensions.refererHost)
			.map((d) => ({
				referrer: d.dimensions.refererHost,
				pageViews: d.count
			})),
		topCountries: (account?.topCountries || [])
			.filter((d) => d.dimensions.countryName)
			.map((d) => ({
				country: d.dimensions.countryName,
				pageViews: d.count
			})),
		topBrowsers: (account?.topBrowsers || [])
			.filter((d) => d.dimensions.userAgentBrowser)
			.map((d) => ({
				browser: d.dimensions.userAgentBrowser,
				pageViews: d.count
			}))
	};
}

// Returns the UTC date string (YYYY-MM-DD) for `daysAgo` days back from now.
function utcDateOffset(daysAgo) {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - daysAgo);
	return d.toISOString().slice(0, 10);
}

// Bucket flat (date, dimension) rows into per-date Top-N maps.
// `rows` is the array Cloudflare returns; `dimKey` is the dimension field
// (e.g. 'refererHost'); `topN` caps the per-day list length.
function bucketDailyRows(rows, dimKey, topN) {
	const perDate = new Map();
	for (const row of rows) {
		const date = row.dimensions.date;
		const value = row.dimensions[dimKey];
		if (!date || !value) continue;
		if (!perDate.has(date)) perDate.set(date, new Map());
		const dayMap = perDate.get(date);
		dayMap.set(value, (dayMap.get(value) || 0) + row.count);
	}
	const result = {};
	for (const [date, dayMap] of perDate.entries()) {
		result[date] = [...dayMap.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, topN)
			.map(([value, count]) => ({ value, count }));
	}
	return result;
}

async function fetchDailyAggregatesForSite(site, startDate, endDate) {
	const variables = {
		accountTag: config.accountId,
		filter: {
			AND: [
				{
					datetime_geq: `${startDate}T00:00:00Z`,
					datetime_leq: `${endDate}T23:59:59Z`
				},
				{ OR: [{ siteTag: site.siteTag }] }
			]
		}
	};
	const data = await graphqlRequest(DAILY_AGGREGATE_QUERY, variables, {
		validate: validateDailyAggregateResponse,
		label: `daily-aggregates ${site.name} (${startDate}..${endDate})`
	});
	const account = data.viewer.accounts[0];
	if (!account) return {};

	const pagesByDate = bucketDailyRows(account.dailyPages, 'requestPath', DAILY_TOP_N.pages);
	const referrersByDate = bucketDailyRows(account.dailyReferrers, 'refererHost', DAILY_TOP_N.referrers);
	const countriesByDate = bucketDailyRows(account.dailyCountries, 'countryName', DAILY_TOP_N.countries);
	const browsersByDate = bucketDailyRows(account.dailyBrowsers, 'userAgentBrowser', DAILY_TOP_N.browsers);

	// Merge all date sets so we emit one entry per day even if a group is empty
	const allDates = new Set([
		...Object.keys(pagesByDate),
		...Object.keys(referrersByDate),
		...Object.keys(countriesByDate),
		...Object.keys(browsersByDate)
	]);

	const out = {};
	for (const date of allDates) {
		out[date] = {
			date,
			topPages: (pagesByDate[date] || []).map((x) => ({ path: x.value, pageViews: x.count })),
			topReferrers: (referrersByDate[date] || []).map((x) => ({ referrer: x.value, pageViews: x.count })),
			topCountries: (countriesByDate[date] || []).map((x) => ({ country: x.value, pageViews: x.count })),
			topBrowsers: (browsersByDate[date] || []).map((x) => ({ browser: x.value, pageViews: x.count }))
		};
	}
	return out;
}

// Decide which date range to request. We never fetch the current UTC day here
// (that's covered by the live aggregates query); only completed days are
// archived to dailyAggregates.
function planDailyFetchRange(existingDailyAggregates) {
	const yesterday = utcDateOffset(1);
	const initial = utcDateOffset(config.maxHistoryDays);
	if (!existingDailyAggregates || existingDailyAggregates.length === 0) {
		return { startDate: initial, endDate: yesterday };
	}
	const sorted = [...existingDailyAggregates].sort((a, b) => a.date.localeCompare(b.date));
	const lastDate = sorted[sorted.length - 1].date;
	if (lastDate >= yesterday) return null;
	const d = new Date(`${lastDate}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return { startDate: d.toISOString().slice(0, 10), endDate: yesterday };
}

async function refreshDailyAggregates(site, existingDailyAggregates) {
	const plan = planDailyFetchRange(existingDailyAggregates);
	if (!plan) return existingDailyAggregates || [];
	console.log(`${site.name}: fetching daily aggregates ${plan.startDate}..${plan.endDate}`);
	const newByDate = await fetchDailyAggregatesForSite(site, plan.startDate, plan.endDate);
	const existingMap = new Map((existingDailyAggregates || []).map((d) => [d.date, d]));
	for (const [date, snapshot] of Object.entries(newByDate)) {
		existingMap.set(date, snapshot);
	}
	return [...existingMap.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchAggregatesForSite(site, existingAggregates = {}) {
	const now = new Date();
	// Fetch all ranges in parallel; failures fall back to existing snapshot.
	const entries = await Promise.all(
		Object.entries(AGGREGATE_RANGES).map(async ([key, range]) => {
			try {
				const snapshot = await fetchAggregatesForRange(site, key, range.start(now), now);
				return [key, snapshot];
			} catch (err) {
				console.warn(`${site.name}/${key}: aggregate fetch failed (${err.message}); keeping previous`);
				return [key, existingAggregates[key] || null];
			}
		})
	);
	const aggregates = Object.fromEntries(entries.filter(([, v]) => v !== null));
	// Backward-compat top-level fields mirror the 30d window when available.
	const last30 = aggregates['30d'] || {};
	return {
		aggregates,
		topPages: last30.topPages || [],
		topReferrers: last30.topReferrers || [],
		topCountries: last30.topCountries || [],
		topBrowsers: last30.topBrowsers || []
	};
}

async function fetchSiteData(site, existingData) {
	if (!site.siteTag) {
		console.warn(`Skipping ${site.name}: no siteTag configured`);
		return null;
	}

	const existingSiteData = existingData.sites[site.hostname] || {
		name: site.name,
		color: site.color,
		timeseries: [],
		aggregates: {},
		dailyAggregates: [],
		topPages: [],
		topReferrers: [],
		topCountries: [],
		topBrowsers: []
	};

	// Determine date range for incremental fetch
	const latestDatetime = getLatestDatetimeForSite(existingData, site.hostname);
	const endDate = new Date();
	let startDate;

	if (latestDatetime) {
		// With end-time labeling, latestDatetime IS the end of the last bucket
		// So we fetch from that point onwards (no need to add 4 hours)
		startDate = new Date(latestDatetime);
	} else {
		// Initial fetch: get max history
		startDate = new Date();
		startDate.setDate(startDate.getDate() - config.maxHistoryDays);
	}

	// Daily-aggregate refresh runs alongside the other fetches and is resilient:
	// failures keep the existing snapshots instead of dropping them.
	const dailyAggregatesPromise = refreshDailyAggregates(site, existingSiteData.dailyAggregates).catch((err) => {
		console.warn(`${site.name}: daily aggregates refresh failed (${err.message}); keeping previous`);
		return existingSiteData.dailyAggregates || [];
	});

	// Skip timeseries fetch if we're already up to date (within 4 hours);
	// aggregates are always refreshed so today's snapshot stays current.
	const hoursDiff = (endDate - startDate) / (1000 * 60 * 60);
	if (hoursDiff < 4) {
		console.log(`${site.name}: timeseries up to date, refreshing aggregates`);
		const [aggregates, dailyAggregates] = await Promise.all([
			fetchAggregatesForSite(site, existingSiteData.aggregates),
			dailyAggregatesPromise
		]);
		return {
			name: site.name,
			color: site.color,
			timeseries: existingSiteData.timeseries || [],
			dailyAggregates,
			...aggregates
		};
	}

	console.log(`${site.name}: fetching ${formatDate(startDate)} to ${formatDate(endDate)}`);

	const [newTimeseries, aggregates, dailyAggregates] = await Promise.all([
		fetchTimeseriesForSite(site, formatDate(startDate), formatDate(endDate)),
		fetchAggregatesForSite(site, existingSiteData.aggregates),
		dailyAggregatesPromise
	]);

	const existingDatetimes = new Set(existingSiteData.timeseries.map((d) => d.datetime));
	const mergedTimeseries = [
		...existingSiteData.timeseries,
		...newTimeseries.filter((d) => !existingDatetimes.has(d.datetime))
	].sort((a, b) => a.datetime.localeCompare(b.datetime));

	return {
		name: site.name,
		color: site.color,
		timeseries: mergedTimeseries,
		dailyAggregates,
		...aggregates
	};
}

async function main() {
	// Check if API credentials are configured
	if (!config.accountId || !config.apiToken) {
		console.warn('Cloudflare API credentials not configured (CF_ACCOUNT_ID, CF_API_TOKEN)');
		console.warn('Skipping analytics fetch');
		return;
	}

	const existingData = loadExistingData();
	const newData = {
		lastFetched: new Date().toISOString(),
		sites: {}
	};

	let hasChanges = false;

	// Bounded parallelism: 5 sites at a time × 5 ranges in-flight per site ≈ 25
	// concurrent requests in the worst case. Well below Cloudflare's rate limit.
	const SITE_CONCURRENCY = 5;
	const queue = [...sites];
	async function worker() {
		while (queue.length > 0) {
			const site = queue.shift();
			if (!site) break;
			try {
				const siteData = await fetchSiteData(site, existingData);
				if (siteData) {
					newData.sites[site.hostname] = siteData;
					const existingCount = existingData.sites[site.hostname]?.timeseries?.length || 0;
					if (siteData.timeseries.length > existingCount) {
						hasChanges = true;
					}
				}
			} catch (error) {
				console.error(`Error fetching ${site.name}:`, error.message);
				if (existingData.sites[site.hostname]) {
					newData.sites[site.hostname] = existingData.sites[site.hostname];
				}
			}
		}
	}
	await Promise.all(Array.from({ length: SITE_CONCURRENCY }, () => worker()));

	// Calculate totals
	let totalPageViews = 0;
	let totalVisits = 0;
	for (const site of Object.values(newData.sites)) {
		const last30Days = site.timeseries.slice(-30);
		totalPageViews += last30Days.reduce((sum, d) => sum + d.pageViews, 0);
		totalVisits += last30Days.reduce((sum, d) => sum + d.visits, 0);
	}

	console.log(`\nSummary:`);
	console.log(`- Sites: ${Object.keys(newData.sites).length}`);
	console.log(`- Total page views (30d): ${totalPageViews}`);
	console.log(`- Total visits (30d): ${totalVisits}`);
	console.log(`- Has new data: ${hasChanges}`);

	writeFileSync(ANALYTICS_PATH, JSON.stringify(newData, null, '\t'));
	console.log(`\nAnalytics written to ${ANALYTICS_PATH}`);
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
