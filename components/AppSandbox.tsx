'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useFileSystem } from './FileSystemContext';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useSettings } from './SettingsContext';
import { usePermissions } from './PermissionsContext';
import { Permission, AppPermissions } from '../types/permissions';

interface SandboxedFileSystemAPI {
    read: (path: string) => Promise<any>
    write: (path: string, content: string) => Promise<void>
    list: (parentId: string) => any[]
    exists: (path: string) => boolean
}

interface SandboxedSystemAPI {
    notify: (title: string, body: string) => void
    getTheme: () => string
    getSettings: () => any
}

interface SandboxedUserAPI {
    getCurrentUser: () => { username: string; name: string; role: string } | null
}

interface SandboxedWindowAPI {
    minimize: () => void
    maximize: () => void
    close: () => void
}

interface AppRuntimeContext {
    fs: SandboxedFileSystemAPI
    system: SandboxedSystemAPI
    user: SandboxedUserAPI
    window: SandboxedWindowAPI
    hasPermission: (permission: Permission) => boolean
    requestPermission: (permission: Permission) => Promise<boolean>
}

const RuntimeContext = createContext<AppRuntimeContext | undefined>(undefined);

interface AppSandboxProps {
    children: React.ReactNode
    appId: string
    permissions: AppPermissions
    onMinimize: () => void
    onMaximize: () => void
    onClose: () => void
}

export const AppSandbox: React.FC<AppSandboxProps> = ({
    children,
    appId,
    permissions,
    onMinimize,
    onMaximize,
    onClose
}) => {
    const { files } = useFileSystem();
    const { user } = useAuth();
    const { addnotification } = useNotifications();
    const settingsctx = useSettings();
    const { checkPermission, requestPermission: reqPerm } = usePermissions();

    const runtimeContext = useMemo<AppRuntimeContext>(() => {
        const hasPermission = (perm: Permission) => checkPermission(appId, perm);

        const sandboxedFs: SandboxedFileSystemAPI = {
            read: async (path: string) => {
                if (!hasPermission('fs.read')) {
                    throw new Error('Permission denied: fs.read');
                }
                const file = files.find(f => f.id === path || f.name === path);
                return file?.content || null;
            },
            write: async (_path: string, _content: string) => {
                if (!hasPermission('fs.write')) {
                    throw new Error('Permission denied: fs.write');
                }
            },
            list: (parentId: string) => {
                if (!hasPermission('fs.read')) {
                    return [];
                }
                return files.filter(f => f.parent === parentId);
            },
            exists: (path: string) => {
                if (!hasPermission('fs.read')) {
                    return false;
                }
                return files.some(f => f.id === path || f.name === path);
            }
        };

        const sandboxedSystem: SandboxedSystemAPI = {
            notify: (title: string, body: string) => {
                if (!hasPermission('system.notifications')) {
                    console.warn('Permission denied: system.notifications');
                    return;
                }
                addnotification({
                    id: `${appId}-${Date.now()}`,
                    appname: appId,
                    title,
                    description: body,
                    time: new Date().toLocaleTimeString(),
                    icon: '/icons/system.png',
                    appid: appId
                });
            },
            getTheme: () => 'dark',
            getSettings: () => {
                if (!hasPermission('system.settings')) {
                    return {};
                }
                return {
                    reducemotion: settingsctx.reducemotion,
                    reducetransparency: settingsctx.reducetransparency,
                    soundeffects: settingsctx.soundeffects,
                    wallpaperurl: settingsctx.wallpaperurl,
                    accentcolor: settingsctx.accentcolor
                };
            }
        };

        const sandboxedUser: SandboxedUserAPI = {
            getCurrentUser: () => {
                if (!hasPermission('user.current')) {
                    return null;
                }
                if (!user) return null;
                return {
                    username: user.username,
                    name: user.name,
                    role: user.role
                };
            }
        };

        const sandboxedWindow: SandboxedWindowAPI = {
            minimize: onMinimize,
            maximize: onMaximize,
            close: onClose
        };

        return {
            fs: sandboxedFs,
            system: sandboxedSystem,
            user: sandboxedUser,
            window: sandboxedWindow,
            hasPermission,
            requestPermission: (perm: Permission) => reqPerm(appId, perm)
        };
    }, [appId, files, user, settingsctx, checkPermission, reqPerm, addnotification, onMinimize, onMaximize, onClose]);

    return (
        <RuntimeContext.Provider value={runtimeContext}>
            {children}
        </RuntimeContext.Provider>
    );
};

export const useAppRuntime = () => {
    const context = useContext(RuntimeContext);
    if (context === undefined) {
        throw new Error('useAppRuntime must be used within an AppSandbox');
    }
    return context;
};

export default AppSandbox;
