<script lang="ts">
	import { untrack, onMount } from 'svelte';
	import type { Cell } from '$lib/layout/gridLayout';

	interface Props {
		cells: Cell[][];
		/**
		 * Gates the reveal on the page being visible. The grid is built while the
		 * container is still faded out (waiting on the web font), and a reveal that
		 * runs behind opacity 0 is a reveal the reader never sees.
		 */
		armed?: boolean;
	}

	let { cells, armed = true }: Props = $props();

	let gridEl: HTMLDivElement;

	// Reveal cadence. Per-character speed sets how fast a single line types;
	// batch size and stagger set how many lines type at once, which is what
	// decides how quickly a whole viewport fills.
	const MS_PER_CHAR = 0.8;
	const MS_PER_CHAR_HEADING = 2;
	const LINE_STAGGER_MS = 10;
	const BATCH_SIZE = 10;
	// How far past the viewport edge the reveal reaches, so lines just out of
	// sight are already typed by the time the reader scrolls to them.
	const REACH_MARGIN_PX = 300;

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
		'heading-falllow': 'code-grid-heading-falllow',
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
		'link-falllow': 'code-grid-link-falllow',
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
		'frame-whatsmytraffic': 'code-grid-frame-whatsmytraffic',
		'frame-falllow': 'code-grid-frame-falllow',
		'code-kw': 'code-grid-code-kw',
		'code-str': 'code-grid-code-str',
		'code-com': 'code-grid-code-com',
		'code-num': 'code-grid-code-num'
	};

	// Stream-in scheduler state. Every batch picks its lines fresh, walking
	// outwards from wherever the reader currently is, so the reveal spreads up
	// and down at once and follows them as they scroll. Lines are revealed in
	// small staggered batches rather than one at a time: the stagger keeps the
	// typed-in look, the batch is what stops a viewport-sized section from taking
	// seconds to fill, and it stays bounded because clip-path reveals repaint on
	// the main thread.
	interface RevealLine {
		el: HTMLElement;
		/** Index in the grid's row list, used to derive the document position. */
		row: number;
		/** Document-space centre of the line. */
		mid: number;
		armed: boolean;
	}

	// Ascending by row, so the scheduler can binary-search for the reader.
	let revealLines: RevealLine[] = [];
	let lastRowCount = 0;
	let twAnimating = false;
	let twScheduled = false;

	function armLine(line: HTMLElement, baseDelay: number): number {
		const overlays = line.querySelectorAll<HTMLSpanElement>('.tw-overlay');
		let lineDuration = 0;
		for (const overlay of overlays) {
			const chars = (overlay.textContent || '').length;
			if (chars === 0) continue;
			const isHeading = overlay.className.includes('heading');
			const msPerChar = isHeading ? MS_PER_CHAR_HEADING : MS_PER_CHAR;
			// Promote only the lines currently typing; dropped on finish.
			overlay.style.willChange = 'clip-path';
			overlay.style.animationName = 'type-reveal';
			overlay.style.animationDuration = `${chars * msPerChar}ms`;
			overlay.style.animationTimingFunction = `steps(${chars})`;
			overlay.style.animationDelay = `${baseDelay + lineDuration}ms`;
			overlay.style.animationFillMode = 'both';
			lineDuration += chars * msPerChar;
		}
		return lineDuration;
	}

	/** Reveals a line without animating it, for lines that were already typed. */
	function snapLine(line: HTMLElement) {
		for (const overlay of line.querySelectorAll<HTMLSpanElement>('.tw-overlay')) {
			overlay.style.animationName = 'none';
			overlay.style.clipPath = 'inset(0 0% 0 0)';
		}
	}

	/**
	 * Positions every reveal line in document space. Rows are uniformly tall --
	 * the whole grid layout is built on that -- so one rect read on the first row
	 * places all of them, with no per-line layout cost.
	 */
	function measureLines() {
		const first = gridEl?.firstElementChild as HTMLElement | null;
		if (!first || revealLines.length === 0) return;
		const rect = first.getBoundingClientRect();
		const top = rect.top + window.scrollY;
		for (const line of revealLines) line.mid = top + (line.row + 0.5) * rect.height;
	}

	/** Index of the last line at or above `y`, or -1 if `y` is above them all. */
	function lineIndexAt(y: number): number {
		let lo = 0;
		let hi = revealLines.length - 1;
		let found = -1;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if (revealLines[mid].mid <= y) { found = mid; lo = mid + 1; }
			else hi = mid - 1;
		}
		return found;
	}

	function revealNextBatch() {
		twScheduled = false;
		if (twAnimating || !armed || revealLines.length === 0) return;

		// Walk outwards from the reader, alternating up and down, taking whichever
		// side is closer. The reach keeps the reveal to what is on screen, so a
		// fast scroll never drags a backlog behind it -- lines it skipped past are
		// simply picked up again the next time they are near the reader.
		const focus = window.scrollY + window.innerHeight / 2;
		const reach = window.innerHeight / 2 + REACH_MARGIN_PX;
		const batch: HTMLElement[] = [];
		let up = lineIndexAt(focus);
		let down = up + 1;

		while (batch.length < BATCH_SIZE) {
			const dUp = up >= 0 ? focus - revealLines[up].mid : Infinity;
			const dDown = down < revealLines.length ? revealLines[down].mid - focus : Infinity;
			if (dUp > reach && dDown > reach) break;
			const line = dUp <= dDown ? revealLines[up--] : revealLines[down++];
			if (line.armed) continue;
			line.armed = true;
			batch.push(line.el);
		}
		if (batch.length === 0) return;

		twAnimating = true;
		let batchDuration = 0;
		for (let i = 0; i < batch.length; i++) {
			const delay = i * LINE_STAGGER_MS;
			batchDuration = Math.max(batchDuration, delay + armLine(batch[i], delay));
		}
		window.setTimeout(() => {
			twAnimating = false;
			revealNextBatch();
		}, batchDuration + 16);
	}

	function scheduleTypewriter() {
		if (twScheduled || twAnimating || !armed) return;
		twScheduled = true;
		requestAnimationFrame(revealNextBatch);
	}

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
		// A rebuild replaces the whole grid -- fresher GitHub numbers arriving is
		// the usual cause. Rows the reader has already watched type stay revealed
		// across it, so a late rebuild never restarts the reveal under them.
		const alreadyRevealed = new Set(revealLines.filter((l) => l.armed).map((l) => l.row));
		revealLines = [];
		twAnimating = false;
		twScheduled = false;
		if (!gridEl) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		// Row indices come from the child list rather than a rect per line: rows are
		// uniformly tall, so index times row height is the position.
		const rows = Array.from(gridEl.children) as HTMLElement[];
		const contentLines: { el: HTMLElement; row: number }[] = [];
		for (let i = 0; i < rows.length; i++) {
			if (!rows[i].classList.contains('code-grid-filler')) contentLines.push({ el: rows[i], row: i });
		}
		// Row indices only carry over when the rebuild kept the same row count;
		// a reflow would have moved everything.
		const carry = rows.length === lastRowCount ? alreadyRevealed : new Set<number>();
		lastRowCount = rows.length;
		if (contentLines.length === 0) return;

		// For each content span inside a line: keep filler-colored base, add real-colored overlay
		for (const { el: line } of contentLines) {
			const spans = Array.from(line.querySelectorAll<HTMLSpanElement>('span:not(.code-grid-filler):not(.code-grid-frame):not(.code-grid-frame-pathsim):not(.code-grid-frame-pysimhub):not(.code-grid-frame-rapidpassives):not(.code-grid-frame-scidata):not(.code-grid-frame-fastsim):not(.code-grid-frame-sane):not(.code-grid-frame-rslab):not(.code-grid-frame-thesisos):not(.code-grid-frame-whatsmytraffic):not(.code-grid-frame-falllow):not(.code-grid-empty)'));
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

		for (const { el, row } of contentLines) {
			if (!el.querySelector('.tw-overlay')) continue;
			const done = carry.has(row);
			if (done) snapLine(el);
			revealLines.push({ el, row, mid: 0, armed: done });
		}
		measureLines();
		scheduleTypewriter();
	}

	// Lines stay untouched while the page is still faded out, so the reveal starts
	// with the fade instead of running behind opacity 0. Re-measured here because
	// this is the point where the container's final font metrics are in place.
	$effect(() => {
		if (!armed) return;
		measureLines();
		scheduleTypewriter();
	});

	$effect(() => {
		if (!gridEl) return;
		const c = cells;
		untrack(() => {
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
		// short of the final keyframe (last char stays filler-dark), pin the end
		// state explicitly when each reveal finishes.
		const pinFinalClip = (e: AnimationEvent) => {
			const t = e.target as HTMLElement;
			if (e.animationName === 'type-reveal' && t.classList.contains('tw-overlay')) {
				// Inline style loses against the animation's fill state in the
				// cascade, so drop the animation before pinning the final clip.
				t.style.clipPath = 'inset(0 0% 0 0)';
				t.style.animationName = 'none';
				// Release the compositor hint now that this span is done.
				t.style.willChange = '';
			}
		};
		gridEl.addEventListener('animationend', pinFinalClip);

		// Scrolling moves the origin the reveal spreads from, so every scroll is a
		// chance for new lines to come within reach.
		const onScroll = () => scheduleTypewriter();
		const onResize = () => { measureLines(); scheduleTypewriter(); };
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);

		return () => {
			gridEl.removeEventListener('animationend', pinFinalClip);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<div
	bind:this={gridEl}
	style="display: contents;"
	aria-hidden="true"
></div>
