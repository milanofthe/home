<script lang="ts">
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult } from '$lib/layout/articleLayout';
	import { notes } from '$lib/content';
	import { BOOKING_URL, CONTACT_EMAIL } from '$lib/config';

	let filter = $state<string | null>(null);

	const tags = [...new Set(notes.map(n => n.project).filter(Boolean))];

	onMount(() => {
		const readHash = () => {
			const h = window.location.hash.replace('#', '');
			filter = tags.includes(h) ? h : null;
		};
		readHash();
		window.addEventListener('hashchange', readHash);
		return () => window.removeEventListener('hashchange', readHash);
	});

	let build = $derived((cols: number): ArticleResult => {
		const g = new ArticleGrid(cols, 'neutral', 6);
		g.title('NOTES', 'Engineering notes on numerics, solvers, and scientific UI.');
		g.spacer();

		// tag filter row
		const buttons = [
			{ text: filter === null ? '[ all* ]' : '[ all ]', href: '#' },
			...tags.map(t => ({ text: filter === t ? `[ ${t}* ]` : `[ ${t} ]`, href: `#${t}` }))
		];
		g.cta(buttons);
		g.spacer();

		const list = filter ? notes.filter(n => n.project === filter) : notes;
		for (const n of list) {
			g.metaLine(`${n.date}  /  ${n.project}  /  ${n.readingMinutes} min read`);
			g.paragraph([{ text: n.title, href: `/notes/${n.slug}/`, accent: n.accent }]);
			g.paragraph(n.description);
			g.spacer();
		}

		if (list.length === 0) {
			g.paragraph('Nothing here yet.');
		}

		g.spacer(2);
		g.contactSection({ bookingUrl: BOOKING_URL, email: CONTACT_EMAIL });
		return g.finish();
	});
</script>

<Seo
	title="Notes — Milan Rother"
	description="Engineering notes on numerics, simulation, solvers, and scientific UI/UX from the simulation stack for electronics."
	path="/notes/"
/>

<Navigation />
<ArticlePage {build}>
	{#snippet semantic()}
		<h1>Notes</h1>
		<p>Engineering notes on numerics, solvers, and scientific UI.</p>
		<ul>
			{#each notes as n}
				<li>
					<a href={`/notes/${n.slug}/`}>{n.title}</a> ({n.date}): {n.description}
				</li>
			{/each}
		</ul>
	{/snippet}
</ArticlePage>
