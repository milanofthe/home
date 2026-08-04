---
title: FastSim
accent: fastsim
tagline: The drop-in Rust engine for PathSim. Swap the import and go.
group: systems
order: 2
site: fast.pathsim.org|https://fast.pathsim.org
license: source-available / free for academia / commercial licenses
cta1: [ Request a license -> ]|mailto:info@pathsim.org?subject=FastSim%20licensing
cta2: [ Try the docs -> ]|https://fast.pathsim.org
---

FastSim is a Rust reimplementation of [PathSim](/stack/pathsim/) with an
identical Python API: swap the import and your existing model runs 50-100x
faster. Python callbacks are automatically traced into an optimized SSA graph,
symbolically differentiated, and compiled to native code at runtime.

![Performance comparison|right|46x14](/images/fastsim-casadi-cold.png)

The JIT compiler traces Python functions into a flat-tape IR with common
subexpression elimination, constant folding, strength reduction, and FMA
detection. Symbolic forward-mode automatic differentiation delivers analytical
Jacobians to the 21 implicit and explicit ODE solvers. The JIT and autodiff are
also exposed standalone as JAX-style transformations: jit(func) and
jacobian(func).

![fast.pathsim.org|left|46x14](/screenshots/fastsim-org.png)

Beyond speed, FastSim reaches where a Python engine cannot: FMI 3.0 export for
co-simulation, C99 code generation for embedded targets, and
software-in-the-loop verification that compiles the generated C locally and
pins it against the reference engine, sample by sample.

## In the stack

FastSim shares the SSA-compute-graph architecture with the rest of the stack
and is the commercial engine that funds the open system level. Models built on
open-source PathSim carry over unchanged.
