'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
    RuntimeId, RuntimeStatus, RuntimeCapability,
    ExecutionRequest, ExecutionResult,
    GitCloneOptions, GitCommitOptions, GitPushOptions,
    GitStatusEntry, GitLogEntry,
} from '../types/runtime';
import { api } from '../utils/constants';

// Lazy-loaded runtime modules (not imported at build time)
type PyodideModule = typeof import('../lib/runtimes/pyodide');
type GitModule = typeof import('../lib/runtimes/git');
type WebContainerModule = typeof import('../lib/runtimes/webcontainer');

const pistonRuntimes: Record<string, { language: string; version: string }> = {
    'python': { language: 'python', version: '3.10.0' },
    'javascript': { language: 'javascript', version: '18.15.0' },
    'typescript': { language: 'typescript', version: '5.0.3' },
    'go': { language: 'go', version: '1.16.2' },
    'rust': { language: 'rust', version: '1.68.2' },
    'shell': { language: 'bash', version: '5.2.0' },
    'c': { language: 'c', version: '10.2.0' },
    'cpp': { language: 'c++', version: '10.2.0' },
    'java': { language: 'java', version: '15.0.2' },
    'ruby': { language: 'ruby', version: '3.0.1' },
    'php': { language: 'php', version: '8.2.3' },
};

interface RuntimeContextType {
    // Runtime status
    runtimes: Map<RuntimeId, RuntimeCapability>;
    getStatus: (id: RuntimeId) => RuntimeStatus;

    // Universal execution
    execute: (request: ExecutionRequest) => Promise<ExecutionResult>;
    resolveRuntime: (language: string) => RuntimeId;

    // Git operations (via isomorphic-git)
    git: {
        clone: (options: GitCloneOptions) => Promise<void>;
        commit: (options: GitCommitOptions) => Promise<string>;
        push: (options: GitPushOptions) => Promise<void>;
        pull: (dir: string, token?: string) => Promise<void>;
        status: (dir: string) => Promise<GitStatusEntry[]>;
        log: (dir: string, depth?: number) => Promise<GitLogEntry[]>;
        init: (dir: string) => Promise<void>;
        currentBranch: (dir: string) => Promise<string | undefined>;
        listBranches: (dir: string) => Promise<string[]>;
        checkout: (dir: string, branch: string) => Promise<void>;
    };

    // Python (via Pyodide)
    python: {
        run: (code: string, stdin?: string) => Promise<ExecutionResult>;
        installPackage: (name: string) => Promise<void>;
        isReady: boolean;
        boot: () => Promise<void>;
    };

    // Node.js (via WebContainers)
    node: {
        mountFiles: (files: Record<string, string>) => Promise<void>;
        run: (command: string, args?: string[]) => Promise<ExecutionResult>;
        installDeps: (onOutput?: (data: string) => void) => Promise<number>;
        startDevServer: (cmd?: string, args?: string[]) => Promise<{ url: string; port: number }>;
        isReady: boolean;
        boot: () => Promise<void>;
    };
}

const RuntimeContext = createContext<RuntimeContextType | undefined>(undefined);

export const useRuntime = () => {
    const ctx = useContext(RuntimeContext);
    if (!ctx) throw new Error('useRuntime must be used within RuntimeProvider');
    return ctx;
};

export const useRuntimeSafe = () => {
    return useContext(RuntimeContext);
};

