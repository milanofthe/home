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

RapidMesh is a 2D and 3D mesh generator for electromagnetic FEM and MoM in
pure Rust. Exact-arithmetic CSG booleans make geometry watertight by
construction, count-based meshing hits exact element budgets, and
dihedral-angle quality optimization keeps tetrahedra solver-friendly.

![Dielectric resonator|right|46x14](/images/rapidmesh-resonator.png)

The API is designed for the solver, not for a GUI: mesh representations serve
the solver as an oracle, and planar and tetrahedral meshing share one
interface. Inside the stack it replaces gmsh: one less external dependency,
one more component with deterministic, budgetable behavior.

![mesh.rapidpassives.org|left|46x14](/screenshots/rapidmesh-site.png)

## In the stack

RapidMesh feeds [RapidFEM](/stack/rapidfem/) and [RapidMoM](/stack/rapidmom/)
and completes the no-black-box foundations together with
[RSLAB](/stack/rslab/).
