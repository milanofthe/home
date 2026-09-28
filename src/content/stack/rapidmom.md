---
title: RapidMoM
accent: rapidpassives
tagline: 2.5D Method-of-Moments for planar RF passives on layered substrates.
group: fields
order: 5
site: mom.rapidpassives.org|https://mom.rapidpassives.org
license: early access / free for academia / commercial licenses
cta1: [ Download the evaluation kit -> ]|https://mom.rapidpassives.org/rapidmom-evalkit.zip
cta2: [ Request evaluation -> ]|mailto:rapidmom@milanrother.com?subject=RapidMoM%20evaluation
---

RapidMoM is a 2.5D Method-of-Moments solver for planar RF passives on layered
substrates: PCB and RFIC, from single inductors and transformers to full
metal layouts on a real process stack. The formulation is a mixed-potential surface
integral equation with an RWG basis, an A-EFIE saddle-point system against the
low-frequency breakdown (stable down to DC), layered-media Green's functions
in the Michalski-Mosig formulation, and a kernel-independent ACA / H-matrix
fast solver with block-GMRES, preconditioned by a sparse LU of the near field
from [RSLAB](/stack/rslab/).

## Converging the network

![Transformer mesh|right|46x14](/images/rapidmom-mesh.png)

A GMRES residual bounds the algebraic error, but a port observable can be a
small difference of large quantities (a quality factor, for instance) or live
in a different block of the saddle system entirely. RapidMoM
therefore continues the solve down a tolerance ladder, warm-started, until the
port network itself stops moving. A solve is reproducible bit for bit, and its
network does not depend on the path the solver took: another preconditioner or
a hundredfold tighter tolerance moves S by round-off.

## Ports

Ports come in two kinds. A lumped port is an ideal source between two
references, each a contact on a metal layer or the ground: an in-plane gap cut
across a conductor, or a band of the conductor at its terminal, driven against
the backside ground or a second contact. The source has zero length and no feed
geometry, so the reference plane is at the metal and nothing needs de-embedding;
the current distribution over the cross-section, edge singularity and skin
crowding included, comes out of the solve.

A calibrated port attaches a feed of the terminal's cross-section that carries
the line's discrete mode, incident and reflected, with its propagation constant
and a complex characteristic impedance solved on a periodic strip of the port's
metal at every frequency. The network is referenced to the drawn terminal
without line standards to fit, and terminals side by side share one feed that
carries the pair's even and odd modes.

## Capacitance without the full-wave solve

The A-EFIE saddle carries both potentials: the vector potential in the
edge-current block, the scalar potential in the patch-charge block. A
capacitance is a statement about the scalar potential alone, so dropping the
magnetic half leaves a system in the charges and node potentials that yields
the Maxwell C and G matrices over the design's galvanic nets directly, without
solving the full-wave problem at all.

## Conductor models and outputs

![Current density|left|46x14](/images/rapidmom-current.png)

Two conductor models are available per metal. The thin model is the classical
2.5D treatment: one RWG current sheet per metal with the two-sided skin-effect
surface impedance, the right choice for metals thinner than a skin depth. The
thick model carries both faces and the side walls of a conductor, coupled
through the exact differential surface admittance of its cross-section, so the
current crowding across the thickness and into the corners comes out of the
solve. Output is standard Touchstone (S, Y, Z) plus the device metrics
engineers design against: L, Q, coupling.

Validation runs against closed-form analytics, 2D field referees, physical
invariants (Lorentz reciprocity, mutual-sign checks, skin-effect rise) and an
independent reference solver on controlled cases before any device claim is
made. The evaluation kit, fourteen devices on the IHP SG13G2 stack solved on
both conductor paths with their Touchstones, run logs and a generated report,
is available for download.

## Built for sweeps

Pure Rust with a Python API: lightweight, installs in seconds, built for large
parameter sweeps. Solver controls are first-class API, so embedding needs no
environment variables. A sweep either solves every requested frequency or
adapts: a few exact solves and a rational model through them, the next solve
placed where the model is least certain by a leave-one-out estimate, passivity
checked at every requested frequency. Over 1 to 40 GHz that takes 10 to 17
solves for inductors, transformers, capacitors and lines at 1e-3 on S, and the
model gives S anywhere in the band.

## History

RapidMoM development started in June 2026, in the same push that produced
[RapidMesh](/stack/rapidmesh/) and [RSLAB](/stack/rslab/): the planar solver,
its mesher, and its linear algebra grew together as one vertically integrated
unit. The solver is in early access for evaluation.
