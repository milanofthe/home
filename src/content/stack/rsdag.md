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

RSDAG traces ODE and DAE systems into an op-level expression graph, runs
compiler-style optimizations over it, and emits machine code directly. The
graph already fixes the ops, their order and the memory layout, so no
external compiler sits in the loop. The same program also runs interpreted,
as a flat tape. CasADi and JAX build on the same idea. RSDAG is narrower on
purpose: it is a backend for simulators, with the interfaces a solver needs
in its inner loop and little else.

## From expression to tape

![Pipeline|center|114x24|contain](/images/rsdag-pipeline.png)

Nodes are hash-consed, so a subexpression shared by a residual and its
Jacobian is one node, and the constructors fold constants and apply the
algebraic identities while the graph is built. Differentiation, forward and
reverse, writes into the same graph. The tape compiler lowers a set of roots
into instructions, schedules them for register pressure and gives them slots
by lifetime. Row dots against one vector become a matrix-vector kernel,
against several vectors a matrix product, and a dense system a pivoting
solve. Calls of one model body over many instances become one batched call.

## Prolog and main

![A diode as a tape|right|44x22|contain](/images/rsdag-tape.png)

Parameters are part of the graph. Everything that depends on them alone goes
into a prolog that runs once per parameter binding, and the main phase runs
per iteration and reads the prolog's results from a state buffer. Here a
diode current and its derivative: 1/(n vt) is the prolog, the dashed edges
are the state crossing into the main phase, and the exponential is guarded
against overflow.

Choices specialize the same way. A tape records which arm of each select it
took, and a specialized tape runs that region without the branches, with the
conditions left in as guards. When a guard fails, the region changed and the
full tape takes over again.

## Native code

![Interpreter, specialization, native code|right|50x17|contain](/images/rsdag-adaptive.png)

The native backend writes the tape's instruction sequence as machine code
for AArch64 and x86-64, straight from the tape. A program is served per
call: by the interpreter from the first call, by a specialized tape once a
region is stable, by native code once the background compile is done. All
backends compute the same IEEE operation sequence, no fast-math and no
fused multiply-add, so a switch in the middle of a solve changes no bits.
The test suites check that on random programs over the whole op vocabulary.

## The solver in the graph

![Solver path|center|114x23|contain](/images/rsdag-solver-path.png)

Roles say what each input of a model is: state, derivative, parameter, time,
delay history, or a guard with its crossing direction. A signature orders
them into the programs a solver drives. From the residuals and a sparse
Jacobian, a guarded Newton step compiles into one program. The solver keeps
the loop, the step control and the event policy, and evaluates into buffers
it owns, without an allocation in the inner loop.

![Sparse LU as a program|left|46x22|contain](/images/rsdag-lu.png)

A sparse LU on a known pattern lowers into ops as well: block triangular
form, a minimum-degree ordering, and a static LU whose pivots are fixed at
build time and guarded. With the matrix entries as parameters, the
factorization is the prolog and the substitution the main phase. When a
guard fails, the pivots are taken from the current values and the program is
rebuilt. Wide panels go to dense kernels.

![Sparse solve against KLU|center|90x16|contain](/images/rsdag-solve-bench.png)

This pays off on sparse, circuit-shaped patterns, where the whole
factorization is a few dozen ops per unknown. On a mesh the fill grows with
size and a library like [RSLAB](/stack/rslab/) wins. The plot shows where
the line runs, against the KLU path of RSLAB.

## History

Building [FastSim](/stack/fastsim/) earlier this year led me down a rabbit
hole of computational graphs and expression trees. Having the ODE or DAE
available symbolically at the op level gives a solver a lot: analytical
Jacobians, the sparsity pattern, stiffness and nonlinearity detection, which
is also how a system gets partitioned for harmonic balance. It is a handy
intermediate representation, and it puts the op count next to the modeling
question: in the end it is all memory and ops. So why stop at the model?
Lower the solver into the graph too, and evaluating the graph gives the
solution, or brings you close to it when solving iteratively.

In September 2026 I took the expression graph backends of FastSim and
[SANE](/stack/sane/) out into a library of their own. SANE runs on it now:
its hot tapes, its compact model bodies and its sparse LU are RSDAG programs.
