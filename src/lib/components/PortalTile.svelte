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

	const colorClasses = {
		pathsim: 'border-pathsim',
		pysimhub: 'border-pysimhub'
	};

	const borderClass = colorClasses[color];
	const hostname = new URL(url).hostname;
</script>

<div class="flex flex-col items-center">
	<button
		bind:this={tileElement}
		onclick={handleClick}
		class="group relative aspect-[16/10] w-full rounded-xl overflow-hidden border-2 {borderClass} cursor-pointer transition-all duration-300 hover:scale-105"
		aria-label="Open {name}"
	>
		<img
			src={screenshot}
			alt="{name} preview"
			class="absolute inset-0 w-full h-full object-cover object-top"
		/>
	</button>
	<span class="mt-3 text-sm text-cream/40">{hostname}</span>
</div>
