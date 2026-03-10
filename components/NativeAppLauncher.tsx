'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSearch } from 'react-icons/io5';
import { HiOutlineCube } from 'react-icons/hi2';
import { useIsClay } from '@/components/hooks/useIsClay';
import { useSettings } from '@/components/SettingsContext';
import { getfilteredapps } from '@/components/data';
import { iselectron, isnative, apps as nativeapps, icons as nativeicons } from '@/utils/platform';

interface LinuxApp {
    name: string;
    exec: string;
    icon: string | null;
    category?: string;
    path: string;
}

interface NativeAppLauncherProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORY_ORDER = [
    'All', 'Development', 'Internet', 'Office', 'Graphics',
    'Multimedia', 'System', 'Utilities', 'Education', 'Games', 'Other',
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.012, delayChildren: 0.04 },
    },
    exit: { opacity: 0, transition: { duration: 0.12 } },
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

const pillVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 500, damping: 30 },
    },
};

export default function NativeAppLauncher({ isOpen, onClose }: NativeAppLauncherProps) {
    const clay = useIsClay();
    const { islightbackground } = useSettings();
    const [searchterm, setsearchterm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [linuxapps, setlinuxapps] = useState<LinuxApp[]>([]);
    const [iconCache, setIconCache] = useState<Record<string, string>>({});
    const searchRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setsearchterm('');
            setActiveCategory('All');
            const t = setTimeout(() => searchRef.current?.focus(), 100);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Fetch native Linux apps
    useEffect(() => {
        if (isnative) {
            nativeapps.getinstalled().then((result: any) => {
                if (result.success && result.apps) {
                    setlinuxapps(result.apps);
                }
            }).catch(() => {});
        }
    }, []);

    // Resolve native icon paths to data URLs
    useEffect(() => {
        if (!isnative || linuxapps.length === 0) return;
        const toResolve = linuxapps.filter(a => a.icon && a.icon.startsWith('/') && !iconCache[a.icon]);
        if (toResolve.length === 0) return;
        Promise.all(toResolve.map(async (a) => {
            try {
                const result = await nativeicons.getdata(a.icon!);
                if (result.success && result.dataurl) return { path: a.icon!, dataurl: result.dataurl };
            } catch {}
            return null;
        })).then(results => {
            const newCache: Record<string, string> = {};
            results.forEach(r => { if (r) newCache[r.path] = r.dataurl; });
            if (Object.keys(newCache).length > 0) setIconCache(prev => ({ ...prev, ...newCache }));
        });
    }, [linuxapps]);

    // Build the app list — native Linux apps or web app fallback
    const allApps = useMemo(() => {
        if (isnative && linuxapps.length > 0) {
            return linuxapps.map(app => ({
                id: `linux-${app.exec.replace(/[^a-zA-Z0-9]/g, '-')}`,
                name: app.name,
                icon: app.icon,
                exec: app.exec,
                category: app.category || 'Other',
                isLinux: true,
            }));
        }
        // Fallback: web apps from data.tsx
        return getfilteredapps(iselectron).map(app => ({
            id: app.id,
            name: app.appname,
            icon: app.icon,
            exec: '',
            category: app.category || 'Other',
            isLinux: false,
        }));
    }, [linuxapps]);

    // Categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        allApps.forEach(a => { if (a.category) cats.add(a.category); });
        const sorted = CATEGORY_ORDER.filter(c => c === 'All' || cats.has(c));
        cats.forEach(c => { if (!sorted.includes(c)) sorted.push(c); });
        return sorted;
    }, [allApps]);

    // Filter
    const filteredApps = useMemo(() => {
        return allApps.filter(a => {
            const q = searchterm.toLowerCase();
            if (q && !a.name.toLowerCase().includes(q)) return false;
            if (activeCategory !== 'All' && a.category !== activeCategory) return false;
            return true;
        });
    }, [allApps, searchterm, activeCategory]);

    // Group by category
    const grouped = useMemo(() => {
        if (activeCategory !== 'All' || searchterm) return null;
        const map = new Map<string, typeof filteredApps>();
        filteredApps.forEach(app => {
            const cat = app.category || 'Other';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(app);
        });
        return map;
    }, [filteredApps, activeCategory, searchterm]);

    // Launch handler
    const handleLaunch = useCallback((app: typeof allApps[0]) => {
        if (app.isLinux && app.exec) {
            nativeapps.launch(app.exec);
        }
        onClose();
    }, [onClose]);

    // Backdrop click
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    }, [onClose]);

    if (!isOpen) return null;

    const textColor = islightbackground ? 'text-black/80' : 'text-white';
    const textMuted = islightbackground ? 'text-black/50' : 'text-white/60';
    const textSub = islightbackground ? 'text-black/60' : 'text-white/70';

    // Render an app icon
    const renderIcon = (app: typeof allApps[0]) => {
        if (app.isLinux && app.icon?.startsWith('/')) {
            return (
                <img
                    src={iconCache[app.icon] || '/appstore.png'}
                    alt={app.name}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/appstore.png'; }}
                />
            );
        }
        if (app.icon && !app.icon.startsWith('/')) {
            // Icon name without path — try as public asset
            return (
                <img
                    src={app.icon.startsWith('http') ? app.icon : `/${app.icon}`}
                    alt={app.name}
                    className="w-full h-full object-contain rounded-2xl"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/appstore.png'; }}
                />
            );
        }
        // Fallback generic icon
        return (
            <div className={`w-full h-full flex items-center justify-center rounded-2xl ${islightbackground ? 'bg-black/5' : 'bg-white/10'}`}>
                <HiOutlineCube className={`text-2xl ${textMuted}`} />
            </div>
        );
    };

    // Render the app grid (flat list)
    const renderGrid = (apps: typeof allApps) => (
        <motion.div
            key={`${searchterm}-${activeCategory}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-5 gap-y-7 justify-items-center"
        >
            {apps.map(app => (
                <motion.div
                    key={app.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    className="flex flex-col items-center gap-2.5 cursor-pointer group"
                    onClick={() => handleLaunch(app)}
                >
                    <div className="w-14 h-14 md:w-16 md:h-16 relative overflow-hidden rounded-2xl transition-shadow duration-200 group-hover:shadow-md">
                        {renderIcon(app)}
                    </div>
                    <span className={`text-[12px] font-sans font-medium text-center leading-tight max-w-[88px] line-clamp-2 ${textColor}`}>
                        {app.name}
                    </span>
                </motion.div>
            ))}
        </motion.div>
    );

    // -- Clay mode: full-screen glass overlay --
    if (clay) {
        return (
            <AnimatePresence>
                <motion.div
                    ref={overlayRef}
                    key="native-launcher-overlay"
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
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col items-center w-full max-w-[900px] h-full px-6 pt-[8vh] pb-[100px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search */}
                        <div className="w-full max-w-lg mb-6">
                            <div
                                className="relative flex items-center rounded-full overflow-hidden"
                                style={{
                                    background: 'var(--bg-glass-active)',
                                    boxShadow: 'inset 0 0 0 1px var(--glass-border), var(--shadow-sm)',
                                }}
                            >
                                <IoSearch className={`absolute left-5 text-[18px] z-[1] ${textMuted}`} />
                                <input
                                    ref={searchRef}
                                    autoFocus
                                    placeholder="Search apps..."
                                    className={`w-full pl-[48px] pr-6 py-3.5 bg-transparent text-[15px] font-sans font-medium outline-none rounded-full transition-all ${textColor} ${islightbackground ? 'placeholder-black/40' : 'placeholder-white/50'}`}
                                    value={searchterm}
                                    onChange={e => setsearchterm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Category pills */}
                        <motion.div
                            className="flex gap-2 mb-8 overflow-x-auto no-scrollbar max-w-full px-2 pb-1"
                            initial="hidden"
                            animate="visible"
                            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } } }}
                        >
                            {categories.map(cat => (
                                <motion.button
                                    key={cat}
                                    variants={pillVariants}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 text-[13px] font-sans font-medium shrink-0 transition-all active:scale-[0.95] rounded-full whitespace-nowrap ${
                                        activeCategory === cat
                                            ? 'text-white'
                                            : `${textSub} hover:${textColor}`
                                    }`}
                                    style={
                                        activeCategory === cat
                                            ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
                                            : { background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-xs)' }
                                    }
                                >
                                    {cat}
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* App grid */}
                        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                            <AnimatePresence mode="wait">
                                {grouped ? (
                                    <div className="space-y-8">
                                        {Array.from(grouped.entries()).map(([cat, apps]) => (
                                            <div key={cat}>
                                                <h3 className={`text-[13px] font-sans font-semibold mb-4 ${textSub}`}>{cat}</h3>
                                                {renderGrid(apps)}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    renderGrid(filteredApps)
                                )}
                            </AnimatePresence>

                            {filteredApps.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 gap-3"
                                >
                                    <IoSearch className={`text-[40px] mb-2 ${textMuted}`} />
                                    <span className={`text-[16px] font-semibold font-sans ${textColor}`}>No apps found</span>
                                    <span className={`text-[13px] font-sans text-center max-w-[280px] ${textMuted}`}>
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

    // -- Classic mode: popup overlay --
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[499] bg-[--bg-base]/60"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed z-[500] inset-0 m-auto w-[90vw] max-w-[720px] h-[78vh] flex flex-col overflow-hidden border-2 border-[--border-color] shadow-pastel-active anime-glow-lg bg-surface"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-[--border-color] bg-overlay">
                    <div className="relative">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted] text-[13px]" />
                        <input
                            ref={searchRef}
                            autoFocus
                            placeholder="Search Apps"
                            className="w-full pl-9 pr-4 py-2 text-[--text-color] placeholder-[--text-muted] text-[13px] outline-none transition-all font-mono bg-overlay border border-[--border-color]"
                            value={searchterm}
                            onChange={e => setsearchterm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-2.5 py-1 text-[11px] font-mono shrink-0 transition-colors active:scale-[0.97] ${
                                    activeCategory === cat
                                        ? 'bg-accent text-white'
                                        : 'bg-overlay text-[--text-muted] hover:text-[--text-color]'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                    {grouped ? (
                        <div className="space-y-6">
                            {Array.from(grouped.entries()).map(([cat, apps]) => (
                                <div key={cat}>
                                    <h3 className="text-[12px] font-mono font-semibold text-[--text-muted] mb-3">{cat}</h3>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-4 gap-y-6">
                                        {apps.map(app => (
                                            <div
                                                key={app.id}
                                                className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                                onClick={() => handleLaunch(app)}
                                            >
                                                <div className="w-14 h-14 md:w-16 md:h-16 relative overflow-hidden rounded-xl">
                                                    {renderIcon(app)}
                                                </div>
                                                <span className="text-[--text-color] text-[12px] font-medium text-center leading-tight truncate max-w-[80px] font-mono">
                                                    {app.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-4 gap-y-6">
                            {filteredApps.map(app => (
                                <div
                                    key={app.id}
                                    className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                    onClick={() => handleLaunch(app)}
                                >
                                    <div className="w-14 h-14 md:w-16 md:h-16 relative overflow-hidden rounded-xl">
                                        {renderIcon(app)}
                                    </div>
                                    <span className="text-[--text-color] text-[12px] font-medium text-center leading-tight truncate max-w-[80px] font-mono">
                                        {app.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredApps.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <IoSearch className="text-[--text-muted] text-[32px] mb-1" />
                            <span className="text-[--text-color] text-[14px] font-semibold font-mono">No apps found</span>
                            <span className="text-[--text-muted] text-[12px] font-mono">Try a different search term</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}
