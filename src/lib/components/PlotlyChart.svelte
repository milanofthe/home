<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		data: any[];
		layout?: Record<string, any>;
		config?: Record<string, any>;
		class?: string;
	}

	let { data, layout = {}, config = {}, class: className = '' }: Props = $props();

	let plotDiv: HTMLDivElement;

	// Code-rain themed layout: monospace, teal accents, minimal grid
	const defaultLayout: Record<string, any> = {
		paper_bgcolor: 'transparent',
		plot_bgcolor: 'transparent',
		font: {
			family: "'JetBrains Mono', 'Fira Code', monospace",
			color: 'rgba(240, 239, 233, 0.5)',
			size: 11
		},
		margin: { t: 10, r: 10, b: 40, l: 40 },
		xaxis: {
			gridcolor: 'rgba(240, 239, 233, 0.07)',
			linecolor: 'rgba(240, 239, 233, 0.07)',
			zerolinecolor: 'rgba(240, 239, 233, 0.07)',
			tickfont: { color: 'rgba(240, 239, 233, 0.35)', size: 10 },
			showspikes: false
		},
		yaxis: {
			gridcolor: 'rgba(240, 239, 233, 0.07)',
			linecolor: 'rgba(240, 239, 233, 0.07)',
			zerolinecolor: 'rgba(240, 239, 233, 0.07)',
			tickfont: { color: 'rgba(240, 239, 233, 0.35)', size: 10 },
			showspikes: false
		},
		hoverlabel: {
			bgcolor: 'rgba(15, 15, 15, 0.95)',
			bordercolor: 'rgba(0, 217, 192, 0.3)',
			font: {
				family: "'JetBrains Mono', 'Fira Code', monospace",
				color: 'rgba(240, 239, 233, 0.9)',
				size: 11
			}
		},
		showlegend: false
	};

	const defaultConfig: Record<string, any> = {
		responsive: true,
		displayModeBar: false
	};

	function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
		const result = { ...target };
		for (const key of Object.keys(source)) {
			if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
				target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
				result[key] = deepMerge(target[key], source[key]);
			} else {
				result[key] = source[key];
			}
		}
		return result;
	}

	function getPlotly() {
		return typeof window !== 'undefined' ? (window as any).Plotly : null;
	}

	onMount(() => {
		const Plotly = getPlotly();
		if (Plotly && plotDiv) {
			const mergedLayout = deepMerge(defaultLayout, layout);
			const mergedConfig = { ...defaultConfig, ...config };
			Plotly.newPlot(plotDiv, data, mergedLayout, mergedConfig);
		}
	});

	$effect(() => {
		const Plotly = getPlotly();
		if (Plotly && plotDiv && data) {
			const mergedLayout = deepMerge(defaultLayout, layout);
			Plotly.react(plotDiv, data, mergedLayout);
		}
	});

	onDestroy(() => {
		const Plotly = getPlotly();
		if (Plotly && plotDiv) {
			Plotly.purge(plotDiv);
		}
	});
</script>

<div bind:this={plotDiv} class={className}></div>
