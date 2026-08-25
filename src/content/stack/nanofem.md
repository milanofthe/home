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

![The reference antenna, cut open at the feed|right|46x15|contain](/images/nanofem-mesh.png)

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

![The field of the antenna at its resonance|left|46x15|contain](/images/nanofem-field.png)

The system is complex symmetric and solved directly: geometric nested
dissection, then a sparse LDLT, equilibrated with the inverse square root of the
diagonal, which cuts the pivot spread by more than a factor of six at low
frequency. One step of iterative refinement per solve against the unscaled
matrix follows, so the reported residual is measured.

## History

I already had [RapidFEM](/stack/rapidfem/), a production Maxwell solver: two
backends, modal ports, and the machinery to mix first and second order elements
within one mesh. It is a lot of code, and that is what it costs to be that
solver. nanofem was the other direction: see how far 1000 lines get you, and
end up with something readable because there is simply less of it. [nanospice](/stack/nanospice/) had answered
the same question for circuits a few days earlier.

Circuit simulation is a settled algorithm set and the work is fitting it; a
field solver spends the budget elsewhere. The linear algebra is the largest
block at 213 lines for the ordering and the factorization, the mesh reader and
the deck parser are another 175, and the three decisions above are what left
room for the physics.

The final count is 954 of 1000. The report lists what the remaining 46 would not
have bought, with estimates: second order elements at 150 to 190 lines, modal
waveguide ports and a supernodal factorization at 200 each, adaptive refinement
at 100. The report itself is sized like the solver, short enough to read next to
it in a day.
