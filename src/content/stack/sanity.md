---
title: sanity
accent: sanity
tagline: Every file in a repository on one canvas, watched while something else is editing it.
group: infrastructure
order: 22
site: sanity.milanrother.com|https://sanity.milanrother.com
repo: github.com/milanofthe/sanity|https://github.com/milanofthe/sanity
license: MIT open source
cta1: [ Open the demo -> ]|https://sanity.milanrother.com
cta2: [ View on GitHub -> ]|https://github.com/milanofthe/sanity
---

![pathsim, 375 files and 64,377 lines|center|114x22|contain](/images/sanity-project.png)

sanity opens a folder and draws every file in it at once. Each file that git does
not ignore becomes a read-only panel, panels are packed by directory, and the
whole project fits on one screen. Zoomed out you see its shape, zoomed in you
read the code.

It exists because I stopped writing most of the code myself. An agent works
across a repository faster than anyone can follow in a file tree, and keeping ten
files open in an editor is a worse way to watch it than having all of them in
front of you at a size where you can still see something happen. So this is a
monitor: a second window that runs beside the editor and answers where something
is changing, and whether that is where it should be changing.

## What it does

Saves are picked up live, and a change is shown as an event rather than as a
state. The lines that are going away are banded and fade, then the new content
lands and the lines that arrived are banded in turn. At the same moment the
panel flashes for half a second, which is what tells you *where* something
happened when a file is a few pixels tall, and the line bands are held for four
seconds, which is what tells you *what*. Then the canvas goes quiet and stops
drawing entirely, because a monitor that costs a core is not one you leave
running.

![Five files changed at once|56x15|contain](/images/sanity-change.png)
![The lines that arrived, held for four seconds|56x15|contain](/images/sanity-bands.png)

The layout is a squarified treemap on an integer grid, one cell per line height,
nested by directory. Between 83 and 99 percent of the canvas is panel, measured
across seven repository shapes from 120 to 2500 files. Panels are sized by what
is in them, so the shape of a project is visible before you read a single name.

Not only code. A notebook is read as its cells rather than as the JSON they are
stored in, an image file is a panel in the image's own proportion, and a PDF
shows its first page. Pictures are worth about as much canvas as a 500 line
source file at most, and each one is decoded to the resolution the zoom asks
for: holding pathsim's 47 figures at their own size would be 730 MB of texture
against the 96 MB all of its code costs, so the budget is 64 MB shared between
whatever is on screen.

![47 figures, drawn|56x15|contain](/images/sanity-pictures.png)
![rslab's report figures, first pages of PDFs|56x15|contain](/images/sanity-pdf.png)

There are three levels of detail, weighted so nothing double-draws through a
transition. Below 1.8 pixels per line a file is one textured quad per column,
sampled from a saturation-weighted mip chain; from there it hands over to one
quad per token, and then to text. Syntax comes from tree-sitter for 16 languages.
It is one WebGL2 scene, drawn only when the picture would come out different: a
change costs 42 frames, and an idle window costs nothing.

Search runs over names and over file contents, in Rust in the backend, which
reads and scans the whole tree per keystroke rather than holding it in memory:
18.6 MB in 7 to 8 milliseconds. Matching panels stay lit while everything else
drops to a fifth, matching lines are banded inside their panels, and Enter walks
the hits, flying the camera to each.

![All 532 matches for one word|center|114x20|contain](/images/sanity-search.png)

The right click menu writes the canvas to a PNG, either the current view or the
whole project, into a 4K frame. That is not a screenshot: detail follows from
pixels per line, so the same region rendered larger has more in it, and a
thousand-file project comes out as something you can actually print.

## Built as

A Tauri app. Rust does the scanning, tokenising and searching and hands the
frontend a compact binary payload; the canvas is TypeScript and WebGL2 with no
framework under it. The [web demo](https://sanity.milanrother.com) is the same
app with four public repositories baked in, read over HTTP instead of from disk,
so what runs in a browser is the same decode, layout and renderer as the desktop
build. What it cannot do there is watch, since a dump is a snapshot.
