<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
</script>

<svelte:head>
	<title>Impressum - Milan Rother</title>
</svelte:head>

<Navigation />

<div class="min-h-screen bg-charcoal text-cream font-mono pt-24 pb-16 px-6">
	<div class="max-w-2xl mx-auto">
		<a href="/" class="text-teal text-sm hover:text-teal-light transition-colors">&larr; Back</a>

		<h1 class="text-2xl font-bold text-teal mt-8 mb-8">Impressum</h1>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">Angaben gemaess &sect; 5 DDG</h2>
			<p>Milan Rother</p>
			<p>Abtstrasse 11</p>
			<p>38106 Braunschweig</p>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">Kontakt</h2>
			<p>E-Mail: milan.rother@gmx.de</p>
			<p>Telefon: +49 15202668142</p>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">Umsatzsteuer-ID</h2>
			<p>Umsatzsteuer-Identifikationsnummer gemaess &sect; 27a UStG:</p>
			<p>DE454282468</p>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">Berufsbezeichnung</h2>
			<p>Ingenieur (Master of Science Elektrotechnik)</p>
			<p class="mt-2">Verliehen durch: Technische Universitaet Braunschweig, Niedersachsen</p>
			<p class="mt-2">Berufsrechtliche Regelungen: Niedersaechsisches Ingenieurgesetz (NIngG)</p>
		</section>

		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">Haftungsausschluss</h2>
			<h3 class="font-bold text-cream/80 mb-2">Haftung fuer Inhalte</h3>
			<p class="text-cream/60 mb-4">
				Die Inhalte dieser Seiten wurden mit groesster Sorgfalt erstellt. Fuer die Richtigkeit,
				Vollstaendigkeit und Aktualitaet der Inhalte kann jedoch keine Gewaehr uebernommen werden.
			</p>
			<h3 class="font-bold text-cream/80 mb-2">Haftung fuer Links</h3>
			<p class="text-cream/60">
				Diese Website enthaelt Links zu externen Webseiten Dritter, auf deren Inhalte kein Einfluss
				genommen werden kann. Fuer die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
				oder Betreiber der Seiten verantwortlich.
			</p>
		</section>
	</div>
</div>
