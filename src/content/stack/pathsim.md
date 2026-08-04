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
systems. Built from first principles with custom solvers, an event system, and
a modular block-diagram API. A modern, open alternative to Simulink, with
mutability from the get-go and robust solvers that handle stiffness and
algebraic loops without ceremony.

![pathsim.org|right|46x14](/screenshots/pathsim-org.png)

It is hybrid by design: continuous dynamics and discrete events live in one
simulation, with zero-crossing detection, scheduled events, and conditions for
hybrid systems. Over 30 ODE solvers, explicit and implicit, adaptive and
fixed-step, cover everything from smooth mechanical models to stiff chemical
kinetics.

![Documentation|left|46x14](/screenshots/docs-pathsim-org.png)

PathSim is published in JOSS, adopted by JSBSim for flight dynamics, and used
at the MIT Plasma Science and Fusion Center for nuclear fusion fuel-cycle
modeling. Domain toolboxes cover chemical engineering, batteries, vehicles,
flight dynamics, RF, and FMI co-simulation, several of them
community-contributed.

## In the stack

PathSim is the system level of the stack and its open foundation: the API that
[FastSim](/stack/fastsim/) accelerates as a drop-in Rust engine and that
[PathView](/stack/pathview/) edits visually in the browser.
