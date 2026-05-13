<svelte:head>
	<title>Analytics</title>
	<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Icons from '$lib/components/Icons.svelte';
	import PlotlyChart from '$lib/components/PlotlyChart.svelte';
	import { iso2ToIso3, iso2ToName } from '$lib/data/iso-country-codes';

	// --- Types ---

	type AggregateRange = 'today' | '4h' | '24h' | '7d' | '30d';

	interface AggregateSnapshot {
		periodStart?: string;
		periodEnd?: string;
		topPages: Array<{ path: string; pageViews: number }>;
		topReferrers: Array<{ referrer: string; pageViews: number }>;
		topCountries: Array<{ country: string; pageViews: number }>;
		topBrowsers: Array<{ browser: string; pageViews: number }>;
	}

	interface DailyAggregate extends AggregateSnapshot {
		date: string;
	}

	interface SiteData {
		name: string;
		color: string;
		timeseries: Array<{ datetime: string; pageViews: number; visits: number }>;
		aggregates?: Partial<Record<AggregateRange, AggregateSnapshot>>;
		dailyAggregates?: DailyAggregate[];
		// Legacy top-level aggregates (== 30d), kept for backward compat
		topPages: Array<{ path: string; pageViews: number }>;
		topReferrers: Array<{ referrer: string; pageViews: number }>;
		topCountries: Array<{ country: string; pageViews: number }>;
		topBrowsers: Array<{ browser: string; pageViews: number }>;
	}

	interface AnalyticsData {
		lastFetched: string | null;
		sites: Record<string, SiteData>;
	}

	const DATA_URL = 'https://raw.githubusercontent.com/milanofthe/milanofthe.github.io/main/src/lib/data/analytics.json';
	const TEAL = '#00d9c0';
	const TEAL_DIM = 'rgba(0, 217, 192, 0.15)';

	// --- State ---

	let loading = $state(true);
	let error = $state<string | null>(null);
	let analytics = $state<AnalyticsData>({ lastFetched: null, sites: {} });

	type BinSize = '4h' | '1d' | '1w';
	let selectedSite = $state<string | null>(null);
	let binSize = $state<BinSize>('1d');
	let aggregateRange = $state<AggregateRange>('30d');

	// '4h' is fetched but hidden in the UI: Cloudflare RUM data is too sparse
	// at that resolution for small sites to be useful.
	const RANGE_ORDER: AggregateRange[] = ['today', '24h', '7d', '30d'];
	const RANGE_LABELS: Record<AggregateRange, string> = {
		today: 'today',
		'4h': '4h',
		'24h': '24h',
		'7d': '7d',
		'30d': '30d'
	};

	let siteList = $derived(Object.keys(analytics.sites));
	let hasSites = $derived(siteList.length > 0);

	// --- Data fetching ---

	async function fetchData() {
		loading = true;
		error = null;
		try {
			const res = await fetch(DATA_URL, { cache: 'no-store' });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			analytics = await res.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	onMount(() => { fetchData(); });

	// --- Helpers ---

	function formatNumber(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toLocaleString();
	}

	function formatDate(isoString: string | null): string {
		if (!isoString) return 'never';
		return new Date(isoString).toLocaleDateString('en-US', {
			month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
		});
	}

	// --- Time series aggregation ---

	const barWidths: Record<BinSize, number> = {
		'4h': 3.5 * 60 * 60 * 1000,
		'1d': 22 * 60 * 60 * 1000,
		'1w': 5 * 24 * 60 * 60 * 1000
	};

	let barWidthMs = $derived(barWidths[binSize]);

	function centerDatetime(datetime: string): string {
		if (binSize === '4h') {
			const date = new Date(datetime);
			date.setHours(date.getHours() - 2);
			return date.toISOString().slice(0, 19);
		}
		return datetime;
	}

	function getMonday(date: Date): Date {
		const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
		const day = d.getUTCDay();
		const diff = day === 0 ? -6 : 1 - day;
		d.setUTCDate(d.getUTCDate() + diff);
		return d;
	}

	function getBinKey(datetime: string): string {
		const date = new Date(datetime);
		if (binSize === '4h') return datetime;
		if (binSize === '1d') return date.toISOString().slice(0, 10);
		return getMonday(date).toISOString().slice(0, 10);
	}

	function aggregateTimeseries(timeseries: Array<{ datetime: string; pageViews: number; visits: number }>) {
		if (binSize === '4h') return timeseries;
		const bins = new Map<string, { datetime: string; pageViews: number; visits: number }>();
		for (const d of timeseries) {
			const key = getBinKey(d.datetime);
			const existing = bins.get(key);
			if (existing) {
				existing.pageViews += d.pageViews;
				existing.visits += d.visits;
			} else {
				let dt: string;
				if (binSize === '1d') {
					dt = key + 'T12:00:00';
				} else {
					const monday = new Date(key + 'T12:00:00Z');
					monday.setUTCDate(monday.getUTCDate() + 3);
					dt = monday.toISOString().slice(0, 19);
				}
				bins.set(key, { datetime: dt, pageViews: d.pageViews, visits: d.visits });
			}
		}
		return [...bins.values()];
	}

	// --- Site colors: use teal for single site, site colors for stacked ---

	function siteColor(site: SiteData): string {
		return site.color || TEAL;
	}

	// --- Chart data builders ---

	function getTimeseriesData(field: 'pageViews' | 'visits') {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			const agg = aggregateTimeseries(site.timeseries);
			return [{
				x: agg.map(d => centerDatetime(d.datetime)),
				y: agg.map(d => d[field]),
				type: 'bar',
				name: field === 'pageViews' ? 'Page Views' : 'Visits',
				marker: { color: siteColor(site), line: { width: 0 } },
				width: barWidthMs
			}];
		}
		return Object.entries(analytics.sites).map(([hostname, site]) => {
			const agg = aggregateTimeseries(site.timeseries);
			return {
				x: agg.map(d => centerDatetime(d.datetime)),
				y: agg.map(d => d[field]),
				type: 'bar',
				name: hostname,
				marker: { color: siteColor(site), line: { width: 0 } },
				width: barWidthMs
			};
		});
	}

	// --- Aggregate snapshot resolution -----------------------------------
	// Read site.aggregates[aggregateRange] if available, otherwise fall back
	// to legacy top-level fields (which mirror the 30d window).

	const EMPTY_SNAPSHOT: AggregateSnapshot = {
		topPages: [],
		topReferrers: [],
		topCountries: [],
		topBrowsers: []
	};

	// Number of completed days to sum for each range. `today` is handled live.
	const RANGE_DAY_COUNT: Record<Exclude<AggregateRange, 'today' | '4h'>, number> = {
		'24h': 1,
		'7d': 7,
		'30d': 30
	};

	// Sum the last N daily snapshots into one combined snapshot, returning Top-N
	// per dimension after summation. Returns null if there's no data.
	function sumDailySnapshots(daily: DailyAggregate[], days: number): AggregateSnapshot | null {
		if (!daily?.length) return null;
		const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
		const window = sorted.slice(-days);
		if (!window.length) return null;

		const merge = <K extends string>(field: keyof AggregateSnapshot, key: K) => {
			const totals = new Map<string, number>();
			for (const day of window) {
				const items = (day[field] as Array<Record<string, any>>) || [];
				for (const item of items) {
					const k = item[key];
					if (!k) continue;
					totals.set(k, (totals.get(k) || 0) + (item.pageViews || 0));
				}
			}
			return [...totals.entries()].sort((a, b) => b[1] - a[1]);
		};

		const pages = merge('topPages', 'path').map(([path, pageViews]) => ({ path, pageViews }));
		const referrers = merge('topReferrers', 'referrer').map(([referrer, pageViews]) => ({ referrer, pageViews }));
		const countries = merge('topCountries', 'country').map(([country, pageViews]) => ({ country, pageViews }));
		const browsers = merge('topBrowsers', 'browser').map(([browser, pageViews]) => ({ browser, pageViews }));

		return {
			periodStart: window[0].date + 'T00:00:00Z',
			periodEnd: window[window.length - 1].date + 'T23:59:59Z',
			topPages: pages,
			topReferrers: referrers,
			topCountries: countries,
			topBrowsers: browsers
		};
	}

	function snapshotFor(site: SiteData, range: AggregateRange): AggregateSnapshot {
		// `today` is intentionally live — comes from the short-window aggregate query.
		if (range === 'today') {
			return site.aggregates?.today || EMPTY_SNAPSHOT;
		}
		// 24h/7d/30d: prefer summed daily history (verlustarm, extends past CF's 30d window).
		if (range in RANGE_DAY_COUNT && site.dailyAggregates?.length) {
			const summed = sumDailySnapshots(site.dailyAggregates, RANGE_DAY_COUNT[range as keyof typeof RANGE_DAY_COUNT]);
			if (summed) return summed;
		}
		// Fallback to whatever live aggregates were captured.
		const snap = site.aggregates?.[range];
		if (snap) return snap;
		if (range === '30d') {
			return {
				topPages: site.topPages || [],
				topReferrers: site.topReferrers || [],
				topCountries: site.topCountries || [],
				topBrowsers: site.topBrowsers || []
			};
		}
		return EMPTY_SNAPSHOT;
	}

	function getAggregateData(
		getter: (snap: AggregateSnapshot) => Array<{ label: string; value: number }>,
		topN = 10
	) {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			const items = getter(snapshotFor(site, aggregateRange)).slice(0, topN);
			if (!items.length) return [];
			return [{
				x: items.map(d => d.value),
				y: items.map(d => d.label),
				type: 'bar',
				orientation: 'h',
				marker: { color: siteColor(site), line: { width: 0 } }
			}];
		}
		const map = new Map<string, number>();
		for (const site of Object.values(analytics.sites)) {
			for (const item of getter(snapshotFor(site, aggregateRange))) {
				map.set(item.label, (map.get(item.label) || 0) + item.value);
			}
		}
		const combined = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
		if (!combined.length) return [];
		return [{
			x: combined.map(d => d[1]),
			y: combined.map(d => d[0]),
			type: 'bar',
			orientation: 'h',
			marker: { color: TEAL, line: { width: 0 } }
		}];
	}

	// Parse a hex color (#rgb or #rrggbb) into an [r,g,b] tuple. Falls back to
	// the teal accent for malformed input.
	function hexToRgb(hex: string): [number, number, number] {
		const clean = hex.replace('#', '');
		const full = clean.length === 3
			? clean.split('').map((c) => c + c).join('')
			: clean;
		if (full.length !== 6) return [0, 217, 192];
		const n = parseInt(full, 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}

	function colorscaleFromHex(hex: string) {
		const [r, g, b] = hexToRgb(hex);
		return [
			[0, `rgba(${r}, ${g}, ${b}, 0.08)`],
			[0.5, `rgba(${r}, ${g}, ${b}, 0.5)`],
			[1, hex]
		];
	}

	function getCountryMapData() {
		const totals = new Map<string, number>();
		const addItems = (items: Array<{ country: string; pageViews: number }>) => {
			for (const c of items) {
				totals.set(c.country, (totals.get(c.country) || 0) + c.pageViews);
			}
		};
		let mapColor = TEAL;
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			mapColor = siteColor(site);
			addItems(snapshotFor(site, aggregateRange).topCountries);
		} else {
			for (const site of Object.values(analytics.sites)) {
				addItems(snapshotFor(site, aggregateRange).topCountries);
			}
		}
		const entries = [...totals.entries()];
		if (!entries.length) return [];
		const locations: string[] = [];
		const values: number[] = [];
		const labels: string[] = [];
		for (const [code, count] of entries) {
			const iso3 = iso2ToIso3(code);
			if (!iso3) continue;
			locations.push(iso3);
			values.push(count);
			labels.push(`${iso2ToName(code)} (${code})`);
		}
		if (!locations.length) return [];
		return [{
			type: 'choropleth',
			locationmode: 'ISO-3',
			locations,
			z: values,
			text: labels,
			hovertemplate: '<b>%{text}</b><br>%{z} views<extra></extra>',
			colorscale: colorscaleFromHex(mapColor),
			showscale: false,
			marker: { line: { color: 'rgba(240, 239, 233, 0.08)', width: 0.5 } }
		}];
	}

	// --- Reactive chart data ---


	// Build pages/visit ratio time series
	function getPagesPerVisitData() {
		function computeRatio(timeseries: Array<{ datetime: string; pageViews: number; visits: number }>) {
			const agg = aggregateTimeseries(timeseries);
			return agg.map(d => ({
				datetime: centerDatetime(d.datetime),
				ratio: d.visits > 0 ? Math.round((d.pageViews / d.visits) * 100) / 100 : 0
			}));
		}

		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			const ratios = computeRatio(site.timeseries);
			return [{
				x: ratios.map(d => d.datetime),
				y: ratios.map(d => d.ratio),
				type: 'bar',
				name: 'Pages/Visit',
				marker: { color: siteColor(analytics.sites[selectedSite]), line: { width: 0 } },
				width: barWidthMs
			}];
		}
		// All sites combined
		const allBins = new Map<string, { pageViews: number; visits: number }>();
		for (const site of Object.values(analytics.sites)) {
			const agg = aggregateTimeseries(site.timeseries);
			for (const d of agg) {
				const key = centerDatetime(d.datetime);
				const existing = allBins.get(key);
				if (existing) {
					existing.pageViews += d.pageViews;
					existing.visits += d.visits;
				} else {
					allBins.set(key, { pageViews: d.pageViews, visits: d.visits });
				}
			}
		}
		const sorted = [...allBins.entries()].sort((a, b) => a[0].localeCompare(b[0]));
		return [{
			x: sorted.map(d => d[0]),
			y: sorted.map(d => d[1].visits > 0 ? Math.round((d[1].pageViews / d[1].visits) * 100) / 100 : 0),
			type: 'bar',
			name: 'Pages/Visit',
			marker: { color: TEAL, line: { width: 0 } },
			width: barWidthMs
		}];
	}
	let pageViewsData = $derived(getTimeseriesData('pageViews'));
	let visitsData = $derived(getTimeseriesData('visits'));
	let pagesPerVisitData = $derived(getPagesPerVisitData());

	let referrersData = $derived(getAggregateData(
		snap => (snap.topReferrers || []).map(r => ({ label: r.referrer, value: r.pageViews })),
		15
	));
	let countriesData = $derived(getAggregateData(
		snap => (snap.topCountries || []).map(c => ({ label: iso2ToName(c.country), value: c.pageViews })),
		15
	));
	let pagesData = $derived(getAggregateData(
		snap => (snap.topPages || []).map(p => ({ label: p.path, value: p.pageViews })),
		15
	));
	let browsersData = $derived(getAggregateData(
		snap => (snap.topBrowsers || []).map(b => ({ label: b.browser, value: b.pageViews })),
		10
	));
	let countryMapData = $derived(getCountryMapData());

	// Resolved period bounds for the currently selected aggregate range
	// (pulled from the resolved snapshot so they reflect what was actually used,
	// whether that's a live aggregate or a daily-history summation).
	let aggregateRangeInfo = $derived(() => {
		for (const site of Object.values(analytics.sites)) {
			const snap = snapshotFor(site, aggregateRange);
			if (snap.periodStart && snap.periodEnd) {
				return { start: snap.periodStart, end: snap.periodEnd };
			}
		}
		return null;
	});

	function formatRangeLabel(info: { start: string; end: string } | null): string {
		if (!info) return RANGE_LABELS[aggregateRange];
		const start = new Date(info.start);
		const end = new Date(info.end);
		const fmt = (d: Date) => d.toLocaleString('en-US', {
			month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
		});
		return `${fmt(start)} → ${fmt(end)} UTC`;
	}

	let summary = $derived(() => {
		let pageViews = 0, visits = 0;
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			pageViews = site.timeseries.reduce((sum, d) => sum + d.pageViews, 0);
			visits = site.timeseries.reduce((sum, d) => sum + d.visits, 0);
		} else {
			for (const site of Object.values(analytics.sites)) {
				pageViews += site.timeseries.reduce((sum, d) => sum + d.pageViews, 0);
				visits += site.timeseries.reduce((sum, d) => sum + d.visits, 0);
			}
		}
		return { pageViews, visits };
	});

	let dayCount = $derived(() => {
		if (selectedSite && analytics.sites[selectedSite]) {
			const ts = analytics.sites[selectedSite].timeseries;
			if (ts.length === 0) return 0;
			const first = ts[0].datetime.split('T')[0];
			const last = ts[ts.length - 1].datetime.split('T')[0];
			return Math.ceil((new Date(last).getTime() - new Date(first).getTime()) / (1000 * 60 * 60 * 24)) + 1;
		}
		const allDates = new Set<string>();
		for (const site of Object.values(analytics.sites)) {
			for (const d of site.timeseries) allDates.add(d.datetime.split('T')[0]);
		}
		return allDates.size;
	});

	const allSitesLayout = {
		hovermode: 'x unified' as const,
		barmode: 'stack' as const
	};

	const hBarLayout = {
		height: 200,
		margin: { t: 0, r: 10, b: 20, l: 0 },
		yaxis: { automargin: true }
	};
