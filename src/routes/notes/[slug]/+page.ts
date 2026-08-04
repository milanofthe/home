import { error } from '@sveltejs/kit';
import { notes, getNote } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => notes.map(n => ({ slug: n.slug }));

export const load: PageLoad = ({ params }) => {
	if (!getNote(params.slug)) error(404, 'Not found');
	return { slug: params.slug };
};
