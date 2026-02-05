<script lang="ts">
	interface Props {
		id: string;
		name: string;
		url: string;
		screenshot: string;
		description: string;
		color: 'pathsim' | 'pysimhub';
		onclick: (rect: DOMRect) => void;
	}

	let { id, name, url, screenshot, description, color, onclick }: Props = $props();

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
</script>

<button
	bind:this={tileElement}
	onclick={handleClick}
	class="group relative aspect-[16/10] rounded-xl overflow-hidden border-2 {classes.border} cursor-pointer transition-all duration-300 {classes.glow} hover:scale-[1.02]"
	aria-label="Open {name}"
>
	<!-- Screenshot background -->
	<img
		src={screenshot}
		alt="{name} preview"
		class="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
	/>

	<!-- Text overlay with subtle shadow for readability -->
	<div class="absolute bottom-0 left-0 right-0 p-5 text-left bg-gradient-to-t from-black/60 to-transparent">
		<h3 class="font-display font-bold text-cream text-xl mb-1 drop-shadow-lg">{name}</h3>
		<p class="text-sm text-cream/80 drop-shadow">{description}</p>
	</div>
</button>
