---
title: sanity
accent: sanity
tagline: Every file in a repository as a read-only panel on one zoomable canvas, updated as they change.
group: infrastructure
order: 22
site: sanity.milanrother.com|https://sanity.milanrother.com
repo: github.com/milanofthe/sanity|https://github.com/milanofthe/sanity
license: MIT open source
cta1: [ Open the demo -> ]|https://sanity.milanrother.com
cta2: [ View on GitHub -> ]|https://github.com/milanofthe/sanity
---

sanity opens a folder and draws every file in it at once, as read-only panels
on one zoomable canvas, grouped by directory. Zoomed out you see the structure
of the project, zoomed in you read the code.

![five files written to at once|right|46x15|contain](/images/sanity-change.png)

It runs beside the agent interface while coding agents work in a repository.
When a file is saved its panel flashes and the changed lines are marked, so you
can see what was touched and where it sits in the tree. The git history plays
the same way, one commit at a time.

![stepping back to a commit of four files|left|46x15|contain](/images/sanity-history.png)

A Tauri app, Rust for scanning and search, TypeScript and WebGL2 for the
canvas. The [web demo](https://sanity.milanrother.com) is the same app reading
a few public repositories over HTTP.
