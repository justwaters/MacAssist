(function () {
  const els = {
    sizeOptions: document.getElementById("size-options"),
    sizeExamples: document.getElementById("size-examples"),
    quant: document.getElementById("quant"),
    context: document.getElementById("context"),
    budget: document.getElementById("budget"),
    footprintNote: document.getElementById("footprint-note"),
    sortOptions: document.getElementById("sort-options"),
    lineupFilters: document.getElementById("lineup-filters"),
    formFilters: document.getElementById("form-filters"),
    tierFilters: document.getElementById("tier-filters"),
    showTight: document.getElementById("show-tight"),
    raiseGpuLimit: document.getElementById("raise-gpu-limit"),
    resetFilters: document.getElementById("reset-filters"),
    list: document.getElementById("results-list"),
    excludedWrap: document.getElementById("excluded-wrap"),
    excludedSummary: document.getElementById("excluded-summary"),
    excludedList: document.getElementById("excluded-list"),
    compareTray: document.getElementById("compare-tray"),
    compareTrayItems: document.getElementById("compare-tray-items"),
    compareClear: document.getElementById("compare-clear"),
    compareOpen: document.getElementById("compare-open"),
    compareOverlay: document.getElementById("compare-overlay"),
    compareClose: document.getElementById("compare-close"),
    compareBody: document.getElementById("compare-body"),
    filterPane: document.querySelector(".filter-pane"),
    mobileFilterFab: document.getElementById("mobile-filter-fab"),
    mobileFilterBadge: document.getElementById("mobile-filter-badge"),
    filterSheetBackdrop: document.getElementById("filter-sheet-backdrop"),
    filterSheetDone: document.getElementById("filter-sheet-done"),
  };

  const MAX_COMPARE = 4;
  const RUNTIME_OVERHEAD_GB = 1;
  const TIGHT_RATIO = 0.8;
  const RAISED_LIMIT_RESERVE_GB = 8;

  const SORT_OPTIONS = [
    { id: "fastest", label: "Fastest" },
    { id: "value", label: "Best value (tok/s per $)" },
    { id: "cheapest", label: "Lowest price" },
    { id: "headroom", label: "Most memory headroom" },
    { id: "newest", label: "Newest" },
  ];

  const LINEUPS = [
    { id: "current", label: "Current lineup" },
    { id: "previous", label: "Previous generations (used)" },
  ];
  const FORMS = [
    { id: "laptop", label: "Laptop" },
    { id: "desktop", label: "Desktop" },
  ];
  const TIERS = [
    { id: "base", label: "Base (M-series)" },
    { id: "pro", label: "Pro" },
    { id: "max", label: "Max" },
    { id: "ultra", label: "Ultra" },
  ];

  const DEFAULT_SIZE = "8b";
  const DEFAULT_CONTEXT = 8192;

  const state = {
    sizeId: DEFAULT_SIZE,
    sort: "fastest",
    lineups: new Set(LINEUPS.map((l) => l.id)),
    forms: new Set(FORMS.map((f) => f.id)),
    tiers: new Set(TIERS.map((t) => t.id)),
    compareSet: new Set(),
  };

  // ---------- building controls ----------

  function buildSizeOptions() {
    els.sizeOptions.innerHTML = "";
    MODEL_SIZES.forEach((size) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "segmented__option";
      btn.setAttribute("role", "radio");
      btn.dataset.sizeId = size.id;
      btn.textContent = size.label;
      btn.addEventListener("click", () => {
        state.sizeId = size.id;
        updateSizeOptions();
        render();
      });
      els.sizeOptions.appendChild(btn);
    });
    updateSizeOptions();
  }

  function updateSizeOptions() {
    els.sizeOptions.querySelectorAll("[data-size-id]").forEach((btn) => {
      const active = btn.dataset.sizeId === state.sizeId;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-checked", active ? "true" : "false");
    });
    els.sizeExamples.textContent = `e.g. ${currentSize().examples}`;
  }

  function buildSelects() {
    els.quant.innerHTML = QUANTS.map((q) => `<option value="${q.id}">${q.label}</option>`).join("");
    els.context.innerHTML = CONTEXTS.map(
      (c) => `<option value="${c.tokens}" ${c.tokens === DEFAULT_CONTEXT ? "selected" : ""}>${c.label}</option>`
    ).join("");
  }

  function buildSortOptions() {
    els.sortOptions.innerHTML = "";
    SORT_OPTIONS.forEach((opt, i) => {
      const label = document.createElement("label");
      label.className = "filter-radio";
      label.innerHTML = `<input type="radio" name="sort" value="${opt.id}" ${i === 0 ? "checked" : ""} /><span>${opt.label}</span>`;
      label.querySelector("input").addEventListener("change", () => {
        state.sort = opt.id;
        render();
      });
      els.sortOptions.appendChild(label);
    });
  }

  function buildCheckFilters(container, options, set) {
    container.innerHTML = "";
    options.forEach((opt) => {
      const label = document.createElement("label");
      label.className = "filter-check";
      label.innerHTML = `<input type="checkbox" value="${opt.id}" checked /><span>${opt.label}</span>`;
      label.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) set.add(opt.id);
        else set.delete(opt.id);
        render();
      });
      container.appendChild(label);
    });
  }

  function resetFilters() {
    state.sort = "fastest";
    state.lineups = new Set(LINEUPS.map((l) => l.id));
    state.forms = new Set(FORMS.map((f) => f.id));
    state.tiers = new Set(TIERS.map((t) => t.id));

    els.sortOptions.querySelectorAll("input").forEach((input, i) => {
      input.checked = i === 0;
    });
    buildCheckFilters(els.lineupFilters, LINEUPS, state.lineups);
    buildCheckFilters(els.formFilters, FORMS, state.forms);
    buildCheckFilters(els.tierFilters, TIERS, state.tiers);
    els.showTight.checked = true;
    els.raiseGpuLimit.checked = false;

    render();
  }

  // ---------- the math ----------

  function currentSize() {
    return MODEL_SIZES.find((s) => s.id === state.sizeId);
  }

  // What the chosen model needs: weights that must fit, bytes read per token, and KV cache.
  function computeFootprint() {
    const size = currentSize();
    const quant = QUANTS.find((q) => q.id === els.quant.value) || QUANTS[0];
    const contextTokens = parseInt(els.context.value, 10) || DEFAULT_CONTEXT;

    const weightsGB = size.paramsB * quant.bytesPerParam;
    const activeGB = size.activeB * quant.bytesPerParam;
    const kvGB = (size.kvKBPerToken * contextTokens) / (1024 * 1024);
    const needGB = weightsGB + kvGB + RUNTIME_OVERHEAD_GB;

    return { size, quant, contextTokens, weightsGB, activeGB, kvGB, needGB };
  }

  // macOS caps how much unified memory the GPU can wire: about ⅔ on ≤36 GB Macs, ¾ above.
  // The sysctl override can raise that to nearly everything.
  function gpuLimitGB(ramGB) {
    const defaultLimit = ramGB <= 36 ? ramGB * (2 / 3) : ramGB * 0.75;
    if (!els.raiseGpuLimit.checked) return defaultLimit;
    return Math.max(defaultLimit, ramGB - RAISED_LIMIT_RESERVE_GB);
  }

  function configPrice(mac, ramGB) {
    if (mac.prices && mac.prices[ramGB] != null) return { amount: mac.prices[ramGB], exact: true };
    if (mac.fromPrice && ramGB === mac.ram[0]) return { amount: mac.fromPrice, exact: true };
    if (mac.fromPrice) return { amount: mac.fromPrice, exact: false }; // "from" — real config costs more
    return null;
  }

  function estimateTps(mac, bytesPerTokenGB, isMoE) {
    const efficiency = TIER_EFFICIENCY[mac.tier] * (isMoE ? MOE_EFFICIENCY : 1);
    return (mac.bandwidthGBps * efficiency) / bytesPerTokenGB;
  }

  // Pure fit computation for one Mac — no lineup/form/tier/budget filtering. Used by both the
  // filtered results list (via evaluate()) and the compare view, which ignores filters.
  function computeFit(mac, fp) {
    const configs = mac.ram.map((ramGB) => {
      const limitGB = gpuLimitGB(ramGB);
      const ratio = fp.needGB / limitGB;
      const status = ratio <= TIGHT_RATIO ? "good" : ratio <= 1 ? "tight" : "over";
      return { ramGB, limitGB, ratio, status, price: configPrice(mac, ramGB) };
    });

    // Smallest comfortable config first; fall back to the smallest tight one.
    const allowTight = els.showTight.checked;
    const chosen =
      configs.find((c) => c.status === "good") || (allowTight ? configs.find((c) => c.status === "tight") : null);

    const isMoE = fp.size.activeB < fp.size.paramsB;
    const tps = estimateTps(mac, fp.activeGB, isMoE);
    const tpsFull = estimateTps(mac, fp.activeGB + fp.kvGB, isMoE);

    if (!chosen) {
      const largest = configs[configs.length - 1];
      const tightOnly = largest.status === "tight";
      return { mac, configs, chosen: null, status: "over", tps, tpsFull, largest, tightOnly };
    }

    return { mac, configs, chosen, status: chosen.status, tps, tpsFull };
  }

  function evaluate(mac, fp, budget) {
    const lineup = mac.current ? "current" : "previous";
    if (!state.lineups.has(lineup)) return null;
    if (mac.form !== "any" && !state.forms.has(mac.form)) return null;
    if (mac.form === "any" && state.forms.size === 0) return null;
    if (!state.tiers.has(mac.tier)) return null;

    const fit = computeFit(mac, fp);
    if (fit.chosen && budget > 0 && fit.chosen.price && fit.chosen.price.exact && fit.chosen.price.amount > budget) {
      return { ...fit, status: "over-budget" };
    }
    return fit;
  }

  function sortFitting(fitting) {
    const sorted = fitting.slice();
    const priceOf = (r) => (r.chosen.price ? r.chosen.price.amount : Infinity);
    const valueOf = (r) => (r.chosen.price ? r.tps / (r.chosen.price.amount / 1000) : -Infinity);
    switch (state.sort) {
      case "value":
        return sorted.sort((a, b) => valueOf(b) - valueOf(a) || b.tps - a.tps);
      case "cheapest":
        return sorted.sort((a, b) => priceOf(a) - priceOf(b) || b.tps - a.tps);
      case "headroom":
        return sorted.sort((a, b) => a.chosen.ratio - b.chosen.ratio);
      case "newest":
        return sorted.sort((a, b) => b.mac.year - a.mac.year || b.tps - a.tps);
      case "fastest":
      default:
        return sorted.sort((a, b) => b.tps - a.tps || priceOf(a) - priceOf(b));
    }
  }

  // ---------- formatting ----------

  function formatTps(tps) {
    return tps >= 10 ? `${Math.round(tps)}` : tps.toFixed(1);
  }

  function formatGB(gb) {
    return gb >= 10 ? `${Math.round(gb)}` : gb.toFixed(1);
  }

  function formatPrice(price) {
    if (!price) return "used market";
    const amount = `$${price.amount.toLocaleString("en-US")}`;
    return price.exact ? amount : `from ${amount}`;
  }

  function formatContext(tokens) {
    return `${tokens / 1024}K`;
  }

  function speedLabel(tps) {
    if (tps >= 40) return "Very fast";
    if (tps >= 20) return "Fast";
    if (tps >= 10) return "Comfortable";
    if (tps >= 5) return "Usable";
    return "Slow";
  }

  function macTitle(mac) {
    return `${mac.name}<span class="params">${mac.chip}</span>`;
  }

  function renderFootprintNote(fp) {
    const moe = fp.size.activeB < fp.size.paramsB
      ? ` Mixture-of-experts: only ~${formatGB(fp.activeGB)} GB of weights are read per token, so it runs much faster than its size suggests.`
      : "";
    els.footprintNote.innerHTML =
      `<span class="mono">~${fp.weightsGB.toFixed(1)} GB</span> weights + <span class="mono">~${fp.kvGB.toFixed(1)} GB</span> KV cache at ${formatContext(fp.contextTokens)} context + <span class="mono">~${RUNTIME_OVERHEAD_GB} GB</span> runtime = needs <strong class="mono">~${fp.needGB.toFixed(1)} GB</strong> of GPU memory.${moe}`;
  }

  // ---------- rendering ----------

  function renderRamPills(result) {
    return result.configs
      .map((c) => {
        const chosen = result.chosen && c.ramGB === result.chosen.ramGB;
        const title = `${c.ramGB} GB — GPU can use ~${formatGB(c.limitGB)} GB; model needs ${Math.round(c.ratio * 100)}% of that`;
        return `<span class="ram-pill ram-pill--${c.status}${chosen ? " is-chosen" : ""}" title="${title}">${c.ramGB} GB</span>`;
      })
      .join("");
  }

  function renderMacRow(result) {
    const { mac, chosen, status, tps, tpsFull } = result;
    const pct = Math.min(Math.round(chosen.ratio * 100), 100);
    const isCompared = state.compareSet.has(mac.id);
    const compareDisabled = !isCompared && state.compareSet.size >= MAX_COMPARE;
    const fp = computeFootprint();

    const row = document.createElement("article");
    row.className = `model-row model-row--${status}`;

    row.innerHTML = `
      <div class="model-row__accent"></div>
      <div class="model-row__body">
        <div class="model-row__head">
          <h3>${macTitle(mac)}</h3>
          <div class="model-row__meta">
            <div class="tags">
              <span class="tag">${mac.current ? "current" : "used"}</span>
              <span class="tag">${mac.year}</span>
            </div>
            <label class="compare-toggle">
              <input type="checkbox" data-compare-id="${mac.id}" ${isCompared ? "checked" : ""} ${compareDisabled ? "disabled" : ""} />
              <span>Compare</span>
            </label>
          </div>
        </div>
        <p class="model-row__blurb">${mac.variant}</p>
        <div class="speed">
          <span class="speed__value">~${formatTps(tps)}</span>
          <span class="speed__unit">tok/s</span>
          <span class="speed__label">${speedLabel(tps)} · ~${formatTps(tpsFull)} tok/s with ${formatContext(fp.contextTokens)} context full</span>
        </div>
        <div class="model-row__spec">
          <span><span class="spec-label">bandwidth</span>${mac.bandwidthGBps} GB/s</span>
          <span><span class="spec-label">get</span>${chosen.ramGB} GB</span>
          <span><span class="spec-label">price</span>${formatPrice(chosen.price)}</span>
        </div>
        <div class="fit-gauge">
          <div class="fit-gauge__track"><div class="fit-gauge__fill" style="width:${pct}%"></div></div>
          <span class="fit-gauge__label">${pct}% of the ~${formatGB(chosen.limitGB)} GB the GPU can use on the ${chosen.ramGB} GB model</span>
        </div>
        <div class="runtime-row">
          <span class="runtime-label">Memory options</span>
          ${renderRamPills(result)}
        </div>
        ${mac.note ? `<p class="row-note">${mac.note}</p>` : ""}
      </div>
    `;

    row.querySelector("[data-compare-id]").addEventListener("change", (e) => {
      toggleCompare(mac.id, e.target.checked);
    });

    return row;
  }

  function renderExcludedRow(result, fp, budget) {
    const { mac } = result;
    const row = document.createElement("div");
    row.className = "excluded-row";
    let reason;
    if (result.status === "over-budget") {
      reason = `${result.chosen.ramGB} GB config is ${formatPrice(result.chosen.price)} — over your $${budget.toLocaleString("en-US")} budget`;
    } else if (result.tightOnly) {
      reason = `only a tight fit, even at ${result.largest.ramGB} GB`;
    } else {
      const shortGB = fp.needGB - result.largest.limitGB;
      reason = `max ${result.largest.ramGB} GB — ~${formatGB(shortGB)} GB short`;
    }
    row.innerHTML = `
      <span class="name">${mac.name} · ${mac.chip} <span class="mono">(${mac.variant})</span></span>
      <span class="need">${reason}</span>
    `;
    return row;
  }

  function render() {
    const fp = computeFootprint();
    const budget = parseFloat(els.budget.value) || 0;
    renderFootprintNote(fp);

    const fitting = [];
    const excluded = [];

    MACS.forEach((mac) => {
      const result = evaluate(mac, fp, budget);
      if (!result) return;
      if (result.status === "over" || result.status === "over-budget") excluded.push(result);
      else fitting.push(result);
    });

    const sortedFitting = sortFitting(fitting);

    els.list.innerHTML = "";
    if (sortedFitting.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = `<strong>No Mac in this selection can run it.</strong> Try a smaller quantization or shorter context, turn on the raised GPU memory limit, or widen your filters.`;
      els.list.appendChild(empty);
    } else {
      sortedFitting.forEach((r) => els.list.appendChild(renderMacRow(r)));
    }

    const heading = document.getElementById("results-heading");
    heading.textContent =
      sortedFitting.length > 0
        ? `${sortedFitting.length} Mac${sortedFitting.length === 1 ? "" : "s"} can run a ${fp.size.label} model at ${fp.quant.id}`
        : "No Macs fit yet";

    if (excluded.length > 0) {
      excluded.sort((a, b) => (b.largest ? b.largest.ramGB : Infinity) - (a.largest ? a.largest.ramGB : Infinity));
      els.excludedWrap.hidden = false;
      els.excludedSummary.textContent = `${excluded.length} more Mac${excluded.length === 1 ? "" : "s"} can't run it${budget > 0 ? " or are over budget" : ""}`;
      els.excludedList.innerHTML = "";
      excluded.forEach((r) => els.excludedList.appendChild(renderExcludedRow(r, fp, budget)));
    } else {
      els.excludedWrap.hidden = true;
    }

    updateFilterBadge();
  }

  // ---------- compare ----------

  function toggleCompare(id, checked) {
    if (checked) {
      if (state.compareSet.size >= MAX_COMPARE) return;
      state.compareSet.add(id);
    } else {
      state.compareSet.delete(id);
    }
    updateCompareCheckboxes();
    renderCompareTray();
  }

  // Keeps every rendered compare checkbox in sync with state (checked + disabled-at-cap),
  // without a full results re-render — toggling compare shouldn't reshuffle the list.
  function updateCompareCheckboxes() {
    els.list.querySelectorAll("[data-compare-id]").forEach((input) => {
      const id = input.dataset.compareId;
      const checked = state.compareSet.has(id);
      input.checked = checked;
      input.disabled = !checked && state.compareSet.size >= MAX_COMPARE;
    });
  }

  function renderCompareTray() {
    const ids = [...state.compareSet];
    els.compareTray.hidden = ids.length === 0;
    els.mobileFilterFab.classList.toggle("is-above-tray", ids.length > 0);
    if (ids.length === 0) return;

    els.compareTrayItems.innerHTML = ids
      .map((id) => {
        const mac = MACS.find((m) => m.id === id);
        const label = `${mac.chip} ${mac.name.split(" · ")[0]}`;
        return `
          <span class="compare-chip">
            ${label}
            <button type="button" data-remove-id="${id}" aria-label="Remove ${label} from comparison">&times;</button>
          </span>`;
      })
      .join("");

    els.compareTrayItems.querySelectorAll("[data-remove-id]").forEach((btn) => {
      btn.addEventListener("click", () => toggleCompare(btn.dataset.removeId, false));
    });

    els.compareOpen.disabled = ids.length < 2;
    els.compareOpen.textContent = ids.length < 2 ? "Select 1 more to compare" : `Compare ${ids.length} Macs`;
  }

  // Two independent fixed overlays (compare + mobile filter sheet) can each
  // want the body scroll locked. Track how many are open so closing one
  // doesn't unlock scroll while the other is still showing.
  const openOverlays = new Set();
  function lockBodyScroll(id) {
    openOverlays.add(id);
    document.body.style.overflow = "hidden";
  }
  function unlockBodyScroll(id) {
    openOverlays.delete(id);
    if (openOverlays.size === 0) document.body.style.overflow = "";
  }

  function openFilterSheet() {
    els.filterPane.classList.add("is-open");
    els.filterSheetBackdrop.hidden = false;
    lockBodyScroll("filters");
  }
  function closeFilterSheet() {
    els.filterPane.classList.remove("is-open");
    els.filterSheetBackdrop.hidden = true;
    unlockBodyScroll("filters");
  }

  function updateFilterBadge() {
    const activeCount =
      (LINEUPS.length - state.lineups.size) +
      (FORMS.length - state.forms.size) +
      (TIERS.length - state.tiers.size) +
      (state.sort !== "fastest" ? 1 : 0) +
      (!els.showTight.checked ? 1 : 0) +
      (els.raiseGpuLimit.checked ? 1 : 0);
    els.mobileFilterBadge.hidden = activeCount === 0;
    els.mobileFilterBadge.textContent = activeCount;
  }

  function openCompareOverlay() {
    const fp = computeFootprint();
    const macs = [...state.compareSet].map((id) => MACS.find((m) => m.id === id));
    const fits = macs.map((m) => computeFit(m, fp));

    document.getElementById("compare-title").textContent =
      `Comparing ${macs.length} Macs · ${fp.size.label} at ${fp.quant.id}, ${formatContext(fp.contextTokens)} context`;
    els.compareBody.innerHTML = buildCompareTable(macs, fits, fp);

    els.compareOverlay.hidden = false;
    lockBodyScroll("compare");
  }

  function closeCompareOverlay() {
    els.compareOverlay.hidden = true;
    unlockBodyScroll("compare");
  }

  function buildCompareTable(macs, fits, fp) {
    const headerCells = macs.map((m) => `<th>${macTitle(m)}</th>`).join("");

    const row = (label, cellFn) =>
      `<tr><th scope="row">${label}</th>${macs.map((m, i) => `<td>${cellFn(m, fits[i])}</td>`).join("")}</tr>`;

    const fitCell = (m, fit) => {
      if (!fit.chosen) {
        return `<span class="compare-status--over">Doesn't fit</span><div class="compare-sub">even at ${fit.largest.ramGB} GB</div>`;
      }
      const pct = Math.min(Math.round(fit.chosen.ratio * 100), 100);
      return `<span class="compare-status--${fit.chosen.status}">${pct}% of GPU memory</span><div class="compare-sub">on the ${fit.chosen.ramGB} GB config</div>`;
    };

    const speedCell = (m, fit) =>
      `<b class="mono">~${formatTps(fit.tps)} tok/s</b><div class="compare-sub">~${formatTps(fit.tpsFull)} with ${formatContext(fp.contextTokens)} context full</div>`;

    const priceCell = (m, fit) => {
      if (!fit.chosen) return "—";
      return `${formatPrice(fit.chosen.price)}<div class="compare-sub">${fit.chosen.ramGB} GB config</div>`;
    };

    return `
      <table class="compare-table">
        <thead><tr><th></th>${headerCells}</tr></thead>
        <tbody>
          ${row("Chip", (m) => `${m.chip}<div class="compare-sub">${m.variant}</div>`)}
          ${row("Memory bandwidth", (m) => `<span class="mono">${m.bandwidthGBps} GB/s</span>`)}
          ${row("Est. speed", speedCell)}
          ${row("Fits", fitCell)}
          ${row("Price", priceCell)}
          ${row("Memory options", (m, fit) => `<div class="ram-pills">${renderRamPills(fit)}</div>`)}
          ${row("Status", (m) => (m.current ? `Current · ${m.year}` : `Used · ${m.year}`))}
        </tbody>
      </table>
    `;
  }

  // ---------- init ----------

  function init() {
    buildSizeOptions();
    buildSelects();
    buildSortOptions();
    buildCheckFilters(els.lineupFilters, LINEUPS, state.lineups);
    buildCheckFilters(els.formFilters, FORMS, state.forms);
    buildCheckFilters(els.tierFilters, TIERS, state.tiers);
    render();

    [els.quant, els.context, els.showTight, els.raiseGpuLimit].forEach((el) => el.addEventListener("change", render));
    els.budget.addEventListener("input", render);
    els.resetFilters.addEventListener("click", resetFilters);

    els.compareClear.addEventListener("click", () => {
      state.compareSet.clear();
      updateCompareCheckboxes();
      renderCompareTray();
    });
    els.compareOpen.addEventListener("click", () => {
      if (state.compareSet.size >= 2) openCompareOverlay();
    });
    els.compareClose.addEventListener("click", closeCompareOverlay);
    els.compareOverlay.addEventListener("click", (e) => {
      if (e.target === els.compareOverlay) closeCompareOverlay();
    });

    els.mobileFilterFab.addEventListener("click", openFilterSheet);
    els.filterSheetDone.addEventListener("click", closeFilterSheet);
    els.filterSheetBackdrop.addEventListener("click", closeFilterSheet);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!els.compareOverlay.hidden) closeCompareOverlay();
      if (els.filterPane.classList.contains("is-open")) closeFilterSheet();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
