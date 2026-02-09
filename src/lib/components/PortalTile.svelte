<script lang="ts">
	interface Props {
		id: string;
		name: string;
		url: string;
		screenshot: string;
		color: 'pathsim' | 'pysimhub';
	}

	let { id, name, url, screenshot, color }: Props = $props();

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

	const glowColors = {
		pathsim: 'rgba(0, 112, 192, 0.3)',
		pysimhub: 'rgba(99, 102, 241, 0.3)'
	};
</script>

<a
	bind:this={tileElement}
	href="{url}?theme=dark"
	target="_blank"
	rel="noopener"
	onmousemove={handleTilt}
	onmouseleave={handleTiltReset}
	class="tile-tilt"
	style="--glow-color: {glowColors[color]};"
	aria-label="Open {name}"
>
	<img
		src={screenshot}
		alt="{name} preview"
		class="tile-img"
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

	.tile-tilt:hover {
		box-shadow: 0 8px 30px var(--glow-color, rgba(0, 217, 192, 0.2));
	}

	.tile-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
	}
</style>
