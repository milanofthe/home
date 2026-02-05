<script lang="ts">
	interface Props {
		id: string;
		name: string;
		url: string;
		screenshot: string;
		color: 'pathsim' | 'pysimhub';
		onclick: (rect: DOMRect) => void;
	}

	let { id, name, url, screenshot, color, onclick }: Props = $props();

	let tileElement: HTMLButtonElement;

	function handleClick() {
		const rect = tileElement.getBoundingClientRect();
		onclick(rect);
	}

	function handleTilt(e: MouseEvent) {
		const rect = tileElement.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width - 0.5;
		const y = (e.clientY - rect.top) / rect.height - 0.5;
		tileElement.style.transform = `perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale(1.03)`;
	}

	function handleTiltReset() {
		tileElement.style.transform = '';
	}

	const colorClasses = {
		pathsim: 'border-pathsim',
		pysimhub: 'border-pysimhub'
	};

	const glowColors = {
		pathsim: 'rgba(0, 112, 192, 0.3)',
		pysimhub: 'rgba(99, 102, 241, 0.3)'
	};

	const borderClass = colorClasses[color];
</script>

<button
	bind:this={tileElement}
	onclick={handleClick}
	onmousemove={handleTilt}
	onmouseleave={handleTiltReset}
	class="group relative w-full h-full rounded-xl overflow-hidden border-2 {borderClass} cursor-pointer tile-tilt"
	style="--glow-color: {glowColors[color]};"
	aria-label="Open {name}"
>
	<img
		src={screenshot}
		alt="{name} preview"
		class="absolute inset-0 w-full h-full object-cover object-top"
	/>
</button>

<style>
	.tile-tilt {
		transition: transform 0.15s ease-out, box-shadow 0.3s;
		will-change: transform;
	}

	.tile-tilt:hover {
		box-shadow: 0 8px 30px var(--glow-color, rgba(0, 217, 192, 0.2));
	}
</style>
