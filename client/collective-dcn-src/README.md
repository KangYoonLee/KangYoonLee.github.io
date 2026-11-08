# CollectiveScope — AI DCN extension of Hyojun's GPU Comm Visualizer

**Built directly from Hyojun Jeon's MIT-licensed [gpu-comm-visualizer](https://github.com/devinjeon/gpu-comm-visualizer).** The original numerical communication model, canvas animation, operation schedule, bilingual interface, and step controls are retained.

## Extension

- View **Logical (Original)** shows the upstream interface and simultaneous moving values.
- View **AI DCN (Physical)** retains the same collective steps and GPU values, routing illustrative message dots through hardware icons.
- Placement **Intra-server** uses one server and an abstract NVSwitch.
- Placement **Inter-server** groups GPUs into two servers and shows NVSwitch, NIC, ToR, and Spine hops.
- Use GPU 4 or 8, eight operations and the same Ring / Tree / Naive algorithms as upstream.

**Important:** Physical paths are teaching schematics, *not measured network traffic or exact NCCL routing*. Actual NCCL placement, algorithms, channel scheduling and fabric paths vary by platform. Intra-rack traffic may not traverse a Spine.

## License and credits

Original: Copyright (c) 2026 Hyojun Jeon, MIT License. The original LICENSE is retained verbatim. This is an adaptation and is not represented as an official upstream release.

## Build locally
```sh
npm ci
npm run dev
```
The enclosing Pages deployment builds the webpack project into `dist/public/collectives/`.
