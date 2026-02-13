import { WebContainer } from '@webcontainer/api';
import type { ExecutionResult } from '../../types/runtime';

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let wcStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';

export function getWebContainerStatus() {
    return wcStatus;
}

export async function bootWebContainer(): Promise<WebContainer> {
    if (instance) return instance;
    if (bootPromise) return bootPromise;

    wcStatus = 'loading';

    bootPromise = (async () => {
        try {
            instance = await WebContainer.boot();
            wcStatus = 'ready';
            return instance;
        } catch (err) {
            wcStatus = 'error';
            bootPromise = null;
            throw err;
        }
    })();

    return bootPromise;
}

export async function mountFiles(files: Record<string, string>): Promise<void> {
    const container = await bootWebContainer();

    // Convert flat file map to WebContainer directory tree structure
    const tree: any = {};
    for (const [path, content] of Object.entries(files)) {
        const parts = path.split('/').filter(Boolean);
        let current = tree;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = { directory: {} };
            }
            current = current[parts[i]].directory;
        }
        const fileName = parts[parts.length - 1];
        current[fileName] = { file: { contents: content } };
    }

    await container.mount(tree);
}

export async function spawnProcess(
    command: string,
    args: string[] = [],
    onOutput?: (data: string) => void,
): Promise<number> {
    const container = await bootWebContainer();
    const process = await container.spawn(command, args);

    if (onOutput) {
        process.output.pipeTo(new WritableStream({
            write(data) {
                onOutput(data);
            },
        }));
    }

    return process.exit;
}

export async function runNodeCommand(command: string, args: string[] = []): Promise<ExecutionResult> {
    const container = await bootWebContainer();
    const startTime = performance.now();

    let stdout = '';
    let stderr = '';

    const process = await container.spawn(command, args, { env: {} });

    // WebContainer merges stdout+stderr into process.output. We split by heuristic:
    // Lines starting with common error prefixes go to stderr.
    const errorPrefixes = /^(error|warn|ERR!|Error:|TypeError|SyntaxError|ReferenceError|ENOENT|EACCES|npm ERR)/i;
    await process.output.pipeTo(new WritableStream({
        write(data) {
            const lines = data.split('\n');
            for (const line of lines) {
                if (errorPrefixes.test(line.trim())) stderr += line + '\n';
                else stdout += line + '\n';
            }
        },
    }));

    const exitCode = await process.exit;

    return {
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode,
        runtime: 'webcontainer',
        durationMs: performance.now() - startTime,
    };
}

export async function installDependencies(
    onOutput?: (data: string) => void,
): Promise<number> {
    return spawnProcess('npm', ['install'], onOutput);
}

export async function startDevServer(
    command: string = 'npm',
    args: string[] = ['run', 'dev'],
): Promise<{ url: string; port: number }> {
    const container = await bootWebContainer();

    // Start the dev server (fire-and-forget — it runs until killed)
    container.spawn(command, args);

    // Wait for the server to be ready
    return new Promise((resolve) => {
        container.on('server-ready', (port, url) => {
            resolve({ url, port });
        });
    });
}

export async function writeFile(path: string, content: string): Promise<void> {
    const container = await bootWebContainer();
    await container.fs.writeFile(path, content);
}

export async function readFile(path: string): Promise<string> {
    const container = await bootWebContainer();
    return container.fs.readFile(path, 'utf-8');
}

export async function readDir(path: string): Promise<string[]> {
    const container = await bootWebContainer();
    return container.fs.readdir(path);
}

export function isWebContainerReady(): boolean {
    return wcStatus === 'ready';
}

export function getWebContainer(): WebContainer | null {
    return instance;
}
