---
title: RapidMoM
accent: rapidpassives
tagline: 2.5D Method-of-Moments for planar RF passives on layered substrates.
group: fields
order: 5
license: early access / free for academia / commercial licenses
cta1: [ Request evaluation -> ]|mailto:rapidmom@milanrother.com?subject=RapidMoM%20evaluation
---

![Current density on a full op-amp layout|right|46x14](/images/rapidmom-opamp-current.png)

RapidMoM is a 2.5D Method-of-Moments solver for planar RF passives on layered
substrates: PCB and RFIC, from single inductors and transformers to full
metal layouts on a real process stack. The formulation is a mixed-potential surface
integral equation with an RWG basis, an A-EFIE saddle-point system against the
low-frequency breakdown (stable down to DC), layered-media Green's functions
in the Michalski-Mosig formulation, and a kernel-independent ACA / H-matrix
fast solver with block-GMRES in O(N log N).

## Converging the network, not the residual

![Transformer mesh|right|46x14](/images/rapidmom-mesh.png)

A GMRES residual bounds the algebraic error, but a port observable can be a
small difference of large quantities (that is exactly what a quality factor
is) or live in a different block of the saddle system entirely. RapidMoM
therefore continues the solve down a tolerance ladder, warm-started, until the
port-space network itself stops moving, including a dedicated criterion for
the real part. Every port configuration lands on the dense-operator answer
instead of drifting with the iterative tolerance.

Ports are one primitive: a current driven between two contacts, each an
oriented segment on a metal layer. The excitation is a voltage source across
the gap, never an imposed current profile, so edge singularity and skin
crowding come out of the solve. Ambiguous port placements are rejected in a
preflight instead of guessed.

## Conductor models and outputs

![Current density|left|46x14](/images/rapidmom-current.png)

Two production conductor models are available per layer. The sheet model is
the classical 2.5D treatment: one RWG current sheet per metal with the
two-sided skin-effect surface impedance, the right default for thin metals.
The boxed model treats each conductor as a closed thick box with the
conductor interior entering through the slab internal-impedance two-port.
Output is standard Touchstone (S, Y, Z) plus the extracted device metrics
engineers actually design against: L, Q, coupling.

Validation runs against closed-form analytics, physical invariants (Lorentz
reciprocity, mutual-sign checks, skin-effect rise), and an independent
reference solver on controlled cases before any device claim is made. The
evaluation report is fully auto-generated from the same pipeline, so every
number is reproducible.

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
