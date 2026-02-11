'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// --- Types ---
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
    listDir: (path: string) => Promise<LinuxFileEntry[]>;
    readFile: (path: string) => Promise<string>;
    writeLinuxFile: (path: string, content: string) => Promise<void>;
    mkdirLinux: (path: string) => Promise<void>;
    removeLinux: (path: string) => Promise<void>;
    networkLoginUrl: string | null;
    networkState: 'disconnected' | 'connecting' | 'login-ready' | 'connected';
    connectNetwork: () => Promise<void>;
}

const CheerpXContext = createContext<CheerpXContextType | undefined>(undefined);

export const useCheerpX = () => {
    const ctx = useContext(CheerpXContext);
    if (!ctx) throw new Error('useCheerpX must be used within CheerpXProvider');
    return ctx;
};

// --- Config ---
const DISK_IMAGE_URL = 'wss://disks.webvm.io/debian_large_20230522_5044875331_2.ext2';
const IDB_CACHE_ID = 'hackathos-cx';

const BASHRC = `# HackathOS Shell
export PS1='\\[\\e[1;32m\\]user\\[\\e[0m\\]@\\[\\e[1;36m\\]hackathos\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]$ '
export EDITOR=vim
export LANG=en_US.UTF-8

alias ll='ls -la --color=auto'
alias la='ls -A --color=auto'
alias ls='ls --color=auto'
alias cls='clear'
alias ..='cd ..'
alias ...='cd ../..'

# Project files synced from the editor
alias proj='cd ~/projects'

echo -e "\\e[36m  HackathOS Linux Environment\\e[0m"
echo -e "\\e[90m  Full Debian Linux in your browser. apt, pip, gcc, python — everything works.\\e[0m"
echo -e "\\e[90m  Project files are at ~/projects\\e[0m"
echo ""
`;

// --- Module-level singleton state ---
let cxInstance: any = null;
let dataDeviceInstance: any = null;
let bootPromise: Promise<any> | null = null;

// Console management — CheerpX only supports ONE console, so we singleton it
// and broadcast output to all attached terminal instances.
let consoleReadFunc: any = null;
let consoleAttached = false;
let shellRunning = false;
const terminalWriteFuncs = new Set<(buf: Uint8Array) => void>();
let isCapturing = false;
let captureBuffer = '';

// Capture queue (serialized to prevent interleaving)
const captureQueue: Array<{ command: string; resolve: (r: string) => void; reject: (e: Error) => void }> = [];
let processingCapture = false;

function centralOutputHandler(buf: Uint8Array) {
    if (isCapturing) {
        captureBuffer += new TextDecoder().decode(buf);
    } else {
        for (const fn of terminalWriteFuncs) {
            fn(buf);
        }
    }
}

async function processQueue() {
    if (processingCapture || !cxInstance) return;
    processingCapture = true;
    while (captureQueue.length > 0) {
        const { command, resolve, reject } = captureQueue.shift()!;
        isCapturing = true;
        captureBuffer = '';
        try {
            await cxInstance.run('/bin/bash', ['-c', command], {
                cwd: '/', uid: 0, gid: 0,
                env: ['HOME=/root', 'TERM=dumb', 'SHELL=/bin/bash', 'LC_ALL=C'],
            });
            isCapturing = false;
            resolve(captureBuffer);
        } catch (err: any) {
            isCapturing = false;
            reject(err);
        }
        captureBuffer = '';
    }
    processingCapture = false;
}

function queueCapture(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        captureQueue.push({ command, resolve, reject });
        processQueue();
    });
}

// Parse `ls -la --time-style=+%s` output
function parseLsOutput(output: string, dirPath: string): LinuxFileEntry[] {
    const lines = output.trim().split('\n');
    const entries: LinuxFileEntry[] = [];
    for (const line of lines) {
        if (!line || line.startsWith('total ')) continue;
        const match = line.match(
            /^([dlcbsp-][rwxstST-]{9})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\d+)\s+(.+)$/
        );
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

// --- Provider ---
export const CheerpXProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isBooted, setIsBooted] = useState(!!cxInstance);
    const [isBooting, setIsBooting] = useState(false);
    const [bootError, setBootError] = useState<string | null>(null);
    const [networkLoginUrl, setNetworkLoginUrl] = useState<string | null>(null);
    const [networkState, setNetworkState] = useState<'disconnected' | 'connecting' | 'login-ready' | 'connected'>('disconnected');

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

            const mounts: any[] = [
                { type: 'ext2', dev: overlayDevice, path: '/' },
                { type: 'dir', dev: dataDevice, path: '/projects' },
                { type: 'devs', path: '/dev' },
                { type: 'devpts', path: '/dev/pts' },
                { type: 'proc', path: '/proc' },
                { type: 'sys', path: '/sys' },
            ];

            const cx = await CheerpX.Linux.create({
                mounts,
                networkInterface: {
                    authKey: undefined,
                    controlUrl: undefined,
                    loginUrlCb: (url: string) => {
                        console.log('[HackathOS] Tailscale login URL received:', url);
                        setNetworkLoginUrl(url);
                        setNetworkState('login-ready');
                    },
                    stateUpdateCb: (state: number) => {
                        console.log('[HackathOS] Tailscale state:', state);
                        if (state === 6) {
                            setNetworkState('connected');
                            setNetworkLoginUrl(null);
                        }
                    },
                    netmapUpdateCb: (map: any) => {
                        console.log('[HackathOS] Tailscale netmap:', map?.self?.addresses?.[0]);
                    },
                },
            });
            cxInstance = cx;

            // Set up console ONCE with correct terminal dimensions.
            // Calling setCustomConsole multiple times corrupts running processes.
            consoleReadFunc = cx.setCustomConsole(
                centralOutputHandler,
                initialCols || 80,
                initialRows || 24,
            );
            consoleAttached = true;

            // Write custom .bashrc and create projects dir — non-fatal if it fails
            try {
                const b64 = btoa(unescape(encodeURIComponent(BASHRC)));
                await cx.run('/bin/bash', ['-c',
                    `echo '${b64}' | base64 -d > /home/user/.bashrc && mkdir -p /home/user/projects && chown -R 1000:1000 /home/user/.bashrc /home/user/projects`
                ], { cwd: '/', uid: 0, gid: 0, env: ['HOME=/root', 'TERM=dumb', 'SHELL=/bin/bash'] });
            } catch (e) {
                console.warn('CheerpX .bashrc setup skipped:', e);
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
            resize: (newCols: number, newRows: number) => {
                if (!consoleReadFunc) return;
                (consoleReadFunc as any)(newCols, newRows);
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
            env: ['HOME=/home/user', 'TERM=xterm', 'USER=user', 'SHELL=/bin/bash', 'EDITOR=vim', 'LANG=en_US.UTF-8', 'LC_ALL=C'],
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
        setNetworkState('connecting');
        console.log('[HackathOS] Calling cx.networkLogin()...');
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

    return (
        <CheerpXContext.Provider value={{
            isBooted, isBooting, bootError, boot,
            attachTerminal, runShell,
            writeProjectFile, captureCommand,
            listDir, readFile, writeLinuxFile, mkdirLinux, removeLinux,
            networkLoginUrl, networkState, connectNetwork,
        }}>
            {children}
        </CheerpXContext.Provider>
    );
};
