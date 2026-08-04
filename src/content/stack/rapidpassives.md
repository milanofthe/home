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

RapidPassives is a browser-based design tool for RFIC passives: inductors,
transformers, baluns. Layout generation with real-time preview, GDS export,
and a custom instanced-WebGL viewer that renders million-polygon external GDS
files at 60 fps. Everything runs fully client-side: no upload, no account, no
data leaving the machine.

![rapidpassives.org|right|46x14](/screenshots/rapidpassives-org.png)

Technology presets cover SKY130, SG13G2, GF180MCU, ASAP7, and FreePDK45. The
project started during my master's work on compact modeling and layout
generation of RFIC passives and became the seed of the whole fields level of
the stack.

## In the stack

RapidPassives is the design frontend of the fields level: the layouts it
generates are exactly what [RapidMoM](/stack/rapidmom/) simulates.
