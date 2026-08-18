---
title: WhatsMyTraffic
accent: whatsmytraffic
tagline: Self-hosted analytics, forms, passwordless auth and booking. One snippet each, one dashboard per site.
group: infrastructure
order: 21
site: whatsmytraffic.com|https://whatsmytraffic.com
license: self-hosted, runs my sites
cta1: [ Open whatsmytraffic -> ]|https://whatsmytraffic.com
cta2: [ Read the docs -> ]|https://whatsmytraffic.com/docs
---

WhatsMyTraffic is four services on one VPS: web analytics, a form backend,
passwordless login and appointment booking. Each is a script tag or a form action
on the customer's page, and all four are administered per website from the same
dashboard.

## Analytics

The beacon wraps the Umami tracking script and adds what the raw one leaves out:
consent gating, Do Not Track and Global Privacy Control, a domain allowlist, and a
`wmt()` call queue so events fired before the script loads are not dropped.

```html
<script defer src="https://whatsmytraffic.com/beacon.js"
        data-website-id="YOUR-WEBSITE-ID"></script>
```

Umami itself runs headless. No public UI is exposed, only the ingest endpoints
(`/script.js`, `/api/send`) and the API the dashboard calls internally.

## Forms

A form posts to an endpoint. No JavaScript, no client library, and the same URL
takes JSON for anything that submits by fetch.

```html
<form action="https://whatsmytraffic.com/f/YOUR-FORM-ID" method="POST">
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>
```

Submissions land in the dashboard and notify by webhook and by push through a
self-hosted ntfy, with email optional over SMTP.

## Passwordless auth

An email address, a link, a session. The SDK exposes `login`, `getSession`,
`getToken` and `logout`; everything else happens on the service.

```html
<script defer src="https://whatsmytraffic.com/whatsmytraffic-auth.js"
        data-app-id="YOUR-APP-ID"></script>
```

The session is an ES256 JWT with a fifteen-minute magic token and a thirty-day
session, verified by the relying party against `/a/<app-id>/verify` or the public
keys at `/jwks`. Requests are rate limited per IP and per target address. Nothing
about the end user is stored: the email is processed to send the link, and the
session lives in the browser as a signed token.

## Booking

The SDK opens the hosted booking page as a modal over the customer's site. Any
element carrying `data-wmt-booking` is a trigger.

```html
<script defer src="https://whatsmytraffic.com/whatsmytraffic-booking.js"
        data-page-id="YOUR-PAGE-ID"></script>
<button data-wmt-booking>Book a call</button>
```

Confirmation goes out as an ICS invitation, with optional Google Calendar sync for
availability. Where the beacon is present, the SDK reports `booking_open` and
`booking_confirmed` into the analytics, so the funnel is visible without wiring
anything up.

## The stack

![whatsmytraffic.com|right|46x14](/screenshots/whatsmytraffic-landing.png)

Umami v3 headless, PostgreSQL 15, a SvelteKit dashboard service, ntfy, and Caddy
in front doing TLS and serving the prerendered landing page. Docker Compose on a
single VPS, deployed from GitHub releases; the beacon and both SDKs are esbuild
bundles served from the same origin.

## History

This started with a limit. Cloudflare Web Analytics stops at ten websites, and I
had run out. Looking at what else there was, a 2 EUR per month VPS running Umami
came out cheapest and, more to the point, the most flexible.

The one thing I wanted to keep from Cloudflare was the shape of the snippet: a
script tag with a data attribute, nothing else to do. That is what the beacon is,
and it set the pattern for everything that came after.

Forms came next, from not wanting to pay Formspark for something the same box
could already do. Then passwordless auth over magic links. Booking is the most
recent, and arrived for the same reason as the others, which was not wanting to
use Calendly. Each is a snippet and a small SDK, and each is configured per
website in the one dashboard.
