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
with no BLAS, LAPACK, or MKL dependency. It started from the feral project,
made generic over the scalar type (f64, f32, and their complex counterparts),
and grew into three factorization paths matched to their operator classes:
symmetric LDLT with Bunch-Kaufman pivoting, threshold-pivoted unsymmetric LU,
and a KLU path for circuit-shaped matrices (BTF block structure, per-block
AMD, Gilbert-Peierls LU).

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
thousands of times on a pattern that never changes. The KLU path treats them
that way. A block triangular form, maximum transversal followed by Tarjan
SCC, splits the matrix and detects structural singularity before any numeric
work happens; each block is ordered with AMD and factored with a left-looking
Gilbert-Peierls LU with threshold pivoting and row scaling. The path is
strictly sequential and bit-deterministic.

On MNA-shaped matrices it factors 2 to 19x faster than the multifrontal LU
with 1.7 to 5.7x less fill, and the gap widens with size. A 20-point sweep on
a frozen pattern runs 6 to 19x faster end to end, because refactor keeps the
pattern and the pivots and only the numeric values change. solve_transpose
runs A^T x = b on the same factors, which is what the adjoint sensitivity
solves in [SANE](/stack/sane/) need.

## What is tunable

Three factorization schedules (supernodal left-looking by default,
multifrontal, right-looking), fill-reducing orderings (AMD, AMF, nested
dissection via METIS, Scotch or KaHIP, and RCM for band and profile),
equilibration (one-pass infinity-norm, iterative Ruiz, MC64 matching, or off)
and the factor emit and memory modes sit behind one flat settings struct.
Orderings can be selected or raced per matrix. The factor doubles as a
preconditioner for the iterative solvers in the same crate, and the parallel
multi-RHS solve is 8 to 19x faster than solving column by column while staying
bit-identical to the serial path.

A learned auto-tuner exists too: one small MLP per factorization path,
selecting a configuration from the matrix's structural features behind an
a-priori memory backstop that keeps it from ever using more memory than the
default. It is opt-in, meant for tuning to one problem class on one machine.
The default factor() does not consult it.

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

RSLAB started in late June 2026 from feral, driven directly by what
[SANE](/stack/sane/) and [RapidMoM](/stack/rapidmom/) need from their linear
algebra. Along the way I built an MLP cost-model auto-tuner for picking solver
configurations and then took it out of the default path: the deterministic
heuristic is simpler, reproducible, and holds up. The repository ships a technical
report that derives the algorithms and carries the full evaluation; every
benchmark reruns with one command.
