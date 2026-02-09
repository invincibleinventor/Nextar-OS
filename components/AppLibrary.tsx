'use client';
import React, { useState, useMemo } from 'react';
import { apps, openSystemItem, appdata } from './data';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';
import { useFileSystem } from './FileSystemContext';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSearch, IoClose } from 'react-icons/io5';
import { useExternalApps } from './ExternalAppsContext';
import TintedAppIcon from './ui/TintedAppIcon';
import { useSettings } from './SettingsContext';

const AppLibrary = () => {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const { launchApp } = useExternalApps();
    const { islightbackground } = useSettings();

    const [openfolder, setopenfolder] = useState<string | null>(null);
    const [searchquery, setsearchquery] = useState('');

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

    const allcategories = Array.from(new Set(allApps.filter(a => a.category).map(a => a.category!)));

    const getcategoryapps = (category: string) => {
        return allApps.filter(app => app.category === category);
    };

    const openapp = (app: appdata) => {
        setopenfolder(null);
        if ((app as any).isInstalledApp) {
            launchApp(app.id);
            return;
        }
        openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
    };

    return (
        <div
            className="w-full h-full overflow-y-auto overflow-x-hidden pt-8 px-5 pb-32 scrollbar-hide select-none [&::-webkit-scrollbar]:hidden bg-[--bg-surface]"
            style={{ touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            <h1 className="text-2xl font-bold text-[--text-color] mb-4">App Library</h1>
            <div className="relative w-full text-center mb-6">
                <div className="relative w-full mx-auto bg-overlay border border-[--border-color] h-10 flex items-center px-3">
                    <IoSearch className="text-[--text-muted]" size={20} />
                    <input
                        type="text"
                        value={searchquery}
                        onChange={(e) => setsearchquery(e.target.value)}
                        placeholder="Search apps..."
                        className="ml-2 flex-1 bg-transparent text-[--text-color] text-lg outline-none placeholder-[--text-muted]"
                    />
                    {searchquery && (
                        <button onClick={() => setsearchquery('')} className="p-1">
                            <IoClose className="text-[--text-muted]" size={18} />
                        </button>
                    )}
                </div>
            </div>

            {searchquery.trim() ? (
                <div className="space-y-2 pb-10 min-h-[50vh]" onClick={(e) => { if (e.target === e.currentTarget) setsearchquery(''); }}>
                    {allApps
                        .filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase()))
                        .map(app => (
                            <div
                                key={app.id}
                                onClick={() => openapp(app)}
                                className="flex items-center gap-4 p-3 bg-overlay border border-[--border-color] cursor-pointer active:scale-[0.98] transition-transform"
                            >
                                <div className="w-12 h-12 shrink-0 shadow-md">
                                    <TintedAppIcon
                                        appId={app.id}
                                        appName={app.appname}
                                        originalIcon={app.icon}
                                        size={48}
                                        useFill={false}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-semibold text-base truncate ${islightbackground ? 'text-black' : 'text-[--text-color]'}`}>{app.appname}</div>
                                    <div className="text-[--text-muted] text-sm">{app.category || 'App'}</div>
                                </div>
                            </div>
                        ))}
                    {allApps.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase())).length === 0 && (
                        <div className="text-center text-[--text-muted] py-10">
                            <div className="text-2xl mb-2">🔍</div>
                            <div>No apps found</div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 3xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 w-full mx-auto pb-10">
                    {allcategories.map((category) => {
                        const categoryapps = getcategoryapps(category);
                        if (categoryapps.length === 0) return null;

                        const hasoverflow = categoryapps.length > 4;
                        const displayapps = hasoverflow ? categoryapps.slice(0, 3) : categoryapps.slice(0, 4);
                        const overflowcount = categoryapps.length - 3;

                        return (
                            <div key={category} className="flex flex-col gap-2 relative">
                                <div
                                    className={`bg-white/10 dark:bg-white/10 p-4 w-auto aspect-square shrink-0 h-auto shadow-md ${hasoverflow ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                                    style={{ aspectRatio: '1/1' }}
                                    onClick={() => hasoverflow && setopenfolder(category)}
                                >
                                    <div className="grid grid-cols-2 grid-rows-2 gap-3 w-auto h-auto">
                                        {displayapps.map((app) => (
                                            <div
                                                key={app.id}
                                                onClick={(e) => {
                                                    if (!hasoverflow) {
                                                        e.stopPropagation();
                                                        openapp(app);
                                                    }
                                                }}
                                                className={`relative w-full h-full flex items-center justify-center ${!hasoverflow ? 'cursor-pointer active:scale-90' : ''} transition-transform`}
                                            >
                                                <div className="shadow-md">
                                                    <TintedAppIcon
                                                        appId={app.id}
                                                        appName={app.appname}
                                                        originalIcon={app.icon}
                                                        size={64}
                                                        useFill={false}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {hasoverflow && (
                                            <div className="relative w-full h-full flex items-center justify-center bg-white/10 dark:bg-white/5">
                                                <span
                                                    className="font-bold text-lg text-[--text-color]"
                                                >+{overflowcount}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className="text-center mt-1 text-[13px] font-semibold leading-none px-1 truncate text-[--text-muted]"
                                >
                                    {category}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {openfolder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[--bg-base]/80"
                        onClick={() => setopenfolder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-surface border border-[--border-color] shadow-pastel-lg p-6 w-[90%] max-w-sm max-h-[70vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-[--text-color]">{openfolder}</h2>
                                <button
                                    onClick={() => setopenfolder(null)}
                                    className="p-2 bg-overlay active:scale-90 transition-transform"
                                >
                                    <IoClose size={20} className="text-[--text-color]" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {getcategoryapps(openfolder).map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => openapp(app)}
                                        className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform"
                                    >
                                        <div className="w-16 h-16 shadow-md">
                                            <TintedAppIcon
                                                appId={app.id}
                                                appName={app.appname}
                                                originalIcon={app.icon}
                                                size={64}
                                                useFill={false}
                                            />
                                        </div>
                                        <span className="text-[11px] text-center text-[--text-color] font-semibold truncate w-full">
                                            {app.appname}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppLibrary;
