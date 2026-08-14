---
title: RapidMoM
accent: rapidpassives
tagline: 2.5D Method-of-Moments for planar RF passives on layered substrates.
group: fields
order: 5
license: early access / free for academia / commercial licenses
cta1: [ Request evaluation -> ]|mailto:rapidmom@milanrother.com?subject=RapidMoM%20evaluation
---

RapidMoM is a 2.5D Method-of-Moments solver for planar RF passives on layered
substrates: PCB and RFIC, from single inductors and transformers to full
metal layouts on a real process stack. The formulation is a mixed-potential surface
integral equation with an RWG basis, an A-EFIE saddle-point system against the
low-frequency breakdown (stable down to DC), layered-media Green's functions
in the Michalski-Mosig formulation, and a kernel-independent ACA / H-matrix
fast solver with block-GMRES in O(N log N).

## Converging the network

![Transformer mesh|right|46x14](/images/rapidmom-mesh.png)

A GMRES residual bounds the algebraic error, but a port observable can be a
small difference of large quantities (a quality factor, for instance) or live
in a different block of the saddle system entirely. RapidMoM
therefore continues the solve down a tolerance ladder, warm-started, until the
port-space network itself stops moving, including a dedicated criterion for
the real part. Every port configuration lands on the dense-operator answer
instead of drifting with the iterative tolerance.

## One port primitive

Ports are one primitive: a current driven between two contacts, each an
oriented segment on a metal layer, free in position, length and orientation.
The excitation is a voltage source across the gap, never an imposed current
profile, so the current distribution over the cross-section, edge singularity
and skin crowding included, comes out of the solve. A label point resolves at
build time to the conductor's terminal edge run; on an outline that runs along
a trace rather than ending at one, that resolution is ambiguous and the
preflight rejects it instead of guessing.

Two contact kinds and the ground plane give the usual port types out of that
one primitive: in-plane cuts, differential gaps whose loop closes locally,
vertical probes against the reference, and ports between two conductors on the
same or on different layers. All of them are ideal in the same sense, a
zero-length lumped source at the contact plane with no feed geometry and no
series impedance. The reference plane sits at the metal, so there is nothing
to de-embed and the networks compare directly against the port conventions of
commercial planar solvers.

## Capacitance without the full-wave solve

The A-EFIE saddle carries both potentials: the vector potential in the
edge-current block, the scalar potential in the patch-charge block. A
capacitance is a statement about the scalar potential alone, so dropping the
magnetic half leaves a system in the charges and node potentials that yields
the Maxwell C and G matrices over the design's galvanic nets directly, without
solving the full-wave problem at all.

## Conductor models and outputs

![Current density|left|46x14](/images/rapidmom-current.png)

Two production conductor models are available per layer. The sheet model is
the classical 2.5D treatment: one RWG current sheet per metal with the
two-sided skin-effect surface impedance, the right default for thin metals.
The boxed model treats each conductor as a closed thick box with the
conductor interior entering through the slab internal-impedance two-port.
Output is standard Touchstone (S, Y, Z) plus the device metrics
engineers design against: L, Q, coupling.

Validation runs against closed-form analytics, physical invariants (Lorentz
reciprocity, mutual-sign checks, skin-effect rise), and an independent
reference solver on controlled cases before any device claim is made. The
evaluation report is auto-generated from the same pipeline and available on
request.

## Built for sweeps

Zero-external-dependency pure Rust with a Python API: lightweight, installs in
seconds, built for massive cloud parameter sweeps. Solver controls are
first-class API (tolerances, warm-started sweeps, feed de-embedding), so
embedding needs no environment variables. Broadband S-parameters of an SG13G2
spiral come out of a ROM sweep in about 5 seconds within roughly 600 MB,
validated on the real IHP SG13G2 stack.

## History

RapidMoM development started in June 2026, in the same push that produced
[RapidMesh](/stack/rapidmesh/) and [RSLAB](/stack/rslab/): the planar solver,
its mesher, and its linear algebra grew together as one vertically integrated
unit. The solver is in early access for evaluation.
