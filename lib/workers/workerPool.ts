/**
 * Lightweight Web Worker pool for offloading heavy computations.
 * Currently supports Pyodide execution off-main-thread.
 */

type WorkerMessage = { id: string; [key: string]: any };
type PendingResolve = { resolve: (v: any) => void; reject: (e: Error) => void };

let pyodideWorker: Worker | null = null;
const pending = new Map<string, PendingResolve>();
let msgId = 0;

function getId(): string {
    return `w${++msgId}`;
}

function getPyodideWorker(): Worker {
    if (!pyodideWorker) {
        pyodideWorker = new Worker(new URL('./pyodide.worker.ts', import.meta.url));
        pyodideWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
            const { id, ...rest } = e.data;
            const p = pending.get(id);
            if (p) {
                pending.delete(id);
                if (rest.type === 'error') {
                    p.reject(new Error(rest.error));
                } else {
                    p.resolve(rest);
                }
            }
        };
    }
    return pyodideWorker;
}

function send(worker: Worker, msg: Omit<WorkerMessage, 'id'>): Promise<any> {
    const id = getId();
    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ id, ...msg });
    });
}

export async function runPythonInWorker(code: string, packages?: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const worker = getPyodideWorker();
    const result = await send(worker, { type: 'run', code, packages });
    return { stdout: result.stdout || '', stderr: result.stderr || '', exitCode: result.exitCode ?? 0 };
}

export async function bootPyodideWorker(): Promise<void> {
    const worker = getPyodideWorker();
    await send(worker, { type: 'boot' });
}

export function terminatePyodideWorker(): void {
    if (pyodideWorker) {
        pyodideWorker.terminate();
        pyodideWorker = null;
        pending.clear();
    }
}
