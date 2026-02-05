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
			border: 'hover:border-pathsim/50',
			glow: 'hover:shadow-[0_0_30px_rgba(0,112,192,0.3)]',
			gradient: 'from-charcoal/40 via-charcoal/60 to-charcoal/90'
		},
		pysimhub: {
			border: 'hover:border-pysimhub/50',
			glow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]',
			gradient: 'from-charcoal/40 via-charcoal/60 to-charcoal/90'
		}
	};

	const classes = colorClasses[color];
</script>

<button
	bind:this={tileElement}
	onclick={handleClick}
	class="group relative aspect-[16/10] rounded-lg overflow-hidden border border-cream/10 cursor-pointer transition-all duration-300 {classes.border} {classes.glow} hover:scale-[1.02]"
	aria-label="Open {name}"
>
	<!-- Screenshot background -->
	<img
		src={screenshot}
		alt="{name} preview"
		class="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
	/>

	<!-- Gradient overlay -->
	<div class="absolute inset-0 bg-gradient-to-t {classes.gradient} transition-opacity duration-300 group-hover:opacity-80"></div>

	<!-- Text overlay -->
	<div class="absolute bottom-0 left-0 right-0 p-4 text-left">
		<h3 class="font-display font-semibold text-cream text-lg mb-1">{name}</h3>
		<p class="text-sm text-cream/70">{description}</p>
	</div>
</button>
