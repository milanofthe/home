---
title: SANE
accent: sane
tagline: Symbolic Analog Network Engine, symbolic and numeric circuit analysis.
group: circuits
order: 4
site: sane.milanrother.com|https://sane.milanrother.com
license: core engine in early access / free for academia / commercial licenses
cta1: [ Try it live -> ]|https://sane.milanrother.com
cta2: [ Request early access -> ]|mailto:info@milanrother.com?subject=SANE%20early%20access
---

SANE extracts the differential-algebraic system F(x, x', t) = 0 from a circuit
and analyzes it symbolically and numerically: DC operating point, transient,
small-signal AC, poles/zeros, noise, harmonic balance, and exact first- and
second-order parameter sensitivities for each of those, all by automatic
differentiation of one hash-consed symbolic DAG.

![SANE|right|46x14](/screenshots/sane-app.png)

The graph preserves the circuit's symbolic structure and hierarchy and
exploits it throughout. SPICE and native Verilog-A frontends lower compact
models (BSIM, PSP, HICUM, ...) fully into the graph, so every parameter stays
exposed to the autodiff, even in harmonic balance. That makes sweeps,
optimization, and yield analysis first-class citizens instead of finite-difference
afterthoughts.

![Symbolic graph|left|46x14](/screenshots/sane-graph.png)

The engine is a Rust core with threaded sparse LU (via
[RSLAB](/stack/rslab/)), an optional Cranelift JIT, and a Python API. It is
validated against ngspice and Xyce and scales past 100k parameters on the IBM
power-grid benchmarks.

## In the stack

SANE is the circuit level: below it, the field solvers extract the models it
consumes; above it, exact sensitivities flow into system-level optimization.
