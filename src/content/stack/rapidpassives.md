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

## Generators and viewer

![rapidpassives.org|right|46x14](/screenshots/rapidpassives-org.png)

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

![Instanced-WebGL 3D view|left|46x14](/screenshots/rapidpassives-transformer.png)

Layer colors, z-positions, and thickness are configurable per GDS layer; the
tiles on this site use exactly this component: the rotating transformer on
the front page is a live gds-viewer instance.

## History

RapidPassives grew out of my master's thesis on area optimized modelling of
passive magnetic structures for chip-level integration. Two things from it are
still in the tool: the polygonal winding parametrization, which turns a spiral
inductor into a handful of geometric numbers instead of a drawing, and the
reduction of a full process layerstack to the layers an EM solver needs, which
is what makes the parameter sweeps behind a compact model affordable.

It started as a small Python package with a tkinter GUI, was rebuilt into the
fully client-side browser tool it is today, and became the seed of the whole
fields level of the stack: the layouts it generates are what
[RapidMoM](/stack/rapidmom/) simulates.
