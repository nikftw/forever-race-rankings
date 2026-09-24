importScripts('wasm_exec.js');

const go = new Go();

let wasmReady = false;
WebAssembly.instantiateStreaming(fetch('sim.wasm'), go.importObject).then((result) => {
    go.run(result.instance);
    wasmReady = true;
    postMessage({ type: 'ready' });
}).catch((err) => {
    console.error('Failed to load WASM:', err);
    postMessage({ type: 'error', error: err.message });
});

self.onmessage = function(e) {
    if (!wasmReady) {
        postMessage({ type: 'error', error: 'WASM not ready yet' });
        return;
    }
    
    const { specId, talents, iters, seed, mobType } = e.data;
    
    try {
        const resultsJson = self.resimSpecWasm(
            specId || "", 
            talents || "", 
            iters || 1000, 
            seed || 0, 
            mobType || ""
        );
        
        const results = JSON.parse(resultsJson);
        
        // Return in the format expected by race-board.tsx replaceSimResults
        postMessage({
            type: 'done',
            results: {
                engine: "WASM",
                engineUrl: "",
                license: "MIT",
                fightDurationSec: 180,
                iterations: iters,
                seed: seed,
                mobType: mobType || "Demon",
                generatedAt: new Date().toISOString(),
                rows: results
            }
        });
    } catch (err) {
        console.error('WASM run failed:', err);
        postMessage({ type: 'error', error: err.message });
    }
};
