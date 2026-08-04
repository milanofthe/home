<script lang="ts">
	// Per-page SEO tags. app.html only carries the truly global head content;
	// title, description, canonical, and social cards come from here so every
	// page canonicalizes to itself.
	interface Props {
		title: string;
		description: string;
		path: string; // e.g. "/consulting/"
		ogType?: string;
	}

	let { title, description, path, ogType = 'website' }: Props = $props();

	const SITE = 'https://milanrother.com';
	let url = $derived(SITE + path);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<meta property="og:type" content={ogType} />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content="{SITE}/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:site_name" content="Milan Rother" />
	<meta property="og:locale" content="en_US" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={url} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="{SITE}/og-image.png" />
</svelte:head>
