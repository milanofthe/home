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
identical Python API. Your existing model runs 50-100x faster by changing one
line:

```python
# from pathsim import Simulation, Connection
from fastsim import Simulation, Connection
```

Python callbacks are automatically traced into an optimized SSA graph,
symbolically differentiated, and evaluated in Rust. No code generation step,
no toolchain on the user's machine, no model rewrite.

![Performance comparison|right|46x14](/images/fastsim-casadi-cold.png)

## The engine

- JIT compiler: Python functions traced into a flat-tape IR with common subexpression elimination, constant folding, strength reduction, and FMA detection
- Symbolic forward-mode automatic differentiation for analytical Jacobians
- 21 ODE solvers, explicit and implicit, adaptive and fixed-step, plus standalone use: RKDP54.integrate(func, x0, time_end=50) with automatic JIT
- jit(func) and jacobian(func) exposed as standalone JAX-style transformations
- Zero-copy data paths, flat DAG evaluation, dynamic block sizing
- Event handling, hierarchical subsystems, and mutable parameters, exactly like PathSim

![fast.pathsim.org|left|46x14](/screenshots/fastsim-org.png)

## Beyond speed

FastSim reaches where a Python engine cannot: FMI 3.0 export for
co-simulation, and C99 code generation for embedded targets. The generated C
is verified software-in-the-loop: sim.verify_c() compiles it locally and pins
it against the reference engine, sample by sample.

## History

FastSim development started in April 2026, after the PathSim API had
stabilized and the SSA compute-graph architecture had proven itself across
the stack. Over 1000 commits in four months took it to v0.9.0: engine, JIT,
autodiff, FMI export, and C code generation, tracking the PathSim API
throughout. Commercial licensing funds the open system level.
