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
and the far field, for single devices and for blocks with many ports.

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

![LNA, mesh on seven metal levels|57x22|contain](/images/rapidmom-lna-mesh.png)
![LNA, current density at 28 GHz|57x22|contain](/images/rapidmom-lna-current.png)

A synthetic two-stage cascode LNA with a transformer balun at 28 GHz on IHP
SG13G2, 799 x 532 um on all seven metal levels: pads, spirals, capacitor
stacks, bias and supply lines and a ground grid. Transistors, current mirrors
and resistors are ports, 23 in all. TopMetal1 and TopMetal2 run as
faces+walls/faces+walls, Metal5 as shared/faces and Metal1 to Metal4 as
mid/mid, 63,624 unknowns. The adaptive sweep from DC to 40 GHz over 161
frequencies took 19 exact solves and 28 min, 30.3 GB peak, on 8 threads of an
AMD Ryzen 9 9900X. The current density is the exact solve at 28 GHz with the
input and both stage outputs driven.

## Conductor model and adaptive sweep

Stacks have named dielectrics, metals and via levels; IHP SG13G2 and SkyWater
SKY130 ship with the solver, and GDS is read through the stack's layer map.
The conductor model is set per metal, as the surfaces that carry current and
charge: shared/faces by default, faces+walls/faces+walls for skin, proximity
and edge crowding, mid/mid for grids and shields. Calibrated ports put the
reference plane at the drawn terminal and remove the feed with a line
standard.

![Adaptive sweep, 2 x 2 patch array, 8 to 12 GHz|57x22|contain](/images/rapidmom-sweep-band.png)
![Adaptive sweep, its narrowest resonance|57x22|contain](/images/rapidmom-sweep-zoom.png)

The sweep fits a rational model through a few exact solves and adds solves
where leaving one out changes the model most, until the change is below tol.
Each solve also returns the poles of its system nearby, so a resonance
narrower than the gap between solves is found and sampled on both sides. On
the kit's patch array (5,943 unknowns, 401 candidates from 8 to 12 GHz) the
leave-one-out estimate alone stops after 9 solves and misses the narrow dips;
with the resonance finder, 26 solves meet tol at every candidate.

## Evaluation kit

![Spiral inductor, IHP SG13G2|57x22|contain](/images/rapidmom-spiral.png)
![MIM capacitor, IHP SG13G2|57x22|contain](/images/rapidmom-mimcap.png)

![2 x 2 patch array, current density|57x22|contain](/images/rapidmom-patch-current.png)
![2 x 2 patch array, far field|57x22|contain](/images/rapidmom-patch-farfield.png)

Ten devices on SG13G2, SKY130 and RF boards: inductors, a transformer, MIM and
MOM capacitors, coupled lines, two filters and the patch array. Each comes
with its project file, layout GDS, Touchstone with calibrated ports, solver
log and a rebuild script, for comparison with another EM tool. The renders
show faces+walls/faces+walls with port 1 driven. The far field comes from the
layered Green's function, so the stack shapes the pattern; the power budget
splits the incident power into radiated, surface wave, loss and reflected.

## Against measurement

![Inductance against measurement|57x22|contain](/images/rapidmom-sg13g2-l.png)
![Quality factor against measurement|57x22|contain](/images/rapidmom-sg13g2-q.png)

The reference is the IHP SG13G2 test structures of the
[em-reference-suite](https://github.com/milanofthe/em-reference-suite),
measured on wafer and de-embedded by IHP. The octagonal inductors L2n0 and
L6n2 are solved from DC to 50 GHz with TopMetal1 and TopMetal2 on
faces+walls/faces+walls and on shared/faces, 883 to 4,132 unknowns and 9 to
27 exact solves per sweep. L and Q come from the differential impedance, over
the band and past the self-resonance.

## Under the hood

A mixed-potential integral equation in A-EFIE form, valid down to DC, on
Green's functions tabulated once per stack and band. Block GMRES on an
H-matrix compressed with ACA, preconditioned by a sparse LU of the near field
from [RSLAB](/stack/rslab/), in O(N log N). An exact solve of a 4 x 4 patch
array with 81,779 unknowns takes 130 s on 16 threads of an AMD EPYC 9B14,
11.3 GB peak. Pure Rust, with a Python API, a command line and TOML project
files.

## History

The first prototypes of a 2D Method of Moments date from March 2026; development
proper started in June 2026, in the same push that produced
[RapidMesh](/stack/rapidmesh/) and [RSLAB](/stack/rslab/): the planar solver,
its mesher and its linear algebra grew together as one vertically integrated
unit.
