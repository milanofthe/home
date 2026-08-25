---
title: nanospice
accent: neutral
tagline: A classic SPICE circuit simulator in one Rust file, capped at 1000 lines of code.
group: reading
order: 30
repo: github.com/milanofthe/nanospice|https://github.com/milanofthe/nanospice
license: MIT open source
cta1: [ View on GitHub -> ]|https://github.com/milanofthe/nanospice
---

![Where the lines go|right|46x15|contain](/images/nanospice-slide-budget.png)

nanospice is a classic SPICE circuit simulator in one Rust source file, capped
at 1000 lines of code by a test that counts the file and fails the build above
it. Operating point, DC sweep, transient with an adaptive timestep and AC, on
modified nodal analysis with branch currents for voltage sources and inductors.
Newton-Raphson with pnjlim junction limiting, gmin stepping and source stepping
as operating point fallbacks, trapezoidal companion models with local truncation
error timestep control, and a sparse LU generic over real and complex scalars.

Every device stamp goes through two Verilog-A style contribution primitives, one
for currents and one for voltage-defined branches, which is what leaves room for
eleven device types: diodes, level 1 MOSFETs, JFETs, Ebers-Moll BJTs, the
passives, sources with sine, pulse and piecewise linear waveforms, and
controlled sources. Junction capacitances desugar into internal graded
capacitors instead of separate model code.

![Results: it oscillates|left|46x15|contain](/images/nanospice-slide-osc.png)

Twenty three tests check the binary against analytic references: RC and RL step
responses, LC amplitude and energy conservation, MOSFET, JFET and BJT bias
points, and a randomized resistor ladder against a Thevenin reduction computed
inside the test. That ladder is also the scaling picture. Below a thousand nodes
the process startup dominates; beyond it the wall clock follows the node count
linearly out to thirty thousand nodes.

Not in it: subcircuits, .param, noise analysis. The report lists them with the
lines each would have cost.

## History

A side project, to see how far 1000 lines of code get you. The report that came
out of it derives every algorithm, traces the algorithm set back to its Berkeley
origins, and maps both to the code section by section; there are slides for a
thirty minute talk on the same material.

[nanofem](/stack/nanofem/) came out of the same question, for electromagnetic
fields.
