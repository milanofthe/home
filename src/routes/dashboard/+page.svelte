<svelte:head>
	<title>Analytics</title>
	<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Icons from '$lib/components/Icons.svelte';
	import PlotlyChart from '$lib/components/PlotlyChart.svelte';

	interface SiteData {
		name: string;
		color: string;
		timeseries: Array<{ datetime: string; pageViews: number; visits: number }>;
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

	let loading = $state(true);
	let error = $state<string | null>(null);
	let analytics = $state<AnalyticsData>({ lastFetched: null, sites: {} });

	async function fetchData() {
		loading = true;
		error = null;
		try {
			const response = await fetch(DATA_URL, { cache: 'no-store' });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			analytics = await response.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchData();
	});


	// Selected site state (null = all sites)
	let selectedSite = $state<string | null>(null);

	// Bin size toggle
	type BinSize = '4h' | '1d' | '1w';
	let binSize = $state<BinSize>('4h');

	// List of available sites (reactive)
	let siteList = $derived(Object.keys(analytics.sites));
	let hasSites = $derived(siteList.length > 0);

	// Get current site data
	function getCurrentSiteData(): SiteData | null {
		if (selectedSite && analytics.sites[selectedSite]) {
			return analytics.sites[selectedSite];
		}
		return null;
	}

	// Calculate all-time summary stats
	function getSummary() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			return {
				pageViews: site.timeseries.reduce((sum, d) => sum + d.pageViews, 0),
				visits: site.timeseries.reduce((sum, d) => sum + d.visits, 0)
			};
		}
		let pageViews = 0;
		let visits = 0;
		for (const site of Object.values(analytics.sites)) {
			pageViews += site.timeseries.reduce((sum, d) => sum + d.pageViews, 0);
			visits += site.timeseries.reduce((sum, d) => sum + d.visits, 0);
		}
		return { pageViews, visits };
	}

	// Bar width in ms per bin size
	const barWidths: Record<BinSize, number> = {
		'4h': 3.5 * 60 * 60 * 1000,
		'1d': 22 * 60 * 60 * 1000,
		'1w': 5 * 24 * 60 * 60 * 1000
	};

	let barWidthMs = $derived(barWidths[binSize]);

	// For 4h bins, shift back 2h to center on the period
	// For 1d/1w, the datetime is already set to midpoint during aggregation
	function centerDatetime(datetime: string): string {
		if (binSize === '4h') {
			const date = new Date(datetime);
			date.setHours(date.getHours() - 2);
			return date.toISOString().slice(0, 19);
		}
		return datetime;
	}

	// Get Monday of the week for a given date (using UTC)
	function getMonday(date: Date): Date {
		const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
		const day = d.getUTCDay();
		const diff = day === 0 ? -6 : 1 - day;
		d.setUTCDate(d.getUTCDate() + diff);
		return d;
	}

	// Get bin key for a datetime
	function getBinKey(datetime: string): string {
		const date = new Date(datetime);
		if (binSize === '4h') return datetime;
		if (binSize === '1d') return date.toISOString().slice(0, 10);
		// 1w: Monday of that week
		return getMonday(date).toISOString().slice(0, 10);
	}

	// Aggregate timeseries into bins
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
				// Place bar at midpoint: noon for daily, Thursday noon for weekly
				let dt: string;
				if (binSize === '1d') {
					dt = key + 'T12:00:00';
				} else {
					// Mid-week: Monday + 3 days = Thursday
					const monday = new Date(key + 'T12:00:00Z');
					monday.setUTCDate(monday.getUTCDate() + 3);
					dt = monday.toISOString().slice(0, 19);
				}
				bins.set(key, { datetime: dt, pageViews: d.pageViews, visits: d.visits });
			}
		}
		return [...bins.values()];
	}

	// Build time series chart data for page views
	function getPageViewsData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			const color = site.color;
			const agg = aggregateTimeseries(site.timeseries);
			return [
				{
					x: agg.map((d) => centerDatetime(d.datetime)),
					y: agg.map((d) => d.pageViews),
					type: 'bar',
					name: 'Page Views',
					marker: { color, line: { width: 0 } },
					width: barWidthMs
				}
			];
		}
		// Stacked view for all sites
		const traces: any[] = [];
		const siteEntries = Object.entries(analytics.sites);
		siteEntries.forEach(([hostname, site]) => {
			const color = site.color;
			const agg = aggregateTimeseries(site.timeseries);
			traces.push({
				x: agg.map((d) => centerDatetime(d.datetime)),
				y: agg.map((d) => d.pageViews),
				type: 'bar',
				name: hostname,
				marker: { color, line: { width: 0 } },
				width: barWidthMs
			});
		});
		return traces;
	}

	// Build time series chart data for visits
	function getVisitorsData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			const color = site.color;
			const agg = aggregateTimeseries(site.timeseries);
			return [
				{
					x: agg.map((d) => centerDatetime(d.datetime)),
					y: agg.map((d) => d.visits),
					type: 'bar',
					name: 'Visits',
					marker: { color, line: { width: 0 } },
					width: barWidthMs
				}
			];
		}
		// Stacked view for all sites
		const traces: any[] = [];
		const siteEntries = Object.entries(analytics.sites);
		siteEntries.forEach(([hostname, site]) => {
			const color = site.color;
			const agg = aggregateTimeseries(site.timeseries);
			traces.push({
				x: agg.map((d) => centerDatetime(d.datetime)),
				y: agg.map((d) => d.visits),
				type: 'bar',
				name: hostname,
				marker: { color, line: { width: 0 } },
				width: barWidthMs
			});
		});
		return traces;
	}

	// Build referrers bar chart
	function getReferrersData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			if (!site.topReferrers?.length) return [];
			return [{
				x: site.topReferrers.map((d) => d.pageViews),
				y: site.topReferrers.map((d) => d.referrer),
				type: 'bar',
				orientation: 'h',
				marker: { color: site.color, line: { width: 0 } }
			}];
		}
		const map = new Map<string, number>();
		for (const site of Object.values(analytics.sites)) {
			for (const r of site.topReferrers || []) {
				map.set(r.referrer, (map.get(r.referrer) || 0) + r.pageViews);
			}
		}
		const combined = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
		if (!combined.length) return [];
		return [{
			x: combined.map((d) => d[1]),
			y: combined.map((d) => d[0]),
			type: 'bar',
			orientation: 'h',
			marker: { color: '#64748b', line: { width: 0 } }
		}];
	}

	// Build countries bar chart
	function getCountriesData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			if (!site.topCountries?.length) return [];
			return [{
				x: site.topCountries.map((d) => d.pageViews),
				y: site.topCountries.map((d) => d.country),
				type: 'bar',
				orientation: 'h',
				marker: { color: site.color, line: { width: 0 } }
			}];
		}
		const map = new Map<string, number>();
		for (const site of Object.values(analytics.sites)) {
			for (const c of site.topCountries || []) {
				map.set(c.country, (map.get(c.country) || 0) + c.pageViews);
			}
		}
		const combined = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
		if (!combined.length) return [];
		return [{
			x: combined.map((d) => d[1]),
			y: combined.map((d) => d[0]),
			type: 'bar',
			orientation: 'h',
			marker: { color: '#64748b', line: { width: 0 } }
		}];
	}

	// Build pages bar chart
	function getPagesData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			if (!site.topPages?.length) return [];
			return [{
				x: site.topPages.map((d) => d.pageViews),
				y: site.topPages.map((d) => d.path),
				type: 'bar',
				orientation: 'h',
				marker: { color: site.color, line: { width: 0 } }
			}];
		}
		const map = new Map<string, number>();
		for (const site of Object.values(analytics.sites)) {
			for (const p of site.topPages || []) {
				map.set(p.path, (map.get(p.path) || 0) + p.pageViews);
			}
		}
		const combined = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
		if (!combined.length) return [];
		return [{
			x: combined.map((d) => d[1]),
			y: combined.map((d) => d[0]),
			type: 'bar',
			orientation: 'h',
			marker: { color: '#64748b', line: { width: 0 } }
		}];
	}

	// Build browsers bar chart
	function getBrowsersData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			if (!site.topBrowsers?.length) return [];
			return [{
				x: site.topBrowsers.map((d) => d.pageViews),
				y: site.topBrowsers.map((d) => d.browser),
				type: 'bar',
				orientation: 'h',
				marker: { color: site.color, line: { width: 0 } }
			}];
		}
		const map = new Map<string, number>();
		for (const site of Object.values(analytics.sites)) {
			for (const b of site.topBrowsers || []) {
				map.set(b.browser, (map.get(b.browser) || 0) + b.pageViews);
			}
		}
		const combined = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
		if (!combined.length) return [];
		return [{
			x: combined.map((d) => d[1]),
			y: combined.map((d) => d[0]),
			type: 'bar',
			orientation: 'h',
			marker: { color: '#64748b', line: { width: 0 } }
		}];
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toLocaleString();
	}

	function formatDate(isoString: string | null): string {
		if (!isoString) return 'Never';
		return new Date(isoString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Reactive values
	let summary = $derived(getSummary());
	let pageViewsData = $derived(getPageViewsData());
	let visitorsData = $derived(getVisitorsData());
	let referrersData = $derived(getReferrersData());
	let countriesData = $derived(getCountriesData());
	let pagesData = $derived(getPagesData());
	let browsersData = $derived(getBrowsersData());
	let currentSite: SiteData | null = $derived(getCurrentSiteData());

	// Layout for unified hover and stacked bars in all view
	const allSitesLayout = {
		hovermode: 'x unified' as const,
		barmode: 'stack' as const
	};
</script>

<Navigation />

<main class="bg-charcoal min-h-screen pt-20 pb-12">
	<div class="max-w-5xl mx-auto px-4">
		<!-- Header -->
		<div class="flex items-baseline justify-between mb-8">
			<h1 class="font-display text-2xl font-semibold text-cream/90">Analytics</h1>
			{#if hasSites}
				<span class="text-xs text-cream/40">Updated {formatDate(analytics.lastFetched)}</span>
			{/if}
		</div>

		{#if loading}
			<!-- Loading State -->
			<div class="text-center py-16">
				<div class="w-6 h-6 border-2 border-cream/20 border-t-cream/60 rounded-full animate-spin mx-auto mb-3"></div>
				<p class="text-cream/40 text-sm">Loading analytics...</p>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="text-center py-16">
				<Icons name="chart" class="w-8 h-8 text-red-400/60 mx-auto mb-3" />
				<p class="text-cream/60 text-sm mb-4">Failed to load analytics</p>
				<p class="text-cream/30 text-xs mb-4">{error}</p>
				<button
					onclick={() => fetchData()}
					class="px-4 py-2 text-sm bg-cream/10 hover:bg-cream/15 text-cream/70 rounded transition-colors"
				>
					Retry
				</button>
			</div>
		{:else if hasSites}
			<!-- Site Selector + Bin Size Toggle -->
			<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
				<div class="flex flex-wrap gap-1.5">
					<button
						class="px-3 py-1.5 rounded text-sm transition-colors {selectedSite === null
							? 'bg-cream/10 text-cream'
							: 'text-cream/50 hover:text-cream/70'}"
						onclick={() => (selectedSite = null)}
					>
						All
					</button>
					{#each siteList as site}
						<button
							class="px-3 py-1.5 rounded text-sm transition-colors {selectedSite === site
								? 'bg-cream/10 text-cream'
								: 'text-cream/50 hover:text-cream/70'}"
							onclick={() => (selectedSite = site)}
						>
							{site}
						</button>
					{/each}
				</div>
				<div class="flex gap-1">
					{#each (['4h', '1d', '1w'] as const) as bin}
						<button
							class="px-2.5 py-1 rounded text-xs font-mono transition-colors {binSize === bin
								? 'bg-cream/10 text-cream'
								: 'text-cream/40 hover:text-cream/60'}"
							onclick={() => (binSize = bin)}
						>
							{bin}
						</button>
					{/each}
				</div>
			</div>

			<!-- Summary -->
			<div class="flex gap-8 mb-8 text-sm">
				<div>
					<span class="text-cream/90 font-medium text-lg">{formatNumber(summary.pageViews)}</span>
					<span class="text-cream/40 ml-1.5">views</span>
				</div>
				<div>
					<span class="text-cream/90 font-medium text-lg">{formatNumber(summary.visits)}</span>
					<span class="text-cream/40 ml-1.5">visits</span>
				</div>
				<div>
					<span class="text-cream/90 font-medium text-lg">{#if currentSite && currentSite.timeseries.length > 0}{@const firstDate = currentSite.timeseries[0].datetime.split('T')[0]}{@const lastDate = currentSite.timeseries[currentSite.timeseries.length - 1].datetime.split('T')[0]}{Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}{:else}{@const allTimeseries = siteList.flatMap((s) => analytics.sites[s].timeseries)}{@const dates = allTimeseries.map((d) => d.datetime.split('T')[0])}{@const uniqueDates = [...new Set(dates)].sort()}{uniqueDates.length}{/if}</span>
					<span class="text-cream/40 ml-1.5">days</span>
				</div>
			</div>

			<!-- Time Series Charts -->
			<div class="flex flex-col gap-4 mb-6">
				<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
					<h2 class="text-sm text-cream/50 mb-3">Page Views</h2>
					{#key `${selectedSite}-${binSize}`}
						<PlotlyChart
							data={pageViewsData}
							layout={{
								height: 180,
								margin: { t: 5, r: 5, b: 45, l: 35 },
								...(selectedSite ? {} : allSitesLayout)
							}}
							class="w-full"
						/>
					{/key}
				</div>
				<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
					<h2 class="text-sm text-cream/50 mb-3">Visits</h2>
					{#key `${selectedSite}-${binSize}`}
						<PlotlyChart
							data={visitorsData}
							layout={{
								height: 180,
								margin: { t: 5, r: 5, b: 45, l: 35 },
								...(selectedSite ? {} : allSitesLayout)
							}}
							class="w-full"
						/>
					{/key}
				</div>
			</div>

			<!-- Site Overview Cards (All view) -->
			{#if !selectedSite}
				<div class="grid md:grid-cols-3 gap-4 mb-4">
					{#each siteList as site}
						{@const siteData = analytics.sites[site]}
						{@const sitePageViews = siteData.timeseries.reduce((sum, d) => sum + d.pageViews, 0)}
						{@const siteVisits = siteData.timeseries.reduce((sum, d) => sum + d.visits, 0)}
						<button
							class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5 text-left transition-all hover:bg-cream/[0.04] hover:border-cream/10"
							onclick={() => (selectedSite = site)}
						>
							<div class="flex items-center gap-2 mb-3">
								<div class="w-2 h-2 rounded-full" style="background-color: {siteData.color}"></div>
								<span class="text-sm text-cream/70">{site}</span>
							</div>
							<div class="flex gap-4 text-sm">
								<div>
									<span class="text-cream/80">{formatNumber(sitePageViews)}</span>
									<span class="text-cream/30 ml-1">views</span>
								</div>
								<div>
									<span class="text-cream/80">{formatNumber(siteVisits)}</span>
									<span class="text-cream/30 ml-1">visits</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Aggregate Panels -->
			<div class="grid md:grid-cols-2 gap-4">
				<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
					<h2 class="text-sm text-cream/50 mb-3">Referrers</h2>
					{#if referrersData.length > 0}
						{#key selectedSite}
							<PlotlyChart
								data={referrersData}
								layout={{ height: 180, margin: { t: 0, r: 10, b: 20 }, yaxis: { automargin: true } }}
							/>
						{/key}
					{:else}
						<p class="text-cream/30 text-sm">No data</p>
					{/if}
				</div>

				<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
					<h2 class="text-sm text-cream/50 mb-3">Countries</h2>
					{#if countriesData.length > 0}
						{#key selectedSite}
							<PlotlyChart
								data={countriesData}
								layout={{ height: 180, margin: { t: 0, r: 10, b: 20 }, yaxis: { automargin: true } }}
							/>
						{/key}
					{:else}
						<p class="text-cream/30 text-sm">No data</p>
					{/if}
				</div>

				<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
					<h2 class="text-sm text-cream/50 mb-3">Pages</h2>
					{#if pagesData.length > 0}
						{#key selectedSite}
							<PlotlyChart
								data={pagesData}
								layout={{ height: 180, margin: { t: 0, r: 10, b: 20 }, yaxis: { automargin: true } }}
							/>
						{/key}
					{:else}
						<p class="text-cream/30 text-sm">No data</p>
					{/if}
				</div>

				<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
					<h2 class="text-sm text-cream/50 mb-3">Browsers</h2>
					{#if browsersData.length > 0}
						{#key selectedSite}
							<PlotlyChart
								data={browsersData}
								layout={{ height: 180, margin: { t: 0, r: 10, b: 20 }, yaxis: { automargin: true } }}
							/>
						{/key}
					{:else}
						<p class="text-cream/30 text-sm">No data</p>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Empty State -->
			<div class="text-center py-16">
				<Icons name="chart" class="w-8 h-8 text-cream/20 mx-auto mb-3" />
				<p class="text-cream/40 text-sm">No analytics data yet</p>
			</div>
		{/if}

		<!-- Footer -->
		<p class="text-xs text-cream/20 mt-12 text-center">Cloudflare Web Analytics</p>
	</div>
</main>
