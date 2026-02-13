'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface LinuxFileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    isSymlink: boolean;
    size: number;
    permissions: string;
    modifiedAt: number;
}

interface TerminalHandle {
    sendInput: (data: string) => void;
    resize: (cols: number, rows: number) => void;
    detach: () => void;
}

interface CheerpXContextType {
    isBooted: boolean;
    isBooting: boolean;
    bootError: string | null;
    boot: (initialCols?: number, initialRows?: number) => Promise<any>;
    attachTerminal: (
        writeFunc: (buf: Uint8Array) => void,
        cols: number,
        rows: number,
    ) => TerminalHandle;
    runShell: () => Promise<void>;
    writeProjectFile: (path: string, content: string) => Promise<void>;
    captureCommand: (command: string) => Promise<string>;
    batchReadFiles: (paths: string[]) => Promise<Map<string, string>>;
    listDir: (path: string) => Promise<LinuxFileEntry[]>;
    readFile: (path: string) => Promise<string>;
    writeLinuxFile: (path: string, content: string) => Promise<void>;
    mkdirLinux: (path: string) => Promise<void>;
    removeLinux: (path: string) => Promise<void>;
    networkLoginUrl: string | null;
    networkState: 'disconnected' | 'connecting' | 'login-ready' | 'connected';
    connectNetwork: () => Promise<void>;
    kmsCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    isXorgRunning: boolean;
    startXorg: () => Promise<void>;
    launchGuiApp: (command: string) => Promise<void>;
    exportLinuxSnapshot: () => Promise<void>;
    importLinuxSnapshot: (file: File) => Promise<void>;
    compressPath: (sourcePath: string, archivePath: string) => Promise<void>;
    extractArchive: (archivePath: string, destPath: string) => Promise<void>;
    downloadFile: (path: string) => Promise<void>;
    resetEnvironment: () => Promise<void>;
}

const CheerpXContext = createContext<CheerpXContextType | undefined>(undefined);

export const useCheerpX = () => {
    const ctx = useContext(CheerpXContext);
    if (!ctx) throw new Error('useCheerpX must be used within CheerpXProvider');
    return ctx;
};

export const useCheerpXSafe = () => {
    return useContext(CheerpXContext);
};

const DISK_IMAGE_URL = 'wss://disks.webvm.io/debian_large_20230522_5044875331_2.ext2';

// Patch console.log to suppress excessive CheerpX/Tailscale spam
if (typeof window !== 'undefined') {
    const originalLog = console.log;
    console.log = (...args: any[]) => {
        if (args.length > 0 && typeof args[0] === 'string' && (args[0].includes('recvTcp') || args[0].includes('sendTcp'))) {
            return;
        }
        originalLog(...args);
    };
}

const IDB_CACHE_ID = 'hackathos-cx';
const WARM_BOOT_KEY = 'hackathos-warm-boot';

const BASHRC = `export PS1='\\[\\e[1;32m\\]user\\[\\e[0m\\]@\\[\\e[1;36m\\]hackathos\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]$ '
export EDITOR=vim
export LANG=en_US.UTF-8
export CFLAGS="-O0"
export CXXFLAGS="-O0"

alias ll='ls -la --color=auto'
alias la='ls -A --color=auto'
alias ls='ls --color=auto'
alias cls='clear'
alias ..='cd ..'
alias ...='cd ../..'

alias proj='cd ~/projects'

echo -e "\\e[36m  HackathOS Linux Environment\\e[0m"
echo -e "\\e[90m  Full Debian Linux in your browser. apt, pip, gcc, python — everything works.\\e[0m"
echo -e "\\e[90m  Project files are at ~/projects\\e[0m"
echo ""
`;

// OPT: Pre-compute bashrc base64 at module load instead of every boot
const BASHRC_B64 = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(BASHRC)))
    : '';

// OPT: Static TextDecoder instance (reused across all decode calls)
const textDecoder = new TextDecoder();

// OPT: Pre-compiled regex for ls output parsing
const LS_LINE_REGEX = /^([dlcbsp-][rwxstST-]{9})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\d+)\s+(.+)$/;

