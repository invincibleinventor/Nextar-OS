import { filesystemitem } from '../components/data';
import { User, getAllFiles, getUsers } from './db';
import { PermissionGrant } from '../types/permissions';

const SNAPSHOT_VERSION = '1.0.0';

export interface OSSnapshot {
    version: string
    timestamp: number
    users: User[]
    filesystem: filesystemitem[]
    permissions: PermissionGrant[]
    installedApps: string[]
    settings: Record<string, any>
    windowLayout?: any[]
}

const getPermissionsFromDB = async (): Promise<PermissionGrant[]> => {
    return new Promise((resolve) => {
        const request = indexedDB.open('MacOSSystem', 6);

        request.onerror = () => resolve([]);

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains('permissions')) {
                resolve([]);
                return;
            }

            const transaction = db.transaction(['permissions'], 'readonly');
            const store = transaction.objectStore('permissions');
            const getRequest = store.getAll();

            getRequest.onsuccess = () => resolve(getRequest.result || []);
            getRequest.onerror = () => resolve([]);
        };
    });
};

const getSettingsFromStorage = (): Record<string, any> => {
    try {
        const settings = localStorage.getItem('nextaros-settings');
        return settings ? JSON.parse(settings) : {};
    } catch {
        return {};
    }
};

const getInstalledAppsFromStorage = (): string[] => {
    try {
        const cache = localStorage.getItem('nextaros-apps-cache');
        if (!cache) return [];
        const parsed = JSON.parse(cache);
        return (parsed.apps || []).filter((app: any) => app.installed).map((app: any) => app.id);
    } catch {
        return [];
    }
};

export async function exportSnapshot(): Promise<Blob> {
    const [users, filesystem, permissions] = await Promise.all([
        getUsers().catch(() => []),
        getAllFiles().catch(() => []),
        getPermissionsFromDB()
    ]);

    const snapshot: OSSnapshot = {
        version: SNAPSHOT_VERSION,
        timestamp: Date.now(),
        users: users.map(u => ({ ...u, passwordHash: u.passwordHash })),
        filesystem: filesystem.map(f => ({
            ...f,
            icon: typeof f.icon === 'string' ? f.icon : undefined
        })),
        permissions,
        installedApps: getInstalledAppsFromStorage(),
        settings: getSettingsFromStorage()
    };

    const json = JSON.stringify(snapshot, null, 2);
    return new Blob([json], { type: 'application/json' });
}

export function validateSnapshot(data: any): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid snapshot format' };
    }

    if (!data.version) {
        return { valid: false, error: 'Missing version field' };
    }

    if (!data.timestamp || typeof data.timestamp !== 'number') {
        return { valid: false, error: 'Invalid timestamp' };
    }

    if (!Array.isArray(data.filesystem)) {
        return { valid: false, error: 'Invalid filesystem data' };
    }

    return { valid: true };
}

const restoreFilesystemToDB = async (files: filesystemitem[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MacOSSystem', 6);

        request.onerror = () => reject('Failed to open database');

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');

            store.clear();

            files.forEach(file => {
                store.put(file);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject('Failed to restore filesystem');
        };
    });
};

const restoreUsersToDB = async (users: User[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MacOSSystem', 6);

        request.onerror = () => reject('Failed to open database');

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');

            store.clear();

            users.forEach(user => {
                store.put(user);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject('Failed to restore users');
        };
    });
};

const restorePermissionsToDB = async (permissions: PermissionGrant[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MacOSSystem', 6);

        request.onerror = () => reject('Failed to open database');

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains('permissions')) {
                resolve();
                return;
            }

            const transaction = db.transaction(['permissions'], 'readwrite');
            const store = transaction.objectStore('permissions');

            store.clear();

            permissions.forEach(perm => {
                store.put(perm);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject('Failed to restore permissions');
        };
    });
};

export async function importSnapshot(blob: Blob): Promise<{ success: boolean; error?: string }> {
    try {
        const text = await blob.text();
        const data = JSON.parse(text);

        const validation = validateSnapshot(data);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const snapshot = data as OSSnapshot;

        await Promise.all([
            restoreFilesystemToDB(snapshot.filesystem),
            restoreUsersToDB(snapshot.users),
            restorePermissionsToDB(snapshot.permissions)
        ]);

        if (snapshot.settings) {
            localStorage.setItem('nextaros-settings', JSON.stringify(snapshot.settings));
        }

        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Import failed' };
    }
}

export function downloadSnapshot(blob: Blob, filename?: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `nextaros-snapshot-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
