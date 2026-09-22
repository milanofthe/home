---
title: sanity
accent: sanity
tagline: A monitoring tool. Every file in a repository on one canvas, updated as they change.
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
project fits on one screen. Zoomed out you see its shape, zoomed in you read the
code.

![328 files, four of them just written to|right|46x15|contain](/images/sanity-change.png)

What is open next to it is the agent interface, not an editor. Ten editor
windows, or switching between files to check that an agent is not making a mess,
is what this replaces: there are minutes between agent interactions, and that is
enough time to see what happened, keep the structure in view, and zoom into one
panel to read the code that changed.

Saves are picked up live. The lines that go away are banded and fade out, the new
content lands, the lines that arrived are banded in turn, and the panel flashes
for half a second. Then the canvas stops drawing until something moves again.

![rslab, figures and the first pages of its PDFs|left|46x15|contain](/images/sanity-pdf.png)

The layout is a squarified treemap on an integer grid, one cell per line height,
nested by directory. Between 83 and 99 percent of the canvas is panel, measured
across seven repositories from 120 to 2500 files. There are three levels of
detail: below 1.8 pixels per line a file is one textured quad per column, then
one quad per token, then text, with syntax from tree-sitter for 16 languages.

Not only code. A notebook is read as its cells rather than as the JSON they are
stored in, an image file is a panel in the image's own proportion, and a PDF
shows its first page. Pictures are decoded to the level under the panel they are
drawn in, paced so a folder of screenshots does not arrive as one burst.

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
so it runs the same decode, layout and renderer as the desktop build. What it
cannot do there is watch, since a dump is a snapshot.
