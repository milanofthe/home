<svelte:head>
	<title>Analytics | Milan Rother</title>
	<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
</svelte:head>

<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Icons from '$lib/components/Icons.svelte';
	import PlotlyChart from '$lib/components/PlotlyChart.svelte';
	import analyticsRaw from '$lib/data/analytics.json';

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

	const analytics = analyticsRaw as AnalyticsData;

	// Muted color palette
	const mutedColors: Record<string, string> = {
		'#377eb8': '#5a8fb8', // pathsim blue - softer
		'#6366f1': '#8b8df5', // pysimhub purple - softer
		'#00d9c0': '#4dd9c9'  // teal - softer
	};

	function getMutedColor(color: string): string {
		return mutedColors[color] || color;
	}

	// Selected site state (null = all sites)
	let selectedSite = $state<string | null>(null);

	// List of available sites
	const siteList = Object.keys(analytics.sites);
	const hasSites = siteList.length > 0;

	// Get current site data
	function getCurrentSiteData(): SiteData | null {
		if (selectedSite && analytics.sites[selectedSite]) {
			return analytics.sites[selectedSite];
		}
		return null;
	}

	// Calculate summary stats
	function getSummary() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			const last30 = site.timeseries.slice(-30);
			return {
				pageViews: last30.reduce((sum, d) => sum + d.pageViews, 0),
				visits: last30.reduce((sum, d) => sum + d.visits, 0)
			};
		}
		let pageViews = 0;
		let visits = 0;
		for (const site of Object.values(analytics.sites)) {
			const last30 = site.timeseries.slice(-30);
			pageViews += last30.reduce((sum, d) => sum + d.pageViews, 0);
			visits += last30.reduce((sum, d) => sum + d.visits, 0);
		}
		return { pageViews, visits };
	}

	// 4 hours in milliseconds for bar width (slightly wider to avoid gaps)
	const fourHoursMs = 4.1 * 60 * 60 * 1000;

	// Build time series chart data for page views
	function getPageViewsData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			const color = getMutedColor(site.color);
			return [
				{
					x: site.timeseries.map((d) => d.datetime),
					y: site.timeseries.map((d) => d.pageViews),
					type: 'bar',
					name: 'Page Views',
					marker: { color, line: { width: 0 } },
					width: fourHoursMs
				}
			];
		}
		// Stacked view for all sites
		const traces: any[] = [];
		const siteEntries = Object.entries(analytics.sites);
		siteEntries.forEach(([hostname, site]) => {
			const color = getMutedColor(site.color);
			traces.push({
				x: site.timeseries.map((d) => d.datetime),
				y: site.timeseries.map((d) => d.pageViews),
				type: 'bar',
				name: hostname,
				marker: { color, line: { width: 0 } },
				width: fourHoursMs
			});
		});
		return traces;
	}

	// Build time series chart data for visits
	function getVisitorsData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			const color = getMutedColor(site.color);
			return [
				{
					x: site.timeseries.map((d) => d.datetime),
					y: site.timeseries.map((d) => d.visits),
					type: 'bar',
					name: 'Visits',
					marker: { color, line: { width: 0 } },
					width: fourHoursMs
				}
			];
		}
		// Stacked view for all sites
		const traces: any[] = [];
		const siteEntries = Object.entries(analytics.sites);
		siteEntries.forEach(([hostname, site]) => {
			const color = getMutedColor(site.color);
			traces.push({
				x: site.timeseries.map((d) => d.datetime),
				y: site.timeseries.map((d) => d.visits),
				type: 'bar',
				name: hostname,
				marker: { color, line: { width: 0 } },
				width: fourHoursMs
			});
		});
		return traces;
	}

	// Build referrers bar chart
	function getReferrersData() {
		const site = getCurrentSiteData();
		if (!site?.topReferrers?.length) return [];
		const color = getMutedColor(site.color);
		return [
			{
				x: site.topReferrers.map((d) => d.pageViews),
				y: site.topReferrers.map((d) => d.referrer),
				type: 'bar',
				orientation: 'h',
				marker: { color, line: { width: 0 } }
			}
		];
	}

	// Build countries bar chart
	function getCountriesData() {
		const site = getCurrentSiteData();
		if (!site?.topCountries?.length) return [];
		const color = getMutedColor(site.color);
		return [
			{
				x: site.topCountries.map((d) => d.pageViews),
				y: site.topCountries.map((d) => d.country),
				type: 'bar',
				orientation: 'h',
				marker: { color, line: { width: 0 } }
			}
		];
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

		{#if hasSites}
			<!-- Site Selector -->
			<div class="flex flex-wrap gap-1.5 mb-6">
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
				<div class="text-cream/40">
					{#if currentSite && currentSite.timeseries.length > 0}
						{@const firstDate = currentSite.timeseries[0].datetime.split('T')[0]}
						{@const lastDate = currentSite.timeseries[currentSite.timeseries.length - 1].datetime.split('T')[0]}
						{Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
					{:else}
						{@const allTimeseries = siteList.flatMap((s) => analytics.sites[s].timeseries)}
						{@const dates = allTimeseries.map((d) => d.datetime.split('T')[0])}
						{@const uniqueDates = [...new Set(dates)].sort()}
						{uniqueDates.length}
					{/if}
					days
				</div>
			</div>

			<!-- Time Series Charts -->
			<div class="flex flex-col gap-4 mb-6">
				<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
					<h2 class="text-sm text-cream/50 mb-3">Page Views</h2>
					{#key selectedSite}
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
					{#key selectedSite}
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

			<!-- Detail Section -->
			{#if selectedSite && currentSite}
				<div class="grid md:grid-cols-2 gap-4">
					<!-- Top Referrers -->
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

					<!-- Top Countries -->
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

					<!-- Top Pages -->
					<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
						<h2 class="text-sm text-cream/50 mb-3">Pages</h2>
						{#if currentSite.topPages?.length > 0}
							<ul class="space-y-2">
								{#each currentSite.topPages.slice(0, 8) as page}
									<li class="flex justify-between items-center text-sm">
										<span class="text-cream/60 truncate pr-4 font-mono text-xs">{page.path}</span>
										<span class="text-cream/40 font-mono text-xs">{formatNumber(page.pageViews)}</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-cream/30 text-sm">No data</p>
						{/if}
					</div>

					<!-- Top Browsers -->
					<div class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5">
						<h2 class="text-sm text-cream/50 mb-3">Browsers</h2>
						{#if currentSite.topBrowsers?.length > 0}
							<ul class="space-y-2">
								{#each currentSite.topBrowsers as browser}
									<li class="flex justify-between items-center text-sm">
										<span class="text-cream/60">{browser.browser}</span>
										<span class="text-cream/40 font-mono text-xs">{formatNumber(browser.pageViews)}</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-cream/30 text-sm">No data</p>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Site Overview Cards -->
				<div class="grid md:grid-cols-3 gap-4">
					{#each siteList as site}
						{@const siteData = analytics.sites[site]}
						{@const last30 = siteData.timeseries.slice(-30)}
						{@const sitePageViews = last30.reduce((sum, d) => sum + d.pageViews, 0)}
						{@const siteVisits = last30.reduce((sum, d) => sum + d.visits, 0)}
						<button
							class="p-3 rounded-lg bg-cream/[0.02] border border-cream/5 text-left transition-all hover:bg-cream/[0.04] hover:border-cream/10"
							onclick={() => (selectedSite = site)}
						>
							<div class="flex items-center gap-2 mb-3">
								<div class="w-2 h-2 rounded-full opacity-60" style="background-color: {siteData.color}"></div>
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
