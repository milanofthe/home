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

nanospice is a SPICE circuit simulator in one Rust source file, src/main.rs, with
no dependencies outside the standard library. A test counts the nonblank,
noncomment lines of that file and fails the build above 1000. The current count
is 1000.

The point of the cap is that every feature has to displace another one, which
makes the cost of each decision explicit and keeps the whole simulator readable
in one sitting.

## What fits in 1000 lines

![Ring oscillator: three inverters in a loop|right|46x15|contain](/images/nanospice-ring.png)

Four analyses: operating point, DC source sweep, transient with an adaptive
timestep, and AC. Modified nodal analysis with branch currents for voltage
sources, inductors and controlled sources. Every device stamp goes through two
Verilog-A style contribution primitives, one for currents and one for
voltage-defined branches, which is what keeps eleven device types inside the
budget.

Newton-Raphson with pnjlim junction limiting, and gmin stepping and source
stepping as operating point fallbacks. Transient uses trapezoidal companion
models, a quadratic predictor, local truncation error timestep control, and
waveform breakpoints with damped backward Euler restart steps. AC linearizes at
the operating point. The linear solver is a sparse LU with partial pivoting,
generic over real and complex scalars.

The device set is diodes, MOSFETs at level 1, JFETs, Ebers-Moll BJTs, resistors,
capacitors, inductors, independent sources with sine, pulse and piecewise linear
waveforms, and voltage and current controlled sources. Junction capacitances
desugar into internal graded capacitors rather than into separate model code.

## What it costs

![Operating point of resistor ladders|left|46x15|contain](/images/nanospice-bench.png)

Twenty three integration tests run the release binary against analytic
references: RC and RL step responses, an RC corner frequency, LC amplitude and
energy conservation, MOSFET, JFET and BJT bias points, an npn/pnp symmetry
check, and a randomized resistor ladder verified against a Thevenin reduction
computed inside the test.

The ladder benchmark is the scaling picture. Below about a thousand nodes the
1.7 ms process startup dominates; beyond it the wall clock follows the node
count linearly through the last point, 30 ms for a thirty thousand node ladder.

Not supported, and listed with reasons in the report: subcircuits, .param, noise
analysis.

## The report

The repository carries a report that traces the algorithm set to its Berkeley
origins, derives every algorithm in the simulator, explains the design decisions
the budget forced, and maps both to the code section by section. Slides for a
thirty minute talk cover the same material. Both are committed as prebuilt PDFs,
and the plots in them regenerate from the release binary with one command.

[nanofem](/stack/nanofem/) is the same exercise for electromagnetic fields.
