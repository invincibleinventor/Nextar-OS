/**
 * Environment DNA — Cryptographic hash of environment state for tamper detection.
 * SHA-256 hash of sorted file paths + contents + installed packages.
 */

/** Compute SHA-256 hash of a string using Web Crypto API */
async function sha256(data: string): Promise<string> {
    const buf = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface FileFingerprint {
    path: string;
    content: string;
}

/**
 * Compute environment DNA from file list.
 * Deterministic: same files in any order produce the same hash.
 */
export async function computeEnvironmentDNA(files: FileFingerprint[]): Promise<string> {
    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
    const payload = sorted.map(f => `${f.path}:${f.content.length}:${f.content}`).join('\n---FILE-BOUNDARY---\n');
    return sha256(payload);
}

/**
 * Compute DNA including installed packages list.
 */
export async function computeFullDNA(
    files: FileFingerprint[],
    packages?: string[]
): Promise<string> {
    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
    const filePart = sorted.map(f => `${f.path}:${f.content.length}:${f.content}`).join('\n---FILE-BOUNDARY---\n');
    const pkgPart = packages ? '\n---PACKAGES---\n' + [...packages].sort().join('\n') : '';
    return sha256(filePart + pkgPart);
}

/**
 * Compare two DNA hashes and report if environment was modified.
 */
export function isDNAMatch(original: string, current: string): boolean {
    return original === current;
}

/**
 * Diff two file lists to find what changed.
 */
export function diffFiles(
    original: FileFingerprint[],
    current: FileFingerprint[]
): { added: string[]; removed: string[]; modified: string[] } {
    const origMap = new Map(original.map(f => [f.path, f.content]));
    const currMap = new Map(current.map(f => [f.path, f.content]));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    for (const [path, content] of currMap) {
        if (!origMap.has(path)) added.push(path);
        else if (origMap.get(path) !== content) modified.push(path);
    }
    for (const path of origMap.keys()) {
        if (!currMap.has(path)) removed.push(path);
    }

    return { added, removed, modified };
}
