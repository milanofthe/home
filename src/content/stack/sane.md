---
title: SANE
accent: sane
tagline: Symbolic Analog Network Engine. Symbolic and numeric circuit analysis.
group: circuits
order: 4
site: sane.milanrother.com|https://sane.milanrother.com
repo: github.com/milanofthe/sane|https://github.com/milanofthe/sane
license: PolyForm Noncommercial, free for academia / commercial licenses
cta1: [ Try it live -> ]|https://sane.milanrother.com
cta2: [ Request a commercial license -> ]|mailto:info@milanrother.com?subject=SANE%20licensing
---

SANE extracts the differential-algebraic system F(x, x', t) = 0 from a circuit
and analyzes it symbolically and numerically: DC, transient, small-signal AC,
poles/zeros, noise, harmonic balance, and exact parameter sensitivities for
each, all by automatic differentiation of one symbolic DAG.

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

Results are labeled by name and keep their solved state, and parameters read
and write hierarchically: model.X1.R2 = 1e3.

## Frontends and devices

![SANE|right|46x14](/screenshots/sane-app.png)

The SPICE frontend reads parameters, subcircuits, model cards and the
standard source waveforms, with the classic device set from diodes to
transmission lines. The web app runs the full engine in the browser.

![Schematic, netlist and graph|left|46x14](/images/sane-twin-t.png)

Schematic, netlist and the graph the engine solves are three live views of
one circuit, here a twin-T notch filter.

![Symbolic graph|right|46x14](/screenshots/sane-graph.png)

Compact models usually enter a simulator as compiled OSDI binaries, opaque
to everything upstream. SANE lowers the Verilog-A onto the same DAG instead,
so every model parameter stays exposed to the autodiff, temperature
included.

![Common-emitter stage, full graph|left|46x14](/images/sane-common-emitter.png)

In a common-emitter stage, the Gummel-Poon model of the single BJT is most
of the graph.

## The engine

A Rust core on [RSDAG](/stack/rsdag/), with tapes run interpreted or as
native code. Subcircuits are extracted once per definition, each compact
model body is compiled once for all its instances, and the sparse systems
go through [RSLAB](/stack/rslab/). Python via PyO3, or Rust alone.

## Validation

More than sixty decks, from RC networks to the uA741, the SKY130 AnalogGym
amplifiers and power grids past 100k nodes, checked against ngspice, Xyce
and Lcapy. The transient runs the VACASK benchmark suite, up to the c6288
multiplier with 10112 PSP103 transistors.

## History

SANE is the return to my RFIC EDA roots and the third time I have written
this tool: MiCir in 2019, a symbolic network analysis library on nothing but
Python's math module, then the exact sensitivities of my master's thesis,
read off the block structure of the MNA matrices. It also builds on reviving
Analog Insydes with its inventor Ralf Sommer from December 2024 on.

The trigger was [FastSim](/stack/fastsim/) and its SSA compute graphs;
carrying them over to circuits was the obvious next step, and Matt Keeter's
writing on SSA graphs for implicit surfaces the other half of the push. I
started in June 2026.
