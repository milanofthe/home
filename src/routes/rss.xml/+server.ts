import { notes } from '$lib/content';

export const prerender = true;

const SITE = 'https://milanrother.com';

export function GET() {
	const esc = (s: string) =>
		s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const items = notes
		.map(
			n => `\t<item>
\t\t<title>${esc(n.title)}</title>
\t\t<link>${SITE}/notes/${n.slug}/</link>
\t\t<guid>${SITE}/notes/${n.slug}/</guid>
\t\t<pubDate>${new Date(n.date + 'T12:00:00Z').toUTCString()}</pubDate>
\t\t<description>${esc(n.description)}</description>
\t</item>`
		)
		.join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
\t<title>Milan Rother — Notes</title>
\t<link>${SITE}/notes/</link>
\t<description>Engineering notes on numerics, solvers, and scientific UI.</description>
${items}
</channel>
</rss>`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
