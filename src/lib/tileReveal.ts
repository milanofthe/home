// Shared tile reveal: covers a block with a page-background canvas and
// clears it in random character-cell patches once the block scrolls into
// view. Used by the landing tiles and the article page images.

interface RevealParams {
	charWidth: number;
	lineHeight: number;
}

export function tileReveal(node: HTMLElement, params: RevealParams) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return { destroy() {} };
	}
	const { charWidth, lineHeight } = params;

	const w = node.offsetWidth;
	const h = node.offsetHeight;
	const cols = Math.round(w / charWidth);
	const rows = Math.round(h / lineHeight);
	const total = cols * rows;
	if (total <= 0) return { destroy() {} };

	// Lazy load: strip video src, preload early, play on reveal
	const videoEls = node.querySelectorAll<HTMLVideoElement>('video');
	for (const el of videoEls) {
		el.dataset.lazySrc = el.src;
		el.removeAttribute('src');
		el.pause();
	}

	// Canvas overlay filled with page background, hides the content
	const canvas = document.createElement('canvas');
	const dpr = window.devicePixelRatio || 1;
	canvas.width = w * dpr;
	canvas.height = h * dpr;
	canvas.style.cssText = `position:absolute;top:0;left:0;width:${w}px;height:${h}px;z-index:1;pointer-events:none`;
	const ctx = canvas.getContext('2d')!;
	ctx.scale(dpr, dpr);
	ctx.fillStyle = '#0f0f0f';
	ctx.fillRect(0, 0, w, h);
	node.appendChild(canvas);

	// Shuffled cell indices for random patch reveal
	const order = Array.from({ length: total }, (_, i) => i);
	for (let i = total - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[order[i], order[j]] = [order[j], order[i]];
	}

	// Preload observer: start fetching videos when tile is ~800px from viewport
	const preloadObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				preloadObserver.unobserve(entry.target);
				for (const el of videoEls) {
					if (el.dataset.lazySrc) {
						el.src = el.dataset.lazySrc;
						el.preload = 'auto';
						el.load();
						delete el.dataset.lazySrc;
					}
				}
			}
		}
	}, { rootMargin: '800px' });
	preloadObserver.observe(node);

	// Reveal observer: start animation and play video when tile is visible
	const revealObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				revealObserver.unobserve(entry.target);

				for (const el of videoEls) {
					el.play();
				}

				let i = 0;
				const perFrame = Math.max(1, Math.ceil(total / 80));
				(function step() {
					for (let n = 0; n < perFrame && i < total; n++, i++) {
						const c = order[i] % cols;
						const r = (order[i] / cols) | 0;
						ctx.clearRect(c * charWidth, r * lineHeight, charWidth + 1, lineHeight + 1);
					}
					if (i < total) requestAnimationFrame(step);
					else canvas.remove();
				})();
			}
		}
	}, { threshold: 0.1 });
	revealObserver.observe(node);

	return {
		destroy() {
			preloadObserver.disconnect();
			revealObserver.disconnect();
			canvas.remove();
		}
	};
}
