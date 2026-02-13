import type { ExecutionResult } from '../../types/runtime';

let pyodideInstance: any = null;
let bootPromise: Promise<any> | null = null;
let pyodideStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/';

export function getPyodideStatus() {
    return pyodideStatus;
}

export async function bootPyodide(): Promise<any> {
    if (pyodideInstance) return pyodideInstance;
    if (bootPromise) return bootPromise;

    pyodideStatus = 'loading';

    bootPromise = (async () => {
        try {
            // Dynamic import from CDN — avoids bundling 100MB+ Pyodide
            const script = document.createElement('script');
            script.src = `${PYODIDE_CDN}pyodide.js`;
            await new Promise<void>((resolve, reject) => {
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Pyodide'));
                document.head.appendChild(script);
            });

            const loadPyodide = (window as any).loadPyodide;
            if (!loadPyodide) throw new Error('loadPyodide not found');

            pyodideInstance = await loadPyodide({
                indexURL: PYODIDE_CDN,
            });

            // Pre-load micropip for package installation
            await pyodideInstance.loadPackage('micropip');

            pyodideStatus = 'ready';
            return pyodideInstance;
        } catch (err) {
            pyodideStatus = 'error';
            bootPromise = null;
            throw err;
        }
    })();

    return bootPromise;
}

export async function runPython(code: string, stdin?: string): Promise<ExecutionResult> {
    const pyodide = await bootPyodide();
    const startTime = performance.now();

    // Redirect stdout/stderr
    pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

    // Set up stdin if provided
    if (stdin) {
        pyodide.runPython(`
import io
sys.stdin = io.StringIO(${JSON.stringify(stdin)})
`);
    }

    try {
        await pyodide.runPythonAsync(code);
        const stdout = pyodide.runPython('sys.stdout.getvalue()');
        const stderr = pyodide.runPython('sys.stderr.getvalue()');
        return {
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: 0,
            runtime: 'pyodide',
            durationMs: performance.now() - startTime,
        };
    } catch (err: any) {
        const stderr = (() => {
            try { return pyodide.runPython('sys.stderr.getvalue()'); } catch { return ''; }
        })();
        return {
            stdout: '',
            stderr: stderr || err.message || String(err),
            exitCode: 1,
            runtime: 'pyodide',
            durationMs: performance.now() - startTime,
        };
    }
}

export async function installPyPackage(packageName: string): Promise<void> {
    const pyodide = await bootPyodide();
    const micropip = pyodide.pyimport('micropip');
    await micropip.install(packageName);
}

export function isPyodideReady(): boolean {
    return pyodideStatus === 'ready';
}
