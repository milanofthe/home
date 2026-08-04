<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult } from '$lib/layout/articleLayout';
	import { stackPages } from '$lib/content';
	import { BOOKING_URL, CONTACT_EMAIL } from '$lib/config';

	const GROUPS = ['systems', 'circuits', 'fields', 'foundations'];

	const INTRO =
		'One vertically integrated simulation stack for electronics: from electromagnetic fields to circuits to systems. Open source where it builds trust, source-available and commercially licensed where it creates value. Free for academia.';

	function build(cols: number): ArticleResult {
		const g = new ArticleGrid(cols, 'neutral', 6);
		g.title('THE STACK');
		g.paragraph(INTRO);
		g.spacer();

		for (const group of GROUPS) {
			const pages = stackPages.filter(p => p.group === group);
			if (pages.length === 0) continue;
			g.sectionHeading(group);
			for (const p of pages) {
				g.paragraph([{ text: p.title, href: `/stack/${p.slug}/`, accent: p.accent }]);
				g.paragraph(p.tagline);
				g.spacer();
			}
			g.spacer();
		}

		g.sectionHeading('licensing');
		g.paragraph(
			'FastSim, RapidMoM, and SANE are source-available and free for noncommercial use. Commercial licenses with support and integration are available. Evaluation licenses on request.'
		);
		g.cta([
			{ text: '[ Book an intro call -> ]', href: BOOKING_URL },
			{ text: '[ Email ]', href: `mailto:${CONTACT_EMAIL}` }
		]);
		return g.finish();
	}
</script>

<Seo
	title="The Stack — Milan Rother"
	description="One vertically integrated simulation stack for electronics: PathSim, FastSim, PathView, SANE, RapidMoM, RapidFEM, RapidPassives, RSLAB, RapidMesh."
	path="/stack/"
/>

<Navigation />
<ArticlePage {build}>
	{#snippet semantic()}
		<h1>The Stack</h1>
		<p>{INTRO}</p>
		{#each GROUPS as group}
			<h2>{group}</h2>
			<ul>
				{#each stackPages.filter(p => p.group === group) as p}
					<li><a href={`/stack/${p.slug}/`}>{p.title}</a>: {p.tagline}</li>
				{/each}
			</ul>
		{/each}
	{/snippet}
</ArticlePage>
