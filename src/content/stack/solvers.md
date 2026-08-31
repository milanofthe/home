---
title: solvers
accent: neutral
tagline: A reference library of ODE integration methods, held as data and verified against itself.
group: reading
order: 32
site: solvers.milanrother.com|https://solvers.milanrother.com
repo: github.com/milanofthe/solvers|https://github.com/milanofthe/solvers
license: MIT open source
cta1: [ Open solvers -> ]|https://solvers.milanrother.com
cta2: [ View on GitHub -> ]|https://github.com/milanofthe/solvers
---

solvers holds 122 published integration methods as data rather than as code.
Each one is a JSON file carrying its coefficients and the paper it appeared in,
and nothing else: its order, stage order, stability region, damping, nonlinear
stability, dispersion and cost are derived from those coefficients rather than
read from the file. Where a file states its coefficients as fractions the order
conditions are checked as identities in exact arithmetic; where it states
decimals they are checked numerically, and the report says which of the two
happened.

![Stability regions, PathSim 2024|right|57x15|contain](/images/solvers-pathsim-stability.png)

The site runs the analysis in the browser. The Rust core compiles to
WebAssembly with the method files baked in, and a worker pool computes the
stability regions, convergence studies and work precision diagrams on demand,
so every figure is the current answer for the coefficients in the file rather
than a picture generated once.

## Every claim is checked against the coefficients

A method file states what its publication claims: the order, the embedded
order, A-stability, L-stability, stiff accuracy. The analysis derives all of it
independently and reports the disagreements. One of the 122 disagrees, and it
is instructive: an L-stable fourth order Rosenbrock whose published damping
parameter is rounded to five digits, which puts its value at infinity at
-1.5e-5 instead of zero.

Order above ten cannot be established from rooted trees, since there are six
hundred thousand of them at order seventeen, so Butcher's theorem takes over
from the three simplifying assumptions and certifies Gauss-Legendre on eight
nodes at order sixteen without enumerating anything. Every method is also run:
a convergence study measures the order it actually converges at, and the two
answers have to agree.

## What it holds

Explicit Runge-Kutta from Euler in 1768 to the Owren-Zennaro pairs, the strong
stability preserving family, Runge-Kutta-Chebyshev out to twenty stages and a
real stability boundary of -727, diagonally implicit and ESDIRK, the
collocation families to order sixteen, twenty-six Rosenbrock-Wanner methods
including Steinebach's RODAS5P and RODAS6P, Adams, BDF, Nystrom and
Milne-Simpson. Every entry carries the DOI of its own source, and 51 of them
also carry the name they go by in SciPy, MATLAB, OrdinaryDiffEq.jl, GSL and
Boost.Odeint.

The whole library is downloadable as JSON, coefficients and derived properties
together, so a tableau can be taken without cloning anything.

## History

![Measured convergence, PathSim 2024|left|57x15|contain](/images/solvers-pathsim-convergence.png)

Early in 2024 I spent about three months inside the solvers of
[PathSim](/stack/pathsim/). It started as a small task and turned into a rabbit
hole: papers, appendices, scanned tables, the same method under four names with
coefficients that did not always agree. I benchmarked what I found, measured
the order of everything against an analytical solution, and drew the stability
regions for the whole set. Both figures here are from those notes: the
convergence measurement as PathSim produced it, and the stability sheet laid
out in PowerPoint around the plots.

What stayed with me afterwards is that the tables themselves are scattered and
mostly unverified. They sit in book appendices, in the source of other solver
libraries, and in papers behind a login, and almost nowhere is a published
order checked against the coefficients printed beside it. This is that work
made general: one place, machine readable, where every property is derived and
every disagreement is shown rather than smoothed over.

The figures on the site are those same plots, computed from the coefficients on
demand rather than drawn once. [nanospice](/stack/nanospice/) and
[nanofem](/stack/nanofem/) come from the same habit of taking one classical
thing and reading it all the way down.
