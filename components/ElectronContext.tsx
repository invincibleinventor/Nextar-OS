'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { iselectron, isnative, istauri, electronapi, getplatforminfo, checkforupdates, getnativetheme } from '@/utils/platform';

interface PlatformInfo {
    platform: string;
    islinux: boolean;
    ismac: boolean;
    iswindows: boolean;
    isweb: boolean;
    hostname: string;
    username: string;
    homedir: string;
    arch: string;
    cpus: number;
    totalmem: number;
    freemem: number;
}

interface UpdateInfo {
    available: boolean;
    version?: string;
    downloading?: boolean;
    downloaded?: boolean;
    progress?: number;
}

interface ShellInfo {
    isShellMode: boolean;
    isLowMem: boolean;
    totalMemMB: number;
    disableGPU: boolean;
}

interface ElectronContextType {
    iselectron: boolean;
    istauri: boolean;
    isnative: boolean;
    platforminfo: PlatformInfo | null;
    nativetheme: 'light' | 'dark';
    updateinfo: UpdateInfo;
    shellinfo: ShellInfo;
    checkforupdates: () => Promise<void>;
    installupdates: () => void;
    minimizewindow: () => void;
    maximizewindow: () => void;
    closewindow: () => void;
    iswindowmaximized: boolean;
}

const defaultplatform: PlatformInfo = {
    platform: 'web',
    islinux: false,
    ismac: false,
    iswindows: false,
    isweb: true,
    hostname: 'web',
    username: 'user',
    homedir: '/',
    arch: 'web',
    cpus: 4,
    totalmem: 0,
    freemem: 0
};

const defaultshellinfo: ShellInfo = {
    isShellMode: false,
    isLowMem: false,
    totalMemMB: 0,
    disableGPU: false
};

const ElectronContext = createContext<ElectronContextType>({
    iselectron: false,
    istauri: false,
    isnative: false,
    platforminfo: defaultplatform,
    nativetheme: 'dark',
    updateinfo: { available: false },
    shellinfo: defaultshellinfo,
    checkforupdates: async () => { },
    installupdates: () => { },
    minimizewindow: () => { },
    maximizewindow: () => { },
    closewindow: () => { },
    iswindowmaximized: false
});

