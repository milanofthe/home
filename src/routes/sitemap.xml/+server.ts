import { notes, stackPages } from '$lib/content';

export const prerender = true;

const SITE = 'https://milanrother.com';

export function GET() {
	const staticPages: [string, string, string][] = [
		['/', 'weekly', '1.0'],
		['/consulting/', 'monthly', '0.9'],
		['/stack/', 'monthly', '0.9'],
		['/notes/', 'weekly', '0.8'],
		['/about/', 'monthly', '0.5'],
		['/impressum/', 'yearly', '0.3'],
		['/datenschutz/', 'yearly', '0.3']
	];
	const contentPages: [string, string, string][] = [
		...stackPages.map(p => [`/stack/${p.slug}/`, 'monthly', '0.8'] as [string, string, string]),
		...notes.map(n => [`/notes/${n.slug}/`, 'yearly', '0.6'] as [string, string, string])
	];
	const urls = [...staticPages, ...contentPages]
		.map(
			([path, freq, prio]) => `\t<url>
\t\t<loc>${SITE}${path}</loc>
\t\t<changefreq>${freq}</changefreq>
\t\t<priority>${prio}</priority>
\t</url>`
		)
		.join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
