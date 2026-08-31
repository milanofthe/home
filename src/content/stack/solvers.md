---
title: solvers
accent: neutral
tagline: A reference library of ODE integration methods, held as data.
group: reading
order: 32
site: solvers.milanrother.com|https://solvers.milanrother.com
repo: github.com/milanofthe/solvers|https://github.com/milanofthe/solvers
license: MIT open source
cta1: [ Open solvers -> ]|https://solvers.milanrother.com
cta2: [ View on GitHub -> ]|https://github.com/milanofthe/solvers
---

![The library, sorted by year|center|114x22|contain](/images/solvers-gallery.png)

solvers holds published integration methods as JSON files. A file carries the
coefficients and the paper they came from and nothing else. Order, stage order,
stability region, damping, nonlinear stability, dispersion and cost are computed
from the coefficients. Coefficients given as fractions are checked as identities
in exact arithmetic, decimals numerically, and the report says which of the two
happened.

Explicit and implicit Runge-Kutta, the collocation families, Rosenbrock-Wanner,
strong stability preserving methods, Runge-Kutta-Chebyshev, Adams, BDF, Nystrom
and Milne-Simpson. Entries carry the DOI of their source and, where there is
one, the name they go by in SciPy, MATLAB, OrdinaryDiffEq.jl, GSL and
Boost.Odeint.

The Rust core compiles to WebAssembly with the method files baked in, so the
stability regions, convergence studies and work precision diagrams are computed
in the browser. What a file claims about itself is derived independently and the
disagreements are listed. The whole library downloads as JSON.

## History

The first [PathSim](/stack/pathsim/) prototype had forward Euler, early in
2023, and Adams-Bashforth shortly after, since it sits on top of Euler with
little extra. BDF followed, still without a good nonlinear solver. A year later
the models needed something more robust. Talking it through with a few
numerical analysts set off about three months of trying every Butcher table I
could find, to see how each one behaved in system simulation. The SSPRK methods
came out of one of those conversations, later the DIRK and ESDIRK families,
which are the ones I reach for now, and the GEAR methods after that.

![Measured convergence, 2024|83x14|contain](/images/solvers-pathsim-convergence.png)
![Stability regions, 2024|29x14|contain](/images/solvers-pathsim-stability.png)
