---
title: FastSim
accent: fastsim
tagline: The drop-in Rust engine for PathSim. Swap the import and go.
group: systems
order: 2
site: fast.pathsim.org|https://fast.pathsim.org
license: source-available / free for academia / commercial licenses
cta1: [ Request a license -> ]|mailto:info@pathsim.org?subject=FastSim%20licensing
cta2: [ Read the docs -> ]|https://fast.pathsim.org
---

FastSim is a Rust reimplementation of [PathSim](/stack/pathsim/) with an
identical Python API. Across a 55-system benchmark catalog the median
measured per-step speedup over PathSim is 191x, and your existing model gets
it by changing one line:

```python
# from pathsim import Simulation, Connection
from fastsim import Simulation, Connection
```

Python callbacks are automatically traced into an optimized SSA graph,
symbolically differentiated, and evaluated in Rust. No code generation step,
no toolchain on the user's machine, no model rewrite.

## The engine

![Performance comparison|right|46x14|contain](/images/fastsim-casadi-cold.png)

The trace-to-SSA compiler turns Python callbacks into a flat-tape IR with
common subexpression elimination, constant folding, strength reduction, and
FMA detection. Symbolic forward-mode automatic differentiation supplies
analytical Jacobians to the twenty-one explicit and implicit integrators,
which include a preconditioned-Anderson implicit solve, periodic steady
state, and collocation boundary-value problems. Underneath: zero-copy data
paths, flat DAG evaluation, dynamic block sizing.

![fast.pathsim.org|left|46x14](/screenshots/fastsim-org.png)

The compiler is also useful on its own. Solvers run standalone with
automatic JIT, RKDP54.integrate(func, x0, time_end=50), and jit(func) and
jacobian(func) are exposed as JAX-style transformations. Event handling,
hierarchical subsystems, and mutable parameters work exactly like PathSim.

## Beyond speed

FastSim reaches where a Python engine cannot: FMI 3.0 import and export
for co-simulation, WebAssembly deployment, and dependency-free C99 code
generation for embedded targets. The generated C is verified
software-in-the-loop: sim.verify_c() compiles it locally and pins it against
the reference engine, sample by sample.

The engine ships with a technical report that states the theory and the
implementation together, and a benchmark suite that reruns every claim with
one command per study: fixed-order integrators are verified to converge at
their theoretical orders, accuracy is measured against reference solutions,
and comparisons cover SciPy, CasADi, and DifferentialEquations.jl.

## History

FastSim development started in April 2026, after the PathSim API had
stabilized and the SSA compute-graph architecture had proven itself across
the stack. Four months of development produced the engine, JIT, autodiff, FMI
export, and C code generation, tracking the PathSim API throughout. Commercial licensing funds the open system level.
