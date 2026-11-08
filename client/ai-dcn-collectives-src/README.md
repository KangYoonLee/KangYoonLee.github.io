# CollectiveScope — GPU Collectives, AI DCN, Network Lens

An educational AI datacenter collective communication visualizer with two modes:
- **Learn** — simultaneous numbered GPU chunk animation, Ring / Tree / Direct algorithms, 4+ GPUs and step playback.
- **Network Lens** — deterministic logical-traffic accounting for an illustrative intra-server or two-server deployment, per-rank TX/RX, network payload, GPU-to-GPU traffic matrix, per-server NIC TX/RX, model-only NIC serialization floor, and downloadable transfer CSV.

## Attribution and licensing

This version is an **adaptation based on the actual source code** of Hyojun Jeon's [gpu-comm-visualizer](https://github.com/devinjeon/gpu-comm-visualizer), copyright (c) 2026 Hyojun Jeon, MIT-licensed. The original numeric data model, collective schedule generator, and much of the animation code remain in this adaptation. **Keep the included MIT LICENSE and copyright notice** if distributing this project. This is neither a separate clean-room implementation nor an official upstream release.

## What is modeled

- Logical collective schedules are educational examples, not promises of NCCL's selected algorithms or actual channel patterns.
- `Logical` keeps the original animation. `AI DCN (Physical)` overlays an illustrative GPU / NVSwitch / NIC / ToR / Spine topology.
- Intra-server: one server, conceptual GPU fabric. Inter-server: two GPU servers; illustrative cross-rack path through a Spine.
- All transfers of a logical round use the same **assumed payload per chunk** in Network Lens.
- **Model-based byte counts** = generated logical transfers multiplied by assumed chunk payload, with full-buffer sends counted as C chunks.
- **Idealized serialization floor** = peak directional server NIC payload per round / selected line rate, added over sequential rounds. It omits actual NCCL channels, pipeline, concurrency limits, transport overhead, queuing, and contention. It is not an observed performance metric.
- A different link topology or same-rack deployment may bypass a spine; this MVP is deliberately limited to an illustrative two-rack schematic.

## Run and test locally

```sh
npm ci
node --test test/insights.test.mjs
npm run dev
```

## GitHub Pages

Source: `client/ai-dcn-collectives-src/` in `KangYoonLee/KangYoonLee.github.io`. The Pages workflow builds webpack output into `dist/public/ai-dcn-collectives/`. URL: `https://kangyoonlee.github.io/ai-dcn-collectives/`.

## Next directions
- Allow arbitrary rank-to-server and GPU-to-NIC mapping, multiple NICs, same-rack vs cross-rack ECMP.
- MoE AllToAllV skew and traffic matrices with uneven payloads, plus hotspot/capacity exercises.
- Parse actual NCCL Inspector JSON and time-aligned NIC counters, distinguishing observed measurements from deterministic example traffic.
