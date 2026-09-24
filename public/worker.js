importScripts("wasm_exec.js?v=3");

const go = new Go();

self.wasmready = function () {
  postMessage({ type: "ready" });
};

const wasmFetch = fetch("sim.wasm?v=3");
(WebAssembly.instantiateStreaming
  ? WebAssembly.instantiateStreaming(wasmFetch, go.importObject).catch(() =>
      wasmFetch.then((r) => r.arrayBuffer()).then((buf) => WebAssembly.instantiate(buf, go.importObject))
    )
  : wasmFetch.then((r) => r.arrayBuffer()).then((buf) => WebAssembly.instantiate(buf, go.importObject))
)
  .then((result) => go.run(result.instance))
  .catch((err) => {
    console.error("Failed to load WASM:", err);
    postMessage({ type: "error", error: err.message || String(err) });
  });

function postSimError(err) {
  postMessage({
    type: "error",
    error: err && err.message ? err.message : String(err),
  });
}

function postSimDone(results, iters, seed, mobType) {
  postMessage({
    type: "done",
    results: {
      engine: "WASM",
      engineUrl: "",
      license: "MIT",
      fightDurationSec: 180,
      iterations: iters,
      seed: seed,
      mobType: mobType || "Demon",
      generatedAt: new Date().toISOString(),
      rows: results,
    },
  });
}

self.onmessage = function (e) {
  const { specId, talents, iters, seed, mobType } = e.data || {};

  if (typeof self.resimSpecWasm !== "function") {
    postMessage({ type: "error", error: "WASM sim is not registered." });
    return;
  }

  try {
    self.resimSpecWasm(
      specId || "",
      talents || "",
      iters || 1000,
      seed || 0,
      mobType || "",
      function (resultsJson) {
        if (typeof resultsJson !== "string" || resultsJson.length === 0) {
          postMessage({
            type: "error",
            error: "WASM returned " + String(resultsJson),
          });
          return;
        }
        try {
          const parsed = JSON.parse(resultsJson);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.error) {
            postMessage({ type: "error", error: parsed.error });
            return;
          }
          if (!Array.isArray(parsed)) {
            postMessage({ type: "error", error: "WASM returned unexpected JSON." });
            return;
          }
          postSimDone(parsed, iters, seed, mobType);
        } catch (err) {
          postSimError(err);
        }
      },
    );
  } catch (err) {
    postSimError(err);
  }
};
