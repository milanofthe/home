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

RapidFEM is an electromagnetic FEM solver written in Rust, distributed as a
Python package. Two backends sit behind one geometry / material / physics API:
a frequency-domain solver (Nedelec curl-conforming edge elements,
complex-symmetric sparse linear algebra) and a time-domain DGTD solver (nodal
discontinuous Galerkin with Krylov/ETD exponential time integration and model
order reduction). Geometry is non-dimensionalized before assembly, so
sub-micron RFIC passives and metre-scale antennas use the same numerical path.

```python
import numpy as np
import rapidfem as rf

g = rf.Geometry(maxh=rf.lambda_maxh(f_max=12e9))
air = g.box(22.86e-3, 10.16e-3, 30e-3,
            position=(-11.43e-3, -5.08e-3, 0), material=rf.Air())

rf.RectWaveguidePort(air.faces.min(axis="z"))
rf.RectWaveguidePort(air.faces.max(axis="z"))
rf.PEC(*air.faces.unassigned)
g.mesh()

prob = rf.Problem(g)
result = prob.sweep(np.linspace(8e9, 12e9, 21))
# the same Problem also drives eigenmode solves and far-field patterns
```

## Practical by default

![Iris filter notebook|right|46x14](/screenshots/rapidfem-editor.png)

Distribution is deliberately boring: pip install rapidfem ships
ahead-of-time compiled wheels for Windows, Linux, and macOS. No Rust
toolchain, no vendor install, no license server. External CAD comes in as
STEP, IGES, or BREP and lands in the same geometry kernel as the primitives,
so imported parts take booleans, transforms, and physics exactly like a
g.box(); STL is healed into a meshable solid. For RFIC work, process stacks
and GDS layouts become 3D geometry via rapidfem.rfic. Validated end-to-end
examples ship with the package, from microstrips and coupled lines through
iris and stepped-impedance filters to patch, Vivaldi, and inverted-F
antennas, pyramidal horns, dielectric resonators, and on-chip passives.

A local notebook UI provides a code editor with interactive geometry, mesh,
and field renderers, so a simulation setup is inspectable at every stage
instead of a black box behind a job queue.

## History

RapidFEM began in April 2026 as a port of Robert Fennis' emerge project and
has since been completely reimplemented: a fresh solver core, first-order
elements, and the DGTD time-domain backend built next to the frequency-domain
solver, plus the notebook UI and the RFIC path. Meshing and linear algebra
currently come from gmsh and PARDISO; moving onto
[RapidMesh](/stack/rapidmesh/) and [RSLAB](/stack/rslab/) is where the stack
is heading.