export const RuntimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pyodideStatus, setPyodideStatus] = useState<RuntimeStatus>('idle');
    const [gitStatus, setGitStatus] = useState<RuntimeStatus>('ready'); // isomorphic-git is always ready (no boot)
    const [wcStatus, setWcStatus] = useState<RuntimeStatus>('idle');

    // Lazy module refs
    const pyodideModRef = useRef<PyodideModule | null>(null);
    const gitModRef = useRef<GitModule | null>(null);
    const wcModRef = useRef<WebContainerModule | null>(null);

    // Lazy load git module immediately (it's lightweight)
    useEffect(() => {
        import('../lib/runtimes/git').then(mod => { gitModRef.current = mod; });
    }, []);

    const loadPyodide = useCallback(async () => {
        if (pyodideModRef.current) return pyodideModRef.current;
        setPyodideStatus('loading');
        try {
            const mod = await import('../lib/runtimes/pyodide');
            pyodideModRef.current = mod;
            await mod.bootPyodide();
            setPyodideStatus('ready');
            return mod;
        } catch {
            setPyodideStatus('error');
            throw new Error('Failed to load Pyodide');
        }
    }, []);

    const loadWebContainer = useCallback(async () => {
        if (wcModRef.current) return wcModRef.current;
        setWcStatus('loading');
        try {
            const mod = await import('../lib/runtimes/webcontainer');
            wcModRef.current = mod;
            await mod.bootWebContainer();
            setWcStatus('ready');
            return mod;
        } catch {
            setWcStatus('error');
            throw new Error('Failed to load WebContainers');
        }
    }, []);

    const loadGit = useCallback(async () => {
        if (gitModRef.current) return gitModRef.current;
        const mod = await import('../lib/runtimes/git');
        gitModRef.current = mod;
        return mod;
    }, []);

    // Smart runtime resolution — picks the fastest available runtime for a language
    const resolveRuntime = useCallback((language: string): RuntimeId => {
        const lang = language.toLowerCase();

        // Python → Pyodide first
        if (lang === 'python') {
            if (pyodideStatus === 'ready') return 'pyodide';
            if (pistonRuntimes[lang]) return 'piston';
            return 'cheerpx';
        }

        // JavaScript/TypeScript/Node → WebContainers first
        if (['javascript', 'typescript', 'node'].includes(lang)) {
            if (wcStatus === 'ready') return 'webcontainer';
            if (pistonRuntimes[lang]) return 'piston';
            return 'cheerpx';
        }

        // Everything else → Piston first, CheerpX fallback
        if (pistonRuntimes[lang]) return 'piston';
        return 'cheerpx';
    }, [pyodideStatus, wcStatus]);

    // Execute code through the best available runtime
    const execute = useCallback(async (request: ExecutionRequest): Promise<ExecutionResult> => {
        const runtime = request.preferredRuntime || resolveRuntime(request.language);
        const startTime = performance.now();

        try {
            switch (runtime) {
                case 'pyodide': {
                    const mod = await loadPyodide();
                    // Write companion files to Pyodide's virtual FS so imports work
                    if (request.files && Object.keys(request.files).length > 0) {
                        const pyodide = await mod.bootPyodide();
                        for (const [name, content] of Object.entries(request.files)) {
                            pyodide.FS.writeFile(`/home/pyodide/${name}`, content);
                        }
                    }
                    return mod.runPython(request.code, request.stdin);
                }

                case 'webcontainer': {
                    const mod = await loadWebContainer();
                    // Write companion files first
                    if (request.files) {
                        for (const [name, content] of Object.entries(request.files)) {
                            await mod.writeFile(name, content);
                        }
                    }
                    // Write main file and execute
                    const ext = request.language === 'typescript' ? 'ts' : 'js';
                    const filename = `__run.${ext}`;
                    await mod.writeFile(filename, request.code);
                    if (request.language === 'typescript') {
                        return mod.runNodeCommand('npx', ['tsx', filename]);
                    }
                    return mod.runNodeCommand('node', [filename]);
                }

                case 'piston': {
                    const pistonConfig = pistonRuntimes[request.language.toLowerCase()];
                    if (!pistonConfig) {
                        return {
                            stdout: '', stderr: `Language "${request.language}" not supported by Piston`,
                            exitCode: 1, runtime: 'piston', durationMs: performance.now() - startTime,
                        };
                    }

                    // Build files array: main file first, then companions
                    const pistonFiles: { name?: string; content: string }[] = [{ content: request.code }];
                    if (request.files) {
                        for (const [name, content] of Object.entries(request.files)) {
                            pistonFiles.push({ name, content });
                        }
                    }

                    const response = await fetch(api.pistonExecuteUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            language: pistonConfig.language,
                            version: pistonConfig.version,
                            files: pistonFiles,
                            stdin: request.stdin,
                        }),
                    });
                    const data = await response.json();
                    return {
                        stdout: data.run?.stdout || data.run?.output || '',
                        stderr: data.run?.stderr || '',
                        exitCode: data.run?.code ?? 1,
                        runtime: 'piston',
                        durationMs: performance.now() - startTime,
                    };
                }

                default:
                    return {
                        stdout: '', stderr: `Runtime "${runtime}" not available for direct execution`,
                        exitCode: 1, runtime, durationMs: performance.now() - startTime,
                    };
            }
        } catch (err: any) {
            return {
                stdout: '', stderr: err.message || 'Execution failed',
                exitCode: 1, runtime, durationMs: performance.now() - startTime,
            };
        }
    }, [resolveRuntime, loadPyodide, loadWebContainer]);

    // Build capabilities map
    const runtimes = new Map<RuntimeId, RuntimeCapability>([
        ['pyodide', {
            id: 'pyodide', name: 'Pyodide (Python)', status: pyodideStatus,
            languages: ['python'], supportsFileSystem: false,
            supportsTerminal: false, supportsNetwork: false, bootTimeEstimateMs: 3000,
        }],
        ['isomorphic-git', {
            id: 'isomorphic-git', name: 'Git (Browser)', status: gitStatus,
            languages: [], supportsFileSystem: true,
            supportsTerminal: false, supportsNetwork: true, bootTimeEstimateMs: 0,
        }],
        ['webcontainer', {
            id: 'webcontainer', name: 'WebContainers (Node.js)', status: wcStatus,
            languages: ['javascript', 'typescript'], supportsFileSystem: true,
            supportsTerminal: true, supportsNetwork: true, bootTimeEstimateMs: 1000,
        }],
        ['piston', {
            id: 'piston', name: 'Piston API (Remote)', status: 'ready',
            languages: Object.keys(pistonRuntimes), supportsFileSystem: false,
            supportsTerminal: false, supportsNetwork: true, bootTimeEstimateMs: 0,
        }],
    ]);

    const getStatus = useCallback((id: RuntimeId): RuntimeStatus => {
        return runtimes.get(id)?.status || 'idle';
    }, [pyodideStatus, gitStatus, wcStatus]);

    // Git operations
    const gitOps = {
        clone: async (options: GitCloneOptions) => { const mod = await loadGit(); await mod.gitClone(options); },
        commit: async (options: GitCommitOptions) => { const mod = await loadGit(); return mod.gitCommit(options); },
        push: async (options: GitPushOptions) => { const mod = await loadGit(); await mod.gitPush(options); },
        pull: async (dir: string, token?: string) => { const mod = await loadGit(); await mod.gitPull(dir, token); },
        status: async (dir: string) => { const mod = await loadGit(); return mod.gitStatus(dir); },
        log: async (dir: string, depth?: number) => { const mod = await loadGit(); return mod.gitLog(dir, depth); },
        init: async (dir: string) => { const mod = await loadGit(); await mod.gitInit(dir); },
        currentBranch: async (dir: string) => { const mod = await loadGit(); return mod.gitCurrentBranch(dir); },
        listBranches: async (dir: string) => { const mod = await loadGit(); return mod.gitListBranches(dir); },
        checkout: async (dir: string, branch: string) => { const mod = await loadGit(); await mod.gitCheckout(dir, branch); },
    };

    // Python operations
    const pythonOps = {
        run: async (code: string, stdin?: string) => { const mod = await loadPyodide(); return mod.runPython(code, stdin); },
        installPackage: async (name: string) => { const mod = await loadPyodide(); await mod.installPyPackage(name); },
        isReady: pyodideStatus === 'ready',
        boot: async () => { await loadPyodide(); },
    };

    // Node operations
    const nodeOps = {
        mountFiles: async (files: Record<string, string>) => { const mod = await loadWebContainer(); await mod.mountFiles(files); },
        run: async (command: string, args?: string[]) => { const mod = await loadWebContainer(); return mod.runNodeCommand(command, args); },
        installDeps: async (onOutput?: (data: string) => void) => { const mod = await loadWebContainer(); return mod.installDependencies(onOutput); },
        startDevServer: async (cmd?: string, args?: string[]) => { const mod = await loadWebContainer(); return mod.startDevServer(cmd, args); },
        isReady: wcStatus === 'ready',
        boot: async () => { await loadWebContainer(); },
    };

    return (
        <RuntimeContext.Provider value={{
            runtimes, getStatus, execute, resolveRuntime,
            git: gitOps, python: pythonOps, node: nodeOps,
        }}>
            {children}
        </RuntimeContext.Provider>
    );
};
