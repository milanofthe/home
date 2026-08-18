---
title: falllow
accent: falllow
tagline: A distributed compute pool. Run your tests and builds on the machines you already own.
group: infrastructure
order: 20
site: falllow.com|https://falllow.com
license: closed source, private beta
cta1: [ Download the app -> ]|https://falllow.com/download
cta2: [ Read the docs -> ]|https://falllow.com/docs
---

falllow turns machines that are already yours into somewhere to run work. A
workstation that is idle overnight, a VPS between deployments, a colleague's box:
each one enrols once and then takes jobs. Submitting is a prefix on a command you
already run, and what comes back is that command's own output and its own exit
code.

```console
$ falllow run -- pytest -q
sending workspace (12 files, 1 new)
placed on ryzen-9900x - 8 threads reserved
........................................
40 passed in 6.21s
```

## Outbound only

A runner dials the control plane and holds the connection open. Nothing listens on
the machine, no port is forwarded, no address has to be stable. A laptop behind
CGNAT joins the pool exactly the way a rented server does, which is what makes
"the machines you already own" a real sentence rather than a slogan about
datacentres.

The same choice decides what enrolling costs. A machine redeems a token once; from
then on it is known by an identity of its own, not by whoever set it up.

## Workspaces that mostly do not move

Each job runs in a fresh tree, hard-linked out of a content-addressed store. The
submitting side hashes the working directory, asks which chunks the control plane
is missing, and sends only those. The second run of a test suite on a machine that
already has the repository ships the handful of files that changed.

Nothing survives between jobs except the caches, and those are explicit. A runner
keeps four layers and gives them up in a fixed order when disk runs short:
compiler output first, then workspace files, then downloaded packages, then
resolved environments. The order is the design. A compiler cache is cheap to
rebuild and expensive to keep; a resolved environment is the most expensive thing
on the machine to recreate.

## One submission, four machines

Sharding is a flag. The job becomes several independent jobs, each told its slice
through `FALLLOW_SHARD_INDEX` and `FALLLOW_SHARD_COUNT`, and the command decides
what to do with that. They land wherever there is room and reduce to a single exit
code.

```console
$ falllow run --shard 4 -- pytest -q
4 shards

shard 1/4   10 passed in 2.03s
shard 2/4   10 passed in 1.94s
shard 3/4   10 passed in 2.11s
shard 4/4   10 passed in 1.88s

all 4 shards succeeded
```

Which exit code comes back is a decision worth stating. A failing test exits with
the test runner's own code, unchanged. falllow reserves exactly one number, 170,
for its own failures: a lost runner, a workspace that would not transfer. Only
those are ever retried. A retry loop that cannot tell a broken machine from a
broken test is a retry loop that hides the second kind.

## A job cannot take the machine with it

Every job runs in a container, and that is not a setting. The isolation floor is
forced when the job is inserted, so no submission can ask for less. A job is other
people's code on somebody else's computer, and the container is the only thing
standing between the two.

Threads and memory are reserved per job and enforced by the kernel rather than
asked for politely: cgroups on Linux, job objects on Windows, with the process
tree held inside so nothing outlives its own job. Each machine's owner sets what
they are lending, in cores, memory and cache, and can require the machine to have
been idle first.

## GitHub Actions, on your own machines

Point a repository at the control plane and a queued workflow job gets an
ephemeral runner from the pool. falllow does not reimplement GitHub's runner
protocol: it starts the official runner with a just-in-time registration and takes
it down again after one job, which is the shape GitHub already supports and the
only one that does not rot with every upstream change.

## The pieces

![falllow.com|right|46x14](/screenshots/falllow-landing.png)

Four programs and one service. A CLI to submit from any working directory, a
runner daemon that runs headless on every enrolled machine, a control plane that
holds the queue, the scheduler and the device registry, and a desktop app that is
the machine's own window on both sides of the arrangement: what you have sent into
the pool, and what this machine is contributing to it. The app carries the daemon
with it, so joining is an install and a token rather than a toolchain.

The control plane is Rust, axum and Postgres, deployed as a container beside Caddy
on a single VPS. The manager and the public site are SvelteKit, prerendered; the
desktop app is the same component library again, in Tauri, so the machine's window
and the browser's are not two designs that drifted apart.

## History

This came out of validation. A field solver is worth what its answers are worth, so
[RapidFEM](/stack/rapidfem/) and [RapidMoM](/stack/rapidmom/) are checked against
analytic cases, reference codes and measured structures, across a corpus rather
than a handful of examples. That is the shape of work that started this: many
medium-sized jobs, none of them enormous, all of them long. No single one needs a
big machine. Together they need a lot of machine for hours, and every one of those
hours was a stretch where the computer I was writing on was not really mine to
write on. The work that blocks you is rarely the work you are thinking about.

That shape is also what makes an ordinary computer enough. A job that wants eight
cores for forty minutes does not care whether those cores are the current
generation. It cares that they are not the ones you are typing on. Such a workload
wants breadth, more machines rather than a faster one, and breadth is exactly what
is lying around unused: old gaming machines nobody plays on any more, a desktop
that idles through most of the day, a box in the corner switched on for one thing a
week. That is real compute, sitting still, belonging to people who would not mind
lending it, and it is already paid for. With compute priced the way it is at the
moment, that last part is most of the argument.

The machine you happen to be sitting at is not always one you want to run anything
on. Away from the desk, on a laptop, that same suite is a flat battery and an hour
of waiting, while the desktop at home sits idle behind a router that nothing
outside can reach. Wanting to use it from somewhere else is where the outbound
connection comes from: the machines at home dial out and hold the line open, so
there is nothing to forward, nothing to expose, and no address that has to stay
put.

Coding agents made it more pressing rather than less. An agent that runs the test
suite runs it on your machine, and it will happily do that while you are using it.
Somewhere to send that work is worth having on its own.

The GitHub bridge came out of the same arithmetic. Those runs are billed in Actions
minutes, and an allowance goes quickly when the jobs are long and there are a lot
of them. The machines that were going to sit idle anyway can take the workflow
instead, and the workflow does not have to know that anything changed.

Started in August 2026.
