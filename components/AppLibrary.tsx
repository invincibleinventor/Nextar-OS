'use client';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apps, openSystemItem, appdata } from './data';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';
import { useFileSystem } from './FileSystemContext';
import { IoSearch, IoClose } from 'react-icons/io5';
import { LuExternalLink, LuInfo, LuLayoutGrid } from 'react-icons/lu';
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
    const [viewmode, setviewmode] = useState<'all' | 'categories'>('all');
    const [contextmenu, setcontextmenu] = useState<{ x: number; y: number; app: appdata } | null>(null);
    const [expandedcategory, setexpandedcategory] = useState<{ name: string; apps: appdata[] } | null>(null);
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
        return [...apps, ...installedApps].sort((a, b) => a.appname.localeCompare(b.appname));
    }, [files]);

    const categoryGroups = useMemo(() => {
        const map = new Map<string, appdata[]>();
        for (const app of allApps) {
            const cat = app.category || 'Other';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(app);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [allApps]);

    const filteredApps = useMemo(() => {
        if (!searchquery.trim()) return allApps;
        return allApps.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase()));
    }, [allApps, searchquery]);

    const filteredCategories = useMemo(() => {
        if (!searchquery.trim()) return categoryGroups;
        const q = searchquery.toLowerCase();
        return categoryGroups.filter(([cat, catApps]) =>
            cat.toLowerCase().includes(q) || catApps.some(a => a.appname.toLowerCase().includes(q))
        );
    }, [categoryGroups, searchquery]);

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
            { label: 'Open', icon: <LuExternalLink size={14} />, action: () => openapp(app) },
            { separator: true, label: '' },
            {
                label: 'App Info',
                icon: <LuInfo size={14} />,
                action: () => {
                    openSystemItem('settings', { addwindow, windows, setactivewindow, updatewindow, ismobile });
                }
            },
            {
                label: pinned ? 'Already on Home Screen' : 'Add to Home Screen',
                icon: <LuLayoutGrid size={14} />,
                disabled: pinned,
                action: () => { if (!pinned) pinToHomeScreen(app); }
            },
        ];
    };

    const textColor = islightbackground ? 'text-black/80' : 'text-white';
    const textMuted = islightbackground ? 'text-black/50' : 'text-white/50';

    return (
        <div
            className="w-full h-full flex flex-col select-none"
            style={{ background: 'transparent' }}
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

            {/* Tab toggle: All / Categories */}
            <div className="shrink-0 flex justify-center pt-3 pb-2">
                <div
                    className="flex items-center rounded-full p-[3px]"
                    style={clay ? {
                        background: islightbackground ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)',
                        border: islightbackground ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    } : {
                        background: 'var(--bg-overlay)',
                        border: '1px solid var(--border-color)',
                    }}
                >
                    <button
                        onClick={() => setviewmode('all')}
                        className={`px-5 py-1.5 text-[13px] font-semibold transition-all ${clay ? 'rounded-full' : ''}`}
                        style={viewmode === 'all' ? (clay ? {
                            background: islightbackground ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
                            color: islightbackground ? '#1C1C1E' : 'white',
                            borderRadius: '9999px',
                        } : {
                            background: 'var(--text-color)',
                            color: 'var(--bg-surface)',
                        }) : {
                            color: islightbackground ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                        }}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setviewmode('categories')}
                        className={`px-5 py-1.5 text-[13px] font-semibold transition-all ${clay ? 'rounded-full' : ''}`}
                        style={viewmode === 'categories' ? (clay ? {
                            background: islightbackground ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
                            color: islightbackground ? '#1C1C1E' : 'white',
                            borderRadius: '9999px',
                        } : {
                            background: 'var(--text-color)',
                            color: 'var(--bg-surface)',
                        }) : {
                            color: islightbackground ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                        }}
                    >
                        Categories
                    </button>
                </div>
            </div>

            {/* Scrollable content */}
            <div
                className="flex-1 relative overflow-y-auto overflow-x-hidden px-4 pb-20 scrollbar-hide [&::-webkit-scrollbar]:hidden"
                style={{ touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {searchquery.trim() ? (
                        viewmode === 'all' ? (
                            // Search results — flat grid
                            <motion.div
                                key="search-apps"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                {filteredApps.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-x-4 gap-y-5 pt-3 pb-10">
                                        {filteredApps.map(app => (
                                            <AppItem
                                                key={app.id}
                                                app={app}
                                                ismobile={ismobile}
                                                textColor={textColor}
                                                onOpen={openapp}
                                                onLongPress={handlelongpressstart}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setcontextmenu({ x: e.clientX, y: e.clientY, app });
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <p className={`text-[15px] font-medium ${textMuted}`}>No apps found</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            // Search categories
                            <motion.div
                                key="search-categories"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                {filteredCategories.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4 pt-3 pb-10 px-1">
                                        {filteredCategories.map(([category, catApps]) => (
                                            <CategoryCard
                                                key={category}
                                                category={category}
                                                apps={catApps}
                                                clay={clay}
                                                islightbackground={islightbackground}
                                                textColor={textColor}
                                                onOpenApp={openapp}
                                                onLongPress={handlelongpressstart}
                                                onExpand={(name: string, apps: appdata[]) => setexpandedcategory({ name, apps })}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <p className={`text-[15px] font-medium ${textMuted}`}>No categories found</p>
                                    </div>
                                )}
                            </motion.div>
                        )
                    ) : viewmode === 'all' ? (
                        // All apps — flat alphabetical grid
                        <motion.div
                            key="all-apps"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className="grid grid-cols-4 gap-x-4 gap-y-5 pt-3 pb-10">
                                {allApps.map(app => (
                                    <AppItem
                                        key={app.id}
                                        app={app}
                                        ismobile={ismobile}
                                        textColor={textColor}
                                        onOpen={openapp}
                                        onLongPress={handlelongpressstart}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setcontextmenu({ x: e.clientX, y: e.clientY, app });
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        // Categories view — 2-column grid of glass category cards
                        <motion.div
                            key="categories"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className="grid grid-cols-2 gap-4 pt-3 pb-10 px-1">
                                {categoryGroups.map(([category, catApps]) => (
                                    <CategoryCard
                                        key={category}
                                        category={category}
                                        apps={catApps}
                                        clay={clay}
                                        islightbackground={islightbackground}
                                        textColor={textColor}
                                        onOpenApp={openapp}
                                        onLongPress={handlelongpressstart}
                                        onExpand={(name: string, apps: appdata[]) => setexpandedcategory({ name, apps })}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Search bar pinned to bottom */}
            <div className="shrink-0 px-5 pb-8 pt-2">
                <div
                    className={`relative w-full ${clay ? 'rounded-full' : 'rounded-lg bg-overlay border border-[--border-color]'}`}
                    style={clay ? {
                        background: islightbackground
                            ? 'rgba(255,255,255,0.25)'
                            : 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: islightbackground
                            ? '0 2px 16px rgba(0,0,0,0.08)'
                            : '0 2px 16px rgba(0,0,0,0.2)',
                    } : undefined}
                >
                    <IoSearch
                        className={`absolute left-4 top-1/2 -translate-y-1/2 ${islightbackground ? 'text-black/40' : 'text-white/45'}`}
                        size={16}
                    />
                    <input
                        type="text"
                        value={searchquery}
                        onChange={(e) => setsearchquery(e.target.value)}
                        placeholder="Search"
                        className={`w-full pl-10 pr-10 py-3 bg-transparent outline-none ${clay ? `text-[15px] ${islightbackground ? 'text-black/60 placeholder:text-black/25' : 'text-white/90 placeholder:text-white/30'}` : 'text-lg text-[--text-color] placeholder-[--text-muted] h-10'}`}
                    />
                    {searchquery && (
                        <button
                            onClick={() => setsearchquery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full"
                            style={{ background: islightbackground ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)' }}
                        >
                            <IoClose className={islightbackground ? 'text-black/50' : 'text-white/50'} size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Category expanded popup — portaled to body so backdrop-filter works */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {expandedcategory && (
                        <motion.div
                            className="fixed inset-0 flex items-center justify-center"
                            style={{ zIndex: 900 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setexpandedcategory(null)}
                        >
                            <div className="absolute inset-0 bg-black/20" />
                            <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.85, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-[85%] max-w-[340px] max-h-[70vh] rounded-[22px] overflow-hidden"
                                style={clay ? {
                                    background: islightbackground
                                        ? 'rgba(240,240,245,0.55)'
                                        : 'rgba(30,30,35,0.45)',
                                    backdropFilter: 'blur(80px) saturate(1.8)',
                                    WebkitBackdropFilter: 'blur(80px) saturate(1.8)',
                                    border: islightbackground
                                        ? '1px solid rgba(255,255,255,0.5)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
                                } : {
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
                                }}
                            >
                                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                                    <h3 className={`text-[17px] font-bold ${textColor}`}>
                                        {expandedcategory.name}
                                    </h3>
                                    <button
                                        onClick={() => setexpandedcategory(null)}
                                        className="p-1.5 rounded-full"
                                        style={{
                                            background: islightbackground ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                                        }}
                                    >
                                        <IoClose className={islightbackground ? 'text-black/50' : 'text-white/50'} size={16} />
                                    </button>
                                </div>
                                <div className="px-4 pb-5 pt-1 overflow-y-auto max-h-[55vh] grid grid-cols-3 gap-x-5 gap-y-5">
                                    {expandedcategory.apps.map(app => (
                                        <AppItem
                                            key={app.id}
                                            app={app}
                                            ismobile={ismobile}
                                            textColor={textColor}
                                            onOpen={(a) => { openapp(a); setexpandedcategory(null); }}
                                            onLongPress={handlelongpressstart}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setcontextmenu({ x: e.clientX, y: e.clientY, app });
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

// ── App icon item ──
function AppItem({ app, ismobile, textColor, onOpen, onLongPress, onContextMenu }: {
    app: appdata;
    ismobile: boolean;
    textColor: string;
    onOpen: (app: appdata) => void;
    onLongPress: (app: appdata, e: React.TouchEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}) {
    return (
        <div
            onClick={() => onOpen(app)}
            onTouchStart={(e) => onLongPress(app, e)}
            onContextMenu={onContextMenu}
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
        >
            <TintedAppIcon
                appId={app.id}
                appName={app.appname}
                originalIcon={app.icon}
                size={ismobile ? 64 : 56}
                useFill={false}
            />
            <span className={`text-[11px] text-center font-medium leading-tight w-full truncate ${textColor}`}>
                {app.appname}
            </span>
        </div>
    );
}

// ── Category card (glass, 2x2 grid: 3 icons + overflow badge) ──
function CategoryCard({ category, apps: catApps, clay, islightbackground, textColor, onOpenApp, onLongPress, onExpand }: {
    category: string;
    apps: appdata[];
    clay: boolean;
    islightbackground: boolean;
    textColor: string;
    onOpenApp: (app: appdata) => void;
    onLongPress: (app: appdata, e: React.TouchEvent) => void;
    onExpand: (name: string, apps: appdata[]) => void;
}) {
    const hasOverflow = catApps.length > 4;
    const overflowCount = catApps.length - 3;
    // Build exactly 4 slots: if overflow, 3 apps + badge; otherwise up to 4 apps + empty slots
    const slots: ({ type: 'app'; app: appdata } | { type: 'overflow' } | { type: 'empty' })[] = [];
    if (hasOverflow) {
        for (let i = 0; i < 3; i++) slots.push({ type: 'app', app: catApps[i] });
        slots.push({ type: 'overflow' });
    } else {
        for (let i = 0; i < catApps.length; i++) slots.push({ type: 'app', app: catApps[i] });
        while (slots.length < 4) slots.push({ type: 'empty' });
    }

    return (
        <div className="flex flex-col gap-2">
            <div
                className={`rounded-[20px] p-4 aspect-square flex items-center justify-center ${clay ? '' : 'bg-overlay border border-[--border-color]'}`}
                style={clay ? {
                    background: islightbackground
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(255,255,255,0.08)',
                    
                    border: islightbackground
                        ? '1px solid rgba(255,255,255,0.35)'
                        : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: islightbackground
                        ? '0 2px 12px rgba(0,0,0,0.06)'
                        : '0 2px 12px rgba(0,0,0,0.15)',
                } : undefined}
            >
                <div className="grid grid-cols-2 gap-4 place-items-center">
                    {slots.map((slot, i) =>
                        slot.type === 'app' ? (
                            <div
                                key={slot.app.id}
                                onClick={() => onOpenApp(slot.app)}
                                onTouchStart={(e) => onLongPress(slot.app, e)}
                                className="cursor-pointer active:scale-90 transition-transform"
                            >
                                <TintedAppIcon
                                    appId={slot.app.id}
                                    appName={slot.app.appname}
                                    originalIcon={slot.app.icon}
                                    size={64}
                                    useFill={false}
                                />
                            </div>
                        ) : slot.type === 'overflow' ? (
                            <div
                                key="overflow"
                                onClick={() => onExpand(category, catApps)}
                                className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                                style={{
                                    background: islightbackground ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: islightbackground ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)',
                                }}
                            >
                                +{overflowCount}
                            </div>
                        ) : (
                            <div key={`empty-${i}`} className="w-[64px] h-[64px]" />
                        )
                    )}
                </div>
            </div>
            <span className={`text-[13px] font-semibold text-center ${textColor}`}>
                {category}
            </span>
        </div>
    );
}

export default AppLibrary;
