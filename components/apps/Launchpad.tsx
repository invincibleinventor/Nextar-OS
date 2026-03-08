'use client';
import Image from 'next/image';

import { apps, openSystemItem, getfilteredapps } from '../data';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { useFileSystem } from '../FileSystemContext';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { IoSearch } from 'react-icons/io5';
import { useExternalApps } from '../ExternalAppsContext';
import TintedAppIcon, { squircleClip } from '../ui/TintedAppIcon';
import { iselectron, apps as nativeapps, icons as nativeicons } from '@/utils/platform';
import { useIsClay } from '../hooks/useIsClay';
import { glassInput, glassPanel } from '../hooks/useClayStyles';
import { useSettings } from '../SettingsContext';

interface LinuxApp {
    name: string;
    exec: string;
    icon: string | null;
    path: string;
}

/* Stagger animation for the app grid icons — lightweight on mobile */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.012,
            delayChildren: 0.04,
        },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.12 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: { opacity: 0, transition: { duration: 0.08 } },
};

/* Pill button animation */
const pillVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 500, damping: 30 },
    },
};

export default function Launchpad({ onclose }: { onclose: () => void }) {
    const { addwindow, removewindow, windows, setactivewindow, updatewindow } = useWindows();
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const { launchApp } = useExternalApps();
    const clay = useIsClay();
    const { islightbackground } = useSettings();
    const [searchterm, setsearchterm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [linuxapps, setlinuxapps] = useState<LinuxApp[]>([]);
    const [iconCache, setIconCache] = useState<Record<string, string>>({});
    const searchRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    /* Escape key to close */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onclose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onclose]);

    /* Auto-focus search on mount */
    useEffect(() => {
        const t = setTimeout(() => searchRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, []);

    /* Fetch native linux apps */
    useEffect(() => {
        if (iselectron) {
            nativeapps.getinstalled().then((result: any) => {
                if (result.success && result.apps) {
                    setlinuxapps(result.apps);
                }
            }).catch(() => { });
        }
    }, []);

    /* Resolve native icon paths */
    useEffect(() => {
        if (!iselectron || linuxapps.length === 0) return;
        const toResolve = linuxapps.filter(a => a.icon && a.icon.startsWith('/') && !iconCache[a.icon]);
        if (toResolve.length === 0) return;
        Promise.all(toResolve.map(async (a) => {
            try {
                const result = await nativeicons.getdata(a.icon!);
                if (result.success && result.dataurl) return { path: a.icon!, dataurl: result.dataurl };
            } catch { }
            return null;
        })).then(results => {
            const newCache: Record<string, string> = {};
            results.forEach(r => { if (r) newCache[r.path] = r.dataurl; });
            if (Object.keys(newCache).length > 0) setIconCache(prev => ({ ...prev, ...newCache }));
        });
    }, [linuxapps]);

    /* Handle app launch */
    const handleappclick = useCallback((app: any) => {
        if (app.id === 'launchpad') return;

        if (app.isLinuxApp) {
            nativeapps.launch(app.exec);
            onclose();
            return;
        }

        if (app.isInstalledApp) {
            launchApp(app.id);
            onclose();
            return;
        }

        setTimeout(() => {
            openSystemItem(app.id, { addwindow, windows, updatewindow, setactivewindow, ismobile });
            onclose();
        }, 80);
    }, [addwindow, windows, updatewindow, setactivewindow, ismobile, launchApp, onclose]);

    /* Build combined app list */
    const allApps = useMemo(() => {
        const platformApps = getfilteredapps(iselectron);

        const installedAppFiles = files.filter(f => f.parent === 'root-apps' && f.name.endsWith('.app'));
        const installedApps = installedAppFiles.map(f => {
            try {
                const data = JSON.parse(f.content || '{}');
                return {
                    id: data.id,
                    appname: data.name,
                    icon: data.icon || '/python.png',
                    isInstalledApp: true,
                    category: data.category
                };
            } catch {
                return null;
            }
        }).filter((a): a is NonNullable<typeof a> => a !== null);

        const linuxAppsFormatted = linuxapps.map(app => ({
            id: `linux-${app.exec.replace(/[^a-zA-Z0-9]/g, '-')}`,
            appname: app.name,
            icon: app.icon || '/appstore.png',
            exec: app.exec,
            isLinuxApp: true,
            category: 'Linux'
        }));

        return [...platformApps, ...installedApps, ...linuxAppsFormatted];
    }, [files, linuxapps]);

    /* Extract categories */
    const categories = useMemo(() => {
        const cats = new Set<string>();
        allApps.forEach(a => {
            if (a.category) cats.add(a.category);
        });
        return ['All', ...Array.from(cats).sort()];
    }, [allApps]);

    /* Filtered apps */
    const filteredapps = useMemo(() => {
        return allApps.filter(a => {
            if (a.id === 'launchpad') return false;
            if (searchterm && !a.appname.toLowerCase().includes(searchterm.toLowerCase())) return false;
            if (activeCategory !== 'All' && a.category !== activeCategory) return false;
            return true;
        });
    }, [allApps, searchterm, activeCategory]);

    /* Click on backdrop to close */
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onclose();
        }
    }, [onclose]);

    // ─── Classic (non-clay) fallback: simple popup style ───
    if (!clay) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[499] bg-[--bg-base]/60"
                    onClick={onclose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed z-[500] inset-0 m-auto w-[90vw] max-w-[680px] h-[75vh] flex flex-col overflow-hidden border-2 border-[--border-color] shadow-pastel-active anime-glow-lg bg-surface"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 pt-4 pb-3 border-b border-[--border-color] bg-overlay">
                        <div className="relative">
                            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted] text-[13px]" />
                            <input
                                ref={searchRef}
                                autoFocus
                                placeholder="Search Apps"
                                className="w-full pl-9 pr-4 py-2 text-[--text-color] placeholder-[--text-muted] text-[13px] outline-none transition-all font-mono bg-overlay border border-[--border-color]"
                                value={searchterm}
                                onChange={e => { setsearchterm(e.target.value); }}
                            />
                        </div>
                        <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => { setActiveCategory(cat); }}
                                    className={`px-2.5 py-1 text-[11px] font-mono shrink-0 transition-colors active:scale-[0.97] ${activeCategory === cat ? 'bg-accent text-white' : 'bg-overlay text-[--text-muted] hover:text-[--text-color]'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-4 gap-y-6">
                            {filteredapps.map(app => (
                                <div
                                    key={app.id}
                                    className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                    onClick={() => handleappclick(app)}
                                >
                                    <div className="w-14 h-14 md:w-16 md:h-16 relative">
                                        {'isLinuxApp' in app && app.isLinuxApp && app.icon?.startsWith('/') ? (
                                            <img
                                                src={iconCache[app.icon] || '/appstore.png'}
                                                alt={app.appname}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).src = '/appstore.png'; }}
                                            />
                                        ) : (
                                            <TintedAppIcon
                                                appId={app.id}
                                                appName={app.appname}
                                                originalIcon={app.icon}
                                                size={64}
                                            />
                                        )}
                                    </div>
                                    <span className="text-[--text-color] text-[12px] font-medium text-center leading-tight truncate max-w-[80px] font-mono">
                                        {app.appname}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </>
        );
    }

    // ─── Clay Mode: Full-screen overlay Start Menu launcher ───
    return (
        <AnimatePresence>
            <motion.div
                ref={overlayRef}
                key="launchpad-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed inset-0 z-[499] flex flex-col items-center overflow-hidden"
                style={{
                    backdropFilter: 'blur(var(--glass-blur-heavy))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                    background: 'color-mix(in srgb, var(--accent-source) 4%, color-mix(in srgb, var(--bg-glass) 28%, transparent))',
                }}
                onClick={handleBackdropClick}
            >
                {/* Inner content wrapper -- stops clicks from reaching backdrop */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center w-full max-w-[860px] h-full px-6 pt-[10vh] pb-[100px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── Search Bar ── */}
                    <div className="w-full max-w-lg mb-6">
                        <div className="relative flex items-center rounded-full overflow-hidden"
                            style={{
                                background: 'var(--bg-glass-active)',
                                boxShadow: 'inset 0 0 0 1px var(--glass-border), var(--shadow-sm)',
                            }}>
                            <IoSearch className={`absolute left-5 text-[18px] z-[1] ${islightbackground ? 'text-black/50' : 'text-white/60'}`} />
                            <input
                                ref={searchRef}
                                autoFocus
                                placeholder="Search apps..."
                                className={`w-full pl-[48px] pr-6 py-3.5 bg-transparent text-[15px] font-sans font-medium outline-none rounded-full transition-all ${islightbackground ? 'text-black/80 placeholder-black/40' : 'text-white placeholder-white/50'}`}
                                value={searchterm}
                                onChange={e => { setsearchterm(e.target.value); }}
                            />
                        </div>
                    </div>

                    {/* ── Category Filter Pills ── */}
                    <motion.div
                        className="flex gap-2 mb-8 overflow-x-auto no-scrollbar max-w-full px-2 pb-1"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } },
                        }}
                    >
                        {categories.map(cat => (
                            <motion.button
                                key={cat}
                                variants={pillVariants}
                                onClick={() => { setActiveCategory(cat); }}
                                className={`px-4 py-2 text-[13px] font-sans font-medium shrink-0 transition-all active:scale-[0.95] rounded-full whitespace-nowrap ${
                                    activeCategory === cat
                                        ? 'text-white'
                                        : islightbackground ? 'text-black/60 hover:text-black/80' : 'text-white/70 hover:text-white'
                                }`}
                                style={
                                    activeCategory === cat
                                        ? {
                                              background: 'var(--accent-gradient)',
                                              boxShadow: 'var(--accent-shadow)',
                                          }
                                        : {
                                              background: 'var(--bg-glass)',
                                              border: '1px solid var(--glass-border)',
                                              boxShadow: 'var(--shadow-xs)',
                                          }
                                }
                            >
                                {cat}
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* ── App Grid ── */}
                    <div className="flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${searchterm}-${activeCategory}`}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className={`grid gap-x-5 gap-y-7 justify-items-center ${
                                    ismobile
                                        ? 'grid-cols-3 sm:grid-cols-4'
                                        : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6'
                                }`}
                            >
                                {filteredapps.map(app => (
                                    <motion.div
                                        key={app.id}
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.93 }}
                                        className="flex flex-col items-center gap-2.5 cursor-pointer group"
                                        onClick={() => handleappclick(app)}
                                    >
                                        {/* Icon container */}
                                        <div
                                            className="w-16 h-16 md:w-[72px] md:h-[72px] relative overflow-visible transition-shadow duration-200 group-hover:shadow-md"
                                            style={squircleClip}
                                        >
                                            {'isLinuxApp' in app && app.isLinuxApp && app.icon?.startsWith('/') ? (
                                                <img
                                                    src={iconCache[app.icon] || '/appstore.png'}
                                                    alt={app.appname}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = '/appstore.png'; }}
                                                />
                                            ) : (
                                                <TintedAppIcon
                                                    appId={app.id}
                                                    appName={app.appname}
                                                    originalIcon={app.icon}
                                                    size={ismobile ? 64 : 72}
                                                />
                                            )}
                                        </div>
                                        {/* App label */}
                                        <span className={`text-[12px] font-sans font-medium text-center leading-tight max-w-[88px] line-clamp-2 ${islightbackground ? 'text-black/80' : 'text-white'}`}>
                                            {app.appname}
                                        </span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {/* Empty state */}
                        {filteredapps.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 gap-3"
                            >
                                <IoSearch className="text-[--text-muted] text-[40px] mb-2" />
                                <span className="text-[--text-color] text-[16px] font-semibold font-sans">No apps found</span>
                                <span className="text-[--text-muted] text-[13px] font-sans text-center max-w-[280px]">
                                    Try a different search term or category
                                </span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
