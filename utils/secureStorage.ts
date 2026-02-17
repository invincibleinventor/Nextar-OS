const DB_NAME = 'nextaros-secure';
const STORE_NAME = 'secrets';
const DB_VERSION = 1;

const DEVICE_KEY_NAME = 'nextaros-device-key';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
    const existing = await getFromIDB(DEVICE_KEY_NAME);
    if (existing) {
        return crypto.subtle.importKey(
            'raw',
            existing.buffer as ArrayBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const exported = await crypto.subtle.exportKey('raw', key);
    await putToIDB(DEVICE_KEY_NAME, new Uint8Array(exported));

    return crypto.subtle.importKey(
        'raw',
        exported,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

function getFromIDB(key: string): Promise<Uint8Array | null> {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result ?? null);
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
}

function putToIDB(key: string, value: Uint8Array): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
}

function deleteFromIDB(key: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
}

export async function encryptAndStore(key: string, plaintext: string): Promise<void> {
    const deviceKey = await getOrCreateDeviceKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        deviceKey,
        encoder.encode(plaintext)
    );
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    await putToIDB(key, combined);
}

export async function retrieveAndDecrypt(key: string): Promise<string | null> {
    const combined = await getFromIDB(key);
    if (!combined) return null;

    const deviceKey = await getOrCreateDeviceKey();
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            deviceKey,
            ciphertext
        );
        return new TextDecoder().decode(decrypted);
    } catch {
        return null;
    }
}

export async function deleteSecret(key: string): Promise<void> {
    await deleteFromIDB(key);
}

export async function hasSecret(key: string): Promise<boolean> {
    const val = await getFromIDB(key);
    return val !== null;
}
