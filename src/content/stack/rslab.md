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

RSLAB is a sparse direct solver for real and complex matrices in pure Rust, a
PARDISO-style embeddable backend with no BLAS, LAPACK, or MKL dependency.
Three factorization paths are matched to their operator classes: symmetric
LDLT with Bunch-Kaufman pivoting, threshold-pivoted unsymmetric LU, and a KLU
path for circuit-shaped matrices (BTF block structure, per-block AMD,
Gilbert-Peierls LU). Iterative solvers (GMRES, COCG, COCR) with Krylov
subspace recycling and preconditioner mode round out the toolbox.

## Settings pick themselves

![vs faer and MKL PARDISO|right|46x14|contain](/images/rslab-h2h-ldlt.png)

factor() chooses its configuration from exact a-priori quantities: an adaptive
ordering heuristic, proven kernel defaults, and an exact nested-dissection
bakeoff on large systems. An optional one-time hardware calibration measures
the machine once and caches it; the solvers never measure implicitly, and
there is no ML in the default path. In head-to-head benchmarks the shipped
default is faster than faer and within roughly 5x of MKL PARDISO on factor
time. On MNA-like circuit matrices the KLU path factors 5-12x faster than the
general LU with up to 5.7x less fill, and same-pattern frequency sweeps run
10-40x faster end to end.

## Benchmarks

All cross-solver figures come from one benchmark engine over a
complete-distribution corpus: structured-grid generators (curl-curl Maxwell,
shifted Helmholtz, Stokes/KKT saddle-point, convection-diffusion, BEM/MoM
near-field kernels) plus the complex SuiteSparse matrices, measured in a
single run so the ratios carry no run-to-run drift. Geomean over 63 sizes per
path: 6.7x faster factor than faer on the symmetric class and 2.7x on the
unsymmetric class with less peak memory on LDLT, and within 5.1-5.6x of MKL
PARDISO. On factor time the LU heuristic pick scales flatter than PARDISO, so
the gap narrows with size.

Where RSLAB factors, it is accurate: 24 of 31 complex SuiteSparse matrices
land below 1e-8 relative residual, matching PARDISO and ahead of faer. The
never-fail static-pivot factor used as a GMRES preconditioner covers most of
the remaining gap.

## Deterministic and budgetable

![A-priori memory estimate|left|46x14|contain](/images/rslab-memory-estimate.png)

The numeric factor is bit-identical across thread counts, validated over 180
SuiteSparse matrices across schedules, emit modes, and the 32-bit compressed
factor. Peak memory and runtime are predicted exactly from the symbolic
structure before any numeric work. Mixed-precision solves factor in single
precision and refine against the double-precision original, returning an
honest normwise backward-error certificate. Where a matrix is outside its
target class, RSLAB declines rather than returning a degraded solution.

## History

RSLAB started in late June 2026 as a fork of the feral project and was
rebuilt into a full sparse direct solver, driven directly by what
[SANE](/stack/sane/) and [RapidMoM](/stack/rapidmom/) need from their linear
algebra. The repository ships a technical report that derives
the algorithms and carries the full evaluation; every benchmark reruns from
the repository with one command.
