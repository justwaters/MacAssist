// Catalog of Apple Silicon Macs, and the standard open-model size classes to check them against.
//
// bandwidthGBps: Apple's published unified-memory bandwidth for that exact chip variant (binned
// Max chips have a narrower memory bus than the full chip, so they're listed separately).
// Current-lineup figures and prices were checked against apple.com tech specs, Apple Newsroom,
// and Daring Fireball's configuration tables as of September 2026.
//
// prices: US Apple Store price for that memory tier with base storage. Only filled in where the
// per-tier price is published; laptops only carry a "from" price because Apple's memory-upgrade
// pricing on them depends on which storage tier you pick. Previous-generation Macs carry no price —
// they're used/refurbished-market only and prices move too much to hard-code.
//
// efficiency: the share of theoretical bandwidth llama.cpp actually achieves on decode, roughly
// calibrated against community benchmarks — single-die base/Pro chips get closest to the ceiling,
// Max chips a bit less, and Ultras (two dies stitched together) noticeably less.

const TIER_EFFICIENCY = {
  base: 0.65,
  pro: 0.65,
  max: 0.57,
  ultra: 0.45,
};

// Mixture-of-experts models read fewer bytes per token, but routing and scattered expert reads
// keep them further from the bandwidth ceiling than a dense model — applied on top of the above.
const MOE_EFFICIENCY = 0.7;

