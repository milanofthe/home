---
title: SANE
accent: sane
tagline: Symbolic Analog Network Engine. Symbolic and numeric circuit analysis.
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

## Frontends and devices

![SANE|right|46x14](/screenshots/sane-app.png)

The SPICE frontend parses .param expressions, .subckt hierarchy, .model cards,
and the standard source waveforms (SIN, PULSE, EXP, PWL). Devices cover the
classic set: diodes, MOSFETs, BJTs (Gummel-Poon), JFETs, MESFETs, controlled
sources and switches, behavioral sources, and transmission lines. The web app
at sane.milanrother.com runs the full engine in the browser.

![Schematic, netlist and graph|left|46x14](/images/sane-twin-t.png)

Schematic, netlist and the graph the engine actually solves are three views of
one circuit, live next to each other. Here a twin-T notch filter: seven
elements, small enough that the whole DAG fits on screen next to the drawing
it came from.

![Symbolic graph|right|46x14](/screenshots/sane-graph.png)

Compact models go the same way. The usual route into a simulator is an OSDI
binary compiled from the Verilog-A source, which is fast but opaque to
everything upstream of it. SANE instead lowers the Verilog-A onto the same
DAG, with no OSDI binary and no generated code. This costs some extra work at
model load, but in return every model parameter stays exposed to the
autodiff, even in harmonic balance. Temperature is a first-class symbolic global, so .temp
sweeps are physical and d(metric)/dT is exact. Noise sources (thermal, shot,
flicker, Verilog-A noise) are summed in one registry.

![Common-emitter stage, full graph|left|46x14](/images/sane-common-emitter.png)

A common-emitter stage is one transistor and seven passives, and the
Gummel-Poon model of that single BJT is most of the graph shown here. Every
node in it is differentiable, and every parameter of the compact model is
still a symbol the sensitivity analysis can reach.

## The engine

Rust core: hash-consed symbolic DAG, autodiff, threaded sparse LU (via
[RSLAB](/stack/rslab/)), optional Cranelift JIT. Python binding via PyO3, or
embed the whole engine in Rust with no Python at all.

## Validation

Every claim is checked against independent references on real circuits: more
than sixty decks spanning RC networks, textbook transistor stages, the uA741,
production SKY130 AnalogGym operational amplifiers, and IBM power grids past
100k nodes. DC operating points agree with ngspice within a millivolt across
the corpus, harmonic balance is checked against Xyce, and the symbolic
transfer functions against Lcapy. Cold DC solves run in 0.015 to 2.5 ms at
the raw engine call.

## History

SANE is the return to my RFIC EDA roots, and the third time I have written
this tool. The first was MiCir in 2019, a symbolic network analysis library
built on nothing but Python's math module: my own matrix class, my own complex
arithmetic, symbolic element types in s, netlists in and Cauer ladders out.
The second was the exact parameter sensitivities in my master's thesis, where
the first and second partial derivatives of RLCk transfer functions are read
analytically off the block structure of the MNA matrices. The autodiff over
the DAG is the general version of that.

It also builds on work I did together with Ralf Sommer, the inventor of
Analog Insydes, on reviving that tool from December 2024 on.

The direct trigger came from the other end of the stack:
[FastSim](/stack/fastsim/) had just been built on SSA compute graphs, Python
callbacks traced into a flat tape and differentiated symbolically, and
carrying that representation over to circuits looked like the obvious next
step, with Analog Insydes in the back of my mind throughout. Matt
Keeter's writing on SSA graphs for implicit surfaces was the other half of the
push: the same representation, an entirely different field.

In June 2026 I picked the ideas up on my own stack. The first two months
produced the SPICE parser, the symbolic DAG engine, the full set of analyses,
and the Verilog-A frontend. The web app at sane.milanrother.com is public;
the core engine is in early access.
