<script lang="ts">
	import { accentClass, type AccentKey } from '$lib/accents';

	interface Props {
		id: string;
		name: string;
		url: string;
		screenshot: string;
		color: AccentKey;
		themeParam?: boolean;
		// 'cover' (default) fills the tile edge-to-edge; 'contain' scales the
		// image into the tile bounding box on a charcoal backdrop (letterboxed).
		fit?: 'cover' | 'contain';
		// Overrides the 'contain' backdrop (defaults to charcoal #131316) so a
		// transparent render can sit on its own project surface colour.
		background?: string;
	}

	let { id, name, url, screenshot, color, themeParam = true, fit = 'cover', background }: Props = $props();

	let tileElement: HTMLAnchorElement;

	function handleTilt(e: MouseEvent) {
		const rect = tileElement.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width - 0.5;
		const y = (e.clientY - rect.top) / rect.height - 0.5;
		tileElement.style.transform = `perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale(1.03)`;
	}

	function handleTiltReset() {
		tileElement.style.transform = '';
	}

</script>

<a
	bind:this={tileElement}
	href="{url}{themeParam ? '?theme=dark' : ''}"
	target="_blank"
	rel="noopener"
	onmousemove={handleTilt}
	onmouseleave={handleTiltReset}
	class="tile-tilt {accentClass(color)}"
	aria-label="Open {name}"
>
	<img
		src={screenshot}
		alt="{name} preview"
		class="tile-img"
		class:tile-img-contain={fit === 'contain'}
		style={fit === 'contain' && background ? `background: ${background}` : ''}
		loading="lazy"
		decoding="async"
	/>
</a>

<style>
	.tile-tilt {
		display: block;
		width: 100%;
		height: 100%;
		overflow: hidden;
		transition: transform 0.15s ease-out, box-shadow 0.3s;
		will-change: transform;
	}

	/* The glow is the accent at three tenths, mixed from the same variable the
	   rest of the page paints with, so there is no second palette to keep in
	   step with the first. */
	.tile-tilt:hover {
		box-shadow: 0 8px 30px color-mix(in srgb, var(--accent-colour, #969591) 30%, transparent);
	}

	.tile-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
	}

	/* Contain variant: scale the (transparent) image into the tile on a
	   charcoal backdrop. Images already carry their own margins. */
	.tile-img-contain {
		object-fit: contain;
		object-position: center;
		/* Matches the RapidMesh site background (--bg: #131316) so the
		   letterboxed render reads as an extension of the site. */
		background: #131316;
	}
</style>
