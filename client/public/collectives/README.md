# CollectiveScope

**See the collective. Trace the fabric.** An interactive, English-first / Korean-second visual learning tool for GPU collective communication in AI datacenter networks.

> **Accuracy note:** This is a **pedagogical, deterministic communication-schedule visualizer**, **not an implementation of NCCL**, a packet trace, or a network performance simulator. The path selection and per-link message-equivalent loads are illustrative. Nothing here measures congestion or models scheduling, NIC queues, PFC, ECMP hash implementations, intra-node PCIe/NVLink, NCCL channels, or NCCL protocols.

## What it visualizes

- Eight collective primitives: **AllReduce, AllGather, ReduceScatter, AllToAll, Broadcast, Reduce, Gather, Scatter**.
- Conceptual schedule choices: **ring** (ring reduce-scatter / all-gather), **binary tree** (rooted reductions, broadcasts and data distribution), **direct**, and **pairwise exchange**.
- Physical topologies: **single ToR**, **two racks and two spines**, and **four racks and two spines**.
- 4 or 8 ranks, step-by-step, autoplay, speed control, timeline seeking, root selection where relevant, EN/한국어, and shareable URL query parameters.
- Link load bars report **chunk-sized payload units for the current step**, not bytes/s or traffic measured on hardware. Paths have **fixed deterministic source/destination-to-spine assignment** for illustration.

### Teaching schedules and correctness scope

`core.js` generates explicit rank-to-rank transfers that are grouped into conceptual rounds. For **direct** algorithms, a single conceptual round may contain more messages than hardware can issue concurrently. Ring reduce-scatter uses the `(rank - 1 - round) mod n` send-chunk rule; rank `i` ends with reduced chunk `Ci`. Ring all-gather sends `(rank - round) mod n` and circulates the result. Binary-tree reduction moves whole vectors up each tree level, then optional broadcast propagates the root's result. All-to-all pairwise uses cyclic offsets `1..n-1` and each rank retains its own destination chunk locally.

**Not implemented:** arbitrary rank count, pipelining, NCCL-specific ring ordering, multiple channels, NVLS/CollNet/PAT, message sizes, time/latency prediction, topology-aware NCCL algorithm selection, heterogeneous links, ECMP/policies, RoCE/RDMA behavior, collective overlapping, dynamic MoE tokens, or trace import.

## Run locally

The site is static HTML/CSS/JavaScript with **no build tools or dependencies**.

```bash
cd collectivescope
python3 -m http.server 8080
# Open http://localhost:8080/
```

Tests:

```bash
node test/core.test.js
```

## Deploy

### Standalone GitHub Pages repository

1. Create a **public** repository, e.g. `collectivescope`.
2. Upload `index.html`, `app.js`, `core.js`, and `styles.css` to the repository root.
3. In **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**.
4. Your URL is `https://<username>.github.io/collectivescope/` after GitHub Pages publishes it.

### Existing Vite-based personal site

To add as a non-interfering subpage to a Vite project whose `root` is `client/`, copy the four static files into `client/public/collectives/`. The Vite production build copies them verbatim to `dist/public/collectives/`. A GitHub Pages workflow serving `dist/public/` will then publish `/collectives/` as a direct URL.

## References

- [NVIDIA NCCL collective operation semantics](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html)
- [NVIDIA NCCL algorithm configuration (`NCCL_ALGO`)](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/env.html)
- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Roadmap / research directions

1. Trace-import mode: rank timestamp spans, NCCL events, NIC port counters, PCAPs.
2. MoE AllToAllV with unequal destination sizes and dispatch/compute/combine timeline.
3. Fabric timing model with link capacities, serialization and explicit queueing assumptions.
4. Compare algorithms, overlay path divergence and identify potential synchronized fan-in.
5. User-imported machine-readable topology and rank placement.

MIT license. Attribution of underlying conceptual collective semantics to documentation sources above; all visualizer code is original.