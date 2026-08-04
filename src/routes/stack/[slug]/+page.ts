import { error } from '@sveltejs/kit';
import { stackPages, getStackPage } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => stackPages.map(p => ({ slug: p.slug }));

export const load: PageLoad = ({ params }) => {
	if (!getStackPage(params.slug)) error(404, 'Not found');
	return { slug: params.slug };
};
