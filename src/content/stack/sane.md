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

```python
import numpy as np
import sane

model = sane.Circuit.parse("""
    V1 in 0 5
    R1 in out 1k
    C1 out 0 1u
""").extract()

op   = model.operating_point()          # DC bias, labeled by node
ss   = model.small_signal("V1", "out")  # linearize at the bias
ss.poles()                              # [-1000.+0.j], the RC pole
traj = model.transient(np.linspace(0, 5e-3, 200))
sens = op.sensitivity("out")            # exact dy/dp, one adjoint solve
sens.ranked()                           # parameters by relative sensitivity
```

Results are labeled by node and parameter name, not positional vectors. A
result object keeps its solved state, so derived analyses need no re-solve,
and parameters read and write hierarchically: model.X1.R2 = 1e3.

![SANE|right|46x14](/screenshots/sane-app.png)

## Frontends and devices

The SPICE frontend parses .param expressions, .subckt hierarchy, .model cards,
and the standard source waveforms (SIN, PULSE, EXP, PWL). Devices cover the
classic set: diodes, MOSFETs, BJTs (Gummel-Poon), JFETs, MESFETs, controlled
sources and switches, behavioral sources, and transmission lines.

Compact models are the differentiator: Verilog-A modules (BSIM, PSP, HICUM,
VBIC, EKV, ...) are compiled natively onto the same DAG. Every parameter stays
exposed to the autodiff, even in harmonic balance. Temperature is a first-class
symbolic global, so .temp sweeps are physical and d(metric)/dT is exact. Noise
sources (thermal, shot, flicker, Verilog-A noise) are summed in one registry.

![Symbolic graph|left|46x14](/screenshots/sane-graph.png)

## The engine

Rust core: hash-consed symbolic DAG, autodiff, threaded sparse LU (via
[RSLAB](/stack/rslab/)), optional Cranelift JIT. Python binding via PyO3, or
embed the whole engine in Rust with no Python at all. Validated against
ngspice and Xyce; scales past 100k parameters on the IBM power-grid
benchmarks.

## History

SANE is the newest engine in the stack and the return to my RFIC EDA roots.
Development started in June 2026, inspired by Analog Insydes from Fraunhofer
ITWM. The first two months produced nearly 1000 commits and v0.2.0: SPICE
parser, symbolic DAG engine, the full set of analyses, and the Verilog-A
frontend. The web app at sane.milanrother.com is public; the core engine is
in early access.
