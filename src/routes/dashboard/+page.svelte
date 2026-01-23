<svelte:head>
	<title>Analytics Dashboard | Milan Rother</title>
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
		timeseries: Array<{ date: string; pageViews: number; visits: number }>;
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
		// Aggregate all sites
		let pageViews = 0;
		let visits = 0;
		for (const site of Object.values(analytics.sites)) {
			const last30 = site.timeseries.slice(-30);
			pageViews += last30.reduce((sum, d) => sum + d.pageViews, 0);
			visits += last30.reduce((sum, d) => sum + d.visits, 0);
		}
		return { pageViews, visits };
	}

	// Build time series chart data
	function getTimeseriesData() {
		if (selectedSite && analytics.sites[selectedSite]) {
			const site = analytics.sites[selectedSite];
			return [
				{
					x: site.timeseries.map((d) => d.date),
					y: site.timeseries.map((d) => d.pageViews),
					type: 'scatter',
					mode: 'lines',
					name: 'Page Views',
					line: { color: site.color, width: 2 },
					fill: 'tozeroy',
					fillcolor: site.color + '20'
				}
			];
		}
		// Aggregate all sites into stacked area
		const traces = [];
		for (const [hostname, site] of Object.entries(analytics.sites)) {
			traces.push({
				x: site.timeseries.map((d) => d.date),
				y: site.timeseries.map((d) => d.pageViews),
				type: 'scatter',
				mode: 'lines',
				name: hostname,
				line: { color: site.color, width: 2 },
				stackgroup: 'one'
			});
		}
		return traces;
	}

	// Build referrers bar chart
	function getReferrersData() {
		const site = getCurrentSiteData();
		if (!site?.topReferrers?.length) return [];
		return [
			{
				x: site.topReferrers.map((d) => d.pageViews),
				y: site.topReferrers.map((d) => d.referrer),
				type: 'bar',
				orientation: 'h',
				marker: { color: site.color }
			}
		];
	}

	// Build countries bar chart
	function getCountriesData() {
		const site = getCurrentSiteData();
		if (!site?.topCountries?.length) return [];
		return [
			{
				x: site.topCountries.map((d) => d.pageViews),
				y: site.topCountries.map((d) => d.country),
				type: 'bar',
				orientation: 'h',
				marker: { color: site.color }
			}
		];
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}

	function formatDate(isoString: string | null): string {
		if (!isoString) return 'Never';
		return new Date(isoString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Reactive values
	let summary = $derived(getSummary());
	let timeseriesData = $derived(getTimeseriesData());
	let referrersData = $derived(getReferrersData());
	let countriesData = $derived(getCountriesData());
	let currentSite: SiteData | null = $derived(getCurrentSiteData());
</script>

<Navigation />

<main class="bg-charcoal min-h-screen pt-24 pb-16">
	<div class="max-w-6xl mx-auto px-6">
		<!-- Header -->
		<div class="mb-12">
			<h1 class="font-display text-3xl sm:text-4xl font-bold text-teal uppercase mb-4">
				Analytics
			</h1>
			<p class="text-cream/60">
				{#if hasSites}
					Last updated: {formatDate(analytics.lastFetched)}
				{:else}
					No analytics data available yet.
				{/if}
			</p>
		</div>

		{#if hasSites}
			<!-- Site Selector -->
			<div class="flex flex-wrap gap-2 mb-8">
				<button
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
						{selectedSite === null
						? 'bg-teal text-charcoal'
						: 'bg-charcoal-light text-cream/70 hover:text-cream border border-cream/10'}"
					onclick={() => (selectedSite = null)}
				>
					All Sites
				</button>
				{#each siteList as site}
					{@const siteData = analytics.sites[site]}
					<button
						class="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
						style={selectedSite === site
							? `background-color: ${siteData.color}; color: #0f0f0f; border-color: ${siteData.color};`
							: `border-color: rgba(240, 239, 233, 0.1); color: rgba(240, 239, 233, 0.7);`}
						onclick={() => (selectedSite = site)}
					>
						{site}
					</button>
				{/each}
			</div>

			<!-- Summary Cards -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
				<div class="card p-6 text-center">
					<div class="text-3xl font-display font-bold text-teal mb-1">
						{formatNumber(summary.pageViews)}
					</div>
					<div class="text-sm text-cream/50">Page Views (30d)</div>
				</div>
				<div class="card p-6 text-center">
					<div class="text-3xl font-display font-bold text-teal mb-1">
						{formatNumber(summary.visits)}
					</div>
					<div class="text-sm text-cream/50">Visits (30d)</div>
				</div>
				<div class="card p-6 text-center">
					<div class="text-3xl font-display font-bold text-cream mb-1">
						{siteList.length}
					</div>
					<div class="text-sm text-cream/50">Sites Tracked</div>
				</div>
				<div class="card p-6 text-center">
					<div class="text-3xl font-display font-bold text-cream mb-1">
						{#if currentSite}
							{currentSite.timeseries.length}
						{:else}
							{Math.max(...siteList.map((s) => analytics.sites[s].timeseries.length))}
						{/if}
					</div>
					<div class="text-sm text-cream/50">Days of Data</div>
				</div>
			</div>

			<!-- Time Series Chart -->
			<div class="card p-6 mb-8">
				<h2 class="font-display text-lg font-semibold text-cream mb-4">Page Views Over Time</h2>
				{#key selectedSite}
					<PlotlyChart data={timeseriesData} layout={{ height: 300 }} class="w-full" />
				{/key}
			</div>

			<!-- Detail Section -->
			{#if selectedSite && currentSite}
				<div class="grid md:grid-cols-2 gap-8">
					<!-- Top Referrers -->
					<div class="card p-6">
						<h2 class="font-display text-lg font-semibold text-cream mb-4">Top Referrers</h2>
						{#if referrersData.length > 0}
							{#key selectedSite}
								<PlotlyChart
									data={referrersData}
									layout={{ height: 300, yaxis: { automargin: true }, margin: { l: 120 } }}
								/>
							{/key}
						{:else}
							<p class="text-cream/50 text-sm">No referrer data available</p>
						{/if}
					</div>

					<!-- Top Countries -->
					<div class="card p-6">
						<h2 class="font-display text-lg font-semibold text-cream mb-4">Top Countries</h2>
						{#if countriesData.length > 0}
							{#key selectedSite}
								<PlotlyChart
									data={countriesData}
									layout={{ height: 300, yaxis: { automargin: true }, margin: { l: 120 } }}
								/>
							{/key}
						{:else}
							<p class="text-cream/50 text-sm">No country data available</p>
						{/if}
					</div>

					<!-- Top Pages -->
					<div class="card p-6">
						<h2 class="font-display text-lg font-semibold text-cream mb-4">Top Pages</h2>
						{#if currentSite.topPages?.length > 0}
							<ul class="space-y-3">
								{#each currentSite.topPages.slice(0, 10) as page}
									<li class="flex justify-between items-center text-sm">
										<span class="text-cream/70 truncate pr-4 font-mono text-xs">{page.path}</span>
										<span class="text-teal font-mono">{formatNumber(page.pageViews)}</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-cream/50 text-sm">No page data available</p>
						{/if}
					</div>

					<!-- Top Browsers -->
					<div class="card p-6">
						<h2 class="font-display text-lg font-semibold text-cream mb-4">Browsers</h2>
						{#if currentSite.topBrowsers?.length > 0}
							<ul class="space-y-3">
								{#each currentSite.topBrowsers as browser}
									<li class="flex justify-between items-center text-sm">
										<span class="text-cream/70">{browser.browser}</span>
										<span class="text-teal font-mono">{formatNumber(browser.pageViews)}</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-cream/50 text-sm">No browser data available</p>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Site Overview Cards when "All Sites" selected -->
				<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each siteList as site}
						{@const siteData = analytics.sites[site]}
						{@const last30 = siteData.timeseries.slice(-30)}
						{@const sitePageViews = last30.reduce((sum, d) => sum + d.pageViews, 0)}
						{@const siteVisits = last30.reduce((sum, d) => sum + d.visits, 0)}
						<button
							class="card p-6 text-left transition-all hover:border-cream/30"
							onclick={() => (selectedSite = site)}
						>
							<div class="flex items-center gap-3 mb-4">
								<div class="w-3 h-3 rounded-full" style="background-color: {siteData.color}"></div>
								<h3 class="font-display font-semibold text-cream">{site}</h3>
							</div>
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<div class="text-cream font-semibold">{formatNumber(sitePageViews)}</div>
									<div class="text-cream/50">Page Views</div>
								</div>
								<div>
									<div class="text-cream font-semibold">{formatNumber(siteVisits)}</div>
									<div class="text-cream/50">Visits</div>
								</div>
							</div>
							<div class="mt-4 text-xs text-cream/40">
								{siteData.timeseries.length} days of data
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{:else}
			<!-- Empty State -->
			<div class="card p-12 text-center">
				<div class="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
					<Icons name="chart" class="w-8 h-8 text-teal" />
				</div>
				<h2 class="font-display text-xl font-semibold text-cream mb-2">No Data Yet</h2>
				<p class="text-cream/60 max-w-md mx-auto">
					Analytics data will appear here once the fetch workflow runs. Configure your Cloudflare
					API credentials in GitHub secrets and trigger the workflow.
				</p>
			</div>
		{/if}

		<!-- Footer Note -->
		<p class="text-xs text-cream/30 mt-12 text-center">
			Data from Cloudflare Web Analytics
		</p>
	</div>
</main>
