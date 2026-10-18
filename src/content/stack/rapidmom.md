---
title: RapidMoM
accent: rapidpassives
tagline: Full-wave Method of Moments for planar layouts in layered media.
group: fields
order: 5
license: proprietary / commercial and source licenses
cta1: [ Request evaluation -> ]|mailto:rapidmom@milanrother.com?subject=RapidMoM%20evaluation
---

RapidMoM is a full-wave electromagnetic solver for planar layouts in layered
media, on RF ICs and boards. From a layout and its process stack it computes
S, Y and Z over a band as Touchstone, the current density on every conductor
and the far field, for single devices and for whole blocks with many ports.

```python
import numpy as np
import rapidmom as rm

rm.set_length_unit("um")
stack = rm.Stack.load("ihp-sg13g2", conductor={
    "TopMetal1": "faces+walls/faces+walls",    # per metal, default "shared/faces"
    "TopMetal2": "faces+walls/faces+walls",
})
prob = rm.Problem(stack, cell=5, mesh_freq=40e9).add_gds("spiral.gds")
prob.add_port(rm.Port("P1", "TopMetal2", (75, 6.5), grounded=True, calibrated=True))
prob.add_port(rm.Port("P2", "TopMetal1", (75, -6.5), grounded=True, calibrated=True))
prob.setup_tables(fmin=1e9, fmax=40e9, store="sg13g2.gf")   # Green's function tables

f = np.r_[0.0, np.linspace(1e9, 40e9, 157)]                  # DC and the band
res = prob.sweep_adaptive(f, tol=1e-3)
res.to_touchstone("spiral.s2p")
prob.show(res)                                               # mesh and currents
```

## A 23-port LNA block

![LNA mesh, seven metal levels|57x17|contain](/images/rapidmom-lna-mesh.png)
![Current density at 28 GHz, three ports driven|57x17|contain](/images/rapidmom-lna-current.png)

A synthetic two-stage cascode LNA with a transformer balun at 28 GHz on IHP
SG13G2, 799 x 532 um on all seven metal levels, with pads, spirals, capacitor
stacks, bias and supply lines and a ground grid. Transistors, mirrors and
resistors are ports, 23 in all. TopMetal1 and TopMetal2 run as
faces+walls/faces+walls, Metal5 as shared/faces, Metal1 to Metal4 as mid/mid:
63,624 unknowns. DC to 40 GHz at 161 frequencies took 19 exact solves, 28 min
and 30.3 GB peak on 8 threads of an AMD Ryzen 9 9900X.

## Stack, conductors and ports

Stacks have named dielectrics, metals and via levels; IHP SG13G2 and SkyWater
SKY130 ship with the solver. GDS is read through the stack's GDS layers. The
conductor model is a composition per metal, the surfaces that carry current
and charge: shared/faces by default, faces+walls/faces+walls for skin,
proximity and edge crowding, mid/mid for grids and shields. Set per layer, it
spends unknowns where the current distribution matters, or isolates one effect
between two runs. Ports go at a point, a segment or a GDS label; calibrated
ports put the reference plane at the drawn terminal, the feed extension
de-embedded with a line standard.

## Adaptive sweep

![Adaptive sweep on the 2x2 patch array of the kit, with and without the resonance finder|center|114x30|contain](/images/rapidmom-adaptive-sweep.png)

The sweep, from DC to the top of the band, fits a rational model through a
few exact solves and adds solves where leaving one out changes the model most,
until the change is below tol. Each solve also finds the poles of its system nearby, so a
resonance narrower than the gap between solves is found and sampled on both
sides. On the kit's patch array (5,943 unknowns, 401 candidates), the
estimate alone stops after 9 solves and misses all four dips; with the
resonance finder, 26 solves meet all four within tol.

## Far field and viewer

![2x2 patch array, current at 9.9 GHz|51x17|contain](/images/rapidmom-patch-current.png)
![Realized gain and power budget|63x17|contain](/images/rapidmom-patch-farfield.png)

The far field comes from the layered Green's function, so the stack shapes the
pattern: cuts, directivity, gain, realized gain and the power budget, for any
drive, including a steered array. The interactive viewer shows mesh, currents
per frequency, port and phase, and the 3D pattern, in a window, a browser or a
Jupyter cell; the renders here come from its headless renderer.

## Evaluation kit

![Spiral inductor, IHP SG13G2, 2 GHz|53x17|contain](/images/rapidmom-spiral.png)
![MIM capacitor, IHP SG13G2, 2 GHz|61x17|contain](/images/rapidmom-mimcap.png)

Ten devices on SG13G2, SKY130 and RF boards: inductors, a transformer, MIM and
MOM capacitors, coupled lines, two filters and the patch array. Each has its
project file, layout GDS, Touchstone with calibrated ports, solver log and a
rebuild script, for comparison with another EM tool.

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

## Under the hood

A mixed-potential integral equation in A-EFIE form, valid down to DC, on
Green's functions tabulated once per stack and band. Block GMRES on an
H-matrix compressed with ACA, preconditioned by a sparse LU of the near field
from [RSLAB](/stack/rslab/); N log N, measured up to 100 k unknowns. An exact
solve of a 4x4 patch array with 81,779 unknowns takes 130 s on 16 threads of
an AMD EPYC 9B14, 11.3 GB peak. The peak memory of a solve is known before it starts.
Pure Rust, with a Python API, a command line and TOML project files.

## History

RapidMoM development started in June 2026, in the same push that produced
[RapidMesh](/stack/rapidmesh/) and [RSLAB](/stack/rslab/): the planar solver,
its mesher and its linear algebra grew together as one vertically integrated
unit.
