---
title: RSDAG
accent: rslab
tagline: Rust Symbolic Directed Acyclic Graph. The expression graph compiler under the solvers.
group: foundations
order: 9
repo: github.com/milanofthe/rsdag|https://github.com/milanofthe/rsdag
license: AGPL-3.0 open source / commercial licenses
cta1: [ View on GitHub -> ]|https://github.com/milanofthe/rsdag
cta2: [ Request a commercial license -> ]|mailto:info@milanrother.com?subject=RSDAG%20licensing
---

RSDAG traces ODE and DAE systems into an op-level expression graph,
optimizes it like a compiler and emits machine code, or runs the same program
as an interpreted tape. The idea is the one of CasADi and JAX, narrower on
purpose: a backend for simulators.

## From expression to tape

![Pipeline|center|114x24|contain](/images/rsdag-pipeline.png)

Nodes are hash-consed, so a residual and its Jacobian share their common
subexpressions, and constants fold while the graph is built. Differentiation
writes into the same graph. The tape compiler schedules for register
pressure, turns row dots into matrix kernels, and batches the calls of one
model body over all its instances; a body that calls others compiles once,
as a template.

## Prolog and main

![A diode as a tape|right|44x22|contain](/images/rsdag-tape.png)

Whatever depends on parameters alone becomes a prolog that runs once per
binding, and the main phase runs per iteration. In the diode here, 1/(n vt)
is the prolog. Selects specialize the same way: a tape records the arms
taken and drops the branches, with guards that hand back to the full tape
when the region changes.

![Model bodies as a tape|left|46x23|contain](/images/rsdag-bodies.png)

A model body called from many instances splits the same way: its prolog
runs once per instance, its main phase as one batched call over all of them.

## Native code

![Interpreter, specialization, native code|right|50x17|contain](/images/rsdag-adaptive.png)

The native backend writes the tape as AArch64 or x86-64 machine code. The
interpreter serves from the first call, a specialized tape once a region is
stable, native code once the background compile is done, all on the same
IEEE operation sequence, so no switch changes a bit. Independent calls run
as parallel stages, with the same results for any number of threads.

## The solver in the graph

![Solver path|center|114x23|contain](/images/rsdag-solver-path.png)

Roles say what each input is, state, derivative, parameter, time, delay or
guard, and a signature orders them into the programs a solver drives: the
residuals and their sparse Jacobian in one program, the guards reporting the
events. The solver keeps the loop and the step control, factors the
Jacobian with a sparse LU library such as [RSLAB](/stack/rslab/), and
evaluates into its own buffers.

## History

Building [FastSim](/stack/fastsim/) earlier this year led me down a rabbit
hole of computational graphs. An ODE or DAE at the op level gives a solver a
lot: analytical Jacobians, the sparsity pattern, stiffness and nonlinearity
detection. It also puts the op count next to the modeling question, since in
the end it is all memory and ops. So why stop at the model? Lower the solver
into the graph too, and evaluating the graph gives the solution.

In September 2026 I took the expression graph backends of FastSim and
[SANE](/stack/sane/) out into a library of their own.
