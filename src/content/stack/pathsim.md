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

## Solvers and events

![pathsim.org|right|46x14](/screenshots/pathsim-org.png)

PathSim is hot-swappable: blocks, parameters, and solvers can be modified
during a running simulation. The solver suite spans more than thirty explicit
and implicit integrators, adaptive and fixed-step, including stiff methods
like BDF and ESDIRK. Hybrid systems are first-class: zero-crossing detection,
scheduled events, and conditions put discrete events right next to continuous
dynamics. Subsystems nest hierarchically, algebraic loops are handled
robustly, and custom components are plain Python subclasses of Block.

PathSim is published in JOSS, adopted by JSBSim for flight dynamics, and used
at the MIT Plasma Science and Fusion Center for nuclear fusion fuel-cycle
modeling. Domain toolboxes cover chemical engineering, batteries, vehicles,
flight dynamics, RF, and FMI co-simulation, several of them
community-contributed.

![Documentation|left|46x14](/screenshots/docs-pathsim-org.png)

Install with pip install pathsim or conda install conda-forge::pathsim. The
documentation at docs.pathsim.org has tutorials, end-to-end examples, and the
full API reference.

## In fusion research

The MIT Plasma Science and Fusion Center and the UK Atomic Energy Authority
use PathSim as the orchestrating framework for tritium fuel cycle modelling.
The published workflow puts three fidelities in one timestepping loop: a
zero-dimensional residence time model of an ARC-class power plant, an
intermediate one-dimensional model of a liquid metal bubble column validated
against the literature, and high-fidelity multi-dimensional transport in the
finite element code FESTIM, wrapped as ordinary blocks. The same system model
scales down to lab experiments like BABY and LIBRA.

A component's fidelity is a property of the block, not of the framework, so a
residence-time approximation can be swapped for a finite element solve without
touching the system around it. A thirty-component bubbler transient solves in
seconds, which is what makes the Monte Carlo and uncertainty quantification
runs affordable.

The workflow is written up in *Physics-informed tritium fuel cycle modelling
workflow for fusion reactors*
([arXiv:2603.25751](https://arxiv.org/abs/2603.25751)), which I co-authored,
and I presented PathSim at the IAEA workshop on digital engineering for fusion
energy research in December 2025.

## History

PathSim started in early 2023, at the beginning of my PhD, as an analog
computer emulator side project. There was no repository at first, just a zip
archive: 31 snapshots between December 2023 and August 2024.

![December 2023, re-run today|right|46x14|contain](/images/timeline/pathsim-2023.png)

The earliest snapshot is from December 17, 2023. It already contains
Simulation, Connection, Integrator, Amplifier, Adder and Scope, the same
names the API uses today. The test cases back then: a damped harmonic
oscillator checked against the analytical solution, a slip-stick system with
Coulomb friction, and a radar system in a notebook. The figure shows the
December 2023 engine running its harmonic oscillator test, executed today.

The last zip is from August 11, 2024, the same day as the first commit on
GitHub. In March 2025 I announced PathSim as an open alternative to Simulink.

![The original pitch slide|left|46x14|contain](/images/pathsim-pitch.png)

The original pitch slide from spring 2025: block diagram on the left, the
same system in the API on the right, and the simulated response below.

Since then: a JOSS publication, roughly 400 GitHub stars, nine contributors,
adoption by JSBSim and the MIT Plasma Science and Fusion Center, and
community-contributed domain toolboxes.
[FastSim](/stack/fastsim/) accelerates the same API as a drop-in Rust engine,
and [PathView](/stack/pathview/) edits PathSim models visually in the
browser.
