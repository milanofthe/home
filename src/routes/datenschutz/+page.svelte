<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
</script>

<svelte:head>
	<title>Datenschutzerklaerung - Milan Rother</title>
</svelte:head>

<Navigation />

<div class="min-h-screen bg-charcoal text-cream font-mono pt-24 pb-16 px-6">
	<div class="max-w-2xl mx-auto">
		<a href="/" class="text-teal text-sm hover:text-teal-light transition-colors">&larr; Back</a>

		<h1 class="text-2xl font-bold text-teal mt-8 mb-8">Datenschutzerklaerung</h1>

		<!-- 1. Verantwortlicher -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">1. Verantwortlicher</h2>
			<p>Milan Rother</p>
			<p>Abtstrasse 11, 38106 Braunschweig</p>
			<p>E-Mail: milan.rother@gmx.de</p>
			<p>Telefon: +49 15202668142</p>
		</section>

		<!-- 2. Hosting -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">2. Hosting</h2>
			<p class="text-cream/60 mb-2">
				Diese Website wird ueber Cloudflare Pages / GitHub Pages gehostet. Beim Abruf der
				Website werden automatisch technische Daten (z.B. IP-Adresse, Zeitpunkt des Zugriffs,
				Browser-Typ) durch den Hosting-Anbieter verarbeitet. Dies ist erforderlich, um die
				Website auszuliefern, und erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
				(berechtigtes Interesse an einer zuverlaessigen Bereitstellung der Website).
			</p>
		</section>

		<!-- 3. Cloudflare Web Analytics -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">3. Cloudflare Web Analytics</h2>
			<p class="text-cream/60 mb-2">
				Diese Website verwendet Cloudflare Web Analytics, einen datenschutzfreundlichen
				Analysedienst der Cloudflare, Inc. Cloudflare Web Analytics setzt keine Cookies,
				verwendet kein Fingerprinting und speichert keine IP-Adressen. Die IP-Adresse wird
				am Edge-Server verworfen und nicht an Cloudflare weitergeleitet.
			</p>
			<p class="text-cream/60 mb-2">
				Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
				statistischen Analyse der Websitenutzung zur Optimierung des Angebots).
			</p>
			<p class="text-cream/60">
				Weitere Informationen:
				<a href="https://www.cloudflare.com/web-analytics/" class="text-teal hover:text-teal-light" target="_blank" rel="noopener">
					cloudflare.com/web-analytics
				</a>
			</p>
		</section>

		<!-- 4. Kontaktformular / Web3Forms -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">4. Kontaktformular (Web3Forms)</h2>
			<p class="text-cream/60 mb-2">
				Das Kontaktformular auf dieser Website nutzt den Dienst Web3Forms
				(Web3Creative, Indien/USA). Wenn Sie das Kontaktformular verwenden, werden
				folgende Daten uebermittelt: Name, E-Mail-Adresse, Betreff und Nachricht.
			</p>
			<p class="text-cream/60 mb-2">
				Die Daten werden an Server in den USA uebertragen. Es gelten die
				Datenschutzbestimmungen von Web3Forms.
			</p>
			<p class="text-cream/60 mb-2">
				Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Massnahmen) bzw.
				Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).
			</p>
			<p class="text-cream/60">
				Speicherdauer: Die ueber Web3Forms uebermittelten Daten werden dort fuer maximal
				30 Tage gespeichert.
			</p>
		</section>

		<!-- 5. Schriftarten -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">5. Schriftarten</h2>
			<p class="text-cream/60">
				Diese Website verwendet selbst gehostete Schriftarten (JetBrains Mono, Inter,
				Space Grotesk). Es werden keine Verbindungen zu externen Font-Diensten wie
				Google Fonts hergestellt. Es findet keine Datenuebertragung an Dritte statt.
			</p>
		</section>

		<!-- 6. Betroffenenrechte -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">6. Ihre Rechte</h2>
			<p class="text-cream/60 mb-2">
				Sie haben gegenueber dem Verantwortlichen folgende Rechte hinsichtlich der Sie
				betreffenden personenbezogenen Daten:
			</p>
			<ul class="text-cream/60 list-disc list-inside space-y-1 mb-2">
				<li>Recht auf Auskunft (Art. 15 DSGVO)</li>
				<li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
				<li>Recht auf Loeschung (Art. 17 DSGVO)</li>
				<li>Recht auf Einschraenkung der Verarbeitung (Art. 18 DSGVO)</li>
				<li>Recht auf Datenuebertragbarkeit (Art. 20 DSGVO)</li>
				<li>Widerspruchsrecht (Art. 21 DSGVO)</li>
			</ul>
		</section>

		<!-- 7. Beschwerderecht -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">7. Beschwerderecht bei einer Aufsichtsbehoerde</h2>
			<p class="text-cream/60 mb-2">
				Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehoerde ueber die
				Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
			</p>
			<p class="text-cream/60">
				Zustaendige Aufsichtsbehoerde:<br />
				Die Landesbeauftragte fuer den Datenschutz Niedersachsen<br />
				Prinzenstrasse 5, 30159 Hannover<br />
				<a href="https://www.lfd.niedersachsen.de" class="text-teal hover:text-teal-light" target="_blank" rel="noopener">
					lfd.niedersachsen.de
				</a>
			</p>
		</section>

		<!-- 8. Keine automatisierte Entscheidungsfindung -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">8. Automatisierte Entscheidungsfindung</h2>
			<p class="text-cream/60">
				Es findet keine automatisierte Entscheidungsfindung oder Profiling im Sinne
				von Art. 22 DSGVO statt.
			</p>
		</section>
	</div>
</div>
