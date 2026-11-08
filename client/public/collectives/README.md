# CollectiveScope · v4

**One canvas, every GPU, every transfer.** An educational GPU collective communication visualizer focused on understanding numbered data chunks and their simultaneous movement, then relating those movements to simplified AI datacenter paths.

**Website** (once GitHub Pages deployment succeeds): https://kangyoonlee.github.io/collectives/

**How to use**

1. Select a collective (AllToAll, AllReduce, AllGather, ReduceScatter, Broadcast, Reduce, Gather, Scatter).
2. Select one of the algorithms supported by that collective (Ring, Tree, Pairwise, Direct).
3. Choose 4 or 8 GPU ranks.
4. Choose `1 server` or `2 servers`, and `Logical` or `DCN route`.
5. Press **Play** to watch all active transfers in the round simultaneously; use Next, Previous, Restart, and Show result to inspect states.
6. Switch to Korean with the language control.

Each GPU card displays numbered data chunks. AllToAll displays its initial SEND and evolving RECEIVED chunks. Colored moving circles contain the actual chunk values. At the end of each discrete round, the destination GPU's current data updates. The same nodes appear for both logical communication and schematic DCN path views.

## Technical design and limits

- Pure HTML/CSS/JavaScript and inline SVG. No build step, CDN, backend, GPU, or third-party JS dependency.
- Deterministic educational discrete-round simulation from `core.js`.
- AllToAll Pairwise runs N-1 rounds; Direct visualizes all N·(N-1) directed transfers as one conceptual round. At 8 GPUs Direct can become visually busy—use Pairwise for step-by-step learning.
- Ring AllReduce visualizes ReduceScatter + AllGather and Tree AllReduce visualizes Reduce + Broadcast. These are teaching models, not guaranteed to reproduce NCCL's algorithm selection, channel interleaving, chunk partitioning, scheduling, or timing.
- Placement assumes ranks 0..N/2-1 on server 0 and N/2..N-1 on server 1 in the two-server mode. DCN paths are schematic routes via ToR and Spine, not packet-by-packet Ethernet behavior, congestion or GPU NIC performance.
- Browser usability is best on a laptop or desktop; narrow screens let you swipe horizontally to inspect the complete data canvas.

## Run locally

Unzip and open `index.html` in a browser or serve the folder:

```bash
python -m http.server 8000
# open http://localhost:8000
```

Tests:

```bash
node test/core.test.js
python test/browser.py
python test/regress.py
```

The browser tests use Playwright and a system Chromium browser and have been executed using inline assets because this environment restricted local page navigation. The production files load the same scripts directly from the current folder.

## GitHub Pages

Put the site files under `client/public/collectives` in the existing `KangYoonLee.github.io` project; the repo's Vite build copies `client/public` to `dist/public`. If the existing GitHub Pages deployment is set up for the repository, the site should then appear at `https://kangyoonlee.github.io/collectives/` after a successful deployment. Validate the GitHub Pages workflow before claiming it is live.

## Inspiration

[Hyojun Jeon's GPU Collective Communication Visualizer](https://github.com/devinjeon/gpu-comm-visualizer) inspired the presentation approach of numbered GPU chunks and step-by-step simultaneous transfers. That project is MIT-licensed. CollectiveScope v4 is an independent educational implementation and credits the original concept explicitly.

## License

MIT — see `LICENSE`.