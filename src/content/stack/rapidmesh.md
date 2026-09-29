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
first-class 2D path for 2.5D MoM solvers, in pure Rust. Solid primitives
(box, cylinder, sphere, cone, torus, prism, sweep, loft, fillets and
chamfers) and imported meshes assemble into one model through an exact
arrangement: exact predicates, no float snapping, material interfaces that
conform by construction. From the arrangement comes a B-rep whose faces
carry their true surfaces (planes, quadrics, tori, extrusions, revolutions,
NURBS, swept tubes), and the mesh is measured against those, not against the
facets they were built from.

![Dielectric resonator, cutaway|left|40x14](/images/rapidmesh-resonator.png)

Meshing runs bottom-up: corners, then edges, then faces, then each region on
its own. Every level is final before the next one uses it, so neighbours
share their triangles by construction and no stage sees more than its own
piece. A curved face is meshed in a chart of its surface, where it can be
flattened, and on its facets where it cannot. Each region is then filled by
its constrained Delaunay tetrahedralization, grown by gift wrapping from its
boundary; the boundary is split beforehand until every segment is strongly
Delaunay, the condition under which that tetrahedralization exists without
extra points. Refinement adds the interior points, and a local improver
removes the last bad tets with flips, vertex moves along their carriers and
peels at the boundary.

![Luneburg lens, seven shells|right|40x14](/images/rapidmesh-luneburg.png)

A multi-material model is the case this was built for. A Luneburg lens is
seven nested shells, each its own region; an SMA connector has a centre pin,
a dielectric and a shell meeting at a change of diameter. Each interface is
one face of the B-rep, meshed once and shared by the regions on both sides,
so the solver never sees a crack that is not in the geometry.

![Cheburashka, a scan|left|40x12](/images/rapidmesh-cheburashka.png)

Imported scans come in as triangle soups without any structure. They are
split at their creases into faces, and faces smaller than the mesh size are
joined into composites that are meshed as one surface on their facets, then
handed back to the faces they came from. The model stays the source of every
tag; the mesh only sees the topology its size can resolve.

## Scale

![Four passive layouts in one dielectric, cutaway|left|46x14](/images/rapidmesh-chip.png)

A chip is a few thousand conductors in one dielectric, and one region is the
unit every stage parallelizes over. RapidMesh therefore cuts a large model into
blocks: planes through the gaps between the structures, placed where no
corner of the model lies within the local size of them, go into the exact
arrangement as sheets, and every piece of a region in one cell becomes a
region of its own. The cut faces are meshed like any face, so the blocks
conform, and every block runs its Delaunay, constrained and refinement
stages in parallel. Before the improver, everything is named in the model's
terms again and the cuts disappear.

On nine tiles of the passive layouts (2.75 million tets) this takes 8 s on
eight threads at 334 bytes per tet. gmsh needs 25 s and 1.6 GB for half as
many tets, 20 s and 1.1 GB with its parallel HXT mesher. Across the 23
comparison geometries, RapidMesh meshes in under half of gmsh's time (0.47x
median, 0.41x per tet) and has the better smallest dihedral angle on 22 of
them, with the 1st percentile at 25 degrees against 18.5 and the same mean.

Meshing is budgeted: mesh(target_elements=N) retunes the global size scale
over a few remeshes, since the element count scales with the third power of
the scale, and lands within a few percent of N while the relative refinement
from curvature and sizing keeps its shape. Solvers can plan a mesh the way
RSLAB plans a factorization: the cost is known before the run.

## The 2D path

![Symmetric transformer, MoM surface mesh|right|40x12](/images/rapidmesh-transformer.png)

The standalone planar mesher serves MoM: graded, sliver-free constrained
Delaunay triangulation of tagged polygons with holes, with RWG edge topology
derived in the same bundle. A target_count budget scales the sizing field so
the mesh lands near the requested triangle count, shared across all metal
layers. The edge band along each trace can run its diagonals one way along
the outline, the size can follow the local trace width, and nearly
coincident outlines of stacked layers snap onto each other:

```python
import rapidmesh as rm

layers = rm.mesh_layers(groups, sizing, target_count=20_000)
# points, tris, tags, RWG edges and boundary topology per layer
```

Overlapping regions within a group weld into one electrically continuous
component; separate metal layers never merge.

## The corpus

![mesh.rapidpassives.org|left|46x14](/screenshots/rapidmesh-site.png)

A corpus of 196 geometries (primitives, booleans, multi-region assemblies,
RF and CFD models, passive layouts, scans) is meshed on every change and
compared with a stored baseline: watertightness, slivers, manifold edges,
and fidelity to the input (surface left uncovered, mesh off the geometry,
creases missed, faces mislabelled). 171 of its 172 volume meshes are
watertight and 157 free of defects. The API serves the solver as an oracle:
a solver asks for a mesh, gets the topology it needs from the same call
(edges, faces, signs, the geometric entity every point lies on, named sets
for ports and boundaries), and can ask again with a different budget without
leaving the process.

## Where it stands

The 2D path meshes for [RapidMoM](/stack/rapidmom/). The 3D path is ahead of
gmsh on speed and memory, and on the worst element for most models, and
[RapidFEM](/stack/rapidfem/) is moving off gmsh onto it. What is left is at
the edges of the corpus: one scan whose spikes are thinner than its own
facets still takes the older mesher, and slivers remain along some curved
edges where two faces meet at a shallow angle.

## History

The first mesher I wrote was a 2D QuadTree in 2023, built because a
quasi-electrostatic finite volume solver of mine needed one: refinement toward
edges, a balanced tree, and a triangulation with Laplacian smoothing on top.
It was written against one solver, which is how RapidMesh is built too.

RapidMesh started in June 2026 with one goal: replace gmsh inside the stack
with a deterministic, embeddable mesher. The first versions relaxed points
variationally and then refined one restricted Delaunay triangulation of the
whole model, recovering the boundary from it afterwards. That meshed, but
conformity was approximate, and a fix at one place tended to move a problem
somewhere else. The bottom-up mesher replaced it at the end of September
2026, and with it the 3D path went from behind gmsh to ahead of it.
