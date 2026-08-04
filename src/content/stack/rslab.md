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

![vs faer and MKL PARDISO|right|46x14](/images/rslab-h2h-ldlt.png)

## Settings pick themselves

factor() chooses its configuration from exact a-priori quantities: an adaptive
ordering heuristic, proven kernel defaults, and an exact nested-dissection
bakeoff on large systems. An optional one-time hardware calibration measures
the machine once and caches it; the solvers never measure implicitly, and
there is no ML in the default path. In head-to-head benchmarks the shipped
default is faster than faer and within roughly 5x of MKL PARDISO on factor
time. On MNA-like circuit matrices the KLU path factors 5-12x faster than the
general LU with up to 5.7x less fill, and same-pattern frequency sweeps run
10-40x faster end to end.

![A-priori memory estimate|left|46x14](/images/rslab-memory-estimate.png)

## Deterministic and budgetable

The numeric factor is bit-identical across thread counts, validated over 180
SuiteSparse matrices across schedules, emit modes, and the 32-bit compressed
factor. Peak memory and runtime are predicted exactly from the symbolic
structure before any numeric work. Mixed-precision solves factor in single
precision and refine against the double-precision original, returning an
honest normwise backward-error certificate. Where a matrix is outside its
target class, RSLAB declines rather than returning a degraded solution.

## In the stack

RSLAB is the numerical foundation under [SANE](/stack/sane/),
[RapidFEM](/stack/rapidfem/), and [RapidMoM](/stack/rapidmom/). No black-box
dependencies anywhere in the stack. The full benchmark story is in
[the RSLAB benchmark note](/notes/rslab-vs-faer-mkl-pardiso/).
