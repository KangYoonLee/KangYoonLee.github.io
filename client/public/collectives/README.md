# CollectiveScope v3 — GPU Collective Communication in AI Datacenters

**A clean, interactive, bilingual visualizer that displays all GPU rank buffers and all concurrent communication events at once.** Written from scratch with plain HTML, CSS and JavaScript. The initial view is a four-GPU **AllToAll Pairwise** execution across two GPU servers in different racks.

## What you see

1. **GPU memory:** All ranks remain visible. Values are ordinary integers, with sender, destination, and chunk index shown on each colored tile. For AllToAll, each GPU displays an outgoing array and an incoming array.
2. **Simultaneous transfers:** *Every* logical send in the current round has an animated numbered token. Play moves them together; at the end of the round all recipient buffers update together. Pause freezes the motion; Previous/Next steps through the rounds; slider allows seeking; finish jumps to the result.
3. **Logical algorithm:** Ring, Binomial Tree, Pairwise and Direct communication schedules appear in their own diagram, with simultaneous moving markers.
4. **Physical AI DCN:** Switch between one server (local GPU fabric, *no* ToR/Spine path) and two different-rack servers (illustrative GPU fabric → NIC → ToR → Spine → ToR → NIC → GPU fabric). The same current communication events are mapped into the physical diagram.

This is the meaning of the sample AllToAll numbers for **4 GPUs**:

- GPU 0 starts with `[1, 2, 3, 4]`, one number for GPU 0, 1, 2, 3 respectively.
- GPU 1 starts with `[5, 6, 7, 8]`.
- GPU 2 starts with `[9, 10, 11, 12]`.
- GPU 3 starts with `[13, 14, 15, 16]`.
- After all pairwise rounds, GPU 0 receives `[1, 5, 9, 13]`, GPU 1 receives `[2, 6, 10, 14]`, GPU 2 receives `[3, 7, 11, 15]`, and GPU 3 receives `[4, 8, 12, 16]`.

## Controls

- Collective: AllToAll, AllReduce, AllGather, ReduceScatter, Broadcast, Reduce, Gather, Scatter.
- Algorithm: Ring / Tree / Direct (or Pairwise for AllToAll); menu choices depend on the collective.
- GPU count: 4 or 8, all GPUs always visible.
- Placement: Intra-server or Inter-server (two server racks).
- Language: English by default, Korean via upper-right button.
- Play / Pause / Restart / Previous / Next / speed (0.5×–4×) / seek / final result.
- Shareable query parameters `op`, `alg`, `gpu`, `placement`, `lang`.

## Scientific scope and caveats

**Deterministic conceptual teaching model — not a faithful execution of NVIDIA NCCL or a packet-level simulator.**

- The operation outputs follow the documented collective semantics. Ring AllReduce is modeled as n-1 ReduceScatter stages followed by n-1 AllGather stages. The Tree is an illustrative **binomial** tree, not necessarily NCCL's runtime-selected tree(s). Direct is a pedagogical communication plan. AllToAll Pairwise uses destination-offset rounds.
- The physical view demonstrates *logical endpoints and example paths* through a simplified, two-rack leaf-spine topology. A real deployment may have same-ToR servers, multiple NICs, NVLink/NVSwitch or PCIe details, rail-optimized fabrics, multiple channels, routing/ECMP and link contention not represented here.
- A moving number indicates a **logical chunk transfer**; it is **not** an Ethernet packet, a real link's bytes per second, a NIC trace, or a statement that the implementation overlaps everything in that exact way.
- Equal time per round is a playback convention, not an observed GPU or network latency.

## Run locally

Open `index.html` directly (all imports are relative, no build required) or host statically:

```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

## Tests

```bash
node --check core.js
node --check app.js
node --test test/core.test.js
python test/browser_test.py
```

The browser test uses browser content injection to render the local HTML/CSS/JS in Chromium even when test environments block URL navigation. It tests multiple operation configurations, moving tokens, Pause, Next, final data values, 8-GPU and Korean UI, and mobile overflow.

## Hosting on GitHub Pages

This project has no build step. Copy `index.html`, `core.js`, `app.js`, and `styles.css` into the intended public folder, e.g. `client/public/collectives/` in the existing repository `KangYoonLee/KangYoonLee.github.io`. This does not change the root personal homepage. Whether it is *publicly live* depends on the existing GitHub Pages workflow completing successfully.

## References

- [NVIDIA NCCL collective semantics](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html)
- [NVIDIA on topology-aware NCCL algorithms](https://developer.nvidia.com/blog/fast-multi-gpu-collectives-nccl/)
- [Hyojun's independent GPU communication teaching site](https://hyojun.me/gpu-comm-visualizer/) (inspiration for stepwise numbered-data visualization; no source code copied)

## License

MIT