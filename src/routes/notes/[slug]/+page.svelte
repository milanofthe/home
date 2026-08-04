<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult } from '$lib/layout/articleLayout';
	import { getNote, getStackPage } from '$lib/content';
	import { blocksToHtml } from '$lib/content/markdown';
	import { renderBlocks } from '$lib/content/render';
	import { BOOKING_URL, CONTACT_EMAIL } from '$lib/config';

	let { data } = $props();

	let note = $derived(getNote(data.slug)!);
	let projectPage = $derived(getStackPage(note.project));

	let build = $derived((cols: number): ArticleResult => {
		const g = new ArticleGrid(cols, note.accent, 6);
		g.linkLine('[ <- notes ]', '/notes/', 'link');
		g.spacer();
		g.title(note.title);
		g.metaLine(`${note.date}  /  ${note.project}  /  ${note.readingMinutes} min read`);
		g.spacer();
		renderBlocks(g, note.doc.blocks);
		g.spacer(2);
		if (projectPage) {
			g.linkLine(`[ more on ${projectPage.title} -> ]`, `/stack/${projectPage.slug}/`);
		}
		g.cta([
			{ text: '[ Book an intro call -> ]', href: BOOKING_URL },
			{ text: '[ Email ]', href: `mailto:${CONTACT_EMAIL}` }
		]);
		return g.finish();
	});
</script>

<svelte:head>
	<title>{note.title} — Milan Rother</title>
	<meta name="description" content={note.description} />
	<meta property="og:title" content={note.title} />
	<meta property="og:description" content={note.description} />
	<meta property="og:type" content="article" />
</svelte:head>

<Navigation />
<ArticlePage {build}>
	{#snippet semantic()}
		<h1>{note.title}</h1>
		<p>{note.date} — {note.description}</p>
		<!-- eslint-disable-next-line svelte/no-at-html-tags — own build-time content -->
		{@html blocksToHtml(note.doc.blocks)}
	{/snippet}
</ArticlePage>
