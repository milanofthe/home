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
Symmetric LDLT with Bunch-Kaufman pivoting, unsymmetric LU, and a KLU path for
circuit-shaped matrices, plus iterative solvers and preconditioners with
Krylov subspace recycling.

![vs faer and MKL PARDISO|right|46x14](/images/rslab-h2h-ldlt.png)

Settings pick themselves: a deterministic heuristic (adaptive ordering, an
exact nested-dissection bakeoff, a one-time hardware calibration) with no ML
in the default path. In head-to-head benchmarks the shipped default is faster
than faer and within roughly 5x of MKL PARDISO on factor time, while staying
pure Rust and bit-identical across thread counts.

![A-priori memory estimate|left|46x14](/images/rslab-memory-estimate.png)

Peak memory and runtime are predicted exactly from the symbolic structure
before any numeric work, and mixed-precision solves return an honest
backward-error certificate. That is what solver-in-the-loop operation needs:
deterministic, budgetable, embeddable.

## In the stack

RSLAB is the numerical foundation under [SANE](/stack/sane/),
[RapidFEM](/stack/rapidfem/), and [RapidMoM](/stack/rapidmom/). No black-box
dependencies anywhere in the stack.
