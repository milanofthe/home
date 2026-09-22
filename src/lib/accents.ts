// Project accents: the list of them, and nothing else.
//
// A project's colour used to be spelled out in nine places: three rules in
// app.css, two type unions and two lookup tables in the grid layout, the same
// again in the content regions, the class map in CharacterGrid, a hard-coded
// chain of `:not()` selectors in its typewriter, the tile component's union
// and glow palette, and two maps under content/. Adding one meant nine edits,
// and the ones that got missed did not fail: they fell back to the default
// grey, with the colour sitting unused in the stylesheet.
//
// So there are two places now. The name is here, the colour is one
// `.accent-<name>` rule in app.css that sets `--accent-colour`, and everything
// that paints in a project's colour reads that variable. Everything else,
// every union and every table, is derived from the list below.
//
// scripts/check-accents.js asserts that the two agree.

/** Every accent, in no particular order, with `neutral` for what has none. */
export const ACCENT_KEYS = [
	'pathsim',
	'pysimhub',
	'rapidpassives',
	'scidata',
	'fastsim',
	'sane',
	'rslab',
	'thesisos',
	'whatsmytraffic',
	'falllow',
	'sanity',
	'neutral'
] as const;

export type AccentKey = (typeof ACCENT_KEYS)[number];

/** The ones that are a project, so `neutral` is not offered as one. */
export const PROJECT_ACCENTS = ACCENT_KEYS.filter((a) => a !== 'neutral');

const KNOWN = new Set<string>(ACCENT_KEYS);

/** Read an accent out of content, falling back to the neutral grey. */
export function accentKey(value: string | undefined): AccentKey {
	return value && KNOWN.has(value) ? (value as AccentKey) : 'neutral';
}

/**
 * The class that carries a colour.
 *
 * One class rather than a colour in the markup: the value stays in app.css
 * next to the rest of the palette, and what travels through the components is
 * the name of the project.
 */
export function accentClass(accent: AccentKey | undefined): string {
	return accent && accent !== 'neutral' ? `accent-${accent}` : '';
}
