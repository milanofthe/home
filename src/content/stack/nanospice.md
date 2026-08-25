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

![Line budget by code section|right|46x15|contain](/images/nanospice-slide-budget.png)

Every device stamp goes through two Verilog-A style contribution primitives, one
for currents and one for voltage-defined branches. That is what leaves eleven
device types inside the budget: diodes, level 1 MOSFETs, JFETs, Ebers-Moll BJTs,
the passives, independent sources with sine, pulse and piecewise linear
waveforms, and voltage and current controlled sources. Junction capacitances
desugar in the parser into internal graded capacitors, so no device model
carries charge storage of its own and the AC path sees them as capacitors.

Reading netlists costs more code than solving them: the parser is the largest
section in the file, ahead of the solver and the sparse LU, while all eleven
device models together come to 64 lines.

![Ring oscillator, transient|left|46x15|contain](/images/nanospice-slide-osc.png)

## History

SPICE 2G6 is 14595 nonblank, noncomment lines of Fortran, SPICE 3f5 126697 lines
of C, ngspice today 562128. Most of that is device models, UI and compatibility
rather than algorithm, and I wanted to know what is left once all of it is gone.
A thousand lines is roughly where something is still readable in a day: one
file, one sitting, nothing to chase down.

It was enough for the 1975 core, complete. The algorithm set is fifty years old
and still carries a working simulator.

The report is sized to match, and so is the talk: thirty minutes, slides in the
repository. It derives every algorithm and traces the set back to its Berkeley
origins, from Rohrer's 1969 class through CANCER to SPICE.

[nanofem](/stack/nanofem/) asks the same question of electromagnetic fields.