const MACS = [
  // ---------- current lineup ----------
  {
    id: "mba-m5",
    name: "MacBook Air 13″/15″",
    chip: "M5",
    tier: "base",
    variant: "10-core CPU · 8-core GPU",
    form: "laptop",
    current: true,
    year: 2026,
    bandwidthGBps: 153,
    ram: [16, 24, 32],
    fromPrice: 1099,
  },
  {
    id: "mbp14-m5",
    name: "MacBook Pro 14″",
    chip: "M5",
    tier: "base",
    variant: "10-core CPU · 10-core GPU",
    form: "laptop",
    current: true,
    year: 2025,
    bandwidthGBps: 153,
    ram: [16, 24, 32],
    fromPrice: 1599,
    note: "Launch price (October 2025).",
  },
  {
    id: "mbp-m5pro-15",
    name: "MacBook Pro 14″",
    chip: "M5 Pro",
    tier: "pro",
    variant: "15-core CPU · 16-core GPU",
    form: "laptop",
    current: true,
    year: 2026,
    bandwidthGBps: 307,
    ram: [24],
    fromPrice: 2199,
  },
  {
    id: "mbp-m5pro-18",
    name: "MacBook Pro 14″/16″",
    chip: "M5 Pro",
    tier: "pro",
    variant: "18-core CPU · 20-core GPU",
    form: "laptop",
    current: true,
    year: 2026,
    bandwidthGBps: 307,
    ram: [24, 36, 48, 64],
  },
  {
    id: "mbp-m5max-32",
    name: "MacBook Pro 14″/16″",
    chip: "M5 Max",
    tier: "max",
    variant: "18-core CPU · 32-core GPU",
    form: "laptop",
    current: true,
    year: 2026,
    bandwidthGBps: 460,
    ram: [36, 48, 64, 128],
    fromPrice: 3599,
  },
  {
    id: "mbp-m5max-40",
    name: "MacBook Pro 14″/16″",
    chip: "M5 Max",
    tier: "max",
    variant: "18-core CPU · 40-core GPU",
    form: "laptop",
    current: true,
    year: 2026,
    bandwidthGBps: 614,
    ram: [48, 64, 128],
  },
  {
    id: "imac-m4",
    name: "iMac 24″",
    chip: "M4",
    tier: "base",
    variant: "10-core CPU · 10-core GPU",
    form: "desktop",
    current: true,
    year: 2024,
    bandwidthGBps: 120,
    ram: [16, 24, 32],
    fromPrice: 1499,
  },
  {
    id: "mini-m6",
    name: "Mac mini",
    chip: "M6",
    tier: "base",
    variant: "12-core CPU · 12-core GPU",
    form: "desktop",
    current: true,
    year: 2026,
    bandwidthGBps: 170,
    ram: [16, 24, 32],
    prices: { 16: 899, 24: 1099, 32: 1299 },
  },
  {
    id: "mini-m5pro-15",
    name: "Mac mini",
    chip: "M5 Pro",
    tier: "pro",
    variant: "15-core CPU · 16-core GPU",
    form: "desktop",
    current: true,
    year: 2026,
    bandwidthGBps: 307,
    ram: [24, 48, 64],
    prices: { 24: 1699, 48: 2299, 64: 2699 },
  },
  {
    id: "mini-m5pro-18",
    name: "Mac mini",
    chip: "M5 Pro",
    tier: "pro",
    variant: "18-core CPU · 20-core GPU",
    form: "desktop",
    current: true,
    year: 2026,
    bandwidthGBps: 307,
    ram: [24, 48, 64],
    prices: { 24: 1899, 48: 2499, 64: 2899 },
  },
  {
    id: "studio-m5max-32",
    name: "Mac Studio",
    chip: "M5 Max",
    tier: "max",
    variant: "18-core CPU · 32-core GPU",
    form: "desktop",
    current: true,
    year: 2026,
    bandwidthGBps: 460,
    ram: [36],
    prices: { 36: 2499 },
  },
  {
    id: "studio-m5max-40",
    name: "Mac Studio",
    chip: "M5 Max",
    tier: "max",
    variant: "18-core CPU · 40-core GPU",
    form: "desktop",
    current: true,
    year: 2026,
    bandwidthGBps: 614,
    ram: [48, 64, 128],
    prices: { 48: 3099, 64: 3499, 128: 5099 },
  },
  {
    id: "studio-m5ultra-64",
    name: "Mac Studio",
    chip: "M5 Ultra",
    tier: "ultra",
    variant: "30-core CPU · 64-core GPU",
    form: "desktop",
    current: true,
    year: 2026,
    bandwidthGBps: 1228,
    ram: [96, 256, 512],
    prices: { 96: 5499, 256: 9499 },
    note: "512 GB ships late October; price not yet announced.",
  },
  {
    id: "studio-m5ultra-80",
    name: "Mac Studio",
    chip: "M5 Ultra",
    tier: "ultra",
    variant: "36-core CPU · 80-core GPU",
    form: "desktop",
    current: true,
    year: 2026,
    bandwidthGBps: 1228,
    ram: [96, 256, 512],
    prices: { 96: 6799, 256: 10799 },
    note: "512 GB ships late October; price not yet announced.",
  },

  // ---------- previous generations (used / refurbished) ----------
  { id: "m1", name: "MacBook Air · MacBook Pro 13″ · Mac mini · iMac", chip: "M1", tier: "base", variant: "8-core CPU · 7/8-core GPU", form: "any", current: false, year: 2020, bandwidthGBps: 68, ram: [8, 16] },
  { id: "m1pro", name: "MacBook Pro 14″/16″", chip: "M1 Pro", tier: "pro", variant: "8/10-core CPU · 14/16-core GPU", form: "laptop", current: false, year: 2021, bandwidthGBps: 200, ram: [16, 32] },
  { id: "m1max", name: "MacBook Pro 14″/16″ · Mac Studio", chip: "M1 Max", tier: "max", variant: "10-core CPU · 24/32-core GPU", form: "any", current: false, year: 2021, bandwidthGBps: 400, ram: [32, 64] },
  { id: "m1ultra", name: "Mac Studio", chip: "M1 Ultra", tier: "ultra", variant: "20-core CPU · 48/64-core GPU", form: "desktop", current: false, year: 2022, bandwidthGBps: 800, ram: [64, 128] },
  { id: "m2", name: "MacBook Air · MacBook Pro 13″ · Mac mini", chip: "M2", tier: "base", variant: "8-core CPU · 8/10-core GPU", form: "any", current: false, year: 2022, bandwidthGBps: 100, ram: [8, 16, 24] },
  { id: "m2pro", name: "MacBook Pro 14″/16″ · Mac mini", chip: "M2 Pro", tier: "pro", variant: "10/12-core CPU · 16/19-core GPU", form: "any", current: false, year: 2023, bandwidthGBps: 200, ram: [16, 32] },
  { id: "m2max", name: "MacBook Pro 14″/16″ · Mac Studio", chip: "M2 Max", tier: "max", variant: "12-core CPU · 30/38-core GPU", form: "any", current: false, year: 2023, bandwidthGBps: 400, ram: [32, 64, 96] },
  { id: "m2ultra", name: "Mac Studio · Mac Pro", chip: "M2 Ultra", tier: "ultra", variant: "24-core CPU · 60/76-core GPU", form: "desktop", current: false, year: 2023, bandwidthGBps: 800, ram: [64, 128, 192] },
  { id: "m3", name: "MacBook Air · MacBook Pro 14″ · iMac", chip: "M3", tier: "base", variant: "8-core CPU · 8/10-core GPU", form: "any", current: false, year: 2023, bandwidthGBps: 100, ram: [8, 16, 24] },
  { id: "m3pro", name: "MacBook Pro 14″/16″", chip: "M3 Pro", tier: "pro", variant: "11/12-core CPU · 14/18-core GPU", form: "laptop", current: false, year: 2023, bandwidthGBps: 150, ram: [18, 36] },
  { id: "m3max-30", name: "MacBook Pro 14″/16″", chip: "M3 Max", tier: "max", variant: "14-core CPU · 30-core GPU", form: "laptop", current: false, year: 2023, bandwidthGBps: 300, ram: [36, 96] },
  { id: "m3max-40", name: "MacBook Pro 14″/16″", chip: "M3 Max", tier: "max", variant: "16-core CPU · 40-core GPU", form: "laptop", current: false, year: 2023, bandwidthGBps: 400, ram: [48, 64, 128] },
  { id: "m3ultra", name: "Mac Studio", chip: "M3 Ultra", tier: "ultra", variant: "28/32-core CPU · 60/80-core GPU", form: "desktop", current: false, year: 2025, bandwidthGBps: 819, ram: [96, 256, 512] },
  { id: "m4", name: "MacBook Air · MacBook Pro 14″ · Mac mini", chip: "M4", tier: "base", variant: "10-core CPU · 8/10-core GPU", form: "any", current: false, year: 2024, bandwidthGBps: 120, ram: [16, 24, 32] },
  { id: "m4pro", name: "MacBook Pro 14″/16″ · Mac mini", chip: "M4 Pro", tier: "pro", variant: "12/14-core CPU · 16/20-core GPU", form: "any", current: false, year: 2024, bandwidthGBps: 273, ram: [24, 48, 64] },
  { id: "m4max-32", name: "MacBook Pro 14″/16″ · Mac Studio", chip: "M4 Max", tier: "max", variant: "14-core CPU · 32-core GPU", form: "any", current: false, year: 2024, bandwidthGBps: 410, ram: [36] },
  { id: "m4max-40", name: "MacBook Pro 14″/16″ · Mac Studio", chip: "M4 Max", tier: "max", variant: "16-core CPU · 40-core GPU", form: "any", current: false, year: 2024, bandwidthGBps: 546, ram: [48, 64, 128] },
];

