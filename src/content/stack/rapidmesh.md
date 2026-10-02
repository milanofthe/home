---
title: RapidMesh
accent: rapidpassives
tagline: Tetrahedral and surface meshes for FEM and FVM in pure Rust.
group: foundations
order: 10
site: mesh.rapidpassives.org|https://mesh.rapidpassives.org
repo: github.com/milanofthe/rapidmesh|https://github.com/milanofthe/rapidmesh
license: open source
cta1: [ Open RapidMesh -> ]|https://mesh.rapidpassives.org
---

![Box minus two spheres|right|40x12](/images/rapidmesh-box-2spheres.png)

RapidMesh is a tetrahedral and surface mesh generator for finite element and
finite volume solvers, in pure Rust. Primitives, booleans, fillets, STEP files
and imported meshes assemble into one model through an exact arrangement, with
no float snapping. The resulting B-rep carries the true
surfaces (quadrics, tori, extrusions, revolutions, NURBS), and the mesh is
measured against those, not against their facets.

![Dielectric resonator, cutaway|left|40x14](/images/rapidmesh-resonator.png)

Meshing runs bottom-up: corners, edges, faces, then each region on its own.
Every level is final before the next one uses it, so neighbours share their
triangles by construction. Each region is filled by its constrained Delaunay
tetrahedralization, grown from its boundary after every boundary segment has
been split until it is strongly Delaunay. Refinement adds the interior
points, and a local improver removes the last bad tets.

![Luneburg lens, seven shells|right|40x14](/images/rapidmesh-luneburg.png)

Multi-material models are what this was built for. A Luneburg lens is seven
nested shells, each its own region. Every interface is one face of the
B-rep, meshed once and shared by the regions on both sides, so the solver
never sees a crack that is not in the geometry.

## What a solver gets

![NIST test part FTC-10, read from STEP|right|40x12](/images/rapidmesh-step-part.png)

The mesh comes with what a solver otherwise rebuilds: edge and face topology
with orientation signs, the B-rep entity every node, edge and face lies on,
and named sets for materials, ports and boundary conditions. For finite
elements it comes in second order too, every mid-edge node on the true surface
or curve; on a unit ball that takes the volume error from 2.9 % to 0.01 %. For
finite volumes the tets, or the polyhedral cells of their median dual at a
third to a quarter of the count, go out as an OpenFOAM polyMesh, with the
non-orthogonality and skewness checkMesh would report:

```python
mesh = g.mesh()
mesh.write_foam("case", polyhedral=True)  # OpenFOAM, polyhedral cells
mesh.write_inp("part.inp", order=2)       # CalculiX / Abaqus, tet10
mesh.write_msh("part.msh", order=2)       # gmsh, second order
```

## The corpus

![mesh.rapidpassives.org|left|46x14](/screenshots/rapidmesh-site.png)

A corpus of 223 geometries, CAD parts from STEP files among them, is meshed
on every change, compared with a stored baseline for watertightness, slivers
and fidelity to the input, and rendered. Against gmsh on 27 of them,
RapidMesh takes half the time and has the better smallest dihedral angle on
all 27.
Solvers use RapidMesh in-process: one call returns the mesh with the
topology, signs and named sets they need, and a new budget is one more call.

## History

The first mesher I wrote was a 2D QuadTree in 2023, for a quasi-electrostatic
finite volume solver of mine. It was written against one solver, which is how
RapidMesh is built too.

RapidMesh started in June 2026 to replace gmsh inside the stack. The first
versions refined one restricted Delaunay triangulation of the whole model
and recovered the boundary afterwards; conformity stayed approximate. The
bottom-up mesher replaced it at the end of September 2026, and with it the
3D path went from behind gmsh to ahead of it. In October 2026 RapidMesh
widened from electromagnetics to FEM and FVM in general, and its planar path
moves into RapidMoM.
