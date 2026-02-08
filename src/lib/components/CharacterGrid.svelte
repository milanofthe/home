<script lang="ts">
	import { untrack, onMount } from 'svelte';
	import type { Cell } from '$lib/layout/gridLayout';

	interface Props {
		cells: Cell[][];
	}

	let { cells }: Props = $props();

	let gridEl: HTMLDivElement;

	const TYPE_CLASSES: Record<string, string> = {
		filler: 'code-grid-filler',
		content: 'code-grid-content',
		heading: 'code-grid-heading',
		'heading-pathsim': 'code-grid-heading-pathsim',
		'heading-pysimhub': 'code-grid-heading-pysimhub',
		cta: 'code-grid-cta',
		link: 'code-grid-link',
		'link-pathsim': 'code-grid-link-pathsim',
		'link-pysimhub': 'code-grid-link-pysimhub',
		footer: 'code-grid-footer',
		empty: 'code-grid-empty',
		'form-field': 'code-grid-form-field',
		frame: 'code-grid-frame',
		'frame-pathsim': 'code-grid-frame-pathsim',
		'frame-pysimhub': 'code-grid-frame-pysimhub'
	};

	let typewriterObserver: IntersectionObserver | null = null;

	function esc(s: string): string {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function rowToSpans(row: Cell[]): string {
		let allFiller = true;
		for (const cell of row) {
			if (cell.type !== 'filler') { allFiller = false; break; }
		}

		if (allFiller) {
			let text = '';
			for (const cell of row) text += cell.char;
			return `<div class="code-grid-line code-grid-filler">${esc(text)}</div>`;
		}

		let inner = '';
		let curText = row[0].char;
		let curType = row[0].type;

		for (let i = 1; i < row.length; i++) {
			if (row[i].type === curType) {
				curText += row[i].char;
			} else {
				inner += `<span class="${TYPE_CLASSES[curType] || 'code-grid-filler'}">${esc(curText)}</span>`;
				curText = row[i].char;
				curType = row[i].type;
			}
		}
		inner += `<span class="${TYPE_CLASSES[curType] || 'code-grid-filler'}">${esc(curText)}</span>`;
		return `<div class="code-grid-line">${inner}</div>`;
	}

	function setupTypewriter() {
		if (!gridEl) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (typewriterObserver) typewriterObserver.disconnect();

		const contentLines = gridEl.querySelectorAll<HTMLSpanElement>('.code-grid-line:not(.code-grid-filler)');
		if (contentLines.length === 0) return;

		// For each content span inside a line: keep filler-colored base, add real-colored overlay
		for (const line of contentLines) {
			const spans = Array.from(line.querySelectorAll<HTMLSpanElement>('span:not(.code-grid-filler):not(.code-grid-frame):not(.code-grid-frame-pathsim):not(.code-grid-frame-pysimhub):not(.code-grid-empty)'));
			for (const span of spans) {
				const text = span.textContent || '';
				if (!text.trim()) continue;
				const cls = span.className;

				const wrapper = document.createElement('span');
				wrapper.className = 'tw-wrapper';

				const base = document.createElement('span');
				base.className = 'code-grid-filler';
				base.textContent = text;

				const overlay = document.createElement('span');
				overlay.className = cls + ' tw-overlay';
				overlay.textContent = text;

				wrapper.appendChild(base);
				wrapper.appendChild(overlay);
				span.replaceWith(wrapper);
			}
		}

		typewriterObserver = new IntersectionObserver((entries) => {
			const newlyVisible = entries
				.filter(e => e.isIntersecting)
				.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

			for (let i = 0; i < newlyVisible.length; i++) {
				typewriterObserver!.unobserve(newlyVisible[i].target);
				const overlays = newlyVisible[i].target.querySelectorAll<HTMLSpanElement>('.tw-overlay');
				for (const overlay of overlays) {
					const chars = (overlay.textContent || '').length;
					if (chars === 0) continue;
					const isHeading = overlay.className.includes('heading');
					const msPerChar = isHeading ? 30 : 15;
					overlay.style.animationName = 'type-reveal';
					overlay.style.animationDuration = `${Math.max(chars * msPerChar, 200)}ms`;
					overlay.style.animationTimingFunction = `steps(${chars})`;
					overlay.style.animationDelay = `${i * 60}ms`;
					overlay.style.animationFillMode = 'both';
				}
			}
		}, { threshold: 0.1 });

		for (const line of contentLines) {
			if (line.querySelector('.tw-overlay')) {
				typewriterObserver.observe(line);
			}
		}
	}

	$effect(() => {
		if (!gridEl) return;
		const c = cells;
		untrack(() => {
			if (typewriterObserver) typewriterObserver.disconnect();
			const parts: string[] = [];
			for (let i = 0; i < c.length; i++) {
				parts.push(rowToSpans(c[i]));
			}
			const html = parts.join('');
			gridEl.innerHTML = html;
			setupTypewriter();
		});
	});

	onMount(() => () => { typewriterObserver?.disconnect(); });
</script>

<div
	bind:this={gridEl}
	style="display: contents;"
	aria-hidden="true"
></div>
