---
title: falllow
accent: falllow
tagline: A distributed compute pool. Tests and builds on machines that are otherwise idle.
group: infrastructure
order: 20
site: falllow.com|https://falllow.com
license: closed source, private beta
cta1: [ Download the app -> ]|https://falllow.com/download
cta2: [ Read the docs -> ]|https://falllow.com/docs
---

falllow is a distributed compute pool. A machine enrols once and then takes jobs;
a job is a command submitted from a working directory, run on whichever machine
is free, and returned with its own output and its own exit code.

```console
$ falllow run -- pytest -q
sending workspace (12 files, 1 new)
placed on ryzen-9900x - 8 threads reserved
........................................
40 passed in 6.21s
```

## Outbound only

Runners dial the control plane and hold a websocket open. Nothing listens on an
enrolled machine, no port is forwarded, no address has to stay put, so a desktop
behind a home router joins the pool the same way a rented server does. A machine
redeems an enrolment token once and is identified as that machine from then on,
not by whoever set it up.

## Workspaces and caches

Each job runs in a fresh tree, hard-linked from a content-addressed store. The
submitting side hashes the working directory, asks which chunks the control plane
is missing, and sends only those. Four cache layers survive between jobs and are
given up in a fixed order when disk runs short: compiler output, workspace files,
downloaded packages, resolved environments. Cheapest to rebuild goes first; a
resolved environment is the most expensive thing on the machine to recreate.

## Sharding and exit codes

One submission becomes several independent jobs, each told its slice through
`FALLLOW_SHARD_INDEX` and `FALLLOW_SHARD_COUNT`, reducing to one exit code.

```console
$ falllow run --shard 4 -- pytest -q
4 shards

shard 1/4   10 passed in 2.03s
shard 2/4   10 passed in 1.94s
shard 3/4   10 passed in 2.11s
shard 4/4   10 passed in 1.88s

all 4 shards succeeded
```

A failing test exits with the test runner's own code. 170 is reserved for
falllow's own failures, a lost runner or a workspace that would not transfer, and
only those are retried.

## Isolation and budgets

Every job runs in a container; the floor is forced when the job is submitted, so
nothing can ask for less. Threads and memory are reserved per job and enforced by
the kernel, cgroups on Linux and job objects on Windows, with the process tree
held inside the same object. Each owner sets what the machine lends in cores,
memory and cache, and can require it to have been idle first.

## GitHub Actions

A queued workflow job gets an ephemeral runner from the pool: the official GitHub
runner, started with a just-in-time registration and taken down after one job.
The runner protocol is not reimplemented.

## The pieces

![falllow.com|right|46x14](/screenshots/falllow-landing.png)

A CLI, a headless runner daemon, the control plane, a manager in the browser, and
a desktop app that ships the daemon with it. Control plane in Rust with axum and
Postgres, containerized behind Caddy on one VPS; manager and site in SvelteKit,
prerendered; the desktop app the same component library again, in Tauri.

## History

falllow started on August 9, 2026, out of the validation runs for
[RapidFEM](/stack/rapidfem/) and [RapidMoM](/stack/rapidmom/): many medium-sized
jobs, none of them large, all of them long. They occupied the machine I was
working on for hours at a time.

That load does not need current hardware. It needs a lot of ordinary cores,
elsewhere. Old gaming machines and desktops that idle through most of the day are
already bought, and at present compute prices that is most of the argument.

Three things followed from the same problem. Away from the desk the same runs are
a flat laptop battery, and the machines at home sit behind a router, which is why
runners dial out rather than listen. Coding agents run test suites on whichever
machine they are on. And in CI those runs are billed in Actions minutes, which is
where the GitHub bridge comes from.

Private beta, closed source for now.
