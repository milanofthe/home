---
title: solvers
accent: neutral
tagline: A reference library of ODE integration methods, held as data rather than as code.
group: reading
order: 32
site: solvers.milanrother.com|https://solvers.milanrother.com
repo: github.com/milanofthe/solvers|https://github.com/milanofthe/solvers
license: MIT open source
cta1: [ Open solvers -> ]|https://solvers.milanrother.com
cta2: [ View on GitHub -> ]|https://github.com/milanofthe/solvers
---

![The library, 122 methods sorted by family|center|114x22|contain](/images/solvers-gallery.png)

solvers holds 122 published integration methods as JSON files. A file carries
the coefficients and the paper they came from and nothing else. Order, stage
order, stability region, damping, nonlinear stability, dispersion and cost are
derived from the coefficients rather than stored. Coefficients given as
fractions are checked as identities in exact arithmetic, decimals numerically,
and the report says which of the two happened.

Explicit and implicit Runge-Kutta, the collocation families to order sixteen,
twenty-six Rosenbrock-Wanner methods, the strong stability preserving family,
Runge-Kutta-Chebyshev, Adams, BDF, Nystrom and Milne-Simpson. Each entry has
the DOI of its source, 51 also the name they go by in SciPy, MATLAB,
OrdinaryDiffEq.jl, GSL and Boost.Odeint.

The Rust core compiles to WebAssembly with the method files baked in, so the
stability regions, convergence studies and work precision diagrams are computed
in the browser rather than served as pictures. What a file claims about itself
is derived independently and the disagreements are listed. The whole library
downloads as JSON.

## History

![Measured convergence, PathSim 2024|left|57x15|contain](/images/solvers-pathsim-convergence.png)

Early in 2024 I spent about three months on the solvers in
[PathSim](/stack/pathsim/). Finding the tableaux was most of the work: papers,
appendices, scanned tables, the same method under four names with coefficients
that did not always agree. I benchmarked what I found, measured the order
against an analytical solution and drew the stability regions for the set.

![Stability regions, PathSim 2024|right|57x15|contain](/images/solvers-pathsim-stability.png)

Both figures are from those notes, the convergence measurement as PathSim
produced it and the stability sheet laid out in PowerPoint around the plots.
The tables are scattered and mostly unverified, and a published order is rarely
checked against the coefficients printed next to it. solvers is the same set in
one place, with the checking done.
