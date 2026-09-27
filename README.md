# MacAssist

Pick a local model size — 3B, 7–8B, 12B, 26B, 31B, or 70–72B — and see which Apple Silicon Macs can run it, roughly how many tokens per second to expect, and the cheapest memory configuration that fits.

Already have a Mac, or eyeing one? Type it into **Find your Mac** (e.g. `M2 Max`, `Mac mini`, `studio ultra`) to narrow the list to just those machines.

A companion to [ModelAssist](https://github.com/justwaters/ModelAssist), which goes the other way: machine in, models out.

## How it estimates

- **Speed**: decode on Apple Silicon is memory-bandwidth-bound, so tokens/sec ≈ bandwidth × efficiency ÷ bytes read per token. Efficiency is ~65% on base/Pro chips, ~57% on Max, ~45% on Ultra, with a further discount for mixture-of-experts models (which only read their active parameters per token).
- **Fit**: quantized weights + KV cache for the chosen context + ~1 GB runtime overhead, checked against what macOS lets the GPU use (~⅔ of memory on ≤36 GB Macs, ~¾ above), with an option for the raised `iogpu.wired_limit_mb` limit.
- **Prices**: US Apple Store, base storage, as of September 2026. Previous-generation Macs are listed without prices.

## Running it locally

No build step. Serve the directory with anything static:

```
python3 -m http.server 8934
```

Then open `http://localhost:8934`.

## Stack

Plain HTML/CSS/JS — `index.html`, `styles.css`, `app.js`, and the Mac catalog and model size classes in `data.js`.
