---
title: nanofem
accent: neutral
tagline: A 3D finite element electromagnetic field solver in one Rust file, capped at 1000 lines of code.
group: reading
order: 31
repo: github.com/milanofthe/nanofem|https://github.com/milanofthe/nanofem
license: MIT open source
cta1: [ View on GitHub -> ]|https://github.com/milanofthe/nanofem
---

![The reference antenna, cut open at the feed|right|46x15|contain](/images/nanofem-mesh.png)

nanofem solves the time harmonic curl-curl equation for the electric field with
first order Nedelec edge elements on tetrahedra and reports scattering
parameters at lumped ports, in one Rust source file capped at 1000 lines of
code. The mesh comes from Gmsh and the setup is a text deck that maps physical
group names to materials, boundaries and ports, so the geometry stays in the
mesher. Perfect electric
conductors, a first order absorbing boundary, perfectly matched layers, magnetic
symmetry planes, dielectric loss, volume conductivity and conductor sheets with
the skin effect all fit.

Three decisions carry most of the weight. Sorting the mesh vertices on input
makes every local edge run from the lower to the higher global node, so
neighboring elements agree on their Whitney functions by construction and no
orientation sign appears in the solver. Holding four frequency coefficients per
matrix entry, against the basis 1, k0, k0 squared and the square root of k0,
keeps the assembly at one pass for a whole sweep even with three loss mechanisms
in the model. Storing the layer stretch separately from the permittivity lets
the conduction current reuse the mass entry.

![The field of the antenna at its resonance|left|46x15|contain](/images/nanofem-field.png)

The system is complex symmetric and solved directly: geometric nested
dissection, then a sparse LDLT, equilibrated with the inverse square root of the
diagonal, which cuts the pivot spread by more than a factor of six at low
frequency. One step of iterative refinement per solve against the unscaled
matrix makes the residual measured rather than assumed.

Two models come with it. An edge fed 2.45 GHz patch antenna terminated by a
perfectly matched layer, 37676 tetrahedra at 3.7 s per frequency, resonating at
2.50 GHz against a design value of 2.45. And a shielded microstrip line with a
lumped port at each end, 22775 tetrahedra, 8.1 s for a 21 point sweep.

Not in it: modal waveguide ports, adaptive refinement, elements beyond first
order, dispersive materials.

## History

A side project, to see how far 1000 lines of code get you, this time for fields
rather than circuits. The report that came out of it derives the formulation,
explains every design decision the budget forced, and maps both to the code
section by section.

[nanospice](/stack/nanospice/) is the circuit simulator that came first.
