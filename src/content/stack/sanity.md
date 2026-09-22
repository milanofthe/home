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

sanity opens a folder and draws every file in it at once. Each file git does not
ignore becomes a read-only panel, panels are packed by directory, and the whole
project fits on one screen. At the outer zoom the structure is visible, at the
inner zoom the panels are readable text.

![328 files, four of them just written to|right|46x15|contain](/images/sanity-change.png)

It runs beside the agent interface. Agent interactions are minutes apart, which
is the time to see which files were written to, where in the tree they sit, and
to zoom into a panel and read the code that changed.

Saves are picked up live. Removed lines are banded and faded out, the new
content is drawn, the added lines are banded in turn, and the panel flashes for
half a second. The render loop stops once nothing changes.

![rslab, figures and the first pages of its PDFs|left|46x15|contain](/images/sanity-pdf.png)

The layout is a squarified treemap on an integer grid, one cell per line height,
nested by directory. Between 83 and 99 percent of the canvas is panel, measured
across seven repositories from 120 to 2500 files. There are three levels of
detail: below 1.8 pixels per line a file is one textured quad per column, then
one quad per token, then text, with syntax from tree-sitter for 16 languages.

Notebooks are read as their cells, an image file is a panel in the image's own
proportion, and a PDF shows its first page. Pictures are thumbnailed in the
backend at 128 pixels and cached on disk; the source is decoded only for panels
wider than that, and decodes are spaced out in time.

![532 matches for one word|right|46x15|contain](/images/sanity-search.png)

Search runs in Rust over names and file contents, rescanning the tree on every
keystroke instead of holding it in memory: 18.6 MB in 7 to 8 milliseconds.
Matching panels stay lit while the rest drops to a fifth, matching lines are
banded, and Enter walks the hits. The right click menu writes the canvas to a 4K
PNG, either the current view or the whole project.

## Built as

A Tauri app. Rust does the scanning, tokenising and searching and hands the
frontend a compact binary payload; the canvas is TypeScript and WebGL2 with no
framework under it. The [web demo](https://sanity.milanrother.com) is the same
app with four public repositories baked in, read over HTTP instead of from disk,
so it runs the same decode, layout and renderer as the desktop build. The demo
cannot watch for changes, because a dump is a snapshot.
