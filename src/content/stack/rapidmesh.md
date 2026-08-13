---
title: RapidMesh
accent: rapidpassives
tagline: 2D and 3D mesh generation for electromagnetic FEM and MoM in pure Rust.
group: foundations
order: 9
site: mesh.rapidpassives.org|https://mesh.rapidpassives.org
repo: github.com/milanofthe/rapidmesh|https://github.com/milanofthe/rapidmesh
license: open source
cta1: [ Open RapidMesh -> ]|https://mesh.rapidpassives.org
---

![Boolean difference, cutaway|right|40x12](/images/rapidmesh-drilled-block.png)

RapidMesh is a tetrahedral mesh generator for 3D electromagnetic FEM with a
first-class 2D path for 2.5D MoM solvers, in pure Rust. Solid primitives
(box, cylinder, sphere, cone, torus, prism, sweep, loft) assemble into a
tagged complex; exact-arithmetic CSG booleans (exact predicates, no float
snapping) produce a non-manifold B-rep with exactly conforming material
interfaces.

![Dielectric resonator, cutaway|left|40x14](/images/rapidmesh-resonator.png)

Meshing is dimensionally hierarchical: corners, then edges, then faces, then
the volume, freezing each level before the next consumes it. Within every
dimension, error-driven adaptive sampling combines with variational point
relaxation for quality: sizing-weighted Lloyd relaxation on edges and faces,
optimal-Delaunay relaxation in the volume, plus sliver exudation and edge
removal targeting the minimal dihedral angle. The frozen surface
triangulation is a hard constraint on the volume Delaunay, which is what
makes the boundary watertight by construction. The sizing and chart formulae
for every curve and surface modality are derived with a computer-algebra
system, not approximated ad hoc.

![Two-region via, cutaway|right|40x12](/images/rapidmesh-via.png)

Multi-region assemblies are the case that separates a mesher from a
triangulator: a coaxial step carries a conductor, a dielectric and a change of
diameter, and the interfaces between them have to be shared triangle for
triangle or the solver sees a crack that is not in the geometry.

![Coaxial step, tagged regions|left|40x12](/images/rapidmesh-coax-step.png)

Meshing is budgeted: mesh(target_elements=N) retunes the global size scale
over a few remeshes, since the element count scales with the third power of
the scale, and lands within a few percent of N while the relative refinement
from curvature and sizing keeps its shape. Surface budgets act as a cap
instead: the count-driven refinement resolves the sizing field but stops at
the triangle budget, split across patches by area, spending its last splits
on the worst-quality triangles. Solvers can plan a mesh the way RSLAB plans
a factorization: the cost is decided before the run, not discovered after.

## The 2D path

![Symmetric transformer, MoM surface mesh|right|40x12](/images/rapidmesh-transformer.png)

The same core that meshes each 3D surface patch is the standalone planar
mesher for MoM: graded, sliver-free constrained Delaunay triangulation of
tagged polygons with holes, with RWG edge topology derived in the same bundle.
A target_count budget scales the sizing field so the mesh lands near the
requested triangle count, shared across all metal layers:

```python
import rapidmesh as rm

layers = rm.mesh_layers(groups, sizing, target_count=20_000)
# points, tris, tags, RWG edges and boundary topology per layer
```

Overlapping regions within a group weld into one electrically continuous
component; separate metal layers never merge.

## Validated, not assumed

![Box minus two spheres|right|40x12](/images/rapidmesh-box-2spheres.png)

A validation corpus of 101 geometries (primitives, booleans, multi-region
assemblies, RF passives, STL/OBJ imports) is re-run and re-rendered on every
full run, each one checked for watertightness, manifoldness and dihedral
angle. The API serves the solver as an oracle: mesh representations carry
exactly what FEM assembly and refinement need.

![mesh.rapidpassives.org|left|46x14](/screenshots/rapidmesh-site.png)

The point of the corpus is that a boolean is easy to get almost right. A box
minus two overlapping spheres has to come out watertight with the sphere
patches meshed at their own curvature, and that is checked on every run rather
than assumed from the algorithm.

## History

The first mesher I wrote was a 2D QuadTree in 2023, built because a
quasi-electrostatic finite volume solver of mine needed one: refinement toward
edges, a balanced tree, and a triangulation with Laplacian smoothing on top.
It taught me the thing RapidMesh is built on, that a solver and its mesher
should be designed against each other rather than bolted together through a
file format.

RapidMesh started in June 2026 with one goal: replace gmsh inside the stack
with a deterministic, embeddable mesher. It is the youngest part of the stack
and still work in progress. What is in production today is the 2D path, which
meshes for [RapidMoM](/stack/rapidmom/), together with the budgeted meshing.
The 3D path is built to take over [RapidFEM](/stack/rapidfem/)'s meshing but
is not in it yet; RapidFEM still runs on gmsh.
