'use client';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { apps, openSystemItem, appdata } from './data';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';
import { useFileSystem } from './FileSystemContext';
import { IoSearch, IoClose } from 'react-icons/io5';
import { useExternalApps } from './ExternalAppsContext';
import TintedAppIcon from './ui/TintedAppIcon';
import { useSettings } from './SettingsContext';
import ContextMenu from './ui/ContextMenu';
import { useIsClay } from './hooks/useIsClay';

const AppLibrary = () => {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { ismobile } = useDevice();
    const { files, createFile, currentUserDesktopId } = useFileSystem();
    const { launchApp } = useExternalApps();
    const { islightbackground } = useSettings();
    const clay = useIsClay();

    const [searchquery, setsearchquery] = useState('');
    const [selectedcategory, setselectedcategory] = useState<string | null>(null);
    const [contextmenu, setcontextmenu] = useState<{ x: number; y: number; app: appdata } | null>(null);
    const longpresstimer = useRef<NodeJS.Timeout | null>(null);
    const touchstartpos = useRef<{ x: number; y: number } | null>(null);

    const allApps = useMemo(() => {
        const installedAppFiles = files.filter(f => f.parent === 'root-apps' && f.name.endsWith('.app'));
        const installedApps = installedAppFiles.map(f => {
            try {
                const data = JSON.parse(f.content || '{}');
                return {
                    id: data.id,
                    appname: data.name,
                    icon: data.icon || '/python.png',
                    isInstalledApp: true,
                    category: data.category,
                    maximizeable: true,
                    componentname: '',
                    additionaldata: {},
                    multiwindow: true,
                    titlebarblurred: false,
                    pinned: false
                } as appdata;
            } catch {
                return null;
            }
        }).filter((a): a is NonNullable<typeof a> => a !== null);
        return [...apps, ...installedApps];
    }, [files]);

    const allcategories = useMemo(() =>
        Array.from(new Set(allApps.filter(a => a.category).map(a => a.category!))),
    [allApps]);

    const filteredApps = useMemo(() => {
        let result = allApps;
        if (searchquery.trim()) {
            result = result.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase()));
        } else if (selectedcategory) {
            result = result.filter(app => app.category === selectedcategory);
        }
        return result;
    }, [allApps, searchquery, selectedcategory]);

    const openapp = (app: appdata) => {
        if ((app as any).isInstalledApp) {
            launchApp(app.id);
            return;
        }
        openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
    };

    const handlelongpressstart = (app: appdata, e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchstartpos.current = { x: touch.clientX, y: touch.clientY };
        longpresstimer.current = setTimeout(() => {
            if ('vibrate' in navigator) navigator.vibrate(10);
            setcontextmenu({ x: touch.clientX, y: touch.clientY, app });
        }, 500);
    };

    const handlelongpressmove = (e: React.TouchEvent) => {
        if (!touchstartpos.current || !longpresstimer.current) return;
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchstartpos.current.x);
        const dy = Math.abs(touch.clientY - touchstartpos.current.y);
        if (dx > 10 || dy > 10) handlelongpressend();
    };

    const handlelongpressend = () => {
        if (longpresstimer.current) {
            clearTimeout(longpresstimer.current);
            longpresstimer.current = null;
        }
        touchstartpos.current = null;
    };

    const isOnHomeScreen = useCallback((appId: string) => {
        return files.some(f =>
            f.parent === currentUserDesktopId &&
            !f.isTrash &&
            f.mimetype === 'application/x-executable' &&
            (f.id === `desktop-app-${appId}` || f.id.endsWith(`-app-${appId}`))
        );
    }, [files, currentUserDesktopId]);

    const pinToHomeScreen = useCallback(async (app: appdata) => {
        if (isOnHomeScreen(app.id)) return;
        await createFile(app.appname, currentUserDesktopId, '', app.icon);
    }, [createFile, currentUserDesktopId, isOnHomeScreen]);

    const getcontextmenuitems = () => {
        if (!contextmenu) return [];
        const app = contextmenu.app;
        const pinned = isOnHomeScreen(app.id);
        return [
            { label: 'Open', action: () => openapp(app) },
            { separator: true, label: '' },
            {
                label: 'App Info',
                action: () => {
                    openSystemItem('settings', { addwindow, windows, setactivewindow, updatewindow, ismobile });
                }
            },
            {
                label: pinned ? 'Already on Home Screen' : 'Add to Home Screen',
                disabled: pinned,
                action: () => { if (!pinned) pinToHomeScreen(app); }
            },
        ];
    };

    return (
        <div
            className={`w-full h-full flex flex-col select-none ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-surface]'}`}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchMove={handlelongpressmove}
            onTouchEnd={handlelongpressend}
            onTouchCancel={handlelongpressend}
        >
            {contextmenu && (
                <ContextMenu
                    x={contextmenu.x}
                    y={contextmenu.y}
                    items={getcontextmenuitems()}
                    onClose={() => setcontextmenu(null)}
                />
            )}

            {/* Sticky header: title + search + categories */}
            <div className="shrink-0 px-5 pt-8 pb-2">
                <h1 className="text-2xl font-bold text-[--text-color] mb-4">App Library</h1>

                {/* Search bar */}
                <div className="relative w-full mb-3">
                    <div className={`relative w-full flex items-center ${clay ? 'rounded-full py-2.5 px-4 border border-[--glass-border] bg-[--bg-glass-active]' : 'h-10 px-3 bg-overlay border border-[--border-color]'}`}>
                        <IoSearch className="text-[--text-muted]" size={18} />
                        <input
                            type="text"
                            value={searchquery}
                            onChange={(e) => setsearchquery(e.target.value)}
                            placeholder="Search apps..."
                            className={`ml-2 flex-1 bg-transparent text-[--text-color] outline-none ${clay ? 'text-[15px] placeholder:text-[--text-muted]' : 'text-lg placeholder-[--text-muted]'}`}
                        />
                        {searchquery && (
                            <button onClick={() => setsearchquery('')} className="p-1">
                                <IoClose className="text-[--text-muted]" size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Horizontal category chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                    <button
                        onClick={() => setselectedcategory(null)}
                        className={`shrink-0 px-4 py-1.5 text-[13px] font-semibold transition-all active:scale-95 ${clay ? 'rounded-full' : ''}`}
                        style={clay ? (
                            !selectedcategory
                                ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)', color: 'white' }
                                : { background: 'var(--bg-glass-active)', color: 'var(--text-color)', border: '1px solid var(--glass-border)' }
                        ) : (
                            !selectedcategory
                                ? { background: 'var(--text-color)', color: 'var(--bg-surface)' }
                                : { background: 'var(--bg-overlay)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }
                        )}
                    >
                        All
                    </button>
                    {allcategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setselectedcategory(selectedcategory === cat ? null : cat)}
                            className={`shrink-0 px-4 py-1.5 text-[13px] font-semibold transition-all active:scale-95 ${clay ? 'rounded-full' : ''}`}
                            style={clay ? (
                                selectedcategory === cat
                                    ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)', color: 'white' }
                                    : { background: 'var(--bg-glass-active)', color: 'var(--text-color)', border: '1px solid var(--glass-border)' }
                            ) : (
                                selectedcategory === cat
                                    ? { background: 'var(--text-color)', color: 'var(--bg-surface)' }
                                    : { background: 'var(--bg-overlay)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable app grid */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-32 scrollbar-hide [&::-webkit-scrollbar]:hidden"
                style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {filteredApps.length > 0 ? (
                    <div className="grid grid-cols-4 gap-x-5 gap-y-6 pt-3 pb-10">
                        {filteredApps.map(app => (
                            <div
                                key={app.id}
                                onClick={() => openapp(app)}
                                onTouchStart={(e) => handlelongpressstart(app, e)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setcontextmenu({ x: e.clientX, y: e.clientY, app });
                                }}
                                className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform"
                            >
                                <TintedAppIcon
                                    appId={app.id}
                                    appName={app.appname}
                                    originalIcon={app.icon}
                                    size={ismobile ? 52 : 56}
                                    useFill={false}
                                />
                                <span
                                    className="text-[11px] text-center font-medium leading-tight w-full truncate"
                                    style={{ color: 'var(--text-color)' }}
                                >
                                    {app.appname}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-2xl mb-2" style={{ color: 'var(--text-muted)' }}>No apps found</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppLibrary;
