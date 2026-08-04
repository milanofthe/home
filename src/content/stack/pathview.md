---
title: PathView
accent: pathsim
tagline: A browser-based visual editor for PathSim and FastSim models.
group: systems
order: 3
site: view.pathsim.org|https://view.pathsim.org
repo: github.com/pathsim/pathview|https://github.com/pathsim/pathview
license: open source / free to use at view.pathsim.org
cta1: [ Open PathView -> ]|https://view.pathsim.org
cta2: [ Scientific UI/UX consulting -> ]|/consulting/
---

PathView is a visual node editor for [PathSim](/stack/pathsim/) and
[FastSim](/stack/fastsim/) models: drag-and-drop block diagrams, live
simulation preview with interactive plots, and instant sharing. By default it
runs entirely in the browser via Pyodide: nothing to install, nothing to
license, nothing sent to a server.

![view.pathsim.org|right|46x14](/screenshots/view-pathsim-org.png)

Diagrams stay real PathSim models: what you edit visually is what runs in the
engine, and what you share is a model your colleague can open in Python.
Models convert to standalone scripts from the command line:

```bash
pip install pathview
pathview serve                  # local server with full Python backend
pathview convert model.pvm      # .pvm diagram -> standalone model.py
```

The local server mode runs models against any installed Python environment,
including packages with native dependencies that Pyodide cannot load. The UI
is SvelteKit with SvelteFlow for the node editor, CodeMirror for code cells,
and Plotly for interactive results.

## History

PathView started in June 2025 to make PathSim usable without installing
anything. Around 1400 commits later it is at v0.9, hosted free for everyone
at view.pathsim.org, with the pip-installable local server for models that
need packages beyond what Pyodide can load.
