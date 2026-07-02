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
		'heading-rapidpassives': 'code-grid-heading-rapidpassives',
		'heading-scidata': 'code-grid-heading-scidata',
		'heading-fastsim': 'code-grid-heading-fastsim',
		'heading-sane': 'code-grid-heading-sane',
		'heading-rslab': 'code-grid-heading-rslab',
		'heading-thesisos': 'code-grid-heading-thesisos',
		'heading-whatsmytraffic': 'code-grid-heading-whatsmytraffic',
		cta: 'code-grid-cta',
		link: 'code-grid-link',
		'link-pathsim': 'code-grid-link-pathsim',
		'link-pysimhub': 'code-grid-link-pysimhub',
		'link-rapidpassives': 'code-grid-link-rapidpassives',
		'link-scidata': 'code-grid-link-scidata',
		'link-fastsim': 'code-grid-link-fastsim',
		'link-sane': 'code-grid-link-sane',
		'link-rslab': 'code-grid-link-rslab',
		'link-thesisos': 'code-grid-link-thesisos',
		'link-whatsmytraffic': 'code-grid-link-whatsmytraffic',
		footer: 'code-grid-footer',
		empty: 'code-grid-empty',
		'form-field': 'code-grid-form-field',
		frame: 'code-grid-frame',
		'frame-pathsim': 'code-grid-frame-pathsim',
		'frame-pysimhub': 'code-grid-frame-pysimhub',
		'frame-rapidpassives': 'code-grid-frame-rapidpassives',
		'frame-scidata': 'code-grid-frame-scidata',
		'frame-fastsim': 'code-grid-frame-fastsim',
		'frame-sane': 'code-grid-frame-sane',
		'frame-rslab': 'code-grid-frame-rslab',
		'frame-thesisos': 'code-grid-frame-thesisos',
		'frame-whatsmytraffic': 'code-grid-frame-whatsmytraffic'
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
			const spans = Array.from(line.querySelectorAll<HTMLSpanElement>('span:not(.code-grid-filler):not(.code-grid-frame):not(.code-grid-frame-pathsim):not(.code-grid-frame-pysimhub):not(.code-grid-frame-rapidpassives):not(.code-grid-frame-scidata):not(.code-grid-frame-fastsim):not(.code-grid-frame-sane):not(.code-grid-frame-rslab):not(.code-grid-frame-thesisos):not(.code-grid-frame-whatsmytraffic):not(.code-grid-empty)'));
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

			// Sequential stream: each line starts when the previous one finishes,
			// spans within a line continue left-to-right without a gap.
			let chain = 0;
			for (const entry of newlyVisible) {
				typewriterObserver!.unobserve(entry.target);
				const overlays = entry.target.querySelectorAll<HTMLSpanElement>('.tw-overlay');
				let lineDuration = 0;
				for (const overlay of overlays) {
					const chars = (overlay.textContent || '').length;
					if (chars === 0) continue;
					const isHeading = overlay.className.includes('heading');
					const msPerChar = isHeading ? 5 : 2;
					overlay.style.animationName = 'type-reveal';
					overlay.style.animationDuration = `${chars * msPerChar}ms`;
					overlay.style.animationTimingFunction = `steps(${chars})`;
					overlay.style.animationDelay = `${chain + lineDuration}ms`;
					overlay.style.animationFillMode = 'both';
					lineDuration += chars * msPerChar;
				}
				chain += lineDuration;
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

	onMount(() => {
		// Chrome sometimes leaves composited steps() clip-path animations one step
		// short of the final keyframe (last char stays filler-dark) — pin the end
		// state explicitly when each reveal finishes.
		const pinFinalClip = (e: AnimationEvent) => {
			const t = e.target as HTMLElement;
			if (e.animationName === 'type-reveal' && t.classList.contains('tw-overlay')) {
				// Inline style loses against the animation's fill state in the
				// cascade, so drop the animation before pinning the final clip.
				t.style.clipPath = 'inset(0 0% 0 0)';
				t.style.animationName = 'none';
			}
		};
		gridEl.addEventListener('animationend', pinFinalClip);
		return () => {
			gridEl.removeEventListener('animationend', pinFinalClip);
			typewriterObserver?.disconnect();
		};
	});
</script>

<div
	bind:this={gridEl}
	style="display: contents;"
	aria-hidden="true"
></div>
