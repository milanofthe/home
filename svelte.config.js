import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: ''
		},
		prerender: {
			// The character grid renders client-side, so its scroll anchors
			// (e.g. #contact at the bottom of every page) don't exist in the
			// prerendered HTML. They do exist at runtime.
			handleMissingId: ({ id, message }) => {
				if (id === 'contact') return;
				throw new Error(message);
			}
		}
	}
};

export default config;
