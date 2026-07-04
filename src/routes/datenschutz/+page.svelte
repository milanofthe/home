<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
</script>

<svelte:head>
	<title>Datenschutz — Milan Rother</title>
	<link rel="canonical" href="https://milanrother.com/datenschutz" />
</svelte:head>

<Navigation />

<div class="min-h-screen bg-charcoal text-cream font-mono pt-24 pb-16 px-6">
	<div class="max-w-2xl mx-auto">
		<a href="/" class="text-accent text-sm hover:text-accent-light transition-colors">&larr; Back</a>

		<h1 class="text-2xl font-bold text-accent mt-8 mb-8">Datenschutzerklärung</h1>

		<!-- 1. Verantwortlicher -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">1. Verantwortlicher</h2>
			<p>Milan Rother</p>
			<p>Abtstraße 11, 38106 Braunschweig</p>
			<p>E-Mail: <a href="mailto:info@milanrother.com" class="text-accent hover:text-accent-light">info@milanrother.com</a></p>
		</section>

		<!-- 2. Hosting -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">2. Hosting</h2>
			<p class="text-cream/60 mb-2">
				Diese Website wird über Cloudflare Pages / GitHub Pages gehostet. Beim Abruf der
				Website werden automatisch technische Daten (z. B. IP-Adresse, Zeitpunkt des
				Zugriffs, Browser-Typ) durch den Hosting-Anbieter verarbeitet. Dies ist
				erforderlich, um die Website auszuliefern, und erfolgt auf Grundlage von
				Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer zuverlässigen
				Bereitstellung der Website).
			</p>
		</section>

		<!-- 3. Web-Analyse -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">3. Web-Analyse</h2>
			<p class="text-cream/60 mb-2">
				Diese Website verwendet whatsmytraffic, eine selbst gehostete, cookielose
				Web-Analyse auf Basis von Umami. Die Analyse-Software läuft auf einem eigenen
				Server (Strato, Deutschland); es werden keine Daten an Dritte weitergegeben.
				Es werden keine Cookies gesetzt und kein Fingerprinting eingesetzt. Die
				IP-Adresse wird ausschließlich serverseitig zur Ableitung des ungefähren
				Herkunftslandes verwendet und nicht gespeichert.
			</p>
			<p class="text-cream/60">
				Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
				statistischen Analyse der Websitenutzung zur Optimierung des Angebots).
			</p>
		</section>

		<!-- 4. Kontaktformular -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">4. Kontaktformular</h2>
			<p class="text-cream/60 mb-2">
				Wenn Sie das Kontaktformular auf dieser Website nutzen, werden die von Ihnen
				eingegebenen Daten (Name, E-Mail-Adresse, Betreff und Nachricht) über den
				selbst gehosteten Formular-Dienst whatsmytraffic verarbeitet. Der Dienst läuft
				auf einem eigenen Server (Strato, Deutschland); es findet keine Übermittlung
				an Dritte oder in ein Drittland statt.
			</p>
			<p class="text-cream/60 mb-2">
				Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw.
				Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von
				Anfragen).
			</p>
			<p class="text-cream/60">
				Speicherdauer: Anfragen werden bis zur vollständigen Bearbeitung Ihres
				Anliegens gespeichert und anschließend gelöscht, sofern keine gesetzlichen
				Aufbewahrungspflichten entgegenstehen.
			</p>
		</section>

		<!-- 5. Schriftarten -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">5. Schriftarten</h2>
			<p class="text-cream/60">
				Diese Website verwendet selbst gehostete Schriftarten (JetBrains Mono, Inter,
				Space Grotesk). Es werden keine Verbindungen zu externen Font-Diensten wie
				Google Fonts hergestellt. Es findet keine Datenübertragung an Dritte statt.
			</p>
		</section>

		<!-- 6. Betroffenenrechte -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">6. Ihre Rechte</h2>
			<p class="text-cream/60 mb-2">
				Sie haben gegenüber dem Verantwortlichen folgende Rechte hinsichtlich der Sie
				betreffenden personenbezogenen Daten:
			</p>
			<ul class="text-cream/60 list-disc list-inside space-y-1 mb-2">
				<li>Recht auf Auskunft (Art. 15 DSGVO)</li>
				<li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
				<li>Recht auf Löschung (Art. 17 DSGVO)</li>
				<li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
				<li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
				<li>Widerspruchsrecht (Art. 21 DSGVO)</li>
			</ul>
		</section>

		<!-- 7. Beschwerderecht -->
		<section class="mb-8">
			<h2 class="text-lg font-bold text-cream mb-4">7. Beschwerderecht bei einer Aufsichtsbehörde</h2>
			<p class="text-cream/60 mb-2">
				Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die
				Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
			</p>
			<p class="text-cream/60">
				Zuständige Aufsichtsbehörde:<br />
				Die Landesbeauftragte für den Datenschutz Niedersachsen<br />
				Prinzenstraße 5, 30159 Hannover<br />
				<a href="https://www.lfd.niedersachsen.de" class="text-accent hover:text-accent-light" target="_blank" rel="noopener">
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
