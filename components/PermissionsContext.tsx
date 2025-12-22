'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Permission, PermissionGrant, AppPermissions } from '../types/permissions';
import { useAuth } from './AuthContext';

const DB_NAME = 'NextarOSSystem';
const PERMISSIONS_STORE = 'permissions';

interface PermissionsContextType {
    checkPermission: (appId: string, permission: Permission) => boolean
    requestPermission: (appId: string, permission: Permission) => Promise<boolean>
    requestAllPermissions: (appId: string, permissions: AppPermissions) => Promise<boolean>
    revokePermission: (appId: string, permission: Permission) => void
    revokeAllPermissions: (appId: string) => void
    getAppPermissions: (appId: string) => PermissionGrant[]
    pendingRequest: { appId: string; permission: Permission; resolve: (granted: boolean) => void } | null
    grantPending: () => void
    denyPending: () => void
    isLoading: boolean
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const openPermissionsDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject('IndexedDB not available');
            return;
        }

        try {
            const request = indexedDB.open(DB_NAME, 6);

            request.onerror = () => {
                reject('Error opening permissions database');
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(PERMISSIONS_STORE)) {
                    const store = db.createObjectStore(PERMISSIONS_STORE, { keyPath: ['appId', 'userId', 'permission'] });
                    store.createIndex('byApp', 'appId');
                    store.createIndex('byUser', 'userId');
                }
            };

            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };
        } catch {
            reject('Failed to initialize permissions database');
        }
    });
};

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [grants, setgrants] = useState<PermissionGrant[]>([]);
    const [pendingRequest, setpendingRequest] = useState<{ appId: string; permission: Permission; resolve: (granted: boolean) => void } | null>(null);
    const [isLoading, setisLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const loadGrants = async () => {
            try {
                const db = await openPermissionsDB();
                const transaction = db.transaction([PERMISSIONS_STORE], 'readonly');
                const store = transaction.objectStore(PERMISSIONS_STORE);
                const request = store.getAll();

                request.onsuccess = () => {
                    setgrants(request.result || []);
                    setisLoading(false);
                };
                request.onerror = () => {
                    setisLoading(false);
                };
            } catch {
                setisLoading(false);
            }
        };
        loadGrants();
    }, []);

    const saveGrant = async (grant: PermissionGrant) => {
        try {
            const db = await openPermissionsDB();
            const transaction = db.transaction([PERMISSIONS_STORE], 'readwrite');
            const store = transaction.objectStore(PERMISSIONS_STORE);
            store.put(grant);
        } catch {
        }
    };

    const deleteGrant = async (appId: string, userId: string, permission: Permission) => {
        try {
            const db = await openPermissionsDB();
            const transaction = db.transaction([PERMISSIONS_STORE], 'readwrite');
            const store = transaction.objectStore(PERMISSIONS_STORE);
            store.delete([appId, userId, permission]);
        } catch {
        }
    };

    const checkPermission = useCallback((appId: string, permission: Permission): boolean => {
        const userId = user?.username || 'guest';

        if (user?.role === 'admin') {
            return true;
        }

        const grant = grants.find(g =>
            g.appId === appId &&
            g.userId === userId &&
            g.permission === permission
        );

        return grant?.granted || false;
    }, [grants, user]);

    const requestPermission = useCallback((appId: string, permission: Permission): Promise<boolean> => {
        return new Promise((resolve) => {
            const userId = user?.username || 'guest';

            if (user?.role === 'admin') {
                resolve(true);
                return;
            }

            const existing = grants.find(g =>
                g.appId === appId &&
                g.userId === userId &&
                g.permission === permission
            );

            if (existing) {
                resolve(existing.granted);
                return;
            }

            setpendingRequest({ appId, permission, resolve });
        });
    }, [grants, user]);

    const requestAllPermissions = useCallback(async (appId: string, permissions: AppPermissions): Promise<boolean> => {
        const allperms: Permission[] = [
            ...(permissions.fs || []),
            ...(permissions.system || []),
            ...(permissions.window || []),
            ...(permissions.user || [])
        ];

        for (const perm of allperms) {
            const granted = await requestPermission(appId, perm);
            if (!granted) return false;
        }

        return true;
    }, [requestPermission]);

    const grantPending = useCallback(() => {
        if (!pendingRequest) return;

        const userId = user?.username || 'guest';
        const grant: PermissionGrant = {
            appId: pendingRequest.appId,
            userId,
            permission: pendingRequest.permission,
            granted: true,
            grantedAt: Date.now()
        };

        setgrants(prev => [...prev.filter(g =>
            !(g.appId === grant.appId && g.userId === grant.userId && g.permission === grant.permission)
        ), grant]);
        saveGrant(grant);
        pendingRequest.resolve(true);
        setpendingRequest(null);
    }, [pendingRequest, user]);

    const denyPending = useCallback(() => {
        if (!pendingRequest) return;

        const userId = user?.username || 'guest';
        const grant: PermissionGrant = {
            appId: pendingRequest.appId,
            userId,
            permission: pendingRequest.permission,
            granted: false,
            grantedAt: Date.now()
        };

        setgrants(prev => [...prev.filter(g =>
            !(g.appId === grant.appId && g.userId === grant.userId && g.permission === grant.permission)
        ), grant]);
        saveGrant(grant);
        pendingRequest.resolve(false);
        setpendingRequest(null);
    }, [pendingRequest, user]);

    const revokePermission = useCallback((appId: string, permission: Permission) => {
        const userId = user?.username || 'guest';
        setgrants(prev => prev.filter(g =>
            !(g.appId === appId && g.userId === userId && g.permission === permission)
        ));
        deleteGrant(appId, userId, permission);
    }, [user]);

    const revokeAllPermissions = useCallback((appId: string) => {
        const userId = user?.username || 'guest';
        const torevoke = grants.filter(g => g.appId === appId && g.userId === userId);
        setgrants(prev => prev.filter(g => !(g.appId === appId && g.userId === userId)));
        torevoke.forEach(g => deleteGrant(g.appId, g.userId, g.permission));
    }, [grants, user]);

    const getAppPermissions = useCallback((appId: string): PermissionGrant[] => {
        const userId = user?.username || 'guest';
        return grants.filter(g => g.appId === appId && g.userId === userId);
    }, [grants, user]);

    return (
        <PermissionsContext.Provider value={{
            checkPermission,
            requestPermission,
            requestAllPermissions,
            revokePermission,
            revokeAllPermissions,
            getAppPermissions,
            pendingRequest,
            grantPending,
            denyPending,
            isLoading
        }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};
