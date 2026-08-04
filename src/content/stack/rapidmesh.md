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

RapidMesh is a tetrahedral mesh generator for 3D electromagnetic FEM with a
first-class 2D path for 2.5D MoM solvers, in pure Rust. Solid primitives
(box, cylinder, sphere, cone, torus, prism, sweep, loft) assemble into a
tagged complex; exact-arithmetic CSG booleans (exact predicates, no float
snapping) produce a non-manifold B-rep with exactly conforming material
interfaces.

![Dielectric resonator|right|46x14](/images/rapidmesh-resonator.png)

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

Meshing is budgeted: mesh(target_elements=N) retunes the global size scale
over a few remeshes, since the element count scales with the third power of
the scale, and lands within a few percent of N while the relative refinement
from curvature and sizing keeps its shape. Surface budgets act as a cap
instead: the count-driven refinement resolves the sizing field but stops at
the triangle budget, split across patches by area, spending its last splits
on the worst-quality triangles. Solvers can plan a mesh the way RSLAB plans
a factorization: the cost is decided before the run, not discovered after.

## The 2D path

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

![mesh.rapidpassives.org|left|46x14](/screenshots/rapidmesh-site.png)

A validation corpus of 101 geometries (primitives, booleans, multi-region
assemblies, RF passives, STL/OBJ imports) is re-run and re-rendered on every
full run. The API serves the solver as an oracle: mesh representations carry
exactly what FEM assembly and refinement need. It is built to replace gmsh
inside the stack: one less external dependency, one more deterministic
component.

## History

RapidMesh started in June 2026 with one goal: replace gmsh inside the stack
with a deterministic, embeddable mesher. The 2D path is now the mesher inside
[RapidMoM](/stack/rapidmom/); the 3D path is built to take over
[RapidFEM](/stack/rapidfem/)'s meshing, which still runs on gmsh today.
