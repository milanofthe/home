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

	// Default dark theme layout matching the site design
	const defaultLayout: Record<string, any> = {
		paper_bgcolor: 'transparent',
		plot_bgcolor: 'transparent',
		font: {
			family: 'Inter, system-ui, sans-serif',
			color: 'rgba(240, 239, 233, 0.7)', // cream/70
			size: 12
		},
		margin: { t: 20, r: 20, b: 40, l: 50 },
		xaxis: {
			gridcolor: 'rgba(240, 239, 233, 0.1)',
			linecolor: 'rgba(240, 239, 233, 0.1)',
			tickfont: { color: 'rgba(240, 239, 233, 0.5)' }
		},
		yaxis: {
			gridcolor: 'rgba(240, 239, 233, 0.1)',
			linecolor: 'rgba(240, 239, 233, 0.1)',
			tickfont: { color: 'rgba(240, 239, 233, 0.5)' }
		},
		showlegend: false
	};

	const defaultConfig: Record<string, any> = {
		responsive: true,
		displayModeBar: false
	};

	function getPlotly() {
		return typeof window !== 'undefined' ? (window as any).Plotly : null;
	}

	onMount(() => {
		const Plotly = getPlotly();
		if (Plotly && plotDiv) {
			const mergedLayout = { ...defaultLayout, ...layout };
			const mergedConfig = { ...defaultConfig, ...config };
			Plotly.newPlot(plotDiv, data, mergedLayout, mergedConfig);
		}
	});

	// Reactive update when data changes
	$effect(() => {
		const Plotly = getPlotly();
		if (Plotly && plotDiv && data) {
			const mergedLayout = { ...defaultLayout, ...layout };
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
