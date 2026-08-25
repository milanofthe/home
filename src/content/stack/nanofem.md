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

nanofem solves the time harmonic curl-curl equation for the electric field with
first order Nedelec edge elements on tetrahedra and reports scattering
parameters at lumped ports, in one Rust source file capped at 1000 lines of
code. The mesh comes from Gmsh and the setup is a text deck that maps physical
group names to materials, boundaries and ports. Perfect electric conductors, a first order absorbing
boundary, perfectly matched layers, magnetic symmetry planes, dielectric loss,
volume conductivity and conductor sheets with the skin effect all fit.

## Three decisions buy the room

![Patch antenna mesh, cut at the feed|right|46x15|contain](/images/nanofem-mesh.png)

Sorting the mesh vertices on input makes every local edge run from the lower to
the higher global node. Neighboring elements then agree on their Whitney
functions by construction, which is what keeps orientation signs out of the
assembly, the ports and the field export alike.

Every matrix entry carries four coefficients against the basis 1, k0, k0 squared
and the square root of k0. A loss tangent, a volume conductivity and a conductor
sheet with its square root surface resistance all land on one of those four, so
a sweep assembles once no matter how many loss mechanisms are in the model.

Storing the PML stretch separately from the permittivity lets the conduction
current reuse the mass entry instead of building a second one.

![Field cut at the resonance|left|46x15|contain](/images/nanofem-field.png)

The system is complex symmetric and solved directly: geometric nested
dissection, then a sparse LDLT, equilibrated with the inverse square root of the
diagonal, which cuts the pivot spread by more than a factor of six at low
frequency. One step of iterative refinement per solve against the unscaled
matrix follows, so the reported residual is measured.

## History

I already had [RapidFEM](/stack/rapidfem/) for the production work, which is a
much larger body of code. nanofem was the other direction: see how far 1000
lines get you, and end up with something you can actually read, because there is
simply less of it. It ended at 954.

The report is sized to match, short enough to read next to the code in a day. It
derives the formulation, maps it to the code section by section, and lists what
was left out and why.

[nanospice](/stack/nanospice/) asks the same question of circuit simulation.
