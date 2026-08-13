<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArticlePage from '$lib/components/ArticlePage.svelte';
	import { ArticleGrid, type ArticleResult, type TextSegment } from '$lib/layout/articleLayout';
	import { BOOKING_URL, CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, X_URL } from '$lib/config';
	import content from '$lib/data/content.json';
	import { accentFor, paragraphText, toSegments, type ProseParagraph } from '$lib/content/prose';
	import { entryText, toTimeline, type TimelineEntryJson } from '$lib/content/timeline';

	// The CV as a timeline, newest first: education, positions and the projects of
	// each era, with the artifacts of the time beside them. Lives in content.json
	// with the rest of the copy.
	const TIMELINE_JSON = content.about.timeline as TimelineEntryJson[];
	const TIMELINE = toTimeline(TIMELINE_JSON);

	// Story and side projects come from content.json — the same copy the landing
	// page renders into the character grid. Here the inline links resolve to the
	// stack detail pages instead of scroll targets.
	const PARAGRAPHS = content.about.paragraphs as ProseParagraph[];
	const STORY: TextSegment[][] = PARAGRAPHS.map(toSegments);

	const SIDE_PROJECTS = content.other.items.map((item) => ({
		name: item.heading,
		href: item.url,
		accent: accentFor(item.id),
		text: item.paragraphs[0]
	}));

	function build(cols: number, cellRatio: number): ArticleResult {
		const g = new ArticleGrid(cols, 'neutral', 6, cellRatio);
		g.title(content.about.heading);
		g.spacer();
		g.image('/images/headshot_milan.webp', 'milan.png', 24, 10);
		g.spacer();
		for (const p of STORY) {
			g.paragraph(p);
		}
		g.spacer();

		g.sectionHeading('timeline');
		g.spacer();
		g.timeline(TIMELINE);
		g.spacer();

		g.sectionHeading('side quests');
		g.paragraph(content.other.intro);
		g.spacer();
		for (const sp of SIDE_PROJECTS) {
			g.paragraph([{ text: sp.name, href: sp.href, accent: sp.accent }]);
			g.paragraph(sp.text);
			g.spacer();
		}

		g.sectionHeading('elsewhere');
		g.cta([
			{ text: '[ GitHub ]', href: GITHUB_URL },
			{ text: '[ LinkedIn ]', href: LINKEDIN_URL },
			{ text: '[ X ]', href: X_URL }
		]);
		g.spacer();
		g.contactSection({ bookingUrl: BOOKING_URL, email: CONTACT_EMAIL });
		return g.finish();
	}
</script>

<Seo
	title="About — Milan Rother"
	description="I build the simulation stack for electronics: fields, circuits, systems. Custom solvers and engineering tools for client teams, built and integrated end to end."
	path="/about/"
/>

<Navigation />
<ArticlePage {build}>
	{#snippet semantic()}
		<h1>About Milan Rother</h1>
		{#each PARAGRAPHS as p}
			<p>{paragraphText(p)}</p>
		{/each}
		<h2>Timeline</h2>
		<ul>
			{#each TIMELINE_JSON as entry}
				<li>
					<strong>{entry.period}: {entry.heading}.</strong>
					{entryText(entry)}
				</li>
			{/each}
		</ul>
		<h2>Side projects</h2>
		<ul>
			{#each SIDE_PROJECTS as sp}
				<li><a href={sp.href}>{sp.name}</a>: {sp.text}</li>
			{/each}
		</ul>
	{/snippet}
</ArticlePage>
