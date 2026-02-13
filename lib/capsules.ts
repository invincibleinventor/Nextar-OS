/**
 * Environment Capsules — Create, export, import, and verify environment snapshots.
 * A capsule is a portable, verifiable package of an entire lab/project environment.
 */

import type { CapsuleManifest, CapsuleExport, CapsuleFile } from '../types/capsule';
import { computeEnvironmentDNA } from './environmentDNA';

const DB_NAME = 'hackathos-capsules';
const STORE_NAME = 'capsules';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => { req.result.createObjectStore(STORE_NAME, { keyPath: 'id' }); };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** Compress a string using CompressionStream (gzip) */
async function compress(data: string): Promise<string> {
    const blob = new Blob([data]);
    const cs = new CompressionStream('gzip');
    const stream = blob.stream().pipeThrough(cs);
    const buf = await new Response(stream).arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/** Decompress a base64 gzip string */
async function decompress(b64: string): Promise<string> {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Response(stream).text();
}

/** Create a capsule from current project files */
export async function createCapsule(
    name: string,
    description: string,
    files: { path: string; content: string; readonly?: boolean }[],
    options?: Partial<CapsuleManifest>
): Promise<CapsuleManifest> {
    const capsuleFiles: CapsuleFile[] = files.map(f => ({
        path: f.path,
        content: f.content,
        encoding: 'utf8' as const,
        readonly: f.readonly ?? false,
        hidden: f.path.startsWith('.'),
    }));

    const dna = await computeEnvironmentDNA(files.map(f => ({ path: f.path, content: f.content })));

    const manifest: CapsuleManifest = {
        id: `capsule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        description,
        version: '1.0.0',
        author: options?.author || 'anonymous',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        environmentDNA: dna,
        runtime: options?.runtime || {},
        files: capsuleFiles,
        tags: options?.tags,
        difficulty: options?.difficulty,
        ...options,
    };

    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(manifest);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    return manifest;
}

/** Export a capsule as a downloadable blob */
export async function exportCapsule(capsuleId: string): Promise<Blob> {
    const db = await openDB();
    const manifest = await new Promise<CapsuleManifest>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(capsuleId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    if (!manifest) throw new Error(`Capsule ${capsuleId} not found`);

    const payload = await compress(JSON.stringify(manifest.files));
    const capsuleExport: CapsuleExport = {
        magic: 'HACKOS_CAPSULE_V1',
        manifest: { ...manifest, files: [] }, // files are in payload
        payload,
    };

    return new Blob([JSON.stringify(capsuleExport)], { type: 'application/json' });
}

/** Import a capsule from a file */
export async function importCapsule(file: File): Promise<CapsuleManifest> {
    const text = await file.text();
    const data: CapsuleExport = JSON.parse(text);
    if (data.magic !== 'HACKOS_CAPSULE_V1') throw new Error('Invalid capsule file');

    const filesJson = await decompress(data.payload);
    const files: CapsuleFile[] = JSON.parse(filesJson);

    const manifest: CapsuleManifest = { ...data.manifest, files };

    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(manifest);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    return manifest;
}

/** List all stored capsules */
export async function listCapsules(): Promise<CapsuleManifest[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** Delete a capsule */
export async function deleteCapsule(id: string): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/** Verify a capsule's integrity by recomputing DNA */
export async function verifyCapsule(manifest: CapsuleManifest): Promise<boolean> {
    const files = manifest.files.map(f => ({ path: f.path, content: f.content }));
    const currentDNA = await computeEnvironmentDNA(files);
    return currentDNA === manifest.environmentDNA;
}
