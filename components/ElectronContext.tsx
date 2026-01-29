'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { iselectron, electronapi, getplatforminfo, checkforupdates, getnativetheme } from '@/utils/platform';

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

interface ElectronContextType {
    iselectron: boolean;
    platforminfo: PlatformInfo | null;
    nativetheme: 'light' | 'dark';
    updateinfo: UpdateInfo;
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

const ElectronContext = createContext<ElectronContextType>({
    iselectron: false,
    platforminfo: defaultplatform,
    nativetheme: 'dark',
    updateinfo: { available: false },
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
    const [iswindowmaximized, setiswindowmaximized] = useState(false);

    useEffect(() => {
        async function init() {
            const info = await getplatforminfo();
            setplatforminfo({
                ...info,
                isweb: !iselectron
            });

            const theme = await getnativetheme();
            setnativetheme(theme);
        }
        init();
    }, []);

    useEffect(() => {
        if (!iselectron || !electronapi) return;

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
            if (action === 'search') {
                window.dispatchEvent(new CustomEvent('nextarde:spotlight'));
            } else if (action === 'app-switcher') {
                window.dispatchEvent(new CustomEvent('nextarde:appswitcher'));
            }
        });

        electronapi.events.onpowerevent((event: string) => {
            window.dispatchEvent(new CustomEvent('nextarde:power', { detail: { event } }));
        });
    }, []);

    const handlecheckforupdates = useCallback(async () => {
        const result = await checkforupdates();
        if (result.available) {
            setupdateinfo(prev => ({ ...prev, available: true }));
        }
    }, []);

    const handleinstallupdates = useCallback(() => {
        if (iselectron && electronapi) {
            electronapi.updates.install();
        }
    }, []);

    const handleminimize = useCallback(() => {
        if (iselectron && electronapi) {
            electronapi.window.minimize();
        }
    }, []);

    const handlemaximize = useCallback(async () => {
        if (iselectron && electronapi) {
            await electronapi.window.maximize();
            const maximized = await electronapi.window.ismaximized();
            setiswindowmaximized(maximized);
        }
    }, []);

    const handleclose = useCallback(() => {
        if (iselectron && electronapi) {
            electronapi.window.close();
        }
    }, []);

    return (
        <ElectronContext.Provider value={{
            iselectron,
            platforminfo,
            nativetheme,
            updateinfo,
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
