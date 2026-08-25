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

After [SANE](/stack/sane/) I wanted to do a bit of classic SPICE, and talking to
people from the SPICE world made the idea concrete. VACASK is around twenty
thousand lines where ngspice is over half a million, which raised the question
of how much further down it goes. How much do you actually need?

The cap is an older habit. On the Python version of [PathSim](/stack/pathsim/) I
spent a long time holding everything under 2000 lines, after George Hotz's
tinygrad. A thousand turned out to be enough here for the 1975 core, complete;
the algorithm set is fifty years old and still carries a working simulator.

The report is sized to match, and so is the talk: thirty minutes, slides in the
repository.

[nanofem](/stack/nanofem/) asks the same question of electromagnetic fields.
