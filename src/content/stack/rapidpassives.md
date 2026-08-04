---
title: RapidPassives
accent: rapidpassives
tagline: RFIC passive design in the browser. Layout generation with real-time preview.
group: fields
order: 7
site: rapidpassives.org|https://rapidpassives.org
license: open source / fully client-side
cta1: [ Open RapidPassives -> ]|https://rapidpassives.org
---

RapidPassives is a browser-based layout generator and viewer for RFIC passive
components. Configure geometry, preview in real time with GPU-accelerated 2D
and 3D rendering, and export production-ready GDS-II directly from the
browser. Everything runs client-side: no upload, no account, no data leaving
the machine.

![rapidpassives.org|right|46x14](/screenshots/rapidpassives-org.png)

## Generators and viewer

Geometry generators cover spiral and symmetric inductors, interleaved and
stacked transformers, MOM capacitors, patch antennas, and rat-race couplers,
with aspect ratio control that preserves corner geometry. Antennas and
couplers auto-design from frequency: input GHz and substrate, get computed
dimensions. The GDS-II viewer imports files by drag-and-drop, parses them in
a Web Worker, and holds 60 fps on million-polygon files in the
instanced-WebGL renderer. Five PDK presets are unified across generators,
viewer, and embed: SKY130, SG13G2, GF180MCU, ASAP7, FreePDK45.

## Embeddable viewer

The 3D GDS viewer ships as a web component, one script tag on any website:

```html
<script src="https://rapidpassives.org/embed/gds-viewer.js"></script>
<gds-viewer src="layout.gds" rotate explode></gds-viewer>
```

Layer colors, z-positions, and thickness are configurable per GDS layer; the
tiles on this site use exactly this component.

## History

RapidPassives grew out of my master's work on compact modeling and layout
generation of RFIC passives (inductors, transformers, baluns) and became the
seed of the whole fields level of the stack: the layouts it generates are
what [RapidMoM](/stack/rapidmom/) simulates. The public repository dates to
October 2024.
