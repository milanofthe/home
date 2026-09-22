<script lang="ts">
	import { accentClass, type AccentKey } from '$lib/accents';
	interface Props {
		id: string;
		name: string;
		src: string;
		color: AccentKey;
	}

	let { id, name, src, color }: Props = $props();

	let tileElement: HTMLDivElement;

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

<div
	bind:this={tileElement}
	onmousemove={handleTilt}
	onmouseleave={handleTiltReset}
	class="video-tile {accentClass(color)}"
	role="img"
	aria-label="{name} video"
>
	<video
		{src}
		autoplay
		muted
		loop
		playsinline
		disablepictureinpicture
		class="video-tile-video"
	></video>
</div>

<style>
	.video-tile {
		width: 100%;
		height: 100%;
		overflow: hidden;
		transition: transform 0.15s ease-out, box-shadow 0.3s;
		will-change: transform;
	}

	.video-tile:hover {
		box-shadow: 0 8px 30px color-mix(in srgb, var(--accent-colour, #969591) 30%, transparent);
	}

	.video-tile-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
	}
</style>
