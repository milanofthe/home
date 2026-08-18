---
title: WhatsMyTraffic
accent: whatsmytraffic
tagline: Self-hosted analytics, forms, passwordless auth and booking.
group: infrastructure
order: 21
site: whatsmytraffic.com|https://whatsmytraffic.com
license: self-hosted, runs my sites
cta1: [ Open whatsmytraffic -> ]|https://whatsmytraffic.com
cta2: [ Read the docs -> ]|https://whatsmytraffic.com/docs
---

![whatsmytraffic.com|right|57x15](/screenshots/whatsmytraffic-landing.png)

WhatsMyTraffic is four services on one VPS: web analytics, a form backend,
passwordless login and appointment booking. Each goes into a page as one script
tag or one form action, and all four are configured per website from the same
dashboard.

## The services

Analytics is a beacon around a headless Umami, adding consent gating, Do Not
Track and Global Privacy Control, a domain allowlist and a call queue so events
fired before the script loads are not dropped. Forms take a plain POST, no
JavaScript, and notify by webhook and by push through a self-hosted ntfy. Auth is
magic links, ES256, stateless: the address is processed to send the link and the
session lives in the browser as a signed token. Booking opens the hosted page as
a modal on the customer's site and confirms by ICS, with optional Google Calendar
sync for availability.

Umami v3, PostgreSQL 15, a SvelteKit dashboard and Caddy, in Docker Compose,
deployed from GitHub releases.

## History

This started with a limit. Cloudflare Web Analytics stops at ten websites and I
had run out. A 2 EUR per month VPS running Umami came out cheapest and by some
distance the most flexible.

What I kept from Cloudflare was the shape of the snippet: a script tag with a
data attribute and nothing else to do. That set the pattern for everything after.

Forms came from not wanting to pay Formspark for something the same box could
already do, then passwordless auth, and most recently booking, from not wanting
Calendly. Each is a snippet and a small SDK, each configured per website in the
one dashboard.
