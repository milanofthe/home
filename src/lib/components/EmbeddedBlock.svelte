<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		row: number;
		col: number;
		rows: number;
		cols: number;
		lineHeight: number;
		charWidth: number;
		children: Snippet;
	}

	let { row, col, rows, cols, lineHeight, charWidth, children }: Props = $props();

	let top = $derived(row * lineHeight);
	let left = $derived(col * charWidth);
	let width = $derived(cols * charWidth);
	let height = $derived(rows * lineHeight);
</script>

<div
	class="embedded-block"
	style="top: {top}px; left: {left}px; width: {width}px; height: {height}px;"
>
	{@render children()}
</div>

<style>
	.embedded-block {
		position: absolute;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		overflow: hidden;
	}
</style>
