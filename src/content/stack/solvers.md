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

solvers is a library of published integration methods, one JSON file per method
with its coefficients and the paper they came from. Everything else about a
method (order, stage order, stability region, damping, nonlinear stability,
dispersion, cost) gets computed from those coefficients. If they are fractions
the order conditions are checked exactly, if they are decimals numerically, and
the report tells you which one it was.

There is explicit and implicit Runge-Kutta, the collocation families,
Rosenbrock-Wanner, SSP methods, Runge-Kutta-Chebyshev, Adams, BDF, Nystrom and
Milne-Simpson. Every entry carries the DOI of its source and, where there is
one, the name the method goes by in SciPy, MATLAB, OrdinaryDiffEq.jl, GSL and
Boost.Odeint.

The core is Rust compiled to WebAssembly with the method files baked in, so the
stability regions, convergence studies and work precision diagrams all get
computed in your browser. Whatever a file claims about itself is derived
independently, and I list the disagreements. The whole thing downloads as JSON.

## History

PathSim's first prototype had forward Euler (early 2023), and Adams-Bashforth
followed pretty much immediately, because it sits on top of Euler with almost no
extra work. Then BDF, at that point still without a good nonlinear solver. A
year later the models got demanding enough that I needed something more robust,
so I talked it through with a few numerical mathematicians, and that kicked off
a rabbit hole: about three months of trying every Butcher table I could find to
see how it behaves in system simulation.

The SSPRK methods came out of one of those conversations, then DIRK and ESDIRK,
and GEAR later on. DIRK and ESDIRK are charming because a stage is just a
backward Euler solve. Nothing to ramp up, no coupled stage system, one
sequential solve per stage, and very stable. In some applications they even beat
Radau, where the stages are coupled and a stiff coupling can leave you with a
badly conditioned nonlinear solve.

![Measured convergence, 2024|83x14|contain](/images/solvers-pathsim-convergence.png)
![Stability regions, 2024|29x14|contain](/images/solvers-pathsim-stability.png)
