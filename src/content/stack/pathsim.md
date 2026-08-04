---
title: PathSim
accent: pathsim
tagline: Open-source system simulation in pure Python.
group: systems
order: 1
site: pathsim.org|https://pathsim.org
repo: github.com/pathsim/pathsim|https://github.com/pathsim/pathsim
license: MIT open source / PyPI + conda-forge
cta1: [ Read the docs -> ]|https://docs.pathsim.org
cta2: [ PathSim integration & support -> ]|/consulting/
---

PathSim is a pure-Python framework for modeling and simulating dynamical
systems. Connect sources, integrators, functions, and scopes to build
continuous-time, discrete-time, or hybrid systems as block diagrams. Built
from first principles with custom solvers, an event system, and a modular
block API. Minimal dependencies: numpy, scipy, matplotlib.

```python
from pathsim import Simulation, Connection
from pathsim.blocks import Integrator, Amplifier, Adder, Scope

# damped harmonic oscillator: x'' + 0.5x' + 2x = 0
int_v = Integrator(5)       # velocity, v0=5
int_x = Integrator(2)       # position, x0=2
amp_c = Amplifier(-0.5)     # damping
amp_k = Amplifier(-2)       # spring
add, scp = Adder(), Scope()

sim = Simulation(
    blocks=[int_v, int_x, amp_c, amp_k, add, scp],
    connections=[
        Connection(int_v, int_x, amp_c),
        Connection(int_x, amp_k, scp),
        Connection(amp_c, add),
        Connection(amp_k, add[1]),
        Connection(add, int_v),
    ],
    dt=0.05,
)
sim.run(30)
scp.plot()
```

## What sets it apart

- Hot-swappable: modify blocks, parameters, and solvers during a running simulation
- Stiff solvers: implicit methods (BDF, ESDIRK) among 30+ explicit and implicit, adaptive and fixed-step integrators
- Hybrid by design: zero-crossing detection, scheduled events, and conditions make discrete events first-class citizens next to continuous dynamics
- Hierarchical: nest subsystems for modular designs; algebraic loops are handled robustly
- Extensible: subclass Block to create custom components in plain Python

![pathsim.org|right|46x14](/screenshots/pathsim-org.png)

PathSim is published in JOSS, adopted by JSBSim for flight dynamics, and used
at the MIT Plasma Science and Fusion Center for nuclear fusion fuel-cycle
modeling. Domain toolboxes cover chemical engineering, batteries, vehicles,
flight dynamics, RF, and FMI co-simulation, several of them
community-contributed.

![Documentation|left|46x14](/screenshots/docs-pathsim-org.png)

Install with pip install pathsim or conda install conda-forge::pathsim. The
documentation at docs.pathsim.org has tutorials, end-to-end examples, and the
full API reference.

## In the stack

PathSim is the system level of the stack and its open foundation: the API that
[FastSim](/stack/fastsim/) accelerates as a drop-in Rust engine and that
[PathView](/stack/pathview/) edits visually in the browser.
