'use client';
import Image from 'next/image';

import { apps, openSystemItem } from '../data';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { useFileSystem } from '../FileSystemContext';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import { IoSearch } from 'react-icons/io5';
import { useExternalApps } from '../ExternalAppsContext';
import TintedAppIcon from '../ui/TintedAppIcon';

const appsperpage = 35;

export default function Launchpad({ onclose }: { onclose: () => void }) {
    const { addwindow, removewindow, windows, setactivewindow, updatewindow } = useWindows();
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const { launchApp } = useExternalApps();
    const [searchterm, setsearchterm] = useState('');
    const [page, setpage] = useState(0);

    const handleappclick = (app: any) => {
        if (app.id === 'launchpad') return;

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
        return [...apps, ...installedApps];
    }, [files]);

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
        <motion.div
            initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex flex-col items-center pt-20 pb-12
                bg-black/40 backdrop-blur-3xl overflow-hidden"
            onClick={() => {
                onclose();
            }}
            onPan={(e, info) => {
                if (info.offset.x < -50) paginate(1);
                if (info.offset.x > 50) paginate(-1);
            }}
        >
            <div
                className="w-full max-w-md px-8 mb-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg" />
                    <input
                        autoFocus
                        placeholder="Search Apps"
                        className="w-full bg-white/10 border border-white/10 rounded-lg  pr-4 py-2 
                            text-white placeholder-white/50 text-[15px] text-center
                            outline-none focus:bg-white/15 focus:border-white/20 transition-all"
                        value={searchterm}
                        onChange={e => { setsearchterm(e.target.value); setpage(0); }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>

            <div
                className="flex-1 w-full max-w-[1100px] px-8 sm:px-16 flex items-center justify-center"
                onClick={(e) => {
                }}
            >
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={page}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-x-6 gap-y-10 w-full"
                    >
                        {currentapps.map(app => (
                            <motion.div
                                key={app.id}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex flex-col items-center gap-3 cursor-pointer"
                                onClick={() => handleappclick(app)}
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 relative">
                                    <TintedAppIcon
                                        appId={app.id}
                                        appName={app.appname}
                                        originalIcon={app.icon}
                                        size={96}
                                    />
                                </div>
                                <span className="text-white text-[13px] font-medium text-center leading-tight drop-shadow-md truncate max-w-[90px]">
                                    {app.appname}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            {totalpages > 1 && (
                <div className="flex gap-2 pt-8">
                    {Array.from({ length: totalpages }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === page ? 'bg-white' : 'bg-white/30'}`}
                            onClick={(e) => { e.stopPropagation(); setpage(i); }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    )
}
