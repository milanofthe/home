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
substrates: PCB and RFIC. Mixed-potential formulation, stable down to DC,
layered-media Green's functions, and a fast ACA / H-matrix solver in
O(N log N).

![Transformer mesh|right|46x14](/images/rapidmom-mesh.png)

It is zero-external-dependency pure Rust with a Python API: lightweight,
installs in seconds, and built for massive cloud parameter sweeps. Broadband
S-parameters of an SG13G2 spiral come out of a ROM sweep in about 5 seconds
within roughly 600 MB, validated on the real IHP SG13G2 stack.

![Current density|left|46x14](/images/rapidmom-current.png)

The solver converges the network, not just the algebraic residual: a
network-refinement ladder continues the solve, warm-started, until the
port-space network stops moving, so quality factors and grounded-port
readings land on the dense-operator answer instead of drifting with the
iterative tolerance.

## In the stack

RapidMoM is the planar field level: it turns layout into models that
[SANE](/stack/sane/) and the system level consume, meshed by
[RapidMesh](/stack/rapidmesh/) and solved on [RSLAB](/stack/rslab/)
infrastructure.
