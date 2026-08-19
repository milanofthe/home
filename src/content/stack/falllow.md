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

![falllow.com|right|57x15](/screenshots/falllow-landing.png)

falllow is a distributed compute pool. A machine enrols once and then takes jobs;
a job is a command submitted from a working directory, run on whichever machine
is free, and returned with its own output and its own exit code.

## How it works

Runners dial the control plane and hold a websocket open, so a desktop behind a
home router joins the pool the same way a rented server does. Jobs run in
containers on a fresh tree hard-linked from a content-addressed store, with
threads and memory reserved by cgroups on Linux and job objects on Windows,
inside a budget the machine's owner sets. One submission can shard across several
machines and reduce to a single exit code, and that code is the command's own:
170 is reserved for falllow's own failures, and only those are retried. A queued
GitHub Actions job can take an ephemeral runner from the pool.

A CLI, a headless runner daemon, the control plane and a desktop app that ships
the daemon with it. Rust with axum and Postgres behind Caddy on one VPS; the
interfaces are SvelteKit, the desktop app Tauri.

## History

falllow came out of the validation runs for [RapidFEM](/stack/rapidfem/) and
[RapidMoM](/stack/rapidmom/): many medium-sized jobs, none of them large, all of
them long. They occupied the machine I was working on for hours at a time.

That kind of load does not need current hardware, just a lot of ordinary
cores. Old gaming machines and desktops idle through most of the day and are
already paid for, so that is where the cores come from.

A few practical constraints shaped the rest. Away from the desk the same runs
drain the laptop battery, and the machines at home sit behind a router, which
is why runners dial out rather than listen. Coding agents can offload test
suites to the pool instead of blocking the machine they run on. And CI runs
are billed in Actions minutes, which is what the GitHub bridge is for.
