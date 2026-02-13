export type RuntimeId = 'cheerpx' | 'pyodide' | 'webcontainer' | 'piston' | 'isomorphic-git';

export type RuntimeStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface RuntimeCapability {
    id: RuntimeId;
    name: string;
    status: RuntimeStatus;
    languages: string[];
    supportsFileSystem: boolean;
    supportsTerminal: boolean;
    supportsNetwork: boolean;
    bootTimeEstimateMs: number;
}

export interface ExecutionRequest {
    language: string;
    code: string;
    files?: Record<string, string>;
    stdin?: string;
    timeout?: number;
    preferredRuntime?: RuntimeId;
}

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    runtime: RuntimeId;
    durationMs: number;
}

export interface GitCloneOptions {
    url: string;
    dir: string;
    depth?: number;
    singleBranch?: boolean;
    branch?: string;
    corsProxy?: string;
    onProgress?: (progress: { phase: string; loaded: number; total: number }) => void;
}

export interface GitCommitOptions {
    dir: string;
    message: string;
    author: { name: string; email: string };
}

export interface GitPushOptions {
    dir: string;
    token?: string;
    remote?: string;
    branch?: string;
}

export interface GitStatusEntry {
    filepath: string;
    headStatus: number;
    workdirStatus: number;
    stageStatus: number;
}

export interface GitLogEntry {
    oid: string;
    message: string;
    author: { name: string; email: string; timestamp: number };
}
