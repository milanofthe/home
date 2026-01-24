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

// GraphQL query for aggregate data (top pages, referrers, etc.)
const AGGREGATE_QUERY = `
query GetAggregates($accountTag: String!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      topPages: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 10, orderBy: [count_DESC]) {
        count
        dimensions { requestPath }
      }
      topReferrers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 10, orderBy: [count_DESC]) {
        count
        dimensions { refererHost }
      }
      topCountries: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 10, orderBy: [count_DESC]) {
        count
        dimensions { countryName }
      }
      topBrowsers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 5, orderBy: [count_DESC]) {
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

async function graphqlRequest(query, variables) {
	const response = await fetch(config.graphqlEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${config.apiToken}`
		},
		body: JSON.stringify({ query, variables })
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	const json = await response.json();

	if (json.errors) {
		throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
	}

	return json.data;
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

	const data = await graphqlRequest(TIMESERIES_QUERY, variables);
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

async function fetchAggregatesForSite(site) {
	// Fetch last 30 days for aggregates
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - 30);

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

	const data = await graphqlRequest(AGGREGATE_QUERY, variables);
	const account = data.viewer.accounts[0];

	return {
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

async function fetchSiteData(site, existingData) {
	if (!site.siteTag) {
		console.warn(`Skipping ${site.name}: no siteTag configured`);
		return null;
	}

	const existingSiteData = existingData.sites[site.hostname] || {
		name: site.name,
		color: site.color,
		timeseries: [],
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

	// Skip if we're already up to date (within 4 hours)
	const hoursDiff = (endDate - startDate) / (1000 * 60 * 60);
	if (hoursDiff < 4) {
		console.log(`${site.name}: already up to date`);
		// Still fetch aggregates to get fresh top pages, referrers, etc.
		const aggregates = await fetchAggregatesForSite(site);
		return {
			...existingSiteData,
			...aggregates
		};
	}

	console.log(`${site.name}: fetching ${formatDate(startDate)} to ${formatDate(endDate)}`);

	// Fetch new timeseries data
	const newTimeseries = await fetchTimeseriesForSite(site, formatDate(startDate), formatDate(endDate));

	// Merge with existing timeseries (avoid duplicates)
	const existingDatetimes = new Set(existingSiteData.timeseries.map((d) => d.datetime));
	const mergedTimeseries = [
		...existingSiteData.timeseries,
		...newTimeseries.filter((d) => !existingDatetimes.has(d.datetime))
	].sort((a, b) => a.datetime.localeCompare(b.datetime));

	// Fetch fresh aggregates
	const aggregates = await fetchAggregatesForSite(site);

	return {
		name: site.name,
		color: site.color,
		timeseries: mergedTimeseries,
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

	for (const site of sites) {
		try {
			const siteData = await fetchSiteData(site, existingData);
			if (siteData) {
				newData.sites[site.hostname] = siteData;

				// Check if timeseries has new data
				const existingCount = existingData.sites[site.hostname]?.timeseries?.length || 0;
				if (siteData.timeseries.length > existingCount) {
					hasChanges = true;
				}
			}
		} catch (error) {
			console.error(`Error fetching ${site.name}:`, error.message);
			// Keep existing data for this site on error
			if (existingData.sites[site.hostname]) {
				newData.sites[site.hostname] = existingData.sites[site.hostname];
			}
		}
	}

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
