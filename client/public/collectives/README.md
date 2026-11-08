# CollectiveScope v2

A minimal, interactive visual explorer of GPU collective communication in AI datacenter networks. **English** is the default UI, with **Korean** available in the top bar.

## Features

- 8 collective operations: AllReduce, AllGather, ReduceScatter, AllToAll, Broadcast, Reduce, Gather and Scatter.
- Conceptual Ring / Binary tree / Pairwise / Direct communication schedules (when applicable).
- 4 or 8 GPU ranks, and single-ToR / 2-rack / 4-rack illustrated fabrics.
- A working **Play / Pause / Previous / Next / Restart / Speed** animation engine using `requestAnimationFrame`. Unlike SMIL, movement is tied to the same deterministic application state as the controls; Pause freezes the moving marker.
- Click a message to follow its **source GPU → ToR → Spine → ToR → destination GPU** route. The selected message is highlighted; others appear as smaller dots.
- Physical, logical-algorithm and combined views; changes in algorithm, GPU count and topology rebuild the model.
- Shareable URL query parameters and bilingual explanations.

## Quick start

Open `index.html` directly in a modern browser, or run:

```bash
python3 -m http.server 8000
# http://localhost:8000/
```

No build step, API, backend, dependencies or GPU hardware are needed.

## How playback works

The abstract collective scheduler generates rounds (`core.js`). Each round contains logical `from → to` messages. The UI maps each message to an illustrative path across the selected topology. The highlighted packet uses length-weighted interpolation along successive path segments. Both the physical and logical views use the **same** normalized playback progress (`0..1`).

- **Play** starts movement immediately for the current round; when progress reaches 100%, the next round begins automatically.
- **Pause** freezes the marker at its exact position; Play resumes from there.
- **Previous/Next**, timeline, Reset and configuration changes reset progress and update the paths immediately.
- **Select message** or click a transfer pill to inspect a different source and destination.
- Animation speed changes playback time, not the logical schedule.

## IMPORTANT: Model limitations

This is a **pedagogical, deterministic illustration**, **not** actual NCCL, OMNeT++, or an emulation of a packet-level network. The logical schedules illustrate communication dependencies but do not claim to reproduce the NCCL algorithm/protocol/channel selected in a real run. Topology/route mapping is illustrative and does **not** model NVLink, PCIe, multi-NIC path selection, transport protocols, retransmissions, real time, link contention, packetization, PFC or congestion. A dot represents a logical message, not an actual packet.

For study and research, compare against measured NIC/switch counters and NCCL traces, and label such traces as measured data separately.

## Testing

```bash
node --check app.js
node --test test/core.test.js
python3 test/browser_test.py   # requires playwright Python package and Chromium
```

The browser test explicitly checks that the packet positions change during Play, freeze on Pause, resume to the next round, and that the interface can switch operations, language, topology and views. It also checks for JavaScript page errors and horizontal overflow in a mobile viewport.

## GitHub Pages hosting

Standalone static hosting: copy **index.html**, **styles.css**, **core.js**, **app.js** into the site root or into an existing GitHub Pages site's public path (e.g. `client/public/collectives/`). The files intentionally use relative asset paths.

Current existing site integration: `KangYoonLee/KangYoonLee.github.io/client/public/collectives/`. Provided the host's GitHub Pages workflow successfully publishes the Vite `client/public` contents, the expected path is `https://kangyoonlee.github.io/collectives/` (availability must be verified separately).

## References

- NVIDIA NCCL collective operations: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html
- OMNeT++ Qtenv visual simulation controls: https://docs.omnetpp.org/userguide/qtenv

## License

MIT. Educational visuals and simulator code are independently implemented; no code from OMNeT++ or the referenced GPU communication visualizer is included.