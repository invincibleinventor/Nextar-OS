'use client';
import Image from 'next/image';

import { apps, openSystemItem, getfilteredapps } from '../data';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { useFileSystem } from '../FileSystemContext';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect } from 'react';
import { IoSearch } from 'react-icons/io5';
import { useExternalApps } from '../ExternalAppsContext';
import TintedAppIcon from '../ui/TintedAppIcon';
import { iselectron, apps as nativeapps } from '@/utils/platform';

const appsperpage = 35;

interface LinuxApp {
    name: string;
    exec: string;
    icon: string | null;
    path: string;
}

export default function Launchpad({ onclose }: { onclose: () => void }) {
    const { addwindow, removewindow, windows, setactivewindow, updatewindow } = useWindows();
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const { launchApp } = useExternalApps();
    const [searchterm, setsearchterm] = useState('');
    const [page, setpage] = useState(0);
    const [linuxapps, setlinuxapps] = useState<LinuxApp[]>([]);

    useEffect(() => {
        if (iselectron) {
            nativeapps.getinstalled().then((result: any) => {
                if (result.success && result.apps) {
                    setlinuxapps(result.apps);
                }
            }).catch(() => { });
        }
    }, []);

    const handleappclick = (app: any) => {
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
        }, 100);
    };

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

    const filteredapps = allApps.filter(a =>
        a.id !== 'launchpad' &&
        a.appname.toLowerCase().includes(searchterm.toLowerCase())
    );

    const totalpages = Math.ceil(filteredapps.length / appsperpage) || 1;
    const currentapps = filteredapps.slice(page * appsperpage, (page + 1) * appsperpage);

    const paginate = (newdirection: number) => {
        if (page + newdirection >= 0 && page + newdirection < totalpages) {
            setpage(page + newdirection);
        }
    };

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
                className="fixed z-[500] inset-0 m-auto w-[90vw] max-w-[680px] h-[75vh] flex flex-col bg-surface border-2 border-[--border-color] shadow-pastel-active overflow-hidden anime-glow-lg"
                onClick={(e) => e.stopPropagation()}
                onPan={(e, info) => {
                    if (info.offset.x < -50) paginate(1);
                    if (info.offset.x > 50) paginate(-1);
                }}
            >
                <div className="px-4 pt-4 pb-3 border-b border-[--border-color] bg-[--bg-overlay]">
                    <div className="relative">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted] text-sm" />
                        <input
                            autoFocus
                            placeholder="Search Apps"
                            className="w-full bg-overlay border border-[--border-color] pl-9 pr-4 py-2
                                text-[--text-color] placeholder-[--text-muted] text-[13px]
                                outline-none transition-all font-mono"
                            value={searchterm}
                            onChange={e => { setsearchterm(e.target.value); setpage(0); }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={page}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-4 gap-y-6"
                        >
                            {currentapps.map(app => (
                                <motion.div
                                    key={app.id}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex flex-col items-center gap-2 cursor-pointer"
                                    onClick={() => handleappclick(app)}
                                >
                                    <div className="w-14 h-14 md:w-16 md:h-16 relative">
                                        {'isLinuxApp' in app && app.isLinuxApp && app.icon?.startsWith('/') ? (
                                            <img
                                                src={`file://${app.icon}`}
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
                                    <span className="text-[--text-color] text-[11px] font-medium text-center leading-tight truncate max-w-[80px] font-mono">
                                        {app.appname}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {totalpages > 1 && (
                    <div className="flex gap-2 py-3 justify-center border-t border-[--border-color]">
                        {Array.from({ length: totalpages }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 cursor-pointer transition-colors ${i === page ? 'bg-pastel-red' : 'bg-[--border-color]'}`}
                                onClick={(e) => { e.stopPropagation(); setpage(i); }}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </>
    )
}
