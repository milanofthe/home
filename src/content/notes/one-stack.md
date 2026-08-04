---
title: One stack for fields, circuits, and systems
date: 2026-08-04
project: stack
description: Why I am building one vertically integrated simulation stack for electronics, and what a single coherent architecture unlocks that the fragmented EDA landscape cannot.
---

Electronics simulation is split across abstraction levels: electromagnetic
fields, circuits, and systems. The commercial EDA world splits these levels
across vendors, file formats, and decades of legacy code. Every handoff
between levels (extracting a model from a field solve, embedding a circuit
in a system simulation) crosses a tool boundary, and every boundary costs
accuracy, money, and engineering time.

I am building the alternative as one vertically integrated stack, one level at
a time:

- systems: [PathSim](/stack/pathsim/), an open-source Python framework for hybrid dynamical systems, and [FastSim](/stack/fastsim/), its drop-in Rust engine with JIT compilation and automatic differentiation
- circuits: [SANE](/stack/sane/), a symbolic analog network engine where one hash-consed symbolic DAG yields DC, transient, AC, noise, harmonic balance, and exact parameter sensitivities
- fields: [RapidMoM](/stack/rapidmom/), a 2.5D Method-of-Moments solver for planar RF passives, and [RapidFEM](/stack/rapidfem/), a Maxwell FEM solver with frequency- and time-domain backends
- foundations: [RSLAB](/stack/rslab/), a pure-Rust sparse direct solver, and [RapidMesh](/stack/rapidmesh/), an exact-arithmetic mesh generator

## One architecture

The layers share one architecture: SSA-style
compute graphs at the heart of the engines, Rust cores with no black-box
native dependencies, Python APIs on top, and browser interfaces where a UI
earns its keep. The solvers underneath are built for solver-in-the-loop
operation (deterministic, budgetable, embeddable) because optimization
loops, parameter sweeps, and co-simulation are the normal case in real
engineering work, not the exception.

Vertical integration is not about owning every layer for its own sake. It is
about what becomes possible when the layers speak the same language: a field
solve that hands a reduced-order model directly to a circuit engine, a
circuit whose exact sensitivities flow into a system-level optimization,
one autodiff story from Maxwell to block diagram.

## Open where it builds trust, licensed where it creates value

PathSim is MIT open source and stays that way. It is JOSS-published, used at
the MIT Plasma Science and Fusion Center and by JSBSim developers, and the
community around it is the best code review I could ask for. The commercial
engines (FastSim, SANE, RapidMoM) are source-available, free for academia,
and commercially licensed. That split funds the open layers.

If your team is fighting the tool-boundary problem (Simulink migration,
solver development, co-simulation architecture, licensing one of the
engines), [that is exactly the work I take on](/consulting/).
