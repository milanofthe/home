---
title: RapidMesh
accent: rapidpassives
tagline: 2D and 3D mesh generation for electromagnetic FEM and MoM in pure Rust.
group: foundations
order: 10
site: mesh.rapidpassives.org|https://mesh.rapidpassives.org
repo: github.com/milanofthe/rapidmesh|https://github.com/milanofthe/rapidmesh
license: open source
cta1: [ Open RapidMesh -> ]|https://mesh.rapidpassives.org
---

![Box minus two spheres|right|40x12](/images/rapidmesh-box-2spheres.png)

RapidMesh is a tetrahedral mesh generator for 3D electromagnetic FEM with a
first-class 2D path for 2.5D MoM solvers, in pure Rust. Primitives, booleans,
fillets and imported meshes assemble into one model through an exact
arrangement, with no float snapping. The resulting B-rep carries the true
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

## Scale

![Four passive layouts in one dielectric, cutaway|left|46x14](/images/rapidmesh-chip.png)

A chip is thousands of conductors in one dielectric, and a region is the unit
the stages parallelize over. Large models are therefore cut into blocks by
planes through the gaps between structures. The cuts go into the exact
arrangement, their faces are meshed like any other, and every block is
meshed in parallel; afterwards the cuts disappear.

Nine tiles of passive layouts (2.75 million tets) take 8 s on eight threads
at 334 bytes per tet. gmsh needs 25 s and 1.6 GB for half as many tets, or
20 s and 1.1 GB with its parallel HXT mesher. On the 23 comparison
geometries RapidMesh takes under half of gmsh's time and has the better
smallest dihedral angle on 22.

## The 2D path

![Symmetric transformer, MoM surface mesh|right|40x12](/images/rapidmesh-transformer.png)

The planar mesher serves MoM: graded, sliver-free constrained Delaunay
triangulation of tagged polygons with holes, with the RWG edge topology in
the same bundle. A target_count budget sets the size so the mesh lands near
the requested triangle count across all metal layers:

```python
import rapidmesh as rm

layers = rm.mesh_layers(groups, sizing, target_count=20_000)
# points, tris, tags, RWG edges and boundary topology per layer
```

## The corpus

![mesh.rapidpassives.org|left|46x14](/screenshots/rapidmesh-site.png)

A corpus of 196 geometries is meshed on every change and compared with a
stored baseline for watertightness, slivers and fidelity to the input.
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
3D path went from behind gmsh to ahead of it.
