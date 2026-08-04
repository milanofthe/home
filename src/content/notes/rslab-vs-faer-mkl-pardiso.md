---
title: Benchmarking RSLAB against faer and MKL PARDISO
date: 2026-08-04
project: rslab
description: Head-to-head factor time and peak memory of a pure-Rust sparse direct solver against faer and MKL PARDISO, on a complete-distribution corpus of EM/FEM and SuiteSparse matrices.
---

RSLAB is the sparse direct solver underneath the stack: symmetric LDLT
(Bunch-Kaufman), unsymmetric LU, and a KLU-style path for circuit-shaped
matrices, a PARDISO-style embeddable backend in pure Rust with no BLAS,
LAPACK, or MKL dependency. This post summarizes how its shipped default
configuration measures up against the two obvious reference points: faer, the
strongest pure-Rust linear algebra library, and Intel's MKL PARDISO.

## The setup

All cross-solver figures come from one benchmark engine over a
complete-distribution corpus: structured-grid generators (curl-curl Maxwell,
shifted Helmholtz, Stokes/KKT saddle-point, convection-diffusion across the
grid-Peclet range, BEM/MoM near-field kernels) plus the complex SuiteSparse
matrices: 8k to 125k DOFs, all complex double precision, measured in a single
run on a quiet 12-core machine so the cross-solver ratios carry no run-to-run
drift. RSLAB runs its shipped default: the deterministic heuristic pick
(adaptive ordering, exact nested-dissection bakeoff, calibrated worker count).
Each path is compared on its own matrix class against its own MKL PARDISO
mtype.

![LDLT head-to-head: factor time and peak memory|center|72x22](/images/rslab-h2h-ldlt.png)

## The headline numbers

Geomean ratios over 63 sizes per path (1k-110k DOFs, over the matrices both
solvers factor accurately):

- vs faer: 6.7x faster factor on the symmetric class, 2.7x faster on the unsymmetric class, with 1.8x less peak memory on LDLT
- vs MKL PARDISO: 5.6x (sym) and 5.1x (unsym) slower factor, at 2.8x-3.6x more peak memory
- vs RSLAB's own fixed default config: the heuristic pick is 1.5x-1.8x faster at essentially equal memory

RSLAB sits exactly where you would expect a young pure-Rust solver to sit:
clearly ahead of faer, moderately behind two decades of hand-optimized MKL.
Two structural notes behind the ratios: faer has no symmetric path (it factors
symmetric matrices as LU), so its LDLT gap is structurally largest, and it
runs out of memory on the largest matrices, which makes the head-to-head a
conservative floor. On factor time the LU heuristic pick scales flatter than
PARDISO (fitted exponent 1.01 vs 1.25), so the gap narrows with size.

## The circuit path

The KLU path is its own story. Circuit-shaped (MNA-like) matrices get a BTF
block factorization with per-block AMD ordering and left-looking
Gilbert-Peierls LU: 5-12x faster factor than the general multifrontal LU with
1.7-5.7x less fill, widening with size. A 20-point same-pattern frequency
sweep runs 10-40x faster end to end via numeric-only refactorization, and
solve_transpose reuses the same factors for adjoint and sensitivity solves.
Against SuiteSparse KLU, the parallel factor and refactor come out 1.6-2.7x
and 2.1-3.4x ahead, while staying bit-deterministic.

## Mixed precision with a certificate

MixedLdltSolver and MixedLuSolver factor in single precision (half the
memory, measurably faster) and solve through an explicit refinement ladder,
plain iterative refinement escalating to GMRES-IR against the
double-precision original. The result carries an honest normwise
backward-error certificate. On the reference class the complex-single factor
runs 1.64x faster at eps-level certified accuracy after two refinement steps.

## Apple Silicon

The same engine and corpus, re-measured on an Apple M3 against Apple
Accelerate's sparse direct solvers (including the sparse LU Accelerate gained
in macOS 15.5): Accelerate runs its vendor-recommended best configuration per
matrix class, RSLAB its shipped default. Notable structural point: like faer,
Accelerate's complex LDLT is Hermitian-only, so it cannot exploit the
complex-symmetric structure of EM/FEM matrices and factors them as LU.

## Determinism and a-priori estimates

Speed is only half of what a solver-in-the-loop backend needs. The numeric
factor is bit-identical across thread counts, and the parallel multi-RHS solve
is bit-identical to the serial path. Peak memory and runtime are predicted
exactly from the symbolic structure before any numeric work:

![A-priori memory estimate vs measured peak|center|72x22](/images/rslab-memory-estimate.png)

That combination (deterministic, budgetable, embeddable, no native
dependencies) is why RSLAB is the backend inside SANE, RapidFEM, and
RapidMoM rather than an external BLAS-backed solver.

## Accuracy

Where RSLAB factors, it is accurate: 24 of 31 complex SuiteSparse matrices
land below 1e-8 relative residual, matching PARDISO and ahead of faer, which
returns degraded solutions on several. On indefinite saddle-point matrices
outside its target class, RSLAB declines rather than returning a degraded
solution; the never-fail static-pivot factor used as a GMRES preconditioner
covers most of that gap (28 of 33 below 1e-8).

Everything here is reproducible from the repository benches:
[github.com/milanofthe/rslab](https://github.com/milanofthe/rslab).
