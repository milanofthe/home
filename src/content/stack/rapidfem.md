---
title: RapidFEM
accent: rapidpassives
tagline: Open-source Maxwell FEM in Rust. Frequency and time domain behind one Python API.
group: fields
order: 6
site: fem.rapidpassives.org|https://fem.rapidpassives.org
license: open source / pip install rapidfem
cta1: [ Open the notebook -> ]|https://fem.rapidpassives.org/notebook?example=fd_iris_filter
---

RapidFEM is an open-source Maxwell FEM solver in Rust with two backends behind
one Python API: frequency-domain edge elements and time-domain discontinuous
Galerkin. It is scale-invariant from sub-micron RFIC structures to metre-scale
antennas, with validated examples from microstrips to horn antennas.

![Iris filter notebook|right|46x14](/screenshots/rapidfem-editor.png)

Wheels ship for Windows, Linux, and macOS: pip install rapidfem and you have
a full-wave solver, no vendor install, no license server. A local notebook UI
provides interactive geometry, mesh, and field renderers, so a simulation
setup is inspectable at every stage instead of a black box behind a job
queue.

## In the stack

RapidFEM is the general field level, complementing the planar-specialized
[RapidMoM](/stack/rapidmom/). It meshes with [RapidMesh](/stack/rapidmesh/)
and solves on [RSLAB](/stack/rslab/), the same deterministic numerical
foundations as the rest of the stack.
