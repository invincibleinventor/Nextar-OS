import { Project, ProjectFile, Snapshot } from '../types/project';

const DB_NAME = 'HackathonWorkspace';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const PROJECT_FILES_STORE = 'projectFiles';
const SNAPSHOTS_STORE = 'snapshots';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject('IndexedDB not available');
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject('Error opening HackathonWorkspace DB');

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains(PROJECT_FILES_STORE)) {
                const fileStore = db.createObjectStore(PROJECT_FILES_STORE, { keyPath: 'id' });
                fileStore.createIndex('byProject', 'projectId');
                fileStore.createIndex('byPath', ['projectId', 'path']);
            }

            if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
                const snapStore = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
                snapStore.createIndex('byProject', 'projectId');
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };
    });
};

// --- Projects ---

export const getAllProjects = (): Promise<Project[]> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([PROJECTS_STORE], 'readonly');
            const store = tx.objectStore(PROJECTS_STORE);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result as Project[]);
            req.onerror = () => reject('Error getting projects');
        });
    });
};

export const getProject = (id: string): Promise<Project | undefined> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([PROJECTS_STORE], 'readonly');
            const store = tx.objectStore(PROJECTS_STORE);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject('Error getting project');
        });
    });
};

export const saveProject = (project: Project): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([PROJECTS_STORE], 'readwrite');
            const store = tx.objectStore(PROJECTS_STORE);
            const req = store.put(project);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error saving project');
        });
    });
};

export const deleteProject = (id: string): Promise<void> => {
    return openDB().then(async db => {
        // Delete all project files first
        const files = await getProjectFiles(id);
        const snapshots = await getProjectSnapshots(id);

        return new Promise((resolve, reject) => {
            const tx = db.transaction([PROJECTS_STORE, PROJECT_FILES_STORE, SNAPSHOTS_STORE], 'readwrite');
            const projectStore = tx.objectStore(PROJECTS_STORE);
            const fileStore = tx.objectStore(PROJECT_FILES_STORE);
            const snapStore = tx.objectStore(SNAPSHOTS_STORE);

            projectStore.delete(id);
            files.forEach(f => fileStore.delete(f.id));
            snapshots.forEach(s => snapStore.delete(s.id));

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject('Error deleting project');
        });
    });
};

// --- Project Files ---

export const getProjectFiles = (projectId: string): Promise<ProjectFile[]> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([PROJECT_FILES_STORE], 'readonly');
            const store = tx.objectStore(PROJECT_FILES_STORE);
            const index = store.index('byProject');
            const req = index.getAll(projectId);
            req.onsuccess = () => resolve(req.result as ProjectFile[]);
            req.onerror = () => reject('Error getting project files');
        });
    });
};

export const saveProjectFile = (file: ProjectFile): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([PROJECT_FILES_STORE], 'readwrite');
            const store = tx.objectStore(PROJECT_FILES_STORE);
            const req = store.put(file);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error saving project file');
        });
    });
};

export const saveProjectFiles = (files: ProjectFile[]): Promise<void> => {
    if (files.length === 0) return Promise.resolve();
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([PROJECT_FILES_STORE], 'readwrite');
            const store = tx.objectStore(PROJECT_FILES_STORE);
            let completed = 0;
            files.forEach(file => {
                const req = store.put(file);
                req.onsuccess = () => {
                    completed++;
                    if (completed === files.length) resolve();
                };
                req.onerror = () => reject('Error saving project files');
            });
        });
    });
};

export const deleteProjectFile = (id: string): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([PROJECT_FILES_STORE], 'readwrite');
            const store = tx.objectStore(PROJECT_FILES_STORE);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error deleting project file');
        });
    });
};

// --- Snapshots ---

export const getProjectSnapshots = (projectId: string): Promise<Snapshot[]> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([SNAPSHOTS_STORE], 'readonly');
            const store = tx.objectStore(SNAPSHOTS_STORE);
            const index = store.index('byProject');
            const req = index.getAll(projectId);
            req.onsuccess = () => {
                const snapshots = (req.result as Snapshot[]).sort((a, b) => b.timestamp - a.timestamp);
                resolve(snapshots);
            };
            req.onerror = () => reject('Error getting snapshots');
        });
    });
};

export const saveSnapshot = (snapshot: Snapshot): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([SNAPSHOTS_STORE], 'readwrite');
            const store = tx.objectStore(SNAPSHOTS_STORE);
            const req = store.put(snapshot);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error saving snapshot');
        });
    });
};

export const deleteSnapshot = (id: string): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([SNAPSHOTS_STORE], 'readwrite');
            const store = tx.objectStore(SNAPSHOTS_STORE);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error deleting snapshot');
        });
    });
};
