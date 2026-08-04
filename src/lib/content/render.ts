// Renders a parsed markdown block list into an ArticleGrid. Floated images
// pair with the paragraph that follows them; sides alternate unless the
// image declares one explicitly.

import { ArticleGrid } from '$lib/layout/articleLayout';
import type { Block } from './markdown';

export function renderBlocks(g: ArticleGrid, blocks: Block[], opts?: { skipTitle?: boolean }) {
	for (let i = 0; i < blocks.length; i++) {
		const b = blocks[i];
		switch (b.kind) {
			case 'title':
				if (!opts?.skipTitle) g.title(b.text);
				break;
			case 'heading':
				g.spacer();
				g.sectionHeading(b.text);
				break;
			case 'subheading':
				g.heading('// ' + b.text);
				break;
			case 'paragraph':
				g.paragraph(b.segments);
				break;
			case 'list':
				for (const item of b.items) g.listItem(item);
				g.spacer();
				break;
			case 'code':
				g.codeBlock(b.code, b.label);
				break;
			case 'image': {
				const next = blocks[i + 1];
				if (b.side !== 'center' && next?.kind === 'paragraph') {
					g.imageWithText(b.side, b.src, b.label, b.w, b.h, next.segments);
					i++; // paragraph consumed by the float
				} else {
					g.image(b.src, b.label, b.w, b.h);
				}
				break;
			}
		}
	}
}
