<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult } from '$lib/layout/articleLayout';
	import { getStackPage } from '$lib/content';
	import { blocksToHtml } from '$lib/content/markdown';
	import { renderBlocks } from '$lib/content/render';
	import { BOOKING_URL, CONTACT_EMAIL } from '$lib/config';

	let { data } = $props();

	let page = $derived(getStackPage(data.slug)!);

	// frontmatter link format: "label|url"
	function fmLink(value: string | undefined): { label: string; href: string } | null {
		if (!value) return null;
		const [label, href] = value.split('|');
		return href ? { label: label.trim(), href: href.trim() } : null;
	}

	let build = $derived((cols: number, cellRatio: number): ArticleResult => {
		const g = new ArticleGrid(cols, page.accent, 6, cellRatio);
		const fm = page.doc.frontmatter;

		g.linkLine('[ <- back ]', '/#projects', 'link');
		g.spacer();
		g.title(page.title, page.tagline);
		g.metaLine(`${page.group}  /  ${fm.license ?? ''}`);
		g.spacer();

		renderBlocks(g, page.doc.blocks);

		// external links
		const site = fmLink(fm.site);
		const repo = fmLink(fm.repo);
		if (site) g.linkLine(site.label, site.href);
		if (repo) g.linkLine(repo.label, repo.href);

		// Project CTAs, then the site-wide contact block
		g.spacer();
		const ctas = [fmLink(fm.cta1), fmLink(fm.cta2)].filter(Boolean) as { label: string; href: string }[];
		if (ctas.length > 0) {
			g.cta(ctas.map(c => ({ text: c.label, href: c.href })));
		}
		g.spacer();
		g.contactSection({ bookingUrl: BOOKING_URL, email: CONTACT_EMAIL });
		return g.finish();
	});
</script>

<Seo
	title="{page.title} — Milan Rother"
	description={page.tagline}
	path="/stack/{page.slug}/"
/>

<Navigation />
<ArticlePage {build}>
	{#snippet semantic()}
		<h1>{page.title}</h1>
		<p>{page.tagline}</p>
		<!-- eslint-disable-next-line svelte/no-at-html-tags — own build-time content -->
		{@html blocksToHtml(page.doc.blocks)}
	{/snippet}
</ArticlePage>