let cxInstance: any = null;
let dataDeviceInstance: any = null;
let idbDeviceInstance: any = null;
let bootPromise: Promise<any> | null = null;

let consoleReadFunc: any = null;
let consoleAttached = false;
let shellRunning = false;
const terminalWriteFuncs = new Set<(buf: Uint8Array) => void>();
// --- Parallel Capture Pool ---
// CheerpX can run multiple processes concurrently. We use a semaphore to limit
// concurrent captures while allowing parallelism (default: 4 slots).
const CAPTURE_CONCURRENCY = 4;
let activeCaptureCount = 0;
const captureQueue: Array<{ command: string; resolve: (r: string) => void; reject: (e: Error) => void }> = [];

// Each capture gets its own buffer via a unique output handler.
// Terminal output (non-capture) routes to terminalWriteFuncs.
let activeCaptureHandlers = new Set<(buf: Uint8Array) => void>();

function centralOutputHandler(buf: Uint8Array) {
    if (activeCaptureHandlers.size > 0) {
        // Broadcast to all active capture handlers — each filters by its own process.
        // CheerpX mixes outputs for concurrent processes, but for file reads
        // (which are our main parallel case) the output is discrete per command.
        for (const fn of activeCaptureHandlers) {
            fn(buf);
        }
    } else {
        for (const fn of terminalWriteFuncs) {
            fn(buf);
        }
    }
}

async function runCapture(command: string): Promise<string> {
    if (!cxInstance) throw new Error('CheerpX not initialized');
    let buffer = '';
    const handler = (buf: Uint8Array) => {
        buffer += textDecoder.decode(buf, { stream: true });
    };
    activeCaptureHandlers.add(handler);
    try {
        await cxInstance.run('/bin/bash', ['-c', command], {
            cwd: '/', uid: 0, gid: 0,
            env: ['HOME=/root', 'TERM=dumb', 'SHELL=/bin/bash', 'LC_ALL=C'],
        });
        return buffer;
    } catch (err: any) {
        const msg = err?.message || String(err);
        // WASM out-of-bounds errors are non-recoverable for this process but
        // don't necessarily kill CheerpX.  Return what we have and log the error.
        if (msg.includes('out of bounds') || msg.includes('RuntimeError') || msg.includes('unreachable')) {
            console.warn('[HackathOS] CheerpX WASM error during command:', command.slice(0, 80), msg);
            return buffer; // partial output is better than throwing
        }
        throw err;
    } finally {
        activeCaptureHandlers.delete(handler);
    }
}

function processQueue() {
    while (captureQueue.length > 0 && activeCaptureCount < CAPTURE_CONCURRENCY) {
        const item = captureQueue.shift()!;
        activeCaptureCount++;
        runCapture(item.command)
            .then(result => { activeCaptureCount--; item.resolve(result); processQueue(); })
            .catch(err => { activeCaptureCount--; item.reject(err); processQueue(); });
    }
}

function queueCapture(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        captureQueue.push({ command, resolve, reject });
        processQueue();
    });
}

function parseLsOutput(output: string, dirPath: string): LinuxFileEntry[] {
    const lines = output.trim().split('\n');
    const entries: LinuxFileEntry[] = [];
    for (const line of lines) {
        if (!line || line.startsWith('total ')) continue;
        const match = line.match(LS_LINE_REGEX);
        if (!match) continue;
        const [, permissions, sizeStr, tsStr, name] = match;
        if (name === '.' || name === '..') continue;
        const symlinkParts = name.match(/^(.+?) -> (.+)$/);
        const actualName = symlinkParts ? symlinkParts[1] : name;
        const fullPath = dirPath === '/' ? `/${actualName}` : `${dirPath}/${actualName}`;
        entries.push({
            name: actualName,
            path: fullPath,
            isDirectory: permissions.startsWith('d'),
            isSymlink: permissions.startsWith('l'),
            size: parseInt(sizeStr) || 0,
            permissions,
            modifiedAt: parseInt(tsStr) || 0,
        });
    }
    return entries;
}

