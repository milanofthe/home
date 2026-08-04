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
first-class 2D path for 2.5D MoM solvers, in pure Rust. The pipeline: solid
primitives (box, cylinder, sphere, cone, torus, prism, sweep, loft) assemble
into a tagged complex; exact-arithmetic CSG booleans (exact predicates, no
float snapping) produce a non-manifold B-rep with exactly conforming material
interfaces; restricted-Delaunay refinement meshes the volume; sliver
exudation, edge removal, and ODT smoothing optimize the minimal dihedral
angle. No tet straddles a material interface, watertight by construction.

![Dielectric resonator|right|46x14](/images/rapidmesh-resonator.png)

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

![mesh.rapidpassives.org|left|46x14](/screenshots/rapidmesh-site.png)

## Validated, not assumed

A validation corpus of 101 geometries (primitives, booleans, multi-region
assemblies, RF passives, STL/OBJ imports) is re-run and re-rendered on every
full run. The API serves the solver as an oracle: mesh representations carry
exactly what FEM assembly and refinement need. Inside the stack it replaces
gmsh: one less external dependency, one more deterministic component.

## History

RapidMesh started in June 2026 with one goal: replace gmsh inside the stack
with a deterministic, embeddable mesher. Around 500 commits took it to v0.3,
at which point the 2D path became the mesher inside
[RapidMoM](/stack/rapidmom/) and the 3D path the replacement for
[RapidFEM](/stack/rapidfem/)'s external meshing dependency.
