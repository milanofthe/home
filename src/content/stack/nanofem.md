---
title: nanofem
accent: neutral
tagline: A 3D finite element electromagnetic field solver under the same 1000 line cap.
group: reading
order: 31
repo: github.com/milanofthe/nanofem|https://github.com/milanofthe/nanofem
license: MIT open source
cta1: [ View on GitHub -> ]|https://github.com/milanofthe/nanofem
---

nanofem solves the time harmonic curl-curl equation for the electric field with
first order Nedelec edge elements on tetrahedra and reports scattering
parameters at lumped ports. One Rust source file, no dependencies outside the
standard library, and the same test that counts nonblank, noncomment lines and
fails above 1000. The current count is 954.

The mesh comes from Gmsh. The setup is a small text deck that maps physical
group names to materials, boundaries and ports, so the geometry stays in the
mesher and the solver stays a solver.

## What fits in 1000 lines

![The reference antenna, cut open|right|46x15|contain](/images/nanofem-mesh.png)

Perfect electric conductors, a first order absorbing boundary, perfectly matched
layers, magnetic symmetry planes, dielectric loss, volume conductivity, conductor
sheets with the skin effect, lumped ports with scattering, impedance, admittance
and inductance output, and field export.

Three decisions carry most of the weight. Sorting the mesh vertices on input
makes every local edge run from the lower to the higher global node, so
neighboring elements agree on their Whitney functions by construction and no
orientation sign appears anywhere in the solver. Holding four frequency
coefficients per matrix entry, against the basis 1, k0, k0 squared and the square
root of k0, keeps the assembly at one pass for an entire sweep even with three
different loss mechanisms in the model. Storing the layer stretch separately from
the permittivity lets the conduction current reuse the mass entry.

The system is complex symmetric and solved directly: a geometric nested
dissection ordering, then a sparse LDLT, equilibrated with the inverse square
root of the diagonal, which cuts the pivot spread by more than a factor of six at
low frequency. Each solve is followed by one step of iterative refinement against
the unscaled matrix, which produces a measured residual rather than an assumed
one.

## What it costs

![The field of the antenna at its resonance|left|46x15|contain](/images/nanofem-field.png)

Twelve integration tests run the release binary against closed form results: a
matched parallel plate line in magnitude and phase, a lossy dielectric line, a
shorted line, a deliberately mismatched port, an absorbing wall and a PML slab
each terminating a wave, a PEC cavity at its analytic mode, a conductive filling,
lossy plates, and a shorted line read as a coil.

Two models come with the repository. An edge fed 2.45 GHz patch antenna
terminated by a perfectly matched layer, 37676 tetrahedra and 41468 unknowns at
3.7 s per frequency, resonating at 2.50 GHz against a design value of 2.45. And a
shielded microstrip line with a lumped port at each end, 22775 tetrahedra, 8.1 s
for a 21 point sweep on eight threads.

Not supported, and listed with estimated line costs in the report: modal
waveguide ports, adaptive refinement, elements beyond first order, dispersive
materials.

## The report

The repository carries a report that derives the formulation, explains every
design decision the budget forced, and maps both to the code section by section.
It is committed as a prebuilt PDF, and the figures in it, the mesh renders and
the field cuts included, regenerate from the release binary with one command.

[nanospice](/stack/nanospice/) is the same exercise for circuits.
