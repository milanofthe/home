<script lang="ts">
	import { onMount } from 'svelte';

	// Lorenz system parameters
	const sigma = 10;
	const rho = 28;
	const beta = 8 / 3;
	const dt = 0.005;
	const numPoints = 10000;

	// Generate Lorenz attractor points once
	function generateLorenzPoints(): { x: number; y: number; z: number }[] {
		const points: { x: number; y: number; z: number }[] = [];
		let x = 0.1;
		let y = 0;
		let z = 0;

		for (let i = 0; i < numPoints; i++) {
			const dx = sigma * (y - x) * dt;
			const dy = (x * (rho - z) - y) * dt;
			const dz = (x * y - beta * z) * dt;

			x += dx;
			y += dy;
			z += dz;

			points.push({ x, y, z });
		}

		return points;
	}

	// Project 3D to 2D with rotation around Z axis (vertical)
	// View: looking slightly from above, Z is up
	function projectPoints(points: { x: number; y: number; z: number }[], rotZ: number): { x: number; y: number }[] {
		const cosZ = Math.cos(rotZ);
		const sinZ = Math.sin(rotZ);

		// Tilt to see from above (rotate around X to tilt view)
		const tiltX = 0.6;
		const cosTilt = Math.cos(tiltX);
		const sinTilt = Math.sin(tiltX);

		return points.map((p) => {
			// First rotate around Z axis (the vertical axis of the attractor)
			const x1 = p.x * cosZ - p.y * sinZ;
			const y1 = p.x * sinZ + p.y * cosZ;
			const z1 = p.z;

			// Then tilt the view (rotate around X to look from above)
			// Project: x stays, y becomes mix of y and z
			const xFinal = x1;
			const yFinal = z1 * cosTilt - y1 * sinTilt;

			return { x: xFinal, y: yFinal };
		});
	}

	// Generate path data - centered at origin
	function generatePathData(points: { x: number; y: number }[]): string {
		if (points.length === 0) return '';

		// Find bounds to center properly
		let minX = Infinity, maxX = -Infinity;
		let minY = Infinity, maxY = -Infinity;

		for (const p of points) {
			if (p.x < minX) minX = p.x;
			if (p.x > maxX) maxX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.y > maxY) maxY = p.y;
		}

		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const scale = 10;

		const pathParts = [`M ${(points[0].x - centerX) * scale} ${(points[0].y - centerY) * scale}`];

		for (let i = 1; i < points.length; i++) {
			pathParts.push(`L ${(points[i].x - centerX) * scale} ${(points[i].y - centerY) * scale}`);
		}

		return pathParts.join(' ');
	}

	// Pre-compute the 3D points
	const lorenzPoints = generateLorenzPoints();

	let mounted = $state(false);
	let rotationZ = $state(0);
	let pathData = $state('');
	let animationFrame: number;

	onMount(() => {
		mounted = true;

		// Initial projection
		const projected = projectPoints(lorenzPoints, rotationZ);
		pathData = generatePathData(projected);

		function animate() {
			rotationZ += 0.003; // Slow rotation around Z
			const projected = projectPoints(lorenzPoints, rotationZ);
			pathData = generatePathData(projected);
			animationFrame = requestAnimationFrame(animate);
		}

		animate();

		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	});
</script>

<div
	class="absolute inset-0 overflow-hidden"
	class:opacity-0={!mounted}
	class:opacity-100={mounted}
	style="transition: opacity 1.5s ease-out;"
>
	<svg
		viewBox="-300 -250 600 500"
		class="absolute w-full h-full"
		preserveAspectRatio="xMidYMid slice"
		style="transform: scale(1.2);"
	>
		<defs>
			<linearGradient id="lorenzGradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#b3b2ae" stop-opacity="0.55" />
				<stop offset="50%" stop-color="#969591" stop-opacity="0.45" />
				<stop offset="100%" stop-color="#6f6e6a" stop-opacity="0.3" />
			</linearGradient>
			<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="3" result="coloredBlur" />
				<feMerge>
					<feMergeNode in="coloredBlur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>

		<!-- Main attractor path -->
		<g filter="url(#glow)">
			<path
				d={pathData}
				fill="none"
				stroke="url(#lorenzGradient)"
				stroke-width="0.6"
				stroke-linecap="round"
				stroke-linejoin="round"
				opacity="0.9"
			/>
		</g>

		<!-- Brighter highlight layer -->
		<path
			d={pathData}
			fill="none"
			stroke="#969591"
			stroke-width="0.25"
			stroke-linecap="round"
			stroke-linejoin="round"
			opacity="0.5"
		/>
	</svg>
</div>