export function ElectronProvider({ children }: { children: React.ReactNode }) {
    const [platforminfo, setplatforminfo] = useState<PlatformInfo | null>(null);
    const [nativetheme, setnativetheme] = useState<'light' | 'dark'>('dark');
    const [updateinfo, setupdateinfo] = useState<UpdateInfo>({ available: false });
    const [shellinfo, setshellinfo] = useState<ShellInfo>(defaultshellinfo);
    const [iswindowmaximized, setiswindowmaximized] = useState(false);

    useEffect(() => {
        async function init() {
            const info = await getplatforminfo();
            setplatforminfo({
                ...info,
                isweb: !isnative
            });

            const theme = await getnativetheme();
            setnativetheme(theme);

            if (isnative && electronapi?.shellinfo) {
                try {
                    const si = await electronapi.shellinfo.get();
                    setshellinfo(si);
                } catch { }
                electronapi.shellinfo.oninfo((si: ShellInfo) => setshellinfo(si));
            }
        }
        init();
    }, []);

    useEffect(() => {
        if (!isnative || !electronapi) return;

        electronapi.updates.onavailable((info: any) => {
            setupdateinfo(prev => ({ ...prev, available: true, version: info.version }));
        });

        electronapi.updates.onprogress((progress: any) => {
            setupdateinfo(prev => ({ ...prev, downloading: true, progress: progress.percent }));
        });

        electronapi.updates.ondownloaded(() => {
            setupdateinfo(prev => ({ ...prev, downloading: false, downloaded: true }));
        });

        electronapi.events.onglobalshortcut((action: string) => {
            switch (action) {
                case 'search':
                    window.dispatchEvent(new CustomEvent('nextaros:spotlight'));
                    break;
                case 'app-switcher':
                    window.dispatchEvent(new CustomEvent('nextaros:appswitcher'));
                    break;
                case 'lock':
                    window.dispatchEvent(new CustomEvent('nextaros:lock'));
                    break;
                case 'file-manager':
                    window.dispatchEvent(new CustomEvent('nextaros:open-app', { detail: 'explorer' }));
                    break;
                case 'terminal':
                    window.dispatchEvent(new CustomEvent('nextaros:open-app', { detail: 'terminal' }));
                    break;
                case 'run-dialog':
                    window.dispatchEvent(new CustomEvent('nextaros:run-dialog'));
                    break;
                case 'screenshot':
                    window.dispatchEvent(new CustomEvent('nextaros:screenshot', { detail: 'full' }));
                    break;
                case 'screenshot-window':
                    window.dispatchEvent(new CustomEvent('nextaros:screenshot', { detail: 'window' }));
                    break;
                case 'screenshot-area':
                    window.dispatchEvent(new CustomEvent('nextaros:screenshot', { detail: 'area' }));
                    break;
                case 'system-menu':
                    window.dispatchEvent(new CustomEvent('nextaros:system-menu'));
                    break;
                case 'show-desktop':
                    window.dispatchEvent(new CustomEvent('nextaros:show-desktop'));
                    break;
                case 'notification-center':
                    window.dispatchEvent(new CustomEvent('nextaros:notification-center'));
                    break;
                case 'app-launcher':
                    window.dispatchEvent(new CustomEvent('nextaros:app-launcher'));
                    break;
                case 'settings':
                    window.dispatchEvent(new CustomEvent('nextaros:open-app', { detail: 'settings' }));
                    break;
                case 'workspace-prev':
                    window.dispatchEvent(new CustomEvent('nextaros:workspace', { detail: 'prev' }));
                    break;
                case 'workspace-next':
                    window.dispatchEvent(new CustomEvent('nextaros:workspace', { detail: 'next' }));
                    break;
                case 'workspace-1': case 'workspace-2': case 'workspace-3': case 'workspace-4':
                    window.dispatchEvent(new CustomEvent('nextaros:workspace', { detail: action.split('-')[1] }));
                    break;
                case 'snap-left':
                    window.dispatchEvent(new CustomEvent('nextaros:snap', { detail: 'left' }));
                    break;
                case 'snap-right':
                    window.dispatchEvent(new CustomEvent('nextaros:snap', { detail: 'right' }));
                    break;
                case 'maximize':
                    window.dispatchEvent(new CustomEvent('nextaros:snap', { detail: 'maximize' }));
                    break;
                case 'restore':
                    window.dispatchEvent(new CustomEvent('nextaros:snap', { detail: 'restore' }));
                    break;
            }
        });

        electronapi.events.onpowerevent((event: string) => {
            window.dispatchEvent(new CustomEvent('nextaros:power', { detail: { event } }));
        });
    }, []);

    const handlecheckforupdates = useCallback(async () => {
        const result = await checkforupdates();
        if (result.available) {
            setupdateinfo(prev => ({ ...prev, available: true }));
        }
    }, []);

    const handleinstallupdates = useCallback(() => {
        if (isnative && electronapi) {
            electronapi.updates.install();
        }
    }, []);

    const handleminimize = useCallback(() => {
        if (isnative && electronapi) {
            electronapi.window.minimize();
        }
    }, []);

    const handlemaximize = useCallback(async () => {
        if (isnative && electronapi) {
            await electronapi.window.maximize();
            const maximized = await electronapi.window.ismaximized();
            setiswindowmaximized(maximized);
        }
    }, []);

    const handleclose = useCallback(() => {
        if (isnative && electronapi) {
            electronapi.window.close();
        }
    }, []);

    return (
        <ElectronContext.Provider value={{
            iselectron,
            istauri,
            isnative,
            platforminfo,
            nativetheme,
            updateinfo,
            shellinfo,
            checkforupdates: handlecheckforupdates,
            installupdates: handleinstallupdates,
            minimizewindow: handleminimize,
            maximizewindow: handlemaximize,
            closewindow: handleclose,
            iswindowmaximized
        }}>
            {children}
        </ElectronContext.Provider>
    );
}

export function useElectron() {
    return useContext(ElectronContext);
}
