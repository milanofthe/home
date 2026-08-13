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
paths matched to their operator classes: symmetric LDLT with Bunch-Kaufman
pivoting, threshold-pivoted unsymmetric LU, and a KLU path for circuit-shaped
matrices.

## Built for solver-in-the-loop

![vs faer and MKL PARDISO|right|46x14|contain](/images/rslab-h2h-ldlt.png)

The design target is a solver that sits inside an engine, not on a cluster
queue. The numeric factor is bit-identical across thread counts. Peak memory
and runtime are predicted exactly from the symbolic structure before any
numeric work. Fixed-pattern sequences (frequency sweeps, Newton steps)
refactor numeric-only on frozen pivots, and solve_transpose reuses the same
factors for adjoint and sensitivity solves. Mixed-precision solves factor in
single precision, refine against the double-precision original, and return a
backward-error certificate. Where a matrix is outside the target class, RSLAB
declines rather than returning a degraded solution.

Configuration is a deterministic heuristic: adaptive ordering, an exact
nested-dissection bakeoff on large systems, and a worker count from a
one-time cached hardware calibration. The solvers never measure implicitly.

## The circuit path

Circuit matrices are their own class: unsymmetric, very sparse, and solved
thousands of times on a pattern that never changes. A general sparse solver
treats every one of those solves as a new problem. The KLU path instead
splits the matrix into its block triangular form once, orders and factors the
blocks separately, and from then on refactors numerically on the frozen
pattern and pivots. Structural singularity falls out of the block analysis
before any numeric work happens.

On MNA-shaped matrices that is 2 to 19x faster to factor with 1.7 to 5.7x
less fill than the general path, widening with size, and a 20-point sweep
runs 6 to 19x faster end to end. The same factors also solve the transposed
system, which is what the adjoint sensitivity solves in
[SANE](/stack/sane/) need.

## Benchmarks

![A-priori memory estimate|left|46x14|contain](/images/rslab-memory-estimate.png)

All cross-solver figures come from one benchmark engine over a
complete-distribution corpus: structured-grid generators (curl-curl Maxwell,
shifted Helmholtz, Stokes/KKT, convection-diffusion, BEM/MoM kernels) plus
the complex SuiteSparse matrices, measured in a single run. Geomean over 63
sizes per path: 6.7x faster factor than faer on the symmetric class, 2.7x on
the unsymmetric class, within 5.1-5.6x of MKL PARDISO. On the circuit class
the KLU path factors 5-12x faster than the general LU, and same-pattern
sweeps run 10-40x faster end to end. Accuracy: 24 of 31 complex SuiteSparse
matrices below 1e-8 relative residual, matching PARDISO and ahead of faer.

## History

I was looking for a sparse direct solver in Rust and found feral, by John
Kitchin. After talking with him I forked it, in late June 2026. feral was
real-valued only, so the first piece of work was making it generic over the
scalar type, without which it is of no use to electromagnetics at all.

What it became after that was decided by the matrices it had to solve. FEM
and MoM systems came first, for [RapidFEM](/stack/rapidfem/) and
[RapidMoM](/stack/rapidmom/); circuit matrices came later, with
[SANE](/stack/sane/), and brought the KLU path with them. The a-priori
estimators have the same origin: a solver that sits inside another engine has
to say what a factorization will cost before it runs it, and the symbolic
analysis already holds everything needed to answer that.

Along the way I built an MLP cost-model auto-tuner for picking solver
configurations and then took it out of the default path: the deterministic
heuristic is simpler, reproducible, and holds up. The repository ships a technical
report that derives the algorithms and carries the full evaluation; every
benchmark reruns with one command.