// OPT: Check if this is a warm boot (config already persisted in overlay)
function isWarmBoot(): boolean {
    try {
        return localStorage.getItem(WARM_BOOT_KEY) === 'true';
    } catch {
        return false;
    }
}

function markWarmBoot() {
    try {
        localStorage.setItem(WARM_BOOT_KEY, 'true');
    } catch { }
}

export const CheerpXProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isBooted, setIsBooted] = useState(!!cxInstance);
    const [isBooting, setIsBooting] = useState(false);
    const [bootError, setBootError] = useState<string | null>(null);
    const [networkLoginUrl, setNetworkLoginUrl] = useState<string | null>(null);
    const [networkState, setNetworkState] = useState<'disconnected' | 'connecting' | 'login-ready' | 'connected'>('disconnected');

    // Catch unhandled WASM errors (CheerpX "out of bounds memory access") so they
    // don't crash the React tree.  These are non-fatal for the overall app — the
    // individual command that triggered them will already have been handled in
    // runCapture's catch block.
    React.useEffect(() => {
        const handler = (e: ErrorEvent) => {
            const msg = e.message || '';
            if (msg.includes('out of bounds') || msg.includes('RuntimeError') || msg.includes('unreachable')) {
                console.warn('[HackathOS] Suppressed CheerpX WASM error:', msg);
                e.preventDefault(); // prevent default error overlay
            }
        };
        const rejectionHandler = (e: PromiseRejectionEvent) => {
            const msg = String(e.reason?.message || e.reason || '');
            if (msg.includes('out of bounds') || msg.includes('RuntimeError') || msg.includes('unreachable')) {
                console.warn('[HackathOS] Suppressed CheerpX unhandled rejection:', msg);
                e.preventDefault();
            }
        };
        window.addEventListener('error', handler);
        window.addEventListener('unhandledrejection', rejectionHandler);
        return () => {
            window.removeEventListener('error', handler);
            window.removeEventListener('unhandledrejection', rejectionHandler);
        };
    }, []);
    const [isXorgRunning, setIsXorgRunning] = useState(false);
    const kmsCanvasRef = useRef<HTMLCanvasElement | null>(null);
    // OPT: Deferred Tailscale — networkInterface callbacks are no-ops until user requests networking
    const networkEnabledRef = useRef(false);

    const boot = useCallback(async (initialCols?: number, initialRows?: number) => {
        if (cxInstance) { setIsBooted(true); return cxInstance; }
        if (bootPromise) { const cx = await bootPromise; setIsBooted(true); return cx; }

        setIsBooting(true);
        setBootError(null);

        bootPromise = (async () => {
            if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
                throw new Error('Cross-Origin Isolation required. Reload the page.');
            }

            const CheerpX = await import('@leaningtech/cheerpx');

            const cloudDevice = await CheerpX.CloudDevice.create(DISK_IMAGE_URL);
            const idbDevice = await CheerpX.IDBDevice.create(IDB_CACHE_ID);
            const overlayDevice = await CheerpX.OverlayDevice.create(cloudDevice, idbDevice);
            const dataDevice = await CheerpX.DataDevice.create();
            dataDeviceInstance = dataDevice;
            idbDeviceInstance = idbDevice;

            const sharedIdb = await CheerpX.IDBDevice.create('hackathos-shared');

            const mounts: any[] = [
                { type: 'ext2', dev: overlayDevice, path: '/' },
                { type: 'dir', dev: dataDevice, path: '/projects' },
                { type: 'dir', dev: sharedIdb, path: '/shared' },
                { type: 'devs', path: '/dev' },
                { type: 'devpts', path: '/dev/pts' },
                { type: 'proc', path: '/proc' },
                { type: 'sys', path: '/sys' },
            ];

            const cx = await CheerpX.Linux.create({
                mounts,
                // OPT: Deferred Tailscale — callbacks are registered at boot but act as
                // no-ops until the user explicitly triggers networking via connectNetwork().
                // This avoids 2-5s of Tailscale auth overhead on the boot critical path.
                networkInterface: {
                    authKey: undefined,
                    controlUrl: undefined,
                    loginUrlCb: (url: string) => {
                        if (!networkEnabledRef.current) return;
                        console.log('[HackathOS] Tailscale login URL received:', url);
                        setNetworkLoginUrl(url);
                        setNetworkState('login-ready');
                    },
                    stateUpdateCb: (state: number) => {
                        if (!networkEnabledRef.current) return;
                        if (state === 6) {
                            setNetworkState('connected');
                            setNetworkLoginUrl(null);
                        } else if (state === 2) {
                            setNetworkState('connecting');
                        } else if (state === 1 || state === 4) {
                            setNetworkState('disconnected');
                            setNetworkLoginUrl(null);
                        }
                    },
                    netmapUpdateCb: () => { },
                },
            });
            cxInstance = cx;

            consoleReadFunc = cx.setCustomConsole(
                centralOutputHandler,
                initialCols || 80,
                initialRows || 24,
            );
            consoleAttached = true;

            if (kmsCanvasRef.current) {
                try {
                    (cx as any).setKmsCanvas(kmsCanvasRef.current, 1024, 768);
                } catch (e) {
                    console.warn('KMS canvas setup skipped:', e);
                }
            }

            // OPT: Warm boot skips config steps already persisted in overlay
            const warm = isWarmBoot();
            const bootOpts = { cwd: '/', uid: 0, gid: 0, env: ['HOME=/root', 'TERM=dumb', 'SHELL=/bin/bash'] };

            if (!warm) {
                // OPT: Parallelize DNS config + bashrc setup (independent operations)
                try {
                    await Promise.all([
                        cx.run('/bin/bash', ['-c',
                            'echo "nameserver 100.100.100.100\nnameserver 8.8.8.8\nnameserver 8.8.4.4" > /etc/resolv.conf && echo "deb http://archive.debian.org/debian buster main contrib non-free\ndeb http://archive.debian.org/debian-security buster/updates main contrib non-free" > /etc/apt/sources.list && echo "Acquire::Check-Valid-Until \\"false\\";" > /etc/apt/apt.conf.d/99no-check-valid-until && echo "Acquire::http::Pipeline-Depth \\"0\\";\nAcquire::http::No-Cache=True;\nAcquire::BrokenProxy=\\"true\\";" > /etc/apt/apt.conf.d/99tune'
                        ], bootOpts),
                        cx.run('/bin/bash', ['-c',
                            `echo '${BASHRC_B64}' | base64 -d > /home/user/.bashrc && mkdir -p /home/user/projects && ln -sf /shared /home/user/shared && chown -R 1000:1000 /home/user/.bashrc /home/user/projects`
                        ], bootOpts),
                    ]);
                } catch {
                    // Non-fatal: boot continues even if config fails
                }
                markWarmBoot();
            } else {
                // Warm boot: just ensure projects dir exists (fast)
                try {
                    await cx.run('/bin/bash', ['-c', 'mkdir -p /home/user/projects'], bootOpts);
                } catch { }
            }

            return cx;
        })();

        try {
            const cx = await bootPromise;
            setIsBooted(true);
            return cx;
        } catch (err: any) {
            const msg = err?.message || String(err) || 'Failed to boot Linux VM';
            console.error('CheerpX boot failed:', msg);
            setBootError(msg);
            bootPromise = null;
            throw new Error(msg);
        } finally {
            setIsBooting(false);
        }
    }, []);

    const attachTerminal = useCallback((
        writeFunc: (buf: Uint8Array) => void,
        cols: number,
        rows: number,
    ): TerminalHandle => {
        if (!cxInstance) throw new Error('CheerpX not booted');
        terminalWriteFuncs.add(writeFunc);

        return {
            sendInput: (data: string) => {
                if (!consoleReadFunc) return;
                for (let i = 0; i < data.length; i++) {
                    consoleReadFunc(data.charCodeAt(i));
                }
            },
            resize: (_newCols: number, _newRows: number) => {
            },
            detach: () => {
                terminalWriteFuncs.delete(writeFunc);
            },
        };
    }, []);

    const runShell = useCallback(async () => {
        if (!cxInstance || shellRunning) return;
        shellRunning = true;
        const opts = {
            env: ['HOME=/home/user', 'TERM=xterm', 'USER=user', 'SHELL=/bin/bash', 'EDITOR=vim', 'LANG=en_US.UTF-8', 'LC_ALL=C', 'CFLAGS=-O0', 'CXXFLAGS=-O0', 'DISPLAY=:0'],
            cwd: '/home/user',
            uid: 0,
            gid: 0,
        };
        while (cxInstance) {
            await cxInstance.run('/bin/bash', ['--login'], opts);
        }
    }, []);

    const captureCommand = useCallback(async (command: string): Promise<string> => {
        if (!cxInstance) return '';
        return queueCapture(command);
    }, []);

    // OPT: Batch read multiple files in a single shell command (kills N+1 pattern)
    // Instead of N separate `cat` commands, runs one `find -exec cat` with file delimiters
    const batchReadFiles = useCallback(async (paths: string[]): Promise<Map<string, string>> => {
        if (!cxInstance || paths.length === 0) return new Map();

        // For small batches, fall through to individual reads
        if (paths.length === 1) {
            const content = await queueCapture(`cat ${JSON.stringify(paths[0])} 2>/dev/null`);
            return new Map([[paths[0], content]]);
        }

        // Build a single command that outputs all files with delimiters
        const DELIMITER = '===HACKATHOS_FILE_BOUNDARY===';
        const catParts = paths.map(p => {
            const escaped = p.replace(/'/g, "'\\''");
            return `echo '${DELIMITER}${escaped}${DELIMITER}' && cat '${escaped}' 2>/dev/null`;
        });
        const batchCmd = catParts.join(' && ');

        const rawOutput = await queueCapture(batchCmd);
        const result = new Map<string, string>();

        // Parse the delimited output
        const sections = rawOutput.split(DELIMITER);
        for (let i = 1; i < sections.length - 1; i += 2) {
            const filePath = sections[i];
            const content = (sections[i + 1] || '').replace(/^\n/, '');
            if (filePath && paths.includes(filePath)) {
                result.set(filePath, content);
            }
        }

        return result;
    }, []);

    const listDir = useCallback(async (path: string): Promise<LinuxFileEntry[]> => {
        if (!cxInstance) return [];
        const output = await queueCapture(`ls -la --time-style=+%s ${JSON.stringify(path)} 2>/dev/null`);
        return parseLsOutput(output, path);
    }, []);

    const readFile = useCallback(async (path: string): Promise<string> => {
        if (!cxInstance) return '';
        return queueCapture(`cat ${JSON.stringify(path)} 2>/dev/null`);
    }, []);

    const writeLinuxFile = useCallback(async (path: string, content: string): Promise<void> => {
        if (!cxInstance) return;
        const b64 = btoa(unescape(encodeURIComponent(content)));
        await queueCapture(`mkdir -p "$(dirname '${path}')" && echo '${b64}' | base64 -d > '${path}'`);
    }, []);

    const mkdirLinux = useCallback(async (path: string): Promise<void> => {
        if (!cxInstance) return;
        await queueCapture(`mkdir -p '${path}'`);
    }, []);

    const removeLinux = useCallback(async (path: string): Promise<void> => {
        if (!cxInstance) return;
        await queueCapture(`rm -rf '${path}'`);
    }, []);

    const connectNetwork = useCallback(async () => {
        if (!cxInstance) return;
        if (networkState === 'connected' || networkState === 'connecting') return;

        // OPT: Enable deferred Tailscale callbacks — from this point on,
        // loginUrlCb and stateUpdateCb will propagate state to the UI.
        networkEnabledRef.current = true;

        setNetworkState('connecting');

        setTimeout(() => {
            setNetworkState(prev => prev === 'connecting' ? 'disconnected' : prev);
        }, 30000);

        try {
            cxInstance.networkLogin();
        } catch (err) {
            console.error('[HackathOS] networkLogin error:', err);
            setNetworkState('disconnected');
        }
    }, [networkState]);

    const writeProjectFile = useCallback(async (path: string, content: string) => {
        if (!dataDeviceInstance) return;
        await dataDeviceInstance.writeFile(path, content);
    }, []);

    const startXorg = useCallback(async () => {
        if (!cxInstance || isXorgRunning) return;
        try {
            await queueCapture('which Xorg > /dev/null 2>&1 || apt-get update -qq && apt-get install -y -qq xorg xterm 2>/dev/null');
            setIsXorgRunning(true);
            cxInstance.run('/bin/bash', ['-c', 'Xorg :0 -nolisten tcp 2>/dev/null &'], {
                cwd: '/', uid: 0, gid: 0,
                env: ['HOME=/root', 'TERM=dumb', 'SHELL=/bin/bash', 'DISPLAY=:0'],
            }).catch(() => setIsXorgRunning(false));
            // OPT: Poll for Xorg readiness instead of fixed 2s wait
            const start = Date.now();
            while (Date.now() - start < 5000) {
                await new Promise(r => setTimeout(r, 300));
                try {
                    const check = await queueCapture('xdpyinfo -display :0 >/dev/null 2>&1 && echo "READY"');
                    if (check.includes('READY')) break;
                } catch { }
            }
        } catch (err) {
            console.error('Failed to start Xorg:', err);
            setIsXorgRunning(false);
        }
    }, [isXorgRunning]);

    const launchGuiApp = useCallback(async (command: string) => {
        if (!cxInstance) return;
        if (!isXorgRunning) {
            await startXorg();
        }
        cxInstance.run('/bin/bash', ['-c', `DISPLAY=:0 ${command} &`], {
            cwd: '/home/user', uid: 0, gid: 0,
            env: ['HOME=/home/user', 'TERM=xterm', 'SHELL=/bin/bash', 'DISPLAY=:0', 'USER=user'],
        }).catch((err: any) => console.error('GUI app launch failed:', err));
    }, [isXorgRunning, startXorg]);

    const exportLinuxSnapshot = useCallback(async () => {
        if (!cxInstance) return;
        const archivePath = '/tmp/hackathos-snapshot.tar.gz';
        await queueCapture(
            `tar czf ${archivePath} --exclude=/proc --exclude=/sys --exclude=/dev --exclude=/tmp --exclude=/projects --exclude=/shared / 2>/dev/null || true`
        );

        if (idbDeviceInstance) {
            try {
                const blob = await idbDeviceInstance.readFileAsBlob(archivePath);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `hackathos-snapshot-${Date.now()}.tar.gz`;
                    a.click();
                    URL.revokeObjectURL(url);
                    return;
                }
            } catch {
                // fall through to captureCommand approach
            }
        }

        const b64 = await queueCapture(`base64 ${archivePath} 2>/dev/null`);
        if (b64.trim()) {
            const binary = atob(b64.trim().replace(/\s/g, ''));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'application/gzip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hackathos-snapshot-${Date.now()}.tar.gz`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }, []);

    // OPT: Rewritten snapshot import — writes directly to DataDevice as ArrayBuffer
    // instead of chunking into thousands of base64 shell commands
    const importLinuxSnapshot = useCallback(async (file: File) => {
        if (!cxInstance) return;
        const buffer = await file.arrayBuffer();

        if (dataDeviceInstance) {
            try {
                // Write the entire file to DataDevice in one shot (no shell, no base64)
                const uint8 = new Uint8Array(buffer);
                await dataDeviceInstance.writeFile('/import-snapshot.tar.gz', uint8);
                await queueCapture('tar xzf /projects/import-snapshot.tar.gz -C / 2>/dev/null || true');
                await queueCapture('rm -f /projects/import-snapshot.tar.gz');
                return;
            } catch {
                // Fall through to legacy approach
            }
        }

        // Legacy fallback: larger chunk size (64KB vs 4KB = 16x fewer commands)
        const bytes = new Uint8Array(buffer);
        const chunkSize = 65536;
        await queueCapture('rm -f /tmp/import-snapshot.tar.gz');
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            let binary = '';
            for (let j = 0; j < chunk.length; j++) binary += String.fromCharCode(chunk[j]);
            const b64 = btoa(binary);
            await queueCapture(`echo '${b64}' | base64 -d >> /tmp/import-snapshot.tar.gz`);
        }
        await queueCapture('tar xzf /tmp/import-snapshot.tar.gz -C / 2>/dev/null || true');
        await queueCapture('rm -f /tmp/import-snapshot.tar.gz');
    }, []);

    const compressPath = useCallback(async (sourcePath: string, archivePath: string) => {
        if (!cxInstance) return;
        const ext = archivePath.toLowerCase();
        if (ext.endsWith('.zip')) {
            await queueCapture(`cd "$(dirname '${sourcePath}')" && zip -r '${archivePath}' "$(basename '${sourcePath}')" 2>/dev/null || (apt-get install -y -qq zip 2>/dev/null && zip -r '${archivePath}' "$(basename '${sourcePath}')")`);
        } else {
            await queueCapture(`tar czf '${archivePath}' -C "$(dirname '${sourcePath}')" "$(basename '${sourcePath}')" 2>/dev/null`);
        }
    }, []);

    const extractArchive = useCallback(async (archivePath: string, destPath: string) => {
        if (!cxInstance) return;
        const ext = archivePath.toLowerCase();
        if (ext.endsWith('.zip')) {
            await queueCapture(`unzip -o '${archivePath}' -d '${destPath}' 2>/dev/null || (apt-get install -y -qq unzip 2>/dev/null && unzip -o '${archivePath}' -d '${destPath}')`);
        } else if (ext.endsWith('.tar.gz') || ext.endsWith('.tgz')) {
            await queueCapture(`tar xzf '${archivePath}' -C '${destPath}' 2>/dev/null`);
        } else if (ext.endsWith('.tar.bz2')) {
            await queueCapture(`tar xjf '${archivePath}' -C '${destPath}' 2>/dev/null`);
        } else if (ext.endsWith('.tar')) {
            await queueCapture(`tar xf '${archivePath}' -C '${destPath}' 2>/dev/null`);
        }
    }, []);

    const downloadFile = useCallback(async (path: string) => {
        if (!cxInstance) return;
        const b64 = await queueCapture(`base64 '${path}' 2>/dev/null`);
        if (b64 && b64.trim()) {
            const binary = atob(b64.trim().replace(/\s/g, ''));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = path.split('/').pop() || 'download';
            a.click();
            URL.revokeObjectURL(url);
        }
    }, []);

    const resetEnvironment = useCallback(async () => {
        if (confirm("This will DELETE all your files and reset the Linux environment. Are you sure?")) {
            try {
                localStorage.removeItem(WARM_BOOT_KEY);
                const req = indexedDB.deleteDatabase(IDB_CACHE_ID);
                req.onsuccess = () => {
                    alert("Environment reset. Reloading...");
                    window.location.reload();
                };
            } catch (e) {
                alert("Error resetting environment.");
            }
        }
    }, []);

    return (
        <CheerpXContext.Provider value={{
            isBooted, isBooting, bootError, boot,
            attachTerminal, runShell,
            writeProjectFile, captureCommand, batchReadFiles,
            listDir, readFile, writeLinuxFile, mkdirLinux, removeLinux,
            networkLoginUrl, networkState, connectNetwork,
            kmsCanvasRef, isXorgRunning, startXorg, launchGuiApp,
            exportLinuxSnapshot, importLinuxSnapshot,
            compressPath, extractArchive, downloadFile, resetEnvironment
        }}>
            {children}
            <canvas
                ref={kmsCanvasRef}
                width={1024}
                height={768}
                style={{ display: 'none', position: 'absolute', top: -9999, left: -9999 }}
            />
        </CheerpXContext.Provider>
    );
};