// Standard open-model size classes. paramsB is total parameters (what has to fit in memory);
// activeB is what's actually read per generated token — the same for dense models, much smaller
// for mixture-of-experts. kvKBPerToken is the fp16 KV cache per token of context, from each
// representative model's architecture (layers × KV heads × head dim × 2 × 2 bytes; Gemma 4's
// sliding-window layers make its cache much smaller than a same-size dense model's).
const MODEL_SIZES = [
  { id: "3b", label: "3B", paramsB: 3.2, activeB: 3.2, kvKBPerToken: 112, examples: "Llama 3.2 3B, Qwen 2.5 3B" },
  { id: "8b", label: "7–8B", paramsB: 8, activeB: 8, kvKBPerToken: 128, examples: "Llama 3.1 8B, Qwen3 8B, Mistral 7B" },
  { id: "12b", label: "12B", paramsB: 12, activeB: 12, kvKBPerToken: 96, examples: "Gemma 4 12B, Mistral Nemo 12B" },
  { id: "26b", label: "26B", paramsB: 26, activeB: 3.8, kvKBPerToken: 21, examples: "Gemma 4 26B-A4B (mixture-of-experts)" },
  { id: "31b", label: "31B", paramsB: 31, activeB: 31, kvKBPerToken: 83, examples: "Gemma 4 31B" },
  { id: "72b", label: "70–72B", paramsB: 72, activeB: 72, kvKBPerToken: 320, examples: "Llama 3.3 70B, Qwen 2.5 72B" },
];

// Bytes per parameter for common GGUF quants (effective bits-per-weight ÷ 8, including the
// higher-precision tensors llama.cpp keeps in each quant mix).
const QUANTS = [
  { id: "Q4_K_M", label: "Q4_K_M — 4-bit (most common)", bytesPerParam: 0.6 },
  { id: "Q5_K_M", label: "Q5_K_M — 5-bit", bytesPerParam: 0.71 },
  { id: "Q6_K", label: "Q6_K — 6-bit", bytesPerParam: 0.82 },
  { id: "Q8_0", label: "Q8_0 — 8-bit (near-lossless)", bytesPerParam: 1.06 },
  { id: "F16", label: "FP16 — unquantized", bytesPerParam: 2.0 },
];

const CONTEXTS = [
  { tokens: 4096, label: "4K tokens" },
  { tokens: 8192, label: "8K tokens" },
  { tokens: 32768, label: "32K tokens" },
  { tokens: 131072, label: "128K tokens" },
];
