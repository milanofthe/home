---
title: RapidMoM
accent: rapidpassives
tagline: Full-wave Method of Moments for planar layouts in layered media.
group: fields
order: 5
license: early access / free for academia / commercial licenses
cta1: [ Request evaluation -> ]|mailto:rapidmom@milanrother.com?subject=RapidMoM%20evaluation
---

RapidMoM is a full-wave electromagnetic solver for planar layouts in layered
media, on RF ICs and PCBs. It takes a layout and its process stack, from GDS
or from Python, and returns the S-parameters over a band, the currents on
every conductor and the radiation pattern. Inductors, transformers,
capacitors, lines, filters, couplers and printed antennas are the everyday
cases. It also handles the full multi-port layout of a power amplifier's
passive network, not only single devices.

```python
import numpy as np
import rapidmom as rm

rm.set_length_unit("um")
stack = rm.Stack(
    dielectrics=[rm.Dielectric(10.0, rm.Material.dielectric(4.1))],
    metals=[rm.MetalLayer(8.0, 3.0, rm.Conductivity.COPPER, conductor_model="thick")],
    cover_bot=rm.Cover.pec(), cover_top=rm.Cover.open(),
)
prob = rm.Problem(stack, cell=5)
line = [[0, 0], [400, 0], [400, 10], [0, 10]]
prob.add_metal(rm.Metal("M1", 8.0, [{"polygon": line}], thickness=3.0, conductor_model="thick"))
prob.add_port(rm.Port("P1", 0, (0, 5), grounded=True))
prob.add_port(rm.Port("P2", 0, (400, 5), grounded=True))

rm.gfcache.setup(prob, "cache", **rm.gfcache.RFIC)    # Green's function store
res = prob.sweep_adaptive(np.linspace(1e9, 40e9, 157), tol=1e-3)
res.to_touchstone("line.s2p")
prob.show(res)                                        # geometry, mesh, currents
```

Layouts also come from GDS through rapidmom.gds.read_gds with a layer map,
or from polygons through the problem builder of the Rust API.

## S-parameters over the band

An adaptive sweep solves a handful of frequencies exactly and fits a rational
model through them. Each next solve goes where the model is least certain,
passivity is checked at every requested frequency, and the model gives S
anywhere in the band. Results go out as Touchstone.

Each metal is solved as a thin current sheet or as a thick conductor with top
and bottom faces and side walls, declared per layer, so skin and proximity
effect and the current crowding into the edges of thick top metals come out
of the solve. Ports are ideal sources at the metal, or calibrated ports that
remove the end effect of the feed, with the reference plane at the drawn
terminal. Capacitance matrices between named nets come from a quasi-static
extraction on the same mesh, without the full-wave solve.

## Currents and radiation

![Geometry and mesh of a 2x2 patch array|57x17|contain](/images/rapidmom-viewer-mesh.png)
![Current density with port P1 driven|57x17|contain](/images/rapidmom-viewer-currents.png)

The interactive viewer shows the layout as it is solved: metals, nets, ports
and the mesh, with the stack beside it. The current density is shown per
frequency, port and phase, as magnitude or as the time-harmonic current, on a
linear or logarithmic scale; driving one patch of the array shows how much
current it couples into its neighbours. The viewer runs in a native window,
in the browser or inside a Jupyter cell, next to the code that set up the
problem.

![Realized gain, the beam steered by the port phases|left|46x14|contain](/images/rapidmom-viewer-farfield.png)

The far field of any excitation comes from the layered Green's function, so
substrate, ground and stack shape the pattern. Out of it come the pattern and
its cuts, directivity, gain and realized gain, radiated and surface-wave
power and the radiation efficiency. A drive with chosen amplitudes and phases
per port steers an array, and the viewer draws the 3D pattern over the
layout.

## Against measurement

![SG13G2 inductance vs measurement|57x23|contain](/images/rapidmom-sg13g2-l.png)
![SG13G2 quality factor vs measurement|57x23|contain](/images/rapidmom-sg13g2-q.png)

The reference is the IHP SG13G2 test structures of the
[em-reference-suite](https://github.com/milanofthe/em-reference-suite),
measured on wafer and de-embedded by IHP. The inductors L2n0 and L6n2 are
solved with an adaptive sweep on both conductor models, with TopMetal1 and
TopMetal2 as thick conductors in the thick runs. The plots show inductance and
quality factor of the winding against the measurement, over the band and past
the self-resonance.

## Evaluation kit

![Inductors of the evaluation kit, IHP SG13G2, thick model solid, thin sheet model dashed|center|114x30|contain](/images/rapidmom-inductors.png)

![Transformers of the evaluation kit, IHP SG13G2, thick model solid, thin sheet model dashed|center|114x20|contain](/images/rapidmom-transformers.png)

The evaluation kit solves inductors, transformers, MIM and MOM capacitors,
lines and a rat-race coupler on IHP SG13G2 and SkyWater SKY130, and a
stripline lowpass, a coupled-line bandpass and a via transition on PCB, each
on both conductor models. Every device comes with its layout GDS, the stack,
the Touchstone files, the solver logs and a script that rebuilds it with the
Python API, so the results can be reproduced in another EM tool and compared.

## Under the hood

![Transformer mesh|52x17|contain](/images/rapidmom-mesh.png)
![Transformer current density|62x17|contain](/images/rapidmom-current.png)

The solver discretizes a mixed-potential surface integral equation in A-EFIE
form, which avoids the low-frequency breakdown, on Green's functions of the
stack tabulated once per stack and band. The metal is meshed quad-dominant,
and the system is solved by GMRES on an H-matrix compressed with ACA,
preconditioned by a sparse LU of the near field from [RSLAB](/stack/rslab/).
The port network is read through a residual-corrected functional and refined
until the S-parameters stop moving.

Pure Rust with no BLAS or LAPACK, and a Python API packaged as a
pip-installable wheel. The rapidmom binary runs a job without Python, for
containers and cloud dispatch, and predicts the peak memory of a solve before
it starts.

## History

RapidMoM development started in June 2026, in the same push that produced
[RapidMesh](/stack/rapidmesh/) and [RSLAB](/stack/rslab/): the planar solver,
its mesher, and its linear algebra grew together as one vertically integrated
unit. The solver is in early access for evaluation.
