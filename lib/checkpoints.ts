/**
 * Micro-Checkpoints (Coding DVR) — Delta-compressed environment snapshots
 * stored in IndexedDB. Enables rewind to any point in a coding session.
 */

export interface Checkpoint {
    id: string;
    sessionId: string;
    timestamp: number;
    /** Delta from previous checkpoint (or full snapshot if first) */
    deltas: FileDelta[];
    /** Metadata */
    label?: string;
}

export interface FileDelta {
    path: string;
    type: 'add' | 'modify' | 'delete';
    /** Content for add/modify (omitted for delete) */
    content?: string;
    /** Previous content hash for verification */
    prevHash?: string;
}

interface FileState {
    path: string;
    content: string;
    hash: string;
}

const DB_NAME = 'hackathos-checkpoints';
const STORE_NAME = 'checkpoints';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('sessionId', 'sessionId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function quickHash(content: string): Promise<string> {
    const buf = new TextEncoder().encode(content);
    const hash = await crypto.subtle.digest('SHA-1', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export class CheckpointManager {
    private sessionId: string;
    private previousState = new Map<string, FileState>();
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private getFiles: () => Promise<{ path: string; content: string }[]>;

    constructor(sessionId: string, getFiles: () => Promise<{ path: string; content: string }[]>) {
        this.sessionId = sessionId;
        this.getFiles = getFiles;
    }

    /** Start auto-checkpointing every N seconds */
    startAutoCheckpoint(intervalSeconds = 30) {
        this.stopAutoCheckpoint();
        this.intervalId = setInterval(() => this.createCheckpoint(), intervalSeconds * 1000);
    }

    stopAutoCheckpoint() {
        if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    }

    /** Create a checkpoint by diffing current state against previous */
    async createCheckpoint(label?: string): Promise<Checkpoint> {
        const files = await this.getFiles();
        const currentState = new Map<string, FileState>();
        const deltas: FileDelta[] = [];

        for (const f of files) {
            const hash = await quickHash(f.content);
            currentState.set(f.path, { path: f.path, content: f.content, hash });
            const prev = this.previousState.get(f.path);
            if (!prev) {
                deltas.push({ path: f.path, type: 'add', content: f.content });
            } else if (prev.hash !== hash) {
                deltas.push({ path: f.path, type: 'modify', content: f.content, prevHash: prev.hash });
            }
        }

        for (const [path] of this.previousState) {
            if (!currentState.has(path)) {
                deltas.push({ path, type: 'delete' });
            }
        }

        const checkpoint: Checkpoint = {
            id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            deltas,
            label,
        };

        // Save to IDB
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(checkpoint);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        this.previousState = currentState;
        return checkpoint;
    }

    /** Get all checkpoints for this session */
    async getCheckpoints(): Promise<Checkpoint[]> {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const idx = tx.objectStore(STORE_NAME).index('sessionId');
            const req = idx.getAll(this.sessionId);
            req.onsuccess = () => resolve((req.result as Checkpoint[]).sort((a, b) => a.timestamp - b.timestamp));
            req.onerror = () => reject(req.error);
        });
    }

    /** Reconstruct file state at a given checkpoint by replaying deltas */
    async reconstructAtCheckpoint(targetId: string): Promise<Map<string, string>> {
        const checkpoints = await this.getCheckpoints();
        const state = new Map<string, string>();

        for (const cp of checkpoints) {
            for (const delta of cp.deltas) {
                if (delta.type === 'delete') {
                    state.delete(delta.path);
                } else if (delta.content !== undefined) {
                    state.set(delta.path, delta.content);
                }
            }
            if (cp.id === targetId) break;
        }

        return state;
    }

    /** Purge old checkpoints, keeping only the last N */
    async purge(keepLast: number): Promise<void> {
        const checkpoints = await this.getCheckpoints();
        if (checkpoints.length <= keepLast) return;
        const toDelete = checkpoints.slice(0, checkpoints.length - keepLast);
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const cp of toDelete) store.delete(cp.id);
        await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    }

    destroy() { this.stopAutoCheckpoint(); }
}
