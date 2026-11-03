---
title: RapidMoM
accent: rapidpassives
tagline: Full-wave Method of Moments for planar layouts in layered media.
group: fields
order: 5
license: proprietary / commercial and source licenses
cta1: [ Request evaluation -> ]|mailto:rapidmom@milanrother.com?subject=RapidMoM%20evaluation
---

RapidMoM is a full-wave solver for the passive structure of RF circuits: the
metal of a chip or a board in its layered stack, read from GDS. It computes
the network of that structure at its ports, S, Y and Z from DC up, and the
current and charge on every conductor that the network comes from.

## A complete block

![180 GHz power amplifier: mesh, charge and current|116x56|contain](/images/rapidmom-block.png)

A 180 GHz four-way power amplifier from IHP's open SG13G2 tape-outs, taken as
drawn. Every metal level is meshed and every transistor terminal and pad is a
port: 56 ports, 230,945 unknowns. One frequency is one exact solve, 27
minutes on 16 threads. Charge and current are that solve with the input
driven, on log scales: the signal path stands out of the ground.

## Devices

![Spiral inductor|57x22|contain](/images/rapidmom-spiral.png)
![Transformer|57x22|contain](/images/rapidmom-transformer.png)

![MOM capacitor|57x22|contain](/images/rapidmom-momcap.png)
![Patch array and its far field|57x22|contain](/images/rapidmom-patch-array.png)

The conductor model is chosen per metal: one sheet for thin wiring and grids,
both faces, or faces and side walls where skin and proximity effects decide
the loss. The far field comes from the same layered Green's function as the
solve, so substrate and ground shape the pattern.

## Under the hood

![Wall time of a solve over its unknowns|right|46x15|contain](/images/rapidmom-scaling.png)

A mixed-potential integral equation in augmented form, accurate down to DC.
The Green's functions of a stack are tabulated once and reused across devices
and frequencies. The system is compressed into an H-matrix and solved by
block GMRES for all ports at once, preconditioned by a sparse LU of the near
field from [RSLAB](/stack/rslab/); a solve grows as N log N. Written in Rust,
used from Python, a command line or a project file.

## History

The first prototypes of a 2D Method of Moments date from March 2026; development
proper started in June 2026, in the same push that produced
[RapidMesh](/stack/rapidmesh/) and [RSLAB](/stack/rslab/): the planar solver,
its mesher and its linear algebra grew together as one vertically integrated
unit.
