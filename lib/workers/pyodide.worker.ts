/// <reference lib="webworker" />

let pyodide: any = null;

async function boot() {
    if (pyodide) return;
    // @ts-expect-error — worker globals not typed
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');
    // @ts-expect-error — worker globals not typed
    pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/' });
}

self.onmessage = async (e: MessageEvent) => {
    const { id, type, code, packages } = e.data;
    try {
        if (type === 'boot') {
            await boot();
            self.postMessage({ id, type: 'booted' });
        } else if (type === 'run') {
            await boot();
            if (packages?.length) {
                await pyodide.loadPackage(packages);
            }
            pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
            await pyodide.runPythonAsync(code);
            const stdout = pyodide.runPython('sys.stdout.getvalue()');
            const stderr = pyodide.runPython('sys.stderr.getvalue()');
            self.postMessage({ id, type: 'result', stdout, stderr, exitCode: 0 });
        } else if (type === 'install') {
            await boot();
            await pyodide.loadPackage(packages);
            self.postMessage({ id, type: 'installed' });
        }
    } catch (err: any) {
        self.postMessage({ id, type: 'error', error: err.message || String(err) });
    }
};
