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
		pathsim: {
			border: 'border-pathsim',
			glow: 'hover:shadow-[0_0_40px_rgba(0,112,192,0.5)]'
		},
		pysimhub: {
			border: 'border-pysimhub',
			glow: 'hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]'
		}
	};

	const classes = colorClasses[color];
	const hostname = new URL(url).hostname;
</script>

<div class="flex flex-col items-center">
	<button
		bind:this={tileElement}
		onclick={handleClick}
		class="group relative aspect-[16/10] w-full rounded-xl overflow-hidden border-2 {classes.border} cursor-pointer transition-all duration-300 {classes.glow} hover:scale-[1.02]"
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
