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

nanospice is a classic SPICE circuit simulator in one Rust source file, capped
at 1000 lines of code by a test that counts the file and fails the build above
it. Four analyses fit under the cap: operating point, DC sweep, transient with
an adaptive timestep, and AC. Modified nodal analysis with branch currents for
voltage sources and inductors, Newton-Raphson with pnjlim junction limiting,
gmin stepping and source stepping as operating point fallbacks, trapezoidal
companion models with LTE timestep control, and a sparse LU generic over real
and complex scalars.

## Two primitives carry every device

![Where the lines go|right|46x15|contain](/images/nanospice-slide-budget.png)

Every device stamp goes through two Verilog-A style contribution primitives, one
for currents and one for voltage-defined branches. That is what leaves eleven
device types inside the budget: diodes, level 1 MOSFETs, JFETs, Ebers-Moll BJTs,
the passives, independent sources with sine, pulse and piecewise linear
waveforms, and voltage and current controlled sources. Junction capacitances
desugar in the parser into internal graded capacitors, so no device model
carries charge storage of its own and the AC path sees them as capacitors.

The parser is the largest section at 275 lines, ahead of the solver at 142 and
the sparse LU at 121. Device models are 64 lines for all eleven.

![Results: it oscillates|left|46x15|contain](/images/nanospice-slide-osc.png)

## History

SPICE 2G6 is 14595 nonblank, noncomment lines of Fortran, SPICE 3f5 126697 lines
of C, ngspice today 562128. Most of that is device models, UI and compatibility
rather than algorithm, and I wanted to know what is left of the algorithm once
all of it is gone. A thousand lines turned out to be enough for the 1975 core,
complete: sparse LU, Newton with limiting and homotopy fallbacks, trapezoid with
LTE, breakpoints and damped restarts, graded junction capacitances, AC from the
DC Jacobian. The algorithm set is fifty years old and still carries a working
simulator.

The report derives every algorithm and traces the set back to its Berkeley
origins, from Rohrer's 1969 class through CANCER to SPICE; there are slides for
a thirty minute talk on the same material.

[nanofem](/stack/nanofem/) asks the same question of electromagnetic fields.
