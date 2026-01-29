'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { IoSearch, IoRefresh, IoPlayCircle, IoGrid, IoList } from 'react-icons/io5';
import { iselectron, apps as nativeapps } from '@/utils/platform';
import { motion, AnimatePresence } from 'framer-motion';

interface LinuxApp {
    name: string;
    exec: string;
    icon: string | null;
    path: string;
}

interface AppLauncherProps {
    isFocused?: boolean;
}

export default function AppLauncher({ isFocused }: AppLauncherProps) {
    const [installedapps, setinstalledapps] = useState<LinuxApp[]>([]);
    const [loading, setloading] = useState(false);
    const [searchquery, setsearchquery] = useState('');
    const [viewmode, setviewmode] = useState<'grid' | 'list'>('grid');
    const [launching, setlaunching] = useState<string | null>(null);

    const loadapps = useCallback(async () => {
        if (!iselectron) return;

        setloading(true);
        try {
            const result = await nativeapps.getinstalled();
            if (result.success && result.apps) {
                const sorted = result.apps.sort((a: LinuxApp, b: LinuxApp) =>
                    a.name.localeCompare(b.name)
                );
                setinstalledapps(sorted);
            }
        } catch (e) { }
        setloading(false);
    }, []);

    useEffect(() => {
        loadapps();
    }, [loadapps]);

    const launchapp = async (app: LinuxApp) => {
        if (!iselectron) return;

        setlaunching(app.name);
        await nativeapps.launch(app.exec);
        setTimeout(() => setlaunching(null), 1000);
    };

    const filteredapps = searchquery
        ? installedapps.filter(app =>
            app.name.toLowerCase().includes(searchquery.toLowerCase())
        )
        : installedapps;

    if (!iselectron) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-neutral-900 text-white">
                <IoGrid size={64} className="text-neutral-600 mb-4" />
                <p className="text-xl font-medium mb-2">Linux App Launcher</p>
                <p className="text-neutral-500">Only available in Electron mode</p>
                <p className="text-neutral-600 text-sm mt-4">Run with: npm run electron:dev</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
            <div className="h-12 bg-neutral-900 border-b border-neutral-700 flex items-center px-4 shrink-0 gap-3">
                <div className="ml-16 text-sm font-medium">Applications</div>
                <div className="flex-1 flex justify-center">
                    <div className="relative w-full max-w-md">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                        <input
                            type="text"
                            value={searchquery}
                            onChange={(e) => setsearchquery(e.target.value)}
                            placeholder="Search installed apps..."
                            className="w-full bg-neutral-800 rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none placeholder-neutral-500"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadapps}
                        disabled={loading}
                        className="p-1.5 rounded hover:bg-neutral-700"
                    >
                        <IoRefresh size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="flex bg-neutral-800 rounded-lg p-0.5">
                        <button
                            onClick={() => setviewmode('grid')}
                            className={`p-1.5 rounded ${viewmode === 'grid' ? 'bg-neutral-600' : ''}`}
                        >
                            <IoGrid size={14} />
                        </button>
                        <button
                            onClick={() => setviewmode('list')}
                            className={`p-1.5 rounded ${viewmode === 'list' ? 'bg-neutral-600' : ''}`}
                        >
                            <IoList size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {loading && installedapps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <IoRefresh size={32} className="animate-spin text-neutral-500 mb-4" />
                        <p className="text-neutral-500">Loading installed apps...</p>
                    </div>
                ) : filteredapps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                        <IoGrid size={48} className="mb-2 opacity-50" />
                        <p>{searchquery ? 'No apps match your search' : 'No apps found'}</p>
                    </div>
                ) : viewmode === 'grid' ? (
                    <div className="grid grid-cols-6 gap-4">
                        <AnimatePresence>
                            {filteredapps.map((app) => (
                                <motion.button
                                    key={app.path}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => launchapp(app)}
                                    className={`flex flex-col items-center p-4 rounded-xl hover:bg-neutral-800 transition-colors group ${launching === app.name ? 'bg-accent/20' : ''}`}
                                >
                                    <div className="w-16 h-16 rounded-xl bg-neutral-700 flex items-center justify-center mb-2 overflow-hidden group-hover:scale-105 transition-transform">
                                        {app.icon ? (
                                            <img
                                                src={`/usr/share/icons/hicolor/48x48/apps/${app.icon}.png`}
                                                alt={app.name}
                                                className="w-12 h-12 object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                        <span className="text-2xl font-bold text-neutral-400">
                                            {app.name[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-center truncate w-full">
                                        {app.name}
                                    </span>
                                    {launching === app.name && (
                                        <IoPlayCircle className="absolute text-accent animate-pulse" size={24} />
                                    )}
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredapps.map((app) => (
                            <button
                                key={app.path}
                                onClick={() => launchapp(app)}
                                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-left ${launching === app.name ? 'bg-accent/20' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg font-bold text-neutral-400">
                                        {app.name[0]?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{app.name}</div>
                                    <div className="text-xs text-neutral-500 truncate">{app.exec}</div>
                                </div>
                                {launching === app.name && (
                                    <IoPlayCircle className="text-accent animate-pulse" size={20} />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-8 bg-neutral-900 border-t border-neutral-700 flex items-center px-4 text-xs text-neutral-500">
                <span>{filteredapps.length} applications</span>
                <span className="ml-auto">Click to launch • Double-click to run in terminal</span>
            </div>
        </div>
    );
}
