---
title: RapidMoM
accent: rapidpassives
tagline: Full-wave Method of Moments for planar layouts in layered media.
group: fields
order: 5
license: early access / free for academia / commercial licenses
cta1: [ Request evaluation -> ]|mailto:rapidmom@milanrother.com?subject=RapidMoM%20evaluation
---

RapidMoM is a full-wave Method-of-Moments solver for planar layouts in
layered media, on RF ICs and PCBs: inductors, transformers, capacitors, lines,
filters and printed antennas on a real process stack. The formulation is a
mixed-potential surface integral equation, set up as an A-EFIE saddle-point
system against the low-frequency breakdown. The Green's functions of the
stack are tabulated from their spectral form once per stack and band. The
metal is meshed quad-dominant, with rooftops on the rectangles and RWG
functions on the triangles, and the system is solved by GMRES on an H-matrix
compressed with ACA, preconditioned by a sparse LU of the near field from
[RSLAB](/stack/rslab/).

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

## Converging the network

![Transformer mesh|right|46x14](/images/rapidmom-mesh.png)

A GMRES residual bounds the algebraic error, but a port observable can be a
small difference of large quantities, a quality factor for instance. The port
network is therefore read through a residual-corrected Galerkin functional:
its error is quadratic in the solver error, and the network is reciprocal by
construction. On top of that the solve continues down a tolerance ladder,
warm-started, until the S-parameters stop moving.

## Ports

A port is a voltage source across a gap between two contacts, each an
oriented segment on a metal layer. The current distribution over the
cross-section, edge singularity and skin crowding included, comes out of the
solve. Cuts across a line, differential gaps, vertical probes against the
ground and ports between two conductors all come from this one primitive, and
all of them are ideal: a zero-length source at the metal, nothing to
de-embed.

Calibrated ports remove what an ideal source at an abrupt line end still
sees, the end fringing and the field it launches. Each terminal is extended
by a line of its own cross-section, driven by a gap at the far end with an
absorber behind it, and the extension is de-embedded with a line standard
solved by the same solver. Terminals running side by side form one coupled
group. The reference plane is the drawn terminal.

## Two conductor models

![Current density|left|46x14](/images/rapidmom-current.png)

Every metal layer solves through one of two models on the same kernel,
H-matrix and ports. The thin model is one current sheet per metal with the
skin-effect surface impedance of the slab, the right choice wherever the
thickness is small against the lateral features. The thick model carries the
top and bottom faces of a conductor, coupled through the metal by the exact
slab impedance, and its side walls; faces and walls share one surface
admittance operator of the rectangular cross-section. Skin and proximity
effect across the thickness and the current crowding into the corners come
out of the solve.

## Capacitance without the full-wave solve

The A-EFIE saddle carries both potentials, the vector potential in the edge
currents and the scalar potential in the patch charges. A capacitance
depends on the scalar potential alone, so dropping the magnetic half leaves a
system in the charges that gives the Maxwell C and G matrices over the
galvanic nets of a design directly, on the same mesh, Green's function and
preconditioner, with the charges as the only unknowns. The result reports its
own electrical size and the frequency up to which the quasi-static answer
holds.

## Sweeps and far field

An adaptive sweep solves a few frequencies exactly and fits a set-valued AAA
rational model through them. The next solve goes where a leave-one-out
estimate says the model is least certain, and passivity is checked at every
requested frequency. The number of solves follows the response rather than
the frequency grid, and the model gives S anywhere in the band.

The far field of any excitation comes from every current of the solution
through the layered Green's function at the far-field wavenumber, so
substrate, ground and stack shape the pattern. Out of it come the pattern and
its cuts, directivity, gain and realized gain, radiated and surface-wave
power, and the radiation efficiency.

## Against measurement

![IHP SG13G2 inductors L2n0 and L6n2 against the on-wafer measurement, thick model solid, thin model dashed|center|114x30|contain](/images/rapidmom-sg13g2.png)

The reference is the IHP SG13G2 test structures of the
[em-reference-suite](https://github.com/milanofthe/em-reference-suite),
measured on wafer and de-embedded by IHP. The inductors L2n0 and L6n2 are
solved with an adaptive sweep on both conductor models, with TopMetal1 and
TopMetal2 as thick conductors in the thick runs. The plot shows inductance and
quality factor of the winding against the measurement.

## Evaluation kit

![Inductors of the evaluation kit, IHP SG13G2, thick model solid, thin sheet model dashed|center|114x30|contain](/images/rapidmom-inductors.png)

![Transformers of the evaluation kit, IHP SG13G2, thick model solid, thin sheet model dashed|center|114x20|contain](/images/rapidmom-transformers.png)

The evaluation kit solves each of its devices on both conductor models:
inductors, transformers, MIM and MOM capacitors, lines and a rat-race coupler
on IHP SG13G2 and SkyWater SKY130, and a stripline lowpass, a coupled-line
bandpass and a via transition on PCB. Each comes with its layout GDS, the
stack, the Touchstone files, the solver logs and a script that rebuilds it
with the Python API, so every result can be reproduced in another EM tool and
compared. Behind it sit
closed-form physics checks, exact invariants (Lorentz reciprocity, mutual
signs, the skin-effect rise) and 2D referees for the conductor models.

## Built for sweeps

Pure Rust with no BLAS or LAPACK, and a Python API packaged as a
pip-installable wheel. The rapidmom binary runs a job without Python, for
containers and cloud dispatch, and predicts the peak memory of a solve before
it starts. Results go out as Touchstone. The interactive viewer shows the
geometry, the mesh, the currents per frequency, port and phase, and the 3D
far-field pattern, in a native window, the browser or a Jupyter cell.

## History

RapidMoM development started in June 2026, in the same push that produced
[RapidMesh](/stack/rapidmesh/) and [RSLAB](/stack/rslab/): the planar solver,
its mesher, and its linear algebra grew together as one vertically integrated
unit. The solver is in early access for evaluation.
