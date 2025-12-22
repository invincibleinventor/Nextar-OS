import { filesystemitem } from '../components/data';

const DB_NAME = 'NextarOSSystem';
const DB_VERSION = 6;
const STORE_NAME = 'files';
const USERS_STORE_NAME = 'users';
const PERMISSIONS_STORE_NAME = 'permissions';

export interface User {
    username: string;
    passwordHash: string;
    name: string;
    avatar?: string;
    bio?: string;
    role: 'admin' | 'user';
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject("IndexedDB not available");
            return;
        }

        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                const error = request.error;
                console.error("IndexedDB error:", error?.message || error?.name || "Unknown error");
                reject("Error opening database");
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (event.oldVersion < 6) {
                    if (event.oldVersion < 5) {
                        if (db.objectStoreNames.contains(STORE_NAME)) {
                            db.deleteObjectStore(STORE_NAME);
                        }
                        if (db.objectStoreNames.contains(USERS_STORE_NAME)) {
                            db.deleteObjectStore(USERS_STORE_NAME);
                        }
                    }
                }

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(USERS_STORE_NAME)) {
                    db.createObjectStore(USERS_STORE_NAME, { keyPath: 'username' });
                }

                if (!db.objectStoreNames.contains(PERMISSIONS_STORE_NAME)) {
                    const store = db.createObjectStore(PERMISSIONS_STORE_NAME, { keyPath: ['appId', 'userId', 'permission'] });
                    store.createIndex('byApp', 'appId');
                    store.createIndex('byUser', 'userId');
                }
            };

            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };
        } catch (e) {
            console.error("IndexedDB initialization error:", e);
            reject("Failed to initialize IndexedDB");
        }
    });
};

export const resetDB = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject("IndexedDB not available");
            return;
        }
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject("Failed to reset database");
        };
    });
};

export const initDB = (): Promise<void> => {
    return openDB().then(() => { }).catch(() => {
        return resetDB().then(() => openDB()).then(() => { });
    });
};

export const getAllFiles = (): Promise<filesystemitem[]> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => resolve(getAllRequest.result as filesystemitem[]);
            getAllRequest.onerror = () => reject("Error getting files");
        });
    });
};

export const saveFile = (file: filesystemitem): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const fileToStore = {
                ...file,
                icon: typeof file.icon === 'string' ? file.icon : undefined
            };

            const putRequest = store.put(fileToStore);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject("Error saving file");
        });
    });
};

export const deleteFile = (id: string): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const deleteRequest = store.delete(id);

            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject("Error deleting file");
        });
    });
};


export const createUser = (user: User): Promise<void> => {
    if (!user.username || user.username.length < 3) {
        return Promise.reject("Username must be at least 3 characters long.");
    }
    if (!/^[a-z0-9_]+$/.test(user.username)) {
        return Promise.reject("Username must contain only lowercase letters, numbers, and underscores.");
    }
    if (user.username === 'guest') {
        return Promise.reject("Cannot create a user named 'guest'.");
    }

    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([USERS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(USERS_STORE_NAME);

            const existingRequest = store.get(user.username);

            existingRequest.onsuccess = () => {
                if (existingRequest.result) {
                    reject("Username already exists.");
                    return;
                }

                const putRequest = store.put(user);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject("Error creating user in DB");
            };

            existingRequest.onerror = () => reject("Error checks for existing user");
        });
    });
};

export const getUser = (username: string): Promise<User | undefined> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([USERS_STORE_NAME], 'readonly');

            const store = transaction.objectStore(USERS_STORE_NAME);
            const getRequest = store.get(username);

            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject("Error getting user");
        });
    });
};

export const getUsers = (): Promise<User[]> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([USERS_STORE_NAME], 'readonly');
            const store = transaction.objectStore(USERS_STORE_NAME);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => resolve(getAllRequest.result as User[]);
            getAllRequest.onerror = () => reject("Error getting users");
        });
    });
};

export const updateUser = (username: string, updates: Partial<User>): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([USERS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(USERS_STORE_NAME);

            const getRequest = store.get(username);

            getRequest.onsuccess = () => {
                const user = getRequest.result;
                if (!user) {
                    reject("User not found");
                    return;
                }

                const { username: _, ...validUpdates } = updates as any;
                const updatedUser = { ...user, ...validUpdates };

                const putRequest = store.put(updatedUser);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject("Error updating user");
            };

            getRequest.onerror = () => reject("Error fetching user for update");
        });
    });
};

export const deleteUser = (username: string): Promise<void> => {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([USERS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(USERS_STORE_NAME);
            const deleteRequest = store.delete(username);

            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject("Error deleting user");
        });
    });
};
