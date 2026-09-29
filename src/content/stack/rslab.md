---
title: RSLAB
accent: rslab
tagline: A sparse direct solver in pure Rust. PARDISO-style, embeddable, deterministic.
group: foundations
order: 8
repo: github.com/milanofthe/rslab|https://github.com/milanofthe/rslab
license: MIT open source / PyPI
cta1: [ View on GitHub -> ]|https://github.com/milanofthe/rslab
---

RSLAB is a sparse direct solver for real and complex matrices in pure Rust
with no BLAS, LAPACK, or MKL dependency. It is generic over the scalar type,
f64, f32 and their complex counterparts, and carries three factorization
paths matched to their operator classes: supernodal LDLT with Bunch-Kaufman
pivoting for symmetric and complex-symmetric systems, supernodal LU with
threshold pivoting for unsymmetric ones, and a KLU path for circuit-shaped
matrices.

## Built for solver-in-the-loop

![vs MKL PARDISO|right|46x14|contain](/images/rslab-pardiso.png)

The design target is a solver that sits inside an engine rather than behind a
job submission. The factor is bit-identical for every thread count. The
analysis depends on the pattern only, so a frequency sweep or a Newton loop
analyzes once and from then on only factors: in place, into the buffers of
the previous factor, and without allocating per solve. solve_transpose reuses
the same factors for adjoint and sensitivity solves.

Before any numeric work, a memory plan predicts the heap a factorization
needs: what the analysis and the factor will hold, the peak while factoring,
and the work vectors of a solve. That is what makes a sweep schedulable: how
many factorizations fit side by side on a cloud machine, which instance size
to rent for them, and whether a given system fits at all, are answered before
anything is started rather than after a run dies.

Every factor is also a preconditioner for the built-in Krylov solvers (GMRES,
block GMRES, COCG, COCR). With static pivoting the factorization never fails,
a drop tolerance trades fill for iterations, and a single-precision factor
preconditions the double-precision iteration at half the factor memory.

Configuration is deterministic: the orderings (AMD, AMF, RCM, parallel nested
dissection) are raced on the exact fill of each candidate, the worker count
is predicted from the analysis, and every tuning constant is a setting with
the tuned value as its default.

## The circuit path

Circuit matrices are their own class: unsymmetric, very sparse, and solved
thousands of times on a pattern that never changes. A general sparse solver
treats every one of those solves as a new problem. The KLU path instead
splits the matrix into its block triangular form once, orders and factors the
blocks separately, and from then on refactors numerically on the frozen
pattern and pivots. Structural singularity falls out of the block analysis
before any numeric work happens. The same factors also solve the transposed
system, which is what the adjoint sensitivity solves in
[SANE](/stack/sane/) need.

## Benchmarks

![Memory plan against the measurement|left|46x14|contain](/images/rslab-memory-plan.png)

The reference is MKL PARDISO, on 15 systems exported from
[RapidFEM](/stack/rapidfem/), [RapidMoM](/stack/rapidmom/) and
[SANE](/stack/sane/) plus 13 SuiteSparse circuit matrices, 12 threads each.
PARDISO runs its defaults, per system the faster of its classic and two-level
factorization. Analysis, factorization and solve together take 0.74 of
PARDISO's wall time on the MoM systems, 1.05 on FEM, 1.06 on the power grids
and 1.12 on the circuits (geomean per class). The solve alone takes 0.30 to
0.43 of PARDISO's time in every class.

Against the heap measured with a counting allocator, the planned peak is
within 15 percent on 25 of the 28 systems. The planned factor storage is
within 6 percent on all but one circuit, where the threshold pivoting of KLU
adds fill beyond the prediction.

## History

I was looking for a sparse direct solver in Rust and found feral, by John
Kitchin. After talking with him I forked it, in late June 2026. feral was
real-valued only, so the first piece of work was making it generic over the
scalar type, without which it is of no use to electromagnetics at all.

After that, development followed the matrices it had to solve. FEM
and MoM systems came first, for [RapidFEM](/stack/rapidfem/) and
[RapidMoM](/stack/rapidmom/); circuit matrices came later, with
[SANE](/stack/sane/), and brought the KLU path with them. The memory plan has
the same origin: the sweeps these solvers run are cloud work, and packing and
scheduling cloud work means knowing the peak memory of a factorization before
paying for the machine that would run it. The symbolic analysis already holds
everything needed to answer that.

Along the way I built an MLP cost-model auto-tuner for picking solver
configurations and then took it out of the default path: the deterministic
heuristic is simpler, reproducible, and holds up. Version 1.0 came out in
September 2026, as a git dependency for Rust and on PyPI, and the PARDISO
comparison reruns from the repository with two commands.