</script>

<Navigation />

<main class="min-h-screen pt-20 pb-12" style="background: #0f0f0f;">
	<div class="max-w-5xl mx-auto px-4 font-mono">

		

		{#if loading}
			<div class="text-center py-20">
				<div class="w-5 h-5 border border-current border-t-transparent rounded-full animate-spin mx-auto mb-3"
					style="color: {TEAL};"></div>
				<p class="text-xs" style="color: rgba(240, 239, 233, 0.3);">loading...</p>
			</div>

		{:else if error}
			<div class="text-center py-20">
				<span class="block mx-auto mb-3 w-6 h-6" style="color: rgba(240, 239, 233, 0.2);"><Icons name="chart" class="w-6 h-6" /></span>
				<p class="text-sm mb-2" style="color: rgba(240, 239, 233, 0.5);">failed to load</p>
				<p class="text-xs mb-4" style="color: rgba(240, 239, 233, 0.25);">{error}</p>
				<button
					onclick={() => fetchData()}
					class="px-3 py-1.5 text-xs border rounded transition-colors"
					style="color: {TEAL}; border-color: rgba(0, 217, 192, 0.3);"
					onmouseenter={(e) => e.currentTarget.style.borderColor = TEAL}
					onmouseleave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 217, 192, 0.3)'}
				>
					[ retry ]
				</button>
			</div>

		{:else if hasSites}

			<!-- Site selector -->
			<div class="flex flex-wrap gap-1 mb-4">
				<button
					class="px-2.5 py-1 text-xs border rounded transition-colors"
					style="color: {selectedSite === null ? TEAL : 'rgba(240, 239, 233, 0.35)'};
						border-color: {selectedSite === null ? 'rgba(0, 217, 192, 0.3)' : 'rgba(240, 239, 233, 0.07)'};"
					onclick={() => (selectedSite = null)}
				>
					all
				</button>
				{#each siteList as site}
					<button
						class="px-2.5 py-1 text-xs border rounded transition-colors"
						style="color: {selectedSite === site ? TEAL : 'rgba(240, 239, 233, 0.35)'};
							border-color: {selectedSite === site ? 'rgba(0, 217, 192, 0.3)' : 'rgba(240, 239, 233, 0.07)'};"
						onclick={() => (selectedSite = site)}
					>
						{site}
					</button>
				{/each}
			</div>

			<div class="section-divider" role="separator" aria-hidden="true"></div>

			<!-- Section: time series -->
			<div class="flex flex-wrap items-baseline justify-between gap-3 mb-3 mt-2">
				<div class="flex items-baseline gap-3">
					<h2 class="text-xs uppercase tracking-wider" style="color: {TEAL};">timeseries</h2>
					<span class="text-xs" style="color: rgba(240, 239, 233, 0.3);">
						{dayCount()} days · bin size {binSize}
					</span>
				</div>
				<div class="flex gap-1">
					{#each (['4h', '1d', '1w'] as const) as bin}
						<button
							class="px-2 py-1 text-xs border rounded transition-colors"
							style="color: {binSize === bin ? TEAL : 'rgba(240, 239, 233, 0.35)'};
								border-color: {binSize === bin ? 'rgba(0, 217, 192, 0.3)' : 'rgba(240, 239, 233, 0.07)'};"
							onclick={() => (binSize = bin)}
						>
							{bin}
						</button>
					{/each}
				</div>
			</div>

			<!-- Summary metrics (full period of timeseries) -->
			<div class="flex gap-10 mb-8">
				<div>
					<span class="text-lg" style="color: {TEAL};">{formatNumber(summary().pageViews)}</span>
					<span class="text-xs ml-1.5" style="color: rgba(240, 239, 233, 0.3);">views</span>
				</div>
				<div>
					<span class="text-lg" style="color: {TEAL};">{formatNumber(summary().visits)}</span>
					<span class="text-xs ml-1.5" style="color: rgba(240, 239, 233, 0.3);">visits</span>
				</div>
				<div>
					<span class="text-lg" style="color: {TEAL};">{summary().visits > 0 ? (summary().pageViews / summary().visits).toFixed(1) : '0'}</span>
					<span class="text-xs ml-1.5" style="color: rgba(240, 239, 233, 0.3);">pages/visit</span>
				</div>
			</div>

			<!-- Time series charts -->
			<div class="flex flex-col gap-6 mb-12">
				<div>
					<h2 class="chart-label">page_views</h2>
					<PlotlyChart
						data={pageViewsData}
						layout={{
							height: 200,
							margin: { t: 5, r: 5, b: 45, l: 40 },
							...(selectedSite ? {} : allSitesLayout)
						}}
						class="w-full"
					/>
				</div>
				<div>
					<h2 class="chart-label">visits</h2>
					<PlotlyChart
						data={visitsData}
						layout={{
							height: 200,
							margin: { t: 5, r: 5, b: 45, l: 40 },
							...(selectedSite ? {} : allSitesLayout)
						}}
						class="w-full"
					/>
				</div>
				<div>
					<h2 class="chart-label">pages_per_visit</h2>
					<PlotlyChart
						data={pagesPerVisitData}
						layout={{
							height: 200,
							margin: { t: 5, r: 5, b: 45, l: 40 }
						}}
						class="w-full"
					/>
				</div>
			</div>

			<div class="section-divider" role="separator" aria-hidden="true"></div>

			<!-- Section: aggregates (telemetry) -->
			<div class="flex flex-wrap items-baseline justify-between gap-3 mb-3 mt-2">
				<div class="flex items-baseline gap-3">
					<h2 class="text-xs uppercase tracking-wider" style="color: {TEAL};">telemetry</h2>
					<span class="text-xs" style="color: rgba(240, 239, 233, 0.3);">
						{formatRangeLabel(aggregateRangeInfo())}
					</span>
				</div>
				<div class="flex gap-1">
					{#each RANGE_ORDER as range}
						<button
							class="px-2 py-1 text-xs border rounded transition-colors"
							style="color: {aggregateRange === range ? TEAL : 'rgba(240, 239, 233, 0.35)'};
								border-color: {aggregateRange === range ? 'rgba(0, 217, 192, 0.3)' : 'rgba(240, 239, 233, 0.07)'};"
							onclick={() => (aggregateRange = range)}
						>
							{RANGE_LABELS[range]}
						</button>
					{/each}
				</div>
			</div>

			<!-- Country map -->
			<div class="mb-6">
				<h3 class="chart-label">countries — map</h3>
				{#if countryMapData.length > 0}
					<div class="full-bleed">
						<PlotlyChart
							data={countryMapData}
							layout={{
								height: 460,
								margin: { t: 0, r: 0, b: 0, l: 0 },
								geo: {
									showframe: false,
									showcoastlines: false,
									showcountries: true,
									countrycolor: 'rgba(240, 239, 233, 0.08)',
									showland: true,
									landcolor: 'rgba(240, 239, 233, 0.03)',
									showocean: false,
									bgcolor: 'transparent',
									projection: { type: 'natural earth' }
								}
							}}
							class="w-full"
						/>
					</div>
				{:else}
					<p class="text-xs py-8 text-center" style="color: rgba(240, 239, 233, 0.2);">no data</p>
				{/if}
			</div>

			<!-- Aggregate bar panels -->
			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<h3 class="chart-label">referrers</h3>
					{#if referrersData.length > 0}
						<PlotlyChart data={referrersData} layout={hBarLayout} />
					{:else}
						<p class="text-xs py-8 text-center" style="color: rgba(240, 239, 233, 0.2);">no data</p>
					{/if}
				</div>
				<div>
					<h3 class="chart-label">countries</h3>
					{#if countriesData.length > 0}
						<PlotlyChart data={countriesData} layout={hBarLayout} />
					{:else}
						<p class="text-xs py-8 text-center" style="color: rgba(240, 239, 233, 0.2);">no data</p>
					{/if}
				</div>
				<div>
					<h3 class="chart-label">pages</h3>
					{#if pagesData.length > 0}
						<PlotlyChart data={pagesData} layout={hBarLayout} />
					{:else}
						<p class="text-xs py-8 text-center" style="color: rgba(240, 239, 233, 0.2);">no data</p>
					{/if}
				</div>
				<div>
					<h3 class="chart-label">browsers</h3>
					{#if browsersData.length > 0}
						<PlotlyChart data={browsersData} layout={hBarLayout} />
					{:else}
						<p class="text-xs py-8 text-center" style="color: rgba(240, 239, 233, 0.2);">no data</p>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<p class="text-xs mt-12 text-center" style="color: rgba(240, 239, 233, 0.15);">
				cloudflare web analytics{#if analytics.lastFetched} &middot; updated {formatDate(analytics.lastFetched)}{/if}
			</p>

		{:else}
			<div class="text-center py-20">
				<span class="block mx-auto mb-3 w-6 h-6" style="color: rgba(240, 239, 233, 0.15);"><Icons name="chart" class="w-6 h-6" /></span>
				<p class="text-xs" style="color: rgba(240, 239, 233, 0.3);">no data</p>
			</div>
		{/if}
	</div>
</main>

<style>
	

	.chart-label {
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		color: #00d9c0;
		margin-bottom: 0.5rem;
	}

	.section-divider {
		height: 6px;
		background: rgba(240, 239, 233, 0.18);
		margin-top: 2.5rem;
		margin-bottom: 1.5rem;
		/* Break out of the centered content column to span the full viewport. */
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		width: 100vw;
	}

	.full-bleed {
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		width: 100vw;
	}
</style>
